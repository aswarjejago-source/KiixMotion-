// ==========================================
// PILAR 3B: KLING 2.6 ENGINE LOGIC
// File: js/kling-engine.js
// ==========================================

window.mulaiGenerateKling = async function() {
  var btn = document.getElementById('btn-submit-generate');
  var realEmail = null;
  var realUserId = null;
  var profilUser = null;

  // 1. Verifikasi Sesi & Status Akun Supabase
  if (typeof supa !== 'undefined') {
    if (btn) { btn.disabled = true; btn.innerText = "🔍 MEMERIKSA STATUS..."; }
    try {
      var sessionRes = await supa.auth.getSession();
      var sessionUser = sessionRes?.data?.session?.user;

      if (!sessionUser && typeof supa.auth.getUser === 'function') {
        var userRes = await supa.auth.getUser();
        sessionUser = userRes?.data?.user;
      }

      if (sessionUser && sessionUser.email) realEmail = sessionUser.email.toLowerCase().trim();
      if (sessionUser && sessionUser.id) realUserId = sessionUser.id;
      
      if (realEmail) {
        var { data: dbUser } = await supa
          .from('users')
          .select('*')
          .ilike('email', realEmail)
          .maybeSingle();
        if (dbUser) profilUser = dbUser;
      }
    } catch (err) {}
  }

  if (!realEmail || !realUserId) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return typeof tampilkanNotifPusat === 'function' 
      ? tampilkanNotifPusat('Sesi login berakhir, silakan login ulang!')
      : alert('Sesi login berakhir, silakan login ulang!');
  }

  // 2. Proteksi Akses Khusus Member VIP
  var isMemberVip = profilUser && (
    profilUser.is_vip === true ||
    profilUser.is_pro === true ||
    profilUser.role === 'pro' ||
    profilUser.role === 'vip' ||
    profilUser.status === 'pro' ||
    profilUser.status === 'vip'
  );

  if (!isMemberVip) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    if (typeof tampilkanNotifPusat === 'function') {
      tampilkanNotifPusat('Akses Kling 2.6 khusus member VIP!');
    }
    setTimeout(function() { 
      if (typeof alihkanKeMenuLangganan === 'function') alihkanKeMenuLangganan(); 
    }, 500);
    return;
  }

  // 3. Validasi Bahan Unggahan
  var fotoUrl = window.urlBahanFoto || (typeof urlBahanFoto !== 'undefined' ? urlBahanFoto : null);
  var videoUrl = window.urlBahanVideo || (typeof urlBahanVideo !== 'undefined' ? urlBahanVideo : null);

  if (!fotoUrl || !videoUrl) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return typeof tampilkanNotifPusat === 'function'
      ? tampilkanNotifPusat('Foto karakter dan Video gerakan wajib selesai diunggah!')
      : alert('Foto karakter dan Video gerakan wajib selesai diunggah!');
  }

  if (btn) { btn.disabled = true; btn.innerText = "⚡ MEMPROSES KLING 2.6..."; }

  // 4. Request Render ke Backend (/api/generate)
  try {
    var res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urlBahanFoto: fotoUrl,
        urlBahanVideo: videoUrl,
        provider: 'kling',
        userId: realUserId,
        userEmail: realEmail
      })
    });

    var data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memproses render Kling ke server.');
    }

    var taskIdAsli = data.taskId;

    // 5. Catat ke Antrean Riwayat Global
    var tugasKling = {
      id: taskIdAsli,
      key: null,
      pool_id: null,
      user_id: realUserId,
      user_email: realEmail,
      did_deduct: false,
      refunded: false,
      startedAt: Date.now(),
      model: "Kling 2.6",
      provider: "Kling 2.6 Cinematic Engine",
      engine: "Kling 2.6 Motion Control",
      prov: "Kling",
      provider_mode: "kling",
      tgl: "Baru saja",
      biaya: "1 Coin VIP",
      videoUrl: null,
      status: "⚡ Sedang Memproses Video...",
      selesai: false,
      progress: 0
    };

    window.riwayatGenerateList = window.riwayatGenerateList || [];
    window.riwayatGenerateList.unshift(tugasKling);
    if (typeof simpanStorage === 'function') simpanStorage();

    if (typeof resetFormBahanInput === 'function') resetFormBahanInput();
    if (typeof tampilkanModalCeklisSukses === 'function') tampilkanModalCeklisSukses(tugasKling.id);

    // 6. Jalankan Tracker Khusus Kling
    pantauStatusKling(tugasKling, realUserId);

  } catch (err) {
    var pesan = err.message || 'Terjadi gangguan koneksi ke server Kling.';
    if (typeof tampilkanNotifPusat === 'function') {
      tampilkanNotifPusat(pesan);
    } else {
      alert(pesan);
    }
  } finally {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  }
};

// -------------------------------------------------------------
// TRACKER STATUS RENDER KLING 2.6
// -------------------------------------------------------------
function pantauStatusKling(tugas, userId) {
  if (tugas.selesai) return;
  if (!tugas.progress) tugas.progress = 0;
  if (!tugas.startedAt) tugas.startedAt = Date.now();

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  async function cekStatusKling() {
    if (tugas.selesai) {
      if (tugas.intervalObj) clearInterval(tugas.intervalObj);
      return;
    }

    var durasiBerjalan = Date.now() - tugas.startedAt;
    
    // Timeout 30 menit
    if (durasiBerjalan >= 1800000) {
      if (tugas.intervalObj) clearInterval(tugas.intervalObj);
      tugas.status = "❌ Gagal (Waktu Habis)";
      tugas.selesai = true;
      tugas.progress = 100;
      if (typeof simpanStorage === 'function') simpanStorage();
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
      return;
    }

    try {
      var res = await fetch('/api/outputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: tugas.id,
          provider: 'kling'
        })
      });

      if (!res.ok) return;

      var jsonObj = await res.json();
      var dataObj = jsonObj.data || {};
      var statusTeks = (dataObj.status || jsonObj.status || "").toString().toUpperCase().trim();

      // Status Sedang Proses
      if (statusTeks === "PROCESSING" || statusTeks === "PENDING" || statusTeks === "QUEUED") {
        tugas.status = (statusTeks === "QUEUED" || statusTeks === "PENDING")
          ? "⏳ Mengantre di Server Kling..."
          : "⚡ Sedang Memproses Kling 2.6...";

        if (tugas.progress < 90) tugas.progress += 3;
        if (typeof simpanStorage === 'function') simpanStorage();

        // Update progress bar di kartu UI
        var taskIdStr = String(tugas.id);
        var semuaCard = document.querySelectorAll('.grid > div, [class*="card"]');
        for (var i = 0; i < semuaCard.length; i++) {
          if (semuaCard[i].innerText && semuaCard[i].innerText.includes(taskIdStr)) {
            var elTexts = semuaCard[i].querySelectorAll('div, p, span');
            for (var j = 0; j < elTexts.length; j++) {
              var txt = (elTexts[j].innerText || "").trim();
              if (txt.endsWith('%') && txt.length <= 5) {
                elTexts[j].innerText = tugas.progress + "%";
              }
            }
            break;
          }
        }
        return;
      }

      // Status Gagal
      if (statusTeks === "FAILED" || statusTeks === "ERROR" || statusTeks === "CANCELED") {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        tugas.status = "❌ Gagal Diproses Mesin Kling";
        tugas.selesai = true;
        tugas.progress = 100;

        if (typeof simpanStorage === 'function') simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        return;
      }

      // Status Sukses
      var linkVideo = dataObj.video_url || dataObj.url || dataObj.fileUrl || (Array.isArray(dataObj.videos) && dataObj.videos[0]?.url) || null;
      if (statusTeks === "COMPLETED" || statusTeks === "SUCCESS" || linkVideo) {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        tugas.status = "Selesai";
        tugas.selesai = true;
        tugas.progress = 100;
        tugas.videoUrl = linkVideo;

        if (typeof simpanStorage === 'function') simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Video Kling 2.6 berhasil selesai!', 'sukses');
        return;
      }

    } catch (e) {}
  }

  cekStatusKling();
  tugas.intervalObj = setInterval(cekStatusKling, 6000);
}
