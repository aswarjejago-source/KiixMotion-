// File: api/stream.js
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.startsWith('http')) {
    return res.status(400).send('URL video tidak valid');
  }

  try {
    const videoRes = await fetch(url);
    if (!videoRes.ok) return res.status(videoRes.status).send('Gagal mengambil video sumber');

    // Meneruskan header video agar kompatibel dengan pemutar HP
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const arrayBuffer = await videoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).send('Gagal streaming video');
  }
}
