// File: api/saldo.js
// Backend Proxy Vercel - Live Coin Extractor RunningHub

export const maxDuration = 15;

// Fungsi pelacak koin otomatis ke seluruh lapisan JSON
function ekstrakKoinMendalam(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const targetKeys = ['totalCoin', 'remainCoins', 'totalCoins', 'coins', 'coin', 'balance'];
  for (const k of targetKeys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "" && !isNaN(Number(obj[k]))) {
      const val = Number(obj[k]);
      if (val > 0) return val;
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const hasilAnak = ekstrakKoinMendalam(obj[key]);
      if (hasilAnak !== null && hasilAnak > 0) return hasilAnak;
    }
  }

  for (const k of targetKeys) {
    if (obj[k] !== undefined && obj[k] !== null && !isNaN(Number(obj[k]))) {
      return Number(obj[k]);
    }
  }

  return null;
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

  if (accessToken || cookieData) {
    const token = accessToken || (cookieData ? cookieData.match(/Rh-Accesstoken=([^;\s]+)/i)?.[1] : null);
    const uId = userId || (cookieData ? cookieData.match(/userId=([^;\s]+)/i)?.[1] : "") || "2088197555130155009";

    let cleanCookie = cookieData ? String(cookieData).replace(/[\r\n]+/g, ' ').trim() : "";
    if (!cleanCookie.includes('Rh-Accesstoken=')) {
      cleanCookie = `rh_locale=id; Rh-Accesstoken=${token}; userId=${uId}; Rh-billing-uid=${uId};`;
    }

    const headersWeb = {
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Content-Type": "application/json",
      "Cookie": cleanCookie,
      "Origin": "https://www.runninghub.ai",
      "Referer": "https://www.runninghub.ai/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };

    // Jalur endpoint RunningHub
    const targetEndpoints = [
      { url: "https://www.runninghub.ai/api/uc/auth/user-info", method: "GET" },
      { url: "https://www.runninghub.ai/api/uc/user/getUserInfo", method: "POST", body: "{}" },
      { url: "https://www.runninghub.ai/api/uc/user/getUserInfo", method: "GET" },
      { url: "https://www.runninghub.ai/uc/user/getUserInfo", method: "POST", body: "{}" },
      { url: "https://www.runninghub.ai/uc/user/getUserInfo", method: "GET" },
      { url: "https://www.runninghub.ai/api/wallet/user-wallet/get-balance", method: "POST", body: "{}" },
      { url: "https://www.runninghub.ai/api/uc/user/info", method: "GET" }
    ];

    let debugLog = [];

    for (const ep of targetEndpoints) {
      try {
        const fetchOpt = { method: ep.method, headers: headersWeb };
        if (ep.body) fetchOpt.body = ep.body;

        const rhResp = await fetch(ep.url, fetchOpt);
        const rhJson = await rhResp.json().catch(() => null);

        if (rhJson) {
          const koin = ekstrakKoinMendalam(rhJson);
          if (koin !== null && !isNaN(koin)) {
            return res.status(200).json({
              code: 0,
              success: true,
              coins: koin,
              userId: rhJson.data?.id || rhJson.data?.userId || uId,
              data: rhJson.data || rhJson
            });
          }
          debugLog.push({ url: ep.url, res: rhJson });
        }
      } catch (errLoop) {
        debugLog.push({ url: ep.url, error: errLoop.message });
      }
    }

    return res.status(200).json({
      success: false,
      coins: 0,
      message: "Koin tidak ditemukan pada seluruh endpoint RunningHub.",
      debug: debugLog
    });
  }

  // Jalur API Key pengembang
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
      const koin = data?.data?.remainCoins ?? data?.data?.totalCoins ?? data?.data?.coins ?? 0;

      return res.status(response.ok ? 200 : response.status).json({
        code: data.code ?? 0,
        success: data.code === 0 || data.code === 200,
        coins: Number(koin),
        data: data.data || data
      });
    } catch (errKey) {
      return res.status(500).json({ success: false, message: "Error API Key: " + errKey.message });
    }
  }

  return res.status(400).json({ success: false, message: "Kredensial kosong!" });
}
