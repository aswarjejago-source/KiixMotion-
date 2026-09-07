export default async function handler(req, res) {
  // Izinkan akses agar tidak diblokir browser
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { apiKey } = req.query;
  if (!apiKey) {
    return res.status(400).json({ code: 1, msg: "API Key tidak boleh kosong" });
  }

  try {
    const respon = await fetch("https://www.runninghub.ai/task/openapi/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey })
    });
    const data = await respon.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 1, msg: err.message });
  }
}
