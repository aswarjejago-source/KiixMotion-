// ==========================================
// PILAR 3: API ENGINE & RENDER LOGIC (POOL ENGINE + VIP + KREDIT 24 JAM)
// File: js/api-engine.js
// ==========================================

var engineProvider = 'runninghub';
var RUNNINGHUB_WORKFLOW_ID = "2099509417535340546"; 
var urlBahanFoto = null;
var urlBahanVideo = null;

function updateStatistikDashboard() {
  var totalRhKoin = 0, maxRhKoin = 0, totalRbCarrots = 0, maxRbCarrots = 0;
  if (typeof akunRunningHub !== 'undefined') {
    akunRunningHub.forEach(function(a) {
      var k = Number(a.koin) || 0;
      totalRhKoin += k;
      if (k > maxRhKoin) maxRhKoin = k;
    });
  }
  if (typeof akunRoboneo !== 'undefined') {
    akunRoboneo.forEach(function(r) {
      var c = Number(r.koin) || 0;
      totalRbCarrots += c;
      if (c > maxRbCarrots) maxRbCarrots = c;
    });
  }
  var setTxt = function(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  setTxt('dash-rh-total-koin', totalRhKoin);
  setTxt('dash-rh-total-akun', typeof akunRunningHub !== 'undefined' ? akunRunningHub.length : 0);
  setTxt('dash-rh-max-koin', maxRhKoin);
  setTxt('dash-rb-total-carrots', totalRbCarrots);
  setTxt('dash-rb-total-akun', typeof akunRoboneo !== 'undefined' ? akunRoboneo.length : 0);
  setTxt('dash-rb-max-carrots', maxRbCarrots);
  if (typeof riwayatGenerateList !== 'undefined') {
    setTxt('dash-stat-video-selesai', riwayatGenerateList.filter(function(r) { return r.selesai; }).length);
  }
  
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
    setTxt('t-engine-title', "KLING MOTION CONTROL");
    setTxt('t-engine-sub', "(KIIX MOTION)");
    setTxt('t-engine-cost', "≈ 4 carrots");
    setTxt('t-engine-total', "≈ 4 carrots");
    if (dropWrap) dropWrap.style.display = 'block';
  } else if (p === 'kiix') {
    setTxt('t-engine-title', "KIIXMOTION DIRECT CLOUD");
    setTxt('t-engine-sub', "(DIRECT ENGINE)");
    setTxt('t-engine-cost', "1 Kredit");
    setTxt('t-engine-total', "1 kredit");
    if (dropWrap) dropWrap.style.display = 'none';
  } else {
    setTxt('t-engine-title', "WAN MOTION CONTROL 1080HD");
    setTxt('t-engine-sub', "(KIIX PRO)");
    setTxt('t-engine-cost', "1 Kredit / Render");
    setTxt('t-engine-total', "1 Kredit");
    if (dropWrap) dropWrap.style.display = 'block';
  }
  sinkronkanDropdownAkunGenerate();
}

// BANTUAN AMBIL KUNCI KOLAM SUPABASE
async function ambilKunciKolamTersedia(kecualiId) {
  if (typeof supa === 'undefined') return null;
  try {
    var q = supa
      .from('runninghub_pool')
      .select('*')
      .eq('status', 'idle')
      .gte('koin', 200)
      .order('koin', { ascending: false });
    
    if (kecualiId) {
      q = q.neq('id', kecualiId);
    }
    
    var { data, error } = await q.limit(1);
    if (!error && data && data.length > 0) {
      return data[0];
    }
  } catch (err) {}
  return null;
}

async function refreshSaldoAkunOtomatis(apiKey, poolId) {
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
      var k = rawData.totalCoins !== undefined ? rawData.totalCoins : rawData.coins !== undefined ? rawData.coins : rawData.coin !== undefined ? rawData.coin : rawData.credit !== undefined ? rawData.credit : rawData.balance !== undefined ? rawData.balance : rawData.remainCoins !== undefined ? rawData.remainCoins : undefined;
      
      if (k !== undefined && k !== null) {
        var koinNum = Number(k);
        
        // Update tabel pool di Supabase jika tugas berasal dari pool
        if (poolId && typeof supa !== 'undefined') {
          var statusBaru = koinNum < 200 ? 'habis' : 'idle';
          await supa.from('runninghub_pool').update({ koin: koinNum, status: statusBaru }).eq('id', poolId);
          if (typeof muatDataKolamAdmin === 'function') muatDataKolamAdmin();
        }

        // Sinkronkan akun lokal jika ada
        if (typeof akunRunningHub !== 'undefined') {
          var idxKetemu = akunRunningHub.findIndex(function(a) { return a.key === apiKey; });
          if (idxKetemu !== -1) {
            akunRunningHub[idxKetemu].koin = koinNum;
            if (typeof simpanStorage === 'function') simpanStorage();
            updateStatistikDashboard();
            sinkronkanDropdownAkunGenerate();
            if (typeof renderListAkunDiKelola === 'function') renderListAkunDiKelola();
          }
        }
      }
    }
  } catch (err) {}
}

async function manualRefreshAkunSatu(idx) {
  var targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo;
  var akun = targetAkun[idx];
  if (!akun) return;

  if (tabAkunAktif !== 'runninghub') {
    return tampilkanNotif('Saldo akun ini selalu stabil', 'info');
  }

  tampilkanNotif('Menyegarkan status koneksi...', 'info');
  try {
    var res = await fetch('/api/saldo', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ apiKey: akun.key })
    });
    var hasil = await res.json();
    if (res.ok && hasil) {
      var rawData = hasil.data || hasil;
      var k = rawData.totalCoins !== undefined ? rawData.totalCoins : rawData.coins !== undefined ? rawData.coins : rawData.coin !== undefined ? rawData.coin : rawData.credit !== undefined ? rawData.credit : rawData.balance !== undefined ? rawData.balance : rawData.remainCoins !== undefined ? rawData.remainCoins : undefined;
      
      if (k !== undefined && k !== null) {
        akun.koin = Number(k);
        if (typeof simpanStorage === 'function') simpanStorage();
        if (typeof renderListAkunDiKelola === 'function') renderListAkunDiKelola();
        sinkronkanDropdownAkunGenerate();
        updateStatistikDashboard();
        tampilkanNotif('✓ Status akun berhasil diperbarui', 'sukses');
      } else {
        tampilkanNotif('Gagal membaca status akun', 'error');
      }
    } else {
      tampilkanNotif('Gagal sinkronisasi antrean', 'error');
    }
  } catch (err) {
    tampilkanNotif('Koneksi terputus: ' + err.message, 'error');
  }
}

async function refreshSemuaAkunRunningHub() {
  if (tabAkunAktif !== 'runninghub') {
    return tampilkanNotif('Sync khusus koneksi utama', 'info');
  }

  if (!akunRunningHub || akunRunningHub.length === 0) {
    return tampilkanNotif('Belum ada koneksi akun yang terhubung', 'error');
  }

  var btn = document.getElementById('btn-sync-all-rh');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin text-sm"></i> Syncing...';
  }

  tampilkanNotif('Menyinkronkan seluruh koneksi antrean...', 'info');
  var suksesHitung = 0;

  var antreanSync = akunRunningHub.map(async function(akun) {
    try {
      var res = await fetch('/api/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: akun.key })
      });
      var hasil = await res.json();
      if (res.ok && hasil) {
        var rawData = hasil.data || hasil;
        var k = rawData.totalCoins !== undefined ? rawData.totalCoins : rawData.coins !== undefined ? rawData.coins : rawData.coin !== undefined ? rawData.coin : rawData.credit !== undefined ? rawData.credit : rawData.balance !== undefined ? rawData.balance : rawData.remainCoins !== undefined ? rawData.remainCoins : undefined;
        
        if (k !== undefined && k !== null) {
          akun.koin = Number(k);
          suksesHitung++;
        }
      }
    } catch (e) {}
  });

  await Promise.allSettled(antreanSync);

  if (typeof simpanStorage === 'function') simpanStorage();
  if (typeof renderListAkunDiKelola === 'function') renderListAkunDiKelola();
  if (typeof sinkronkanDropdownAkunGenerate === 'function') sinkronkanDropdownAkunGenerate();
  if (typeof updateStatistikDashboard === 'function') updateStatistikDashboard();

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-arrows-clockwise text-sm"></i> Sync Semua';
  }

  tampilkanNotif('✓ ' + suksesHitung + ' jalur koneksi berhasil disinkronkan!', 'sukses');
}

async function unggahBahanLangsung(input, tipe) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var txtEl = document.getElementById(tipe === 'foto' ? 'txt-file-foto' : 'txt-file-video');
  var stEl = document.getElementById(tipe === 'foto' ? 'st-file-foto' : 'st-file-video');

  // Ambil API key untuk upload (Prioritas: akun lokal, jika kosong ambil 1 key dari kolam)
  var keyUpload = null;
  var targetAkun = (engineProvider === 'roboneo') ? akunRoboneo : akunRunningHub;
  if (targetAkun && targetAkun.length > 0) {
    keyUpload = targetAkun[0].key;
  } else {
    var akunPool = await ambilKunciKolamTersedia();
    if (akunPool) keyUpload = akunPool.api_key;
  }

  if (!keyUpload) {
    input.value = "";
    return tampilkanNotif('Server antrean sedang penuh, silakan coba sesaat lagi.', 'error');
  }

  if (txtEl) txtEl.innerText = file.name;
  if (stEl) stEl.innerHTML = '<span class="text-amber-600 font-bold animate-pulse">⏳ Mengunggah: 0%</span>';

  var formData = new FormData();
  formData.append("file", file);
  formData.append("apiKey", keyUpload);
  formData.append("fileType", tipe === 'foto' ? 'image' : 'video');

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://www.runninghub.ai/task/openapi/upload");
  xhr.setRequestHeader("Authorization", "Bearer " + keyUpload);
  
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
        tampilkanNotif('File berhasil diunggah ke studio!', 'sukses');
      } else throw new Error("Gagal mengurai file");
    } catch (err) {
      if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Unggah</span>';
      tampilkanNotif('Gagal mengunggah media: Format tidak didukung', 'error');
    }
  };
  xhr.onerror = function() {
    if (stEl) stEl.innerHTML = '<span class="text-rose-600 font-bold">❌ Gagal Jaringan</span>';
    tampilkanNotif('Koneksi internet bermasalah saat mengunggah file', 'error');
  };
  xhr.send(formData);
}

function sinkronkanDropdownAkunGenerate() {
  var sel = document.getElementById('sel-dropdown-akun'), badge = document.getElementById('badge-total-saldo-gen');
  if (!sel) return;
  sel.innerHTML = '';
  
  var optAuto = document.createElement('option');
  optAuto.value = "pool_auto";
  optAuto.innerText = "⚡ Jalur Cepat KiixMotion Pool (Otomatis)";
  sel.appendChild(optAuto);

  if (badge) {
    badge.innerText = "Antrean Aktif";
    badge.className = "text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg";
  }
}

// ==========================================
// CCTV PEMANTAUAN (DENGAN REFUND OTOMATIS)
// ==========================================
function pantauTaskRunningHub(tugas, apiKey, poolId, userId, didDeductCredit) {
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
    if (tugas.cekCount > 360) {
        clearInterval(cekInterval);
        tugas.status = "❌ Gagal (Batas Waktu Proses Habis)"; 
        tugas.selesai = true;
        tugas.progress = 100;

        // Refund kredit jika tugas berasal dari kuota eceran
        if (didDeductCredit && typeof supa !== 'undefined') {
          await supa.rpc('refund_kredit_member', { target_user_id: userId });
          tampilkanNotif('Batas waktu habis. 1 kredit telah dikembalikan otomatis.', 'info');
        }

        // Lepas status akun di kolam
        if (poolId && typeof supa !== 'undefined') {
          await supa.from('runninghub_pool').update({ status: 'idle' }).eq('id', poolId);
        }

        if (typeof simpanStorage === 'function') simpanStorage();
        if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
        return;
    }

    try {
      var res = await fetch('/api/outputs', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ taskId: tugas.id, apiKey: apiKey })
      });
      
      var textRaw = await res.text(); 
      var parsedText = textRaw.replace(/\\/g, ''); 
      var cleanString = parsedText.toUpperCase(); 
      
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
          var match = parsedText.match(/https?:\/\/[^"'\s]+\.mp4/i);
          if (match) vidUrl = match[0];
      }

      if (vidUrl && typeof vidUrl === 'string') {
          clearInterval(cekInterval);
          tugas.status = "Selesai"; 
          tugas.selesai = true;
          tugas.progress = 100; 
          tugas.videoUrl = vidUrl.replace(/\\/g, '');
          if (typeof simpanStorage === 'function') simpanStorage();
          if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
          refreshSaldoAkunOtomatis(apiKey, poolId);
          tampilkanNotif('✓ Video berhasil selesai diproses!', 'sukses');
          return;
      }

      try {
          var jsonObj2 = JSON.parse(textRaw);
          var topCode = Number(jsonObj2.code || 0);
          var topMsg = (jsonObj2.msg || "").toString().toUpperCase();
          var dataObj2 = jsonObj2.data || jsonObj2;
          var statusLuar = (dataObj2.status || jsonObj2.status || "").toString().toUpperCase();
          var errorCode = (dataObj2.errorCode || jsonObj2.errorCode || "").toString();

          var taskStatusDalam = "";
          var usageArr = dataObj2.taskUsageList || jsonObj2.taskUsageList;
          if (usageArr && Array.isArray(usageArr) && usageArr.length > 0) {
              taskStatusDalam = (usageArr[0].taskStatus || usageArr[0].status || "").toString().toUpperCase();
          }

          var isRenderFailed = (
              topCode === 807 ||
              topMsg.includes("TASK_NOT_FOUND") ||
              statusLuar === "FAILED" || 
              statusLuar === "ERROR" || 
              statusLuar === "CANCELLED" || 
              taskStatusDalam === "FAILED" || 
              taskStatusDalam === "ERROR" ||
              (errorCode && errorCode !== "0" && errorCode !== "")
          );

          if (isRenderFailed) {
              clearInterval(cekInterval);
              tugas.status = "❌ Gagal Diproses Studio";
              tugas.selesai = true;
              tugas.progress = 100;

              // Refund jika bukan akun unlimited
              if (didDeductCredit && typeof supa !== 'undefined') {
                await supa.rpc('refund_kredit_member', { target_user_id: userId });
                tampilkanNotif('Gagal memproses video. 1 kredit telah dikembalikan otomatis.', 'error');
              } else {
                tampilkanNotif('Gagal memproses video di server. Silakan coba kembali.', 'error');
              }

              // Lepas status akun di kolam
              if (poolId && typeof supa !== 'undefined') {
                await supa.from('runninghub_pool').update({ status: 'idle' }).eq('id', poolId);
              }

              if (typeof simpanStorage === 'function') simpanStorage();
              if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
              refreshSaldoAkunOtomatis(apiKey, poolId);
              return;
          }
      } catch (jsonErr2) {}
      
      if (tugas.progress < 95) {
        tugas.progress += Math.floor(Math.random() * 3) + 2; 
      }
      tugas.status = "Sedang Memproses Video...";
      if (typeof simpanStorage === 'function') simpanStorage();
      if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();

    } catch (err) {}
  }, 10000); 
}

// ==========================================
// EKSEKUSI GENERATE: LOGIKA VIP + KREDIT 24 JAM + AUTO SWITCH KOLAM
// ==========================================
async function mulaiProsesGenerate() {
  var btn = document.getElementById('btn-submit-generate');
  
  var realEmail = null;
  var realUserId = null;

  if (typeof supa !== 'undefined') {
    if (btn) { btn.disabled = true; btn.innerText = "🔍 MEMERIKSA STATUS AKSES..."; }
    try {
      var sessionRes = await supa.auth.getSession();
      var sessionUser = sessionRes?.data?.session?.user;
      if (sessionUser && sessionUser.email) {
        realEmail = sessionUser.email;
        realUserId = sessionUser.id;
      }
    } catch (err) {}
  }

  if (!realEmail && typeof currentUserEmail !== 'undefined' && currentUserEmail) realEmail = currentUserEmail;
  if (!realEmail || !realUserId) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotif('Sesi login berakhir, silakan login ulang!', 'error');
  }

  // 1. CEK STATUS VIP PRO
  var isVipActive = false;
  if (typeof supa !== 'undefined') {
    try {
      var { data: profile } = await supa.from('users').select('is_vip, vip_expires_at').eq('email', realEmail).single();
      if (profile && profile.is_vip === true) {
        if (profile.vip_expires_at) {
          var expiredTime = new Date(profile.vip_expires_at).getTime();
          if (expiredTime > new Date().getTime()) isVipActive = true;
        } else {
          isVipActive = true; 
        }
      }
    } catch (e) { isVipActive = false; }
  }

  // 2. JIKA BUKAN VIP, CEK & POTONG KREDIT 24 JAM
  var didDeductCredit = false;
  if (!isVipActive) {
    if (typeof supa !== 'undefined') {
      try {
        var { data: potongRes, error: errPotong } = await supa.rpc('potong_kredit_member', { target_user_id: realUserId });
        if (errPotong || !potongRes || potongRes.success !== true) {
          var pesanGagal = potongRes?.pesan || "Anda memerlukan paket Pro atau Kredit Aktif untuk render.";
          tampilkanNotif(pesanGagal, 'error');
          if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
          if (typeof gantiLayarNav === 'function') gantiLayarNav('langganan');
          return;
        }
        didDeductCredit = true;
      } catch (errKredit) {
        if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
        return tampilkanNotif('Gagal memeriksa saldo kredit Anda.', 'error');
      }
    } else {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotif('Database tidak terhubung.', 'error');
    }
  }

  if (!urlBahanFoto || !urlBahanVideo) {
    // Refund jika gagal karena bahan belum siap
    if (didDeductCredit && typeof supa !== 'undefined') {
      await supa.rpc('refund_kredit_member', { target_user_id: realUserId });
    }
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotif('Foto karakter dan Video gerakan wajib selesai diunggah!', 'error');
  }

  // 3. AMBIL KUNCI API DARI KOLAM SUPABASE
  var akunTerpilih = await ambilKunciKolamTersedia();
  var isFromPool = true;

  // Fallback ke akun lokal jika kolam Supabase kosong (misal akun admin)
  if (!akunTerpilih && typeof akunRunningHub !== 'undefined' && akunRunningHub.length > 0) {
    akunTerpilih = { id: null, api_key: akunRunningHub[0].key, koin: akunRunningHub[0].koin };
    isFromPool = false;
  }

  if (!akunTerpilih) {
    if (didDeductCredit && typeof supa !== 'undefined') {
      await supa.rpc('refund_kredit_member', { target_user_id: realUserId });
    }
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotif('Antrean render KiixMotion sedang penuh. Silakan coba beberapa saat lagi.', 'error');
  }

  if (btn) { btn.disabled = true; btn.innerText = "⚡ MEMPROSES VIDEO..."; }

  // Tandai akun kolam menjadi BUSY
  if (isFromPool && akunTerpilih.id && typeof supa !== 'undefined') {
    await supa.from('runninghub_pool').update({ status: 'busy', last_used_at: new Date() }).eq('id', akunTerpilih.id);
  }

  var nodeParams = [
    { nodeId: "30", fieldName: "image", fieldValue: urlBahanFoto },
    { nodeId: "33", fieldName: "video", fieldValue: urlBahanVideo },
    { nodeId: "308", fieldName: "upscale_method", fieldValue: "bicubic" }
  ];

  var taskIdAsli = null;
  var apiKeyDipakai = akunTerpilih.api_key;
  var poolIdDipakai = akunTerpilih.id;

  try {
    var res = await fetch('https://www.runninghub.ai/task/openapi/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKeyDipakai },
      body: JSON.stringify({ workflowId: RUNNINGHUB_WORKFLOW_ID, apiKey: apiKeyDipakai, nodeInfoList: nodeParams })
    });
    
    var textRes = await res.text();
    var data;
    try { data = textRes ? JSON.parse(textRes) : null; } catch(err) { throw new Error("Format server rusak."); }

    // DETEKSI AUTO-SWITCH: KOIN PADA KUNCI INI KURANG (ERROR 806)
    var isKoinKurang = (
      data && (
        data.code === 806 || 
        (data.msg && data.msg.toLowerCase().includes('coin')) ||
        (data.msg && data.msg.toLowerCase().includes('balance'))
      )
    );

    if (isKoinKurang && isFromPool) {
      console.warn("Kunci kolam kehabisan koin. Menandai habis dan mencari cadangan...");
      await supa.from('runninghub_pool').update({ status: 'habis' }).eq('id', poolIdDipakai);

      // Cari akun cadangan berikutnya dari kolam
      var akunCadangan = await ambilKunciKolamTersedia(poolIdDipakai);
      if (akunCadangan) {
        apiKeyDipakai = akunCadangan.api_key;
        poolIdDipakai = akunCadangan.id;
        await supa.from('runninghub_pool').update({ status: 'busy', last_used_at: new Date() }).eq('id', poolIdDipakai);

        // Kirim ulang tugas dengan kunci cadangan
        var resRetry = await fetch('https://www.runninghub.ai/task/openapi/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKeyDipakai },
          body: JSON.stringify({ workflowId: RUNNINGHUB_WORKFLOW_ID, apiKey: apiKeyDipakai, nodeInfoList: nodeParams })
        });
        var textRetry = await resRetry.text();
        data = textRetry ? JSON.parse(textRetry) : null;
      }
    }

    if (data && (data.code === 0 || data.data) && (data.data?.taskId || data.taskId)) { 
      taskIdAsli = data.data?.taskId || data.taskId; 
      tampilkanNotif('Tugas berhasil masuk antrean KiixMotion! ID: ' + taskIdAsli, 'sukses');
    } else { 
      throw new Error(data ? (data.msg || "Server sedang padat") : "Respon server kosong");
    }

  } catch (e) {
    // Kembalikan akun ke status idle jika gagal
    if (isFromPool && poolIdDipakai && typeof supa !== 'undefined') {
      await supa.from('runninghub_pool').update({ status: 'idle' }).eq('id', poolIdDipakai);
    }
    // Refund kredit member jika terjadi error awal
    if (didDeductCredit && typeof supa !== 'undefined') {
      await supa.rpc('refund_kredit_member', { target_user_id: realUserId });
      tampilkanNotif('Gagal memproses video. 1 kredit telah dikembalikan otomatis.', 'error');
    } else {
      tampilkanNotif('Antrean render KiixMotion sedang padat. Silakan coba beberapa saat lagi.', 'error');
    }
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return;
  }

  var tugasBaru = {
    id: taskIdAsli || ("KM-" + Date.now().toString().slice(-6)),
    key: apiKeyDipakai, 
    pool_id: poolIdDipakai,
    user_id: realUserId,
    did_deduct: didDeductCredit,
    model: "Wan Motion Control", 
    provider: "KiixMotion Studio",
    engine: "Wan Motion Control 1080HD",
    prov: "KiixMotion",
    tgl: "Baru saja", 
    biaya: didDeductCredit ? "1 Kredit" : "VIP Pro", 
    videoUrl: null,
    status: "Sedang Memproses Video...", 
    selesai: false, 
    progress: 0
  };
  
  if (typeof riwayatGenerateList !== 'undefined') {
    riwayatGenerateList.unshift(tugasBaru); 
    if (typeof simpanStorage === 'function') simpanStorage(); 
    if (typeof gantiLayarNav === 'function') gantiLayarNav('history');
  }
  
  if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  
  if (taskIdAsli) {
    pantauTaskRunningHub(tugasBaru, apiKeyDipakai, poolIdDipakai, realUserId, didDeductCredit);
  }
}

// ==========================================
// RENDER LAYAR HISTORY & KELOLA AKUN
// ==========================================
function renderLayarHistory() {
  var wadah = document.getElementById('wadah-list-history'), counter = document.getElementById('txt-counter-history');
  if (!wadah) return; wadah.innerHTML = '';
  if (counter && typeof riwayatGenerateList !== 'undefined') counter.innerText = riwayatGenerateList.length + " tugas";
  
  if (typeof riwayatGenerateList === 'undefined' || riwayatGenerateList.length === 0) {
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
      var textPesanError = itm.status || "❌ Gagal Diproses";
      statusBadge = '<span class="text-[10px] sm:text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold max-w-[200px] truncate" title="' + textPesanError + '">' + textPesanError + '</span>';
    } else if (isDone) {
      if (hasVideo) {
        statusBadge = '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Selesai Dirender</span>' +
          '<button type="button" onclick="window.open(\'' + itm.videoUrl + '\', \'_blank\')" class="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer">Putar</button>' +
          '<a href="' + itm.videoUrl + '" target="_blank" download="kiixmotion-' + itm.id + '.mp4" class="px-4 py-2 text-xs font-bold bg-kmViolet text-white rounded-xl hover:bg-kmVioletHover transition violet-glow">Download</a>';
      } else {
        statusBadge = '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">✓ Selesai Dirender</span>';
      }
    } else {
      statusBadge = '<span class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold animate-pulse">⏳ Memproses: ' + currentProg + '%</span>';
    }

    card.innerHTML = '<div class="flex items-center gap-4">' +
      '<div class="w-12 h-12 rounded-2xl ' + (isFailed ? 'bg-rose-50 text-rose-600' : 'bg-kmVioletLight text-kmViolet') + ' flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">' + (isFailed ? '✕' : (isDone ? '▶' : '⏳')) + '</div>' +
      '<div class="min-w-0">' +
        '<div class="flex items-center gap-2 flex-wrap"><span class="text-base font-bold text-kmTextPrimary truncate">' + itm.model + '</span><span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold border border-slate-200">' + (itm.prov || "KiixMotion") + '</span></div>' +
        '<div class="text-[11px] sm:text-sm text-kmTextSecondary mt-1">ID: <span class="text-kmViolet font-mono font-bold">' + itm.id + '</span> • ' + itm.tgl + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">' + 
      statusBadge + 
      '<button type="button" onclick="hapusRiwayatSatu(' + index + ')" class="px-3 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer border border-rose-200" title="Hapus Riwayat">Hapus</button>' +
    '</div>';
    
    wadah.appendChild(card);
  });
}

function hapusRiwayatSatu(idx) {
  mintaKonfirmasi("Yakin ingin menghapus riwayat tugas ini?", function() {
    var tgs = riwayatGenerateList[idx];
    if (tgs && tgs.intervalObj) clearInterval(tgs.intervalObj);
    riwayatGenerateList.splice(idx, 1);
    if (typeof simpanStorage === 'function') simpanStorage();
    renderLayarHistory();
    tampilkanNotif('Riwayat tugas berhasil dihapus', 'sukses');
  });
}

function bersihkanSemuaHistory() {
  if (typeof riwayatGenerateList === 'undefined' || riwayatGenerateList.length === 0) return tampilkanNotif('History sudah kosong.', 'info');
  mintaKonfirmasi('Hapus seluruh riwayat generate?', function() {
    riwayatGenerateList.forEach(function(t) { if (t.intervalObj) clearInterval(t.intervalObj); });
    riwayatGenerateList = []; 
    if (typeof simpanStorage === 'function') simpanStorage(); 
    renderLayarHistory(); 
    tampilkanNotif('History berhasil dibersihkan', 'sukses');
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
  if (!wadah) return; 
  wadah.innerHTML = '';
  var totalKredit = 0;

  if (!targetAkun || targetAkun.length === 0) {
    wadah.innerHTML = '<div class="p-10 text-center text-slate-400 text-sm border-2 border-dashed border-kmBorder rounded-3xl bg-white modern-shadow">Belum ada akun terhubung. Tambah kunci antrean lewat Master Pool API.</div>';
    var setTxt0 = function(id, v) { var el = document.getElementById(id); if (el) el.innerText = v; };
    setTxt0('txt-stat-aktif', 0); setTxt0('txt-stat-akun', 0); setTxt0('txt-stat-kredit', 0);
    return;
  }

  var toolbarEl = document.createElement('div');
  toolbarEl.className = "flex items-center justify-between px-1 pb-1 pt-1";
  toolbarEl.innerHTML = '<span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar API Key (' + targetAkun.length + ')</span>' +
    ((tabAkunAktif === 'runninghub') ? 
      '<button id="btn-sync-all-rh" type="button" onclick="refreshSemuaAkunRunningHub()" class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-kmViolet border border-kmBorder rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5">' +
        '<i class="ph ph-arrows-clockwise text-sm"></i> Sync Semua' +
      '</button>' : '');
  wadah.appendChild(toolbarEl);

  targetAkun.forEach(function(a, i) {
    var koinVal = Number(a.koin) || 0; totalKredit += koinVal;
    var el = document.createElement('div');
    el.className = "bg-white border border-kmBorder p-4 sm:p-5 rounded-2xl flex items-center justify-between modern-shadow";
    
    var refreshBtnHtml = (tabAkunAktif === 'runninghub') ? 
      '<button type="button" onclick="manualRefreshAkunSatu(' + i + ')" class="p-2 text-slate-400 hover:text-kmViolet bg-slate-50 hover:bg-violet-50 rounded-xl transition cursor-pointer border border-slate-200" title="Refresh Saldo">' +
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>' +
      '</button>' : '';

    el.innerHTML = '<div class="flex items-center gap-3.5"><input type="checkbox" data-idx="' + i + '" class="chk-seleksi-akun ' + (isModePilih ? '' : 'hidden') + ' w-5 h-5 rounded-lg accent-kmViolet cursor-pointer" /><span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-100"></span><span class="text-xs sm:text-sm font-bold text-kmTextPrimary font-mono break-all w-28 sm:w-56 truncate" title="' + a.key + '">' + a.nama + '</span></div>' +
    '<div class="flex items-center gap-2 sm:gap-3">' +
      '<span class="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">Aktif</span>' +
      '<span class="text-sm sm:text-base font-black text-kmViolet font-mono bg-violet-50 px-3 py-1 rounded-xl">' + koinVal + (tabAkunAktif === 'roboneo' ? ' carrots' : ' coin') + '</span>' +
      refreshBtnHtml +
      '<button type="button" onclick="hapusAkunSatu(' + i + ')" class="text-rose-500 hover:text-rose-700 text-xs font-bold font-sans px-2 py-1">Hapus</button>' +
    '</div>';
    wadah.appendChild(el);
  });

  var setTxt = function(id, v) { var el = document.getElementById(id); if (el) el.innerText = v; };
  setTxt('txt-stat-aktif', targetAkun.length); setTxt('txt-stat-akun', targetAkun.length); setTxt('txt-stat-kredit', totalKredit);
}

function hapusAkunSatu(idx) {
  var targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo;
  mintaKonfirmasi("Yakin ingin menghapus akun ini?", function() {
    targetAkun.splice(idx, 1); 
    if (typeof simpanStorage === 'function') simpanStorage(); 
    renderListAkunDiKelola(); 
    sinkronkanDropdownAkunGenerate(); 
    tampilkanNotif('Akun berhasil dihapus', 'sukses');
  });
}

function eksekusiHapusAkun() {
  var checkedBoxes = document.querySelectorAll('.chk-seleksi-akun:checked');
  if (checkedBoxes.length === 0) return tampilkanNotif('Pilih minimal satu akun!', 'error');
  mintaKonfirmasi('Hapus ' + checkedBoxes.length + ' akun terpilih?', function() {
    var targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo, toDel = [];
    checkedBoxes.forEach(function(c) { toDel.push(parseInt(c.getAttribute('data-idx'), 10)); });
    toDel.sort(function(a, b) { return b - a; }).forEach(function(idx) { targetAkun.splice(idx, 1); });
    if (typeof simpanStorage === 'function') simpanStorage(); 
    toggleModePilihHapus(); 
    renderListAkunDiKelola(); 
    sinkronkanDropdownAkunGenerate(); 
    tampilkanNotif('Akun terpilih berhasil dihapus', 'sukses');
  });
}

async function simpanAkunBaruDariModal() {
  var inKey = document.getElementById('in-modal-key'), valKey = inKey ? inKey.value.trim() : "";
  if (!valKey) return tampilkanNotif('Masukkan API Key terlebih dahulu!', 'error');
  var targetAkun = (tabAkunAktif === 'runninghub') ? akunRunningHub : akunRoboneo;
  var btnSimpan = document.getElementById('btn-simpan-key');
  if (btnSimpan) { btnSimpan.innerText = 'Menyinkronkan...'; btnSimpan.disabled = true; }
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
        if (btnSimpan) { btnSimpan.innerText = 'Tambah'; btnSimpan.disabled = false; }
        return tampilkanNotif('API Key tidak valid atau ditolak sistem', 'error');
      }
    } catch (err) {
      if (btnSimpan) { btnSimpan.innerText = 'Tambah'; btnSimpan.disabled = false; }
      return tampilkanNotif('Gagal terhubung ke verifikasi server', 'error');
    }
  } else { saldoDidapat = 4; }

  if (btnSimpan) { btnSimpan.innerText = 'Tambah'; btnSimpan.disabled = false; }
  
  var indexKetemu = targetAkun.findIndex(function(a) { return a.key === valKey; });
  if (indexKetemu !== -1) {
    targetAkun[indexKetemu].koin = Number(saldoDidapat); tampilkanNotif('✓ Jalur akun berhasil disinkronkan!', 'sukses');
  } else {
    targetAkun.push({ nama: valKey, key: valKey, koin: Number(saldoDidapat) }); tampilkanNotif('✓ Jalur akun baru berhasil ditambahkan!', 'sukses');
  }
  if (typeof simpanStorage === 'function') simpanStorage(); 
  tutupModalFormKey(); 
  renderListAkunDiKelola(); 
  sinkronkanDropdownAkunGenerate();
}

window.onload = function() {
  if (typeof muatStorage === 'function') muatStorage();
  setProviderUtama('runninghub');
  if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();

  if (typeof riwayatGenerateList !== 'undefined' && riwayatGenerateList.length > 0) {
    riwayatGenerateList.forEach(function(tugas) {
      if (!tugas.selesai && tugas.id && tugas.key) {
        pantauTaskRunningHub(tugas, tugas.key, tugas.pool_id, tugas.user_id, tugas.did_deduct);
      }
    });
  }
  if (typeof renderLayarHistory === 'function') renderLayarHistory();
};
