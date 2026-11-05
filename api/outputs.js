// File: api/outputs.js - Dual Engine Clean Separated Handler (Kling, Task V1 & OpenAPI V2)
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
  // JALUR 2: RUNNINGHUB STATUS QUERY (V1 Task Outputs & V2 OpenAPI Query)
  // =========================================================
  try {
    let resultJson = null;

    if (provider === 'minimax') {
      // MiniMax menggunakan OpenAPI V2
      const v2Res = await fetch('https://www.runninghub.ai/openapi/v2/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({ taskId: cleanTaskId })
      });
      resultJson = await v2Res.json().catch(() => ({}));
    } else {
      // Wan Motion dibuat via /task/openapi/create (Task V1)
      const v1Res = await fetch('https://www.runninghub.ai/task/openapi/outputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({
          apiKey: effectiveApiKey,
          taskId: cleanTaskId
        })
      });
      resultJson = await v1Res.json().catch(() => ({}));

      // Fallback ke OpenAPI V2 jika V1 tidak mendeteksi tugas (misal code 801 / 802)
      const isV1Gagal = !resultJson || resultJson.code === 801 || resultJson.code === 802 || (!resultJson.data && resultJson.code !== 0 && resultJson.code !== 804 && resultJson.code !== 805 && resultJson.code !== 806);
      if (isV1Gagal) {
        try {
          const v2Res = await fetch('https://www.runninghub.ai/openapi/v2/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${effectiveApiKey}`
            },
            body: JSON.stringify({ taskId: cleanTaskId })
          });
          const v2Json = await v2Res.json().catch(() => ({}));
          if (v2Json && (v2Json.status || v2Json.results || v2Json.data)) {
            resultJson = v2Json;
          }
        } catch (errFallback) {}
      }
    }

    const rawData = (resultJson && typeof resultJson.data === 'object' && resultJson.data !== null) ? resultJson.data : (resultJson || {});
    const rawCode = Number(resultJson?.code);
    const rawStatus = String(rawData?.status || rawData?.taskStatus || resultJson?.status || "").toUpperCase();
    const rawErrorCode = String(resultJson?.errorCode || rawData?.errorCode || "").trim();
    const rawMsg = String(resultJson?.msg || resultJson?.message || resultJson?.errorMessage || rawData?.msg || rawData?.errorMessage || "").toUpperCase();

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
        msg: resultJson?.msg || resultJson?.errorMessage || "Tugas dibatalkan di server RunningHub",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    // 2. Deteksi Kegagalan Alur / Node Error
    const isSuccess = rawCode === 0 || rawStatus.includes("SUCCESS") || (Array.isArray(rawData) && rawData.length > 0) || (Array.isArray(resultJson?.results) && resultJson.results.length > 0);
    const isRunning = rawCode === 804 || rawCode === 805 || rawCode === 806 || rawStatus.includes("RUNNING") || rawStatus.includes("QUEUED") || rawStatus.includes("PROCESSING");

    if (!isSuccess && !isRunning) {
      if (
        rawCode === 500 ||
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
          msg: resultJson?.errorMessage || resultJson?.msg || rawData?.errorMessage || "Tugas gagal diproses engine",
          data: { status: "FAILED", taskId: cleanTaskId, errorCode: rawErrorCode }
        });
      }
    }

    // 3. Teruskan respons normal
    return res.status(200).json(resultJson);

  } catch (errV2) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghubungi server query RunningHub: ' + errV2.message
    });
  }
}
