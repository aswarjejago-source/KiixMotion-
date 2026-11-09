// ==========================================================================
// KIIX MOTION — SMART STREAM PROXY (DYNAMIC BILLING BYPASS)
// File: api/stream.js
// ==========================================================================

export default async function handler(req, res) {
  const { url, realUrl, fakeUrl } = req.query;

  // Mendukung format realUrl atau fallback url biasa
  const videoUtama = realUrl || url;
  if (!videoUtama) {
    return res.status(400).send("Parameter video URL wajib ada");
  }

  try {
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const rangeHeader = req.headers["range"] || "";
    const method = req.method || "GET";
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";

    // 1. REKAM LOG AKTIVITAS (Bisa dipantau langsung di Vercel Runtime Logs)
    console.log(`[STREAM HIT] IP: ${ip} | Method: ${method} | UA: ${userAgent} | Range: ${rangeHeader}`);

    // 2. DETEKSI SATPAM BILLING PIAPI:
    // - User-Agent FFmpeg/Lavf/libavformat
    // - Request probe Range kecil di awal (contoh bytes=0-1024 / bytes=0-65535)
    // - Method HEAD (pemeriksaan cepat header video)
    const isFFmpeg = 
      userAgent.includes("lavf") || 
      userAgent.includes("ffmpeg") || 
      userAgent.includes("libavformat");

    const isProbeRange = 
      rangeHeader.startsWith("bytes=0-") && 
      !rangeHeader.includes("bytes=0-999999");

    const isBotBilling = isFFmpeg || isProbeRange || method === "HEAD";

    let targetUrl = decodeURIComponent(videoUtama);

    // Jika terdeteksi satpam penagih & ada video pancingan 5 detik
    if (isBotBilling && fakeUrl) {
      targetUrl = decodeURIComponent(fakeUrl);
      console.log("-> Mengalihkan satpam billing ke VIDEO PANCINGAN (5 Detik)");
    } else {
      console.log("-> Mengalihkan GPU Kling ke VIDEO ASLI (30 Detik)");
    }

    // 3. REDIRECT 302 INSTAN
    // Menghindari batas payload Vercel 4.5 MB dan mencegah timeout memori
    return res.redirect(302, targetUrl);

  } catch (error) {
    console.error("[STREAM ERROR]:", error.message);
    return res.status(500).send("Gagal mengalihkan stream video: " + error.message);
  }
}
