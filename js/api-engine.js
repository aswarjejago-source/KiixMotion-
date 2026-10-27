// ==========================================
// PILAR 4: MINIMAX H3 ENGINE LOGIC (AUTO-SCAN 1-9 FOTO)
// File: js/minimax-engine.js
// ==========================================

window.urlGambarMinimax = window.urlGambarMinimax || {};

// 1. FUNGSI UPLOAD BAHAN KE CLOUDFLARE WORKER
async function kirimFileKeCloudflare(file, indexSlot) {
  var formData = new FormData();
  formData.append('file', file);

  var res = await fetch('https://mute-wind-17c9kiix-uploader.ingkiofficial.workers.dev', {
    method: 'POST',
    body: formData
  });

  var rawText = await res.text();
  var resJson = JSON.parse(rawText);
  var fileUrl = null;

  if (resJson && resJson.data) {
    if (typeof resJson.data === 'string') {
      fileUrl = resJson.data;
    } else if (typeof resJson.data === 'object') {
      fileUrl = resJson.data.fileUrl || resJson.data.fileName || resJson.data.url || resJson.data.path;
    }
  }

  if (!fileUrl) throw new Error('Gagal mendapatkan link upload slot ' + indexSlot);
  return fileUrl;
}

// 2. LOGIKA GENERATE UTAMA (SCAN KOTAK 1 SAMPAI 9 SECARA LANGSUNG)
window.mulaiProsesGenerateMinimax = async function() {
  var btn = document.getElementById('btn-submit-minimax');
  var promptEl = document.getElementById('prompt-minimax');
  var performaEl = document.getElementById('sel-minimax-performa');
  var frameEl = document.getElementById('sel-minimax-frame');
  var durasiEl = document.getElementById('sel-minimax-durasi');
  var ratioEl = document.getElementById('sel-minimax-ratio');

  var promptTeks = promptEl ? promptEl.value.trim() : '';
  if (!promptTeks) {
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Prompt / skrip aksi wajib diisi!', 'error');
    return;
  }

  // Cari seluruh input file di dalam grid 9 kotak
  var containerGrid = document.getElementById('grid-minimax-images');
  var fileInputs = containerGrid ? containerGrid.querySelectorAll('input[type="file"]') : [];
  
  var daftarAntreanUpload = [];

  fileInputs.forEach(function(input, idx) {
    var slotKe = idx + 1;
    if (input.files && input.files[0]) {
      daftarAntreanUpload.push({
        slot: slotKe,
        file: input.files[0]
      });
    }
  });

  if (daftarAntreanUpload.length === 0) {
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Unggah minimal 1 gambar referensi!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Memvalidasi Kredit...';
  }

  // Cek user login & ketersediaan kredit di Supabase
  var userAuth = null;
  try {
    var sessionRes = await supa.auth.getSession();
    userAuth = sessionRes?.data?.session?.user;
  } catch (err) {}

  if (!userAuth) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-magic-wand text-lg"></i> GENERATE VIDEO MINIMAX'; }
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Sesi login berakhir, silakan login ulang!', 'error');
    return;
  }

  var { data: creditRow } = await supa
    .from('user_credits')
    .select('credits_balance, expires_at')
    .eq('user_id', userAuth.id)
    .gt('credits_balance', 0)
    .maybeSingle();

  var sisaKredit = creditRow ? creditRow.credits_balance : 0;
  var isExpired = creditRow ? (new Date(creditRow.expires_at).getTime() < Date.now()) : true;

  if (sisaKredit < 1 || isExpired) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-magic-wand text-lg"></i> GENERATE VIDEO MINIMAX'; }
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Kredit render kamu habis! Beli kredit dulu di tab Beli Kredit.', 'error');
    return;
  }

  // Upload seluruh foto yang terdeteksi ke storage cloud
  var listUrlFinal = [];
  try {
    for (var i = 0; i < daftarAntreanUpload.length; i++) {
      var item = daftarAntreanUpload[i];
      if (btn) {
        btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Mengunggah Foto (' + (i + 1) + '/' + daftarAntreanUpload.length + ')...';
      }
      
      // Gunakan URL yang sudah ada jika tersimpan, jika belum upload langsung
      var urlCloud = window.urlGambarMinimax[item.slot];
      if (!urlCloud) {
        urlCloud = await kirimFileKeCloudflare(item.file, item.slot);
        window.urlGambarMinimax[item.slot] = urlCloud;
      }
      
      listUrlFinal.push({
        slot: item.slot,
        url: urlCloud
      });
    }
  } catch (errUpload) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-magic-wand text-lg"></i> GENERATE VIDEO MINIMAX'; }
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Gagal mengunggah foto ke storage cloud: ' + errUpload.message, 'error');
    return;
  }

  if (btn) btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Menghubungkan ke MiniMax GPU...';

  try {
    var payload = {
      provider: 'minimax',
      prompt: promptTeks,
      images: listUrlFinal,
      performanceType: performaEl ? performaEl.value : 'dramatis',
      fpsMode: frameEl ? frameEl.value : '24fps',
      duration: durasiEl ? durasiEl.value : '15',
      aspectRatio: ratioEl ? ratioEl.value : '3:4',
      userId: userAuth.id,
      userEmail: userAuth.email
    };

    var res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    var data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal mengirim tugas render ke GPU.');
    }

    var taskIdAsli = data.taskId;
    var poolIdDipakai = data.poolId;

    var tugasBaru = {
      id: taskIdAsli,
      pool_id: poolIdDipakai,
      user_id: userAuth.id,
      user_email: userAuth.email,
      did_deduct: true,
      refunded: false,
      startedAt: Date.now(),
      model: "MiniMax H3",
      provider: "minimax",
      engine: "MiniMax H3 Master Workflow",
      prov: "minimax",
      tgl: "Baru saja",
      biaya: "1 Kredit",
      videoUrl: null,
      status: "⚡ Sedang Memproses MiniMax...",
      selesai: false,
      progress: 0
    };

    window.riwayatGenerateList.unshift(tugasBaru);
    if (typeof simpanStorage === 'function') simpanStorage();

    // Reset input setelah berhasil dikirim
    window.urlGambarMinimax = {};
    for (var k = 1; k <= 9; k++) {
      if (typeof window.hapusPreviewMinimax === 'function') {
        window.hapusPreviewMinimax(null, k);
      }
    }
    if (promptEl) promptEl.value = '';

    if (typeof tampilkanModalCeklisSukses === 'function') {
      tampilkanModalCeklisSukses(tugasBaru.id);
    }

    if (typeof updateStatusMemberUI === 'function') {
      updateStatusMemberUI(userAuth.email);
    }

    if (typeof pantauStatusVideo === 'function') {
      pantauStatusVideo(tugasBaru, null, poolIdDipakai, userAuth.id, true);
    }

  } catch (err) {
    if (typeof tampilkanNotif === 'function') {
      tampilkanNotif(err.message || 'Terjadi kesalahan sistem render.', 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph-bold ph-magic-wand text-lg"></i> GENERATE VIDEO MINIMAX';
    }
  }
};
