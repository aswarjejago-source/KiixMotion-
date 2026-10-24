// ==========================================
// PILAR 3: ENGINE LOGIC (FULL SECURE & BULLETPROOF EXTRACTOR)
// File: js/api-engine.js
// ==========================================

window.riwayatGenerateList = window.riwayatGenerateList || [];
var riwayatGenerateList = window.riwayatGenerateList;

var engineMode = 'kiix'; 
var urlBahanFoto = null;
var urlBahanVideo = null;
var listKunciPro = [];

// SENARAI HITAM KEKAL
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

// NOTIFIKASI PUSAT
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

// PENGALIHAN MENU LANGGANAN
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

// SIMPAN STORAGE
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

// MUAT STORAGE
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
        if (!taskId) return;

        if (blacklisted.indexOf(taskId) !== -1) return;

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

      if (sUser && window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
        window.riwayatGenerateList.forEach(function(t) {
          t.user_id = sUser.id;
          if (sUser.email) t.user_email = sUser.email.toLowerCase().trim();
        });

        simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        if (typeof updateStatistikDashboard === 'function') updateStatistikDashboard();
      }
    } catch (err) {}
  }
}

// AUTO-RELEASE POOL
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

// PELACAK URL VIDEO OTOMATIS (MENGAMBIL MP4 DARI STRUKTUR APA PUN)
function temukanUrlVideoDariRespons(jsonObj, textRaw) {
  if (!textRaw && !jsonObj) return null;

  var teksBersih = (textRaw || "").replace(/\\/g, '');

  // 1. Ekstraksi mendalam pada objek JSON
  if (jsonObj) {
    var hasilUrl = null;
    function bongkarObjek(obj) {
      if (!obj || hasilUrl) return;
      if (typeof obj === 'string') {
        var s = obj.trim().replace(/\\/g, '');
        if (s.startsWith('http') && (s.toLowerCase().includes('.mp4') || s.toLowerCase().includes('.mov') || s.toLowerCase().includes('.webm') || s.includes('aliyuncs') || s.includes('runninghub'))) {
          hasilUrl = s;
        }
      } else if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          bongkarObjek(obj[i]);
          if (hasilUrl) break;
        }
      } else if (typeof obj === 'object') {
        var prioritas = obj.fileUrl || obj.file_url || obj.videoUrl || obj.video_url || obj.url || obj.outputValue || obj.path || obj.downloadUrl;
        if (prioritas) bongkarObjek(prioritas);
        if (!hasilUrl) {
          for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
              bongkarObjek(obj[k]);
              if (hasilUrl) break;
            }
          }
        }
      }
    }

    bongkarObjek(jsonObj.data || jsonObj);
    if (hasilUrl) return hasilUrl;
  }

  // 2. Pencocokan regex pada teks yang sudah dibersihkan dari escape backslash
  if (teksBersih) {
    var matchMp4 = teksBersih.match(/https?:\/\/[^\s"'<>\\]+?\.(?:mp4|mov|webm)(?:\?[^\s"'<>\\]*)?/i);
    if (matchMp4 && matchMp4[0]) return matchMp4[0];

    var matchOss = teksBersih.match(/https?:\/\/[^\s"'<>\\]+?(?:runninghub|aliyuncs|oss)[^\s"'<>\\]+/i);
    if (matchOss && matchOss[0]) return matchOss[0];
  }

  return null;
}

function resetFormBahanInput() {
  urlBahanFoto = null;
  urlBahanVideo = null;

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
  if (stVideo) stVideo.innerHTML = 'MP4 (Maks 10s)';
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
  engineMode = (mode === 'kiix') ? 'kiix' : 'pro';
  
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

// UPLOAD BAHAN
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

        if (tipe === 'foto') urlBahanFoto = fileUrl;
        else urlBahanVideo = fileUrl;

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

// CCTV PRESISI: MENDETEKSI SELESAI DENGAN TEPAT
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
    
    // TIMEOUT 1 JAM
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

    // Auto-resolve kunci kolam dari Supabase jika API Key masih kosong
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

      var textRaw = await res.text();
      var jsonObj = null;
      try { jsonObj = JSON.parse(textRaw); } catch(e) {}

      // 1. DETEKSI HASIL VIDEO SELESAI
      var vidUrl = temukanUrlVideoDariRespons(jsonObj, textRaw);

      if (vidUrl) {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        lepaskanKunciPoolOtomatis(currentPoolId);

        tugas.status = "Selesai"; 
        tugas.selesai = true;
        tugas.progress = 100; 
        tugas.videoUrl = vidUrl.replace(/\\/g, '');

        simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
        if (currentApiKey) refreshSaldoKunciOtomatis(currentApiKey);
        if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Video berhasil selesai!', 'sukses');
        return;
      }

      // 2. DETEKSI STATUS GAGAL RESMI DARI RUNNINGHUB
      var topCode = jsonObj ? Number(jsonObj.code) : NaN;
      var statusTeks = "";
      var taskStatusDalam = "";

      if (jsonObj && jsonObj.data && typeof jsonObj.data === 'object') {
        if (!Array.isArray(jsonObj.data)) {
          statusTeks = (jsonObj.data.status || "").toString().toUpperCase().trim();
        } else if (jsonObj.data.length > 0 && typeof jsonObj.data[0] === 'object') {
          statusTeks = (jsonObj.data[0].status || "").toString().toUpperCase().trim();
        }

        var usageArr = jsonObj.data.taskUsageList || jsonObj.taskUsageList;
        if (usageArr && Array.isArray(usageArr) && usageArr.length > 0) {
          taskStatusDalam = (usageArr[0].taskStatus || usageArr[0].status || "").toString().toUpperCase().trim();
        }
      }

      var isResmiBatal = (
        statusTeks === "CANCELED" || 
        statusTeks === "CANCELLED" || 
        taskStatusDalam === "CANCELED" || 
        taskStatusDalam === "CANCELLED"
      );

      var isResmiGagal = (
        statusTeks === "FAILED" || 
        statusTeks === "ERROR" || 
        taskStatusDalam === "FAILED" || 
        taskStatusDalam === "ERROR" || 
        topCode === 807
      );

      if (isResmiBatal || isResmiGagal) {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        lepaskanKunciPoolOtomatis(currentPoolId);

        var labelStatus = isResmiBatal ? "❌ Dibatalkan di RunningHub" : "❌ Gagal Diproses Studio";
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
            tampilkanNotifPusat(isResmiBatal ? 'Render dibatalkan. 1 kredit dikembalikan otomatis.' : 'Render gagal di server. 1 kredit dikembalikan otomatis.');
          } catch (errRefund) {
            tugas.refunded = false;
          }
        }

        simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
        return;
      }

      // 3. JIKA MASIH BERJALAN: Simpan progres & update teks persentase
      if (tugas.progress < 95) {
        tugas.progress += Math.floor(Math.random() * 3) + 2; 
      }
      tugas.status = "Sedang Memproses Video...";
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

    } catch (err) {}
  }

  jalankanCek();
  tugas.intervalObj = setInterval(jalankanCek, 6000);
}

// HAPUS KARTU
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

// REFRESH SALDO KOIN PRO
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
          renderListAkunDiKelola();
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

// PROSES GENERATE
async function mulaiProsesGenerate() {
  var btn = document.getElementById('btn-submit-generate');
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

  // GEMBOK PRO
  if (engineMode === 'pro') {
    var isMemberVip = profilUser && (
      profilUser.is_vip === true ||
      profilUser.is_pro === true ||
      profilUser.role === 'pro' ||
      profilUser.role === 'vip' ||
      profilUser.status === 'pro' ||
      profilUser.status === 'vip'
    );

    if (!isMemberVip) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      tampilkanNotifPusat('Kamu belum punya akses Pro!');
      setTimeout(function() { alihkanKeMenuLangganan(); }, 500);
      return;
    }

    if (!listKunciPro || listKunciPro.length === 0) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotifPusat('Hubungkan API Key kamu di menu Add Key!');
    }
  }

  if (!urlBahanFoto || !urlBahanVideo) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotifPusat('Foto karakter dan Video gerakan wajib selesai diunggah!');
  }

  var apiKeyPribadi = null;

  if (engineMode === 'pro') {
    var sel = document.getElementById('sel-dropdown-akun');
    var idx = sel ? sel.value : "";
    var akunPribadi = (idx === "random" || idx === "") ? listKunciPro[0] : listKunciPro[parseInt(idx, 10)];
    apiKeyPribadi = akunPribadi.key;
  }

  if (btn) { btn.disabled = true; btn.innerText = "⚡ MEMPROSES VIDEO..."; }

  try {
    var res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urlBahanFoto: urlBahanFoto,
        urlBahanVideo: urlBahanVideo,
        provider: engineMode,
        apiKeyPribadi: apiKeyPribadi,
        userId: realUserId,
        userEmail: realEmail
      })
    });

    var data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memproses render ke server.');
    }

    var taskIdAsli = data.taskId;
    var poolIdDipakai = data.poolId;
    var didDeductCredit = data.didDeductCredit;

    var tugasBaru = {
      id: taskIdAsli,
      key: apiKeyPribadi || null,
      pool_id: poolIdDipakai,
      user_id: realUserId,
      user_email: realEmail,
      did_deduct: didDeductCredit,
      refunded: false,
      startedAt: Date.now(),
      model: "Wan Motion Control",
      provider: (engineMode === 'pro') ? "KiixMotion Pro Engine" : "KiixMotion Control",
      engine: "Wan Motion Control 1080HD",
      prov: (engineMode === 'pro') ? "Pro" : "KiixMotion",
      tgl: "Baru saja",
      biaya: didDeductCredit ? "1 Kredit" : "≈ 478 coin",
      videoUrl: null,
      status: "Sedang Memproses Video...",
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
    var pesanLower = pesan.toLowerCase();

    var isBukanPro = pesanLower.includes("akses pro") || 
                    pesanLower.includes("akses ditolak") || 
                    pesanLower.includes("vip") || 
                    pesanLower.includes("berlangganan") ||
                    /\bpro\b/.test(pesanLower);

    if (isBukanPro) {
      tampilkanNotifPusat('Kamu belum punya akses Pro!');
      setTimeout(function() { alihkanKeMenuLangganan(); }, 500);
      return;
    }

    var isMasalahKredit = pesanLower.includes("kredit") || pesanLower.includes("saldo");
    if (isMasalahKredit) {
      tampilkanNotifPusat(pesan);
      setTimeout(function() { alihkanKeMenuLangganan(); }, 900);
      return;
    }

    tampilkanNotifPusat(pesan);
  } finally {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  }
}

function renderListAkunDiKelola() {
  var wadah = document.getElementById('wadah-kartu-akun-list');
  if (!wadah) return; 
  wadah.innerHTML = '';
  var totalKredit = 0;

  if (!listKunciPro || listKunciPro.length === 0) {
    wadah.innerHTML = '<div class="p-10 text-center text-slate-400 text-sm border-2 border-dashed border-kmBorder rounded-3xl bg-white modern-shadow">Belum ada akun terhubung. Klik "+ Add Key" di atas.</div>';
    return;
  }

  var toolbarEl = document.createElement('div');
  toolbarEl.className = "flex items-center justify-between px-1 pb-1 pt-1";
  toolbarEl.innerHTML = '<span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar API Key (' + listKunciPro.length + ')</span>' +
    '<button type="button" onclick="refreshSemuaKunciPro()" class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-kmViolet border border-kmBorder rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5">' +
      '<i class="ph ph-arrows-clockwise text-sm"></i> Sync Semua' +
    '</button>';
  wadah.appendChild(toolbarEl);

  listKunciPro.forEach(function(a, i) {
    var koinVal = Number(a.koin) || 0; totalKredit += koinVal;
    var el = document.createElement('div');
    el.className = "bg-white border border-kmBorder p-4 sm:p-5 rounded-2xl flex items-center justify-between modern-shadow";
    
    var refreshBtnHtml = '<button type="button" onclick="manualRefreshAkunSatu(' + i + ')" class="p-2 text-slate-400 hover:text-kmViolet bg-slate-50 hover:bg-violet-50 rounded-xl transition cursor-pointer border border-slate-200" title="Refresh Saldo">' +
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>' +
      '</button>';

    el.innerHTML = '<div class="flex items-center gap-3.5"><input type="checkbox" data-idx="' + i + '" class="chk-seleksi-akun ' + (typeof isModePilih !== 'undefined' && isModePilih ? '' : 'hidden') + ' w-5 h-5 rounded-lg accent-kmViolet cursor-pointer" /><span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-100"></span><span class="text-xs sm:text-sm font-bold text-kmTextPrimary font-mono break-all w-28 sm:w-56 truncate" title="' + a.key + '">' + a.nama + '</span></div>' +
    '<div class="flex items-center gap-2 sm:gap-3">' +
      '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">Aktif</span>' +
      '<span class="text-sm sm:text-base font-black text-kmViolet font-mono bg-violet-50 px-3 py-1 rounded-xl">' + koinVal + ' coin</span>' +
      refreshBtnHtml +
      '<button type="button" onclick="hapusAkunSatu(' + i + ')" class="text-rose-500 hover:text-rose-700 text-xs font-bold font-sans px-2 py-1">Hapus</button>' +
    '</div>';
    wadah.appendChild(el);
  });
}

async function manualRefreshAkunSatu(idx) {
  var akun = listKunciPro[idx];
  if (!akun) return;

  tampilkanNotifPusat('Menyegarkan status koneksi...');
  try {
    var res = await fetch('/api/saldo', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ apiKey: akun.key })
    });
    var hasil = await res.json();
    if (res.ok && hasil) {
      var rawData = hasil.data || hasil;
      var k = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.credit ?? rawData.balance ?? rawData.remainCoins;
      if (k !== undefined && k !== null) {
        akun.koin = Number(k);
        simpanStorage();
        renderListAkunDiKelola();
        updateStatistikDashboard();
        if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Status akun berhasil diperbarui', 'sukses');
      }
    }
  } catch (err) {
    tampilkanNotifPusat('Koneksi terputus: ' + err.message);
  }
}

async function refreshSemuaKunciPro() {
  if (!listKunciPro || listKunciPro.length === 0) {
    return tampilkanNotifPusat('Belum ada akun yang terhubung di Kelola Akun');
  }

  tampilkanNotifPusat('Menyinkronkan semua akun...');
  var suksesHitung = 0;

  var antreanSync = listKunciPro.map(async function(akun) {
    try {
      var res = await fetch('/api/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: akun.key })
      });
      var hasil = await res.json();
      if (res.ok && hasil) {
        var rawData = hasil.data || hasil;
        var k = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.remainCoins;
        if (k !== undefined && k !== null) {
          akun.koin = Number(k);
          suksesHitung++;
        }
      }
    } catch (e) {}
  });

  await Promise.allSettled(antreanSync);

  simpanStorage();
  renderListAkunDiKelola();
  updateStatistikDashboard();

  if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ ' + suksesHitung + ' akun berhasil disinkronkan!', 'sukses');
}

function hapusAkunSatu(idx) {
  mintaKonfirmasi("Yakin ingin menghapus akun ini?", function() {
    listKunciPro.splice(idx, 1); 
    simpanStorage(); 
    renderListAkunDiKelola(); 
    setProviderUtama(engineMode);
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Akun berhasil dihapus', 'sukses');
  });
}

function eksekusiHapusAkun() {
  var checkedBoxes = document.querySelectorAll('.chk-seleksi-akun:checked');
  if (checkedBoxes.length === 0) return tampilkanNotifPusat('Pilih minimal satu akun!');
  mintaKonfirmasi('Hapus ' + checkedBoxes.length + ' akun terpilih?', function() {
    var toDel = [];
    checkedBoxes.forEach(function(c) { toDel.push(parseInt(c.getAttribute('data-idx'), 10)); });
    toDel.sort(function(a, b) { return b - a; }).forEach(function(idx) { listKunciPro.splice(idx, 1); });
    simpanStorage(); 
    if (typeof toggleModePilihHapus === 'function') toggleModePilihHapus(); 
    renderListAkunDiKelola(); 
    setProviderUtama(engineMode);
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Akun terpilih berhasil dihapus', 'sukses');
  });
}

async function simpanAkunBaruDariModal() {
  var inKey = document.getElementById('in-modal-key'), valKey = inKey ? inKey.value.trim() : "";
  if (!valKey) return tampilkanNotifPusat('Masukkan API Key terlebih dahulu!');
  var btnSimpan = document.getElementById('btn-simpan-key');
  if (btnSimpan) { btnSimpan.innerText = 'Menyinkronkan...'; btnSimpan.disabled = true; }
  var saldoDidapat = 0;

  try {
    var res = await fetch('/api/saldo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: valKey })
    });
    var hasil = await res.json();
    if (res.ok && hasil && (hasil.code === 0 || hasil.code === 200 || hasil.data)) {
      var rawData = hasil.data || hasil;
      var k = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.credit ?? rawData.balance ?? rawData.remainCoins;
      saldoDidapat = (k !== undefined && k !== null) ? Number(k) : 0;
    } else {
      if (btnSimpan) { btnSimpan.innerText = 'Tambah'; btnSimpan.disabled = false; }
      return tampilkanNotifPusat('API Key tidak valid atau ditolak sistem');
    }
  } catch (err) {
    if (btnSimpan) { btnSimpan.innerText = 'Tambah'; btnSimpan.disabled = false; }
    return tampilkanNotifPusat('Gagal terhubung ke verifikasi server');
  }

  if (btnSimpan) { btnSimpan.innerText = 'Tambah'; btnSimpan.disabled = false; }
  
  var indexKetemu = listKunciPro.findIndex(function(a) { return a.key === valKey; });
  if (indexKetemu !== -1) {
    listKunciPro[indexKetemu].koin = Number(saldoDidapat); 
    if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Jalur akun berhasil disinkronkan!', 'sukses');
  } else {
    listKunciPro.push({ nama: valKey, key: valKey, koin: Number(saldoDidapat) }); 
    if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Jalur akun baru berhasil ditambahkan!', 'sukses');
  }
  simpanStorage(); 
  if (typeof tutupModalFormKey === 'function') tutupModalFormKey(); 
  renderListAkunDiKelola(); 
  setProviderUtama(engineMode);
}

// RESTORE POLLING PAS TAB AKTIF
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

// SINKRONISASI KOLAM TIAP 20 DETIK
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

// INISIALISASI
window.addEventListener('DOMContentLoaded', function() {
  muatStorage();
  selaraskanRiwayatDenganAkun();
});

window.onload = function() {
  muatStorage();
  selaraskanRiwayatDenganAkun();
  renderListAkunDiKelola();
  updateStatistikDashboard();
  setProviderUtama('kiix'); 
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
