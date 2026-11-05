// File: api/outputs.js - Dual Engine Clean Separated Handler (Kling & RunningHub V2)
export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { taskId, apiKey, poolId, provider } = req.body;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'Task ID wajib disertakan.' });
  }

  const cleanTaskId = String(taskId).trim();

  // =========================================================
  // JALUR 1: KLING 2.6 MOTION CONTROL (PiAPI)
  // =========================================================
  if (provider === 'kling' || cleanTaskId.includes('-')) {
    try {
      const PIAPI_KEY = process.env.PIAPI_KEY;
      if (!PIAPI_KEY) {
        return res.status(500).json({ success: false, message: 'PIAPI_KEY belum diset di environment Vercel.' });
      }
      const piRes = await fetch(`https://api.piapi.ai/api/v1/task/${cleanTaskId}`, {
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
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                  process.env.SUPABASE_SERVICE_ROLE ||
                  process.env.SUPABASE_KEY ||
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

  // =========================================================
  // JALUR 2: RUNNINGHUB OPENAPI V2 QUERY
  // =========================================================
  try {
    const v2Res = await fetch('https://www.runninghub.ai/openapi/v2/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`
      },
      body: JSON.stringify({
        taskId: cleanTaskId
      })
    });

    const v2Json = await v2Res.json().catch(() => ({}));
    const v2Data = (v2Json && typeof v2Json.data === 'object' && v2Json.data !== null) ? v2Json.data : (v2Json || {});

    const rawCode = Number(v2Json?.code);
    const rawStatus = String(v2Data?.status || v2Data?.taskStatus || v2Json?.status || "").toUpperCase();
    const rawErrorCode = String(v2Json?.errorCode || v2Data?.errorCode || "").trim();
    const rawMsg = String(v2Json?.msg || v2Json?.message || v2Json?.errorMessage || v2Data?.msg || v2Data?.errorMessage || "").toUpperCase();

    // 1. Deteksi Pembatalan Manual di Server RunningHub
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
        msg: v2Json?.msg || v2Json?.errorMessage || "Tugas dibatalkan di server RunningHub",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    // 2. Deteksi Kegagalan Alur / Node Error
    if (
      rawStatus.includes("FAIL") ||
      rawStatus.includes("ERROR") ||
      (rawErrorCode !== "" && rawErrorCode !== "0" && rawErrorCode !== "null") ||
      rawMsg.includes("FAIL") ||
      rawMsg.includes("ERROR")
    ) {
      return res.status(200).json({
        code: rawCode || 500,
        status: "FAILED",
        errorCode: rawErrorCode,
        msg: v2Json?.errorMessage || v2Json?.msg || v2Data?.errorMessage || "Tugas gagal diproses engine",
        data: { status: "FAILED", taskId: cleanTaskId, errorCode: rawErrorCode }
      });
    }

    // 3. Teruskan respons normal (QUEUED / RUNNING / SUCCESS beserta array results)
    return res.status(200).json(v2Json);

  } catch (errV2) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghubungi server query RunningHub: ' + errV2.message
    });
  }
}
