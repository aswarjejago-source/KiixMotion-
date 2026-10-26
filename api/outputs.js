// File: api/outputs.js
// Backend Proxy Status Checker - RunningHub & Kling (PiAPI)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { taskId, apiKey, provider } = req.body;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'Task ID wajib disertakan.' });
  }

  // =========================================================
  // JALUR 1: CEK STATUS KLING (PiAPI)
  // =========================================================
  if (provider === 'kling' || String(taskId).includes('-')) {
    try {
      const PIAPI_KEY = process.env.PIAPI_KEY || "b6d3705e08d8e2330e60639119bd04bc304be592eebda976ec2551f82ea072da";

      const piapiRes = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': PIAPI_KEY
        }
      });

      const rawText = await piapiRes.text();
      let piapiJson = null;
      try {
        piapiJson = JSON.parse(rawText);
      } catch (e) {}

      if (!piapiRes.ok || !piapiJson) {
        return res.status(piapiRes.status).json({
          success: false,
          message: 'Gagal mengambil status task dari PiAPI.'
        });
      }

      // Standarisasi response untuk kling-engine.js
      const taskData = piapiJson.data || piapiJson;
      return res.status(200).json({
        success: true,
        data: taskData
      });
    } catch (errKling) {
      return res.status(500).json({
        success: false,
        message: 'Koneksi ke status PiAPI gagal: ' + errKling.message
      });
    }
  }

  // =========================================================
  // JALUR 2: CEK STATUS RUNNINGHUB / KIIX
  // =========================================================
  try {
    const rhRes = await fetch('https://www.runninghub.ai/task/openapi/outputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ taskId: taskId })
    });

    const rhJson = await rhRes.json();
    return res.status(200).json(rhJson);
  } catch (errRh) {
    return res.status(500).json({
      success: false,
      message: 'Koneksi ke RunningHub gagal: ' + errRh.message
    });
  }
}
