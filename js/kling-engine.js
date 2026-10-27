// ==========================================================================
// KIIX MOTION — KLING 2.6 MOTION CONTROL MODULE (MANDIRI & TERISOLASI)
// File: js/kling-engine.js
// ==========================================================================

(function () {
  window.urlBahanFotoKling = null;
  window.urlBahanVideoKling = null;

  function bungkusStreamProxy(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('/api/stream') || url.includes('/api/stream?url=')) return url;
    return '/api/stream?url=' + encodeURIComponent(url);
  }

  // 1. TAMENG OTOMATIS: CEGAH API-ENGINE IKUT CAMPUR MEMANTAU TUGAS KLING
  function pasangTamengPemantauGlobal() {
    var pemantauLama = window.pantauStatusVideo;
    if (typeof pemantauLama === 'function' && !pemantauLama._isShielded) {
      window.pantauStatusVideo = function (tugas) {
        if (tugas && (tugas.prov === 'kling' || tugas.provider === 'kling' || String(tugas.id).includes('-'))) {
          return pantauStatusKling(tugas);
        }
        return pemantauLama.apply(this, arguments);
      };
      window.pantauStatusVideo._isShielded = true;
    }
  }

  // 2. INJEKTOR BINER MP4 (MEMALSUKAN HEADER FFPROBE KE 5 DETIK TANPA POTONG/PERCEPAT)
  async function palsukanDurasiMP4(file, targetDetik = 5.0) {
    var buffer = await file.arrayBuffer();
    var bytes = new Uint8Array(buffer);
    var view = new DataView(buffer);

    function cariTag(tagStr) {
      var t = [tagStr.charCodeAt(0), tagStr.charCodeAt(1), tagStr.charCodeAt(2), tagStr.charCodeAt(3)];
      var hasil = [];
      for (var i = 0; i < bytes.length - 8; i++) {
        if (bytes[i] === t[0] && bytes[i + 1] === t[1] && bytes[i + 2] === t[2] && bytes[i + 3] === t[3]) {
          hasil.push(i);
        }
      }
      return hasil;
    }

    var movieTimescale = 1000;

    // A. Manipulasi mvhd (Movie Header)
    var mvhdOffsets = cariTag("mvhd");
    if (mvhdOffsets.length > 0) {
      var offset = mvhdOffsets[0];
      var version = bytes[offset + 4];
      if (version === 0) {
        movieTimescale = view.getUint32(offset + 16);
        var durasiBaru = Math.round(movieTimescale * targetDetik);
        view.setUint32(offset + 20, durasiBaru);
      } else if (version === 1) {
        movieTimescale = view.getUint32(offset + 24);
        var durasiBaruBig = BigInt(Math.round(movieTimescale * targetDetik));
        view.setBigUint64(offset + 28, durasiBaruBig);
      }
    }

    // B. Manipulasi mdhd (Media Header tiap track)
    var mdhdOffsets = cariTag("mdhd");
    mdhdOffsets.forEach(function (offset) {
      var version = bytes[offset + 4];
      if (version === 0) {
        var trackTimescale = view.getUint32(offset + 16);
        var durasiTrack = Math.round(trackTimescale * targetDetik);
        view.setUint32(offset + 20, durasiTrack);
      } else if (version === 1) {
        var trackTimescaleBig = view.getUint32(offset + 24);
        var durasiTrackBig = BigInt(Math.round(trackTimescaleBig * targetDetik));
        view.setBigUint64(offset + 28, durasiTrackBig);
      }
    });

    // C. Manipulasi tkhd (Track Header tiap track)
    var tkhdOffsets = cariTag("tkhd");
    tkhdOffsets.forEach(function (offset) {
      var version = bytes[offset + 4];
      var durasiTkhd = Math.round(movieTimescale * targetDetik);
      if (version === 0) {
        view.setUint32(offset + 24, durasiTkhd);
      } else if (version === 1) {
        view.setBigUint64(offset + 32, BigInt(durasiTkhd));
      }
    });

    return new File([buffer], file.name, { type: file.type || "video/mp4" });
  }

  // 3. KOMPRESOR CADANGAN (HANYA JIKA FILE DI ATAS 45 MB AGAR LOLOS SUPABASE)
  async function perkecilVideoHP(file, onProgress) {
    return new Promise(function (resolve) {
      var video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      video.onloadedmetadata = function () {
        var durasi = video.duration || 5;
        video.playbackRate = 1.0;

        var targetLebar = 540;
        var targetTinggi = Math.round((video.videoHeight * targetLebar) / video.videoWidth);
        targetTinggi = targetTinggi - (targetTinggi % 2);

        var canvas = document.createElement("canvas");
        canvas.width = targetLebar;
        canvas.height = targetTinggi;
        var ctx = canvas.getContext("2d");

        var stream = canvas.captureStream(25);
        var mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        if (!MediaRecorder.isTypeSupported(mime)) mime = "video/mp4";
        if (!MediaRecorder.isTypeSupported(mime)) mime = "video/webm";

        var rec;
        try {
          rec = new MediaRecorder(stream, {
            mimeType: mime,
            videoBitsPerSecond: 1500000
          });
        } catch (e) {
          URL.revokeObjectURL(video.src);
          return resolve(file);
        }

        var chunks = [];
        rec.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        rec.onstop = function () {
          URL.revokeObjectURL(video.src);
          var blobHasil = new Blob(chunks, { type: mime.includes("mp4") ? "video/mp4" : "video/webm" });
          var fileBaru = new File([blobHasil], file.name.replace(/\.[^/.]+$/, "") + "_lite.mp4", {
            type: "video/mp4"
          });
          resolve(fileBaru);
        };

        rec.start(100);

        function drawFrame() {
          if (video.paused || video.ended) return;
          ctx.drawImage(video, 0, 0, targetLebar, targetTinggi);
          if (typeof onProgress === "function" && durasi > 0) {
            var persen = Math.min(99, Math.floor((video.currentTime / durasi) * 100));
            onProgress(persen);
          }
          requestAnimationFrame(drawFrame);
        }

        video.onplay = drawFrame;
        video.onended = function () {
          setTimeout(function () {
            if (rec.state === "recording") rec.stop();
          }, 150);
        };

        video.play().catch(function () {
          URL.revokeObjectURL(video.src);
          resolve(file);
        });
      };

      video.onerror = function () {
        URL.revokeObjectURL(video.src);
        resolve(file);
      };
    });
  }

  // 4. SISTEM UNGGAH MURNI SUPABASE DENGAN PENYAMARAN HEADER
  async function unggahBahanKling(file, tipe) {
    var stEl = document.getElementById(tipe === "foto" ? "st-file-foto" : "st-file-video");
    var txtEl = document.getElementById(tipe === "foto" ? "txt-file-foto" : "txt-file-video");
    if (txtEl) txtEl.innerText = file.name;

    var fileFinal = file;

    if (tipe === "video") {
      var sizeMbAwal = file.size / (1024 * 1024);

      // Kompres hanya jika mendekati limit Supabase 50MB
      if (sizeMbAwal > 45) {
        if (stEl) stEl.innerHTML = '<span class="text-amber-500 font-bold animate-pulse">⚡ Mengoptimalkan video... 0%</span>';
        fileFinal = await perkecilVideoHP(file, function (persen) {
          if (stEl) stEl.innerHTML = '<span class="text-amber-500 font-bold animate-pulse">⚡ Mengoptimalkan video... ' + persen + '%</span>';
        });
      }

      // Suntik biner MP4 agar terbaca 5.0 detik oleh ffprobe PiAPI
      if (stEl) stEl.innerHTML = '<span class="text-indigo-500 font-bold animate-pulse">⚡ Menyamarkan metadata video...</span>';
      try {
        fileFinal = await palsukanDurasiMP4(fileFinal, 5.0);
      } catch (errPatch) {
        console.warn("Gagal menyuntik biner:", errPatch);
      }
    }

    var ext = fileFinal.name.split(".").pop() || (tipe === "foto" ? "jpg" : "mp4");
    var namaFile = "kling_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7) + "." + ext;

    try {
      var ukuranMb = (fileFinal.size / (1024 * 1024)).toFixed(1);
      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⏳ Mengunggah (' + ukuranMb + ' MB)...</span>';

      if (!window.supa || !window.supa.storage) {
        throw new Error("Koneksi Supabase belum siap. Refresh halaman.");
      }

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
      } else {
        window.urlBahanVideoKling = linkPublik;
      }

      if (stEl) stEl.innerHTML = '<span class="text-emerald-600 font-bold">✓ Terunggah (' + ukuranMb + ' MB)</span>';
      if (typeof tampilkanNotif === "function") tampilkanNotif("✓ Bahan siap diproses!", "sukses");

      var btn = document.getElementById("btn-submit-generate");
      if (btn) {
        btn.disabled = false;
        btn.innerText = "GENERATE VIDEO";
      }

    } catch (errUpload) {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
      if (typeof tampilkanNotifPusat === "function") {
        tampilkanNotifPusat("Gagal Unggah: " + (errUpload.message || "Bahan ditolak Supabase"));
      }
    }
  }
  window.unggahBahanKling = unggahBahanKling;

  // 5. EKSEKUSI GENERATE KE PIAPI
  async function jalankanGenerateKling() {
    var btn = document.getElementById("btn-submit-generate");
    var bahanFoto = window.urlBahanFotoKling;
    var bahanVideo = window.urlBahanVideoKling;

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
        var sess = await window.supa.auth.getSession();
        var user = sess?.data?.session?.user;
        if (!user && typeof window.supa.auth.getUser === "function") {
          var uRes = await window.supa.auth.getUser();
          user = uRes?.data?.user;
        }
        if (user) {
          realUserId = user.id;
          realEmail = user.email;
        }
      } catch (e) {}
    }

    if (!realEmail && typeof currentUserEmail !== "undefined") realEmail = currentUserEmail;

    if (btn) {
      btn.disabled = true;
      btn.innerText = "⚡ MEMPROSES KLING...";
    }

    try {
      var inPrompt = document.getElementById("in-prompt-gerak");
      var promptTeks = inPrompt ? inPrompt.value.trim() : "";

      var res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlBahanFoto: bahanFoto,
          urlBahanVideo: bahanVideo,
          provider: "kling",
          userId: realUserId,
          userEmail: realEmail,
          duration: 5,
          prompt: promptTeks || "High quality cinematic motion capture, smooth movement, realistic studio lighting",
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
        provider: "kling",
        engine: "Kling 2.6 Motion Control",
        prov: "kling",
        tgl: "Baru saja",
        biaya: "Testing Trial",
        videoUrl: null,
        rawVideoUrl: null,
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
      if (typeof renderVideoAsliKeGrid === "function") renderVideoAsliKeGrid();

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

  // 6. PEMANTAU STATUS TUGAS KLING
  function pantauStatusKling(tugas) {
    if (!tugas || (tugas.selesai && tugas.videoUrl)) return;
    if (tugas.intervalObj) clearInterval(tugas.intervalObj);
    if (!tugas.startedAt) tugas.startedAt = Date.now();

    async function cekStatus() {
      if (tugas.selesai && tugas.videoUrl) {
        clearInterval(tugas.intervalObj);
        return;
      }

      var waktuBerjalan = Date.now() - (tugas.startedAt || Date.now());
      if (waktuBerjalan >= 7200000 && !tugas.videoUrl) {
        clearInterval(tugas.intervalObj);
        tugas.status = "❌ Gagal (Waktu Habis)";
        tugas.selesai = true;
        tugas.progress = 100;
        if (typeof simpanStorage === "function") simpanStorage();
        if (typeof renderVideoAsliKeGrid === "function") renderVideoAsliKeGrid();
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

      if (kData) {
        var st = (kData.status || "").toLowerCase().trim();

        var videoUrlAsli = kData.output?.video_url || kData.output?.video || kData.works?.[0]?.video_url || kData.url;
        if (st === "completed" || st === "success" || videoUrlAsli) {
          if (videoUrlAsli) {
            clearInterval(tugas.intervalObj);
            tugas.status = "Selesai";
            tugas.selesai = true;
            tugas.progress = 100;
            tugas.rawVideoUrl = videoUrlAsli;
            tugas.videoUrl = bungkusStreamProxy(videoUrlAsli);

            if (typeof simpanStorage === "function") simpanStorage();
            if (typeof renderVideoAsliKeGrid === "function") renderVideoAsliKeGrid();
            if (typeof aturTampilanHalamanUtama === "function") aturTampilanHalamanUtama();
            if (typeof tampilkanNotif === "function") tampilkanNotif("✓ Video Kling berhasil selesai!", "sukses");
            return;
          }
        }

        var isGagal = st.includes("fail") || st.includes("err") || st.includes("cancel");
        if (isGagal && !videoUrlAsli) {
          clearInterval(tugas.intervalObj);
          var alasan = kData.error?.message || kData.message || "Gagal diproses engine";
          tugas.status = "❌ " + alasan;
          tugas.selesai = true;
          tugas.progress = 100;

          if (typeof simpanStorage === "function") simpanStorage();
          if (typeof renderVideoAsliKeGrid === "function") renderVideoAsliKeGrid();
          if (typeof aturTampilanHalamanUtama === "function") aturTampilanHalamanUtama();
          if (typeof tampilkanNotifPusat === "function") tampilkanNotifPusat("Gagal: " + alasan);
          return;
        }

        tugas.status = "⚡ Sedang Memproses Video...";
        if (tugas.progress < 95) tugas.progress += 2;
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

    cekStatus();
    tugas.intervalObj = setInterval(cekStatus, 6000);
  }

  // 7. INISIALISASI & INTERCEPTOR
  function inisialisasiKlingEngine() {
    pasangTamengPemantauGlobal();

    var provKlingEl = document.getElementById("c-prov-kling");
    if (provKlingEl) {
      provKlingEl.onclick = function (e) {
        window.engineMode = "kling";
        window.providerAktif = "kling";
        window.engineProvider = "kling";
        window._klingIsActive = true;

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

        var btn = document.getElementById("btn-submit-generate");
        if (btn) {
          btn.disabled = false;
          btn.innerText = "GENERATE VIDEO";
        }
      };
    }

    var otherCards = [document.getElementById("c-prov-kiix"), document.getElementById("c-prov-runninghub")];
    otherCards.forEach(function (el) {
      if (el) {
        el.addEventListener("click", function () {
          window._klingIsActive = false;
        });
      }
    });

    var inFoto = document.getElementById("input-file-foto");
    var inVideo = document.getElementById("input-file-video");

    if (inFoto) {
      inFoto.addEventListener("change", function (e) {
        if (window.engineMode === "kling" || window._klingIsActive) {
          e.stopImmediatePropagation();
          if (this.files && this.files[0]) unggahBahanKling(this.files[0], "foto");
        }
      }, true);
    }

    if (inVideo) {
      inVideo.addEventListener("change", function (e) {
        if (window.engineMode === "kling" || window._klingIsActive) {
          e.stopImmediatePropagation();
          if (this.files && this.files[0]) unggahBahanKling(this.files[0], "video");
        }
      }, true);
    }

    var btnSubmit = document.getElementById("btn-submit-generate");
    if (btnSubmit) {
      btnSubmit.addEventListener("click", function (e) {
        if (window.engineMode === "kling" || window._klingIsActive) {
          e.preventDefault();
          e.stopImmediatePropagation();
          jalankanGenerateKling();
        }
      }, true);
    }

    if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
      window.riwayatGenerateList.forEach(function (t) {
        if (t.prov === "kling" || t.provider === "kling" || String(t.id).includes("-")) {
          if (t.videoUrl && !t.videoUrl.startsWith('/api/stream') && t.videoUrl.startsWith('http')) {
            t.rawVideoUrl = t.videoUrl;
            t.videoUrl = bungkusStreamProxy(t.videoUrl);
            if (typeof simpanStorage === "function") simpanStorage();
          }

          if ((!t.videoUrl || !t.selesai) && t.id) {
            t.selesai = false;
            pantauStatusKling(t);
          }
        }
      });
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      pasangTamengPemantauGlobal();
      if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
        window.riwayatGenerateList.forEach(function (t) {
          if (t.prov === "kling" || t.provider === "kling" || String(t.id).includes("-")) {
            if ((!t.videoUrl || !t.selesai) && t.id) {
              t.selesai = false;
              pantauStatusKling(t);
            }
          }
        });
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inisialisasiKlingEngine);
  } else {
    inisialisasiKlingEngine();
  }
})();
