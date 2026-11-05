// File: api/saldo.js
// Backend Proxy Vercel - Live Coin Checker RunningHub

export const maxDuration = 15;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let bodyData = req.body || {};
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
  }

  const rawInput = bodyData.cookieData || bodyData.accessToken || bodyData.apiKey || req.query?.apiKey || "";
  let accessToken = bodyData.accessToken || null;
  let cookieData = bodyData.cookieData || null;
  let userId = bodyData.userId || null;

  // Ekstrak token & userId jika input berupa string Cookie mentah
  if (typeof rawInput === 'string' && (rawInput.includes('Rh-Accesstoken=') || rawInput.includes('userId='))) {
    cookieData = rawInput;
    const tokenMatch = rawInput.match(/Rh-Accesstoken=([^;\s]+)/i);
    const userMatch = rawInput.match(/userId=([^;\s]+)/i);
    if (tokenMatch) accessToken = tokenMatch[1];
    if (userMatch) userId = userMatch[1];
  } else if (typeof rawInput === 'string' && rawInput.startsWith('ey')) {
    accessToken = rawInput;
  }

  if (accessToken || cookieData) {
    const token = accessToken || (cookieData ? cookieData.match(/Rh-Accesstoken=([^;\s]+)/i)?.[1] : null);
    const uId = userId || (cookieData ? cookieData.match(/userId=([^;\s]+)/i)?.[1] : "") || "";

    const headersWeb = {
      "authority": "www.runninghub.ai",
      "accept": "*/*",
      "content-type": "application/json",
      "client": "WEB",
      "authorization": `Bearer ${token}`,
      "cookie": cookieData || `Rh-Accesstoken=${token}; userId=${uId};`,
      "origin": "https://www.runninghub.ai",
      "referer": "https://www.runninghub.ai/",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
      "userid": String(uId),
      "x-rh-lang": "id"
    };

    // Endpoint resmi hasil capture Network DevTools
    const endpointUrl = "https://www.runninghub.ai/api/uc/auth/user-info";

    try {
      const rhResp = await fetch(endpointUrl, {
        method: "GET",
        headers: headersWeb
      });

      const rhJson = await rhResp.json().catch(() => null);

      if (rhJson && (rhJson.code === 0 || rhJson.code === 200 || rhJson.data)) {
        const raw = rhJson.data || rhJson;
        
        // Baca properti totalCoin (448)
        const koin = raw.totalCoin ?? raw.remainCoins ?? raw.totalCoins ?? raw.coins ?? raw.coin ?? raw.balance;

        if (koin !== undefined && koin !== null && !isNaN(Number(koin))) {
          const koinAngka = Number(koin);
          return res.status(200).json({
            code: 0,
            success: true,
            coins: koinAngka,
            userId: raw.id || raw.userId || uId,
            data: raw
          });
        }
      }
    } catch (e) {
      return res.status(500).json({ success: false, message: "Koneksi ke RunningHub gagal: " + e.message });
    }

    return res.status(200).json({ success: false, coins: 0, message: "Gagal mengekstrak totalCoin dari user-info." });
  }

  return res.status(400).json({ success: false, message: "Cookie atau Access Token wajib disertakan." });
}
