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
    // ATURAN BARU V2: Tembak ke endpoint /v2/query pakai metode POST
    const response = await fetch("https://www.runninghub.ai/openapi/v2/query", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey 
      },
      // ATURAN BARU V2: Task ID dibungkus di dalam body JSON
      body: JSON.stringify({ taskId: taskId })
    });
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ code: 1, msg: error.message });
  }
};
