// ==========================================
// PILAR 4: MINIMAX H3 ENGINE LOGIC
// File: js/minimax-engine.js
// Fokus: MiniMax H3 Master Workflow & 1 Kredit / Render
// ==========================================

var fileGambarMinimax = {}; 
var urlGambarMinimax = {};

// 1. FUNGSI UPLOAD SETIAP GAMBAR KE CLOUDFLARE WORKER
window.unggahGambarSlotMinimax = async function(file, slotIndex) {
  var lblSlot = document.getElementById('lbl-mm-' + slotIndex);
  if (lblSlot) lblSlot.innerText = 'Uploading...';

  var formData = new FormData();
  formData.append('file', file);

  try {
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

    if (!fileUrl) throw new Error('URL file tidak ditemukan');

    urlGambarMinimax[slotIndex] = fileUrl;
    if (lblSlot) lblSlot.innerText = '✓ Siap';
    return fileUrl;
  } catch (err) {
    if (lblSlot) lblSlot.innerText = '❌ Gagal';
    throw err;
  }
};

// 2. MODIFIKASI PREVIEW MINIMAX AGAR OTOMATIS UPLOAD
var previewAsli = window.previewMinimax;
window.previewMinimax = function(input, index) {
  if (input.files && input.files[0]) {
    var file = input.files[0];
    fileGambarMinimax[index] = file;

    // Tampilkan preview lokal instan
    var reader = new FileReader();
    reader.onload = function(e) {
      var divBg = document.getElementById('prev-mm-' + index);
      var delBtn = document.getElementById('del-mm-' + index);
      var plusIcon = document.getElementById('plus-mm-' + index);
      var lblText = document.getElementById('lbl-mm-' + index);

      if (divBg) {
        divBg.style.backgroundImage = 'url(' + e.target.result + ')';
        divBg.classList.remove('hidden');
      }
      if (delBtn) delBtn.classList.remove('hidden');
      if (plusIcon) plusIcon.classList.add('hidden');
      if (lblText) lblText.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    // Upload background ke cloud storage
    window.unggahGambarSlotMinimax(file, index).catch(function(e) {
      console.error('Gagal upload slot ' + index, e);
      if (typeof tampilkanNotif === 'function') {
        tampilkanNotif('Gagal upload gambar slot ' + index + ' ke storage.', 'error');
      }
    });
  }
};

// 3. OVERRIDE HAPUS PREVIEW UNTUK MEMBERSIHKAN DATA SLOT
var hapusAsli = window.hapusPreviewMinimax;
window.hapusPreviewMinimax = function(event, index) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  delete fileGambarMinimax[index];
  delete urlGambarMinimax[index];

  var divBg = document.getElementById('prev-mm-' + index);
  var delBtn = document.getElementById('del-mm-' + index);
  var plusIcon = document.getElementById('plus-mm-' + index);
  var lblText = document.getElementById('lbl-mm-' + index);

  if (divBg) {
    divBg.style.backgroundImage = '';
    divBg.classList.add('hidden');
  }
  if (delBtn) delBtn.classList.add('hidden');
  if (plusIcon) plusIcon.classList.remove('hidden');
  if (lblText) {
    lblText.innerText = String(index);
    lblText.classList.remove('hidden');
  }
};

// 4. EKSEKUSI GENERATE KHUSUS MINIMAX H3 (1 KREDIT MEMBER)
window.mulaiProsesGenerateMinimax = async function() {
  var btn = document.getElementById('btn-submit-minimax');
  var promptEl = document.getElementById('prompt-minimax');
  var performaEl = document.getElementById('sel-minimax-performa');
  var frameEl = document.getElementById('sel-minimax-frame');
  var durasiEl = document.getElementById('sel-minimax-durasi');
  var ratioEl = document.getElementById('sel-minimax-ratio');

  var promptTeks = promptEl ? promptEl.value.trim() : '';
  if (!promptTeks) {
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Prompt atau skrip aksi wajib diisi!', 'error');
    return;
  }

  // Kumpulkan list URL gambar dari slot 1-9
  var listUrlFinal = [];
  for (var i = 1; i <= 9; i++) {
    if (urlGambarMinimax[i]) {
      listUrlFinal.push({ slot: i, url: urlGambarMinimax[i] });
    }
  }

  if (listUrlFinal.length === 0) {
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Unggah minimal 1 gambar referensi!', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Memvalidasi Kredit...';
  }

  // Verifikasi login & saldo kredit member
  var userAuth = null;
  try {
    var sessionRes = await supa.auth.getSession();
    userAuth = sessionRes?.data?.session?.user;
  } catch (err) {}

  if (!userAuth) {
    if (btn) { btn.disabled = false; btn.innerText = 'GENERATE VIDEO MINIMAX'; }
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Sesi login kamu berakhir. Silakan login ulang!', 'error');
    return;
  }

  // Cek apakah punya minimal 1 kredit
  var { data: creditRow } = await supa
    .from('user_credits')
    .select('credits_balance, expires_at')
    .eq('user_id', userAuth.id)
    .gt('credits_balance', 0)
    .maybeSingle();

  var sisaKredit = creditRow ? creditRow.credits_balance : 0;
  var isExpired = creditRow ? (new Date(creditRow.expires_at).getTime() < Date.now()) : true;

  if (sisaKredit < 1 || isExpired) {
    if (btn) { btn.disabled = false; btn.innerText = 'GENERATE VIDEO MINIMAX'; }
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Kredit render kamu habis! Beli kredit dulu di tab Beli Kredit.', 'error');
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

    // Reset form MiniMax
    for (var k = 1; k <= 9; k++) {
      window.hapusPreviewMinimax(null, k);
    }
    if (promptEl) promptEl.value = '';

    if (typeof tampilkanModalCeklisSukses === 'function') {
      tampilkanModalCeklisSukses(tugasBaru.id);
    }

    if (typeof updateStatusMemberUI === 'function') {
      updateStatusMemberUI(userAuth.email);
    }

    // Sambungkan ke polling riwayat universal
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

// 5. HUBUNGKAN TOMBOL GENERATE MINIMAX DI DOM
document.addEventListener('DOMContentLoaded', function() {
  var btnMinimax = document.getElementById('btn-submit-minimax');
  if (btnMinimax) {
    btnMinimax.onclick = function(e) {
      e.preventDefault();
      window.mulaiProsesGenerateMinimax();
    };
  }
});
