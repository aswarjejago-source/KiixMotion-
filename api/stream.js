export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Parameter url wajib ada");
  }

  try {
    const targetUrl = decodeURIComponent(url);

    // Siapkan header, teruskan permintaan 'range' dari HP jika ada
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: headers
    });

    // Jika link dari RunningHub/Tencent Cloud sudah mati/expired
    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send(`Video sumber error: ${response.statusText}`);
    }

    // Teruskan header multimedia ke browser HP
    res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");

    if (response.headers.get("content-length")) {
      res.setHeader("Content-Length", response.headers.get("content-length"));
    }
    if (response.headers.get("content-range")) {
      res.setHeader("Content-Range", response.headers.get("content-range"));
    }

    res.status(response.status);

    // Alirkan buffer video langsung ke HP
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    return res.status(500).send("Gagal mengalirkan video: " + error.message);
  }
}
