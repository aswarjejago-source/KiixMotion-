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
  let apiKey = bodyData.apiKey || req.query?.apiKey || null;

  // 1. Ekstrak Token & User ID dari teks Cookie jika ada
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
    const token = accessToken || (cookieData ? cookieData.match(/Rh-Accesstoken=([^;\s]+)/i)?.[1] : null);
    const uId = userId || (cookieData ? cookieData.match(/userId=([^;\s]+)/i)?.[1] : "") || "";

    // Bersihkan cookie dari karakter enter / newline agar Node.js fetch tidak crash
    let cleanCookie = cookieData ? String(cookieData).replace(/[\r\n]+/g, ' ').trim() : "";
    if (!cleanCookie.includes('Rh-Accesstoken=')) {
      cleanCookie = `rh_locale=id; Rh-Accesstoken=${token}; userId=${uId}; Rh-billing-uid=${uId};`;
    }

    // Header persis seperti browser (TANPA Authorization: Bearer agar tidak bentrok)
    const headersWeb = {
      "authority": "www.runninghub.ai",
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/json",
      "cookie": cleanCookie,
      "origin": "https://www.runninghub.ai",
      "referer": "https://www.runninghub.ai/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };

    // Daftar endpoint prioritas
    const endpointList = [
      "https://www.runninghub.ai/api/uc/auth/user-info",
      "https://www.runninghub.ai/api/uc/user/get-user-info",
      "https://www.runninghub.ai/uc/user/get-user-info"
    ];

    let lastError = null;

    for (const url of endpointList) {
      try {
        const rhResp = await fetch(url, {
          method: "GET",
          headers: headersWeb
        });

        const rhJson = await rhResp.json().catch(() => null);

        if (rhJson && (rhJson.code === 0 || rhJson.code === 200 || rhJson.data)) {
          const raw = rhJson.data || rhJson;
          
          // Membaca properti totalCoin ("448")
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
        } else if (rhJson) {
          lastError = rhJson;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(200).json({
      success: false,
      coins: 0,
      message: "Gagal menarik data totalCoin dari server RunningHub.",
      debug: lastError
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
      return res.status(500).json({ success: false, message: "Gagal memproses API Key: " + errKey.message });
    }
  }

  return res.status(400).json({ success: false, message: "Cookie atau Access Token wajib disertakan." });
}
