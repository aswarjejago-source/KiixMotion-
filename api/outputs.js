// File: api/outputs.js
// Backend Proxy Status & Auto Reset Pool

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ code: 405, msg: 'Metode harus POST!' });

  const { taskId, poolId } = req.body;
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

    // Otomatis kembalikan status pool ke 'idle' dari server kalau render selesai atau gagal
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
