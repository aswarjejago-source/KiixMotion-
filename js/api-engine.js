// ==========================================
// PILAR 3: ENGINE LOGIC (FULL SECURE & STERIL)
// File: js/api-engine.js
// ==========================================

// KUNCI GLOBAL VARIABEL BIAR TIDAK PERNAH HILANG DARI WINDOW
window.riwayatGenerateList = window.riwayatGenerateList || [];
var riwayatGenerateList = window.riwayatGenerateList;

var engineMode = 'kiix'; 
var urlBahanFoto = null;
var urlBahanVideo = null;
var listKunciPro = [];

// NOTIFIKASI PUSAT MELAYANG
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

// ALUR OTOMATIS KE MENU LANGGANAN
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

// SISTEM PENYIMPANAN AMAN ANTI-OVERWRITE
function simpanStorage() {
  try {
    localStorage.setItem('km_list_kunci_pro', JSON.stringify(listKunciPro));
    if (window.riwayatGenerateList && Array.isArray(window.riwayatGenerateList)) {
      localStorage.setItem('km_riwayat_generate', JSON.stringify(window.riwayatGenerateList));
    }
  } catch (e) {}
}

function muatStorage() {
  try {
    var rawKeys = localStorage.getItem('km_list_kunci_pro');
    if (rawKeys) {
      listKunciPro = JSON.parse(rawKeys) || [];
    }
    var rawRiwayat = localStorage.getItem('km_riwayat_generate');
    if (rawRiwayat) {
      var hasilParse = JSON.parse(rawRiwayat);
      if (Array.isArray(hasilParse)) {
        window.riwayatGenerateList = hasilParse;
        riwayatGenerateList = hasilParse;
      }
    }
  } catch (e) {}
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

// UPLOAD BAHAN VIA WORKER
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

// DETEKSI STATUS REALTIME: TANGKAP TUNTAS JIKA TASK DIBATALKAN DI RUNNINGHUB
function pantauStatusVideo(tugas, apiKey, poolId, userId, didDeductCredit) {
  if (tugas.selesai) return; 
  if (!tugas.progress) tugas.progress = 0; 
  if (!tugas.startedAt) tugas.startedAt = Date.now();

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  var cekInterval = setInterval(async function() {
    tugas.intervalObj = cekInterval;
    if (tugas.selesai) { clearInterval(cekInterval); return; }

    var waktuBerjalan = Date.now() - tugas.startedAt;
    
    // TIMEOUT 1 JAM
    if (waktuBerjalan >= 3600000) {
      clearInterval(cekInterval);
      tugas.status = "❌ Gagal (Waktu Habis)"; 
      tugas.selesai = true;
      tugas.progress = 100;
      simpanStorage();
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
      return;
    }

    try {
      var res = await fetch('/api/outputs', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: tugas.id, 
          poolId: poolId || tugas.pool_id, 
          apiKey: apiKey || tugas.key 
        })
      });

      var textRaw = "";
      try { textRaw = await res.text(); } catch (e) {}
      var cleanString = textRaw.replace(/\\/g, '').toUpperCase();

      // 1. CEK SUKSES RENDER
      var vidUrl = null;
      try {
        var jsonObj = JSON.parse(textRaw);
        var dataObj = jsonObj.data || jsonObj;
        if (typeof dataObj === 'string' && dataObj.toUpperCase().includes('.MP4')) {
          vidUrl = dataObj;
        } else if (dataObj && typeof dataObj === 'object') {
          vidUrl = dataObj.fileUrl || dataObj.url || dataObj.videoUrl || dataObj.path || dataObj.fileUrls;
        }
      } catch (e) {}

      if (!vidUrl && cleanString.includes('.MP4')) {
        var match = textRaw.match(/https?:\/\/[^"'\s]+\.mp4/i);
        if (match) vidUrl = match[0];
      }

      if (vidUrl && typeof vidUrl === 'string') {
        clearInterval(cekInterval);
        tugas.status = "Selesai"; 
        tugas.selesai = true;
        tugas.progress = 100; 
        tugas.videoUrl = vidUrl.replace(/\\/g, '');

        simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        if (apiKey) refreshSaldoKunciOtomatis(apiKey);
        if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Video berhasil selesai!', 'sukses');
        return;
      }

      // 2. CEK BATAL / GAGAL (TIDAK BOLEH RETURN DIAM JIKA res.ok FALSE)
      var statusGagalTerdeteksi = (
        !res.ok ||
        cleanString.includes("CANCEL") ||
        cleanString.includes("ABORT") ||
        cleanString.includes("TERMINAT") ||
        cleanString.includes("TASK_NOT_FOUND") ||
        cleanString.includes("NOT_FOUND") ||
        cleanString.includes("FAILED") ||
        cleanString.includes("ERROR") ||
        cleanString.includes("EXCEPTION")
      );

      if (statusGagalTerdeteksi) {
        clearInterval(cekInterval);
        var labelStatus = "❌ Gagal Diproses Studio";
        if (cleanString.includes("CANCEL") || cleanString.includes("ABORT") || cleanString.includes("NOT_FOUND")) {
          labelStatus = "❌ Dibatalkan di RunningHub";
        }
        
        tugas.status = labelStatus;
        tugas.selesai = true;
        tugas.progress = 100;

        // Auto refund jika memotong kredit sistem
        var targetUserErr = userId || tugas.user_id;
        if (didDeductCredit && !tugas.refunded && typeof supa !== 'undefined' && targetUserErr) {
          try {
            tugas.refunded = true;
            tugas.did_deduct = false;
            await supa.rpc('refund_kredit_member', { target_user_id: String(targetUserErr) });
            if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(tugas.user_email);
            tampilkanNotifPusat('Render dibatalkan. 1 kredit dikembalikan otomatis.');
          } catch (errRefund) {
            tugas.refunded = false;
          }
        }

        simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        return;
      }

      // 3. PROGRES JIKA MASIH BERJALAN
      if (tugas.progress < 95) {
        tugas.progress += Math.floor(Math.random() * 3) + 2; 
      }
      tugas.status = "Sedang Memproses Video...";
      simpanStorage();
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();

    } catch (err) {
      // Jika koneksi putus berkali-kali ke server output, jangan biarkan kartu diam membeku
      tugas.errorCount = (tugas.errorCount || 0) + 1;
      if (tugas.errorCount >= 4) {
        clearInterval(cekInterval);
        tugas.status = "❌ Gagal Terhubung ke RunningHub";
        tugas.selesai = true;
        tugas.progress = 100;
        simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
      }
    }
  }, 5000); 
}

// HAPUS SATU KARTU DI RIWAYAT
function hapusRiwayatSatu(idx) {
  if (!window.riwayatGenerateList) return;
  if (window.riwayatGenerateList[idx] && window.riwayatGenerateList[idx].intervalObj) {
    clearInterval(window.riwayatGenerateList[idx].intervalObj);
  }
  window.riwayatGenerateList.splice(idx, 1);
  riwayatGenerateList = window.riwayatGenerateList;
  simpanStorage();
  if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
}

// REFRESH SALDO KOIN KUNCI PRO
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

  // GEMBOK AKSES PRO
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

    // SIMPAN KE RIWAYAT SECARA AMAN
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

// RESTORE POLLING PAS TAB DIAKTIFKAN LAGI
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

// INISIALISASI SAAT HALAMAN DIBUKA / DI-REFRESH
window.onload = function() {
  muatStorage();
  renderListAkunDiKelola();
  updateStatistikDashboard();
  setProviderUtama('kiix'); 
  if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
  if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();

  // Otomatis cek status tugas yang masih menggantung
  if (window.riwayatGenerateList && window.riwayatGenerateList.length > 0) {
    window.riwayatGenerateList.forEach(function(tugas) {
      if (!tugas.selesai && tugas.id) {
        pantauStatusVideo(tugas, tugas.key, tugas.pool_id, tugas.user_id, tugas.did_deduct);
      }
    });
  }
};
