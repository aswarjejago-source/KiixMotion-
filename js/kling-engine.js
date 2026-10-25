// ==========================================
// PILAR 3B: KLING 2.6 ENGINE LOGIC (STANDALONE WRAPPER)
// File: js/kling-engine.js
// ==========================================

(function() {
  // 1. CEGAT / OVERRIDE setProviderUtama DARI LUAR
  var setProviderAsli = window.setProviderUtama;

  window.setProviderUtama = function(mode) {
    if (mode === 'kling') {
      window.engineMode = 'kling';
      
      var cardKiix = document.getElementById('c-prov-kiix');
      var cardRH = document.getElementById('c-prov-runninghub');
      var cardKling = document.getElementById('c-prov-kling');

      var badgeKiix = document.getElementById('b-prov-kiix');
      var badgeRH = document.getElementById('b-prov-runninghub');
      var badgeKling = document.getElementById('b-prov-kling');

      var activeClass = "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50 transition";
      var inactiveClass = "bg-kmCard border border-kmBorder p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";

      if (cardKiix) cardKiix.className = inactiveClass;
      if (cardRH) cardRH.className = inactiveClass;
      if (cardKling) cardKling.className = activeClass;

      if (badgeKiix) badgeKiix.style.display = 'none';
      if (badgeRH) badgeRH.style.display = 'none';
      if (badgeKling) badgeKling.style.display = 'inline-block';

      var tTitle = document.getElementById('t-engine-title');
      var tTotal = document.getElementById('t-engine-total');
      var dropWrap = document.getElementById('box-wrap-dropdown-akun');

      if (tTitle) tTitle.innerText = "KLING 2.6 MOTION CONTROL";
      if (tTotal) tTotal.innerText = "Testing Trial";
      if (dropWrap) dropWrap.style.display = 'none';
      return;
    }

    var elCardKling = document.getElementById('c-prov-kling');
    var elBadgeKling = document.getElementById('b-prov-kling');
    if (elCardKling) {
      elCardKling.className = "bg-kmCard border border-kmBorder p-5 rounded-2xl cursor-pointer hover:border-indigo-300 transition modern-shadow";
    }
    if (elBadgeKling) {
      elBadgeKling.style.display = 'none';
    }

    if (typeof setProviderAsli === 'function') {
      setProviderAsli(mode);
    }
  };

  // 2. CEGAT / OVERRIDE mulaiProsesGenerate DARI LUAR
  var generateAsli = window.mulaiProsesGenerate;

  window.mulaiProsesGenerate = function() {
    if (window.engineMode === 'kling') {
      return jalankanProsesKling();
    }
    if (typeof generateAsli === 'function') {
      return generateAsli();
    }
  };

  // 3. LOGIKA RENDER KLING 2.6
  async function jalankanProsesKling() {
    var btn = document.getElementById('btn-submit-generate');
    var realEmail = "tester@kiixmotion.com";
    var realUserId = "tester-kling";

    // Ambil identitas sesi bila login aktif
    if (typeof supa !== 'undefined') {
      try {
        var sessionRes = await supa.auth.getSession();
        var sUser = sessionRes?.data?.session?.user;
        if (!sUser && typeof supa.auth.getUser === 'function') {
          var uRes = await supa.auth.getUser();
          sUser = uRes?.data?.user;
        }
        if (sUser && sUser.email) realEmail = sUser.email.toLowerCase().trim();
        if (sUser && sUser.id) realUserId = sUser.id;
      } catch (e) {}
    }

    var fotoUrl = window.urlBahanFoto || (typeof urlBahanFoto !== 'undefined' ? urlBahanFoto : null);
    var videoUrl = window.urlBahanVideo || (typeof urlBahanVideo !== 'undefined' ? urlBahanVideo : null);

    if (!fotoUrl || !videoUrl) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return typeof tampilkanNotifPusat === 'function'
        ? tampilkanNotifPusat('Foto karakter dan Video gerakan wajib selesai diunggah!')
        : alert('Foto karakter dan Video gerakan wajib selesai diunggah!');
    }

    // Ambil prompt dari form input bila pengguna mengetik deskripsi
    var inPrompt = document.getElementById('in-prompt-gerak') || document.querySelector('textarea[name="prompt"], input[name="prompt"]');
    var teksPrompt = (inPrompt && inPrompt.value.trim()) ? inPrompt.value.trim() : "High quality cinematic motion capture, smooth movement, realistic studio lighting";

    if (btn) { btn.disabled = true; btn.innerText = "⚡ MEMPROSES KLING 2.6..."; }

    try {
      var res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlBahanFoto: fotoUrl,
          urlBahanVideo: videoUrl,
          provider: 'kling',
          userId: realUserId,
          userEmail: realEmail,
          prompt: teksPrompt
        })
      });

      var data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memproses render Kling ke server.');
      }

      var tugasKling = {
        id: data.taskId,
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
        biaya: "Testing Trial",
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
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();

      pantauStatusKling(tugasKling);

    } catch (err) {
      var pesan = err.message || 'Terjadi gangguan koneksi ke server Kling.';
      if (typeof tampilkanNotifPusat === 'function') tampilkanNotifPusat(pesan);
      else alert(pesan);
    } finally {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    }
  }

  // 4. PEMANTAU STATUS KLING
  function pantauStatusKling(tugas) {
    if (tugas.selesai) return;
    if (!tugas.progress) tugas.progress = 0;
    if (!tugas.startedAt) tugas.startedAt = Date.now();

    if (tugas.intervalObj) clearInterval(tugas.intervalObj);

    async function cekStatusKling() {
      if (tugas.selesai) {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        return;
      }

      var durasi = Date.now() - tugas.startedAt;
      if (durasi >= 1800000) {
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
        var dataObj = jsonObj.data || jsonObj;
        var statusTeks = (dataObj.status || jsonObj.status || "").toString().toUpperCase().trim();

        // 1. Sedang Mengantre / Diproses
        if (statusTeks === "PROCESSING" || statusTeks === "PENDING" || statusTeks === "QUEUED" || statusTeks === "RUNNING") {
          tugas.status = (statusTeks === "QUEUED" || statusTeks === "PENDING")
            ? "⏳ Mengantre di Server Kling..."
            : "⚡ Sedang Memproses Kling 2.6...";

          if (tugas.progress < 90) tugas.progress += 2;
          if (typeof simpanStorage === 'function') simpanStorage();

          var taskIdStr = String(tugas.id);
          var semuaCard = document.querySelectorAll('.grid > div, [class*="card"]');
          for (var i = 0; i < semuaCard.length; i++) {
            if (semuaCard[i].innerText && semuaCard[i].innerText.includes(taskIdStr)) {
              var elTexts = semuaCard[i].querySelectorAll('div, p, span');
              for (var j = 0; j < elTexts.length; j++) {
                var txt = (elTexts[j].innerText || "").trim();
                if (txt.endsWith('%') && txt.length <= 5) elTexts[j].innerText = tugas.progress + "%";
              }
              break;
            }
          }
          return;
        }

        // 2. Gagal Diproses
        if (statusTeks === "FAILED" || statusTeks === "ERROR" || statusTeks === "CANCELED" || statusTeks === "CANCELLED") {
          if (tugas.intervalObj) clearInterval(tugas.intervalObj);
          tugas.status = "❌ Gagal Diproses Mesin Kling";
          tugas.selesai = true;
          tugas.progress = 100;
          if (typeof simpanStorage === 'function') simpanStorage();
          if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
          return;
        }

        // 3. Selesai (Ekstraksi output.video_url sesuai format resmi PiAPI)
        var linkVideo = dataObj.output?.video_url || 
                        jsonObj.output?.video_url || 
                        dataObj.video_url || 
                        jsonObj.video_url || 
                        dataObj.fileUrl || 
                        (Array.isArray(dataObj.videos) && dataObj.videos[0]?.url) || 
                        null;

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
})();
