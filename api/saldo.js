// File: api/saldo.js
// Backend Proxy Vercel - 100% Real RunningHub Web Session & API Key Checker

export const maxDuration = 15;

function parseJwtPayload(tokenStr) {
  try {
    if (!tokenStr || !tokenStr.includes('.')) return null;
    const base64Url = tokenStr.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

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
  let apiKey = bodyData.apiKey || req.query?.apiKey || null;

  if (typeof rawInput === 'string' && (rawInput.includes('Rh-Accesstoken=') || rawInput.includes('userId='))) {
    cookieData = rawInput;
    const tokenMatch = rawInput.match(/Rh-Accesstoken=([^;\s]+)/i);
    const userMatch = rawInput.match(/userId=([^;\s]+)/i);
    if (tokenMatch) accessToken = tokenMatch[1];
    if (userMatch) userId = userMatch[1];
  } else if (typeof rawInput === 'string' && rawInput.startsWith('ey')) {
    accessToken = rawInput;
  }

  // JALUR 1: SESI WEB RUNNINGHUB (COOKIE / JWT TOKEN)
  if (accessToken || cookieData) {
    const token = accessToken || (cookieData ? cookieData.match(/Rh-Accesstoken=([^;\s]+)/i)?.[1] : null);
    const jwtData = parseJwtPayload(token);
    const uId = userId || jwtData?.sub || (cookieData ? cookieData.match(/userId=([^;\s]+)/i)?.[1] : "") || "2088197555130155009";

    let cleanCookie = cookieData ? String(cookieData).replace(/[\r\n]+/g, ' ').trim() : "";
    if (!cleanCookie.includes('Rh-Accesstoken=')) {
      cleanCookie = `rh_locale=id; Rh-Accesstoken=${token}; userId=${uId}; Rh-billing-uid=${uId};`;
    }

    const headersWeb = {
      "Accept": "application/json, text/plain, */*",
      "Client": "WEB",
      "Content-Type": "application/json",
      "Cookie": cleanCookie,
      "Authorization": "Bearer " + token,
      "Origin": "https://www.runninghub.ai",
      "Referer": "https://www.runninghub.ai/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };

    try {
      // Mengirimkan parameter userId yang diwajibkan server RunningHub (Content-Length: 32)
      const payloadBody = JSON.stringify({ userId: String(uId) });

      const resp = await fetch("https://www.runninghub.ai/uc/getUserInfo", {
        method: "POST",
        headers: headersWeb,
        body: payloadBody
      });

      const json = await resp.json().catch(() => null);

      if (json && json.code === 0 && json.data) {
        // Ekstraksi nilai saldo koin riil dari properti totalCoin
        const rawCoin = json.data.totalCoin ?? json.data.remainCoins ?? json.data.coins;

        if (rawCoin !== undefined && rawCoin !== null && !isNaN(Number(rawCoin))) {
          const koinReal = Number(rawCoin);
          return res.status(200).json({
            code: 0,
            success: true,
            coins: koinReal,
            userId: json.data.id || uId,
            data: json.data
          });
        }
      }

      return res.status(200).json({
        success: false,
        coins: 0,
        message: json?.msg || "Gagal membaca properti koin dari respons RunningHub.",
        debug: json
      });
    } catch (errFetch) {
      return res.status(500).json({
        success: false,
        coins: 0,
        message: "Koneksi Vercel ke RunningHub terputus: " + errFetch.message
      });
    }
  }

  // JALUR 2: API KEY DEVELOPER (rh_live_...)
  if (apiKey || process.env.RUNNINGHUB_API_KEY) {
    const cleanApiKey = String(apiKey || process.env.RUNNINGHUB_API_KEY).trim();
    try {
      const response = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + cleanApiKey
        },
        body: JSON.stringify({ apiKey: cleanApiKey })
      });
      const data = await response.json().catch(() => ({}));
      const koin = data?.data?.remainCoins ?? data?.data?.totalCoins ?? data?.data?.coins;

      if (koin !== undefined && koin !== null && !isNaN(Number(koin))) {
        return res.status(200).json({
          code: 0,
          success: true,
          coins: Number(koin),
          data: data.data || data
        });
      }

      return res.status(200).json({
        success: false,
        coins: 0,
        message: "API Key valid tetapi koin tidak ditemukan.",
        debug: data
      });
    } catch (errKey) {
      return res.status(500).json({ success: false, message: "Error API Key: " + errKey.message });
    }
  }

  return res.status(400).json({ success: false, message: "Kredensial kosong!" });
}
