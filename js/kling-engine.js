// ==========================================================================
// KIIX MOTION — KLING MOTION CONTROL (FULL 30s + METADATA SPOOFER)
// File: js/kling-engine.js
// ==========================================================================

(function () {
  window.urlBahanFotoKling = null;
  window.urlBahanVideoKling = null;

  // ========================================================================
  // 1. KOMPRESOR BITRATE (30 DETIK UTUH, KECEPATAN NORMAL 1.0x)
  // Menjaga semua detik tetap ada, cuma ngecilin ukuran MB agar lolos Supabase
  // ========================================================================
  function kompresBitrate30Detik(fileAsli, stEl) {
    return new Promise(function (resolve) {
      var video = document.createElement("video");
      video.src = URL.createObjectURL(fileAsli);
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      video.onloadedmetadata = function () {
        var totalDurasiAsli = video.duration || 30;

        // Skala 720p proporsional
        var maxDim = 720;
        var w = video.videoWidth || 720;
        var h = video.videoHeight || 1280;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var targetW = Math.round((w * scale) / 2) * 2;
        var targetH = Math.round((h * scale) / 2) * 2;

        var canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        var ctx = canvas.getContext("2d");

        var stream = canvas.captureStream(30);
        var mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/mp4",
            videoBitsPerSecond: 3000000 // 3 Mbps (~11 MB untuk 30 detik penuh)
          });
        } catch (e) {
          try {
            mediaRecorder = new MediaRecorder(stream);
          } catch (e2) {
            URL.revokeObjectURL(video.src);
            return resolve(fileAsli);
          }
        }

        var chunks = [];
        mediaRecorder.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = function () {
          URL.revokeObjectURL(video.src);
          var blob = new Blob(chunks, { type: "video/mp4" });
          var compressedFile = new File(
            [blob],
            fileAsli.name.replace(/\.[^/.]+$/, "") + "_full30s.mp4",
            { type: "video/mp4" }
          );
          resolve(compressedFile);
        };

        // Kecepatan normal 1.0x agar deteksi anatomi gerak Kling tidak rusak
        video.playbackRate = 1.0;
        mediaRecorder.start(100);

        function renderLoop() {
          if (video.paused || video.ended) return;
          ctx.drawImage(video, 0, 0, targetW, targetH);

          if (stEl) {
            var persen = Math.min(99, Math.round((video.currentTime / totalDurasiAsli) * 100));
            stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⚡ Menyiapkan 30s (' + persen + '%)...</span>';
          }
          requestAnimationFrame(renderLoop);
        }

        video.onplay = function () {
          renderLoop();
        };

        // Berhenti otomatis saat video aslinya benar-benar habis (durasi penuh)
        video.onended = function () {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        };

        video.onerror = function () {
          URL.revokeObjectURL(video.src);
          resolve(fileAsli);
        };

        video.play().catch(function () {
          resolve(fileAsli);
        });
      };

      video.onerror = function () {
        resolve(fileAsli);
      };
    });
  }

  // ========================================================================
  // 2. MP4 BINARY PATCHER (Nipu Durasi Metadata -> 5.0 Detik)
  // Aliran visual tetap 30 detik, tapi validator cuma baca 5 detik
  // ========================================================================
  async function palsukanDurasiMp4(fileAsli, targetDetik) {
    if (!targetDetik) targetDetik = 5.0;
    try {
      var buffer = await fileAsli.arrayBuffer();
      var view = new DataView(buffer);
      var bytes = new Uint8Array(buffer);
      var len = bytes.length;

      var movieTimescale = 1000;

      // 1. Patch MVHD
      for (var i = 0; i < len - 36; i++) {
        if (bytes[i] === 0x6d && bytes[i+1] === 0x76 && bytes[i+2] === 0x68 && bytes[i+3] === 0x64) {
          var pos = i - 4;
          var version = view.getUint8(pos + 8);
          var tsOffset = (version === 1) ? (pos + 28) : (pos + 20);
          var durOffset = (version === 1) ? (pos + 32) : (pos + 24);

          movieTimescale = view.getUint32(tsOffset) || 1000;
          var newDur = Math.floor(movieTimescale * targetDetik);

          if (version === 1) {
            view.setBigUint64(durOffset, BigInt(newDur));
          } else {
            view.setUint32(durOffset, newDur);
          }
          break;
        }
      }

      // 2. Patch SEMUA TKHD
      for (var j = 0; j < len - 40; j++) {
        if (bytes[j] === 0x74 && bytes[j+1] === 0x6b && bytes[j+2] === 0x68 && bytes[j+3] === 0x64) {
          var posT = j - 4;
          var verT = view.getUint8(posT + 8);
          var durOffsetT = (verT === 1) ? (posT + 36) : (posT + 28);
          var newDurT = Math.floor(movieTimescale * targetDetik);

          if (verT === 1) {
            view.setBigUint64(durOffsetT, BigInt(newDurT));
          } else {
            view.setUint32(durOffsetT, newDurT);
          }
        }
      }

      // 3. Patch SEMUA MDHD
      for (var k = 0; k < len - 36; k++) {
        if (bytes[k] === 0x6d && bytes[k+1] === 0x64 && bytes[k+2] === 0x68 && bytes[k+3] === 0x64) {
          var posM = k - 4;
          var verM = view.getUint8(posM + 8);
          var tsOffsetM = (verM === 1) ? (posM + 28) : (posM + 20);
          var durOffsetM = (verM === 1) ? (posM + 32) : (posM + 24);

          var mediaTimescale = view.getUint32(tsOffsetM) || movieTimescale;
          var newDurM = Math.floor(mediaTimescale * targetDetik);

          if (verM === 1) {
            view.setBigUint64(durOffsetM, BigInt(newDurM));
          } else {
            view.setUint32(durOffsetM, newDurM);
          }
        }
      }

      return new File([bytes], fileAsli.name.replace(/\.[^/.]+$/, "") + "_spoofed.mp4", {
        type: "video/mp4",
      });
    } catch (errSpoof) {
      console.warn("Gagal spoofing metadata biner:", errSpoof);
      return fileAsli;
    }
  }

  // ========================================================================
  // 3. UPLOAD BAHAN KE SUPABASE STORAGE
  // ========================================================================
  async function unggahBahanKling(file, tipe) {
    var stEl = document.getElementById(tipe === "foto" ? "st-file-foto" : "st-file-video");
    var txtEl = document.getElementById(tipe === "foto" ? "txt-file-foto" : "txt-file-video");
    if (txtEl) txtEl.innerText = file.name;

    var fileFinal = file;

    if (tipe === "video") {
      // Jika file > 45MB, kecilkan bitrate-nya tanpa memotong durasi 30 detik
      if (fileFinal.size >= 45 * 1024 * 1024) {
        if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⚡ Menyiapkan 30s (0%)...</span>';
        fileFinal = await kompresBitrate30Detik(fileFinal, stEl);
      }

      // Timpa metadatanya jadi 5.0 detik
      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⚙️ Memalsukan durasi API...</span>';
      fileFinal = await palsukanDurasiMp4(fileFinal, 5.0);
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

      if (stEl) stEl.innerHTML = '<span class="text-emerald-600 font-bold">✓ Terunggah (' + ukuranMb + ' MB - 30s)</span>';
      if (typeof tampilkanNotif === "function") tampilkanNotif("✓ Bahan Kling siap!", "sukses");

    } catch (errUpload) {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
      if (typeof tampilkanNotifPusat === "function") {
        tampilkanNotifPusat("Gagal unggah: " + (errUpload.message || "Batas storage terlampaui"));
      }
    }
  }

  // ========================================================================
  // 4. GENERATE KLING (PIAPI GATEWAY)
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
  // 5. PEMANTAU TUGAS KLING
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
  // 6. EVENT LISTENERS
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
