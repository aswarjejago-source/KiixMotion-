// ==========================================
// PILAR 3: API ENGINE & RENDER LOGIC
// File: js/api-engine.js
// ==========================================

var engineProvider = 'kiix'; 
var RUNNINGHUB_WORKFLOW_ID = "2099509417535340546"; 
var urlBahanFoto = null;
var urlBahanVideo = null;

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

function setProviderUtama(p) {
  engineProvider = p;
  var provs = ['kiix', 'runninghub'];
  
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

  var tTitle = document.getElementById('t-engine-title');
  var tTotal = document.getElementById('t-engine-total');
  var dropWrap = document.getElementById('box-wrap-dropdown-akun');
  var sel = document.getElementById('sel-dropdown-akun');
  var badgeSaldo = document.getElementById('badge-total-saldo-gen');

  if (p === 'kiix') {
    if (tTitle) tTitle.innerText = "WAN MOTION CONTROL 1080HD";
    if (tTotal) tTotal.innerText = "1 Kredit";
    if (dropWrap) dropWrap.style.display = 'none';

  } else if (p === 'runninghub') {
    if (tTitle) tTitle.innerText = "WAN MOTION CONTROL 1080HD";
    if (tTotal) tTotal.innerText = "≈ 478 coin";
    if (dropWrap) dropWrap.style.display = 'block';

    if (sel && typeof akunRunningHub !== 'undefined') {
      sel.innerHTML = '';
      if (akunRunningHub.length === 0) {
        sel.innerHTML = '<option value="">Belum ada akun (Wajib Add Apikey)</option>';
        if (badgeSaldo) {
          badgeSaldo.innerText = "0 coin";
          badgeSaldo.className = "text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg";
        }
      } else {
        var total = 0;
        sel.innerHTML = '<option value="random">🎲 Otomatis (Pilih Acak Akun)</option>';
        akunRunningHub.forEach(function(a, idx) {
          var k = Number(a.koin) || 0;
          total += k;
          sel.innerHTML += '<option value="' + idx + '">Akun #' + (idx + 1) + ': ' + a.key.substring(0, 8) + '... (' + k + ' coin)</option>';
        });
        if (badgeSaldo) {
          badgeSaldo.innerText = total + " coin";
          badgeSaldo.className = "text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg";
        }
      }
    }
  }
}

// AMBIL KUNCI DARI KOLAM ADMIN (PATOKAN MURNI: MINIMAL 200 KOIN)
async function ambilKunciKolamTersedia(kecualiIds) {
  if (typeof supa === 'undefined') return null;
  try {
    var q = supa
      .from('runninghub_pool')
      .select('*')
      .eq('status', 'idle')
      .gte('koin', 200) // PATOKAN MUTLAK 200 KOIN
      .order('koin', { ascending: false });
    
    if (Array.isArray(kecualiIds) && kecualiIds.length > 0) {
      q = q.not('id', 'in', '(' + kecualiIds.join(',') + ')');
    } else if (kecualiIds && typeof kecualiIds === 'number') {
      q = q.neq('id', kecualiIds);
    }
    
    var { data, error } = await q.limit(1);
    if (!error && data && data.length > 0) return data[0];
  } catch (err) {
    console.error('Gagal mengambil kunci kolam:', err);
  }
  return null;
}

async function unggahBahanLangsung(input, tipe) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var txtEl = document.getElementById(tipe === 'foto' ? 'txt-file-foto' : 'txt-file-video');
  var stEl = document.getElementById(tipe === 'foto' ? 'st-file-foto' : 'st-file-video');

  var keyUpload = null;
  if (engineProvider === 'runninghub' && typeof akunRunningHub !== 'undefined' && akunRunningHub.length > 0) {
    keyUpload = akunRunningHub[0].key;
  } else {
    var akunPool = await ambilKunciKolamTersedia();
    if (!akunPool && typeof supa !== 'undefined') {
      var { data: anyKey } = await supa.from('runninghub_pool').select('api_key').limit(1);
      if (anyKey && anyKey.length > 0) akunPool = anyKey[0];
    }
    if (akunPool) keyUpload = akunPool.api_key;
  }

  if (!keyUpload) {
    input.value = "";
    return tampilkanNotif('Antrean server upload sedang padat, coba beberapa saat lagi.', 'error');
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
    tampilkanNotif('Koneksi internet bermasalah pas unggah file', 'error');
  };
  xhr.send(formData);
}

function pantauTaskRunningHub(tugas, apiKey, poolId, userId, didDeductCredit) {
  if (tugas.selesai) return; 
  if (!tugas.progress) tugas.progress = 0; 
  if (!tugas.startedAt) tugas.startedAt = Date.now();

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  var cekInterval = setInterval(async function() {
    tugas.intervalObj = cekInterval;

    if (tugas.selesai) {
      clearInterval(cekInterval);
      return;
    }

    var waktuBerjalan = Date.now() - tugas.startedAt;
    
    // TIMEOUT 1 JAM WAKTU NYATA
    if (waktuBerjalan >= 3600000) {
      clearInterval(cekInterval);
      tugas.status = "❌ Gagal (Batas Waktu Proses 1 Jam Habis)"; 
      tugas.selesai = true;
      tugas.progress = 100;

      var targetUser = userId || tugas.user_id;
      if (didDeductCredit && !tugas.refunded && typeof supa !== 'undefined' && targetUser) {
        tugas.refunded = true;
        tugas.did_deduct = false;
        await supa.rpc('refund_kredit_member', { target_user_id: String(targetUser) });
        if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(tugas.user_email);
        tampilkanNotif('Batas waktu 1 jam habis. 1 kredit dikembalikan otomatis.', 'info');
      }

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
      
      if (!res.ok) return; 

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
        
        if (poolId && typeof supa !== 'undefined') {
          await supa.from('runninghub_pool').update({ status: 'idle' }).eq('id', poolId);
        }

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

          var targetUserErr = userId || tugas.user_id;
          if (didDeductCredit && !tugas.refunded && typeof supa !== 'undefined' && targetUserErr) {
            tugas.refunded = true;
            tugas.did_deduct = false;
            await supa.rpc('refund_kredit_member', { target_user_id: String(targetUserErr) });
            if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(tugas.user_email);
            tampilkanNotif('Gagal memproses video dari server. 1 kredit dikembalikan otomatis.', 'error');
          } else {
            tampilkanNotif('Gagal memproses video di server. Silakan coba lagi.', 'error');
          }

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

// REFRESH SALDO KOIN OTOMATIS (PATOKAN 200 KOIN)
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
        if (poolId && typeof supa !== 'undefined') {
          // PATOKAN 200: HANYA dicap habis jika di bawah 200 koin!
          var statusBaru = koinNum < 200 ? 'habis' : 'idle';
          await supa.from('runninghub_pool').update({ koin: koinNum, status: statusBaru }).eq('id', poolId);
          if (typeof muatDataKolamAdmin === 'function') muatDataKolamAdmin();
        }
        if (typeof akunRunningHub !== 'undefined') {
          var idxKetemu = akunRunningHub.findIndex(function(a) { return a.key === apiKey; });
          if (idxKetemu !== -1) {
            akunRunningHub[idxKetemu].koin = koinNum;
            if (typeof simpanStorage === 'function') simpanStorage();
            updateStatistikDashboard();
            if (typeof renderListAkunDiKelola === 'function') renderListAkunDiKelola();
          }
        }
      }
    }
  } catch (err) {}
}

function updateStatistikDashboard() {
  var totalRhKoin = 0, maxRhKoin = 0;
  if (typeof akunRunningHub !== 'undefined') {
    akunRunningHub.forEach(function(a) {
      var k = Number(a.koin) || 0;
      totalRhKoin += k;
      if (k > maxRhKoin) maxRhKoin = k;
    });
  }
  var setTxt = function(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  setTxt('dash-rh-total-koin', totalRhKoin);
  setTxt('dash-rh-total-akun', typeof akunRunningHub !== 'undefined' ? akunRunningHub.length : 0);
  setTxt('dash-rh-max-koin', maxRhKoin);
  if (typeof riwayatGenerateList !== 'undefined') {
    setTxt('dash-stat-video-selesai', riwayatGenerateList.filter(function(r) { return r.selesai; }).length);
  }
}

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
        realEmail = sessionUser.email.toLowerCase().trim();
      }
      
      if (realEmail) {
        var { data: dbUser } = await supa
          .from('users')
          .select('id, is_vip, vip_expires_at')
          .ilike('email', realEmail)
          .maybeSingle();
        if (dbUser) realUserId = dbUser.id;
      }
    } catch (err) {}
  }

  if (!realEmail && typeof currentUserEmail !== 'undefined' && currentUserEmail) realEmail = currentUserEmail;
  if (!realEmail || !realUserId) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotif('Sesi login berakhir, silakan login ulang!', 'error');
  }

  if (!urlBahanFoto || !urlBahanVideo) {
    if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
    return tampilkanNotif('Foto karakter dan Video gerakan wajib selesai diunggah!', 'error');
  }

  var apiKeyDipakai = null;
  var poolIdDipakai = null;
  var didDeductCredit = false;

  // =====================================================================
  // JALUR 1: RUNNINGHUB PRO (MEMBER PRO DIKUNCI MINIMAL 478 KOIN PRIBADI)
  // =====================================================================
  if (engineProvider === 'runninghub') {
    var isVipActive = false;
    if (typeof supa !== 'undefined') {
      try {
        var { data: profile } = await supa.from('users').select('is_vip, vip_expires_at').eq('id', realUserId).maybeSingle();
        if (profile && profile.is_vip === true) {
          if (!profile.vip_expires_at || new Date(profile.vip_expires_at).getTime() > new Date().getTime()) {
            isVipActive = true; 
          }
        }
      } catch (e) { isVipActive = false; }
    }

    if (!isVipActive) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      tampilkanNotif('Engine RunningHub khusus Member Pro! Untuk terima beres, gunakan KiixMotion Control.', 'error');
      if (typeof gantiLayarNav === 'function') gantiLayarNav('langganan');
      return;
    }

    if (!akunRunningHub || akunRunningHub.length === 0) {
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotif('Hubungkan akun RunningHub kamu di menu Add Apikey!', 'error');
    }

    var sel = document.getElementById('sel-dropdown-akun');
    var idx = sel ? sel.value : "";
    var akunPribadi = (idx === "random" || idx === "") ? akunRunningHub[0] : akunRunningHub[parseInt(idx, 10)];

    // PENCEGATAN KHUSUS MEMBER PRO (WAJIB MINIMAL 478 KOIN)
    if (realEmail !== 'anggraingki@gmail.com') {
      var koinAkunPribadi = Number(akunPribadi.koin) || 0;
      if (koinAkunPribadi < 478) {
        if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
        return tampilkanNotif('Koin akun RunningHub kamu kurang! Minimal butuh 478 koin untuk render video.', 'error');
      }
    }

    apiKeyDipakai = akunPribadi.key;
    poolIdDipakai = null;

  } else {
    // =====================================================================
    // JALUR 2: KIIXMOTION CONTROL (PENGGUNA KREDIT BEBAS DARI BATASAN 478 KOIN)
    // =====================================================================
    if (typeof supa !== 'undefined') {
      try {
        var { data: userCredit } = await supa
          .from('user_credits')
          .select('credits_balance, expires_at')
          .eq('user_id', realUserId)
          .maybeSingle();

        if (!userCredit || userCredit.credits_balance <= 0) {
          tampilkanNotif('Sisa kredit Anda sudah habis. Silakan beli paket di Beli Kredit.', 'error');
          if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
          if (typeof gantiLayarNav === 'function') gantiLayarNav('beli-kredit');
          return;
        }

        if (new Date(userCredit.expires_at).getTime() <= Date.now()) {
          tampilkanNotif('Paket kredit Anda sudah kedaluwarsa (lewat 24 jam). Silakan beli kuota baru.', 'error');
          if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
          if (typeof gantiLayarNav === 'function') gantiLayarNav('beli-kredit');
          return;
        }

        var { data: potongRes, error: errPotong } = await supa.rpc('potong_kredit_member', { target_user_id: String(realUserId) });
        if (errPotong || !potongRes || potongRes.success !== true) {
          var pesanGagal = potongRes?.pesan || "Gagal memotong saldo kredit.";
          tampilkanNotif(pesanGagal, 'error');
          if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
          return;
        }

        didDeductCredit = true;
        if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(realEmail);
      } catch (errKredit) {
        if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
        return tampilkanNotif('Gagal memeriksa saldo kredit kamu.', 'error');
      }
    }

    // Ambil kunci pertama di database kolam yang idle & koin >= 200
    var akunPool = await ambilKunciKolamTersedia();
    if (!akunPool) {
      if (didDeductCredit && typeof supa !== 'undefined') {
        await supa.rpc('refund_kredit_member', { target_user_id: String(realUserId) });
        if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(realEmail);
      }
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return tampilkanNotif('Semua server KiixMotion sedang sibuk. 1 kredit dikembalikan otomatis.', 'error');
    }

    apiKeyDipakai = akunPool.api_key;
    poolIdDipakai = akunPool.id;

    if (typeof supa !== 'undefined') {
      await supa.from('runninghub_pool').update({ status: 'busy', last_used_at: new Date() }).eq('id', poolIdDipakai);
    }
  }

  if (btn) { btn.disabled = true; btn.innerText = "⚡ MEMPROSES VIDEO..."; }

  var nodeParams = [
    { nodeId: "30", fieldName: "image", fieldValue: urlBahanFoto },
    { nodeId: "33", fieldName: "video", fieldValue: urlBahanVideo },
    { nodeId: "308", fieldName: "upscale_method", fieldValue: "bicubic" }
  ];

  var taskIdAsli = null;
  var poolTercoba = poolIdDipakai ? [poolIdDipakai] : [];
  var suksesKirim = false;

  // =====================================================================
  // AUTO-POLLING / AUTO-ROTASI KUNCI JIKA KOIN KURANG
  // (KUNCI YANG KURANG TIDAK BOLEH DIUBAH MENJADI 'HABIS' DI DATABASE!)
  // =====================================================================
  while (!suksesKirim) {
    try {
      var res = await fetch('https://www.runninghub.ai/task/openapi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKeyDipakai },
        body: JSON.stringify({ workflowId: RUNNINGHUB_WORKFLOW_ID, apiKey: apiKeyDipakai, nodeInfoList: nodeParams })
      });
      
      var textRes = await res.text();
      var data;
      try { data = textRes ? JSON.parse(textRes) : null; } catch(err) { throw new Error("Format server rusak."); }

      var isKoinKurang = (
        data && (
          data.code === 806 || 
          (data.msg && data.msg.toLowerCase().includes('coin')) ||
          (data.msg && data.msg.toLowerCase().includes('balance'))
        )
      );

      // JIKA KOIN KURANG: STATUS DI DATABASE TETAP 'IDLE', CUKUP ROTASI NYARI KUNCI LAIN!
      if (isKoinKurang && poolIdDipakai) {
        console.warn(`Kunci #${poolIdDipakai} koinnya kurang saat render. Kembalikan ke 'idle' & switch cari kunci cadangan...`);
        // TETAPKAN STATUS 'IDLE' DI DATABASE KARENA KOIN MASIH >= 200
        await supa.from('runninghub_pool').update({ status: 'idle' }).eq('id', poolIdDipakai);

        var akunCadangan = await ambilKunciKolamTersedia(poolTercoba);
        if (akunCadangan) {
          apiKeyDipakai = akunCadangan.api_key;
          poolIdDipakai = akunCadangan.id;
          poolTercoba.push(akunCadangan.id);
          await supa.from('runninghub_pool').update({ status: 'busy', last_used_at: new Date() }).eq('id', poolIdDipakai);
          continue; 
        } else {
          throw new Error("Semua kunci cadangan server sedang tidak mencukupi koin.");
        }
      }

      if (data && (data.code === 0 || data.data) && (data.data?.taskId || data.taskId)) { 
        taskIdAsli = data.data?.taskId || data.taskId; 
        suksesKirim = true;
      } else { 
        throw new Error(data ? (data.msg || "Server sedang padat") : "Respon server kosong");
      }

    } catch (e) {
      if (poolIdDipakai && typeof supa !== 'undefined') {
        await supa.from('runninghub_pool').update({ status: 'idle' }).eq('id', poolIdDipakai);
      }
      if (didDeductCredit && typeof supa !== 'undefined') {
        await supa.rpc('refund_kredit_member', { target_user_id: String(realUserId) });
        if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI(realEmail);
        tampilkanNotif('Antrean/koin server sedang tidak tersedia. 1 kredit dikembalikan otomatis.', 'error');
      } else {
        tampilkanNotif(e.message || 'Gagal memproses render ke server.', 'error');
      }
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
      return;
    }
  }

  var tugasBaru = {
    id: taskIdAsli || ("KM-" + Date.now().toString().slice(-6)),
    key: apiKeyDipakai, 
    pool_id: poolIdDipakai,
    user_id: realUserId,
    user_email: realEmail,
    did_deduct: didDeductCredit,
    refunded: false,
    startedAt: Date.now(),
    model: "Wan Motion Control", 
    provider: (engineProvider === 'runninghub') ? "RunningHub Pro" : "KiixMotion Control",
    engine: "Wan Motion Control 1080HD",
    prov: (engineProvider === 'runninghub') ? "RunningHub" : "KiixMotion",
    tgl: "Baru saja", 
    biaya: didDeductCredit ? "1 Kredit" : "≈ 478 coin", 
    videoUrl: null,
    status: "Sedang Memproses Video...", 
    selesai: false, 
    progress: 0
  };
  
  if (typeof riwayatGenerateList !== 'undefined') {
    riwayatGenerateList.unshift(tugasBaru); 
    if (typeof simpanStorage === 'function') simpanStorage(); 
  }
  
  if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  
  resetFormBahanInput();
  tampilkanModalCeklisSukses(tugasBaru.id);

  if (taskIdAsli) {
    pantauTaskRunningHub(tugasBaru, apiKeyDipakai, poolIdDipakai, realUserId, didDeductCredit);
  }
}

function renderListAkunDiKelola() {
  var wadah = document.getElementById('wadah-kartu-akun-list'), targetAkun = akunRunningHub;
  if (!wadah) return; 
  wadah.innerHTML = '';
  var totalKredit = 0;

  if (!targetAkun || targetAkun.length === 0) {
    wadah.innerHTML = '<div class="p-10 text-center text-slate-400 text-sm border-2 border-dashed border-kmBorder rounded-3xl bg-white modern-shadow">Belum ada akun terhubung. Klik "+ Add Apikey" di atas.</div>';
    return;
  }

  var toolbarEl = document.createElement('div');
  toolbarEl.className = "flex items-center justify-between px-1 pb-1 pt-1";
  toolbarEl.innerHTML = '<span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar API Key (' + targetAkun.length + ')</span>' +
    '<button id="btn-sync-all-rh" type="button" onclick="refreshSemuaAkunRunningHub()" class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-kmViolet border border-kmBorder rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5">' +
      '<i class="ph ph-arrows-clockwise text-sm"></i> Sync Semua' +
    '</button>';
  wadah.appendChild(toolbarEl);

  targetAkun.forEach(function(a, i) {
    var koinVal = Number(a.koin) || 0; totalKredit += koinVal;
    var el = document.createElement('div');
    el.className = "bg-white border border-kmBorder p-4 sm:p-5 rounded-2xl flex items-center justify-between modern-shadow";
    
    var refreshBtnHtml = '<button type="button" onclick="manualRefreshAkunSatu(' + i + ')" class="p-2 text-slate-400 hover:text-kmViolet bg-slate-50 hover:bg-violet-50 rounded-xl transition cursor-pointer border border-slate-200" title="Refresh Saldo">' +
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>' +
      '</button>';

    el.innerHTML = '<div class="flex items-center gap-3.5"><input type="checkbox" data-idx="' + i + '" class="chk-seleksi-akun ' + (isModePilih ? '' : 'hidden') + ' w-5 h-5 rounded-lg accent-kmViolet cursor-pointer" /><span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-100"></span><span class="text-xs sm:text-sm font-bold text-kmTextPrimary font-mono break-all w-28 sm:w-56 truncate" title="' + a.key + '">' + a.nama + '</span></div>' +
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
  var akun = akunRunningHub[idx];
  if (!akun) return;

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
        updateStatistikDashboard();
        tampilkanNotif('✓ Status akun berhasil diperbarui', 'sukses');
      }
    }
  } catch (err) {
    tampilkanNotif('Koneksi terputus: ' + err.message, 'error');
  }
}

async function refreshSemuaAkunRunningHub() {
  if (!akunRunningHub || akunRunningHub.length === 0) {
    return tampilkanNotif('Belum ada akun yang terhubung di Kelola Akun', 'error');
  }

  var btn = document.getElementById('btn-sync-all-rh');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin text-sm"></i> Syncing...';
  }

  tampilkanNotif('Menyinkronkan semua akun...', 'info');
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
        var k = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.remainCoins;
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
  if (typeof updateStatistikDashboard === 'function') updateStatistikDashboard();

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-arrows-clockwise text-sm"></i> Sync Semua';
  }

  tampilkanNotif('✓ ' + suksesHitung + ' akun berhasil disinkronkan!', 'sukses');
}

function hapusAkunSatu(idx) {
  mintaKonfirmasi("Yakin ingin menghapus akun ini?", function() {
    akunRunningHub.splice(idx, 1); 
    if (typeof simpanStorage === 'function') simpanStorage(); 
    renderListAkunDiKelola(); 
    setProviderUtama(engineProvider);
    tampilkanNotif('Akun berhasil dihapus', 'sukses');
  });
}

function eksekusiHapusAkun() {
  var checkedBoxes = document.querySelectorAll('.chk-seleksi-akun:checked');
  if (checkedBoxes.length === 0) return tampilkanNotif('Pilih minimal satu akun!', 'error');
  mintaKonfirmasi('Hapus ' + checkedBoxes.length + ' akun terpilih?', function() {
    var toDel = [];
    checkedBoxes.forEach(function(c) { toDel.push(parseInt(c.getAttribute('data-idx'), 10)); });
    toDel.sort(function(a, b) { return b - a; }).forEach(function(idx) { akunRunningHub.splice(idx, 1); });
    if (typeof simpanStorage === 'function') simpanStorage(); 
    toggleModePilihHapus(); 
    renderListAkunDiKelola(); 
    setProviderUtama(engineProvider);
    tampilkanNotif('Akun terpilih berhasil dihapus', 'sukses');
  });
}

async function simpanAkunBaruDariModal() {
  var inKey = document.getElementById('in-modal-key'), valKey = inKey ? inKey.value.trim() : "";
  if (!valKey) return tampilkanNotif('Masukkan API Key terlebih dahulu!', 'error');
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

  if (btnSimpan) { btnSimpan.innerText = 'Tambah'; btnSimpan.disabled = false; }
  
  var indexKetemu = akunRunningHub.findIndex(function(a) { return a.key === valKey; });
  if (indexKetemu !== -1) {
    akunRunningHub[indexKetemu].koin = Number(saldoDidapat); tampilkanNotif('✓ Jalur akun berhasil disinkronkan!', 'sukses');
  } else {
    akunRunningHub.push({ nama: valKey, key: valKey, koin: Number(saldoDidapat) }); tampilkanNotif('✓ Jalur akun baru berhasil ditambahkan!', 'sukses');
  }
  if (typeof simpanStorage === 'function') simpanStorage(); 
  tutupModalFormKey(); 
  renderListAkunDiKelola(); 
  setProviderUtama(engineProvider);
}

window.onload = function() {
  if (typeof muatStorage === 'function') muatStorage();
  setProviderUtama('kiix'); 
  if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();

  if (typeof riwayatGenerateList !== 'undefined' && riwayatGenerateList.length > 0) {
    riwayatGenerateList.forEach(function(tugas) {
      if (!tugas.selesai && tugas.id && tugas.key) {
        pantauTaskRunningHub(tugas, tugas.key, tugas.pool_id, tugas.user_id, tugas.did_deduct);
      }
    });
  }
};
