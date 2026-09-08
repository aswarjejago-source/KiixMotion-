module.exports = async (req, res) => {
  // Buka gerbang CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const taskId = req.query.taskId || (req.body && req.body.taskId);
  const apiKey = req.query.apiKey || (req.body && req.body.apiKey);
  
  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 1, msg: "Task ID atau API Key kosong" });
  }

  try {
    // Tembak langsung dari server Vercel ke server RunningHub
    const response = await fetch("https://www.runninghub.ai/task/openapi/outputs?taskId=" + taskId, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey 
      }
    });
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ code: 1, msg: error.message });
  }
};
