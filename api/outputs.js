// File: api/outputs.js
// Backend Proxy Vercel - Task Status & Result Fetcher (Web Session DevTools Intercepted)

export const maxDuration = 30;

const WAN_APP_ID = "2101240461868802049";

// Helper refresh access token jika sesi web kedaluwarsa saat polling
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
  // JALUR 1: KLING 2.6 MOTION CONTROL (PiAPI)
  // =========================================================
  if (provider === 'kling' || cleanTaskId.includes('-')) {
    try {
      const PIAPI_KEY = process.env.PIAPI_KEY;
      if (!PIAPI_KEY) {
        return res.status(500).json({ success: false, message: 'PIAPI_KEY belum diset di environment Vercel.' });
      }
      const piRes = await fetch(`https://api.piapi.ai/api/v1/task/${cleanTaskId}`, {
        headers: { 'X-API-KEY': PIAPI_KEY }
      });
      const piJson = await piRes.json().catch(() => ({}));
      return res.status(200).json({ success: true, data: piJson.data || piJson });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // =========================================================
  // JALUR 2: RUNNINGHUB WEB SESSION TASK QUERY
  // =========================================================
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                  process.env.SUPABASE_SERVICE_ROLE ||
                  process.env.SUPABASE_KEY;

  if (!supaUrl || !supaKey) {
    return res.status(500).json({ success: false, message: 'Koneksi database Supabase tidak ditemukan.' });
  }

  const supaHeaders = {
    'Content-Type': 'application/json',
    'apikey': supaKey,
    'Authorization': `Bearer ${supaKey}`
  };

  let akunPool = null;

  try {
    const queryUrl = poolId
      ? `${supaUrl}/rest/v1/runninghub_pool?id=eq.${poolId}&limit=1`
      : `${supaUrl}/rest/v1/runninghub_pool?status=eq.busy&limit=1`;

    const dbRes = await fetch(queryUrl, { headers: supaHeaders });
    const dbData = await dbRes.json().catch(() => []);

    if (Array.isArray(dbData) && dbData.length > 0) {
      akunPool = dbData[0];
    }

    if (!akunPool) {
      return res.status(404).json({
        success: false,
        message: 'Akun pengerja tugas tidak ditemukan di runninghub_pool.'
      });
    }

    const rhUserId = String(akunPool.user_id || akunPool.rh_user_id || akunTerpilihUserId(akunPool));
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

    // 1. Cek daftar tugas aktif dan riwayat via /task/list sesuai rekaman DevTools
    const payloadTaskList = {
      size: 20,
      current: 1,
      webappId: WAN_APP_ID,
      taskType: ["WORKFLOW", "WEBAPP"]
    };

    let rhRes = await fetch("https://www.runninghub.ai/task/list", {
      method: "POST",
      headers: headersWeb,
      body: JSON.stringify(payloadTaskList)
    });
    let rhJson = await rhRes.json().catch(() => ({}));

    // Auto-refresh token jika sesi kedaluwarsa
    if ((rhRes.status === 401 || rhJson?.code === 401 || String(rhJson?.msg).toLowerCase().includes("token")) && refreshToken) {
      const tokenBaru = await refreshRhAccessToken(refreshToken, cookieData);
      if (tokenBaru) {
        accessToken = tokenBaru;
        cookieData = cookieData.replace(/Rh-Accesstoken=[^;]+/, `Rh-Accesstoken=${tokenBaru}`);
        headersWeb["Authorization"] = `Bearer ${tokenBaru}`;
        headersWeb["Rh-Accesstoken"] = tokenBaru;
        headersWeb["Cookie"] = cookieData;

        await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
          method: 'PATCH',
          headers: supaHeaders,
          body: JSON.stringify({ access_token: tokenBaru, cookie_data: cookieData })
        });

        rhRes = await fetch("https://www.runninghub.ai/task/list", {
          method: "POST",
          headers: headersWeb,
          body: JSON.stringify(payloadTaskList)
        });
        rhJson = await rhRes.json().catch(() => ({}));
      }
    }

    const records = rhJson?.data?.records || rhJson?.data?.list || [];
    let currentTask = records.find(t => String(t.taskId || t.id || t.taskUuid) === cleanTaskId);

    // 2. Jika tidak ada di /task/list, cek /api/output/v2/history (apakah sudah selesai dan masuk galeri)
    let videoUrl = null;
    if (!currentTask || !ekstrakVideoUrl(currentTask)) {
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
        const histJson = await histRes.json().catch(() => ({}));
        const histRecords = histJson?.data?.records || histJson?.data?.list || [];
        const taskHistory = histRecords.find(t => String(t.taskId || t.id || t.taskUuid) === cleanTaskId);
        if (taskHistory) {
          currentTask = taskHistory;
          videoUrl = ekstrakVideoUrl(taskHistory);
        }
      } catch (e) {}
    } else {
      videoUrl = ekstrakVideoUrl(currentTask);
    }

    // 3. Deteksi Jika Tugas Dibatalkan atau Dihapus dari Server
    // Jika records sudah berisi tugas-tugas lain, tetapi cleanTaskId hilang sama sekali dan tidak ada di riwayat
    const isHilangDariAntrean = (!currentTask && records.length > 0);
    const taskStatusRaw = String(currentTask?.status || currentTask?.taskStatus || "").toUpperCase();
    const isCancelled = isHilangDariAntrean || 
                        taskStatusRaw.includes("CANCEL") || 
                        taskStatusRaw.includes("BATAL") || 
                        taskStatusRaw.includes("STOP") || 
                        taskStatusRaw.includes("TERMINAT") || 
                        taskStatusRaw.includes("ABORT");

    const isSuccess = taskStatusRaw.includes("SUCCESS") || taskStatusRaw === "2" || taskStatusRaw === "FINISH" || Boolean(videoUrl);
    const isFailed = taskStatusRaw.includes("FAIL") || taskStatusRaw.includes("ERR") || taskStatusRaw === "3";

    // 4. Sinkronisasi Pembebasan Akun Kolam ke Supabase
    if (isSuccess || isFailed || isCancelled) {
      const sisaKoinAkun = Number(akunPool.koin) || 0;
      const statusBaru = sisaKoinAkun >= 100 ? 'idle' : 'habis';

      await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({
          status: statusBaru,
          last_used_at: new Date().toISOString()
        })
      }).catch(() => {});
    }

    // KASUS A: Tugas Berhasil Selesai
    if (isSuccess && videoUrl) {
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

    // KASUS B: Tugas Dibatalkan (Langsung Picu Refund & Setop Loading)
    if (isCancelled) {
      return res.status(200).json({
        code: 807,
        status: "CANCELLED",
        msg: "Tugas telah dibatalkan di server RunningHub",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    // KASUS C: Tugas Gagal
    if (isFailed) {
      return res.status(200).json({
        code: 500,
        status: "FAILED",
        msg: currentTask?.errorMessage || currentTask?.failedReason || "Render gagal di server studio",
        data: { status: "FAILED", taskId: cleanTaskId }
      });
    }

    // KASUS D: Tugas Masih Mengantre atau Sedang Berjalan
    const statusTeks = taskStatusRaw.includes("QUEUED") ? "QUEUED" : "RUNNING";
    return res.status(200).json({
      code: statusTeks === "QUEUED" ? 804 : 805,
      status: statusTeks,
      msg: statusTeks === "QUEUED" ? "Mengantre di antrean server" : "Video sedang diproses",
      data: {
        status: statusTeks,
        taskId: cleanTaskId,
        progress: currentTask?.progress || 0
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status render: ' + err.message
    });
  }
}

function akunTerpilihUserId(akun) {
  return akun.user_id || akun.rh_user_id || akun.userid || "2088197555130155009";
}

function ekstrakVideoUrl(task) {
  if (!task) return null;
  return task.outputFiles?.[0]?.url ||
         task.outputs?.[0]?.fileUrl ||
         task.outputs?.[0]?.url ||
         task.resultUrl ||
         task.results?.[0]?.url ||
         task.fileUrl ||
         task.videoUrl ||
         task.url ||
         null;
}
