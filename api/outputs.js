// File: api/outputs.js - Dual Engine Clean Separated Handler
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
      const piJson = await piRes.json().catch(() => ({}));
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
      const dbData = await dbRes.json().catch(() => []);
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
        body: JSON.stringify({ 
          taskId: cleanTaskId,
          apiKey: effectiveApiKey 
        })
      });

      const v2Json = await v2Res.json().catch(() => ({}));
      const v2Data = (v2Json && typeof v2Json.data === 'object' && v2Json.data !== null) ? v2Json.data : (v2Json || {});
      const rawCode = Number(v2Json?.code);
      const rawStatus = String(v2Data?.status || v2Data?.taskStatus || v2Json?.status || "").toUpperCase();
      const rawMsg = String(v2Json?.msg || v2Json?.message || v2Data?.msg || v2Data?.errorMessage || "").toUpperCase();

      if (
        rawCode === 807 ||
        rawStatus.includes("CANCEL") ||
        rawStatus.includes("TERMINAT") ||
        rawStatus.includes("ABORT") ||
        rawStatus.includes("STOP") ||
        rawMsg.includes("CANCEL") ||
        rawMsg.includes("TERMINAT") ||
        rawMsg.includes("ABORT")
      ) {
        return res.status(200).json({
          code: 807,
          status: "CANCELLED",
          msg: v2Json?.msg || "Tugas dibatalkan di server RunningHub",
          data: { status: "CANCELLED", taskId: cleanTaskId }
        });
      }

      if (
        rawStatus.includes("FAIL") ||
        rawStatus.includes("ERROR") ||
        rawMsg.includes("FAIL") ||
        rawMsg.includes("ERROR")
      ) {
        return res.status(200).json({
          code: rawCode || 500,
          status: "FAILED",
          msg: v2Json?.msg || "Tugas gagal diproses",
          data: { status: "FAILED", taskId: cleanTaskId }
        });
      }

      return res.status(200).json(v2Json);

    } catch (errV2) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menghubungi server v2: ' + errV2.message
      });
    }
  }

  // =========================================================
  // JALUR 3: WAN MOTION CONTROL (OPENAPI V1 COMFYUI) MURNI
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

    const v1Json = await v1Res.json().catch(() => ({}));
    return res.status(200).json(v1Json);

  } catch (errV1) {
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menghubungi server v1: ' + errV1.message 
    });
  }
}
