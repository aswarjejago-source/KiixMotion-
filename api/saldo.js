// File: api/saldo.js
// Backend Proxy Vercel - 100% Real Dynamic Coin Checker (Tanpa Angka Palsu/Cadangan)

export const maxDuration = 15;

function cariKoinMendalam(obj) {
  if (!obj || typeof obj !== 'object') return null;

  // Daftar nama field koin RunningHub
  const targetKeys = [
    'remainCoins', 
    'account_balance_coins', 
    'totalCoin', 
    'remain_coins', 
    'totalCoins', 
    'coins', 
    'coin', 
    'balance'
  ];

  for (const k of targetKeys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "" && !isNaN(Number(obj[k]))) {
      const v = Number(obj[k]);
      if (v > 0) return v;
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const hasil = cariKoinMendalam(obj[key]);
      if (hasil !== null && hasil > 0) return hasil;
    }
  }

  for (const k of targetKeys) {
    if (obj[k] !== undefined && obj[k] !== null && !isNaN(Number(obj[k]))) {
      return Number(obj[k]);
    }
  }

  return null;
}

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

  // JALUR 1: AKUN SESI WEB / COOKIE TOKEN
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
      "Content-Type": "application/json",
      "Cookie": cleanCookie,
      "Authorization": "Bearer " + token,
      "Rh-Accesstoken": token,
      "Origin": "https://www.runninghub.ai",
      "Referer": "https://www.runninghub.ai/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };

    // Daftar endpoint resmi RunningHub
    const endpoints = [
      { url: "https://www.runninghub.ai/uc/openapi/accountStatus", method: "POST", body: JSON.stringify({ apiKey: token }) },
      { url: "https://www.runninghub.ai/uc/user/getUserInfo", method: "POST", body: "{}" },
      { url: "https://www.runninghub.ai/uc/user/getUserInfo", method: "GET" },
      { url: "https://www.runninghub.ai/uc/auth/user-info", method: "GET" },
      { url: "https://www.runninghub.ai/uc/wallet/get-balance", method: "POST", body: "{}" },
      { url: "https://www.runninghub.ai/uc/wallet/get-balance", method: "GET" }
    ];

    let liveCoins = null;
    let dataRes = null;
    let logs = [];

    for (const ep of endpoints) {
      try {
        const opt = { method: ep.method, headers: headersWeb };
        if (ep.body) opt.body = ep.body;
        const resp = await fetch(ep.url, opt);
        const json = await resp.json().catch(() => null);

        logs.push({ url: ep.url, status: resp.status, body: json });

        if (json && (json.code === 0 || json.code === 200 || json.status === 'success')) {
          const k = cariKoinMendalam(json);
          if (k !== null && !isNaN(k)) {
            liveCoins = k;
            dataRes = json;
            break;
          }
        }
      } catch (e) {
        logs.push({ url: ep.url, error: e.message });
      }
    }

    // PENGECEKAN KETAT: Jika tidak ada angka koin asli yang berhasil ditarik, GAGALKAN.
    // Tidak ada angka 448 buatan atau rekayasa sama sekali.
    if (liveCoins === null || isNaN(liveCoins)) {
      return res.status(200).json({
        success: false,
        coins: 0,
        message: "Gagal menarik saldo asli RunningHub. Tidak ada koin yang terdeteksi dari respons server.",
        debug: logs
      });
    }

    // Hanya merespons sukses jika koin riil berhasil diekstrak dari server RunningHub
    return res.status(200).json({
      code: 0,
      success: true,
      coins: liveCoins,
      userId: dataRes?.data?.id || dataRes?.data?.userId || uId,
      data: dataRes
    });
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
        message: "API Key valid tapi koin tidak ditemukan.",
        debug: data
      });
    } catch (errKey) {
      return res.status(500).json({ success: false, message: "Error API Key: " + errKey.message });
    }
  }

  return res.status(400).json({ success: false, message: "Kredensial kosong!" });
}
