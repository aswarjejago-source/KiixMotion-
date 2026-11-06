// File: api/outputs.js
// Backend Proxy Vercel - Task Status & Deep Video Result Extractor

export const maxDuration = 30;

const WAN_APP_ID = "2101240461868802049";

// Mesin pelacak link video rekursif (Mencari MP4 di node ComfyUI / Output / History)
function cariVideoUrlMurni(obj) {
  if (!obj) return null;
  let linkVideoUtama = null;
  let linkFallback = null;

  function periksaDanAmbil(str) {
    if (!str || typeof str !== 'string') return;
    const clean = str.trim().replace(/\\/g, '');
    if (clean.includes('workers.dev') || clean.includes('kiix-uploader')) return;

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const lower = clean.toLowerCase();
      const isFormatVideo = lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.webm') || lower.includes('.m4v');
      const isDomainRunningHub = clean.includes('rh-images') || clean.includes('xiaoyaoyou') || clean.includes('myqcloud') || clean.includes('runninghub');

      const httpsUrl = clean.replace(/^http:\/\//i, 'https://');

      if (isFormatVideo) {
        linkVideoUtama = httpsUrl;
      } else if (isDomainRunningHub && !linkFallback && !lower.includes('.jpg') && !lower.includes('.png')) {
        linkFallback = httpsUrl;
      }
    }
  }

  function telusuri(item) {
    if (!item || linkVideoUtama) return;
    if (typeof item === 'string') {
      periksaDanAmbil(item);
    } else if (Array.isArray(item)) {
      for (let i = 0; i < item.length; i++) {
        telusuri(item[i]);
        if (linkVideoUtama) break;
      }
    } else if (typeof item === 'object') {
      const kunciPrioritas = ['videoUrl', 'video_url', 'fileUrl', 'file_url', 'downloadUrl', 'url', 'resultUrl', 'previewUrl', 'ossUrl', 'path'];
      for (const k of kunciPrioritas) {
        if (item[k]) {
          telusuri(item[k]);
          if (linkVideoUtama) return;
        }
      }
      const keys = Object.keys(item);
      for (let j = 0; j < keys.length; j++) {
        telusuri(item[keys[j]]);
        if (linkVideoUtama) break;
      }
    }
  }

  telusuri(obj);
  return linkVideoUtama || linkFallback;
}

// Helper pencocokan task ID secara fleksibel
function cocokkanTask(item, targetId) {
  if (!item || !targetId) return false;
  const sTarget = String(targetId).trim();
  if (String(item.taskId || '').trim() === sTarget) return true;
  if (String(item.task_id || '').trim() === sTarget) return true;
  if (String(item.id || '').trim() === sTarget) return true;
  if (String(item.taskUuid || '').trim() === sTarget) return true;
  try {
    if (JSON.stringify(item).includes(sTarget)) return true;
  } catch (e) {}
  return false;
}

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
        return res.status(500).json({ success: false, message: 'PIAPI_KEY belum diset.' });
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
      return res.status(200).json({
        code: 805,
        status: "RUNNING",
        msg: "Video sedang diproses",
        data: { status: "RUNNING", taskId: cleanTaskId, progress: 15 }
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

    // 1. Cek antrean tugas di RunningHub via /task/list
    let currentTask = null;
    let videoUrl = null;

    try {
      const resList = await fetch("https://www.runninghub.ai/task/list", {
        method: "POST",
        headers: headersWeb,
        body: JSON.stringify({
          size: 50,
          current: 1,
          webappId: WAN_APP_ID,
          taskType: ["WORKFLOW", "WEBAPP"]
        })
      });
      const jsonList = await resList.json().catch(() => ({}));
      const records = jsonList?.data?.records || jsonList?.data?.list || [];
      currentTask = records.find(t => cocokkanTask(t, cleanTaskId));
      if (currentTask) {
        videoUrl = cariVideoUrlMurni(currentTask);
      }
    } catch (e) {}

    // 2. Jika link video belum ditemukan dari /task/list, periksa galeri /api/output/v2/history
    if (!videoUrl) {
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
        
        // Cari tugas berdasarkan ID di riwayat
        const taskHistory = histRecords.find(t => cocokkanTask(t, cleanTaskId));
        if (taskHistory) {
          currentTask = currentTask || taskHistory;
          videoUrl = cariVideoUrlMurni(taskHistory);
        } else if (histRecords.length > 0) {
          // Fallback: Jika ID tersembunyi di dalam meta, uji record output paling atas
          const candidateUrl = cariVideoUrlMurni(histRecords[0]);
          if (candidateUrl && cocokkanTask(histRecords[0], cleanTaskId)) {
            videoUrl = candidateUrl;
            currentTask = currentTask || histRecords[0];
          }
        }
      } catch (e) {}
    }

    // Normalisasi status pengerjaan
    const taskStatusRaw = String(currentTask?.status || currentTask?.taskStatus || "").toUpperCase();
    const taskMsgRaw = String(currentTask?.errorMessage || currentTask?.failedReason || "").toUpperCase();

    const isSuccess = Boolean(videoUrl) || taskStatusRaw.includes("SUCCESS") || taskStatusRaw === "2" || taskStatusRaw === "FINISH";
    const isExplicitCancel = taskStatusRaw.includes("CANCEL") || taskStatusRaw.includes("BATAL") || taskStatusRaw.includes("STOP") || taskMsgRaw.includes("CANCEL");
    const isExplicitFail = taskStatusRaw.includes("FAIL") || taskStatusRaw.includes("ERR") || taskStatusRaw === "3";

    // 3. JIKA SUKSES / VIDEO SUDAH KELUAR
    if (videoUrl || (isSuccess && videoUrl)) {
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
          downloadUrl: videoUrl,
          outputFiles: [{ url: videoUrl }]
        }
      });
    }

    // 4. JIKA DIBATALKAN EKSPLISIT
    if (isExplicitCancel) {
      await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({ status: 'idle', last_used_at: new Date().toISOString() })
      }).catch(() => {});

      return res.status(200).json({
        code: 807,
        status: "CANCELLED",
        msg: "Tugas dibatalkan di server",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    // 5. JIKA GAGAL EKSPLISIT
    if (isExplicitFail) {
      await fetch(`${supaUrl}/rest/v1/runninghub_pool?id=eq.${akunPool.id}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({ status: 'idle', last_used_at: new Date().toISOString() })
      }).catch(() => {});

      return res.status(200).json({
        code: 500,
        status: "FAILED",
        msg: currentTask?.errorMessage || "Render gagal di server",
        data: { status: "FAILED", taskId: cleanTaskId }
      });
    }

    // 6. DEFAULT: MASIH PROSES
    return res.status(200).json({
      code: 805,
      status: "RUNNING",
      msg: "Video sedang diproses",
      data: {
        status: "RUNNING",
        taskId: cleanTaskId,
        progress: currentTask?.progress || 25
      }
    });

  } catch (err) {
    return res.status(200).json({
      code: 805,
      status: "RUNNING",
      msg: "Sedang menyinkronkan data",
      data: { status: "RUNNING", taskId: cleanTaskId, progress: 15 }
    });
  }
}
