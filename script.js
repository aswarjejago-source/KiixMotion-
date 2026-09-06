var akunRunningHub = [];
var akunRoboneo = [];
var riwayatGenerateList = [];

var navLayarAktif = 'dashboard';
var engineProvider = 'runninghub';
var tabAkunAktif = 'runninghub';
var isModePilih = false;

// WORKFLOW ID MOTIONFLY RESMI RUNNINGHUB
var RUNNINGHUB_WORKFLOW_ID = "2096475206973194241";
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
    if (sRef) {
      userReferralCode = sRef;
    } else {
      localStorage.setItem('km_my_ref_code', userReferralCode);
    }
  } catch (e) {
    console.error(e);
  }
  sinkronkanDropdownAkunGenerate();
  updateStatistikDashboard();

  var elRef = document.getElementById('dash-ref-code-txt');
  if (elRef) elRef.innerText = userReferralCode;
}

function simpanStorage() {
  try {
    localStorage.setItem('km_rh_data', JSON.stringify(akunRunningHub));
    localStorage.setItem('km_rb_data', JSON.stringify(akunRoboneo));
    localStorage.setItem('km_hist_data', JSON.stringify(riwayatGenerateList));
  } catch (e) {
    console.error(e);
  }
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
  mDash.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";
  mGen.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";
  mHist.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";
  mAkun.className = baseBtn + "text-kmTextSecondary hover:text-kmViolet hover:bg-slate-100/80";

  vDash.style.display = 'none';
  vGen.style.display = 'none';
  vHist.style.display = 'none';
  vAkun.style.display = 'none';

  if (layar === 'dashboard') {
    vDash.style.display = 'block';
    mDash.className = baseBtn + "bg-kmViolet text-white violet-glow";
    updateStatistikDashboard();
  } else if (layar === 'generate') {
    vGen.style.display = 'block';
    mGen.className = baseBtn + "bg-kmViolet text-white violet-glow";
  } else if (layar === 'history') {
    vHist.style.display = 'block';
    mHist.className = baseBtn + "bg-kmViolet text-white violet-glow";
    renderLayarHistory();
  } else if (layar === 'kelola-akun') {
    vAkun.style.display = 'block';
    mAkun.className = baseBtn + "bg-kmViolet text-white violet-glow";
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
  } catch (err) {
    console.warn("Gagal update saldo:", err);
  }
}

function updateStatistikDashboard() {
  var totalRhKoin = 0;
  var maxRhKoin = 0;
  for (var i = 0; i < akunRunningHub.length; i++) {
    var k = Number(akunRunningHub[i].koin);
    totalRhKoin += k;
    if (k > maxRhKoin) maxRhKoin = k;
  }

  var totalRbCarrots = 0;
  var maxRbCarrots = 0;
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

  var elStatSelesai = document.getElementById('dash-stat-video-selesai');

  if (elRhKoin) elRhKoin.innerText = totalRhKoin;
  if (elRhAkun) elRhAkun.innerText = akunRunningHub.length + "/" + akunRunningHub.length;
  if (elRhMax) elRhMax.innerText = maxRhKoin;

  if (elRbCarrots) elRbCarrots.innerText = totalRbCarrots;
  if (elRbAkun) elRbAkun.innerText = akunRoboneo.length + "/" + akunRoboneo.length;
  if (elRbMax) elRbMax.innerText = maxRbCarrots;

  if (elStatSelesai) elStatSelesai.innerText = riwayatGenerateList.length;
}

function bukaGrupTelegram() {
  window.open(linkTelegramResmi, '_blank');
}

function salinKodeReferral() {
  var linkUndang = window.location.origin + "/app.html?ref=" + userReferralCode;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(linkUndang).then(function() {
      alert('✓ Link referral berhasil disalin:\n' + linkUndang + '\n\nBagikan ke teman kamu untuk dapat +7 hari Pro gratis!');
    });
  } else {
    prompt("Salin link referral kamu:", linkUndang);
  }
}

function bukaModalReferral() {
  document.getElementById('modal-referral-info').style.display = 'flex';
}

function tutupModalReferral() {
  document.getElementById('modal-referral-info').style.display = 'none';
}

function setProviderUtama(p) {
  engineProvider = p;
  var cRobo = document.getElementById('c-prov-roboneo');
  var cKiix = document.getElementById('c-prov-kiix');
  var cRh = document.getElementById('c-prov-rh');

  var bRobo = document.getElementById('b-prov-roboneo');
  var bKiix = document.getElementById('b-prov-kiix');
  var bRh = document.getElementById('b-prov-rh');

  var tTitle = document.getElementById('t-engine-title');
  var tSub = document.getElementById('t-engine-sub');
  var tCost = document.getElementById('t-engine-cost');
  var tTotal = document.getElementById('t-engine-total');
  var dropWrap = document.getElementById('box-wrap-dropdown-akun');

  cRobo.className = "bg-kmCard border border-slate-200/80 p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
  cKiix.className = "bg-kmCard border border-slate-200/80 p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
  cRh.className = "bg-kmCard border border-slate-200/80 p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";

  bRobo.style.display = 'none';
  bKiix.style.display = 'none';
  bRh.style.display = 'none';

  if (p === 'roboneo') {
    cRobo.className = "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50";
    bRobo.style.display = 'inline-block';
    tTitle.innerText = "KLING 2.6 MOTION CONTROL";
    tSub.innerText = "(ROBONEO)";
    tCost.innerText = "≈ 4 carrots";
    tTotal.innerText = "≈ 4 carrots";
    dropWrap.style.display = 'block';
  } else if (p === 'kiix') {
    cKiix.className = "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50";
    bKiix.style.display = 'inline-block';
    tTitle.innerText = "KIIXMOTION DIRECT CLOUD";
    tSub.innerText = "(DIRECT ENGINE)";
    tCost.innerText = "1 Kredit VIP";
    tTotal.innerText = "1 kredit VIP";
    dropWrap.style.display = 'none';
  } else {
    cRh.className = "bg-white border-2 border-kmViolet p-5 rounded-2xl cursor-pointer modern-shadow ring-4 ring-violet-50";
    bRh.style.display = 'inline-block';
    tTitle.innerText = "WAN MOTION CONTROL 1080HD";
    tSub.innerText = "(RUNNINGHUB)";
    tCost.innerText = "≈ 478 kredit";
    tTotal.innerText = "≈ 478 kredit";
    dropWrap.style.display = 'block';
  }
  sinkronkanDropdownAkunGenerate();
}

function switchBahanInput(mode) {
  var bu = document.getElementById('tab-u');
  var bt = document.getElementById('tab-t');
  var vu = document.getElementById('v-mode-upload');
  var vt = document.getElementById('v-mode-tiktok');

  if (mode === 'u') {
    vu.style.display = "grid";
    vt.style.display = "none";
    bu.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-kmViolet shadow-sm cursor-pointer";
    bt.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer";
  } else {
    vu.style.display = "none";
    vt.style.display = "block";
    bt.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-kmViolet shadow-sm cursor-pointer";
    bu.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer";
  }
}

function fileTerpilihInput(input, txtId, stId, tipe) {
  if (input.files && input.files[0]) {
    document.getElementById(txtId).innerText = input.files[0].name;
    document.getElementById(stId).innerHTML = '<span class="text-emerald-600 font-bold">✓ ' + (tipe === 'foto' ? 'Siap digunakan' : 'File terpasang') + '</span>';
  }
}

function tempelLinkTiktok() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(function(t) {
      if (t) {
        document.getElementById('in-link-tiktok').value = t;
        alert('Link TikTok berhasil ditempel!');
      }
    });
  }
}

function sinkronkanDropdownAkunGenerate() {
  var sel = document.getElementById('sel-dropdown-akun');
  var badge = document.getElementById('badge-total-saldo-gen');
  var targetAkun = engineProvider === 'roboneo' ? akunRoboneo : akunRunningHub;
  if (!sel) return;
  sel.innerHTML = '';

  if (targetAkun.length === 0) {
    var opt = document.createElement('option');
    opt.value = "";
    opt.innerText = "Belum ada akun terhubung (0 koin)";
    sel.appendChild(opt);
    badge.innerText = "0 koin";
    badge.className = "text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg";
  } else {
    var optRand = document.createElement('option');
    optRand.value = "random";
    optRand.innerText = "🎲 Otomatis (Pilih Acak Akun)";
    sel.appendChild(optRand);

    var total = 0;
    for (var i = 0; i < targetAkun.length; i++) {
      total += Number(targetAkun[i].koin);
      var o = document.createElement('option');
      o.value = i;
      o.innerText = targetAkun[i].nama + " (" + targetAkun[i].koin + (engineProvider === 'roboneo' ? " carrots)" : " koin)");
      sel.appendChild(o);
    }

    badge.innerText = total + (engineProvider === 'roboneo' ? " carrots" : " koin");
    badge.className = "text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg";
  }
}

// UPLOAD ASSET KE STORAGE RESMI RUNNINGHUB
async function uploadFileKeRunningHub(file, apiKey) {
  try {
    var formData = new FormData();
    formData.append("file", file);
    formData.append("apiKey", apiKey);

    var res = await fetch("https://www.runninghub.ai/task/openapi/upload", {
      method: "POST",
      body: formData
    });
    var json = await res.json();
    if (json && json.data && json.data.fileUrl) {
      return json.data.fileUrl;
    }
  } catch (e) {
    console.error("Gagal upload file:", e);
  }
  return null;
}

// PROSES GENERATE UTAMA
async function mulaiProsesGenerate() {
  var targetAkun = engineProvider === 'roboneo' ? akunRoboneo : akunRunningHub;
  if (engineProvider !== 'kiix' && targetAkun.length === 0) {
    alert('Hubungkan akun terlebih dahulu di menu Akun!');
    return;
  }

  var sel = document.getElementById('sel-dropdown-akun');
  var idx = sel.value;
  var akunAktif = (idx === "random" || idx === "") ? targetAkun[0] : targetAkun[parseInt(idx, 10)];

  var inputFoto = document.querySelector('input[type="file"][accept="image/*"]');
  var fileFoto = inputFoto && inputFoto.files ? inputFoto.files[0] : null;

  var inputVideo = document.querySelector('input[type="file"][accept="video/*"]');
  var fileVideo = inputVideo && inputVideo.files ? inputVideo.files[0] : null;

  if (!fileFoto && !fileVideo) {
    alert('Unggah minimal Foto Karakter atau Video Gerakan terlebih dahulu!');
    return;
  }

  var btn = document.getElementById('btn-submit-generate');
  btn.disabled = true;

  var taskIdAsli = null;

  if (engineProvider === 'runninghub') {
    try {
      btn.innerText = "MENGUNGGAH BAHAN INPUT...";
      var fotoUrl = null;
      var videoUrlInput = null;

      if (fileFoto) {
        fotoUrl = await uploadFileKeRunningHub(fileFoto, akunAktif.key);
      }
      if (fileVideo) {
        videoUrlInput = await uploadFileKeRunningHub(fileVideo, akunAktif.key);
      }

      btn.innerText = "MENGIRIM WORKFLOW GPU...";
      
      // Node 3 (Prompt), Node 308 (Image In), Node 89 (Video In), Node 426/444 (Ref Image)
      var nodeParams = [
        {
          nodeId: "3",
          fieldName: "text",
          fieldValue: "Follow reference video accurately. High detail, smooth movement, perfectly consistent facial identity."
        }
      ];

      if (fotoUrl) {
        nodeParams.push({ nodeId: "308", fieldName: "image", fieldValue: fotoUrl });
        nodeParams.push({ nodeId: "426", fieldName: "image", fieldValue: fotoUrl });
        nodeParams.push({ nodeId: "444", fieldName: "image", fieldValue: fotoUrl });
      }

      if (videoUrlInput) {
        nodeParams.push({ nodeId: "89", fieldName: "image", fieldValue: videoUrlInput });
      }

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
        alert('Gagal membuat task: ' + (data.msg || 'Periksa kuota akun Anda.'));
        btn.innerText = "GENERATE VIDEO";
        btn.disabled = false;
        return;
      }
    } catch (e) {
      alert('Koneksi ke RunningHub gagal: ' + e.message);
      btn.innerText = "GENERATE VIDEO";
      btn.disabled = false;
      return;
    }
  }

  var tugasBaru = {
    id: taskIdAsli,
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

  btn.innerText = "GENERATE VIDEO";
  btn.disabled = false;

  // Lakukan polling status asli ke RunningHub tiap 8 detik
  var cekInterval = setInterval(async function() {
    try {
      var resStatus = await fetch('https://www.runninghub.ai/task/openapi/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: akunAktif.key,
          taskId: taskIdAsli
        })
      });
      var jsonStatus = await resStatus.json();

      if (jsonStatus && jsonStatus.data) {
        var st = jsonStatus.data.taskStatus;
        if (st === "SUCCESS") {
          clearInterval(cekInterval);
          tugasBaru.status = "Selesai";
          tugasBaru.selesai = true;

          // Tangkap URL MP4 final hasil render MotionFly
          if (jsonStatus.data.fileUrlList && jsonStatus.data.fileUrlList.length > 0) {
            tugasBaru.videoUrl = jsonStatus.data.fileUrlList[0];
          }

          // Sinkronkan sisa saldo akun secara riil
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
    } catch (err) {
      console.warn("Polling tertunda:", err);
    }
  }, 8000);
}

function renderLayarHistory() {
  var wadah = document.getElementById('wadah-list-history');
  var counter = document.getElementById('txt-counter-history');
  wadah.innerHTML = '';
  counter.innerText = riwayatGenerateList.length + " tugas";

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
        ? '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Render Berhasil</span>' +
          '<button type="button" onclick="window.open(\'' + itm.videoUrl + '\', \'_blank\')" class="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">Putar</button>' +
          '<a href="' + itm.videoUrl + '" target="_blank" download="video-kiixmotion.mp4" class="px-4 py-2 text-xs font-bold bg-kmViolet text-white rounded-xl hover:bg-kmVioletHover transition violet-glow">Download</a>'
        : '<span class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold animate-pulse">⏳ ' + itm.status + '</span>') +
    '</div>';
    wadah.appendChild(card);
  }
}

function bersihkanSemuaHistory() {
  if (riwayatGenerateList.length === 0) return alert('History sudah kosong.');
  if (confirm('Hapus seluruh riwayat generate?')) {
    riwayatGenerateList = [];
    simpanStorage();
    renderLayarHistory();
  }
}

function gantiTabAkunProvider(prov) {
  tabAkunAktif = prov;
  var tRb = document.getElementById('tab-pilih-roboneo');
  var tRh = document.getElementById('tab-pilih-rh');
  var pRh = document.getElementById('panduan-rh-box');
  var pRb = document.getElementById('panduan-rb-box');

  var head = document.getElementById('txt-head-akun');
  var sub = document.getElementById('txt-sub-akun');
  var btnTambah = document.getElementById('txt-btn-tambah-lab
