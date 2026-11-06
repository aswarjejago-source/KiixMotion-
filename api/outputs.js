// File: api/outputs.js
// Backend Proxy Vercel - Task Status & Safe BigInt Result Fetcher

export const maxDuration = 30;

const WAN_APP_ID = "2101240461868802049";

// Helper agar angka 19-digit RunningHub tidak rusak oleh floating point JavaScript
function parseJsonAman(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};
  try {
    const textAman = rawText.replace(/:\s*(\d{16,})/g, ': "$1"');
    return JSON.parse(textAman);
  } catch (e) {
    try { return JSON.parse(rawText); } catch (err) { return {}; }
  }
}

// Pelacak link video MP4 rekursif
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

function cocokkanTask(item, targetId) {
  if (!item || !targetId) return false;
  const sTarget = String(targetId).trim();
  if (String(item.taskId || '').trim() === sTarget) return true;
  if (String(item.task_id || '').trim() === sTarget) return true;
  if (String(item.id || '').trim() === sTarget) return true;
  if (String(item.taskUuid || '').trim() === sTarget) return true;
  return false;
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

  // PiAPI / Kling
  if (provider === 'kling' || cleanTaskId.includes('-')) {
    try {
      const PIAPI_KEY = process.env.PIAPI_KEY;
      if (!PIAPI_KEY) return res.status(500).json({ success: false, message: 'PIAPI_KEY belum diset.' });
      const piRes = await fetch(`https://api.piapi.ai/api/v1/task/${cleanTaskId}`, { headers: { 'X-API-KEY': PIAPI_KEY } });
      const piJson = await piRes.json().catch(() => ({}));
      return res.status(200).json({ success: true, data: piJson.data || piJson });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // RunningHub
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
    const accessToken = akunPool.access_token || akunPool.rh_access_token || akunPool.token;
    let cookieData = akunPool.cookie_data ? String(akunPool.cookie_data).replace(/[\r\n]+/g, ' ').trim() : "";
    if (!cookieData.includes('Rh-Accesstoken=')) {
      cookieData = `rh_locale=id; userLanguage=true; Rh-Accesstoken=${accessToken}; userId=${rhUserId}; Rh-billing-uid=${rhUserId};`;
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
    let currentTask = null;

    // 1. Cek langsung ke Galeri Output (/api/output/v2/history)[span_7](start_span)[span_7](end_span)
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
      const histJson = parseJsonAman(histText);
      const histRecords = histJson?.data?.records || histJson?.data?.list || [];

      // Cari task ID atau ambil record terbaru jika ID cocok dalam teks mentah
      currentTask = histRecords.find(t => cocokkanTask(t, cleanTaskId));
      if (!currentTask && histText.includes(cleanTaskId) && histRecords.length > 0) {
        currentTask = histRecords[0];
      }
      if (currentTask) {
        videoUrl = cariVideoUrlMurni(currentTask);
      }
    } catch (e) {}

    // 2. Jika belum ada di riwayat, cek daftar antrean (/task/list)[span_8](start_span)[span_8](end_span)
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
        const listJson = parseJsonAman(listText);
        const records = listJson?.data?.records || listJson?.data?.list || [];

        currentTask = records.find(t => cocokkanTask(t, cleanTaskId));
        if (currentTask) {
          videoUrl = cariVideoUrlMurni(currentTask);
        }
      } catch (e) {}
    }

    // A. JIKA VIDEO DITEMUKAN (SELESAI)
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

    // B. JIKA TUGAS TIDAK ADA DI MANAPUN (Dihapus / Dibatalkan di RunningHub)
    if (!currentTask) {
      return res.status(200).json({
        code: 807,
        status: "CANCELLED",
        msg: "Tugas tidak ditemukan atau telah dibatalkan di server",
        data: { status: "CANCELLED", taskId: cleanTaskId }
      });
    }

    // C. JIKA MASIH BERJALAN DI SERVER
    return res.status(200).json({
      code: 805,
      status: "RUNNING",
      msg: "Video sedang diproses",
      data: {
        status: "RUNNING",
        taskId: cleanTaskId,
        progress: currentTask?.progress || 35
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
