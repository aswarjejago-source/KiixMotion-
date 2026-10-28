// File: api/outputs.js - Native Fetch Version (Dual Engine: ComfyUI v1 & AI-App v2)
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
  // JALUR 2 & 3: RUNNINGHUB (WAN MOTION V1 & MINIMAX H3 V2)
  // =========================================================
  try {
    let effectiveApiKey = apiKey;

    // Ambil kunci dari Supabase via REST API jika apiKey tidak dikirim dari klien
    const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_ANON_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const cleanTaskId = String(taskId).trim();
    const isExplicitMinimax = (provider === 'minimax');
    let finalResult = null;

    // A. JIKA MINIMAX ATAU PROVIDER BELUM SPESIFIK: CEK DULU KE OPENAPI V2
    if (isExplicitMinimax || !provider) {
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

        // Valid jika ada status aktif atau hasil tanpa pesan galat
        if (v2Json && !v2Json.errorCode && (v2Json.status || v2Json.results)) {
          finalResult = v2Json;
        }
      } catch (errV2) {
        // Lanjut ke fallback v1 jika v2 gagal koneksi
      }
    }

    // B. JIKA BUKAN V2 ATAU V2 TIDAK MENEMUKAN TUGAS: FALLBACK KE OPENAPI V1 (COMFYUI)
    if (!finalResult) {
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

      // C. JIKA DI V1 MASIH MENGEMBALIKAN GALAT 801, CEK ULANG KE V2 SEBAGAI JARING PENGAMAN
      if (v1Json && (v1Json.code === 801 || v1Json.code === 802) && !isExplicitMinimax) {
        try {
          const reV2Res = await fetch('https://www.runninghub.ai/openapi/v2/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${effectiveApiKey}`
            },
            body: JSON.stringify({ taskId: cleanTaskId })
          });
          const reV2Json = await reV2Res.json();
          if (reV2Json && !reV2Json.errorCode && (reV2Json.status || reV2Json.results)) {
            return res.status(200).json(reV2Json);
          }
        } catch (e) {}
      }

      finalResult = v1Json;
    }

    return res.status(200).json(finalResult);

  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menghubungkan ke RunningHub: ' + err.message 
    });
  }
}
