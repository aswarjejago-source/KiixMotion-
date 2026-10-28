// File: api/outputs.js - Dual Engine Separated Handler (Anti-801 Fix)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { taskId, apiKey, poolId, provider } = req.body;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'Task ID wajib disertakan.' });
  }

  // =========================================================
  // JALUR 1: KLING 2.6 MOTION CONTROL (PiAPI)
  // =========================================================
  if (provider === 'kling' || String(taskId).includes('-')) {
    try {
      const PIAPI_KEY = process.env.PIAPI_KEY || "b6d3705e08d8e2330e60639119bd04bc304be592eebda976ec2551f82ea072da";
      const piRes = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
        headers: { 'X-API-KEY': PIAPI_KEY }
      });
      const piJson = await piRes.json();
      return res.status(200).json({ success: true, data: piJson.data || piJson });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // =========================================================
  // AMBIL API KEY RUNNINGHUB
  // =========================================================
  let effectiveApiKey = apiKey;
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                  process.env.SUPABASE_ANON_KEY || 
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!effectiveApiKey && supaUrl && supaKey) {
    try {
      const queryUrl = poolId 
        ? `${supaUrl}/rest/v1/runninghub_pool?id=eq.${poolId}&select=api_key`
        : `${supaUrl}/rest/v1/runninghub_pool?select=api_key&limit=1`;

      const dbRes = await fetch(queryUrl, {
        headers: {
          'apikey': supaKey,
          'Authorization': `Bearer ${supaKey}`
        }
      });
      const dbData = await dbRes.json();
      if (Array.isArray(dbData) && dbData[0]?.api_key) {
        effectiveApiKey = dbData[0].api_key;
      }
    } catch (e) {}
  }

  if (!effectiveApiKey) {
    effectiveApiKey = process.env.RUNNINGHUB_API_KEY;
  }

  if (!effectiveApiKey) {
    return res.status(400).json({ 
      success: false, 
      message: 'API Key RunningHub tidak ditemukan di server.' 
    });
  }

  const cleanTaskId = String(taskId).trim();
  const isMiniMax = (provider === 'minimax');

  // =========================================================
  // JALUR 2: KHUSUS MINIMAX H3 (OPENAPI V2 AI-APP)
  // =========================================================
  if (isMiniMax) {
    try {
      const v2Res = await fetch('https://www.runninghub.ai/openapi/v2/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({ taskId: cleanTaskId })
      });

      const v2Json = await v2Res.json();
      const v2Data = v2Json?.data || v2Json;
      const statusV2 = (v2Data?.status || v2Json?.status || "").toString().toUpperCase().trim();

      // Teruskan jika status valid atau respon sukses
      if (statusV2 || v2Json.code === 0 || v2Data.results || v2Json.results) {
        return res.status(200).json(v2Json);
      }

      // Tahan status jika antrean v2 baru dibuat dan belum terindeks
      return res.status(200).json({
        code: 804,
        status: "RUNNING",
        msg: "Task sedang diproses server v2",
        data: { status: "RUNNING", taskId: cleanTaskId }
      });
    } catch (errV2) {
      return res.status(200).json({
        code: 804,
        status: "RUNNING",
        msg: "Menunggu koneksi server v2",
        data: { status: "RUNNING", taskId: cleanTaskId }
      });
    }
  }

  // =========================================================
  // JALUR 3: WAN MOTION CONTROL (OPENAPI V1 COMFYUI)
  // =========================================================
  try {
    const v1Res = await fetch('https://www.runninghub.ai/task/openapi/outputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`,
        'apiKey': effectiveApiKey
      },
      body: JSON.stringify({
        apiKey: effectiveApiKey,
        taskId: cleanTaskId
      })
    });

    const v1Json = await v1Res.json();

    // Fallback darurat jika provider tidak terkirim tapi taskId milik v2 (terdeteksi 801 di v1)
    if (v1Json && (v1Json.code === 801 || v1Json.code === 802)) {
      try {
        const fallbackV2Res = await fetch('https://www.runninghub.ai/openapi/v2/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveApiKey}`
          },
          body: JSON.stringify({ taskId: cleanTaskId })
        });
        const fallbackV2Json = await fallbackV2Res.json();
        const fbData = fallbackV2Json?.data || fallbackV2Json;
        if (fbData?.status || fallbackV2Json?.status || fallbackV2Json?.code === 0) {
          return res.status(200).json(fallbackV2Json);
        }
      } catch (e) {}
    }

    return res.status(200).json(v1Json);

  } catch (errV1) {
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menghubungi server v1: ' + errV1.message 
    });
  }
}
