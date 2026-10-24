// File: api/generate.js
// Backend Proxy Vercel - KiixMotion Secure Engine

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const {
    urlBahanFoto,
    urlBahanVideo,
    provider,
    apiKeyPribadi,
    userId,
    userEmail
  } = req.body;

  if (!urlBahanFoto || !urlBahanVideo) {
    return res.status(400).json({ success: false, message: 'Bahan foto dan video wajib diisi.' });
  }

  // Rahasia dapur terkunci rapat di sisi server Vercel
  const RUNNINGHUB_WORKFLOW_ID = "2099509417535340546";
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let apiKeyDipakai = null;
  let poolIdDipakai = null;
  let didDeductCredit = false;

  try {
    // 1. JALUR PRO / KUNCI PRIBADI (User pakai token sendiri)
    if (provider === 'runninghub' || provider === 'custom') {
      if (!apiKeyPribadi) {
        return res.status(400).json({ success: false, message: 'Kunci API pribadi belum dipilih atau kosong.' });
      }
      apiKeyDipakai = apiKeyPribadi;
    } 
    // 2. JALUR KIIX KREDIT (Potong kredit member & pakai kolam akun admin)
    else {
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid.' });
      }

      // Potong kredit di database Supabase via server
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

      // Ambil 1 kunci yang idle dari kolam admin (koin >= 200)
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
        // Refund otomatis jika semua server kolam lagi kosong/penuh
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

      // Kunci akun pool ke status 'busy'
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

    // 3. EKSEKUSI RENDER DARI SERVER VERCEL KE ENGINE
    const enginePayload = {
      workflowId: RUNNINGHUB_WORKFLOW_ID,
      apiKey: apiKeyDipakai,
      nodeInfoList: [
        { nodeId: "30", fieldName: "image", fieldValue: urlBahanFoto },
        { nodeId: "33", fieldName: "video", fieldValue: urlBahanVideo },
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

      // HANYA kirim data publik ke browser. JANGAN KIRIM API KEY!
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
    // Refund kredit jika render gagal di tengah jalan
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

    // Kembalikan status pool jadi idle
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
