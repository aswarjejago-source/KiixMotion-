// File: api/generate.js
// Backend Proxy Vercel - KiixMotion Secure Engine (Gatekeeper VIP & Worker Ready)

export const maxDuration = 60; // Beri waktu backend memproses file besar

// 1. Ekstrak nama/path file dari link Supabase (cadangan jika masih ada link lama)
function ambilPathDariUrl(publicUrl) {
  try {
    if (!publicUrl || typeof publicUrl !== 'string') return null;
    const parts = publicUrl.split('/bahan-render/');
    return parts[1] ? decodeURIComponent(parts[1]) : null;
  } catch (e) {
    return null;
  }
}

// 2. Oper file dari URL luar ke RunningHub (hanya jalan jika bahan berupa link http/https)
async function uploadKeEngineServer(fileUrl, fileType, apiKey) {
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error("Gagal mengambil bahan dari storage Supabase.");
  const arrayBuffer = await fileRes.arrayBuffer();
  const blob = new Blob([arrayBuffer]);

  const formData = new FormData();
  const ext = fileType === 'video' ? 'mp4' : 'jpg';
  formData.append('file', blob, `bahan_${Date.now()}.${ext}`);
  formData.append('apiKey', apiKey);
  formData.append('fileType', fileType);

  const rhRes = await fetch('https://www.runninghub.ai/task/openapi/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData
  });

  const rhJson = await rhRes.json();
  let serverFile = null;
  if (rhJson && (rhJson.code === 0 || rhJson.code === 200 || rhJson.data)) {
    if (typeof rhJson.data === 'string') serverFile = rhJson.data;
    else if (rhJson.data && typeof rhJson.data === 'object') {
      serverFile = rhJson.data.fileName || rhJson.data.fileUrl || rhJson.data.url || rhJson.data.path;
    }
  }
  if (!serverFile) throw new Error(rhJson?.msg || "Engine menolak file bahan.");
  return serverFile;
}

// 3. Filter cerdas: jika sudah diunggah oleh Cloudflare Worker, pakai langsung ID-nya
async function siapkanBahan(bahan, fileType, apiKey) {
  if (typeof bahan === 'string' && (bahan.startsWith('api/') || !bahan.startsWith('http'))) {
    return bahan; // Sudah berbentuk ID RunningHub, langsung lolos tanpa fetch ulang
  }
  return await uploadKeEngineServer(bahan, fileType, apiKey);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const {
    urlBahanFoto,
    urlBahanVideo,
    provider,
    apiKeyPribadi,
    userId
  } = req.body;

  if (!urlBahanFoto || !urlBahanVideo) {
    return res.status(400).json({ success: false, message: 'Bahan foto dan video wajib diisi.' });
  }

  const RUNNINGHUB_WORKFLOW_ID = "2099509417535340546";
  const SUPABASE_URL = process.env.SUPABASE_URL || "https://fytvyupwcburmdsulosm.supabase.co";
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  let apiKeyDipakai = null;
  let poolIdDipakai = null;
  let didDeductCredit = false;

  try {
    // A. JALUR PRO / KUNCI PRIBADI (DIGEMBOK: WAJIB MEMBER VIP/PRO AKTIF)
    if (provider === 'runninghub' || provider === 'pro' || provider === 'custom') {
      if (!apiKeyPribadi) {
        return res.status(400).json({ success: false, message: 'Kunci API pribadi belum dipilih atau kosong.' });
      }

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid. Silakan login ulang.' });
      }

      // Validasi status VIP langsung ke tabel users Supabase via Service Role
      const userRes = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
          }
        }
      );

      const userData = await userRes.json();
      const user = userData?.[0];

      // Periksa apakah user punya status Pro / VIP aktif
      const isMemberPro = user && (
        user.is_vip === true ||
        user.is_pro === true ||
        user.role === 'pro' ||
        user.role === 'vip' ||
        user.status === 'pro' ||
        user.status === 'vip'
      );

      if (!isMemberPro) {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak! Fitur RunningHub Pro (Custom Key) khusus member yang berlangganan VIP.'
        });
      }

      apiKeyDipakai = apiKeyPribadi;
    } 
    // B. JALUR KIIX KREDIT
    else {
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid.' });
      }

      // Potong kredit member
      const potongRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/potong_kredit_member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        },
        body: JSON.stringify({ target_user_id: String(userId) })
      });

      const potongJson = await potongRes.json();
      if (!potongRes.ok || potongJson?.success !== true) {
        return res.status(400).json({
          success: false,
          message: potongJson?.pesan || 'Sisa kredit kamu habis atau tidak mencukupi.'
        });
      }
      didDeductCredit = true;

      // Ambil kunci idle dari pool admin
      const poolRes = await fetch(
        `${SUPABASE_URL}/rest/v1/runninghub_pool?status=eq.idle&koin=gte.200&order=koin.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
          }
        }
      );
      const poolData = await poolRes.json();

      if (!poolData || poolData.length === 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/refund_kredit_member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
          },
          body: JSON.stringify({ target_user_id: String(userId) })
        });

        return res.status(503).json({
          success: false,
          message: 'Semua server KiixMotion sedang sibuk. 1 kredit telah dikembalikan.'
        });
      }

      apiKeyDipakai = poolData[0].api_key;
      poolIdDipakai = poolData[0].id;

      await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        },
        body: JSON.stringify({ status: 'busy', last_used_at: new Date().toISOString() })
      });
    }

    // C. GUNAKAN BAHAN SECARA LANGSUNG (BYPASS UPLOAD JIKA SUDAH ADA ID DARI CLOUDFLARE)
    const [rhFoto, rhVideo] = await Promise.all([
      siapkanBahan(urlBahanFoto, 'image', apiKeyDipakai),
      siapkanBahan(urlBahanVideo, 'video', apiKeyDipakai)
    ]);

    // D. PEMBERSIHAN STORAGE SUPABASE (Jika masih ada sisa file lama)
    const pathFoto = ambilPathDariUrl(urlBahanFoto);
    const pathVideo = ambilPathDariUrl(urlBahanVideo);
    const fileHapus = [pathFoto, pathVideo].filter(Boolean);

    if (fileHapus.length > 0) {
      fetch(`${SUPABASE_URL}/storage/v1/object/bahan-render`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        },
        body: JSON.stringify({ prefixes: fileHapus })
      }).catch((e) => console.error("Gagal auto-delete Supabase:", e));
    }

    // E. EKSEKUSI TASK RENDER KE ENGINE RUNNINGHUB
    const enginePayload = {
      workflowId: RUNNINGHUB_WORKFLOW_ID,
      apiKey: apiKeyDipakai,
      nodeInfoList: [
        { nodeId: "30", fieldName: "image", fieldValue: rhFoto },
        { nodeId: "33", fieldName: "video", fieldValue: rhVideo },
        { nodeId: "308", fieldName: "upscale_method", fieldValue: "bicubic" }
      ]
    };

    const engineRes = await fetch('https://www.runninghub.ai/task/openapi/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyDipakai}`
      },
      body: JSON.stringify(enginePayload)
    });

    const engineData = await engineRes.json();

    if (engineData && (engineData.code === 0 || engineData.data) && (engineData.data?.taskId || engineData.taskId)) {
      const taskId = engineData.data?.taskId || engineData.taskId;

      return res.status(200).json({
        success: true,
        taskId: taskId,
        poolId: poolIdDipakai,
        didDeductCredit: didDeductCredit
      });
    } else {
      throw new Error(engineData?.msg || 'Server AI menolak antrean video.');
    }

  } catch (error) {
    // Refund jika gagal di tengah jalan
    if (didDeductCredit && userId) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/refund_kredit_member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        },
        body: JSON.stringify({ target_user_id: String(userId) })
      });
    }

    if (poolIdDipakai) {
      await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        },
        body: JSON.stringify({ status: 'idle' })
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memproses render ke server.'
    });
  }
}
