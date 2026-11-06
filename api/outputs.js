// File: api/outputs.js
// Backend Proxy Vercel - Task Status & Result Fetcher (Web Session Account Pooling)

export const maxDuration = 30;

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
  // JALUR 1: KLING 2.6 MOTION CONTROL (PiAPI - TETAP AMAN)
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
    // 1. Ambil data kredensial akun yang sedang mengerjakan task ini
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

    const rhUserId = String(akunPool.user_id || akunPool.rh_user_id || akunPool.userid || "2088197555130155009");
    let accessToken = akunPool.access_token || akunPool.rh_access_token || akunPool.token;
    const refreshToken = akunPool.refresh_token || akunPool.rh_refresh_token;
    
    let cookieData = akunPool.cookie_data ? String(akunPool.cookie_data).replace(/[\r\n]+/g, ' ').trim() : "";
    if (!cookieData.includes('Rh-Accesstoken=')) {
      cookieData = `rh_locale=id; userLanguage=true; Rh-Accesstoken=${accessToken}; Rh-Refreshtoken=${refreshToken || ''}; userId=${rhUserId}; Rh-billing-uid=${rhUserId};`;
    }

    // 2. Fungsi tembak endpoint internal /task/list dengan proteksi fallback
    const fetchTaskList = async (tokenAktif, cookieAktif) => {
      const headersFull = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Client": "WEB",
        "Authorization": `Bearer ${tokenAktif}`,
        "Rh-Accesstoken": tokenAktif,
        "Cookie": cookieAktif,
        "Origin": "https://www.runninghub.ai",
        "Referer": "https://www.runninghub.ai/id/ai-detail/2101240461868802049",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "userId": rhUserId,
        "x-rh-lang": "id"
      };

      const targetUrls = [
        "https://www.runninghub.ai/task/list",
        "https://www.runninghub.ai/api/task/list"
      ];

      let lastResp = null;
      for (const url of targetUrls) {
        try {
          const resp = await fetch(url, {
            method: "POST",
            headers: headersFull,
            body: JSON.stringify({ page: 1, pageSize: 10, taskId: cleanTaskId })
          });
          if (resp.status !== 404) return resp;
          lastResp = resp;
        } catch (e) {
          lastResp = { ok: false, status: 500, json: async () => ({ message: e.message }) };
        }
      }
      return lastResp;
    };

    let rhRes = await fetchTaskList(accessToken, cookieData);
    let rhJson = await rhRes.json().catch(() => ({}));

    // Auto-refresh token jika sesi kedaluwarsa saat pengecekan
    if ((rhRes.status === 401 || rhJson?.code === 401 || rhJson?.msg?.toLowerCase().includes("token")) && refreshToken) {
      const tokenBaru = await refreshRhAccessToken(refreshToken, cookieData);
      if (tokenBaru) {
        accessToken = tokenBaru;
        cookieData = cookieData.replace(/Rh-Accesstoken=[^;]+/, `Rh-Accesstoken=${tokenBaru}`);

        await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
          method: 'PATCH',
          headers: supaHeaders,
          body: JSON.stringify({ access_token: tokenBaru, cookie_data: cookieData })
        });

        rhRes = await fetchTaskList(accessToken, cookieData);
        rhJson = await rhRes.json().catch(() => ({}));
      }
    }

    // 3. Ekstraksi daftar task dari respon RunningHub
    const listTask = rhJson?.data?.list || rhJson?.data?.records || rhJson?.data || [];
    let currentTask = null;

    if (Array.isArray(listTask) && listTask.length > 0) {
      currentTask = listTask.find(t => 
        String(t.taskId || t.id || t.taskUuid) === cleanTaskId
      ) || listTask[0];
    }

    if (!currentTask) {
      return res.status(200).json({
        code: 804,
        status: "QUEUED",
        message: "Tugas sedang mengantre di server RunningHub",
        data: { status: "QUEUED", taskId: cleanTaskId }
      });
    }

    // Normalisasi status pengerjaan
    const taskStatusRaw = String(currentTask.status || currentTask.taskStatus || "").toUpperCase();
    const isSuccess = taskStatusRaw.includes("SUCCESS") || taskStatusRaw === "2" || taskStatusRaw === "FINISH" || taskStatusRaw === "COMPLETED";
    const isFailed = taskStatusRaw.includes("FAIL") || taskStatusRaw.includes("ERR") || taskStatusRaw === "3";
    const isCancelled = taskStatusRaw.includes("CANCEL") || taskStatusRaw.includes("STOP");

    // Ambil URL file video hasil render
    const videoUrl = currentTask.outputFiles?.[0]?.url ||
                     currentTask.outputs?.[0]?.fileUrl ||
                     currentTask.outputs?.[0]?.url ||
                     currentTask.resultUrl ||
                     currentTask.results?.[0]?.url ||
                     currentTask.fileUrl ||
                     currentTask.url ||
                     null;

    // 4. PEMULIHAN STATUS AKUN SECARA CERDAS BERDASARKAN SISA KOIN
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

    // A. Tugas Berhasil (SUCCESS)
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
          resultUrl: videoUrl,
          outputFiles: [{ url: videoUrl }],
          results: [{ url: videoUrl }]
        }
      });
    }

    // B. Tugas Gagal (FAILED)
    if (isFailed) {
      return res.status(200).json({
        code: 500,
        status: "FAILED",
        msg: currentTask.errorMessage || currentTask.failedReason || "Render gagal di server ComfyUI",
        data: { status: "FAILED", taskId: cleanTaskId }
      });
    }

    // C. Tugas Dibatalkan (CANCELLED)
    if (isCancelled) {
      return res.status(200).json({
        code: 807,
        status: "CANCELLED",
        msg: "Tugas dibatalkan",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    // D. Masih Dalam Proses (RUNNING / QUEUED)
    return res.status(200).json({
      code: 805,
      status: "RUNNING",
      msg: "Video sedang diproses",
      data: {
        status: "RUNNING",
        taskId: cleanTaskId,
        progress: currentTask.progress || 0
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status render: ' + err.message
    });
  }
}
