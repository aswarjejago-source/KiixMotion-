export default async function handler(req, res) {
  // 1. Cegah blokir CORS dari browser (Jurus Paduka)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya terima POST dari form UI kita
  if (req.method !== 'POST') {
    return res.status(405).json({ code: -1, msg: 'Method Not Allowed' });
  }

  // 2. Tangkap API key
  const apiKey = req.body.apiKey || req.query.apiKey;

  if (!apiKey) {
    return res.status(400).json({ code: -1, msg: "API Key kosong, Bree!" });
  }

  try {
    // 3. Tembak endpoint sakti RunningHub buat ngecek saldo/koin
    const response = await fetch('https://www.runninghub.ai/task/openapi/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      }
    });

    const data = await response.json();

    // 4. Kalau sukses dan dapet koin, kasih ke frontend
    if (response.ok && data.code === 0) {
      return res.status(200).json(data);
    } else {
      // Kalau API Key beneran salah/expired dari sananya
      return res.status(400).json({ code: -1, msg: data.msg || 'API Key Ditolak RunningHub' });
    }

  } catch (error) {
    // Kalau Vercel gagal nyambung ke RunningHub
    return res.status(500).json({ code: -1, msg: "Gagal narik coin: " + error.message });
  }
}
