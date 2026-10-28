// ==========================================
// PILAR 3: ENGINE LOGIC (CORE MOTION & MINIMAX ENGINE)
// File: js/api-engine.js
// ==========================================

window.riwayatGenerateList = window.riwayatGenerateList || [];
var riwayatGenerateList = window.riwayatGenerateList;

var engineMode = window.providerAktif || window.engineProvider || window.engineMode || 'kiix'; 
window.engineMode = engineMode;
window.providerAktif = engineMode;
window.engineProvider = engineMode;

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

function bungkusStreamProxy(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('/api/stream') || url.includes('/api/stream?url=')) return url;
  return '/api/stream?url=' + encodeURIComponent(url);
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
      if (window.riwayatGenerateList.length === 0) {
        var dataAda = localStorage.getItem('km_riwayat_generate') || localStorage.getItem('km_riwayat_generate_bak');
        if (dataAda && dataAda !== '[]') {
          muatStorage();
          return;
        }
      }

      var dataStr = JSON.stringify(window.riwayatGenerateList);
      localStorage.setItem('km_riwayat_generate', dataStr);
      localStorage.setItem('km_riwayat_generate_bak', dataStr);
    }
  } catch (e) {}
}
window.simpanStorage = simpanStorage;

function muatStorage() {
  try {
    var rawKeys = localStorage.getItem('km_list_kunci_pro');
    if (rawKeys) listKunciPro = JSON.parse(rawKeys) || [];

    var blacklisted = getBlacklistTugas();
    var listUtama = [];

    var rawRiwayat = localStorage.getItem('km_riwayat_generate') || localStorage.getItem('km_riwayat_generate_bak');
    if (rawRiwayat) {
      try { listUtama = JSON.parse(rawRiwayat) || []; } catch (e) {}
    }

    if (!listUtama || listUtama.length === 0) {
      var rawOld = localStorage.getItem('riwayat_generate') || localStorage.getItem('km_riwayat') || localStorage.getItem('kiix_riwayat_gen_v1');
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

    if (hasilBersih.length > 0) {
      var dataStr = JSON.stringify(hasilBersih);
      localStorage.setItem('km_riwayat_generate', dataStr);
      localStorage.setItem('km_riwayat_generate_bak', dataStr);
    }
  } catch (e) {}
}
window.muatStorage = muatStorage;

muatStorage();

// SISTEM PEMILIHAN ENGINE & SINKRONISASI VISUAL KARTU
function setProviderUtama(mode) {
  var modePilihan = (mode || 'kiix').toLowerCase().trim();
  if (modePilihan === 'pro') modePilihan = 'runninghub';

  engineMode = modePilihan;
  window.engineMode = modePilihan;
  window.providerAktif = modePilihan;
  window.engineProvider = modePilihan;
  window._klingIsActive = (modePilihan === 'kling');

  var cKiix = document.getElementById("c-prov-kiix");
  var cRh = document.getElementById("c-prov-runninghub");
  var cKling = document.getElementById("c-prov-kling");

  var bKiix = document.getElementById("b-prov-kiix");
  var bRh = document.getElementById("b-prov-runninghub");
  var bKling = document.getElementById("b-prov-kling");

  var tTitle = document.getElementById("t-engine-title");
  var tTotal = document.getElementById("t-engine-total");
  var dropWrap = document.getElementById("box-wrap-dropdown-akun");

  var kartu = [cKiix, cRh, cKling];
  var badge = [bKiix, bRh, bKling];
  var targetIdx = (modePilihan === "kiix") ? 0 : (modePilihan === "runninghub") ? 1 : 2;

  kartu.forEach(function(c, idx) {
    if (c) {
      c.className = (idx === targetIdx)
        ? "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50 transition"
        : "bg-kmCard border border-kmBorder p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
    }
  });

  badge.forEach(function(b, idx) {
    if (b) b.style.display = (idx === targetIdx) ? "inline-block" : "none";
  });

  if (modePilihan === 'kiix') {
    if (tTitle) tTitle.innerText = "KIIXMOTION CONTROL";
    if (tTotal) tTotal.innerText = "1 Kredit / render";
    if (dropWrap) dropWrap.style.display = "none";
  } else if (modePilihan === 'runninghub') {
    if (tTitle) tTitle.innerText = "RUNNINGHUB PRO";
    if (tTotal) tTotal.innerText = "Akun Pribadi";
    if (dropWrap) dropWrap.style.display = "block";
  } else if (modePilihan === 'kling') {
    if (tTitle) tTitle.innerText = "KLING 2.6 MOTION CONTROL";
    if (tTotal) tTotal.innerText = "Testing Trial";
    if (dropWrap) dropWrap.style.display = "none";
  }

  var btn = document.getElementById("btn-submit-generate");
  if (btn) {
    btn.disabled = false;
    btn.innerText = "GENERATE VIDEO";
  }
}
window.setProviderUtama = setProviderUtama;

function pasangPilihanEngineListener() {
  var cKiix = document.getElementById("c-prov-kiix");
  var cRh = document.getElementById("c-prov-runninghub");
  var cKling = document.getElementById("c-prov-kling");

  if (cKiix && !cKiix._hasEngineClick) {
    cKiix._hasEngineClick = true;
    cKiix.addEventListener("click", function() { setProviderUtama("kiix"); });
  }

  if (cRh && !cRh._hasEngineClick) {
    cRh._hasEngineClick = true;
    cRh.addEventListener("click", function() { setProviderUtama("runninghub"); });
  }

  if (cKling && !cKling._hasEngineClick) {
    cKling._hasEngineClick = true;
    cKling.addEventListener("click", function() { setProviderUtama("kling"); });
  }
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

          var currentP = window.providerAktif || window.engineProvider || window.engineMode;
          if (!currentP || currentP === 'kiix' || currentP === 'pro' || currentP === 'runninghub') {
            setProviderUtama(isVIP ? 'runninghub' : 'kiix');
          }
        }

        if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
          window.riwayatGenerateList.forEach(function(t) {
            if (!t.user_id) t.user_id = sUser.id;
            if (!t.user_email && sUser.email) t.user_email = emailTarget;
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
  var data = jsonObj.data || jsonObj;
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

  var listHasil = data.results || jsonObj.results;
  if (Array.isArray(listHasil)) {
    listHasil.forEach(function(item) {
      if (item && typeof item === 'object') {
        validasiLinkOutput(item.url || item.fileUrl || item.file_url || item.path);
      }
    });
  }

  if (!hasilLink && Array.isArray(data)) {
    data.forEach(function(item) {
      if (item && typeof item === 'object') {
        validasiLinkOutput(item.fileUrl || item.file_url || item.url || item.path);
      } else if (typeof item === 'string') {
        validasiLinkOutput(item);
      }
    });
  } else if (!hasilLink && typeof data === 'object') {
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
    var divBg = document.getElementById('prev-mm-' + i);
    var delBtn = document.getElementById('del-mm-' + i);
    var plusIcon = document.getElementById('plus-mm-' + i);
    var lblText = document.getElementById('lbl-mm-' + i);
    var inSlot = document.getElementById('input-mm-' + i);

    if (divBg) {
      divBg.style.backgroundImage = '';
      divBg.removeAttribute('data-url');
      divBg.classList.add('hidden');
    }
    if (delBtn) { delBtn.classList.add('hidden'); delBtn.classList.remove('flex'); }
    if (plusIcon) plusIcon.classList.remove('hidden');
    if (lblText) { lblText.innerText = String(i); lblText.className = 'text-[10px] font-bold text-slate-400 mt-0.5 z-10'; }
    if (inSlot) inSlot.value = '';
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
window.unggahBahanLangsung = unggahBahanLangsung;

function pantauStatusVideo(tugas, apiKey, poolId, userId, didDeductCredit) {
  if (tugas.selesai && tugas.videoUrl) return; 

  // TAMENG ISOLASI KLING: Cegah tugas Kling ditembak ke /api/outputs RunningHub
  var isKlingTask = (
    tugas.prov === 'kling' || 
    tugas.provider === 'kling' || 
    (typeof tugas.id === 'string' && tugas.id.includes('-'))
  );

  if (isKlingTask) {
    if (typeof window.pantauStatusKling === 'function') {
      window.pantauStatusKling(tugas);
    }
    return;
  }

  if (!tugas.progress) tugas.progress = 0; 
  if (!tugas.startedAt) tugas.startedAt = Date.now();

  var currentPoolId = poolId || tugas.pool_id;
  var currentApiKey = apiKey || tugas.key;

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  async function jalankanCek() {
    if (tugas.selesai && tugas.videoUrl) {
      if (tugas.intervalObj) clearInterval(tugas.intervalObj);
      return;
    }

    var waktuBerjalan = Date.now() - (tugas.startedAt || Date.now());
    
    // Batas waktu pemantauan: 2 Jam (7.200.000 ms)
    if (waktuBerjalan >= 7200000 && !tugas.videoUrl) {
      if (tugas.intervalObj) clearInterval(tugas.intervalObj);
      lepaskanKunciPoolOtomatis(currentPoolId);
      tugas.status = "❌ Gagal (Waktu Habis)"; 
      tugas.selesai = true;
      tugas.progress = 100;

      var targetUserTO = userId || tugas.user_id;
      if (didDeductCredit && !tugas.refunded && typeof supa !== 'undefined' && targetUserTO) {
        try {
          tugas.refunded = true;
          tugas.did_deduct = false;
          await supa.rpc('refund_kredit_member', { target_user_id: String(targetUserTO) });
          if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(tugas.user_email);
          tampilkanNotifPusat('Waktu render habis. 1 kredit dikembalikan.');
        } catch (e) {
          tugas.refunded = false;
        }
      }

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
      var rawObj = jsonObj.data || jsonObj;
      var statusTeks = (rawObj.status || jsonObj.status || "").toString().toUpperCase().trim();

      // PRIORITAS 1: SEMAK JIKA HASIL VIDEO TELAH SIAP
      var linkOutputAsli = ambilLinkOutputResmi(jsonObj);
      if (statusTeks === "SUCCESS" || linkOutputAsli) {
        if (linkOutputAsli) {
          if (tugas.intervalObj) clearInterval(tugas.intervalObj);
          lepaskanKunciPoolOtomatis(currentPoolId);

          tugas.status = "Selesai"; 
          tugas.selesai = true;
          tugas.progress = 100; 
          tugas.rawVideoUrl = linkOutputAsli;
          tugas.videoUrl = bungkusStreamProxy(linkOutputAsli);

          simpanStorage();
          if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
          if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
          if (currentApiKey) refreshSaldoKunciOtomatis(currentApiKey);
          if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Video berhasil selesai!', 'sukses');
          return;
        }
      }

      // PRIORITAS 2: SEMAK STATUS GAGAL / BATAL DARI SERVER
      var isGagalAtauBatal = (
        code === 801 || 
        code === 802 || 
        code === 807 ||
        statusTeks.includes("FAIL") ||
        statusTeks.includes("ERR") ||
        statusTeks.includes("CANCEL")
      );

      if (isGagalAtauBatal && !linkOutputAsli) {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        lepaskanKunciPoolOtomatis(currentPoolId);

        var labelStatus = statusTeks.includes("CANCEL") ? "❌ Dibatalkan di Server" : "❌ Gagal Diproses Studio";
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

      // PRIORITAS 3: STATUS SEDANG BERJALAN ATAU MENGANTRE
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

        if (tugas.progress < 95) {
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
      }

    } catch (err) {}
  }

  jalankanCek();
  tugas.intervalObj = setInterval(jalankanCek, 6000);
}
window.pantauStatusVideo = pantauStatusVideo;

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
  var currentProvider = window.providerAktif || window.engineProvider || window.engineMode || engineMode;

  // HAND-OFF AMAN JIKA MODE KLING AKTIF
  if (currentProvider === 'kling' || window._klingIsActive) {
    if (typeof window.jalankanGenerateKling === 'function') {
      return window.jalankanGenerateKling();
    } else {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotifPusat('Engine Kling belum siap atau sedang dimuat.');
    }
  }

  var realEmail = null;
  var realUserId = null;
  var profilUser = null;

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

  if (currentProvider === 'minimax') {
    var inPromptMM = document.getElementById('prompt-minimax');
    var promptVal = inPromptMM ? inPromptMM.value.trim() : '';

    var listGambarMM = [];
    for (var idx = 1; idx <= 9; idx++) {
      var prev = document.getElementById('prev-mm-' + idx);
      if (prev && !prev.classList.contains('hidden')) {
        var cleanBg = (prev.dataset.url || prev.getAttribute('data-url') || prev.style.backgroundImage || '')
          .replace(/^url\(["']?/, '')
          .replace(/["']?\)$/, '')
          .replace(/["']/g, '')
          .trim();

        if (cleanBg) {
          listGambarMM.push({ slot: idx, url: cleanBg });
        }
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
    payloadGenerate.fpsMode = document.getElementById('sel-minimax-frame')?.value || '24fps';
    payloadGenerate.duration = document.getElementById('sel-minimax-durasi')?.value || '15';
    payloadGenerate.aspectRatio = document.getElementById('sel-minimax-ratio')?.value || '3:4';

  } else {
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
      biayaRender = didDeductCredit ? "1 Kredit" : "≈ 257 coin";
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
      rawVideoUrl: null,
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
    if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
    pantauStatusVideo(tugasBaru, apiKeyPribadi, poolIdDipakai, tugasBaru.user_id, didDeductCredit);

  } catch (err) {
    var pesan = err.message || 'Terjadi gangguan koneksi ke server render.';
    tampilkanNotifPusat(pesan);
  } finally {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  }
}
window.mulaiProsesGenerate = mulaiProsesGenerate;

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
      window.riwayatGenerateList.forEach(function(tugas) {
        if (tugas.videoUrl && !tugas.videoUrl.startsWith('/api/stream') && tugas.videoUrl.startsWith('http')) {
          tugas.rawVideoUrl = tugas.videoUrl;
          tugas.videoUrl = bungkusStreamProxy(tugas.videoUrl);
          simpanStorage();
        }

        if ((!tugas.videoUrl || !tugas.selesai) && tugas.id) {
          var isKling = (
            tugas.prov === 'kling' || 
            tugas.provider === 'kling' || 
            (typeof tugas.id === 'string' && tugas.id.includes('-'))
          );

          if (isKling) {
            if (typeof window.pantauStatusKling === 'function') {
              tugas.selesai = false;
              window.pantauStatusKling(tugas);
            }
          } else {
            tugas.selesai = false;
            pantauStatusVideo(tugas, tugas.key, tugas.pool_id, tugas.user_id, tugas.did_deduct);
          }
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
  pasangPilihanEngineListener();
  selaraskanRiwayatDenganAkun();
});

window.onload = function() {
  muatStorage();
  pasangPilihanEngineListener();
  selaraskanRiwayatDenganAkun();
  updateStatistikDashboard();

  if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
  if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();

  if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
    window.riwayatGenerateList.forEach(function(tugas) {
      if (tugas.videoUrl && !tugas.videoUrl.startsWith('/api/stream') && tugas.videoUrl.startsWith('http')) {
        tugas.rawVideoUrl = tugas.videoUrl;
        tugas.videoUrl = bungkusStreamProxy(tugas.videoUrl);
        simpanStorage();
      }

      var isKling = (
        tugas.prov === 'kling' || 
        tugas.provider === 'kling' || 
        (typeof tugas.id === 'string' && tugas.id.includes('-'))
      );

      if (tugas.selesai && tugas.videoUrl && tugas.pool_id && !isKling) {
        lepaskanKunciPoolOtomatis(tugas.pool_id);
      } else if ((!tugas.videoUrl || !tugas.selesai) && tugas.id) {
        if (isKling) {
          if (typeof window.pantauStatusKling === 'function') {
            tugas.selesai = false;
            window.pantauStatusKling(tugas);
          }
        } else {
          tugas.selesai = false;
          pantauStatusVideo(tugas, tugas.key, tugas.pool_id, tugas.user_id, tugas.did_deduct);
        }
      }
    });
  }
};
