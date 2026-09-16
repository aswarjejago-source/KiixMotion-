export default async function handler(req, res) {
  // 1. Pastikan cuma nerima metode POST dari web lu
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, msg: 'Metode harus POST!' });
  }

  const taskId = req.body.taskId;
  const apiKey = req.headers['authorization']?.replace('Bearer ', '') || req.body.apiKey;

  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 400, msg: "TaskId atau ApiKey kurang!" });
  }

  try {
    // 2. URL bersih menuju API RunningHub
    const urlRunningHub = `https://www.runninghub.ai/task/openapi/outputs`;

    // 3. Ketok server RunningHub pakai POST dan kirim ID di dalam "amplop" (body)
    const response = await fetch(urlRunningHub, {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json', // Wajib ada kalau POST
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ taskId: taskId }), // Ini amplop rahasianya, Bos!
      cache: 'no-store' // Anti-cache Vercel
    });

    const data = await response.json();
    
    // Set header balasan biar browser HP lu dan Vercel gak nge-cache data ini
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 500, msg: err.message });
  }
}
