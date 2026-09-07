module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.query.apiKey || (req.body && req.body.apiKey);
  if (!apiKey) {
    return res.status(400).json({ code: 1, msg: "API Key kosong dari web kita" });
  }

  try {
    // Nembak ke RunningHub dengan format Body yang benar
    const respon = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      // KUNCI PERUBAHAN: RunningHub minta apiKey ditaruh di sini
      body: JSON.stringify({ 
          "apiKey": apiKey 
      }) 
    });
    
    const data = await respon.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 1, msg: err.message });
  }
};
