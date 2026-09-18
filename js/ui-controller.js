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
    
    // UPDATE PENTING: Class CSS disesuaikan biar Ikon Sidebar tetep estetik dan gak kaku
    if (btn) {
      var baseClass = "nav-btn-smooth px-3.5 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap transition ";
      if (layar === id) {
        // Mode Aktif (Warna Violet KiiXMotion)
        btn.className = baseClass + "bg-[#F3EEFF] text-[#7C3AED]"; 
      } else {
        // Mode Standar
        btn.className = baseClass + "text-slate-600 hover:bg-slate-50 hover:text-slate-800"; 
      }
    }
  });
  
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

// ==========================================
// TAMBAHAN: FUNGSI RENDER KARTU VIDEO ESTETIK
// ==========================================
function renderKumpulanVideoKeGrid(dataVideoArray, targetElementId) {
  var wadah = document.getElementById(targetElementId);
  if (!wadah) return;
  
  // Kalau history-nya masih kosong
  if (!dataVideoArray || dataVideoArray.length === 0) {
      wadah.innerHTML = `
         <div class="p-6 border border-kmBorder border-dashed rounded-3xl bg-white/50 text-center text-sm font-medium text-slate-400 flex flex-col items-center justify-center gap-2 col-span-full py-12">
            <span class="text-2xl">🎬</span>
            Belum ada video yang di-generate.
         </div>`;
      return;
  }

  var htmlCard = '';
  // Looping bikin kartu satu-satu sesuai jumlah data history lu
  dataVideoArray.forEach(function(video) {
      // Ambil data asli (Fallback ke default kalau kosong)
      var namaEngine = video.engine || video.provider || 'Wan Motion Control';
      var urlThumb = video.thumbnail || 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?q=80&w=400&auto=format&fit=crop';
      var statusTxt = video.status === 'processing' ? 'Memproses' : 'Selesai';
      var statusWarna = video.status === 'processing' ? 'bg-amber-500/90' : 'bg-emerald-500/90';
      var iconStatus = video.status === 'processing' ? 'ph-spinner animate-spin' : 'ph-check-circle';

      htmlCard += `
      <div class="bg-white border border-kmBorder rounded-2xl overflow-hidden modern-shadow hover:shadow-lg transition flex flex-col group">
        <!-- Area Thumbnail -->
        <div class="bg-black aspect-video relative flex items-center justify-center cursor-pointer overflow-hidden">
           <img src="${urlThumb}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />
           
           <div class="absolute w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/40 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition duration-300 shadow-lg">
              <i class="ph-fill ph-play text-xl ml-1"></i>
           </div>
           
           <div class="absolute top-3 right-3 ${statusWarna} backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <i class="ph ${iconStatus}"></i> ${statusTxt}
           </div>
        </div>
        
        <!-- Area Info & Tombol Bawah -->
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
                 <button onclick="alert('Mendownload Video: ${video.id || 'N/A'}')" class="text-slate-400 hover:text-kmViolet transition cursor-pointer" title="Download">
                    <i class="ph ph-download-simple text-lg hover:scale-110"></i>
                 </button>
                 <button onclick="alert('Menghapus Video: ${video.id || 'N/A'}')" class="text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Hapus">
                    <i class="ph ph-trash text-lg hover:scale-110"></i>
                 </button>
              </div>
           </div>
        </div>
      </div>
      `;
  });
  
  wadah.innerHTML = htmlCard;
}
