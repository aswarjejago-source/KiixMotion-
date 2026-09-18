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

// Notifikasi Popup (Toast)
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

// Modal Konfirmasi
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

// Ganti Layar & Menu Sidebar Estetik
function gantiLayarNav(layar) {
  navLayarAktif = layar;
  var ids = ['dashboard', 'generate', 'history', 'kelola-akun'];
  
  ids.forEach(function(id) {
    var el = document.getElementById('layar-' + id);
    var btn = document.getElementById('menu-nav-' + id.slice(0, 4));
    
    if (el) el.style.display = (layar === id) ? 'block' : 'none';
    
    if (btn) {
      var baseClass = "nav-btn-smooth px-3.5 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap transition ";
      if (layar === id) {
        btn.className = baseClass + "bg-[#F3EEFF] text-[#7C3AED]"; 
      } else {
        btn.className = baseClass + "text-slate-600 hover:bg-slate-50 hover:text-slate-800"; 
      }
    }
  });
  
  // Panggil fungsi render tiap layar
  if (layar === 'dashboard') updateStatistikDashboard();
  if (layar === 'history') renderLayarHistory();
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

// ==========================================
// RENDER VIDEO ASLI (DASHBOARD & HISTORY)
// ==========================================

function renderVideoAsliKeGrid() {
  var wadahDashboard = document.getElementById('wadah-job-terbaru-dashboard');
  var wadahHistory = document.getElementById('wadah-list-history');
  
  // Update konter jumlah history di pojok kanan atas layar History
  var txtCounter = document.getElementById('txt-counter-history');
  if (txtCounter && typeof riwayatGenerateList !== 'undefined') {
      txtCounter.innerText = riwayatGenerateList.length + ' tugas';
  }
  
  // Jika riwayat kosong
  if (typeof riwayatGenerateList === 'undefined' || !riwayatGenerateList || riwayatGenerateList.length === 0) {
      var htmlKosong = `
         <div class="p-6 border border-kmBorder border-dashed rounded-3xl bg-white/50 text-center text-sm font-medium text-slate-400 flex flex-col items-center justify-center gap-2 col-span-full py-12">
            <span class="text-2xl">🎬</span>
            Belum ada video yang di-generate.
         </div>`;
      if (wadahDashboard) wadahDashboard.innerHTML = htmlKosong;
      if (wadahHistory) wadahHistory.innerHTML = htmlKosong;
      return;
  }

  // Balik urutan array biar video terbaru di paling atas
  var dataTerbaru = [...riwayatGenerateList].reverse();

  // Template Kartu HTML
  function bikinKartuHTML(video) {
      // Menyesuaikan penamaan parameter sesuai standar API/database (url / video_url / dll)
      var linkVideo = video.url || video.video_url || video.hasil_url || video.videoUrl || '';
      var namaEngine = video.engine || video.provider || 'Wan Motion Control';
      
      var areaMedia = '';
      if (linkVideo) {
          // Kalau link video ada, tampilkan pemutar <video>
          areaMedia = `
          <video src="${linkVideo}" class="w-full h-full object-cover bg-slate-900" controls preload="metadata" playsinline></video>
          <div class="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm z-10 pointer-events-none">
             <i class="ph ph-check-circle"></i> Selesai
          </div>`;
      } else {
          // Kalau masih proses atau gagal
          areaMedia = `
          <div class="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400">
             <i class="ph-fill ph-spinner animate-spin text-3xl text-kmViolet mb-2"></i>
             <span class="text-xs font-bold">Sedang Diproses...</span>
          </div>`;
      }

      return `
      <div class="bg-white border border-kmBorder rounded-2xl overflow-hidden modern-shadow hover:shadow-lg transition flex flex-col group">
        <!-- Area Pemutar Video -->
        <div class="bg-black aspect-video relative flex items-center justify-center overflow-hidden">
           ${areaMedia}
        </div>
        
        <!-- Area Info -->
        <div class="p-4 space-y-3">
           <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-kmViolet shadow-[0_0_8px_#7C3AED]"></span>
              <h4 class="text-sm font-bold text-slate-800 truncate">${namaEngine}</h4>
           </div>
           
           <div class="flex items-center justify-between border-t border-kmBorder pt-3 mt-2">
              <div class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                 <i class="ph-fill ph-tiktok-logo text-sm text-slate-800"></i> Auto TikTok
              </div>
              <div class="flex items-center gap-4">
                 <a href="${linkVideo}" target="_blank" class="text-slate-400 hover:text-kmViolet transition cursor-pointer" title="Download">
                    <i class="ph ph-download-simple text-lg hover:scale-110"></i>
                 </a>
                 <button onclick="alert('Fitur Hapus masih dikembangkan!')" class="text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Hapus">
                    <i class="ph ph-trash text-lg hover:scale-110"></i>
                 </button>
              </div>
           </div>
        </div>
      </div>`;
  }

  // Tampilkan semua di halaman History
  var htmlHistory = '';
  dataTerbaru.forEach(function(v) { htmlHistory += bikinKartuHTML(v); });
  if (wadahHistory) wadahHistory.innerHTML = htmlHistory;

  // Tampilkan max 3 di halaman Dashboard
  var htmlDashboard = '';
  dataTerbaru.slice(0, 3).forEach(function(v) { htmlDashboard += bikinKartuHTML(v); });
  if (wadahDashboard) wadahDashboard.innerHTML = htmlDashboard;
}

// Pastikan fungsi ini dipanggil tiap buka layar yang bersangkutan
function renderLayarHistory() {
    renderVideoAsliKeGrid();
}

function updateStatistikDashboard() {
    renderVideoAsliKeGrid();
    
    // (Bisa tambahin fungsi update angka saldo di sini kalau ada)
}
