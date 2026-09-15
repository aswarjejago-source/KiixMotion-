// ==========================================
// PILAR 3: API ENGINE & RENDER LOGIC
// File: js/api-engine.js
// Fungsi: Integrasi server luar, render UI data dinamis + Progress 0-100% & Auto-Resume
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
  
  var emailDisp = document.getElementById('label-current-user-email');
  if (emailDisp && currentUserEmail) emailDisp.innerText = currentUserEmail;
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
        tampilkanNotif('File berhasil diunggah: ' + serverFile, 'sukses');
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

// -------------------------------------------------------------------------
// REVISI GUA: CUMA NGUBAH FUNGSI INI DOANG, PROGRESS REALISTIS + PARSER KEBAL
// -------------------------------------------------------------------------
function pantauTaskRunningHub(tugas, apiKey) {
  if (!tugas.progress) tugas.progress = 10; 

  var cekInterval = setInterval(async function() {
    try {
      // 1. Progress naik bertahap secara halus (mentok 88%)
      if (!tugas.selesai && tugas.progress < 88) {
        tugas.progress += Math.floor(Math.random() * 5) + 2;
        if (tugas.progress > 88) tugas.progress = 88;
        simpanStorage();
        if (navLayarAktif === 'history') renderLayarHistory();
      }

      var resStatus = await fetch('https://www.runninghub.ai/task/openapi/outputs?taskId=' + tugas.id, { headers: { 'Authorization': 'Bearer ' + apiKey } });
      var textBalasan = await resStatus.text();
      var jsonStatus = JSON.parse(textBalasan);
      var src = jsonStatus.data || jsonStatus;
      
      if (src) {
        var st = (src.status || src.taskStatus || "").toUpperCase();
        if (st === "SUCCESS" || st === "FINISHED" || st === "DONE") {
          clearInterval(cekInterval);
          tugas.status = "Selesai"; 
          tugas.selesai = true;
          tugas.progress = 100; // Pas 100%
          
          var vidUrl = null;
          
          // 2. PARSER URL SUPER KEBAL: Ambil array index paling akhir (length - 1)
          if (src.results && src.results.length > 0) {
              var indexTerakhir = src.results.length - 1;
              vidUrl = src.results[indexTerakhir].url || src.results[indexTerakhir].fileUrl;
          } else if (src.outputs && src.outputs.length > 0) {
              var indexTerakhir = src.outputs.length - 1;
              vidUrl = src.outputs[indexTerakhir].fileUrl || src.outputs[indexTerakhir].url || src.outputs[indexTerakhir].video;
          } else {
              vidUrl = src.fileUrl || src.url;
          }
          
          tugas.videoUrl = vidUrl;
          simpanStorage();
          if (navLayarAktif === 'history') renderLayarHistory();
          tampilkanNotif('✓ Render video berhasil ditarik ke web! ID: ' + tugas.id, 'sukses');
        } else if (st === "FAILED" || st === "ERROR") {
          clearInterval(cekInterval);
          tugas.status = "Gagal Dirender"; 
          tugas.selesai = true;
          tugas.progress = 100;
          simpanStorage();
          if (navLayarAktif === 'history') renderLayarHistory();
          tampilkanNotif('❌ Render gagal dari server GPU!', 'error');
        }
      }
    } catch (err) { console.warn("CCTV Polling tertunda:", err); }
  }, 7000); // 7000 ms persis dari kodingan asli lu
}

// -------------------------------------------------------------------------
// FUNGSI INI 100% GAK GUA UBAH, MURNI KODINGAN LU YANG SUKSES (ADA NODE 454)
// -------------------------------------------------------------------------
async function mulaiProsesGenerate() {
  var targetAkun = (engineProvider === 'roboneo') ? akunRoboneo : akunRunningHub;
  if (engineProvider !== 'kiix' && targetAkun.length === 0) return tampilkanNotif('Hubungkan akun di menu Kelola Akun terlebih dahulu!', 'error');
  var sel = document.getElementById('sel-dropdown-akun'), idx = sel ? sel.value : "";
  var akunAktif = (idx === "random" || idx === "") ? targetAkun[0] : targetAkun[parseInt(idx, 10)];
  
  if (!urlBahanFoto || !urlBahanVideo) return tampilkanNotif('Foto dan Video keduanya harus selesai diunggah!', 'error');
  var btn = document.getElementById('btn-submit-generate');
  if (btn) { btn.disabled = true; btn.innerText = "⚡ MENGIRIM KE GPU..."; }
  var taskIdAsli = null;

  if (engineProvider === 'runninghub') {
    try {
      var nodeParams = [
        { nodeId: "30", fieldName: "image", fieldValue: urlBahanFoto },
        { nodeId: "33", fieldName: "video", fieldValue: urlBahanVideo },
        { nodeId: "271", fieldName: "value", fieldValue: "true" },
        { nodeId: "454", fieldName: "value", fieldValue: "false" }
      ];
      
      var res = await fetch('https://www.runninghub.ai/task/openapi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + akunAktif.key },
        body: JSON.stringify({ workflowId: RUNNINGHUB_WORKFLOW_ID, apiKey: akunAktif.key, nodeInfoList: nodeParams })
      });
      
      var textRes = await res.text();
      var data;
      try {
        data = textRes ? JSON.parse(textRes) : null;
      } catch(err) {
        throw new Error("Server RunningHub merespon dengan format yang tidak valid.");
      }

      if (data && (data.code === 0 || data.data) && (data.data?.taskId || data.taskId)) { 
        taskIdAsli = data.data?.taskId || data.taskId; 
        tampilkanNotif('Tugas berhasil dikirim ke GPU! ID: ' + taskIdAsli, 'sukses');
      } else { 
        console.log("Error dari server:", data);
        tampilkanNotif('Gagal RunningHub: ' + (data ? (data.msg || JSON.stringify(data)) : 'Respon kosong'), 'error');
        if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; } return; 
      }
    } catch (e) { 
      tampilkanNotif('Proses Gagal: ' + e.message, 'error'); 
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; } return; 
    }
  }

  var tugasBaru = {
    id: taskIdAsli || ("RH-" + Date.now().toString().slice(-6)),
    key: akunAktif.key, model: "Wan Motion Control", prov: "RunningHub",
    tgl: "Baru saja", biaya: "≈ 478 coin", videoUrl: null,
    status: "Sedang Render di GPU...", selesai: false, progress: 10
  };
  
  riwayatGenerateList.unshift(tugasBaru); simpanStorage(); gantiLayarNav('history');
  if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  if (taskIdAsli) pantauTaskRunningHub(tugasBaru, akunAktif.key);
}

// TAMPILKAN HISTORY DENGAN PERSENTASE PROGRESS (0-100%)
function renderLayarHistory() {
  var wadah = document.getElementById('wadah-list-history'), counter = document.getElementById('txt-counter-history');
  if (!wadah) return; wadah.innerHTML = '';
  if (counter) counter.innerText = riwayatGenerateList.length + " tugas";
  if (riwayatGenerateList.length === 0) {
    wadah.innerHTML = '<div class="p-12 text-center text-slate-400 text-sm border-2 border-dashed border-kmBorder rounded-3xl bg-white modern-shadow">Belum ada riwayat generate video.</div>';
    return;
  }
  riwayatGenerateList.forEach(function(itm) {
    var isDone = (itm.selesai === true || itm.status === "Selesai"), hasVideo = Boolean(itm.videoUrl);
    var currentProg = itm.progress !== undefined ? itm.progress : (isDone ? 100 : 15);
    
    var card = document.createElement('div');
    card.className = "bg-white border border-kmBorder p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 modern-shadow";
    card.innerHTML = '<div class="flex items-center gap-4"><div class="w-12 h-12 rounded-2xl bg-kmVioletLight text-kmViolet flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">' + (isDone ? '▶' : '⏳') + '</div><div><div class="flex items-center gap-2"><span class="text-base font-bold text-kmTextPrimary">' + itm.model + '</span><span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">' + itm.prov + '</span></div><div class="text-xs sm:text-sm text-kmTextSecondary mt-1">ID: <span class="text-kmViolet font-mono font-bold">' + itm.id + '</span> • ' + itm.tgl + ' • <span class="text-amber-600 font-bold">' + itm.biaya + '</span></div></div></div><div class="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">' +
      (isDone ? (hasVideo ? '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Selesai (100%)</span><button type="button" onclick="window.open(\'' + itm.videoUrl + '\', \'_blank\')" class="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer">Putar</button><a href="' + itm.videoUrl + '" target="_blank" download="kiixmotion-' + itm.id + '.mp4" class="px-4 py-2 text-xs font-bold bg-kmViolet text-white rounded-xl hover:bg-kmVioletHover transition violet-glow">Download</a>'
        : '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Selesai di GPU (100%)</span>')
        : '<span class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold animate-pulse">⏳ Render: ' + currentProg + '%</span>') + '</div>';
    wadah.appendChild(card);
  });
}

function bersihkanSemuaHistory() {
  if (riwayatGenerateList.length === 0) return tampilkanNotif('History sudah kosong.', 'info');
  mintaKonfirmasi('Hapus seluruh riwayat generate?', function() {
    riwayatGenerateList = []; simpanStorage(); renderLayarHistory(); tampilkanNotif('History dibersihkan', 'sukses');
  });
}

function gantiTabAkunProvider(prov) {
  tabAkunAktif = prov;
  var tRb = document.getElementById('tab-pilih-roboneo'), tRh = document.getElementById('tab-pilih-rh');
  if (tRh) tRh.className = (prov === 'runninghub') ? "px-5 py-2.5 rounded-xl bg-kmViolet text-white font-bold cursor-pointer text-sm violet-glow" : "px-5 py-2.5 rounded-xl bg-white border border-kmBorder text-slate-600 hover:text-slate-900 transition cursor-pointer text-sm font-semibold";
  if (tRb) tRb.className = (prov === 'roboneo') ? "px-5 py-2.5 rounded-xl bg-kmViolet text-white font-bold cursor-pointer text-sm violet-glow" : "px-5 py-2.5 rounded-xl bg-white border border-kmBorder text-slate-600 hover:text-slate-900 transition cursor-pointer text-sm font-semibold";
  if (isModePilih) toggleModePilihHapus();
  renderListAkunDiKelola();
}

function renderListAkunDiKelola() {
  var wadah = document.getElementById('wadah-kartu-akun-list'), targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo;
  if (!wadah) return; wadah.innerHTML = '';
  var totalKredit = 0;
  targetAkun.forEach(function(a, i) {
    var koinVal = Number(a.koin) || 0; totalKredit += koinVal;
    var el = document.createElement('div');
    el.className = "bg-white border border-kmBorder p-4 sm:p-5 rounded-2xl flex items-center justify-between modern-shadow";
    el.innerHTML = '<div class="flex items-center gap-3.5"><input type="checkbox" data-idx="' + i + '" class="chk-seleksi-akun ' + (isModePilih ? '' : 'hidden') + ' w-5 h-5 rounded-lg accent-kmViolet cursor-pointer" /><span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-100"></span><span class="text-xs sm:text-sm font-bold text-kmTextPrimary font-mono break-all w-32 sm:w-64 truncate" title="' + a.key + '">' + a.nama + '</span></div><div class="flex items-center gap-3"><span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">Aktif</span><span class="text-sm sm:text-base font-black text-kmViolet font-mono bg-violet-50 px-3 py-1 rounded-xl">' + koinVal + (tabAkunAktif === 'roboneo' ? ' carrots' : ' coin') + '</span><button onclick="hapusAkunSatu(' + i + ')" class="text-rose-500 hover:text-rose-700 text-xs font-bold font-sans">Hapus</button></div>';
    wadah.appendChild(el);
  });
  var setTxt = function(id, v) { var el = document.getElementById(id); if (el) el.innerText = v; };
  setTxt('txt-stat-aktif', targetAkun.length); setTxt('txt-stat-akun', targetAkun.length); setTxt('txt-stat-kredit', totalKredit);
  if (targetAkun.length === 0) wadah.innerHTML = '<div class="p-10 text-center text-slate-400 text-sm border-2 border-dashed border-kmBorder rounded-3xl bg-white modern-shadow">Belum ada akun terhubung. Klik "+ Tambah API Key" di atas.</div>';
}

function hapusAkunSatu(idx) {
  var targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo;
  mintaKonfirmasi("Yakin ingin menghapus akun ini?", function() {
    targetAkun.splice(idx, 1); simpanStorage(); renderListAkunDiKelola(); sinkronkanDropdownAkunGenerate(); tampilkanNotif('Akun dihapus', 'sukses');
  });
}

function eksekusiHapusAkun() {
  var checkedBoxes = document.querySelectorAll('.chk-seleksi-akun:checked');
  if (checkedBoxes.length === 0) return tampilkanNotif('Pilih minimal satu akun!', 'error');
  mintaKonfirmasi('Hapus ' + checkedBoxes.length + ' akun terpilih?', function() {
    var targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo, toDel = [];
    checkedBoxes.forEach(function(c) { toDel.push(parseInt(c.getAttribute('data-idx'), 10)); });
    toDel.sort(function(a, b) { return b - a; }).forEach(function(idx) { targetAkun.splice(idx, 1); });
    simpanStorage(); toggleModePilihHapus(); renderListAkunDiKelola(); sinkronkanDropdownAkunGenerate(); tampilkanNotif('Akun dihapus', 'sukses');
  });
}

async function simpanAkunBaruDariModal() {
  var inKey = document.getElementById('in-modal-key'), valKey = inKey ? inKey.value.trim() : "";
  if (!valKey) return tampilkanNotif('Masukkan API Key terlebih dahulu!', 'error');
  var targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo;
  var btnSimpan = document.getElementById('btn-simpan-key');
  if (btnSimpan) { btnSimpan.innerText = 'Menyinkronkan Coin...'; btnSimpan.disabled = true; }
  var saldoDidapat = 0;

  if (tabAkunAktif === 'runninghub') {
    try {
      var res = await fetch('/api/saldo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: valKey })
      });
      var hasil = await res.json();
      if (res.ok && hasil && (hasil.code === 0 || hasil.code === 200 || hasil.data)) {
        var rawData = hasil.data || hasil;
        var k = rawData.totalCoins !== undefined ? rawData.totalCoins : rawData.coins !== undefined ? rawData.coins : rawData.coin !== undefined ? rawData.coin : rawData.credit !== undefined ? rawData.credit : rawData.balance !== undefined ? rawData.balance : rawData.remainCoins !== undefined ? rawData.remainCoins : undefined;
        saldoDidapat = (k !== undefined && k !== null) ? Number(k) : 0;
      } else {
        if (btnSimpan) { btnSimpan.innerText = 'Simpan API Key'; btnSimpan.disabled = false; }
        return tampilkanNotif('API Key Ditolak: ' + ((hasil && hasil.msg) ? hasil.msg : 'Ditolak Server'), 'error');
      }
    } catch (err) {
      if (btnSimpan) { btnSimpan.innerText = 'Simpan API Key'; btnSimpan.disabled = false; }
      return tampilkanNotif('Gagal terhubung ke Vercel: ' + err.message, 'error');
    }
  } else { saldoDidapat = 4; }

  if (btnSimpan) { btnSimpan.innerText = 'Simpan API Key'; btnSimpan.disabled = false; }
  
  var indexKetemu = targetAkun.findIndex(function(a) { return a.key === valKey; });
  if (indexKetemu !== -1) {
    targetAkun[indexKetemu].koin = Number(saldoDidapat); tampilkanNotif('✓ Saldo akun berhasil direfresh! Koin saat ini: ' + saldoDidapat, 'sukses');
  } else {
    targetAkun.push({ nama: valKey, key: valKey, koin: Number(saldoDidapat) }); tampilkanNotif('✓ Akun baru terhubung! Coin ditarik: ' + saldoDidapat, 'sukses');
  }
  simpanStorage(); tutupModalFormKey(); renderListAkunDiKelola(); sinkronkanDropdownAkunGenerate();
}

// Inisialisasi awal saat web dimuat (Termasuk Auto-Resume Background Polling untuk tugas pending)
window.onload = function() {
  muatStorage();
  setProviderUtama('runninghub');
  aturTampilanHalamanUtama();

  // AUTO-RESUME: Lanjutkan pemantauan tugas yang belum selesai jika halaman direfresh
  if (typeof riwayatGenerateList !== 'undefined' && riwayatGenerateList.length > 0) {
    riwayatGenerateList.forEach(function(tugas) {
      if (!tugas.selesai && tugas.id && tugas.key) {
        pantauTaskRunningHub(tugas, tugas.key);
      }
    });
  }
};
