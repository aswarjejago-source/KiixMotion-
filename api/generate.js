// File: api/generate.js
// Backend Proxy Vercel - KiixMotion Secure Engine

export const maxDuration = 60;

const EMAIL_OWNER = "anggraingki@gmail.com";

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

async function siapkanBahan(bahan, fileType, apiKey) {
  if (!bahan || typeof bahan !== 'string') return bahan;

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

function normalisasiRatioMinimax(ratio) {
  if (!ratio) return "3:4 (Portrait Standard)";
  const r = String(ratio).toLowerCase();
  if (r.includes("1:1")) return "1:1 (Square)";
  if (r.includes("2:3")) return "2:3 (Portrait Photo)";
  if (r.includes("3:2")) return "3:2 (Photo)";
  if (r.includes("3:4")) return "3:4 (Portrait Standard)";
  if (r.includes("4:3")) return "4:3 (Standard)";
  if (r.includes("9:16")) return "9:16 (Portrait Widescreen)";
  if (r.includes("16:9")) return "16:9 (Widescreen)";
  if (r.includes("21:9")) return "21:9 (Ultrawide)";
  return "3:4 (Portrait Standard)";
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
    userId,
    userEmail,
    prompt,
    images,
    duration,
    aspectRatio
  } = req.body;

  // Validasi input disesuaikan: MiniMax menggunakan multi-gambar + prompt
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

  const supaHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
  };

  // =========================================================
  // JALUR 1: KLING 2.6 MOTION CONTROL (PiAPI - EXCLUSIVE OWNER)
  // =========================================================
  if (provider === 'kling') {
    let emailTerverifikasi = (userEmail || "").trim().toLowerCase();

    if (!emailTerverifikasi && userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
      try {
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
          headers: supaHeaders
        });
        const authUser = await authRes.json();
        emailTerverifikasi = (authUser?.email || "").trim().toLowerCase();
      } catch (e) {}
    }

    if (emailTerverifikasi !== EMAIL_OWNER.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Fitur Kling 2.6 hanya boleh digunakan oleh Owner (${EMAIL_OWNER}).`
      });
    }

    try {
      const PIAPI_KEY = process.env.PIAPI_KEY || "b6d3705e08d8e2330e60639119bd04bc304be592eebda976ec2551f82ea072da";

      if (!urlBahanFoto?.startsWith('http') || !urlBahanVideo?.startsWith('http')) {
        return res.status(400).json({
          success: false,
          message: `Link bahan tidak valid. Foto: ${urlBahanFoto} | Video: ${urlBahanVideo}`
        });
      }

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
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': PIAPI_KEY
        },
        body: JSON.stringify(piapiPayload)
      });

      const rawText = await piapiRes.text();
      let piapiJson = null;
      try {
        piapiJson = JSON.parse(rawText);
      } catch (e) {}

      const idTugas = piapiJson?.task_id || piapiJson?.data?.task_id;

      if ((piapiRes.ok || piapiJson?.code === 200 || piapiJson?.code === 0) && idTugas) {
        return res.status(200).json({
          success: true,
          taskId: idTugas,
          poolId: null,
          didDeductCredit: false
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `[HTTP ${piapiRes.status}] ${rawText} | FOTO: ${urlBahanFoto} | VIDEO: ${urlBahanVideo}`
        });
      }
    } catch (errKling) {
      return res.status(500).json({
        success: false,
        message: 'Koneksi ke PiAPI gagal: ' + errKling.message
      });
    }
  }

  // =========================================================
  // JALUR 2 & 3: RUNNINGHUB MOTION & MINIMAX H3 MASTER WORKFLOW
  // =========================================================
  if (!SUPABASE_URL) {
    return res.status(500).json({
      success: false,
      message: 'SUPABASE_URL tidak terbaca di environment Vercel.'
    });
  }

  let apiKeyDipakai = null;
  let poolIdDipakai = null;
  let didDeductCredit = false;

  try {
    // A. Pengguna Pro dengan API key pribadi (Hanya untuk provider runninghub / pro)
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
    // B. Jalur Kredit Cloud (Kiix Motion & MiniMax H3 = 1 Kredit / Render)
    else {
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid.' });
      }

      // 1. Potong 1 kredit dari Supabase
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

      // 2. Ambil akun idle dari master pool RunningHub
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

      // Tandai akun pool menjadi busy
      await fetch(`${SUPABASE_URL}/rest/v1/runninghub_pool?id=eq.${poolIdDipakai}`, {
        method: 'PATCH',
        headers: supaHeaders,
        body: JSON.stringify({ status: 'busy', last_used_at: new Date().toISOString() })
      });
    }

    // =========================================================
    // CABANG EKSEKUSI MINIMAX H3 (AI-APP 2104825195000619009)
    // =========================================================
    if (provider === 'minimax') {
      const MINIMAX_APP_ID = "2104825195000619009";

      // Mapping gambar ke 9 slot
      const slotMap = {};
      if (Array.isArray(images)) {
        images.forEach((item, idx) => {
          if (typeof item === 'object' && item !== null) {
            const s = Number(item.slot) || (idx + 1);
            slotMap[s] = item.url || item.fileUrl || item.imageUrl;
          } else if (typeof item === 'string') {
            slotMap[idx + 1] = item;
          }
        });
      } else if (urlBahanFoto) {
        slotMap[1] = urlBahanFoto;
      }

      const nodeSlotMap = [
        { slot: 1, nodeId: "6" },
        { slot: 2, nodeId: "35" },
        { slot: 3, nodeId: "36" },
        { slot: 4, nodeId: "37" },
        { slot: 5, nodeId: "38" },
        { slot: 6, nodeId: "39" },
        { slot: 7, nodeId: "40" },
        { slot: 8, nodeId: "41" },
        { slot: 9, nodeId: "42" }
      ];

      // Unggah gambar slot secara paralel ke server RunningHub
      const nodeInfoList = [];

      await Promise.all(nodeSlotMap.map(async (mapping) => {
        const rawUrl = slotMap[mapping.slot];
        let finalVal = "None";

        if (rawUrl) {
          try {
            finalVal = await siapkanBahan(rawUrl, 'image', apiKeyDipakai);
          } catch (e) {
            finalVal = "None";
          }
        }

        nodeInfoList.push({
          nodeId: mapping.nodeId,
          fieldName: "image",
          fieldValue: finalVal,
          description: null
        });
      }));

      // Urutkan node gambar berdasarkan slot
      nodeInfoList.sort((a, b) => {
        const idxA = nodeSlotMap.findIndex(n => n.nodeId === a.nodeId);
        const idxB = nodeSlotMap.findIndex(n => n.nodeId === b.nodeId);
        return idxA - idxB;
      });

      // Tambahkan parameter bawaan alur kerja MiniMax H3
      nodeInfoList.push(
        { nodeId: "65", fieldName: "index", fieldValue: "0", description: null },
        { nodeId: "27", fieldName: "value", fieldValue: String(duration || "15"), description: null },
        { nodeId: "29", fieldName: "aspect_ratio", fieldValue: normalisasiRatioMinimax(aspectRatio), description: null },
        { nodeId: "29", fieldName: "megapixels", fieldValue: "0.6000000000000001", description: null },
        { nodeId: "61", fieldName: "value", fieldValue: "1.3000000000000003", description: null },
        { nodeId: "28", fieldName: "prompt", fieldValue: prompt || "", description: null }
      );

      const minimaxPayload = {
        nodeInfoList: nodeInfoList,
        instanceType: "plus",
        usePersonalQueue: "false"
      };

      const mmRes = await fetch(`https://www.runninghub.ai/openapi/v2/run/ai-app/${MINIMAX_APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyDipakai}`
        },
        body: JSON.stringify(minimaxPayload)
      });

      const mmData = await mmRes.json();
      const taskId = mmData.taskId || mmData.data?.taskId;

      if ((mmRes.ok || mmData.status === "RUNNING" || mmData.code === 0) && taskId) {
        return res.status(200).json({
          success: true,
          taskId: taskId,
          poolId: poolIdDipakai,
          didDeductCredit: didDeductCredit
        });
      } else {
        throw new Error(mmData.errorMessage || mmData.msg || 'MiniMax H3 engine menolak antrean render.');
      }
    }

    // =========================================================
    // CABANG EKSEKUSI WAN MOTION CONTROL (WORKFLOW 2099509417535340546)
    // =========================================================
    const RUNNINGHUB_WORKFLOW_ID = "2099509417535340546";

    const [rhFoto, rhVideo] = await Promise.all([
      siapkanBahan(urlBahanFoto, 'image', apiKeyDipakai),
      siapkanBahan(urlBahanVideo, 'video', apiKeyDipakai)
    ]);

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
    // Safety Net: Refund kredit jika gagal render
    if (didDeductCredit && userId) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/refund_kredit_member`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({ target_user_id: String(userId) })
      }).catch(function() {});
    }

    // Kembalikan status API pool menjadi idle
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
