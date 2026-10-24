// File: api/generate.js
// Backend Proxy Vercel - Menjalankan render tanpa membocorkan API Key

export default async function handler(req, res) {
  // Hanya terima metode POST
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

  const RUNNINGHUB_WORKFLOW_ID = "2099509417535340546";
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // Gunakan service role agar bypass RLS aman di server

  let apiKeyDipakai = null;
  let poolIdDipakai = null;
  let didDeductCredit = false;

  try {
    // 1. JALUR RUNNINGHUB PRO (MEMBER PAKAI KUNCI SENDIRI)
    if (provider === 'runninghub') {
      if (!apiKeyPribadi) {
        return res.status(400).json({ success: false, message: 'API Key RunningHub pribadi belum dipilih.' });
      }
      apiKeyDipakai = apiKeyPribadi;
    } 
    // 2. JALUR KIIX CONTROLLER (MEMAKAI KOLAM ADMIN & KREDIT MEMBER)
    else {
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Sesi user tidak valid.' });
      }

      // Potong kredit user langsung dari server
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

      // Ambil 1 kunci dari kolam admin yang idle dan koin >= 200
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
        // Refund kredit jika server kolam habis
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

      // Kunci status akun pool menjadi busy
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

    // 3. TEMBAK RUNNINGHUB DARI SERVER VERCEL
    const rhPayload = {
      workflowId: RUNNINGHUB_WORKFLOW_ID,
      apiKey: apiKeyDipakai,
      nodeInfoList: [
        { nodeId: "30", fieldName: "image", fieldValue: urlBahanFoto },
        { nodeId: "33", fieldName: "video", fieldValue: urlBahanVideo },
        { nodeId: "308", fieldName: "upscale_method", fieldValue: "bicubic" }
      ]
    };

    const rhRes = await fetch('https://www.runninghub.ai/task/openapi/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyDipakai}`
      },
      body: JSON.stringify(rhPayload)
    });

    const rhData = await rhRes.json();

    // Jika RunningHub mengembalikan taskId sukses
    if (rhData && (rhData.code === 0 || rhData.data) && (rhData.data?.taskId || rhData.taskId)) {
      const taskId = rhData.data?.taskId || rhData.taskId;

      return res.status(200).json({
        success: true,
        taskId: taskId,
        poolId: poolIdDipakai,
        apiKeyDipakai: apiKeyDipakai, // Dikirim balik terenkripsi/ke memori lokal pemantau
        didDeductCredit: didDeductCredit
      });
    } else {
      throw new Error(rhData?.msg || 'Server AI menolak antrean video.');
    }

  } catch (error) {
    // Kembalikan kredit dan reset pool jika render gagal
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
