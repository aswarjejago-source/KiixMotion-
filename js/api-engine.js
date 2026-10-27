// ==========================================
// PILAR 3: ENGINE LOGIC (CORE MOTION & MINIMAX ENGINE)
// File: js/api-engine.js
// ==========================================

window.riwayatGenerateList = window.riwayatGenerateList || [];
var riwayatGenerateList = window.riwayatGenerateList;

var engineMode = window.providerAktif || window.engineProvider || 'kiix'; 
window.engineMode = engineMode;
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

        if (dbUser) {
          var isVIP = (
            dbUser.is_vip === true ||
            dbUser.is_pro === true ||
            dbUser.role === 'pro' ||
            dbUser.role === 'vip' ||
            dbUser.status === 'pro' ||
            dbUser.status === 'vip'
          );

          // Hanya set default jika user belum memilih provider atau masih default kiix/pro
          var currentP = window.providerAktif || window.engineProvider;
          if (!currentP || currentP === 'kiix' || currentP === 'pro' || currentP === 'runninghub') {
            if (typeof window.setProviderUtama === 'function') {
              window.setProviderUtama(isVIP ? 'runninghub' : 'kiix');
            }
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
  var inPromptMM = document.getElementById('prompt-minimax');

  if (inFoto) inFoto.value = '';
  if (inVideo) inVideo.value = '';
  if (txtFoto) txtFoto.innerText = 'Foto Karakter';
  if (txtVideo) txtVideo.innerText = 'Video Gerakan';
  if (stFoto) stFoto.innerHTML = 'JPG / PNG';
  if (stVideo) stVideo.innerHTML = 'MP4 (Maks 10s)';
  if (inPrompt) inPrompt.value = '';
  if (inPromptMM) inPromptMM.value = '';

  for (var i = 1; i <= 9; i++) {
    if (typeof hapusPreviewMinimax === 'function') {
      try {
        hapusPreviewMinimax({ preventDefault: function(){}, stopPropagation: function(){} }, i);
      } catch (e) {}
    }
  }
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

// FUNGSI INI DIUBAH AGAR MEMAKAI LOGIKA UTAMA DARI UI-CONTROLLER
function setProviderUtama(mode) {
  if (typeof window.setProviderUtama === 'function' && window.setProviderUtama !== setProviderUtama) {
    window.setProviderUtama(mode);
  } else {
    engineMode = mode;
    window.engineMode = mode;
    window.providerAktif = mode;
  }
}

function unggahBahanLangsung(input, tipe) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var txtEl = document.getElementById(tipe === 'foto' ? 'txt-file-foto' : 'txt-file-video');
  var stEl = document.getElementById(tipe === 'foto' ? 'st-file-foto' : 'st-file-video');

  if (txtEl) txtEl.innerText = file.name;
  if (stEl) stEl.innerHTML = '<span class="text-amber-600 font-bold animate-pulse">⏳ Mengunggah (0%)...</span>';

  var formData = new FormData();
  formData.append('file', file);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://mute-wind-17c9kiix-uploader.ingkiofficial.workers.dev', true);

  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      var persen = Math.round((e.loaded / e.total) * 100);
      if (stEl) {
        stEl.innerHTML = '<span class="text-amber-600 font-bold animate-pulse">⏳ Mengunggah (' + persen + '%)...</span>';
      }
    }
  };

  xhr.onload = function() {
    var rawText = xhr.responseText || "";

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        var resJson = JSON.parse(rawText);
        var fileUrl = null;

        if (resJson && resJson.data) {
          if (typeof resJson.data === 'string') {
            fileUrl = resJson.data;
          } else if (typeof resJson.data === 'object') {
            fileUrl = resJson.data.fileUrl || resJson.data.fileName || resJson.data.url || resJson.data.path;
          }
        }

        if (!fileUrl) throw new Error("Link file tidak ditemukan dari server.");

        if (tipe === 'foto') {
          urlBahanFoto = fileUrl;
          window.urlBahanFoto = fileUrl;
        } else {
          urlBahanVideo = fileUrl;
          window.urlBahanVideo = fileUrl;
        }

        var ukuranMb = (file.size / (1024 * 1024)).toFixed(1);
        if (stEl) stEl.innerHTML = '<span class="text-emerald-600 font-bold">✓ Terunggah (' + ukuranMb + ' MB)</span>';
        if (typeof tampilkanNotif === 'function') tampilkanNotif('File berhasil diunggah!', 'sukses');

      } catch (err) {
        if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
        tampilkanNotifPusat('Gagal respons: ' + (err.message || 'Format tidak valid'));
      }
    } else {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
      tampilkanNotifPusat('Gagal mengunggah ke storage.');
    }
  };

  xhr.onerror = function() {
    if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
    tampilkanNotifPusat('Koneksi upload terputus.');
  };

  xhr.send(formData);
}

function pantauStatusVideo(tugas, apiKey, poolId, userId, didDeductCredit) {
  if (tugas.selesai) return; 
  if (!tugas.progress) tugas.progress = 0; 
  if (!tugas.startedAt) tugas.startedAt = Date.now();

  var currentPoolId = poolId || tugas.pool_id;
  var currentApiKey = apiKey || tugas.key;

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  async function jalankanCek() {
    if (tugas.selesai) {
      if (tugas.intervalObj) clearInterval(tugas.intervalObj);
      return;
    }

    var waktuBerjalan = Date.now() - tugas.startedAt;
    
    if (waktuBerjalan >= 3600000) {
      if (tugas.intervalObj) clearInterval(tugas.intervalObj);
      lepaskanKunciPoolOtomatis(currentPoolId);
      tugas.status = "❌ Gagal (Waktu Habis)"; 
      tugas.selesai = true;
      tugas.progress = 100;
      simpanStorage();
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
      return;
    }

    if (!currentApiKey && currentPoolId && typeof supa !== 'undefined') {
      try {
        var { data: poolRec } = await supa.from('runninghub_pool').select('api_key').eq('id', currentPoolId).maybeSingle();
        if (poolRec && poolRec.api_key) {
          currentApiKey = poolRec.api_key;
          tugas.key = currentApiKey;
        }
      } catch (e) {}
    }

    try {
      var res = await fetch('/api/outputs', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: tugas.id, 
          poolId: currentPoolId, 
          apiKey: currentApiKey 
        })
      });

      if (!res.ok) return;

      var jsonObj = await res.json();
      var code = Number(jsonObj.code);
      var statusTeks = "";

      if (jsonObj.data && typeof jsonObj.data === 'object' && !Array.isArray(jsonObj.data)) {
        statusTeks = (jsonObj.data.status || "").toString().toUpperCase().trim();
      }

      var isSedangJalan = (
        code === 804 ||
        code === 805 ||
        code === 806 ||
        statusTeks === "RUNNING" ||
        statusTeks === "QUEUED" ||
        statusTeks === "PROCESSING"
      );

      if (isSedangJalan) {
        if (code === 804 || statusTeks === "QUEUED") {
          tugas.status = "⏳ Mengantre di Server...";
        } else {
          tugas.status = "⚡ Sedang Memproses Video...";
        }

        if (tugas.progress < 92) {
          tugas.progress += 2;
        }
        simpanStorage();

        var taskIdStr = String(tugas.id || tugas.taskId || "");
        var semuaKad = document.querySelectorAll('.grid > div, [class*="card"], [class*="shadow"]');
        for (var k = 0; k < semuaKad.length; k++) {
          if (semuaKad[k].innerText && semuaKad[k].innerText.includes(taskIdStr)) {
            var elemenTeks = semuaKad[k].querySelectorAll('div, p, span');
            for (var tIdx = 0; tIdx < elemenTeks.length; tIdx++) {
              var txt = (elemenTeks[tIdx].innerText || "").trim();
              if (txt.endsWith('%') && txt.length <= 5) {
                elemenTeks[tIdx].innerText = tugas.progress + "%";
              }
            }
            break;
          }
        }
        return;
      }

      var isGagalAtauBatal = (
        code === 801 || 
        code === 802 || 
        code === 807 ||
        statusTeks === "FAILED" ||
        statusTeks === "ERROR" ||
        statusTeks === "CANCELED" ||
        statusTeks === "CANCELLED"
      );

      if (isGagalAtauBatal) {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        lepaskanKunciPoolOtomatis(currentPoolId);

        var labelStatus = (code === 807 || statusTeks.includes("CANCEL")) ? "❌ Dibatalkan di Server" : "❌ Gagal Diproses Studio";
        tugas.status = labelStatus;
        tugas.selesai = true;
        tugas.progress = 100;

        var targetUserErr = userId || tugas.user_id;
        if (didDeductCredit && !tugas.refunded && typeof supa !== 'undefined' && targetUserErr) {
          try {
            tugas.refunded = true;
            tugas.did_deduct = false;
            await supa.rpc('refund_kredit_member', { target_user_id: String(targetUserErr) });
            if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(tugas.user_email);
            tampilkanNotifPusat('Render dibatalkan/gagal. 1 kredit dikembalikan.');
          } catch (errRefund) {
            tugas.refunded = false;
          }
        }

        simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
        return;
      }

      if (code === 0 && jsonObj.data) {
        var linkOutputAsli = ambilLinkOutputResmi(jsonObj);
        
        if (linkOutputAsli) {
          if (tugas.intervalObj) clearInterval(tugas.intervalObj);
          lepaskanKunciPoolOtomatis(currentPoolId);

          tugas.status = "Selesai"; 
          tugas.selesai = true;
          tugas.progress = 100; 
          tugas.videoUrl = linkOutputAsli;

          simpanStorage();
          if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
          if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
          if (currentApiKey) refreshSaldoKunciOtomatis(currentApiKey);
          if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Video berhasil selesai!', 'sukses');
          return;
        }
      }

    } catch (err) {}
  }

  jalankanCek();
  tugas.intervalObj = setInterval(jalankanCek, 6000);
}

function hapusRiwayatSatu(target) {
  if (!window.riwayatGenerateList || window.riwayatGenerateList.length === 0) return;

  var targetId = null;

  if (typeof target === 'number') {
    var item = window.riwayatGenerateList[target];
    if (item) targetId = String(item.id || item.taskId || "").trim();
  } else if (typeof target === 'string') {
    targetId = target.trim();
  } else if (target && (target.nodeType || target.closest)) {
    var el = target.closest ? target.closest('[data-id], div') : null;
    if (el) {
      var raw = el.getAttribute('data-id') || el.innerText || '';
      var match = raw.match(/\b\d{15,22}\b/);
      if (match) targetId = match[0];
    }
  }

  if (targetId) {
    tambahKeBlacklist(targetId);
    window.riwayatGenerateList = window.riwayatGenerateList.filter(function(t) {
      var idTugas = String(t.id || t.taskId || "").trim();
      if (idTugas === targetId) {
        if (t.intervalObj) clearInterval(t.intervalObj);
        return false;
      }
      return true;
    });
  } else if (typeof target === 'number') {
    var del = window.riwayatGenerateList.splice(target, 1);
    if (del[0] && del[0].id) tambahKeBlacklist(del[0].id);
  }

  riwayatGenerateList = window.riwayatGenerateList;
  simpanStorage();

  if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
  if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
}

async function refreshSaldoKunciOtomatis(apiKey) {
  if (!apiKey) return;
  try {
    var res = await fetch('/api/saldo', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ apiKey: apiKey })
    });
    var hasil = await res.json();
    if (res.ok && hasil) {
      var rawData = hasil.data || hasil;
      var k = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.credit ?? rawData.balance ?? rawData.remainCoins;
      if (k !== undefined && k !== null) {
        var koinNum = Number(k);
        var idxKetemu = listKunciPro.findIndex(function(a) { return a.key === apiKey; });
        if (idxKetemu !== -1) {
          listKunciPro[idxKetemu].koin = koinNum;
          simpanStorage();
          updateStatistikDashboard();
          if (typeof renderListAkunDiKelola === 'function') renderListAkunDiKelola();
        }
      }
    }
  } catch (err) {}
}

function updateStatistikDashboard() {
  var totalKoin = 0, maxKoin = 0;
  listKunciPro.forEach(function(a) {
    var k = Number(a.koin) || 0;
    totalKoin += k;
    if (k > maxKoin) maxKoin = k;
  });
  
  var elTotal = document.querySelector('[id*="total-koin"]');
  var elAkun = document.querySelector('[id*="total-akun"]');
  var elMax = document.querySelector('[id*="max-koin"]');
  
  if (elTotal) elTotal.innerText = totalKoin;
  if (elAkun) elAkun.innerText = listKunciPro.length;
  if (elMax) elMax.innerText = maxKoin;

  if (window.riwayatGenerateList) {
    var elSelesai = document.querySelector('[id*="stat-video-selesai"]');
    if (elSelesai) elSelesai.innerText = window.riwayatGenerateList.filter(function(r) { return r.selesai; }).length;
  }
}

async function mulaiProsesGenerate() {
  var btn = document.getElementById('btn-submit-generate');
  var realEmail = null;
  var realUserId = null;
  var profilUser = null;
  var currentProvider = window.providerAktif || window.engineProvider || engineMode;

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
        if (dbUser) {
          profilUser = dbUser;
          if (!realUserId && dbUser.id) realUserId = dbUser.id;
        }
      }
    } catch (err) {}
  }

  if (!realEmail && typeof currentUserEmail !== 'undefined' && currentUserEmail) realEmail = currentUserEmail;
  if (!realEmail || !realUserId) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotifPusat('Sesi login berakhir, silakan login ulang!');
  }

  var isMemberVip = profilUser && (
    profilUser.is_vip === true ||
    profilUser.is_pro === true ||
    profilUser.role === 'pro' ||
    profilUser.role === 'vip' ||
    profilUser.status === 'pro' ||
    profilUser.status === 'vip'
  );

  var payloadGenerate = {
    provider: currentProvider,
    userId: realUserId,
    userEmail: realEmail
  };

  // VALIDASI KHUSUS MINIMAX H3
  if (currentProvider === 'minimax') {
    var inPromptMM = document.getElementById('prompt-minimax');
    var promptVal = inPromptMM ? inPromptMM.value.trim() : '';

    var listGambarMM = [];
    for (var idx = 1; idx <= 9; idx++) {
      var prev = document.getElementById('prev-mm-' + idx);
      if (prev && !prev.classList.contains('hidden') && prev.style.backgroundImage) {
        var cleanBg = prev.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        if (cleanBg) listGambarMM.push(cleanBg);
      }
    }

    if (listGambarMM.length === 0) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotifPusat('Unggah minimal 1 gambar untuk MiniMax H3!');
    }

    if (!promptVal) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotifPusat('Prompt/script MiniMax H3 tidak boleh kosong!');
    }

    payloadGenerate.prompt = promptVal;
    payloadGenerate.images = listGambarMM;
    payloadGenerate.performanceType = document.getElementById('sel-minimax-performa')?.value || 'dramatis';
    payloadGenerate.aspectRatio = document.getElementById('sel-minimax-ratio')?.value || '3:4';

  } else {
    // VALIDASI MOTION CONTROL ENGINE
    if (currentProvider === 'runninghub' || currentProvider === 'pro') {
      if (!isMemberVip) {
        if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
        tampilkanNotifPusat('Kamu belum punya akses Pro!');
        setTimeout(function() { alihkanKeMenuLangganan(); }, 500);
        return;
      }
    }

    if (!urlBahanFoto || !urlBahanVideo) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotifPusat('Foto karakter dan Video gerakan wajib selesai diunggah!');
    }

    payloadGenerate.urlBahanFoto = urlBahanFoto;
    payloadGenerate.urlBahanVideo = urlBahanVideo;
  }

  // PILIH AKUN PEMOTONG SALDO JIKA PAKAI API PRIBADI
  var apiKeyPribadi = null;
  var selAkun = document.getElementById('sel-dropdown-akun');
  if (selAkun && selAkun.value) {
    var dbAkun = window.dbAkun || JSON.parse(localStorage.getItem('kiix_akun_local_v1') || '[]');
    var foundAkun = dbAkun.find(function(a) { return String(a.id) === String(selAkun.value); });
    if (foundAkun) apiKeyPribadi = foundAkun.key;
  }
  payloadGenerate.apiKeyPribadi = apiKeyPribadi;

  if (btn) { btn.disabled = true; btn.innerText = "⚡ MEMPROSES VIDEO..."; }

  try {
    var res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadGenerate)
    });

    var data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memproses render ke server.');
    }

    var taskIdAsli = data.taskId;
    var poolIdDipakai = data.poolId;
    var didDeductCredit = data.didDeductCredit;

    var namaModel = "Wan Motion Control";
    var namaEngine = "Wan Motion Control 1080HD";
    var biayaRender = didDeductCredit ? "1 Kredit" : "≈ 478 coin";

    if (currentProvider === 'minimax') {
      namaModel = "MiniMax H3";
      namaEngine = "MiniMax H3 Master Workflow";
      biayaRender = "Sesuai Konsumsi";
    }

    var tugasBaru = {
      id: taskIdAsli,
      key: apiKeyPribadi || null,
      pool_id: poolIdDipakai,
      user_id: realUserId,
      user_email: realEmail,
      did_deduct: didDeductCredit,
      refunded: false,
      startedAt: Date.now(),
      model: namaModel,
      provider: currentProvider,
      engine: namaEngine,
      prov: currentProvider,
      tgl: "Baru saja",
      biaya: biayaRender,
      videoUrl: null,
      status: "⚡ Sedang Memproses Video...",
      selesai: false,
      progress: 0
    };

    window.riwayatGenerateList.unshift(tugasBaru);
    riwayatGenerateList = window.riwayatGenerateList;
    simpanStorage();

    resetFormBahanInput();
    tampilkanModalCeklisSukses(tugasBaru.id);

    if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(realEmail);
    pantauStatusVideo(tugasBaru, apiKeyPribadi, poolIdDipakai, tugasBaru.user_id, didDeductCredit);

  } catch (err) {
    var pesan = err.message || 'Terjadi gangguan koneksi ke server render.';
    tampilkanNotifPusat(pesan);
  } finally {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  }
}

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
      window.riwayatGenerateList.forEach(function(tugas) {
        if (!tugas.selesai && tugas.id) {
          pantauStatusVideo(tugas, tugas.key, tugas.pool_id, tugas.user_id, tugas.did_deduct);
        }
      });
    }
  }
});

setInterval(function() {
  try {
    var tombolSync = document.querySelector('button[onclick*="sync"], button[onclick*="Sync"]');
    if (tombolSync && document.visibilityState === 'visible') {
      if (typeof syncSemuaKunciKolam === 'function') {
        syncSemuaKunciKolam(true);
      } else if (typeof syncSaldoSemua === 'function') {
        syncSaldoSemua(true);
      } else if (typeof muatUlangDaftarPool === 'function') {
        muatUlangDaftarPool();
      }
    }
  } catch (e) {}
}, 20000);

window.addEventListener('DOMContentLoaded', function() {
  muatStorage();
  selaraskanRiwayatDenganAkun();
});

window.onload = function() {
  muatStorage();
  selaraskanRiwayatDenganAkun();
  updateStatistikDashboard();

  if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
  if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();

  if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
    window.riwayatGenerateList.forEach(function(tugas) {
      if (tugas.selesai && tugas.pool_id) {
        lepaskanKunciPoolOtomatis(tugas.pool_id);
      } else if (!tugas.selesai && tugas.id) {
        pantauStatusVideo(tugas, tugas.key, tugas.pool_id, tugas.user_id, tugas.did_deduct);
      }
    });
  }
};
