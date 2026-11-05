// File: api/outputs.js
// Backend Proxy Vercel - Task Status & Result Fetcher (Web Session Account Pooling)

export const maxDuration = 30;

// Helper refresh access token jika sesi web kedaluwarsa saat polling
async function refreshRhAccessToken(refreshToken, oldCookie) {
  try {
    const res = await fetch("https://www.runninghub.ai/api/uc/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "client": "WEB",
        "cookie": oldCookie || `Rh-Refreshtoken=${refreshToken}`
      },
      body: JSON.stringify({ refreshToken })
    });
    const data = await res.json().catch(() => ({}));
    return data?.data?.accessToken || data?.data?.token || data?.accessToken || null;
  } catch (e) {
    return null;
  }
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

    const rhUserId = akunPool.user_id || akunPool.rh_user_id || akunPool.userid;
    let accessToken = akunPool.access_token || akunPool.rh_access_token || akunPool.token;
    const refreshToken = akunPool.refresh_token || akunPool.rh_refresh_token;
    let cookieData = akunPool.cookie_data || akunPool.cookie || 
      `rh_locale=id; userLanguage=true; Rh-Accesstoken=${accessToken}; Rh-Refreshtoken=${refreshToken || ''}; userId=${rhUserId}; Rh-Identify=df0dec23b434a3a7de18ce75aef334b5;`;

    // 2. Fungsi tembak endpoint internal /task/list
    const fetchTaskList = async (tokenAktif, cookieAktif) => {
      return await fetch("https://www.runninghub.ai/task/list", {
        method: "POST",
        headers: {
          "authority": "www.runninghub.ai",
          "accept": "application/json, text/plain, */*",
          "content-type": "application/json",
          "client": "WEB",
          "authorization": `Bearer ${tokenAktif}`,
          "cookie": cookieAktif,
          "origin": "https://www.runninghub.ai",
          "referer": "https://www.runninghub.ai/id/ai-detail/2101240461868802049",
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
          "userid": String(rhUserId),
          "x-rh-lang": "id"
        },
        body: JSON.stringify({ page: 1, pageSize: 10 })
      });
    };

    let rhRes = await fetchTaskList(accessToken, cookieData);
    let rhJson = await rhRes.json().catch(() => ({}));

    // Auto-refresh token jika sesi kedaluwarsa saat pengecekan
    if ((rhRes.status === 401 || rhJson?.code === 401) && refreshToken) {
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
      // Cocokkan taskId, jika tidak ketemu ambil task teratas (paling baru)
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
    const isSuccess = taskStatusRaw.includes("SUCCESS") || taskStatusRaw === "2" || taskStatusRaw === "FINISH";
    const isFailed = taskStatusRaw.includes("FAIL") || taskStatusRaw.includes("ERR") || taskStatusRaw === "3";
    const isCancelled = taskStatusRaw.includes("CANCEL") || taskStatusRaw.includes("STOP");

    // Ambil URL file video hasil render
    const videoUrl = currentTask.outputFiles?.[0]?.url ||
                     currentTask.outputs?.[0]?.fileUrl ||
                     currentTask.resultUrl ||
                     currentTask.results?.[0]?.url ||
                     currentTask.fileUrl ||
                     currentTask.url ||
                     null;

    // 4. KEMBALIKAN STATUS AKUN KE IDLE JIKA RENDER TELAH SELESAI
    if (isSuccess || isFailed || isCancelled) {
      await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({
          status: 'idle',
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
