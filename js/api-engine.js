// ==========================================
// PILAR 3: API ENGINE & RENDER LOGIC (FINAL MUTLAK)
// File: js/api-engine.js
// ==========================================

var engineProvider = 'runninghub';
var RUNNINGHUB_WORKFLOW_ID = "2099490599765630978"; 
var urlBahanFoto = null;
var urlBahanVideo = null;

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
  
  if (typeof supa !== 'undefined') {
    supa.auth.getSession().then(function(res) {
      var emailReal = res?.data?.session?.user?.email;
      var emailDisp = document.getElementById('label-current-user-email');
      if (emailDisp && emailReal) emailDisp.innerText = emailReal;
    });
  }
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
        tampilkanNotif('File berhasil diunggah!', 'sukses');
      } else throw new Error("Gagal parsing dari server");
    } catch (err) {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
      tampilkanNotif('Gagal unggah: ' + err.message, 'error');
    }
  };
  xhr.onerror = function() {
    if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Jaringan</span>';
    tampilkanNotif('Koneksi internet bermasalah', 'error');
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
// CCTV PEMANTAUAN (MUTLAK BERDASARKAN JSON ASLI)
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
        tugas.status = "Gagal (Timeout 15 Menit)"; 
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
      
      if (!resStatus.ok) return; 
      
      var jsonStatus = await resStatus.json();
      var stringData = JSON.stringify(jsonStatus);
      var cleanString = stringData.toUpperCase().replace(/\s/g, '');

      // 1. CEK SUKSES JIKA ADA FILE MP4 ATAU STATUS SUCCESS
      if (cleanString.includes('.MP4') || jsonStatus.status === "SUCCESS") {
        clearInterval(cekInterval);
        tugas.status = "Selesai"; 
        tugas.selesai = true;
        tugas.progress = 100; 
        
        var vidUrl = null;
        var match = stringData.match(/https?:\/\/[^"'\s]+\.mp4/i);
        if (match) vidUrl = match[0];
        
        tugas.videoUrl = vidUrl;
        simpanStorage();
        if (typeof renderLayarHistory === 'function') renderLayarHistory();
        
        if (vidUrl) tampilkanNotif('✓ Render sukses! Video ditarik.', 'sukses');
        return;
      }
      
      // 2. CEK GAGAL MUTLAK (Sesuai Struktur JSON RunningHub)
      var statusRoot = (jsonStatus.status || "").toString().toUpperCase();
      var errorMessage = jsonStatus.errorMessage || ""; 
      var isRealFailed = (statusRoot === "FAILED" || statusRoot === "CANCELLED" || statusRoot === "ERROR");

      // Cek ke dalam array taskUsageList
      if (jsonStatus.taskUsageList && Array.isArray(jsonStatus.taskUsageList)) {
        jsonStatus.taskUsageList.forEach(function(item) {
          if (item.taskId && String(item.taskId) === String(tugas.id)) {
            var subStatus = (item.taskStatus || "").toString().toUpperCase();
            if (subStatus === "FAILED" || subStatus === "CANCELLED" || subStatus === "ERROR") {
              isRealFailed = true;
            }
          }
        });
      }

      // Deteksi error lemparan dari backend Vercel (jika ada)
      if (jsonStatus.code === 502 || jsonStatus.code === 500) {
        isRealFailed = true;
        errorMessage = jsonStatus.msg || "Server Vercel Error";
      }

      // JIKA TERDETEKSI GAGAL, LANGSUNG EKSEKUSI BERHENTI!
      if (isRealFailed) {
        clearInterval(cekInterval);
        tugas.status = errorMessage ? ("Gagal: " + errorMessage) : "❌ Gagal Dirender";
        tugas.selesai = true;
        tugas.progress = 100;
        simpanStorage();
        if (typeof renderLayarHistory === 'function
