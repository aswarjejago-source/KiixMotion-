// ==========================================================================
// KIIX MOTION — KLING 2.6 MOTION CONTROL MODULE
// File: js/kling-engine.js
// Fitur: Bitstream-Level Sample Table Traverser (Time-Stretch 5.0s) + Owner Gate
// ==========================================================================

(function () {
  window.urlBahanFotoKling = null;
  window.urlBahanVideoKling = null;

  // ========================================================================
  // 1. DEEP ISO-BMFF SAMPLE TABLE TRAVERSER (SPOOF TIME-STRETCH 5.0s)
  // Menulis ulang mvhd, tkhd, mdhd, elst, dan membagi rata delta stts
  // agar seluruh sampel frame terkunci di timeline 0.0 - 5.0 detik.
  // ========================================================================
  async function palsukanDurasiMp4(fileAsli, targetDetik) {
    if (!targetDetik) targetDetik = 5.0;

    try {
      var buffer = await fileAsli.arrayBuffer();
      var view = new DataView(buffer);
      var totalBytes = buffer.byteLength;
      var movieTimescale = 1000;

      function getBoxType(offset) {
        var str = "";
        for (var i = 0; i < 4; i++) {
          str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
      }

      function prosesBox(offset, maxOffset) {
        var pos = offset;

        while (pos + 8 <= maxOffset) {
          var boxSize = view.getUint32(pos);
          var boxType = getBoxType(pos + 4);
          var headerSize = 8;

          if (boxSize === 1) {
            boxSize = Number(view.getBigUint64(pos + 8));
            headerSize = 16;
          } else if (boxSize === 0) {
            boxSize = maxOffset - pos;
          }

          if (boxSize < headerSize || pos + boxSize > maxOffset) break;

          var payloadPos = pos + headerSize;

          if (["moov", "trak", "mdia", "minf", "stbl", "edts"].includes(boxType)) {
            prosesBox(payloadPos, pos + boxSize);
          } else if (boxType === "mvhd") {
            var verMv = view.getUint8(payloadPos);
            var tsOff = (verMv === 1) ? (payloadPos + 20) : (payloadPos + 12);
            var durOff = (verMv === 1) ? (payloadPos + 28) : (payloadPos + 16);

            movieTimescale = view.getUint32(tsOff) || 1000;
            var targetDurMv = Math.floor(movieTimescale * targetDetik);

            if (verMv === 1) {
              view.setBigUint64(durOff, BigInt(targetDurMv));
            } else {
              view.setUint32(durOff, targetDurMv);
            }
          } else if (boxType === "tkhd") {
            var verTk = view.getUint8(payloadPos);
            var durOffTk = (verTk === 1) ? (payloadPos + 28) : (payloadPos + 20);
            var targetDurTk = Math.floor(movieTimescale * targetDetik);

            if (verTk === 1) {
              view.setBigUint64(durOffTk, BigInt(targetDurTk));
            } else {
              view.setUint32(durOffTk, targetDurTk);
            }
          } else if (boxType === "mdhd") {
            var verMd = view.getUint8(payloadPos);
            var tsOffMd = (verMd === 1) ? (payloadPos + 20) : (payloadPos + 12);
            var durOffMd = (verMd === 1) ? (payloadPos + 28) : (payloadPos + 16);

            var trackTimescale = view.getUint32(tsOffMd) || movieTimescale;
            var targetDurMd = Math.floor(trackTimescale * targetDetik);

            if (verMd === 1) {
              view.setBigUint64(durOffMd, BigInt(targetDurMd));
            } else {
              view.setUint32(durOffMd, targetDurMd);
            }
          } else if (boxType === "stts") {
            // Trik Inti: Tulis ulang delta waktu tiap sampel frame
            var entryCount = view.getUint32(payloadPos + 4);
            var tablePos = payloadPos + 8;

            if (entryCount > 0 && entryCount < 20000 && tablePos + (entryCount * 8) <= pos + boxSize) {
              var totalFrames = 0;
              for (var e = 0; e < entryCount; e++) {
                totalFrames += view.getUint32(tablePos + (e * 8));
              }

              if (totalFrames > 0) {
                // Hitung total unit waktu untuk durasi 5.0s
                var totalWaktuTarget = Math.floor(movieTimescale * targetDetik);
                var deltaBaruPerFrame = Math.max(1, Math.floor(totalWaktuTarget / totalFrames));

                // Kompres entri stts menjadi 1 entri tunggal yang mencakup semua frame
                view.setUint32(payloadPos + 4, 1);
                view.setUint32(tablePos, totalFrames);
                view.setUint32(tablePos + 4, deltaBaruPerFrame);
              }
            }
          } else if (boxType === "elst") {
            // Edit list boundary lock
            var verEl = view.getUint8(payloadPos);
            var elCount = view.getUint32(payloadPos + 4);
            var entryElPos = payloadPos + 8;
            var targetDurEl = Math.floor(movieTimescale * targetDetik);

            for (var e3 = 0; e3 < elCount; e3++) {
              if (verEl === 1) {
                view.setBigUint64(entryElPos + (e3 * 20), BigInt(targetDurEl));
              } else {
                view.setUint32(entryElPos + (e3 * 12), targetDurEl);
              }
            }
          }

          pos += boxSize;
        }
      }

      prosesBox(0, totalBytes);

      return new File([buffer], fileAsli.name.replace(/\.[^/.]+$/, "") + "_kling5s.mp4", {
        type: "video/mp4",
      });
    } catch (errSpoof) {
      console.warn("Pemeriksaan biner gagal, fallback ke file asli:", errSpoof);
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
      var sizeMb = file.size / (1024 * 1024);

      if (sizeMb > 50) {
        if (typeof tampilkanNotifPusat === "function") {
          tampilkanNotifPusat("Ukuran file di atas 50MB! Gunakan video di bawah 50MB agar stabil.");
        }
        if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ File > 50MB</span>';
        return;
      }

      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⚙️ Memodifikasi biner atom FFmpeg (5.0s)...</span>';
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
      if (typeof tampilkanNotif === "function") tampilkanNotif("✓ Bahan siap diproses!", "sukses");

    } catch (errUpload) {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
      if (typeof tampilkanNotifPusat === "function") {
        tampilkanNotifPusat("Gagal: " + (errUpload.message || "Gagal upload"));
      }
    }
  }

  // ========================================================================
  // 3. GENERATE KLING (KIRIM EMAIL OWNER KE BACKEND)
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
          userEmail: realEmail,
          prompt: "High quality cinematic motion capture, smooth movement, realistic studio lighting",
        }),
      });

      var data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memproses render ke gateway.");
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
  // 4. PEMANTAU STATUS
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
      } catch (e) {
        console.warn("Gagal mengecek status:", e);
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
          var alasan = kData.error?.message || "Gagal diproses engine";
          tugas.status = "❌ " + alasan;
          tugas.selesai = true;
          tugas.progress = 100;

          if (typeof simpanStorage === "function") simpanStorage();
          if (typeof renderVideoAsliKeGrid === "function") renderVideoAsliKeGrid();
          if (typeof aturTampilanHalamanUtama === "function") aturTampilanHalamanUtama();
          if (typeof tampilkanNotifPusat === "function") tampilkanNotifPusat("Gagal: " + alasan);
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
