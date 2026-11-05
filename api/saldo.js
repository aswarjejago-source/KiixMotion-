// File: api/saldo.js
// Backend Proxy Vercel - Cek Status & Koin RunningHub (accountStatus)

export const maxDuration = 15;

export default async function handler(req, res) {
  // Header CORS lengkap agar tidak terblokir browser saat dipanggil dari domain KiixMotion
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parsing body yang aman (baik format JSON object maupun JSON string)
  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData);
    } catch (e) {
      bodyData = {};
    }
  }

  // Tangkap API key dari query param, body, atau fallback environment variable
  const apiKey = req.query?.apiKey || bodyData?.apiKey || process.env.RUNNINGHUB_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ code: 1, msg: "API Key kosong!" });
  }

  try {
    const cleanApiKey = String(apiKey).trim();

    const response = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cleanApiKey
      },
      body: JSON.stringify({ apiKey: cleanApiKey })
    });

    const data = await response.json().catch(() => ({}));

    return res.status(response.ok ? 200 : response.status).json(data);

  } catch (error) {
    return res.status(500).json({ code: 1, msg: "Gagal narik coin: " + error.message });
  }
}
