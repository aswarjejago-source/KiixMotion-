// ==========================================
// PILAR 3: ENGINE LOGIC (CORE MOTION ENGINE)
// File: js/api-engine.js
// ==========================================

window.riwayatGenerateList = window.riwayatGenerateList || [];
var riwayatGenerateList = window.riwayatGenerateList;

var engineMode = 'kiix'; 
window.engineMode = 'kiix';
var urlBahanFoto = null;
var urlBahanVideo = null;
var listKunciPro = [];

var ID_HAPUS_PERMANEN = ["2113884739211014561"];

function getBlacklistTugas() {
  try {
    var list = JSON.parse(localStorage.getItem('km_task_terhapus') || '[]');
    ID_HAPUS_PERMANEN.forEach(function(id) {
      if (list.indexOf(id) === -1) list.push(id);
    });
    return list;
  } catch (e) {
    return ID_HAPUS_PERMANEN;
  }
}

function tambahKeBlacklist(taskId) {
  if (!taskId) return;
  try {
    var list = getBlacklistTugas();
    var sId = String(taskId).trim();
    if (list.indexOf(sId) === -1) {
      list.push(sId);
      localStorage.setItem('km_task_terhapus', JSON.stringify(list));
    }
  } catch (e) {}
}

function tampilkanNotifPusat(pesan) {
  var notifLama = document.getElementById('km-notif-pusat');
  if (notifLama) notifLama.remove();

  var notifEl = document.createElement('div');
  notifEl.id = 'km-notif-pusat';
  notifEl.style.cssText = 'position:fixed; top:24px; left:50%; transform:translateX(-50%); z-index:9999999; background:#ef4444; color:#ffffff; padding:12px 24px; border-radius:16px; font-weight:800; font-size:14px; box-shadow:0 10px 30px rgba(239,68,68,0.45); display:flex; align-items:center; gap:10px; border:2px solid #ffffff; transition:all 0.3s ease; text-align:center; max-width:90vw; pointer-events:none;';
  notifEl.innerHTML = '<span style="font-size:18px;">⚠️</span> <span>' + pesan + '</span>';
  
  document.body.appendChild(notifEl);

  setTimeout(function() {
    if (notifEl) {
      notifEl.style.opacity = '0';
      notifEl.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(function() { notifEl.remove(); }, 350);
    }
  }, 2800);
}

function alihkanKeMenuLangganan() {
  if (typeof gantiLayarNav === 'function') {
    try { gantiLayarNav('vip'); } catch (e) {}
    try { gantiLayarNav('langganan'); } catch (e) {}
    try { gantiLayarNav('kredit'); } catch (e) {}
  }

  var semuaEl = document.querySelectorAll('button, a, div, span, li');
  var target = null;

  for (var i = 0; i < semuaEl.length; i++) {
    var txt = (semuaEl[i].textContent || semuaEl[i].innerText || "").trim().toLowerCase();
    if (txt === 'langganan vip' || txt.includes('langganan vip')) {
      target = semuaEl[i];
      break;
    }
  }

  if (!target) {
    for (var j = 0; j < semuaEl.length; j++) {
      var t = (semuaEl[j].textContent || semuaEl[j].innerText || "").trim().toLowerCase();
      if (t === 'beli kredit' || t.includes('beli kredit')) {
        target = semuaEl[j];
        break;
      }
    }
  }

  if (target) {
    var evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    target.dispatchEvent(evt);
    try { target.click(); } catch (e) {}
  }
}

function simpanStorage() {
  try {
    localStorage.setItem('km_list_kunci_pro', JSON.stringify(listKunciPro));
    if (window.riwayatGenerateList && Array.isArray(window.riwayatGenerateList)) {
      var dataStr = JSON.stringify(window.riwayatGenerateList);
      localStorage.setItem('km_riwayat_generate', dataStr);
    }
    var kunciZombie = ['riwayat_generate', 'km_riwayat', 'km_history', 'riwayat_video', 'km_riwayat_backup', 'riwayatGenerateList'];
    kunciZombie.forEach(function(k) { localStorage.removeItem(k); });
  } catch (e) {}
}

function muatStorage() {
  try {
    var rawKeys = localStorage.getItem('km_list_kunci_pro');
    if (rawKeys) listKunciPro = JSON.parse(rawKeys) || [];

    var blacklisted = getBlacklistTugas();
    var listUtama = [];

    var rawRiwayat = localStorage.getItem('km_riwayat_generate');
    if (rawRiwayat) {
      try { listUtama = JSON.parse(rawRiwayat) || []; } catch (e) {}
    }

    if (!listUtama || listUtama.length === 0) {
      var rawOld = localStorage.getItem('riwayat_generate') || localStorage.getItem('km_riwayat');
      if (rawOld) {
        try { listUtama = JSON.parse(rawOld) || []; } catch (e) {}
      }
    }

    var hasilBersih = [];
    var mapId = {};

    if (Array.isArray(listUtama)) {
      listUtama.forEach(function(item) {
        if (!item || typeof item !== 'object') return;
        var taskId = String(item.id || item.taskId || "").trim();
        if (!taskId || blacklisted.indexOf(taskId) !== -1) return;

        if (!mapId[taskId]) {
          mapId[taskId] = true;
          if (!item.id && item.taskId) item.id = item.taskId;
          if (!item.startedAt) item.startedAt = item.timestamp || Date.now();
          hasilBersih.push(item);
        }
      });
    }

    hasilBersih.sort(function(a, b) {
      return (Number(b.startedAt) || 0) - (Number(a.startedAt) || 0);
    });

    window.riwayatGenerateList = hasilBersih;
    riwayatGenerateList = hasilBersih;
    simpanStorage();
  } catch (e) {}
}

async function selaraskanRiwayatDenganAkun() {
  if (typeof supa !== 'undefined') {
    try {
      var sessionRes = await supa.auth.getSession();
      var sUser = sessionRes?.data?.session?.user;
      if (!sUser && typeof supa.auth.getUser === 'function') {
        var uRes = await supa.auth.getUser();
        sUser = uRes?.data?.user;
      }

      if (sUser) {
        var emailTarget = sUser.email ? sUser.email.toLowerCase().trim() : '';
        
        var { data: dbUser } = await supa
          .from('users')
          .select('*')
          .ilike('email', emailTarget)
          .maybeSingle();

        if (dbUser && window.engineMode !== 'kling') {
          var isVIP = (
            dbUser.is_vip === true ||
            dbUser.is_pro === true ||
            dbUser.role === 'pro' ||
            dbUser.role === 'vip' ||
            dbUser.status === 'pro' ||
            dbUser.status === 'vip'
          );

          if (isVIP) {
            setProviderUtama('pro');
          } else {
            setProviderUtama('kiix');
          }
        }

        if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
          window.riwayatGenerateList.forEach(function(t) {
            t.user_id = sUser.id;
            if (sUser.email) t.user_email = sUser.email.toLowerCase().trim();
          });

          simpanStorage();
          if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
          if (typeof updateStatistikDashboard === 'function') updateStatistikDashboard();
        }
      }
    } catch (err) {}
  }
}

async function lepaskanKunciPoolOtomatis(poolId) {
  if (!poolId) return;

  if (typeof supa !== 'undefined') {
    try {
      await supa.from('runninghub_pool').update({ status: 'idle' }).eq('id', poolId);
    } catch (e) {}
  }

  try {
    if (typeof muatUlangDaftarPool === 'function') muatUlangDaftarPool();
    if (typeof renderTabelPool === 'function') renderTabelPool();
    if (typeof hitungStatistikPool === 'function') hitungStatistikPool();
  } catch (e) {}
}

function ambilLinkOutputResmi(jsonObj) {
  if (!jsonObj) return null;
  var data = jsonObj.data;
  if (!data) return null;

  var hasilLink = null;

  function validasiLinkOutput(url) {
    if (!url || typeof url !== 'string' || hasilLink) return;
    var cleanUrl = url.trim().replace(/\\/g, '');
    
    if (cleanUrl.includes('workers.dev') || cleanUrl.includes('kiix-uploader')) return;

    if (cleanUrl.startsWith('http') && (
      cleanUrl.toLowerCase().includes('.mp4') || 
      cleanUrl.toLowerCase().includes('.mov') || 
      cleanUrl.toLowerCase().includes('.webm') ||
      cleanUrl.includes('rh-images') ||
      cleanUrl.includes('xiaoyaoyou')
    )) {
      hasilLink = cleanUrl;
    }
  }

  if (Array.isArray(data)) {
    data.forEach(function(item) {
      if (item && typeof item === 'object') {
        validasiLinkOutput(item.fileUrl || item.file_url || item.url || item.path);
      } else if (typeof item === 'string') {
        validasiLinkOutput(item);
      }
    });
  } else if (typeof data === 'object') {
    validasiLinkOutput(data.fileUrl || data.file_url || data.videoUrl || data.url || data.path);
  }

  return hasilLink;
}

function resetFormBahanInput() {
  urlBahanFoto = null;
  urlBahanVideo = null;
  window.urlBahanFoto = null;
  window.urlBahanVideo = null;

  var inFoto = document.getElementById('input-file-foto');
  var inVideo = document.getElementById('input-file-video');
  var txtFoto = document.getElementById('txt-file-foto');
  var txtVideo = document.getElementById('txt-file-video');
  var stFoto = document.getElementById('st-file-foto');
  var stVideo = document.getElementById('st-file-video');
  var inPrompt = document.getElementById('in-prompt-gerak');

  if (inFoto) inFoto.value = '';
  if (inVideo) inVideo.value = '';
  if (txtFoto) txtFoto.innerText = 'Foto Karakter';
  if (txtVideo) txtVideo.innerText = 'Video Gerakan';
  if (stFoto) stFoto.innerHTML = 'JPG / PNG';
  if (stVideo) stVideo.innerHTML = 'MP4 (Otomatis Kompres)';
  if (inPrompt) inPrompt.value = '';
}

function tampilkanModalCeklisSukses(taskId) {
  var modal = document.getElementById('modal-ceklis-sukses');
  var lblId = document.getElementById('label-ceklis-taskid');
  if (lblId) lblId.innerText = 'ID: ' + taskId;
  
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(function() {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.35s ease';
      setTimeout(function() {
        modal.style.display = 'none';
        modal.style.opacity = '1';
        if (typeof gantiLayarNav === 'function') gantiLayarNav('history');
      }, 350);
    }, 1800);
  }
}

function setProviderUtama(mode) {
  if (mode === 'kling') {
    engineMode = 'kling';
    window.engineMode = 'kling';
    return;
  }

  engineMode = (mode === 'kiix') ? 'kiix' : 'pro';
  window.engineMode = engineMode;
  
  var cards = document.querySelectorAll('[id^="c-prov-"]');
  var badges = document.querySelectorAll('[id^="b-prov-"]');
  
  cards.forEach(function(card, idx) {
    var isPilihan = (engineMode === 'kiix' && idx === 0) || (engineMode === 'pro' && idx === 1);
    card.className = isPilihan ?
      "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50 transition" :
      "bg-kmCard border border-kmBorder p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
  });

  badges.forEach(function(badge, idx) {
    var isPilihan = (engineMode === 'kiix' && idx === 0) || (engineMode === 'pro' && idx === 1);
    badge.style.display = isPilihan ? 'inline-block' : 'none';
  });

  var tTitle = document.getElementById('t-engine-title');
  var tTotal = document.getElementById('t-engine-total');
  var dropWrap = document.getElementById('box-wrap-dropdown-akun');
  var sel = document.getElementById('sel-dropdown-akun');
  var badgeSaldo = document.getElementById('badge-total-saldo-gen');

  if (engineMode === 'kiix') {
    if (tTitle) tTitle.innerText = "WAN MOTION CONTROL 1080HD";
    if (tTotal) tTotal.innerText = "1 Kredit";
    if (dropWrap) dropWrap.style.display = 'none';

  } else {
    if (tTitle) tTitle.innerText = "WAN MOTION CONTROL 1080HD";
    if (tTotal) tTotal.innerText = "≈ 478 coin";
    if (dropWrap) dropWrap.style.display = 'block';

    if (sel) {
      sel.innerHTML = '';
      if (listKunciPro.length === 0) {
        sel.innerHTML = '<option value="">Belum ada akun (Wajib Add Key)</option>';
        if (badgeSaldo) {
          badgeSaldo.innerText = "0 coin";
          badgeSaldo.className = "text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg";
        }
      } else {
        var total = 0;
        sel.innerHTML = '<option value="random">🎲 Otomatis (Pilih Acak Kunci)</option>';
        listKunciPro.forEach(function(a, idx) {
          var k = Number(a.koin) || 0;
          total += k;
          sel.innerHTML += '<option value="' + idx + '">Kunci #' + (idx + 1) + ': ' + a.key.substring(0, 8) + '... (' + k + ' coin)</option>';
        });
        if (badgeSaldo) {
          badgeSaldo.innerText = total + " coin";
          badgeSaldo.className = "text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg";
        }
      }
    }
  }
}

// ========================================================================
// KOMPRESOR RESOLUSI BROWSER (MENGECILKAN UKURAN VIDEO KE < 50MB)
// ========================================================================
async function kompresUkuranDiBrowser(file, onProgress) {
  return new Promise(function (resolve) {
    var video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = function () {
      var durasi = video.duration || 10;
      var targetLebar = Math.min(720, video.videoWidth || 720);
      var targetTinggi = Math.round((video.videoHeight * targetLebar) / video.videoWidth);
      targetTinggi = targetTinggi - (targetTinggi % 2);

      var canvas = document.createElement("canvas");
      canvas.width = targetLebar;
      canvas.height = targetTinggi;
      var ctx = canvas.getContext("2d");

      var stream = canvas.captureStream(30);
      var mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/mp4";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";

      var recorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 2500000
        });
      } catch (e) {
        URL.revokeObjectURL(video.src);
        return resolve(file);
      }

      var chunks = [];
      recorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = function () {
        URL.revokeObjectURL(video.src);
        var formatMime = mimeType.includes("mp4") ? "video/mp4" : "video/webm";
        var blobHasil = new Blob(chunks, { type: formatMime });
        var fileHasil = new File([blobHasil], file.name.replace(/\.[^/.]+$/, "") + "_720p.mp4", {
          type: "video/mp4"
        });
        resolve(fileHasil);
      };

      recorder.start(100);

      function renderFrame() {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, targetLebar, targetTinggi);
        if (typeof onProgress === "function" && durasi > 0) {
          var persen = Math.min(99, Math.floor((video.currentTime / durasi) * 100));
          onProgress(persen);
        }
        requestAnimationFrame(renderFrame);
      }

      video.onplay = renderFrame;
      video.onended = function () {
        setTimeout(function () {
          if (recorder.state === "recording") recorder.stop();
        }, 200);
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

// ========================================================================
// SISTEM UPLOAD BAHAN LANGSUNG KE SUPABASE / UPLOADER
// ========================================================================
async function unggahBahanLangsung(input, tipe) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var txtEl = document.getElementById(tipe === 'foto' ? 'txt-file-foto' : 'txt-file-video');
  var stEl = document.getElementById(tipe === 'foto' ? 'st-file-foto' : 'st-file-video');

  if (txtEl) txtEl.innerText = file.name;

  var fileFinal = file;

  if (tipe === 'video') {
    var sizeMbAwal = file.size / (1024 * 1024);
    if (sizeMbAwal > 45) {
      if (stEl) stEl.innerHTML = '<span class="text-amber-500 font-bold animate-pulse">⚡ Kompresi resolusi (<50MB)... 0%</span>';
      fileFinal = await kompresUkuranDiBrowser(file, function(persen) {
        if (stEl) stEl.innerHTML = '<span class="text-amber-500 font-bold animate-pulse">⚡ Kompresi resolusi... ' + persen + '%</span>';
      });
    }
  }

  var ext = fileFinal.name.split('.').pop() || (tipe === 'foto' ? 'jpg' : 'mp4');
  var namaFile = 'kiix_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '.' + ext;

  if (typeof supa !== 'undefined' && supa.storage) {
    try {
      var ukuranMb = (fileFinal.size / (1024 * 1024)).toFixed(1);
      if (stEl) stEl.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">⏳ Mengunggah (' + ukuranMb + ' MB)...</span>';

      var resUp = await supa.storage.from('bahan-render').upload(namaFile, fileFinal, {
        cacheControl:
