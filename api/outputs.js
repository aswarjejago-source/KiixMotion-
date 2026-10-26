// File: api/outputs.js
// Backend Proxy Status & Auto Reset Pool (RunningHub + PiAPI Kling)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ code: 405, msg: 'Metode harus POST!' });

  const { taskId, poolId, provider } = req.body;

  // =========================================================
  // JALUR 1: CEK STATUS KLING 2.6 (PiAPI)
  // =========================================================
  if (provider === 'kling') {
    if (!taskId) {
      return res.status(400).json({ code: 400, msg: "Data taskId Kling kurang!" });
    }

    // API Key PiAPI Baru
    const PIAPI_KEY = process.env.PIAPI_KEY || "b6d3705e08d8e2330e60639119bd04bc304be592eebda976ec2551f82ea072da";

    try {
      const piapiRes = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
        method: 'GET',
        headers: {
          'x-api-key': PIAPI_KEY
        },
        cache: 'no-store'
      });

      const piapiJson = await piapiRes.json();
      const taskData = piapiJson.data || {};
      const statusTeks = (taskData.status || piapiJson.status || "").toString().toUpperCase().trim();

      // Ambil link video dari output PiAPI
      let videoUrl = null;
      const out = taskData.output;
      if (out) {
        if (typeof out === 'string' && out.startsWith('http')) {
          videoUrl = out;
        } else if (out.video_url) {
          videoUrl = out.video_url;
        } else if (out.url) {
          videoUrl = out.url;
        } else if (out.works && Array.isArray(out.works) && out.works[0]?.video?.resource) {
          videoUrl = out.works[0].video.resource;
        } else if (out.videos && Array.isArray(out.videos) && out.videos[0]?.url) {
          videoUrl = out.videos[0].url;
        } else {
          // Cari regex format mp4 otomatis
          const match = JSON.stringify(out).match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
          if (match) videoUrl = match[0].replace(/\\/g, '');
        }
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.status(200).json({
        code: 200,
        status: statusTeks,
        data: {
          status: statusTeks,
          video_url: videoUrl,
          url: videoUrl
        }
      });
    } catch (err) {
      return res.status(500).json({ code: 500, status: "FAILED", msg: err.message });
    }
  }

  // =========================================================
  // JALUR 2: CEK STATUS RUNNINGHUB PRO / KIIX POOL
  // =========================================================
  let apiKey = req.headers['authorization']?.replace('Bearer ', '') || req.body.apiKey;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey && poolId && SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
    try {
      const poolRes = await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolId}&select=api_key`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        }
      });
      const poolData = await poolRes.json();
      if (poolData && poolData.length > 0 && poolData[0].api_key) {
        apiKey = poolData[0].api_key;
      }
    } catch (e) {}
  }

  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 400, msg: "Data taskId atau otorisasi kurang!" });
  }

  try {
    const response = await fetch(`https://www.runninghub.ai/task/openapi/outputs`, {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskId, apiKey }),
      cache: 'no-store'
    });

    const data = await response.json();

    const textResp = JSON.stringify(data).toUpperCase();
    const isDone = textResp.includes('.MP4') || textResp.includes('FAILED') || textResp.includes('ERROR') || data.code === 807;

    if (isDone && poolId && SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
      fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        },
        body: JSON.stringify({ status: 'idle' })
      }).catch(() => {});
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 500, status: "FAILED", msg: err.message });
  }
}
