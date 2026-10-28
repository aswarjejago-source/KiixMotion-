// File: api/outputs.js - Native Fetch Version (Anti-Crash 500)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { taskId, apiKey, poolId, provider } = req.body;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'Task ID wajib disertakan.' });
  }

  // JALUR KLING
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

  // JALUR RUNNINGHUB / KIIX / MINIMAX
  try {
    let effectiveApiKey = apiKey;

    // Ambil kunci dari Supabase via REST API murni jika apiKey kosong
    const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!effectiveApiKey && supaUrl && supaKey) {
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

    const rhRes = await fetch('https://www.runninghub.ai/task/openapi/outputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`,
        'apiKey': effectiveApiKey
      },
      body: JSON.stringify({
        apiKey: effectiveApiKey,
        taskId: String(taskId).trim()
      })
    });

    const rhJson = await rhRes.json();
    return res.status(200).json(rhJson);

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal hubungkan ke RunningHub: ' + err.message });
  }
}
