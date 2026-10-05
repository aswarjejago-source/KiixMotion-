// ==========================================
// PILAR 3: API ENGINE & RENDER LOGIC (DENGAN POPUP CCTV RAKSASA)
// File: js/api-engine.js
// ==========================================

var engineProvider = 'runninghub';
var RUNNINGHUB_WORKFLOW_ID = "2099490599765630978"; 
var urlBahanFoto = null;
var urlBahanVideo = null;

// ==========================================
// FUNGSI POPUP CCTV RAKSASA DI LAYAR HP
// ==========================================
function tampilkanCCTVRaksasa(httpStatus, responseText, progressTugas) {
  var box = document.getElementById('cctv-debug-raksasa');
  if (!box) {
    box = document.createElement('div');
    box.id = 'cctv-debug-raksasa';
    // Style dibikin absolute nutupin layar biar kelihatan jelas di HP
    box.style.cssText = 'position:fixed; top:5%; left:5%; width:90%; height:85%; z-index:999999; background-color:#111; border:4px solid #ef4444; border-radius:12px; padding:15px; display:flex; flex-direction:column; box-shadow: 0px 0px 30px rgba(239, 68, 68, 0.6);';
    document.body.appendChild(box);
  }
  
  var timeNow = new Date().toLocaleTimeString();
  
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #ef4444; padding-bottom:10px; margin-bottom:10px;">
      <h3 style="color:#ef4444; margin:0; font-weight:bold; font-size:16px;">🚨 CCTV SERVER LIVE 🚨</h3>
      <button onclick="document.getElementById('cctv-debug-raksasa').remove()" style="background:#ef4444; color:white; border:none; padding:8px 15px; border-radius:8px; font-weight:bold;">TUTUP</button>
    </div>
    <div style="font-size:12px; color:#facc15; margin-bottom:5px;">Waktu Cek: ${timeNow} | Progress: ${progressTugas}%</div>
    <div style="font-size:12px; color:#22d3ee; margin-bottom:10px;">HTTP Status Code: <b>${httpStatus}</b></div>
    <div style="color:white; font-size:12px; margin-bottom:5px; font-weight:bold;">RAW DATA DARI VERCEL:</div>
    <textarea readonly style="flex-grow:1; width:100%; background:#000; color:#4ade80; border:1px solid #334155; padding:10px; font-family:monospace; font-size:11px; border-radius:8px; resize:none;">${responseText}</textarea>
  `;
}

function updateStatistikDashboard() {
  var totalRhKoin = 0, maxRhKoin = 0, totalRbCarrots = 0, maxRbCarrots = 0;
  akunRunningHub.forEach(function(a) {
    var k = Number(a.koin) || 0;
    totalRhKoin += k;
    if (k > maxRhKoin) maxRhKoin = k;
  });
  akunRoboneo.forEach(function(r) {
    var c = Number(r.koin) || 0;
    totalRbCarrots += c;
    if (c > maxRbCarrots) maxRbCarrots = c;
  });
  var setTxt = function(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  setTxt('dash-rh-total-koin', totalRhKoin);
  setTxt('dash-rh-total-akun', akunRunningHub.length);
  setTxt('dash-rh-max-koin', maxRhKoin);
  setTxt('dash-rb-total-carrots', totalRbCarrots);
  setTxt('dash-rb-total-akun', akunRoboneo.length);
  setTxt('dash-rb-max-carrots', maxRbCarrots);
  setTxt('dash-stat-video-selesai', riwayatGenerateList.filter(function(r) { return r.selesai; }).length);
}

function setProviderUtama(p) {
  engineProvider = p;
  var provs = ['runninghub', 'roboneo', 'kiix'];
  provs.forEach(function(pr) {
    var card = document.getElementById('c-prov-' + pr);
    var badge = document.getElementById('b-prov-' + pr);
    if (card) {
      card.className = (pr === p) ?
        "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50 transition" :
        "bg-kmCard border border-kmBorder p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
    }
    if (badge) badge.style.display = (pr === p) ? 'inline-block' : 'none';
  });
  var setTxt = function(id, v) { var el = document.getElementById(id); if (el) el.innerText = v; };
  var dropWrap = document.getElementById('box-wrap-dropdown-akun');
  if (p === 'roboneo') {
    setTxt('t-engine-title', "KLING 2.6 MOTION CONTROL");
    setTxt('t-engine-sub', "(ROBONEO)");
    setTxt('t-engine-cost', "≈ 4 carrots");
    setTxt('t-engine-total', "≈ 4 carrots");
    if (dropWrap) dropWrap.style.display = 'block';
  } else if (p === 'kiix') {
    setTxt('t-engine-title', "KIIXMOTION DIRECT CLOUD");
    setTxt('t-engine-sub', "(DIRECT ENGINE)");
    setTxt('t-engine-cost', "1 Kredit VIP");
    setTxt('t-engine-total', "1 kredit VIP");
    if (dropWrap) dropWrap.style.display = 'none';
  } else {
    setTxt('t-engine-title', "WAN MOTION CONTROL 1080HD");
    setTxt('t-engine-sub', "(RUNNINGHUB)");
    setTxt('t-engine-cost', "≈ 478 coin");
    setTxt('t-engine-total', "≈ 478 coin");
    if (dropWrap) dropWrap.style.display = 'block';
  }
  sinkronkanDropdownAkunGenerate();
}

function unggahBahanLangsung(input, tipe) {
  if (!input.files || !input.files[0]) return;
  var targetAkun = (engineProvider === 'roboneo') ? akunRoboneo : akunRunningHub;
  if (engineProvider !== 'kiix' && targetAkun.length === 0) {
    input.value = "";
    return tampilkanNotif('Hubungkan akun RunningHub di menu Kelola Akun!', 'error');
  }
  var sel = document.getElementById('sel-dropdown-akun'), idx = sel ? sel.value : "";
  var akunAktif = (idx === "random" || idx === "") ? targetAkun[0] : targetAkun[parseInt(idx, 10)];
  var file = input.files[0];
  var txtEl = document.getElementById(tipe === 'foto' ? 'txt-file-foto' : 'txt-file-video');
  var stEl = document.getElementById(tipe === 'foto' ? 'st-file-foto' : 'st-file-video');
  if (txtEl) txtEl.innerText = file.name;
  if (stEl) stEl.innerHTML = '<span class="text-amber-600 font-bold animate-pulse">⏳ Mengunggah: 0%</span>';

  var formData = new FormData();
  formData.append("file", file);
  formData.append("apiKey", akunAktif.key);
  formData.append("fileType", tipe === 'foto' ? 'image' : 'video');

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://www.runninghub.ai/task/openapi/upload");
  xhr.setRequestHeader("Authorization", "Bearer " + akunAktif.key);
  
  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable && stEl) {
      var pct = Math.round((e.loaded / e.total) * 100);
      stEl.innerHTML = '<span class="text-amber-600 font-bold animate-pulse">⏳ Mengunggah: ' + pct + '%</span>';
    }
  };
  
  xhr.onload = function() {
    try {
      var json = JSON.parse(xhr.responseText);
      var serverFile = null;
      if (json) {
        if (typeof json.data === 'string') serverFile = json.data;
        else if (json.data && typeof json.data === 'object') serverFile = json.data.fileName || json.data.fileUrl || json.data.url || json.data.path;
        else if (typeof json === 'string') serverFile = json;
      }
      if (serverFile && typeof serverFile === 'string') {
        if (tipe === 'foto') urlBahanFoto = serverFile; else urlBahanVideo = serverFile;
        var ukuranMb = (file.size / (1024 * 1024)).toFixed(1);
        if (stEl) stEl.innerHTML = '<span class="text-emerald-600 font-bold">✓ Terunggah (' + ukuranMb + ' MB)</span>';
      }
    } catch (err) {}
  };
  xhr.send(formData);
}

function sinkronkanDropdownAkunGenerate() {
  var sel = document.getElementById('sel-dropdown-akun'), badge = document.getElementById('badge-total-saldo-gen');
  var targetAkun = (engineProvider === 'roboneo') ? akunRoboneo : akunRunningHub;
  if (!sel) return;
  sel.innerHTML = '';
  if (targetAkun.length === 0) {
    var opt = document.createElement('option');
    opt.value = "";
    opt.innerText = "Belum ada akun terhubung (0 coin)";
    sel.appendChild(opt);
    if (badge) { badge.innerText = "0 coin"; badge.className = "text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg"; }
  } else {
    var optRand = document.createElement('option');
    optRand.value = "random";
    optRand.innerText = "🎲 Otomatis (Pilih Acak Akun)";
    sel.appendChild(optRand);
    var total = 0;
    targetAkun.forEach(function(a, idx) {
      var koinVal = Number(a.koin) || 0;
      total += koinVal;
      var o = document.createElement('option');
      o.value = idx;
      o.innerText = "API Key: " + a.key.substring(0, 10) + "... (" + koinVal + (engineProvider === 'roboneo' ? " carrots)" : " coin)");
      sel.appendChild(o);
    });
    if (badge) {
      badge.innerText = total + (engineProvider === 'roboneo' ? " carrots" : " coin");
      badge.className = "text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg";
    }
  }
}

// ==========================================
// PEMANTAUAN DENGAN CCTV AKTIF
// ==========================================
function pantauTaskRunningHub(tugas, apiKey) {
  if (tugas.selesai) return; 
  if (!tugas.progress) tugas.progress = 0; 
  if (!tugas.cekCount) tugas.cekCount = 0;

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  var cekInterval = setInterval(async function() {
    tugas.intervalObj = cekInterval;

    if (tugas.selesai) {
        clearInterval(cekInterval);
        return;
    }

    tugas.cekCount++;
    if (tugas.cekCount > 90) { // Timeout 15 Menit
        clearInterval(cekInterval);
        tugas.status = "Gagal (Timeout)"; 
        tugas.selesai = true;
        tugas.progress = 100;
        simpanStorage();
        if (typeof renderLayarHistory === 'function') renderLayarHistory();
        return;
    }

    try {
      var resStatus = await fetch('/api/outputs', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ taskId: tugas.id, apiKey: apiKey })
      });
      
      var textRaw = await resStatus.text(); 
      
      // ===== INI DIA CCTV-NYA! MUNCUL DI LAYAR HP LU TIAP KALI NGECEK =====
      tampilkanCCTVRaksasa(resStatus.status, textRaw, tugas.progress);
      // ====================================================================

      var cleanString = textRaw.toUpperCase().replace(/\s/g, ''); 
      
      // 1. CEK SUKSES
      if (cleanString.includes('.MP4')) {
        var vidUrl = null;
        var match = textRaw.match(/https?:\/\/[^"'\s]+\.mp4/i);
        if (!match) match = textRaw.match(/[^"'\s]+\.mp4/i); 
        
        if (match) {
          vidUrl = match[0].replace(/\\/g, '');
          clearInterval(cekInterval);
          tugas.status = "Selesai"; 
          tugas.selesai = true;
          tugas.progress = 100; 
          tugas.videoUrl = vidUrl;
          simpanStorage();
          if (typeof renderLayarHistory === 'function') renderLayarHistory();
          return;
        }
      }

      // 2. CEK GAGAL BRUTAL
      if (cleanString.includes('"STATUS":"FAILED"') || 
          cleanString.includes('"TASKSTATUS":"FAILED"') || 
          cleanString.includes('"STATUS":"ERROR"') || 
          cleanString.includes('"ERRORCODE":"805"') || 
          cleanString.includes('工作流运行失败')) {
          
          clearInterval(cekInterval);
          tugas.status = "❌ Gagal Dirender Server";
          tugas.selesai = true;
          tugas.progress = 100;
          simpanStorage();
          if (typeof renderLayarHistory === 'function') renderLayarHistory();
          return;
      }
      
      // 3. NAIKKAN PROGRESS
      if (tugas.progress < 95) {
        tugas.progress += Math.floor(Math.random() * 3) + 2; 
      }
      simpanStorage();
      if (typeof renderLayarHistory === 'function') renderLayarHistory();

    } catch (err) { 
      // JIKA ADA ERROR JARINGAN, TAMPILKAN JUGA DI CCTV RAKSASA
      tampilkanCCTVRaksasa("ERROR JARINGAN/KODE", err.message, tugas.progress);
    }
  }, 10000); 
}

// ==========================================
// KIRIM TUGAS KE GPU
// ==========================================
async function mulaiProsesGenerate() {
  var btn = document.getElementById('btn-submit-generate');
  var realEmail = "user@test.com"; // Bypass login check sementara biar fokus debug

  var targetAkun = (engineProvider === 'roboneo') ? akunRoboneo : akunRunningHub;
  if (engineProvider !== 'kiix' && targetAkun.length === 0) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotif('Hubungkan akun di menu Kelola Akun terlebih dahulu!', 'error');
  }
  
  var sel = document.getElementById('sel-dropdown-akun'), idx = sel ? sel.value : "";
  var akunAktif = (idx === "random" || idx === "") ? targetAkun[0] : targetAkun[parseInt(idx, 10)];

  if (!urlBahanFoto || !urlBahanVideo) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotif('Foto dan Video keduanya harus selesai diunggah!', 'error');
  }

  if (btn) { btn.disabled = true; btn.innerText = "⚡ MENGIRIM KE GPU..."; }
  var taskIdAsli = null;

  if (engineProvider === 'runninghub') {
    try {
      var nodeParams = [
        { nodeId: "30", fieldName: "image", fieldValue: urlBahanFoto },
        { nodeId: "33", fieldName: "video", fieldValue: urlBahanVideo }
      ];
      
      var res = await fetch('https://www.runninghub.ai/task/openapi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + akunAktif.key },
        body: JSON.stringify({ workflowId: RUNNINGHUB_WORKFLOW_ID, apiKey: akunAktif.key, nodeInfoList: nodeParams })
      });
      
      var textRes = await res.text();
      var data;
      try { data = textRes ? JSON.parse(textRes) : null; } catch(err) {}

      if (data && (data.code === 0 || data.data) && (data.data?.taskId || data.taskId)) { 
        taskIdAsli = data.data?.taskId || data.taskId; 
      } else { 
        tampilkanCCTVRaksasa("GAGAL CREATE TASK", textRes, 0);
        if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; } return; 
      }
    } catch (e) { 
      tampilkanCCTVRaksasa("ERROR CREATE TASK", e.message, 0);
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; } return; 
    }
  }

  var tugasBaru = {
    id: taskIdAsli || ("RH-" + Date.now().toString().slice(-6)),
    key: akunAktif.key, model: "Wan Motion Control", prov: "RunningHub",
    tgl: "Baru saja", biaya: "≈ 478 coin", videoUrl: null,
    status: "Sedang Render di GPU...", selesai: false, progress: 0
  };
  
  riwayatGenerateList.unshift(tugasBaru); simpanStorage(); gantiLayarNav('history');
  if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  
  if (taskIdAsli) {
    pantauTaskRunningHub(tugasBaru, akunAktif.key);
  }
}

// ==========================================
// RENDER LAYAR HISTORY
// ==========================================
function renderLayarHistory() {
  var wadah = document.getElementById('wadah-list-history'), counter = document.getElementById('txt-counter-history');
  if (!wadah) return; wadah.innerHTML = '';
  if (counter) counter.innerText = riwayatGenerateList.length + " tugas";
  
  if (riwayatGenerateList.length === 0) {
    wadah.innerHTML = '<div class="p-12 text-center text-slate-400 text-sm border-2 border-dashed border-kmBorder rounded-3xl bg-white modern-shadow">Belum ada riwayat generate video.</div>';
    return;
  }
  
  riwayatGenerateList.forEach(function(itm, index) {
    var isDone = (itm.selesai === true && itm.status === "Selesai");
    var isFailed = (itm.selesai === true && itm.status !== "Selesai");
    var hasVideo = Boolean(itm.videoUrl);
    var currentProg = itm.progress !== undefined ? itm.progress : (isDone || isFailed ? 100 : 0);
    
    var card = document.createElement('div');
    card.className = "bg-white border border-kmBorder p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 modern-shadow";
    
    var statusBadge = '';
    if (isFailed) {
      statusBadge = '<span class="text-[10px] sm:text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold max-w-[200px] truncate">' + itm.status + '</span>';
    } else if (isDone) {
      if (hasVideo) {
        statusBadge = '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Selesai (100%)</span>' +
          '<button type="button" onclick="window.open(\'' + itm.videoUrl + '\', \'_blank\')" class="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer">Putar</button>';
      } else {
        statusBadge = '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Selesai di GPU</span>';
      }
    } else {
      statusBadge = '<span class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold animate-pulse">⏳ Render: ' + currentProg + '%</span>';
    }

    card.innerHTML = '<div class="flex items-center gap-4">' +
      '<div class="w-12 h-12 rounded-2xl ' + (isFailed ? 'bg-rose-50 text-rose-600' : 'bg-kmVioletLight text-kmViolet') + ' flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">' + (isFailed ? '✕' : (isDone ? '▶' : '⏳')) + '</div>' +
      '<div class="min-w-0">' +
        '<div class="flex items-center gap-2 flex-wrap"><span class="text-base font-bold text-kmTextPrimary truncate">' + itm.model + '</span></div>' +
        '<div class="text-[11px] sm:text-sm text-kmTextSecondary mt-1">ID: <span class="text-kmViolet font-mono font-bold">' + itm.id + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">' + 
      statusBadge + 
      '<button type="button" onclick="hapusRiwayatSatu(' + index + ')" class="px-3 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer border border-rose-200">Hapus</button>' +
    '</div>';
    
    wadah.appendChild(card);
  });
}

function hapusRiwayatSatu(idx) {
  var tgs = riwayatGenerateList[idx];
  if (tgs && tgs.intervalObj) clearInterval(tgs.intervalObj);
  riwayatGenerateList.splice(idx, 1);
  simpanStorage();
  renderLayarHistory();
}

window.onload = function() {
  muatStorage();
  setProviderUtama('runninghub');
  aturTampilanHalamanUtama();

  if (typeof riwayatGenerateList !== 'undefined' && riwayatGenerateList.length > 0) {
    riwayatGenerateList.forEach(function(tugas) {
      if (!tugas.selesai && tugas.id && tugas.key) {
        pantauTaskRunningHub(tugas, tugas.key);
      }
    });
  }
  if (typeof renderLayarHistory === 'function') renderLayarHistory();
};
