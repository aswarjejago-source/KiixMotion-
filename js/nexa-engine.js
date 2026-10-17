// ==========================================
// MESIN 2: JALUR NEXABOT API (VEO 3 & OMNI FLASH)
// File: js/nexa-engine.js
// ==========================================

const NEXA_API_KEY = "nxb_c0efad50bc2195bb413aec3feae69f3fc887884ff5de0293";
const NEXA_BASE_URL = "https://nexabot.id/api/v1";

// 1. FUNGSI UTAMA GENERATE (DIPANGGIL OLEH TOMBOL DI STUDIO)
async function mulaiProsesNexa() {
  var btn = document.getElementById('btn-submit-nano');
  var promptEl = document.getElementById('in-prompt-veo');
  var promptTeks = promptEl ? promptEl.value.trim() : '';

  // Baca Mode Aktif dari Dropdown
  var labelMode = document.getElementById('label-mode-aktif') ? document.getElementById('label-mode-aktif').innerText.toLowerCase() : '';
  var modeAktif = "t2v";
  if (labelMode.includes("start frame")) modeAktif = "sfv";
  else if (labelMode.includes("ingredient")) modeAktif = "i2v";
  else if (labelMode.includes("reference")) modeAktif = "r2v";

  // Baca Rasio dan Resolusi
  var selects = document.querySelectorAll('#area-workspace-nano select');
  var rasioVal = 1; // Default 16:9 Landscape
  var resVal = 720; // Default 720p
  if (selects.length >= 2) {
    if (selects[0].value === "9:16") rasioVal = 2;
    if (selects[1].value === "1080") resVal = 1080;
  }

  // Validasi Input Prompt
  if (!promptTeks && modeAktif !== 'extend') {
    return tampilkanNotif('Tuliskan prompt deskripsi video terlebih dahulu!', 'error');
  }

  // Satpam Akun Admin
  var realEmail = null;
  if (typeof supa !== 'undefined') {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph-fill ph-spinner animate-spin text-lg"></i> MEMERIKSA SESI...'; }
    try {
      var sessionRes = await supa.auth.getSession();
      var sessionUser = sessionRes?.data?.session?.user;
      if (sessionUser && sessionUser.email) realEmail = sessionUser.email.toLowerCase().trim();
    } catch (err) {}
  }

  if (!realEmail && typeof currentUserEmail !== 'undefined' && currentUserEmail) {
    realEmail = currentUserEmail.toLowerCase().trim();
  }

  if (realEmail !== 'anggraingki@gmail.com') {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-fill ph-play-circle text-lg"></i> GENERATE SEKARANG'; }
    return tampilkanNotif('Akses ditolak! Fitur Veo 3 & Omni Flash khusus akun Admin.', 'error');
  }

  tampilkanNotif('Akses Admin diverifikasi. Menyiapkan data render...', 'sukses');
  if (btn) { btn.innerHTML = '<i class="ph-fill ph-gear animate-spin text-lg"></i> MEMPROSES MEDIA...'; }

  // Siapkan Data Base64 jika bukan Text-to-Video murni
  var mediaArr = [];
  try {
    if (modeAktif !== 't2v') {
      var inFoto = document.querySelector('#upload-foto-nano input[type="file"]');
      var inVideo = document.querySelector('#upload-video-nano input[type="file"]');

      if (modeAktif === 'r2v' || modeAktif === 'extend') {
        if (!inVideo || !inVideo.files || !inVideo.files[0]) {
          throw new Error("File video referensi (MP4) wajib diunggah!");
        }
        var b64Video = await konversiFileKeBase64(inVideo.files[0]);
        mediaArr.push(b64Video);

        if (modeAktif === 'r2v' && inFoto && inFoto.files && inFoto.files[0]) {
          var b64Foto = await konversiFileKeBase64(inFoto.files[0]);
          mediaArr.push(b64Foto);
        }
      } else {
        if (!inFoto || !inFoto.files || !inFoto.files[0]) {
          throw new Error("Foto referensi wajib diunggah untuk mode ini!");
        }
        var b64Img = await konversiFileKeBase64(inFoto.files[0]);
        mediaArr.push(b64Img);
      }
    }
  } catch (errMedia) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-fill ph-play-circle text-lg"></i> GENERATE SEKARANG'; }
    return tampilkanNotif(errMedia.message, 'error');
  }

  if (btn) { btn.innerHTML = '<i class="ph-fill ph-rocket text-lg"></i> MENGIRIM KE NEXABOT...'; }

  // Susun Payload Sesuai Dokumentasi Resmi Nexabot
  var payload = {
    mode: modeAktif,
    prompt: promptTeks,
    rasio: rasioVal,
    resolusi: resVal
  };

  if (mediaArr.length > 0) {
    payload.media = mediaArr;
  }

  var jobIdDidapat = null;

  try {
    var res = await fetch(NEXA_BASE_URL + '/api', {
      method: 'POST',
      headers: {
        'x-api-key': NEXA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    var data = await res.json();
    jobIdDidapat = data.job_id || data.ID_pekerjaan || data.id || (data.pekerjaan && data.pekerjaan.id);

    if (res.ok && (data.Oke === true || data.ok === true || jobIdDidapat)) {
      tampilkanNotif('✓ Tugas berhasil masuk antrean Nexabot! ID: ' + jobIdDidapat, 'sukses');
    } else {
      var pesanErr = data.message || data.kesalahan || data.msg || JSON.stringify(data);
      throw new Error(pesanErr);
    }
  } catch (errApi) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-fill ph-play-circle text-lg"></i> GENERATE SEKARANG'; }
    return tampilkanNotif('Gagal mengirim tugas: ' + errApi.message, 'error');
  }

  // Buat Kartu Riwayat di KiixMotion
  var tugasBaru = {
    id: jobIdDidapat,
    key: "nexa",
    model: "Nexa " + modeAktif.toUpperCase() + " " + resVal + "p",
    provider: "Nexabot API",
    engine: "Nexa " + modeAktif.toUpperCase() + " (" + resVal + "p)",
    prov: "Nexa",
    tgl: "Baru saja",
    biaya: "0.15 kredit",
    videoUrl: null,
    url: null,
    status: "Sedang Diproses Nexa...",
    selesai: false,
    progress: 10
  };

  if (typeof riwayatGenerateList !== 'undefined') {
    riwayatGenerateList.unshift(tugasBaru);
    if (typeof simpanStorage === 'function') simpanStorage();
    if (typeof gantiLayarNav === 'function') gantiLayarNav('history');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-fill ph-play-circle text-lg"></i> GENERATE SEKARANG'; }

  // Jalankan CCTV Polling ke Nexabot
  if (jobIdDidapat) {
    pantauTaskNexabot(tugasBaru);
  }
}

// 2. CCTV POLLING PENGECEKAN STATUS PEKERJAAN
function pantauTaskNexabot(tugas) {
  if (tugas.selesai) return;
  if (!tugas.progress) tugas.progress = 10;
  if (!tugas.cekCount) tugas.cekCount = 0;

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  var intervalId = setInterval(async function() {
    tugas.intervalObj = intervalId;

    if (tugas.selesai) {
      clearInterval(intervalId);
      return;
    }

    tugas.cekCount++;
    if (tugas.cekCount > 120) { // Batas waktu sekitar 15 menit
      clearInterval(intervalId);
      tugas.status = "❌ Gagal (Batas Waktu Habis)";
      tugas.selesai = true;
      tugas.progress = 100;
      if (typeof simpanStorage === 'function') simpanStorage();
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
      return;
    }

    try {
      var res = await fetch(NEXA_BASE_URL + '/jobs/' + tugas.id, {
        method: 'GET',
        headers: { 'x-api-key': NEXA_API_KEY }
      });

      var data = await res.json();
      var jobObj = data.pekerjaan || data.job || data;
      var statusJob = (jobObj.status || '').toLowerCase();

      if (statusJob === 'selesai' || statusJob === 'completed' || statusJob === 'done') {
        clearInterval(intervalId);
        tugas.status = "Selesai";
        tugas.selesai = true;
        tugas.progress = 100;

        // Unduh File Video Menggunakan Kunci API lalu Rakit Menjadi Objek URL
        try {
          var dlRes = await fetch(NEXA_BASE_URL + '/jobs/' + tugas.id + '/download', {
            headers: { 'x-api-key': NEXA_API_KEY }
          });
          var blobVideo = await dlRes.blob();
          var videoUrlFinal = URL.createObjectURL(blobVideo);

          tugas.videoUrl = videoUrlFinal;
          tugas.url = videoUrlFinal;
        } catch (eDl) {
          tugas.videoUrl = NEXA_BASE_URL + '/jobs/' + tugas.id + '/download';
          tugas.url = tugas.videoUrl;
        }

        if (typeof simpanStorage === 'function') simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        tampilkanNotif('✓ Video ' + tugas.id + ' berhasil dibuat!', 'sukses');
        return;

      } else if (statusJob === 'gagal' || statusJob === 'failed' || statusJob === 'error') {
        clearInterval(intervalId);
        var errMsg = jobObj.kesalahan || jobObj.error || "Dibatalkan oleh server Nexabot";
        tugas.status = "❌ Gagal: " + errMsg;
        tugas.selesai = true;
        tugas.progress = 100;
        if (typeof simpanStorage === 'function') simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        return;
      }

      // Simulasi persentase rendering di layar
      if (tugas.progress < 92) {
        tugas.progress += Math.floor(Math.random() * 4) + 2;
      }
      tugas.status = "Sedang Merender di Nexa...";
      if (typeof simpanStorage === 'function') simpanStorage();
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();

    } catch (ePoll) {
      console.warn("Polling Nexabot tertunda, mencoba kembali...", ePoll);
    }
  }, 8000); // Polling tiap 8 detik
}

// 3. FUNGSI KONVERSI GAMBAR/VIDEO KE DATA URI BASE64
function konversiFileKeBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = function(err) { reject(err); };
    reader.readAsDataURL(file);
  });
}

// Kompatibilitas jika tombol di HTML masih memanggil nama fungsi lama
window.mulaiProsesNanoAI = mulaiProsesNexa;
window.mulaiProsesNexa = mulaiProsesNexa;
