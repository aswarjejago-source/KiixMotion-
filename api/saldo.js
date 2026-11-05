// File: api/saldo.js
// Backend Proxy Vercel - Cek Status & Koin Realtime RunningHub (Web Session & OpenAPI)

export const maxDuration = 15;

export default async function handler(req, res) {
  // 1. Header CORS lengkap
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Parsing body yang aman
  let bodyData = req.body || {};
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData);
    } catch (e) {
      bodyData = {};
    }
  }

  // Ekstraksi parameter input (bisa dari query URL atau body JSON)
  const rawInput = bodyData.cookieData || bodyData.accessToken || bodyData.apiKey || req.query?.apiKey || "";
  let accessToken = bodyData.accessToken || null;
  let cookieData = bodyData.cookieData || null;
  let userId = bodyData.userId || null;
  let apiKey = bodyData.apiKey || req.query?.apiKey || null;

  // Jika input berupa satu teks panjang Cookie mentah
  if (typeof rawInput === 'string' && (rawInput.includes('Rh-Accesstoken=') || rawInput.includes('userId='))) {
    cookieData = rawInput;
    const tokenMatch = rawInput.match(/Rh-Accesstoken=([^;\s]+)/i);
    const userMatch = rawInput.match(/userId=([^;\s]+)/i);
    if (tokenMatch) accessToken = tokenMatch[1];
    if (userMatch) userId = userMatch[1];
  } else if (typeof rawInput === 'string' && rawInput.startsWith('ey')) {
    accessToken = rawInput;
  }

  // =========================================================
  // JALUR 1: SESI WEB RUNNINGHUB (COOKIE / Rh-Accesstoken)
  // =========================================================
  if (accessToken || cookieData) {
    const tokenBersih = accessToken || (cookieData ? cookieData.match(/Rh-Accesstoken=([^;\s]+)/i)?.[1] : null);
    const uIdBersih = userId || (cookieData ? cookieData.match(/userId=([^;\s]+)/i)?.[1] : "") || "";

    const headersWeb = {
      "authority": "www.runninghub.ai",
      "accept": "application/json, text/plain, */*",
      "content-type": "application/json",
      "client": "WEB",
      "authorization": `Bearer ${tokenBersih}`,
      "cookie": cookieData || `rh_locale=id; Rh-Accesstoken=${tokenBersih}; userId=${uIdBersih};`,
      "origin": "https://www.runninghub.ai",
      "referer": "https://www.runninghub.ai/",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
      "userid": String(uIdBersih),
      "x-rh-lang": "id"
    };

    // Daftar endpoint internal profil & saldo dompet RunningHub
    const targetEndpoints = [
      { url: "https://www.runninghub.ai/api/uc/user/info", method: "GET" },
      { url: "https://www.runninghub.ai/api/uc/user/info", method: "POST" },
      { url: "https://www.runninghub.ai/api/wallet/user-wallet/get-balance", method: "POST" },
      { url: "https://www.runninghub.ai/api/uc/user/get-user-info", method: "POST" }
    ];

    for (const ep of targetEndpoints) {
      try {
        const fetchOpt = {
          method: ep.method,
          headers: headersWeb
        };
        if (ep.method === "POST") fetchOpt.body = JSON.stringify({});

        const rhResp = await fetch(ep.url, fetchOpt);
        const rhJson = await rhResp.json().catch(() => null);

        if (rhJson && (rhJson.code === 0 || rhJson.code === 200 || rhJson.data)) {
          const raw = rhJson.data || rhJson;
          const koinDitemukan = raw.remainCoins ?? raw.totalCoins ?? raw.coins ?? raw.coin ?? raw.balance ?? raw.availableCoins;

          if (koinDitemukan !== undefined && koinDitemukan !== null && !isNaN(Number(koinDitemukan))) {
            const saldoAngka = Number(koinDitemukan);
            return res.status(200).json({
              code: 0,
              success: true,
              coins: saldoAngka,
              userId: raw.userId || raw.id || uIdBersih,
              data: {
                remainCoins: saldoAngka,
                totalCoins: saldoAngka,
                coins: saldoAngka,
                coin: saldoAngka,
                userId: raw.userId || raw.id || uIdBersih
              }
            });
          }
        }
      } catch (errLoop) {
        // Lanjut ke endpoint berikutnya jika salah satu gagal
      }
    }

    return res.status(401).json({
      code: 1,
      success: false,
      coins: 0,
      msg: "Sesi Cookie kedaluwarsa atau server RunningHub menolak otorisasi."
    });
  }

  // =========================================================
  // JALUR 2: API KEY RESMI LAMA (rh_live_...)
  // =========================================================
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
      return res.status(500).json({ code: 1, msg: "Gagal menarik coin via API Key: " + errKey.message });
    }
  }

  return res.status(400).json({
    code: 1,
    success: false,
    msg: "Wajib menyertakan Cookie, Access Token, atau API Key yang valid!"
  });
}
