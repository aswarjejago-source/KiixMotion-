// ==========================================
// PILAR 2: UI CONTROLLER (Sistem Saraf Antarmuka)
// File: js/ui-controller.js
// Fungsi: Mengatur navigasi, modal, notifikasi, dan animasi
// ==========================================

var currentView = 'workbench';
var navLayarAktif = 'dashboard';
var tabAkunAktif = 'runninghub';
var isModePilih = false;
var pendingKonfirmasiFn = null;
var linkTelegramResmi = "https://t.me/+JS435ITO1h0xMWJl";

function tampilkanNotif(pesan, jenis) {
  var wadah = document.getElementById('toast-container');
  if (!wadah) return;
  var el = document.createElement('div');
  var warnaBg = jenis === 'error' ? 'bg-rose-600 text-white' : (jenis === 'sukses' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white');
  el.className = 'animate-toast px-5 py-3 rounded-2xl shadow-xl font-bold text-xs sm:text-sm flex items-center gap-2 mb-2 ' + warnaBg;
  el.innerHTML = '<span>' + (jenis === 'error' ? '⚠️' : (jenis === 'sukses' ? '✓' : 'ℹ️')) + '</span> <span>' + pesan + '</span>';
  wadah.appendChild(el);
  setTimeout(function() {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(function() { el.remove(); }, 300);
  }, 4500);
}

function aturTampilanHalamanUtama() {
  var vWorkbench = document.getElementById('view-workbench');
  var navHeader = document.getElementById('main-header-nav');
  if (vWorkbench) vWorkbench.style.display = 'block';
  if (navHeader) navHeader.style.display = 'flex';
  gantiLayarNav(navLayarAktif);
}

function mintaKonfirmasi(pesan, callbackYa) {
  var modal = document.getElementById('modal-konfirmasi-box');
  var txt = document.getElementById('modal-konfirmasi-teks');
  if (!modal || !txt) return;
  txt.innerText = pesan;
  pendingKonfirmasiFn = callbackYa;
  modal.style.display = 'flex';
}

function tutupModalKonfirmasi(apakahYa) {
  var modal = document.getElementById('modal-konfirmasi-box');
  if (modal) modal.style.display = 'none';
  if (apakahYa && typeof pendingKonfirmasiFn === 'function') {
    pendingKonfirmasiFn();
  }
  pendingKonfirmasiFn = null;
}

function gantiLayarNav(layar) {
  navLayarAktif = layar;
  var ids = ['dashboard', 'generate', 'history', 'kelola-akun'];
  ids.forEach(function(id) {
    var el = document.getElementById('layar-' + id);
    var btn = document.getElementById('menu-nav-' + id.slice(0, 4));
    if (el) el.style.display = (layar === id) ? 'block' : 'none';
    if (btn) {
      btn.className = "px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer " +
        ((layar === id) ? "bg-kmViolet text-white violet-glow" : "text-kmTextSecondary hover:text-kmViolet hover:bg-white/80");
    }
  });
  
  // Panggil fungsi render jika ada (Fungsi ini nanti ada di file logic utama)
  if (typeof updateStatistikDashboard === 'function' && layar === 'dashboard') updateStatistikDashboard();
  if (typeof renderLayarHistory === 'function' && layar === 'history') renderLayarHistory();
  if (typeof renderListAkunDiKelola === 'function' && layar === 'kelola-akun') renderListAkunDiKelola();
}

function bukaGrupTelegram() {
  window.open(linkTelegramResmi, '_blank');
}

function bukaModalFormKey() {
  var modal = document.getElementById('modal-popup-key');
  var inKey = document.getElementById('in-modal-key');
  if (inKey) inKey.value = ''; 
  if (modal) modal.style.display = 'flex';
}

function tutupModalFormKey() {
  var modal = document.getElementById('modal-popup-key');
  if (modal) modal.style.display = 'none';
}

function toggleModePilihHapus() {
  isModePilih = !isModePilih;
  var btn = document.getElementById('btn-toggle-pilih'), bar = document.getElementById('bar-aksi-hapus');
  var chks = document.querySelectorAll('.chk-seleksi-akun');
  if (btn) {
    btn.innerText = isModePilih ? 'Batal' : 'Pilih';
    btn.className = isModePilih ? "px-4 py-2 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl border border-rose-200 cursor-pointer" : "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition cursor-pointer";
  }
  if (bar) bar.style.display = isModePilih ? 'flex' : 'none';
  chks.forEach(function(c) {
    if (isModePilih) c.classList.remove('hidden'); else { c.checked = false; c.classList.add('hidden'); }
  });
}

function centangSemuaAkun(master) {
  document.querySelectorAll('.chk-seleksi-akun').forEach(function(c) { c.checked = master.checked; });
}
