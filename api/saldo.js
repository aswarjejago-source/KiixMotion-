module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.query.apiKey || (req.body && req.body.apiKey);
  if (!apiKey) {
    return res.status(400).json({ code: 1, msg: "API Key kosong" });
  }

  try {
    // INI ALAMAT BARU YANG RESMI DARI RUNNINGHUB
    const respon = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      // RunningHub butuh format kosong kalau gak ada data yang dikirim selain API Key
      body: JSON.stringify({}) 
    });
    
    const data = await respon.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 1, msg: err.message });
  }
};
