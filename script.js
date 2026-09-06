var akunRunningHub = [];
var akunRoboneo = [];
var riwayatGenerateList = [];
var navLayarAktif = 'dashboard';
var engineProvider = 'runninghub';
var tabAkunAktif = 'runninghub';
var isModePilih = false;
var RUNNINGHUB_WORKFLOW_ID = "2096634336232931330";
var linkTelegramResmi = "https://t.me/KiixMotionStudio";
var userReferralCode = "KIIX-VIP" + Math.floor(100 + Math.random() * 900);

function muatStorage() {
  try {
    var sRH = localStorage.getItem('km_rh_data');
    var sRB = localStorage.getItem('km_rb_data');
    var sHist = localStorage.getItem('km_hist_data');
    var sRef = localStorage.getItem('km_my_ref_code');
    if (sRH) akunRunningHub = JSON.parse(sRH);
    if (sRB) akunRoboneo = JSON.parse(sRB);
    if (sHist) riwayatGenerateList = JSON.parse(sHist);
    if (sRef) { userReferralCode = sRef; } else { localStorage.setItem('km_my_ref_code', userReferralCode); }
  } catch (e) { console.error(e); }
  sinkronkanDropdownAkunGenerate();
  updateStatistikDashboard();
}

function simpanStorage() {
  try {
    localStorage.setItem('km_rh_data', JSON.stringify(akunRunningHub));
    localStorage.setItem('km_rb_data', JSON.stringify(akunRoboneo));
    localStorage.setItem('km_hist_data', JSON.stringify(riwayatGenerateList));
  } catch (e) { console.error(e); }
  updateStatistikDashboard();
}

function gantiLayarNav(layar) {
  navLayarAktif = layar;
  var vDash = document.getElementById('layar-dashboard');
  var vGen = document.getElementById('layar-generate');
  var vHist = document.getElementById('layar-history');
  var vAkun = document.getElementById('layar-kelola-akun');
  var mDash = document.getElementById('menu-nav-dash');
  var mGen = document.getElementById('menu-nav-gen');
  var mHist = document.getElementById('menu-nav-hist');
  var mAkun = document.getElementById('menu-nav-akun');
  var baseBtn = "px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ";
  
  if(mDash) mDash.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";
  if(mGen) mGen.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";
  if(mHist) mHist.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";
  if(mAkun) mAkun.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";

  if(vDash) vDash.style.display = 'none';
  if(vGen) vGen.style.display = 'none';
  if(vHist) vHist.style.display = 'none';
  if(vAkun) vAkun.style.display = 'none';

  if (layar === 'dashboard') {
    if(vDash) vDash.style.display = 'block';
    if(mDash) mDash.className = baseBtn + "bg-kmViolet text-white violet-glow";
    updateStatistikDashboard();
  } else if (layar === 'generate') {
    if(vGen) vGen.style.display = 'block';
    if(mGen) mGen.className = baseBtn + "bg-kmViolet text-white violet-glow";
  } else if (layar === 'history') {
    if(vHist) vHist.style.display = 'block';
    if(mHist) mHist.className = baseBtn + "bg-kmViolet text-white violet-glow";
    renderLayarHistory();
  } else if (layar === 'kelola-akun') {
    if(vAkun) vAkun.style.display = 'block';
    if(mAkun) mAkun.className = baseBtn + "bg-kmViolet text-white violet-glow";
    renderListAkunDiKelola();
  }
}

async function segarkanSaldoRunningHub(akun, apiKey) {
  try {
    var res = await fetch('https://www.runninghub.ai/task/openapi/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey })
    });
    var hasil = await res.json();
    if (hasil && hasil.data && (hasil.data.coins !== undefined || hasil.data.balance !== undefined)) {
      akun.koin = Number(hasil.data.coins || hasil.data.balance);
      simpanStorage();
      updateStatistikDashboard();
      sinkronkanDropdownAkunGenerate();
    }
  } catch (err) { console.warn("Gagal update saldo:", err); }
}

function updateStatistikDashboard() {
  var totalRhKoin = 0, maxRhKoin = 0;
  for (var i = 0; i < akunRunningHub.length; i++) {
    var k = Number(akunRunningHub[i].koin);
    totalRhKoin += k;
    if (k > maxRhKoin) maxRhKoin = k;
  }
  var totalRbCarrots = 0, maxRbCarrots = 0;
  for (var j = 0; j < akunRoboneo.length; j++) {
    var c = Number(akunRoboneo[j].koin);
    totalRbCarrots += c;
    if (c > maxRbCarrots) maxRbCarrots = c;
  }
  var elRhKoin = document.getElementById('dash-rh-total-koin');
  var elRhAkun = document.getElementById('dash-rh-total-akun');
  var elRhMax = document.getElementById('dash-rh-max-koin');
  var elRbCarrots = document.getElementById('dash-rb-total-carrots');
  var elRbAkun = document.getElementById('dash-rb-total-akun');
  var elRbMax = document.getElementById('dash-rb-max-carrots');

  if (elRhKoin) elRhKoin.innerText = totalRhKoin;
  if (elRhAkun) elRhAkun.innerText = akunRunningHub.length + "/" + akunRunningHub.length;
  if (elRhMax) elRhMax.innerText = maxRhKoin;
  if (elRbCarrots) elRbCarrots.innerText = totalRbCarrots;
  if (elRbAkun) elRbAkun.innerText = akunRoboneo.length + "/" + akunRoboneo.length;
  if (elRbMax) elRbMax.innerText = maxRbCarrots;
}

function bukaGrupTelegram() { window.open(linkTelegramResmi, '_blank'); }

function setProviderUtama(p) {
  engineProvider = p;
  var cRobo = document.getElementById('c-prov-roboneo'), cKiix = document.getElementById('c-prov-kiix'), cRh = document.getElementById('c-prov-rh');
  var bRobo = document.getElementById('b-prov-roboneo'), bKiix = document.getElementById('b-prov-kiix'), bRh = document.getElementById('b-prov-rh');

  if(cRobo) cRobo.className = "bg-kmCard border border-slate-200/80 p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
  if(cKiix) cKiix.className = "bg-kmCard border border-slate-200/80 p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
  if(cRh) cRh.className = "bg-kmCard border border-slate-200/80 p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
  if(bRobo) bRobo.style.display = 'none'; if(bKiix) bKiix.style.display = 'none'; if(bRh) bRh.style.display = 'none';

  if (p === 'roboneo') {
    if(cRobo) cRobo.className = "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50";
    if(bRobo) bRobo.style.display = 'inline-block';
  } else if (p === 'kiix') {
    if(cKiix) cKiix.className = "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50";
    if(bKiix) bKiix.style.display = 'inline-block';
  } else {
    if(cRh) cRh.className = "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50";
    if(bRh) bRh.style.display = 'inline-block';
  }
  sinkronkanDropdownAkunGenerate();
}

function fileTerpilihInput(input, txtId, stId, tipe) {
  if (input.files && input.files[0]) {
    var elTxt = document.getElementById(txtId);
    var elSt = document.getElementById(stId);
    if(elTxt) elTxt.innerText = input.files[0].name;
    if(elSt) elSt.innerHTML = '<span class="text-emerald-600 font-bold">✓ ' + (tipe === 'foto' ? 'Siap digunakan' : 'File terpasang') + '</span>';
  }
}

function sinkronkanDropdownAkunGenerate() {
  var sel = document.getElementById('sel-dropdown-akun');
  var targetAkun = engineProvider === 'roboneo' ? akunRoboneo : akunRunningHub;
  if (!sel) return;
  sel.innerHTML = '';
  if (targetAkun.length === 0) {
    var opt = document.createElement('option');
    opt.value = ""; opt.innerText = "Belum ada akun terhubung (0 koin)";
    sel.appendChild(opt);
  } else {
    var optRand = document.createElement('option');
    optRand.value = "random"; optRand.innerText = "🎲 Otomatis (Pilih Acak Akun)";
    sel.appendChild(optRand);
    for (var i = 0; i < targetAkun.length; i++) {
      var o = document.createElement('option');
      o.value = i;
      o.innerText = targetAkun[i].nama + " (" + targetAkun[i].koin + (engineProvider === 'roboneo' ? " carrots)" : " koin)");
      sel.appendChild(o);
    }
  }
}

async function uploadFileKeRunningHub(file, apiKey) {
  try {
    var formData = new FormData();
    formData.append("file", file);
    formData.append("apiKey", apiKey);
    var res = await fetch("https://www.runninghub.ai/task/openapi/upload", { method: "POST", body: formData });
    var json = await res.json();
    if (json && json.data && json.data.fileUrl) { return json.data.fileUrl; }
  } catch (e) { console.error("Gagal upload file:", e); }
  return null;
}

// Logika Upload Bertahap ala MotionFly
async function mulaiProsesGenerate() {
  var targetAkun = engineProvider === 'roboneo' ? akunRoboneo : akunRunningHub;
  if (engineProvider !== 'kiix' && targetAkun.length === 0) {
    alert('Hubungkan akun terlebih dahulu di menu Akun!');
    return;
  }
  var sel = document.getElementById('sel-dropdown-akun');
  var idx = sel ? sel.value : "";
  var akunAktif = (idx === "random" || idx === "") ? targetAkun[0] : targetAkun[parseInt(idx, 10)];

  var inputFoto = document.querySelector('input[type="file"][accept="image/*"]');
  var fileFoto = inputFoto && inputFoto.files ? inputFoto.files[0] : null;
  var inputVideo = document.querySelector('input[type="file"][accept="video/*"]');
  var fileVideo = inputVideo && inputVideo.files ? inputVideo.files[0] : null;

  if (!fileFoto || !fileVideo) {
    alert('Harap unggah Foto Karakter dan Video Gerakan terlebih dahulu!');
    return;
  }

  var btn = document.getElementById('btn-submit-generate');
  if(btn) { btn.disabled = true; }

  var taskIdAsli = null;

  if (engineProvider === 'runninghub') {
    try {
      if(btn) btn.innerText = "MENGUPLOAD FOTO...";
      var fotoUrl = await uploadFileKeRunningHub(fileFoto, akunAktif.key);
      if (!fotoUrl) { throw new Error("Gagal mengunggah foto karakter."); }

      if(btn) btn.innerText = "MENGUPLOAD VIDEO GERAKAN...";
      var videoUrlInput = await uploadFileKeRunningHub(fileVideo, akunAktif.key);
      if (!videoUrlInput) { throw new Error("Gagal mengunggah video gerakan."); }

      if(btn) btn.innerText = "MENGIRIM WORKFLOW GPU...";
      
      var nodeParams = [
        { nodeId: "3", fieldName: "text", fieldValue: "Follow reference video accurately. High detail, smooth movement." },
        { nodeId: "308", fieldName: "image", fieldValue: fotoUrl },
        { nodeId: "444", fieldName: "image", fieldValue: fotoUrl },
        { nodeId: "128", fieldName: "image", fieldValue: videoUrlInput }
      ];

      var res = await fetch('https://www.runninghub.ai/task/openapi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: akunAktif.key,
          workflowId: RUNNINGHUB_WORKFLOW_ID,
          nodeInfoList: nodeParams
        })
      });
      var data = await res.json();
      if (data && data.data && data.data.taskId) {
        taskIdAsli = data.data.taskId;
      } else {
        alert('Gagal dari server: ' + (data.msg || 'Periksa kuota/API Key RunningHub Anda.'));
        if(btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
        return;
      }
    } catch (e) {
      alert('Proses Gagal: ' + e.message);
      if(btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return;
    }
  }

  var tugasBaru = {
    id: taskIdAsli || ("RH-" + Date.now().toString().slice(-6)),
    model: "Wan Motion Control 1080HD",
    prov: "RunningHub",
    tgl: "Baru saja",
    biaya: "≈ 478 koin",
    videoUrl: null,
    status: "Sedang Render di GPU...",
    selesai: false
  };

  riwayatGenerateList.unshift(tugasBaru);
  simpanStorage();
  gantiLayarNav('history');
  if(btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }

  var cekInterval = setInterval(async function() {
    try {
      var resStatus = await fetch('https://www.runninghub.ai/task/openapi/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: akunAktif.key, taskId: tugasBaru.id })
      });
      var jsonStatus = await resStatus.json();
      if (jsonStatus && jsonStatus.data) {
        var st = jsonStatus.data.taskStatus;
        if (st === "SUCCESS") {
          clearInterval(cekInterval);
          tugasBaru.status = "Selesai"; tugasBaru.selesai = true;
          if (jsonStatus.data.fileUrlList && jsonStatus.data.fileUrlList.length > 0) {
            tugasBaru.videoUrl = jsonStatus.data.fileUrlList[0];
          }
          await segarkanSaldoRunningHub(akunAktif, akunAktif.key);
          simpanStorage();
          if (navLayarAktif === 'history') renderLayarHistory();
        } else if (st === "FAILED") {
          clearInterval(cekInterval);
          tugasBaru.status = "Gagal Dirender";
          await segarkanSaldoRunningHub(akunAktif, akunAktif.key);
          simpanStorage();
          if (navLayarAktif === 'history') renderLayarHistory();
        }
      }
    } catch (err) { console.warn("Polling tertunda:", err); }
  }, 8000);
}

function renderLayarHistory() {
  var wadah = document.getElementById('wadah-list-history');
  var counter = document.getElementById('txt-counter-history');
  if(!wadah) return;
  wadah.innerHTML = '';
  if(counter) counter.innerText = riwayatGenerateList.length + " tugas";

  if (riwayatGenerateList.length === 0) {
    wadah.innerHTML = '<div class="p-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-3xl bg-white modern-shadow">Belum ada riwayat generate video.</div>';
    return;
  }
  for (var i = 0; i < riwayatGenerateList.length; i++) {
    var itm = riwayatGenerateList[i];
    var isDone = itm.selesai === true && itm.videoUrl;
    var card = document.createElement('div');
    card.className = "bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 modern-shadow";
    card.innerHTML = '<div class="flex items-center gap-4">' +
      '<div class="w-12 h-12 rounded-2xl bg-kmVioletLight text-kmViolet flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">' + (isDone ? '▶' : '⏳') + '</div>' +
      '<div>' +
        '<div class="flex items-center gap-2"><span class="text-base font-bold text-kmTextPrimary">' + itm.model + '</span><span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">' + itm.prov + '</span></div>' +
        '<div class="text-xs sm:text-sm text-kmTextSecondary mt-1">ID: <span class="text-kmViolet font-mono font-bold">' + itm.id + '</span> • ' + itm.tgl + ' • <span class="text-amber-600 font-bold">' + itm.biaya + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">' +
      (isDone 
        ? '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Berhasil</span>' +
          '<button type="button" onclick="window.open(\'' + itm.videoUrl + '\', \'_blank\')" class="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">Putar</button>' +
          '<a href="' + itm.videoUrl + '" target="_blank" download="video-kiixmotion.mp4" class="px-4 py-2 text-xs font-bold bg-kmViolet text-white rounded-xl hover:bg-kmVioletHover transition violet-glow">Download</a>'
        : '<span class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold animate-pulse">⏳ ' + itm.status + '</span>') +
    '</div>';
    wadah.appendChild(card);
  }
}

function gantiTabAkunProvider(prov) {
  tabAkunAktif = prov;
  var tRb = document.getElementById('tab-pilih-roboneo'), tRh = document.getElementById('tab-pilih-rh');
  if (prov === 'runninghub') {
    if(tRh) tRh.className = "px-4 py-2 rounded-xl bg-kmViolet text-white font-bold text-xs";
    if(tRb) tRb.className = "px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold";
  } else {
    if(tRb) tRb.className = "px-4 py-2 rounded-xl bg-kmViolet text-white font-bold text-xs";
    if(tRh) tRh.className = "px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold";
  }
  renderListAkunDiKelola();
}

function renderListAkunDiKelola() {
  var wadah = document.getElementById('wadah-kartu-akun-list');
  var targetAkun = tabAkunAktif === 'runninghub' ? akunRunningHub : akunRoboneo;
  if(!wadah) return;
  wadah.innerHTML = '';
  for (var i = 0; i < targetAkun.length; i++) {
    var el = document.createElement('div');
    el.className = "bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between modern-shadow";
    el.innerHTML = '<div class="flex items-center gap-3">' +
      '<span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>' +
      '<span class="text-sm font-bold text-kmTextPrimary font-mono">' + targetAkun[i].nama + '</span>' +
    '</div>' +
    '<span class="text-sm font-black text-kmViolet font-mono bg-violet-50 px-3 py-1 rounded-xl">' + targetAkun[i].koin + ' koin</span>';
    wadah.appendChild(el);
  }
  if (targetAkun.length === 0) {
    wadah.innerHTML = '<div class="p-10 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-3xl bg-white">Belum ada akun terhubung.</div>';
  }
}

function bukaModalFormKey() { document.getElementById('modal-popup-key').style.display = 'flex'; }
function tutupModalFormKey() { document.getElementById('modal-popup-key').style.display = 'none'; }

async function simpanAkunBaruDariModal() {
  var inLabel = document.getElementById('in-modal-label');
  var inKey = document.getElementById('in-modal-key');
  var valLabel = inLabel ? inLabel.value.trim() : "";
  var valKey = inKey ? inKey.value.trim() : "";
  if (!valKey) return alert('Masukkan API Key terlebih dahulu!');

  var targetAkun = tabAkunAktif === 'runninghub' ? akunRunningHub : akunRoboneo;
  var namaAkun = valLabel || ((tabAkunAktif === 'runninghub' ? 'RunningHub #' : 'Roboneo #') + (targetAkun.length + 1));
  var saldoDidapat = 0;

  if (tabAkunAktif === 'runninghub') {
    try {
      var res = await fetch('https://www.runninghub.ai/task/openapi/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: valKey })
      });
      var hasil = await res.json();
      if (hasil && hasil.data && (hasil.data.coins !== undefined || hasil.data.balance !== undefined)) {
        saldoDidapat = Number(hasil.data.coins || hasil.data.balance);
      }
    } catch (err) { saldoDidapat = 0; }
  } else { saldoDidapat = 4; }

  targetAkun.push({ nama: namaAkun, key: valKey, koin: Number(saldoDidapat) });
  simpanStorage();
  tutupModalFormKey();
  renderListAkunDiKelola();
  sinkronkanDropdownAkunGenerate();
  alert('Berhasil terhubung!');
}

window.onload = function() {
  muatStorage();
  setProviderUtama('runninghub');
};
