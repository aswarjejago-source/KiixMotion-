module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.query.apiKey || (req.body && req.body.apiKey);
  
  if (!apiKey) {
    return res.status(400).json({ code: 1, msg: "API Key kosong" });
  }

  try {
    const response = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey 
      },
      body: JSON.stringify({ apiKey: apiKey })
    });
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ code: 1, msg: error.message });
  }
};
