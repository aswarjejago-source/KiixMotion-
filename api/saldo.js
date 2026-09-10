module.exports = async (req, res) => {
  // Cegah blokir CORS dari browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Tangkap API key dari URL web lu
  const apiKey = req.query.apiKey || (req.body && req.body.apiKey);
  
  if (!apiKey) {
    return res.status(400).json({ code: 1, msg: "API Key kosong, Bree!" });
  }

  try {
    // Tembak endpoint sakti RunningHub pakai metode POST
    const response = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey 
      },
      body: JSON.stringify({ apiKey: apiKey })
    });
    
    const data = await response.json();
    
    // Balikin data koinnya ke index.html lu
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ code: 1, msg: "Gagal narik koin: " + error.message });
  }
};
