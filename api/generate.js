// File: api/generate.js
// Backend Proxy Vercel - KiixMotion Secure Engine (Anti Fetch Failed & Smart Bypass)

export const maxDuration = 60;

function ambilPathDariUrl(publicUrl) {
  try {
    if (!publicUrl || typeof publicUrl !== 'string') return null;
    const parts = publicUrl.split('/bahan-render/');
    return parts[1] ? decodeURIComponent(parts[1]) : null;
  } catch (e) {
    return null;
  }
}

async function uploadKeEngineServer(fileUrl, fileType, apiKey) {
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error("Gagal mengambil file bahan dari storage.");
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
  if (!serverFile) throw new Error(rhJson?.msg || "Engine AI menolak bahan video/foto.");
  return serverFile;
}

// BYPASS CERDAS: Jika bahan sudah diunggah Worker / sudah ada di RunningHub, jangan unduh ulang!
async function siapkanBahan(bahan, fileType, apiKey) {
  if (!bahan || typeof bahan !== 'string') return bahan;

  // Langsung loloskan jika sudah berbentuk path RunningHub atau link file RunningHub
  if (
    bahan.startsWith('api/') ||
    bahan.startsWith('openapi/') ||
    bahan.includes('runninghub') ||
    !bahan.startsWith('http')
  ) {
    return bahan;
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
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                                process.env.SUPABASE_SERVICE_ROLE || 
                                process.env.SUPABASE_SERVICE_KEY || 
                                process.env.SUPABASE_KEY;

  if (!SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({
      success: false,
      message: 'Konfigurasi server belum lengkap: SUPABASE_SERVICE_ROLE_KEY belum diisi di Vercel.'
    });
  }

  const supaHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
  };

  let apiKeyDipakai = null;
  let poolIdDipakai = null;
  let didDeductCredit = false;

  try {
    // A. JALUR PRO / KUNCI PRIBADI (CEK STATUS VIP)
    if (provider === 'runninghub' || provider === 'pro' || provider === 'custom') {
      if (!apiKeyPribadi) {
        return res.status(400).json({ success: false, message: 'Kunci API pribadi belum dipilih atau kosong.' });
      }

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid. Silakan login ulang.' });
      }

      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: supaHeaders
      });

      const userData = await userRes.json();
      const user = userData?.[0];

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
          message: 'Kamu belum punya akses Pro!'
        });
      }

      apiKeyDipakai = apiKeyPribadi;
    } 
    // B. JALUR KIIX KREDIT (PAKAI 1 KREDIT & POOL ADMIN)
    else {
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid.' });
      }

      // Potong kredit member
      const potongRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/potong_kredit_member`, {
        method: 'POST',
        headers: supaHeaders,
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
        { headers: supaHeaders }
      );
      const poolData = await poolRes.json();

      if (!poolData || poolData.length === 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/refund_kredit_member`, {
          method: 'POST',
          headers: supaHeaders,
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
        headers: supaHeaders,
        body: JSON.stringify({ status: 'busy', last_used_at: new Date().toISOString() })
      });
    }

    // C. BYPASS PENYIAPAN BAHAN (Tidak ada lagi re-upload 34 MB di Vercel)
    const [rhFoto, rhVideo] = await Promise.all([
      siapkanBahan(urlBahanFoto, 'image', apiKeyDipakai),
      siapkanBahan(urlBahanVideo, 'video', apiKeyDipakai)
    ]);

    // D. PEMBERSIHAN STORAGE SUPABASE (Jika ada sisa file lama)
    const pathFoto = ambilPathDariUrl(urlBahanFoto);
    const pathVideo = ambilPathDariUrl(urlBahanVideo);
    const fileHapus = [pathFoto, pathVideo].filter(Boolean);

    if (fileHapus.length > 0) {
      fetch(`${SUPABASE_URL}/storage/v1/object/bahan-render`, {
        method: 'DELETE',
        headers: supaHeaders,
        body: JSON.stringify({ prefixes: fileHapus })
      }).catch(function(e) { console.error("Gagal auto-delete Supabase:", e); });
    }

    // E. BUAT ANTREAN TASK KE ENGINE RUNNINGHUB
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
    if (didDeductCredit && userId) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/refund_kredit_member`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({ target_user_id: String(userId) })
      }).catch(function() {});
    }

    if (poolIdDipakai) {
      await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({ status: 'idle' })
      }).catch(function() {});
    }

    const detailEror = error.cause?.message || error.message || 'Gagal memproses render ke server.';
    return res.status(500).json({
      success: false,
      message: detailEror
    });
  }
}
