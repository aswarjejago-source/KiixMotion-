// File: api/saldo.js
// Backend Proxy Vercel - Live Coin Checker RunningHub

export const maxDuration = 15;

function cariKoinOtomatis(obj) {
  if (!obj || typeof obj !== 'object') return null;

  // Daftar nama variabel koin resmi RunningHub
  const keys = [
    'remainCoins', 
    'account_balance_coins', 
    'totalCoin', 
    'remain_coins', 
    'coins', 
    'totalCoins', 
    'coin', 
    'balance'
  ];

  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "" && !isNaN(Number(obj[k]))) {
      return Number(obj[k]);
    }
  }

  for (const prop of Object.keys(obj)) {
    if (typeof obj[prop] === 'object' && obj[prop] !== null) {
      const ketemu = cariKoinOtomatis(obj[prop]);
      if (ketemu !== null) return ketemu;
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
      "Authorization": "Bearer " + token,
      "Rh-Accesstoken": token,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };

    // 1. Coba endpoint resmi accountStatus
    try {
      const respStatus = await fetch("https://www.runninghub.ai/uc/openapi/accountStatus", {
        method: "POST",
        headers: headersWeb,
        body: JSON.stringify({ apiKey: token })
      });
      const jsonStatus = await respStatus.json().catch(() => null);
      if (jsonStatus) {
        const koinDitemukan = cariKoinOtomatis(jsonStatus);
        if (koinDitemukan !== null) {
          return res.status(200).json({
            code: 0,
            success: true,
            coins: koinDitemukan,
            userId: uId,
            data: jsonStatus
          });
        }
      }
    } catch (e1) {}

    // 2. Coba endpoint user-info
    try {
      const respInfo = await fetch("https://www.runninghub.ai/api/uc/auth/user-info", {
        method: "GET",
        headers: headersWeb
      });
      const jsonInfo = await respInfo.json().catch(() => null);
      if (jsonInfo) {
        const koinDitemukan = cariKoinOtomatis(jsonInfo);
        if (koinDitemukan !== null) {
          return res.status(200).json({
            code: 0,
            success: true,
            coins: koinDitemukan,
            userId: jsonInfo.data?.id || uId,
            data: jsonInfo
          });
        }

        // Jika respons sukses tapi koin belum terbaca, kembalikan isi data lengkapnya
        return res.status(200).json({
          success: false,
          coins: 0,
          message: "Data diterima tapi nama properti koin belum cocok.",
          debug: jsonInfo
        });
      }
    } catch (e2) {}

    return res.status(200).json({
      success: false,
      coins: 0,
      message: "Gagal terhubung ke endpoint RunningHub."
    });
  }

  // Jalur API Key Developer (rh_live_...)
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

      return res.status(200).json({
        code: 0,
        success: true,
        coins: Number(koin),
        data: data.data || data
      });
    } catch (errKey) {
      return res.status(500).json({ success: false, message: "Error API Key: " + errKey.message });
    }
  }

  return res.status(400).json({ success: false, message: "Kredensial kosong!" });
}
