// File: api/generate.js
// Backend Proxy Vercel - KiixMotion Single Credit Engine (Web Session Account Pooling)

export const maxDuration = 60;

const EMAIL_OWNER = "anggraingki@gmail.com";

// Helper refresh access token jika sesi web kedaluwarsa (401)
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

  const {
    urlBahanFoto,
    urlBahanVideo,
    provider,
    userId,
    userEmail,
    prompt,
    images,
    duration,
    aspectRatio
  } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Sesi login tidak valid. Silakan login ulang.' });
  }

  const cleanUserId = String(userId).trim();

  // Validasi input
  if (provider === 'minimax') {
    if ((!images || images.length === 0) && !urlBahanFoto) {
      return res.status(400).json({ success: false, message: 'Minimal unggah 1 foto karakter untuk MiniMax H3.' });
    }
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt / skrip aksi MiniMax H3 wajib diisi.' });
    }
  } else if (provider !== 'kling') {
    if (!urlBahanFoto || !urlBahanVideo) {
      return res.status(400).json({ success: false, message: 'Bahan foto dan video wajib diisi.' });
    }
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                                process.env.SUPABASE_SERVICE_ROLE || 
                                process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ success: false, message: 'Koneksi database Supabase tidak terbaca pada konfigurasi Vercel.' });
  }

  const supaHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
  };

  // =========================================================
  // JALUR OWNER: KLING 2.6 MOTION CONTROL (TIDAK DIUBAH)
  // =========================================================
  if (provider === 'kling') {
    let emailTerverifikasi = (userEmail || "").trim().toLowerCase();

    if (!emailTerverifikasi && cleanUserId) {
      try {
        const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${cleanUserId}&select=email`, { headers: supaHeaders });
        const profData = await profRes.json().catch(() => []);
        if (Array.isArray(profData) && profData[0]?.email) {
          emailTerverifikasi = profData[0].email.trim().toLowerCase();
        }
      } catch (e) {}
    }

    if (emailTerverifikasi !== EMAIL_OWNER.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `Fitur Kling 2.6 hanya boleh digunakan oleh Owner (${EMAIL_OWNER}).`
      });
    }

    const PIAPI_KEY = process.env.PIAPI_KEY;
    if (!PIAPI_KEY) {
      return res.status(500).json({
        success: false,
        message: 'PIAPI_KEY belum diset di Environment Variables Vercel.'
      });
    }

    try {
      const piapiPayload = {
        model: "kling",
        task_type: "motion_control",
        input: {
          image_url: urlBahanFoto.trim(),
          video_url: urlBahanVideo.trim(),
          version: "2.6",
          mode: "std",
          motion_direction: "video",
          keep_original_sound: false,
          duration: 5,
          prompt: prompt || "High quality cinematic motion capture, smooth movement, realistic studio lighting"
        }
      };

      const piapiRes = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': PIAPI_KEY },
        body: JSON.stringify(piapiPayload)
      });

      const piapiJson = await piapiRes.json().catch(() => ({}));
      const idTugas = piapiJson?.task_id || piapiJson?.data?.task_id;

      if (idTugas) {
        return res.status(200).json({ success: true, taskId: idTugas, poolId: null, didDeductCredit: false, provider: 'kling' });
      } else {
        throw new Error(piapiJson?.message || "PiAPI menolak tugas.");
      }
    } catch (errKling) {
      return res.status(500).json({ success: false, message: 'Koneksi ke PiAPI gagal: ' + errKling.message });
    }
  }

  // =========================================================
  // JALUR POOL AKUN KIIXMOTION (WEB SESSION POOLING)
  // =========================================================
  let poolIdDipakai = null;
  let didDeductCredit = false;

  try {
    // 1. Potong 1 kredit member KiixMotion
    const potongRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/potong_kredit_member`, {
      method: 'POST',
      headers: supaHeaders,
      body: JSON.stringify({ target_user_id: cleanUserId })
    });

    const potongJson = await potongRes.json().catch(() => ({}));
    
    if (!potongRes.ok || potongJson?.success !== true) {
      const pesanErrorAsli = potongJson?.pesan || 
                             potongJson?.message || 
                             potongJson?.hint || 
                             potongJson?.details || 
                             (typeof potongJson === 'string' ? potongJson : null) || 
                             'Gagal memvalidasi atau memotong kredit akun.';
      return res.status(400).json({ success: false, message: pesanErrorAsli });
    }
    didDeductCredit = true;

    // 2. Ambil akun idle yang memiliki minimal 100 koin RunningHub
    let poolRes = await fetch(
      `${SUPABASE_URL}/rest/v1/runninghub_pool?status=eq.idle&koin=gte.100&order=last_used_at.asc.nullsfirst,koin.desc&limit=1`,
      { headers: supaHeaders }
    );
    let poolData = await poolRes.json().catch(() => []);

    // Fallback jika tidak ada yang >= 100 koin, coba ambil akun idle apa saja
    if (!Array.isArray(poolData) || poolData.length === 0) {
      const fallbackRes = await fetch(
        `${SUPABASE_URL}/rest/v1/runninghub_pool?status=eq.idle&order=last_used_at.asc.nullsfirst,koin.desc&limit=1`,
        { headers: supaHeaders }
      );
      poolData = await fallbackRes.json().catch(() => []);
    }

    if (!Array.isArray(poolData) || poolData.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/refund_kredit_member`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({ target_user_id: cleanUserId })
      }).catch(() => {});

      return res.status(503).json({
        success: false,
        message: 'TASK_QUEUE_MAXED: Seluruh akun kolam sedang sibuk merender atau kehabisan koin. 1 kredit telah dikembalikan otomatis.'
      });
    }

    const akunTerpilih = poolData[0];
    poolIdDipakai = akunTerpilih.id;

    // Ekstraksi kredensial sesi web akun terpilih
    const rhUserId = akunTerpilih.user_id || akunTerpilih.rh_user_id || akunTerpilih.userid;
    let accessToken = akunTerpilih.access_token || akunTerpilih.rh_access_token || akunTerpilih.token || akunTerpilih.api_key;
    const refreshToken = akunTerpilih.refresh_token || akunTerpilih.rh_refresh_token || null;
    let cookieData = akunTerpilih.cookie_data || akunTerpilih.cookie || 
      `rh_locale=id; userLanguage=true; Rh-Accesstoken=${accessToken}; Rh-Refreshtoken=${refreshToken || ''}; userId=${rhUserId}; Rh-Identify=df0dec23b434a3a7de18ce75aef334b5;`;

    // Tandai status akun menjadi busy
    await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
      method: 'PATCH',
      headers: supaHeaders,
      body: JSON.stringify({ status: 'busy', last_used_at: new Date().toISOString() })
    });

    // =========================================================
    // EKSEKUSI TRANSFER GERAKAN (INTERNAL WEBAPP-RUN)
    // =========================================================
    const WAN_APP_ID = "2101240461868802049";
    const CAMERA_STABILIZER_PROMPT = "Camera locked on tripod, perfectly stable camera, no camera shake, no handheld movement, no jitter, no vibration, no zoom in, no zoom out, no dolly movement, no camera panning, no camera rotation, no camera tilt, fixed framing, static shot, consistent composition, cinematic realism, sharp focus at all times, subject always in focus, no focus breathing, no autofocus hunting, no motion blur, no lens blur, no depth of field blur, ultra clear details, crisp image quality, smooth natural motion, professional studio camera, stable video capture, high detail, high realism.\nNegative Prompt:\ncamera shake, handheld camera, jitter, vibration, zoom in, zoom out, camera movement, panning, tilting, rotating, dolly shot, motion blur, lens blur, focus blur, out of focus, autofocus, focus breathing, shaky footage, cinematic blur, depth of field blur, low quality, ghosting, distortion.";

    // Susun parameter input ComfyUI asli
    const payloadWebapp = {
      webappId: WAN_APP_ID,
      inputs: [
        {
          nodeId: "30",
          fieldName: "image",
          fieldValue: urlBahanFoto.trim()
        },
        {
          nodeId: "33",
          fieldName: "video",
          fieldValue: urlBahanVideo.trim()
        },
        {
          nodeId: "275",
          fieldName: "text",
          fieldValue: prompt || CAMERA_STABILIZER_PROMPT
        }
      ]
    };

    const kirimRequestKeRunningHub = async (tokenAktif, cookieAktif) => {
      return await fetch("https://www.runninghub.ai/api/workflow/webapp-run", {
        method: "POST",
        headers: {
          "authority": "www.runninghub.ai",
          "accept": "application/json, text/plain, */*",
          "content-type": "application/json",
          "client": "WEB",
          "authorization": `Bearer ${tokenAktif}`,
          "cookie": cookieAktif,
          "origin": "https://www.runninghub.ai",
          "referer": `https://www.runninghub.ai/id/ai-detail/${WAN_APP_ID}`,
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
          "userid": String(rhUserId),
          "x-rh-lang": "id"
        },
        body: JSON.stringify(payloadWebapp)
      });
    };

    let rhRes = await kirimRequestKeRunningHub(accessToken, cookieData);
    let rhJson = await rhRes.json().catch(() => ({}));

    // Auto-refresh jika token kedaluwarsa (401 atau kode autentikasi gagal)
    if ((rhRes.status === 401 || rhJson?.code === 401 || rhJson?.msg?.toLowerCase().includes("token")) && refreshToken) {
      const tokenBaru = await refreshRhAccessToken(refreshToken, cookieData);
      if (tokenBaru) {
        accessToken = tokenBaru;
        cookieData = cookieData.replace(/Rh-Accesstoken=[^;]+/, `Rh-Accesstoken=${tokenBaru}`);
        
        // Simpan token baru ke database Supabase
        await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
          method: 'PATCH',
          headers: supaHeaders,
          body: JSON.stringify({
            access_token: tokenBaru,
            cookie_data: cookieData
          })
        });

        // Tembak ulang render dengan token baru
        rhRes = await kirimRequestKeRunningHub(accessToken, cookieData);
        rhJson = await rhRes.json().catch(() => ({}));
      }
    }

    const taskId = rhJson?.data?.taskId || rhJson?.taskId || rhJson?.data?.task_id || (typeof rhJson?.data === 'string' ? rhJson.data : null);

    if ((rhRes.ok || rhJson?.code === 0 || rhJson?.code === 200) && taskId) {
      // Potong 100 koin di database untuk akun ini
      const sisaKoin = Math.max(0, (akunTerpilih.koin || 700) - 100);
      await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({
          koin: sisaKoin,
          last_used_at: new Date().toISOString()
        })
      });

      return res.status(200).json({
        success: true,
        taskId: typeof taskId === 'string' ? taskId : JSON.stringify(taskId),
        poolId: poolIdDipakai,
        didDeductCredit: true,
        provider: 'kiix'
      });
    } else {
      throw new Error(rhJson?.msg || rhJson?.errorMessage || rhJson?.message || 'Server AI RunningHub menolak task antrean.');
    }

  } catch (error) {
    // Refund kredit pengguna jika gagal
    if (didDeductCredit && cleanUserId) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/refund_kredit_member`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({ target_user_id: cleanUserId })
      }).catch(() => {});
    }

    // Kembalikan status akun kolam menjadi idle jika gagal
    if (poolIdDipakai) {
      await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({ status: 'idle', last_used_at: new Date().toISOString() })
      }).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memproses render ke server.'
    });
  }
}
