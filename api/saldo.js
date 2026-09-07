export default async function handler(req, res) {
  const { apiKey } = req.query;
  if (!apiKey) return res.status(400).json({ code: 1, msg: "API Key kosong" });

  try {
    const respon = await fetch("https://www.runninghub.ai/task/openapi/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey })
    });
    const data = await respon.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ code: 1, msg: err.message });
  }
}
