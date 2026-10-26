// ==========================================================================
// KIIX MOTION — KLING 2.6 MOTION CONTROL MODULE (ISOLATED ENGINE)
// File: js/kling-engine.js
// ==========================================================================

(function () {
  // Simpan referensi bahan khusus engine Kling
  window.urlBahanFotoKling = null;
  window.urlBahanVideoKling = null;

  // ========================================================================
  // 1. MP4 HEADER SPOOFER (Memanipulasi Atom MVHD Durasi 30s -> 9.5s)
  // ========================================================================
  async function palsukanDurasiMp4(fileAsli) {
    try {
      var buffer = await fileAsli.arrayBuffer();
      var bytes = new Uint8Array(buffer);
      var view = new DataView(buffer);

      var posMvhd = -1;
      for (var i = 0; i < bytes.length - 8; i++) {
        if (
          bytes[i] === 0x6d &&     // 'm'
          bytes[i + 1] === 0x76 && // 'v'
          bytes[i + 2] === 0x68 && // 'h'
          bytes[i + 3] === 0x64    // 'd'
        ) {
          posMvhd = i - 4;
          break;
        }
      }

      if (posMvhd !== -1) {
        var versi = view.getUint8(posMvhd + 8);
        var offsetTimescale = posMvhd + 12;
        var offsetDuration = posMvhd + 16;

        if (versi === 1) {
          offsetTimescale = posMvhd + 20;
          offsetDuration = posMvhd + 28;
        }

        var timescale = view.getUint32(offsetTimescale);
        if (timescale > 0) {
          var targetDurasiPalsu = Math.floor(timescale * 9.5);
          if (versi === 1) {
            view.setBigUint64(offsetDuration, BigInt(targetDurasiPalsu));
          } else {
            view.setUint32(offsetDuration, targetDurasiPalsu);
          }
        }
      }

      return new File([bytes], fileAsli.name.replace(/\.[^/.]+$/, "") + "_spoofed.mp4", {
        type: "video/mp4",
      });
    } catch (errSpoof) {
      console.warn("Gagal modifikasi metadata MP4:", errSpoof);
      return fileAsli;
    }
  }

  // ========================================================================
  // 2. SISTEM UPLOAD BAHAN KLING (Supabase & Direct Cloud)
  // ========================================================================
  async function unggahBahanKling(file, tipe) {
    var stEl = document.getElementById(tipe === "foto" ? "st-file-foto" : "st-file-video");
    var txtEl = document.getElementById(tipe === "foto" ? "txt-file-foto" : "txt-file-video");
    if (txtEl) txtEl.innerText = file.name;

    var fileFinal = file;
    if (tipe === "video") {
      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⚙️ Menyesuaikan Metadata Video...</span>';
      fileFinal = await palsukanDurasiMp4(file);
    }

    var ext = fileFinal.name.split(".").pop() || (tipe === "foto" ? "jpg" : "mp4");
    var namaFile = "kling_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7) + "." + ext;

    // A. Prioritas Supabase Storage (Foto & Bahan di bawah 48 MB)
    if (fileFinal.size < 48 * 1024 * 1024 && window.supa && window.supa.storage) {
      try {
        if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⏳ Upload ke Cloud Kling...</span>';
        var resUp = await window.supa.storage.from("bahan-render").upload(namaFile, fileFinal, {
          cacheControl: "3600",
          upsert: true,
        });

        if (!resUp.error) {
          var resPub = window.supa.storage.from("bahan-render").getPublicUrl(namaFile);
          var linkPublik = resPub?.data?.publicUrl;
          if (linkPublik) {
            simpanBahanKling(linkPublik, fileFinal, tipe, stEl);
            return;
          }
        }
      } catch (errSupa) {
        console.warn("Upload Supabase gagal, beralih ke direct cloud...", errSupa);
      }
    }

    // B. Direct Cloud (tmpfiles.org dengan Direct Link)
    try {
      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⏳ Upload Cloud (0%)...</span>';
      var fd = new FormData();
      fd.append("file", fileFinal);

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://tmpfiles.org/api/v1/upload", true);

      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable && stEl) {
          var p = Math.round((e.loaded / e.total) * 100);
          stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⏳ Upload Cloud (' + p + "%)...</span>";
        }
      };

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var j = JSON.parse(xhr.responseText);
            var rawUrl = j.data?.url;
            if (!rawUrl) throw new Error("Gagal generate link publik.");
            var directHttps = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
            simpanBahanKling(directHttps, fileFinal, tipe, stEl);
          } catch (eParse) {
            if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Link</span>';
            if (typeof tampilkanNotifPusat === "function") tampilkanNotifPusat("Respon direct cloud gagal.");
          }
        } else {
          if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Upload</span>';
          if (typeof tampilkanNotifPusat === "function") tampilkanNotifPusat("Direct cloud menolak file.");
        }
      };

      xhr.onerror = function () {
        if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Koneksi Putus</span>';
        if (typeof tampilkanNotifPusat === "function") tampilkanNotifPusat("Koneksi upload direct cloud terputus.");
      };

      xhr.send(fd);
    } catch (errXhr) {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Error</span>';
    }
  }

  function simpanBahanKling(url, file, tipe, stEl) {
    if (tipe === "foto") {
      window.urlBahanFotoKling = url;
      window.urlBahanFoto = url;
    } else {
      window.urlBahanVideoKling = url;
      window.urlBahanVideo = url;
    }
    var mb = (file.size / (1024 * 1024)).toFixed(1);
    if (stEl) stEl.innerHTML = '<span class="text-emerald-600 font-bold">✓ Terunggah (' + mb + " MB)</span>";
    if (typeof tampilkanNotif === "function") tampilkanNotif("✓ Bahan Kling siap (HTTPS Aktif)!", "sukses");
  }

  // ========================================================================
  // 3. EKSEKUTOR GENERATE KLING (PIAPI GATEWAY)
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
  // 4. PEMANTAU TUGAS KLING
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

      // Fallback langsung ke gateway PiAPI jika backend proxy belum aktif
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
              for (var j = 0; j < spans.length; j++) {
                var t = (spans[j].innerText || "").trim();
                if (t.endsWith("%") && t.length <= 5) spans[j].innerText = tugas.progress + "%";
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
  // 5. INTERCEPTOR & BINDING UI (Mencegat Tanpa Mengubah Script Utama)
  // ========================================================================
  function inisialisasiKlingEngine() {
    // A. Intercept Pemilihan Kartu Provider
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

    // B. Intercept Input File Khusus Mode Kling
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

    // C. Intercept Tombol Generate Khusus Mode Kling
    var btnSubmit = document.getElementById("btn-submit-generate");
    if (btnSubmit) {
      btnSubmit.addEventListener("click", function (e) {
        if (window.engineMode === "kling") {
          e.stopImmediatePropagation();
          eksekusiGenerateKling();
        }
      }, true);
    }

    // D. Pulihkan Polling Tugas Kling yang Belum Selesai
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
