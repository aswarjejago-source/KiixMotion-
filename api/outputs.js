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
      const PIAPI_KEY = process.env.PIAPI_KEY;
      if (!PIAPI_KEY) {
        return res.status(500).json({ success: false, message: 'PIAPI_KEY belum diset di environment Vercel.' });
      }
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
  // JALUR 3: WAN MOTION CONTROL (OPENAPI V1 COMFYUI)
  // DIPERBAIKI: respons dinormalisasi dulu, bukan diteruskan mentah,
  // supaya frontend tidak salah tebak kode yang belum dikenal
  // sebagai "gagal".
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

    const rawCode = Number(v1Json?.code);
    const rawData = (v1Json && typeof v1Json.data === 'object' && v1Json.data !== null) ? v1Json.data : {};
    const rawStatus = String(v1Json?.status || rawData?.status || rawData?.taskStatus || "").toUpperCase();
    const rawMsg = String(v1Json?.msg || v1Json?.message || rawData?.msg || rawData?.errorMessage || "").toUpperCase();

    // Kode-kode yang DIPASTIKAN berarti "masih berjalan / antre" di RunningHub v1.
    // Tambahkan kode lain di sini kalau kamu temukan kode lain yang muncul
    // pada task yang sebenarnya masih berjalan.
    const KODE_SEDANG_PROSES = [0, 200, 804, 805, 806];

    // Kode/kata kunci yang DIPASTIKAN berarti gagal/dibatalkan.
    const eksplisitBatal =
      rawCode === 807 ||
      rawStatus.includes("CANCEL") ||
      rawStatus.includes("TERMINAT") ||
      rawStatus.includes("ABORT") ||
      rawStatus.includes("STOP") ||
      rawMsg.includes("CANCEL") ||
      rawMsg.includes("TERMINAT") ||
      rawMsg.includes("ABORT");

    const eksplisitGagal =
      rawStatus === "FAILED" ||
      rawStatus === "FAIL" ||
      rawStatus === "ERROR" ||
      rawMsg.includes("FAILED") ||
      rawMsg.includes("ERROR:") ||
      rawMsg.includes("EXCEPTION");

    const adaOutput = !!(rawData?.fileUrl || rawData?.file_url || rawData?.videoUrl || rawData?.video_url || rawData?.outputUrl);

    if (eksplisitBatal) {
      return res.status(200).json({
        code: 807,
        status: "CANCELLED",
        msg: v1Json?.msg || "Tugas dibatalkan di server RunningHub",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    if (eksplisitGagal && !adaOutput) {
      return res.status(200).json({
        code: rawCode || 500,
        status: "FAILED",
        msg: v1Json?.msg || "Tugas gagal diproses",
        data: { status: "FAILED", taskId: cleanTaskId }
      });
    }

    if (adaOutput || KODE_SEDANG_PROSES.includes(rawCode) || (!rawCode && !rawStatus)) {
      // Masih berjalan / selesai dengan output -> teruskan mentah,
      // biar frontend yang menangkap link video dari ambilLinkOutputResmi()
      return res.status(200).json(v1Json);
    }

    // Kode TIDAK DIKENAL (bukan di daftar proses, bukan eksplisit gagal/batal):
    // JANGAN langsung cap gagal. Tandai sebagai "masih berjalan" dan log
    // kode aslinya supaya kamu bisa tambahkan ke KODE_SEDANG_PROSES kalau
    // ternyata itu kode normal yang belum terdaftar.
    console.warn('[outputs.js] Kode v1 belum dikenal, dianggap masih berjalan:', rawCode, rawStatus, rawMsg);
    return res.status(200).json({
      code: 804,
      status: "RUNNING",
      msg: v1Json?.msg || "Sedang diproses",
      data: { status: "RUNNING", taskId: cleanTaskId },
      _kodeAsliBelumDikenal: rawCode
    });

  } catch (errV1) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghubungi server v1: ' + errV1.message
    });
  }
}
