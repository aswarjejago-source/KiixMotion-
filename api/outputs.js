export default async function handler(req, res) {
  // Ambil taskId dan apiKey dari request frontend
  const taskId = req.query.taskId || req.body.taskId;
  const apiKey = req.headers['authorization']?.replace('Bearer ', '') || req.body.apiKey;

  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 400, msg: "TaskId atau ApiKey kurang!" });
  }

  try {
    // Vercel server yang nembak langsung ke RunningHub (Aman dari CORS!)
    const response = await fetch(`https://www.runninghub.ai/task/openapi/outputs?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 500, msg: err.message });
  }
}
