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

      // Validasi ketat: Link wajib berawalan http/https dari Supabase
      if (!urlBahanFoto.startsWith('http') || !urlBahanVideo.startsWith('http')) {
        return res.status(400).json({
          success: false,
          message: `Link bahan cacat! Foto: ${urlBahanFoto} | Video: ${urlBahanVideo}`
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
