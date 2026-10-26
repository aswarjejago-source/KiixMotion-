// ==========================================================================
// KIIX MOTION — KLING 2.6 MOTION CONTROL MODULE
// File: js/kling-engine.js
// Fitur: Deep MP4 Binary Duration Patcher (stts, elst, mdhd, mvhd -> 5.0s)
// ==========================================================================

(function () {
  window.urlBahanFotoKling = null;
  window.urlBahanVideoKling = null;

  // ========================================================================
  // 1. DEEP BINARY PATCHER (Manipulasi stts, elst, mdhd, mvhd ke 5.0 Detik)
  // Menipu FFprobe validator tanpa membuang frame dan tanpa re-encode
  // ========================================================================
  async function palsukanDurasiMp4(fileAsli, targetDetik) {
    if (!targetDetik) targetDetik = 5.0;
    try {
      var buffer = await fileAsli.arrayBuffer();
      var view = new DataView(buffer);
      var bytes = new Uint8Array(buffer);
      var len = bytes.length;

      var movieTimescale = 1000;
      var mediaTimescale = 1000;

      // LANGKAH 1: Ambil & Patch MVHD (Movie Header)
      for (var i = 0; i < len - 36; i++) {
        if (bytes[i] === 0x6d && bytes[i+1] === 0x76 && bytes[i+2] === 0x68 && bytes[i+3] === 0x64) { // 'mvhd'
          var posMv = i - 4;
          var verMv = view.getUint8(posMv + 8);
          var tsOffMv = (verMv === 1) ? (posMv + 28) : (posMv + 20);
          var durOffMv = (verMv === 1) ? (posMv + 32) : (posMv + 24);

          movieTimescale = view.getUint32(tsOffMv) || 1000;
          var newDurMv = Math.floor(movieTimescale * targetDetik);

          if (verMv === 1) {
            view.setBigUint64(durOffMv, BigInt(newDurMv));
          } else {
            view.setUint32(durOffMv, newDurMv);
          }
          break;
        }
      }

      // LANGKAH 2: Ambil & Patch MDHD (Media Header)
      for (var j = 0; j < len - 36; j++) {
        if (bytes[j] === 0x6d && bytes[j+1] === 0x64 && bytes[j+2] === 0x68 && bytes[j+3] === 0x64) { // 'mdhd'
          var posMd = j - 4;
          var verMd = view.getUint8(posMd + 8);
          var tsOffMd = (verMd === 1) ? (posMd + 28) : (posMd + 20);
          var durOffMd = (verMd === 1) ? (posMd + 32) : (posMd + 24);

          mediaTimescale = view.getUint32(tsOffMd) || movieTimescale;
          var newDurMd = Math.floor(mediaTimescale * targetDetik);

          if (verMd === 1) {
            view.setBigUint64(durOffMd, BigInt(newDurMd));
          } else {
            view.setUint32(durOffMd, newDurMd);
          }
        }
      }

      // LANGKAH 3: Patch TKHD (Track Headers)
      for (var k = 0; k < len - 40; k++) {
        if (bytes[k] === 0x74 && bytes[k+1] === 0x6b && bytes[k+2] === 0x68 && bytes[k+3] === 0x64) { // 'tkhd'
          var posTk = k - 4;
          var verTk = view.getUint8(posTk + 8);
          var durOffTk = (verTk === 1) ? (posTk + 36) : (posTk + 28);
          var newDurTk = Math.floor(movieTimescale * targetDetik);

          if (verTk === 1) {
            view.setBigUint64(durOffTk, BigInt(newDurTk));
          } else {
            view.setUint32(durOffTk, newDurTk);
          }
        }
      }

      // LANGKAH 4: Patch STTS (Time-to-Sample — Kunci Utama Pembacaan FFprobe)
      for (var m = 0; m < len - 24; m++) {
        if (bytes[m] === 0x73 && bytes[m+1] === 0x74 && bytes[m+2] === 0x74 && bytes[m+3] === 0x73) { // 'stts'
          var posSt = m - 4;
          var entryCount = view.getUint32(posSt + 12);

          if (entryCount > 0 && entryCount < 10000) {
            var totalOldDelta = 0;
            for (var e = 0; e < entryCount; e++) {
              var count = view.getUint32(posSt + 16 + e * 8);
              var delta = view.getUint32(posSt + 16 + e * 8 + 4);
              totalOldDelta += count * delta;
            }

            if (totalOldDelta > 0) {
              var targetTotalDelta = Math.floor(mediaTimescale * targetDetik);
              var ratio = targetTotalDelta / totalOldDelta;

              for (var e2 = 0; e2 < entryCount; e2++) {
                var oldDelta = view.getUint32(posSt + 16 + e2 * 8 + 4);
                var newDelta = Math.max(1, Math.floor(oldDelta * ratio));
                view.setUint32(posSt + 16 + e2 * 8 + 4, newDelta);
              }
            }
          }
        }
      }

      // LANGKAH 5: Patch ELST (Edit List — Jika Video Berasal dari CapCut/Editor)
      for (var n = 0; n < len - 24; n++) {
        if (bytes[n] === 0x65 && bytes[n+1] === 0x6c && bytes[n+2] === 0x73 && bytes[n+3] === 0x74) { // 'elst'
          var posEl = n - 4;
          var verEl = view.getUint8(posEl + 8);
          var elstEntries = view.getUint32(posEl + 12);
          var targetElstDur = Math.floor(movieTimescale * targetDetik);

          for (var e3 = 0; e3 < elstEntries; e3++) {
            if (verEl === 1) {
              view.setBigUint64(posEl + 16 + e3 * 20, BigInt(targetElstDur));
            } else {
              view.setUint32(posEl + 16 + e3 * 12, targetElstDur);
            }
          }
        }
      }

      return new File([bytes], fileAsli.name.replace(/\.[^/.]+$/, "") + "_kling5s.mp4", {
        type: "video/mp4",
      });
    } catch (errSpoof) {
      console.warn("Spoofing biner gagal:", errSpoof);
      return fileAsli;
    }
  }

  // ========================================================================
  // 2. SISTEM UPLOAD BAHAN
  // ========================================================================
  async function unggahBahanKling(file, tipe) {
    var stEl = document.getElementById(tipe === "foto" ? "st-file-foto" : "st-file-video");
    var txtEl = document.getElementById(tipe === "foto" ? "txt-file-foto" : "txt-file-video");
    if (txtEl) txtEl.innerText = file.name;

    var fileFinal = file;

    if (tipe === "video") {
      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⚙️ Menyamarkan durasi ke 5.0s...</span>';
      fileFinal = await palsukanDurasiMp4(file, 5.0);
    }

    var ext = fileFinal.name.split(".").pop() || (tipe === "foto" ? "jpg" : "mp4");
    var namaFile = "kling_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7) + "." + ext;

    try {
      var ukuranMb = (fileFinal.size / (1024 * 1024)).toFixed(1);
      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⏳ Mengunggah (' + ukuranMb + ' MB)...</span>';

      if (!window.supa || !window.supa.storage) throw new Error("Koneksi Supabase belum siap.");

      var resUp = await window.supa.storage.from("bahan-render").upload(namaFile, fileFinal, {
        cacheControl: "3600",
        upsert: true,
      });

      if (resUp.error) throw resUp.error;

      var resPub = window.supa.storage.from("bahan-render").getPublicUrl(namaFile);
      var linkPublik = resPub?.data?.publicUrl;
      if (!linkPublik) throw new Error("Gagal mengambil URL publik Supabase.");

      if (tipe === "foto") {
        window.urlBahanFotoKling = linkPublik;
        window.urlBahanFoto = linkPublik;
      } else {
        window.urlBahanVideoKling = linkPublik;
        window.urlBahanVideo = linkPublik;
      }

      if (stEl) stEl.innerHTML = '<span class="text-emerald-600 font-bold">✓ Terunggah (' + ukuranMb + ' MB)</span>';
      if (typeof tampilkanNotif === "function") tampilkanNotif("✓ Bahan Kling siap!", "sukses");

    } catch (errUpload) {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
      if (typeof tampilkanNotifPusat === "function") {
        tampilkanNotifPusat("Gagal: " + (errUpload.message || "Gagal upload"));
      }
    }
  }

  // ========================================================================
  // 3. GENERATE KLING (PIAPI GATEWAY)
  // ========================================================================
  async function eksekusiGenerateKling() {
    var btn = document.getElementById("btn-submit-generate");
    var bahanFoto = window.urlBahanFotoKling || window.urlBahanFoto;
    var bahanVideo = window.urlBahanVideoKling || window.urlBahanVideo;

    if (!bahanFoto || !bahanVideo) {
      if (typeof tampilkanNotifPusat === "function") {
        tampilkanNotifPusat("Foto karakter dan Video gerakan wajib selesai diunggah!");
      }
      return;
    }

    var realUserId = null;
    var realEmail = null;

    if (window.supa) {
      try {
        var { data: sessData } = await window.supa.auth.getSession();
        if (sessData?.session?.user) {
          realUserId = sessData.session.user.id;
          realEmail = sessData.session.user.email;
        }
      } catch (e) {}
    }

    if (btn) {
      btn.disabled = true;
      btn.innerText = "⚡ MEMPROSES KLING...";
    }

    try {
      var res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlBahanFoto: bahanFoto,
          urlBahanVideo: bahanVideo,
          provider: "kling",
          userId: realUserId,
          prompt: "High quality cinematic motion capture, smooth movement, realistic studio lighting",
        }),
      });

      var data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memproses render ke PiAPI.");
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
        model: "Kling 2.6 Motion Control",
        provider: "Kling 2.6 Engine",
        engine: "Kling 2.6 Motion Control",
        prov: "kling",
        tgl: "Baru saja",
        biaya: "Testing Trial",
        videoUrl: null,
        status: "⚡ Sedang Memproses Video...",
        selesai: false,
        progress: 10,
      };

      window.riwayatGenerateList = window.riwayatGenerateList || [];
      window.riwayatGenerateList.unshift(tugasKling);
      if (typeof simpanStorage === "function") simpanStorage();

      if (typeof resetFormBahanInput === "function") resetFormBahanInput();
      window.urlBahanFotoKling = null;
      window.urlBahanVideoKling = null;

      if (typeof tampilkanModalCeklisSukses === "function") tampilkanModalCeklisSukses(tugasKling.id);

      pantauStatusKling(tugasKling);
    } catch (err) {
      if (typeof tampilkanNotifPusat === "function") {
        tampilkanNotifPusat("Kling Error: " + (err.message || "Koneksi terputus"));
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "GENERATE VIDEO";
      }
    }
  }

  // ========================================================================
  // 4. PEMANTAU STATUS KLING
  // ========================================================================
  function pantauStatusKling(tugas) {
    if (tugas.selesai) return;
    if (tugas.intervalObj) clearInterval(tugas.intervalObj);

    async function cekStatus() {
      if (tugas.selesai) {
        clearInterval(tugas.intervalObj);
        return;
      }

      var kData = null;
      try {
        var res = await fetch("/api/outputs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: tugas.id, provider: "kling" }),
        });
        if (res.ok) {
          var j = await res.json();
          kData = j.data || j;
        }
      } catch (e) {}

      if (!kData || !kData.status) {
        try {
          var resDirect = await fetch("https://api.piapi.ai/api/v1/task/" + tugas.id, {
            headers: { "x-api-key": "c888d3ae20f708738c2271103e93c6a22dc769a54cc83495ea9acbdc0798f05d" },
          });
          if (resDirect.ok) {
            var jDirect = await resDirect.json();
            kData = jDirect.data || jDirect;
          }
        } catch (eDirect) {}
      }

      if (kData) {
        var st = (kData.status || "").toLowerCase();

        if (st === "completed" || st === "success") {
          var videoUrl = kData.output?.video_url || kData.output?.video || kData.works?.[0]?.video_url;
          if (videoUrl) {
            clearInterval(tugas.intervalObj);
            tugas.status = "Selesai";
            tugas.selesai = true;
            tugas.progress = 100;
            tugas.videoUrl = videoUrl;

            if (typeof simpanStorage === "function") simpanStorage();
            if (typeof renderVideoAsliKeGrid === "function") renderVideoAsliKeGrid();
            if (typeof aturTampilanHalamanUtama === "function") aturTampilanHalamanUtama();
            if (typeof tampilkanNotif === "function") tampilkanNotif("✓ Video Kling berhasil selesai!", "sukses");
            return;
          }
        } else if (st === "failed" || st === "error") {
          clearInterval(tugas.intervalObj);
          var alasan = kData.error?.message || "Gagal diproses Kling";
          tugas.status = "❌ " + alasan;
          tugas.selesai = true;
          tugas.progress = 100;

          if (typeof simpanStorage === "function") simpanStorage();
          if (typeof renderVideoAsliKeGrid === "function") renderVideoAsliKeGrid();
          if (typeof aturTampilanHalamanUtama === "function") aturTampilanHalamanUtama();
          if (typeof tampilkanNotifPusat === "function") tampilkanNotifPusat("Kling Gagal: " + alasan);
          return;
        } else {
          tugas.status = "⚡ Sedang Memproses Video...";
          if (tugas.progress < 92) tugas.progress += 4;
          if (typeof simpanStorage === "function") simpanStorage();

          var cardEls = document.querySelectorAll('.grid > div, [class*="card"]');
          for (var i = 0; i < cardEls.length; i++) {
            if (cardEls[i].innerText && cardEls[i].innerText.includes(String(tugas.id))) {
              var spans = cardEls[i].querySelectorAll("div, p, span");
              for (var s = 0; s < spans.length; s++) {
                var t = (spans[s].innerText || "").trim();
                if (t.endsWith("%") && t.length <= 5) spans[s].innerText = tugas.progress + "%";
              }
              break;
            }
          }
        }
      }
    }

    cekStatus();
    tugas.intervalObj = setInterval(cekStatus, 6000);
  }

  // ========================================================================
  // 5. EVENT LISTENERS
  // ========================================================================
  function inisialisasiKlingEngine() {
    var provKlingEl = document.getElementById("c-prov-kling");
    if (provKlingEl) {
      provKlingEl.addEventListener("click", function (e) {
        e.stopPropagation();
        window.engineMode = "kling";

        var cards = [
          document.getElementById("c-prov-kiix"),
          document.getElementById("c-prov-runninghub"),
          document.getElementById("c-prov-kling")
        ];
        var badges = [
          document.getElementById("b-prov-kiix"),
          document.getElementById("b-prov-runninghub"),
          document.getElementById("b-prov-kling")
        ];

        cards.forEach(function (c, idx) {
          if (c) {
            c.className = (idx === 2)
              ? "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50 transition"
              : "bg-kmCard border border-kmBorder p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
          }
        });

        badges.forEach(function (b, idx) {
          if (b) b.style.display = (idx === 2) ? "inline-block" : "none";
        });

        var tTitle = document.getElementById("t-engine-title");
        var tTotal = document.getElementById("t-engine-total");
        var dropWrap = document.getElementById("box-wrap-dropdown-akun");

        if (tTitle) tTitle.innerText = "KLING 2.6 MOTION CONTROL";
        if (tTotal) tTotal.innerText = "Testing Trial";
        if (dropWrap) dropWrap.style.display = "none";
      }, true);
    }

    var inFoto = document.getElementById("input-file-foto");
    var inVideo = document.getElementById("input-file-video");

    if (inFoto) {
      inFoto.addEventListener("change", function (e) {
        if (window.engineMode === "kling") {
          e.stopImmediatePropagation();
          if (this.files && this.files[0]) unggahBahanKling(this.files[0], "foto");
        }
      }, true);
    }

    if (inVideo) {
      inVideo.addEventListener("change", function (e) {
        if (window.engineMode === "kling") {
          e.stopImmediatePropagation();
          if (this.files && this.files[0]) unggahBahanKling(this.files[0], "video");
        }
      }, true);
    }

    var btnSubmit = document.getElementById("btn-submit-generate");
    if (btnSubmit) {
      btnSubmit.addEventListener("click", function (e) {
        if (window.engineMode === "kling") {
          e.stopImmediatePropagation();
          eksekusiGenerateKling();
        }
      }, true);
    }

    if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
      window.riwayatGenerateList.forEach(function (t) {
        if ((t.prov === "kling" || String(t.id).includes("-")) && !t.selesai) {
          pantauStatusKling(t);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inisialisasiKlingEngine);
  } else {
    inisialisasiKlingEngine();
  }
})();
