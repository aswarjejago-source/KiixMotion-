// File: api/outputs.js
// Backend Proxy Vercel - Cek Status & Link Video (Aman Tanpa Bocor API Key)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, msg: 'Metode harus POST!' });
  }

  const { taskId, poolId } = req.body;
  let apiKey = req.headers['authorization']?.replace('Bearer ', '') || req.body.apiKey;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Jika frontend tidak mengirim apiKey (karena pakai pool kredit), ambil dari Supabase di backend
  if (!apiKey && poolId && SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
    try {
      const poolRes = await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolId}&select=api_key`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        }
      });
      const poolData = await poolRes.json();
      if (poolData && poolData.length > 0 && poolData[0].api_key) {
        apiKey = poolData[0].api_key;
      }
    } catch (e) {
      console.error("Gagal mengambil api_key pool:", e);
    }
  }

  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 400, msg: "TaskId atau Kunci Server tidak ditemukan!" });
  }

  try {
    const urlRunningHub = `https://www.runninghub.ai/task/openapi/outputs`;

    const response = await fetch(urlRunningHub, {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ 
        taskId: taskId,
        apiKey: apiKey 
      }), 
      cache: 'no-store' 
    });

    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (parseError) {
      return res.status(200).json({ code: 502, status: "FAILED", msg: "Gagal parse respons dari server", raw: textData });
    }
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json({ code: 500, status: "FAILED", msg: err.message });
  }
}
