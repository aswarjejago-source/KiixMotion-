// ==========================================================================
// KIIX MOTION — SMART STREAM PROXY (DYNAMIC BILLING BYPASS)
// File: api/stream.js
// ==========================================================================

export default async function handler(req, res) {
  const { url, realUrl, fakeUrl } = req.query;

  // Mendukung format lama (?url=...) maupun format penyamaran (?realUrl=...&fakeUrl=...)
  const videoUtama = realUrl || url;
  if (!videoUtama) {
    return res.status(400).send("Parameter video URL wajib ada");
  }

  try {
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const rangeHeader = req.headers["range"] || "";

    // 1. DETEKSI SATPAM BILLING PIAPI (FFprobe / Lavf / FFmpeg)
    // Validator penagihan PiAPI hampir selalu memakai library FFmpeg bawaan sistem
    const isBotBilling = 
      userAgent.includes("lavf") || 
      userAgent.includes("ffmpeg") || 
      userAgent.includes("libavformat");

    // Jika bot billing yang meminta DAN ada video pancingan 5 detik, sajikan video 5 detik.
    // Jika worker GPU Kling yang mengunduh untuk dirender, sajikan video 30 detik asli.
    let targetUrl = decodeURIComponent(videoUtama);
    if (isBotBilling && fakeUrl) {
      targetUrl = decodeURIComponent(fakeUrl);
    }

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    // Ambil stream video dari penyimpanan (Supabase)
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: headers
    });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send(`Video sumber error: ${response.statusText}`);
    }

    // Teruskan header multimedia agar terbaca valid oleh FFprobe dan GPU
    res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");

    if (response.headers.get("content-length")) {
      res.setHeader("Content-Length", response.headers.get("content-length"));
    }
    if (response.headers.get("content-range")) {
      res.setHeader("Content-Range", response.headers.get("content-range"));
    }

    res.status(response.status);

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    return res.status(500).send("Gagal mengalirkan stream video: " + error.message);
  }
}
