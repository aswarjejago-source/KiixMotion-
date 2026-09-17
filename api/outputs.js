export default async function handler(req, res) {
  // --- LAPIS KEAMANAN 1: TANGANI "INTEL" BROWSER (CORS PREFLIGHT) ---
  // Browser kadang ngecek jalur pakai metode OPTIONS sebelum POST. Wajib diizinkan!
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Cek apakah metode benar-benar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, msg: 'Metode harus POST!' });
  }

  const taskId = req.body.taskId;
  const apiKey = req.headers['authorization']?.replace('Bearer ', '') || req.body.apiKey;

  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 400, msg: "TaskId atau ApiKey kurang!" });
  }

  try {
    const urlRunningHub = `https://www.runninghub.ai/task/openapi/outputs`;

    // Kirim ID + API KEY di dalam body
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

    // --- LAPIS KEAMANAN 2: ANTI-CRASH JSON ---
    // Jangan langsung .json(). Ambil teks mentahnya dulu buat jaga-jaga kalau server mereka ngaco/down.
    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (parseError) {
      return res.status(502).json({ code: 502, msg: "Balasan RunningHub rusak/bukan JSON", raw: textData.substring(0, 100) });
    }
    
    // Set header balasan biar browser HP lu dan Vercel gak nge-cache data ini
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 500, msg: err.message });
  }
}
