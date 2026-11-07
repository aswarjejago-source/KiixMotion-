// File: api/outputs.js
// Backend Proxy Vercel - Universal Webhook & Media Stream Parser

export const maxDuration = 30;

const WAN_APP_ID = "2101240461868802049";

// Pemindai regex universal: menyedot semua URL MP4 dari struktur teks apa pun
function cariSemuaLinkMp4(teksMentah) {
  if (!teksMentah || typeof teksMentah !== 'string') return null;
  
  // Tangkap semua URL yang mengarah ke file video
  const polaVideo = /(https?:\/\/[^\s"'<>]+\.(?:mp4|mov|webm|m4v)[^\s"'<>]*)/gi;
  const kecocokan = teksMentah.match(polaVideo);

  if (kecocokan && kecocokan.length > 0) {
    // Filter URL yang bukan dari worker/uploader kita
    for (let u of kecocokan) {
      let clean = u.replace(/\\/g, '').trim();
      if (!clean.includes('workers.dev') && !clean.includes('kiix-uploader')) {
        return clean.replace(/^http:\/\//i, 'https://');
      }
    }
  }
  return null;
}

// Helper refresh access token jika sesi kedaluwarsa saat polling
async function refreshRhAccessToken(refreshToken, oldCookie) {
  const refreshUrls = [
    "https://www.runninghub.ai/uc/auth/refresh",
    "https://www.runninghub.ai/uc/auth/refreshToken",
    "https://www.runninghub.ai/api/uc/auth/refresh"
  ];

  for (const url of refreshUrls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client": "WEB",
          "Cookie": oldCookie || `Rh-Refreshtoken=${refreshToken}`
        },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json().catch(() => ({}));
      const newToken = data?.data?.accessToken || data?.data?.token || data?.accessToken || null;
      if (newToken) return newToken;
    } catch (e) {}
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { taskId, poolId, provider } = req.body;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'Task ID wajib disertakan.' });
  }

  const cleanTaskId = String(taskId).trim();

  // =========================================================
  // JALUR KLING MOTION CONTROL (PIAPI POLLING)
  // =========================================================
  if (provider === 'kling' || cleanTaskId.includes('-')) {
    try {
      // KUNCI PIAPI DITANAM LANGSUNG (TANPA VERCEL ENV)
      const PIAPI_KEY = "b6d3705e08d8e2330e60639119bd04bc304be592eebda976ec2551f82ea072da";

      const piRes = await fetch(`https://api.piapi.ai/api/v1/task/${cleanTaskId}`, { 
        headers: { 
          'x-api-key': PIAPI_KEY,
          'Content-Type': 'application/json'
        } 
      });
      const piJson = await piRes.json().catch(() => ({}));
      return res.status(200).json({ success: true, data: piJson.data || piJson });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // =========================================================
  // JALUR RUNNINGHUB (WEB SESSION POOLING)
  // =========================================================
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY;

  if (!supaUrl || !supaKey) {
    return res.status(500).json({ success: false, message: 'Koneksi Supabase tidak ditemukan.' });
  }

  const supaHeaders = {
    'Content-Type': 'application/json',
    'apikey': supaKey,
    'Authorization': `Bearer ${supaKey}`
  };

  try {
    const queryUrl = poolId
      ? `${supaUrl}/rest/v1/runninghub_pool?id=eq.${poolId}&limit=1`
      : `${supaUrl}/rest/v1/runninghub_pool?status=eq.busy&limit=1`;

    const dbRes = await fetch(queryUrl, { headers: supaHeaders });
    const dbData = await dbRes.json().catch(() => []);
    const akunPool = (Array.isArray(dbData) && dbData.length > 0) ? dbData[0] : null;

    if (!akunPool) {
      return res.status(200).json({
        code: 807,
        status: "CANCELLED",
        msg: "Akun pool tidak ditemukan",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    const rhUserId = String(akunPool.user_id || akunPool.rh_user_id || akunPool.userid || "2088197555130155009");
    let accessToken = akunPool.access_token || akunPool.rh_access_token || akunPool.token;
    const refreshToken = akunPool.refresh_token || akunPool.rh_refresh_token;

    let cookieData = akunPool.cookie_data ? String(akunPool.cookie_data).replace(/[\r\n]+/g, ' ').trim() : "";
    if (!cookieData.includes('Rh-Accesstoken=')) {
      cookieData = `rh_locale=id; userLanguage=true; Rh-Accesstoken=${accessToken}; Rh-Refreshtoken=${refreshToken || ''}; userId=${rhUserId}; Rh-billing-uid=${rhUserId};`;
    }

    const headersWeb = {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Client": "WEB",
      "Authorization": `Bearer ${accessToken}`,
      "Rh-Accesstoken": accessToken,
      "Cookie": cookieData,
      "Origin": "https://www.runninghub.ai",
      "Referer": `https://www.runninghub.ai/id/ai-detail/${WAN_APP_ID}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "userId": rhUserId,
      "x-rh-lang": "id"
    };

    let videoUrl = null;
    let adaCatatanTask = false;
    let statusDariServer = "";

    // 1. Prioritas Utama: Tarik langsung dari Riwayat Galeri Output (/api/output/v2/history)
    try {
      const histRes = await fetch("https://www.runninghub.ai/api/output/v2/history", {
        method: "POST",
        headers: headersWeb,
        body: JSON.stringify({
          size: 20,
          current: 1,
          webappId: WAN_APP_ID,
          taskType: ["WORKFLOW", "WEBAPP"],
          fromId: ""
        })
      });
      const histText = await histRes.text();
      
      // Jika teks mentah respons riwayat mengandung ID tugas kita
      if (histText.includes(cleanTaskId)) {
        adaCatatanTask = true;
        videoUrl = cariSemuaLinkMp4(histText);
      } else {
        // Coba periksa apakah item paling atas di riwayat adalah hasil render terbaru
        const histJson = JSON.parse(histText).catch ? {} : JSON.parse(histText);
        const records = histJson?.data?.records || histJson?.data?.list || [];
        if (records.length > 0) {
          const itemTeratas = JSON.stringify(records[0]);
          if (itemTeratas.includes(cleanTaskId)) {
            adaCatatanTask = true;
            videoUrl = cariSemuaLinkMp4(itemTeratas);
          }
        }
      }
    } catch (e) {}

    // 2. Prioritas Kedua: Periksa status di /task/list
    if (!videoUrl) {
      try {
        const listRes = await fetch("https://www.runninghub.ai/task/list", {
          method: "POST",
          headers: headersWeb,
          body: JSON.stringify({
            size: 50,
            current: 1,
            webappId: WAN_APP_ID,
            taskType: ["WORKFLOW", "WEBAPP"]
          })
        });
        const listText = await listRes.text();

        if (listText.includes(cleanTaskId)) {
          adaCatatanTask = true;
          videoUrl = cariSemuaLinkMp4(listText);

          // Cek status eksplisit
          const listJson = JSON.parse(listText);
          const records = listJson?.data?.records || listJson?.data?.list || [];
          const taskObj = records.find(r => JSON.stringify(r).includes(cleanTaskId));
          if (taskObj) {
            statusDariServer = String(taskObj.status || taskObj.taskStatus || "").toUpperCase();
            if (!videoUrl) videoUrl = cariSemuaLinkMp4(JSON.stringify(taskObj));
          }
        }
      } catch (e) {}
    }

    // 3. KONDISI A: VIDEO DITEMUKAN (SELESAI)
    if (videoUrl) {
      const sisaKoinAkun = Number(akunPool.koin) || 0;
      await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({
          status: sisaKoinAkun >= 100 ? 'idle' : 'habis',
          last_used_at: new Date().toISOString()
        })
      }).catch(() => {});

      return res.status(200).json({
        code: 0,
        status: "SUCCESS",
        msg: "success",
        data: {
          status: "SUCCESS",
          taskId: cleanTaskId,
          url: videoUrl,
          fileUrl: videoUrl,
          videoUrl: videoUrl,
          outputFiles: [{ url: videoUrl }]
        }
      });
    }

    // 4. KONDISI B: TUGAS DIBATALKAN / HILANG DARI SERVER
    const isExplicitCancel = statusDariServer.includes("CANCEL") || statusDariServer.includes("BATAL") || statusDariServer.includes("STOP");
    if (!adaCatatanTask || isExplicitCancel) {
      await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({ status: 'idle', last_used_at: new Date().toISOString() })
      }).catch(() => {});

      return res.status(200).json({
        code: 807,
        status: "CANCELLED",
        msg: "Tugas dibatalkan atau tidak ditemukan di antrean server",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    // 5. KONDISI C: TUGAS MASIH BERJALAN NORMAL
    return res.status(200).json({
      code: 805,
      status: "RUNNING",
      msg: "Video sedang diproses",
      data: {
        status: "RUNNING",
        taskId: cleanTaskId,
        progress: 50
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
