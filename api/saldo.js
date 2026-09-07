module.exports = async (req, res) => {
  // Langsung kasih izin kalau browser nanya jalur (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ambil API key dari web kita
  const apiKey = req.query.apiKey || (req.body && req.body.apiKey);
  
  if (!apiKey) {
    return res.status(400).json({ code: 1, msg: "API Key kosong" });
  }

  try {
    // Mesin Vercel nembak ke server RunningHub (gak bakal diblokir browser)
    const response = await fetch("https://www.runninghub.ai/task/openapi/account", {
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
