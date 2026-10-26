        cacheControl: '3600',
        upsert: true
      });

      if (resUp.error) throw resUp.error;

      var resPub = supa.storage.from('bahan-render').getPublicUrl(namaFile);
      var linkPublik = resPub?.data?.publicUrl;
      if (!linkPublik) throw new Error("Gagal mengambil link publik.");

      if (tipe === 'foto') {
        urlBahanFoto = linkPublik;
        window.urlBahanFoto = linkPublik;
        window.urlBahanFotoKling = linkPublik;
      } else {
        urlBahanVideo = linkPublik;
        window.urlBahanVideo = linkPublik;
        window.urlBahanVideoKling = linkPublik;
      }

      if (stEl) stEl.innerHTML = '<span class="text-emerald-600 font-bold">✓ Terunggah (' + ukuranMb + ' MB)</span>';
      if (typeof tampilkanNotif === 'function') tampilkanNotif('File berhasil diunggah!', 'sukses');
      return;
    } catch (errSupabase) {
      console.warn("Supabase upload gagal, beralih ke Cloudflare worker...", errSupabase);
    }
  }

  if (stEl) stEl.innerHTML = '<span class="text-amber-600 font-bold animate-pulse">⏳ Mengunggah worker (0%)...</span>';

  var formData = new FormData();
  formData.append('file', fileFinal);

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
          window.urlBahanFotoKling = fileUrl;
        } else {
          urlBahanVideo = fileUrl;
          window.urlBahanVideo = fileUrl;
          window.urlBahanVideoKling = fileUrl;
        }

        var ukuranMb = (fileFinal.size / (1024 * 1024)).toFixed(1);
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
          apiKey: currentApiKey,
          provider: tugas.prov === 'kling' ? 'kling' : undefined
        })
      });

      if (!res.ok) return;

      var jsonObj = await res.json();
      var code = Number(jsonObj.code);
      var statusTeks = "";

      if (jsonObj.data && typeof jsonObj.data === 'object' && !Array.isArray(jsonObj.data)) {
        statusTeks = (jsonObj.data.status || "").toString().toUpperCase().trim();
      }

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

        if (tugas.progress < 92) {
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
        return;
      }

      var isGagalAtauBatal = (
        code === 801 || 
        code === 802 || 
        code === 807 ||
        statusTeks === "FAILED" ||
        statusTeks === "ERROR" ||
        statusTeks === "CANCELED" ||
        statusTeks === "CANCELLED"
      );

      if (isGagalAtauBatal) {
        if (tugas.intervalObj) clearInterval(tugas.intervalObj);
        lepaskanKunciPoolOtomatis(currentPoolId);

        var labelStatus = (code === 807 || statusTeks.includes("CANCEL")) ? "❌ Dibatalkan di Server" : "❌ Gagal Diproses Studio";
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

      if (code === 0 && jsonObj.data) {
        var linkOutputAsli = ambilLinkOutputResmi(jsonObj);
        
        if (linkOutputAsli) {
          if (tugas.intervalObj) clearInterval(tugas.intervalObj);
          lepaskanKunciPoolOtomatis(currentPoolId);

          tugas.status = "Selesai"; 
          tugas.selesai = true;
          tugas.progress = 100; 
          tugas.videoUrl = linkOutputAsli;

          simpanStorage();
          if (typeof renderVideoAsliKeGrid === 'function') renderVideoAsliKeGrid();
          if (typeof aturTampilanHalamanUtama === 'function') aturTampilanHalamanUtama();
          if (currentApiKey) refreshSaldoKunciOtomatis(currentApiKey);
          if (typeof tampilkanNotif === 'function') tampilkanNotif('✓ Video berhasil selesai!', 'sukses');
          return;
        }
      }

    } catch (err) {}
  }

  jalankanCek();
  tugas.intervalObj = setInterval(jalankanCek, 6000);
}

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

async function mulaiProsesGenerate() {
  // EGER KLING REZIMI BOLSA, GÖNI KLING MODULYNA GIDÝÄR (VIP/RUNNINGHUB BARLAGYNY AÝLAÝAR)
  if (window.engineMode === 'kling') {
    if (typeof eksekusiGenerateKling === 'function') {
      eksekusiGenerateKling();
    }
    return;
  }

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

  var isMemberVip = profilUser && (
    profilUser.is_vip === true ||
    profilUser.is_pro === true ||
    profilUser.role === 'pro' ||
    profilUser.role === 'vip' ||
    profilUser.status === 'pro' ||
    profilUser.status === 'vip'
  );

  if (isMemberVip && engineMode === 'kiix') {
    setProviderUtama('pro');
  }

  if (engineMode === 'pro') {
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

  var bahanFotoFinal = window.urlBahanFotoKling || urlBahanFoto;
  var bahanVideoFinal = window.urlBahanVideoKling || urlBahanVideo;

  if (!bahanFotoFinal || !bahanVideoFinal) {
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
    var inPrompt = document.getElementById('in-prompt-gerak');
    var promptTeks = inPrompt ? inPrompt.value.trim() : "";

    var res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urlBahanFoto: bahanFotoFinal,
        urlBahanVideo: bahanVideoFinal,
        provider: engineMode,
        apiKeyPribadi: apiKeyPribadi,
        userId: realUserId,
        userEmail: realEmail,
        prompt: promptTeks
      })
    });

    var data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal memproses render ke server.');
    }

    var taskIdAsli = data.taskId;
    var poolIdDipakai = data.poolId;
    var didDeductCredit = data.didDeductCredit;

    var modelNama = "Wan Motion Control";
    var provNama = (engineMode === 'pro') ? "KiixMotion Pro Engine" : "KiixMotion Control";
    var engineNama = "Wan Motion Control 1080HD";
    var biayaNama = didDeductCredit ? "1 Kredit" : "≈ 478 coin";

    var tugasBaru = {
      id: taskIdAsli,
      key: apiKeyPribadi || null,
      pool_id: poolIdDipakai,
      user_id: realUserId,
      user_email: realEmail,
      did_deduct: didDeductCredit,
      refunded: false,
      startedAt: Date.now(),
      model: modelNama,
      provider: provNama,
      engine: engineNama,
      prov: engineMode,
      tgl: "Baru saja",
      biaya: biayaNama,
      videoUrl: null,
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
  if (typeof mintaKonfirmasi === 'function') {
    mintaKonfirmasi("Yakin ingin menghapus akun ini?", function() {
      listKunciPro.splice(idx, 1); 
      simpanStorage(); 
      renderListAkunDiKelola(); 
      setProviderUtama(engineMode);
      if (typeof tampilkanNotif === 'function') tampilkanNotif('Akun berhasil dihapus', 'sukses');
    });
  } else {
    listKunciPro.splice(idx, 1); 
    simpanStorage(); 
    renderListAkunDiKelola(); 
    setProviderUtama(engineMode);
  }
}

function eksekusiHapusAkun() {
  var checkedBoxes = document.querySelectorAll('.chk-seleksi-akun:checked');
  if (checkedBoxes.length === 0) return tampilkanNotifPusat('Pilih minimal satu akun!');
  
  function hapusTerpilih() {
    var toDel = [];
    checkedBoxes.forEach(function(c) { toDel.push(parseInt(c.getAttribute('data-idx'), 10)); });
    toDel.sort(function(a, b) { return b - a; }).forEach(function(idx) { listKunciPro.splice(idx, 1); });
    simpanStorage(); 
    if (typeof toggleModePilihHapus === 'function') toggleModePilihHapus(); 
    renderListAkunDiKelola(); 
    setProviderUtama(engineMode);
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Akun terpilih berhasil dihapus', 'sukses');
  }

  if (typeof mintaKonfirmasi === 'function') {
    mintaKonfirmasi('Hapus ' + checkedBoxes.length + ' akun terpilih?', hapusTerpilih);
  } else {
    hapusTerpilih();
  }
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
  selaraskanRiwayatDenganAkun();

  var inFoto = document.getElementById('input-file-foto');
  var inVideo = document.getElementById('input-file-video');

  if (inFoto) {
    inFoto.addEventListener('change', function() {
      if (window.engineMode !== 'kling') {
        unggahBahanLangsung(this, 'foto');
      }
    });
  }

  if (inVideo) {
    inVideo.addEventListener('change', function() {
      if (window.engineMode !== 'kling') {
        unggahBahanLangsung(this, 'video');
      }
    });
  }

  var btnSubmit = document.getElementById('btn-submit-generate');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', function(e) {
      mulaiProsesGenerate();
    });
  }
});

window.onload = function() {
  muatStorage();
  selaraskanRiwayatDenganAkun();
  renderListAkunDiKelola();
  updateStatistikDashboard();

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
