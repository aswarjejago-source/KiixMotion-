export default async function handler(req, res) {
  const taskId = req.query.taskId || req.body.taskId;
  const apiKey = req.headers['authorization']?.replace('Bearer ', '') || req.body.apiKey;

  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 400, msg: "TaskId atau ApiKey kurang!" });
  }

  try {
    // TAMBAHAN VITAL: Cache-Buster (Stempel Waktu) biar Vercel gak ngasih data basi!
    const stempelWaktu = new Date().getTime();
    const urlRunningHub = `https://www.runninghub.ai/task/openapi/outputs?taskId=${taskId}&_rnd=${stempelWaktu}`;

    const response = await fetch(urlRunningHub, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store' // Paksa Vercel untuk gak nyimpen cache
    });

    const data = await response.json();
    
    // Set header balasan biar browser HP lu juga gak nge-cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 500, msg: err.message });
  }
}
