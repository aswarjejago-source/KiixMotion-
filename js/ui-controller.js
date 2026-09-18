// ==========================================
// PILAR 2: UI CONTROLLER (Sistem Saraf Antarmuka)
// File: js/ui-controller.js
// ==========================================

var currentView = 'workbench';
var navLayarAktif = 'dashboard';
var tabAkunAktif = 'runninghub';
var isModePilih = false;
var pendingKonfirmasiFn = null;
var linkTelegramResmi = "https://t.me/+JS435ITO1h0xMWJl";

// ------------------------------------------
// FITUR LAMA BAWAAN LU (AMAN 100%)
// ------------------------------------------
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

// ------------------------------------------
// FITUR BARU: NAVIGASI BARU ANTI-BENTROK
// ------------------------------------------
function gantiLayarNav(layar) {
  navLayarAktif = layar;
  var ids = ['dashboard', 'generate', 'history', 'galeri', 'kelola-akun'];
  
  ids.forEach(function(id) {
    var el = document.getElementById('layar-' + id);
    var btn = document.getElementById('nav-btn-' + id); 
    
    // Sembunyi/Tampilkan Layar
    if (el) el.style.display = (layar === id) ? 'block' : 'none';
    
    // Ganti Warna Tombol Sidebar
    if (btn) {
      var baseClass = "btn-nav-sidebar nav-btn-smooth px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap transition ";
      if (layar === id) {
        btn.className = baseClass + "bg-[#F3EEFF] text-[#7C3AED]"; 
      } else {
        btn.className = baseClass + "text-slate-600 hover:bg-slate-50 hover:text-slate-800"; 
      }
    }
  });
  
  // Panggil fungsi render tiap layar
  if (layar === 'dashboard') {
      if (typeof updateStatistikDashboard === 'function') updateStatistikDashboard();
      setTimeout(renderVideoAsliKeGrid, 100);
  }
  if (layar === 'history') {
      setTimeout(renderVideoAsliKeGrid, 100);
  }
  if (layar === 'galeri') renderGaleri();
  if (layar === 'kelola-akun' && typeof renderListAkunDiKelola === 'function') renderListAkunDiKelola();
}

function togglePanduanKey() {
    var konten = document.getElementById('konten-panduan-key');
    var panah = document.getElementById('icon-panah-panduan');
    if (!konten || !panah) return;
    
    if (konten.style.display === 'none') {
        konten.style.display = 'block';
        panah.style.transform = 'rotate(180deg)';
    } else {
        konten.style.display = 'none';
        panah.style.transform = 'rotate(0deg)';
    }
}

// ------------------------------------------
// FITUR BARU: GALERI MAKS 50 FILE
// ------------------------------------------
var galeriList = JSON.parse(localStorage.getItem('kiix_galeri_v1') || '[]');

window.unggahKeGaleri = function(input) {
    if (!input.files || !input.files[0]) return;
    if (galeriList.length >= 50) {
        tampilkanNotif('Kapasitas galeri sudah penuh (Maksimal 50 file).', 'error');
        return;
    }
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        galeriList.push({
            id: Date.now(),
            type: file.type.startsWith('video') ? 'video' : 'image',
            url: e.target.result,
            nama: file.name
        });
        localStorage.setItem('kiix_galeri_v1', JSON.stringify(galeriList));
        renderGaleri();
        tampilkanNotif('Media berhasil diunggah ke Galeri!', 'sukses');
    };
    reader.readAsDataURL(file);
}

window.hapusDariGaleri = function(id) {
    mintaKonfirmasi("Apakah Anda yakin ingin menghapus media ini dari galeri?", function() {
        galeriList = galeriList.filter(item => item.id !== id);
        localStorage.setItem('kiix_galeri_v1', JSON.stringify(galeriList));
        renderGaleri();
        tampilkanNotif('File berhasil dihapus.', 'sukses');
    });
}

window.renderGaleri = function() {
    var wadah = document.getElementById('wadah-grid-galeri');
    var txtInfo = document.getElementById('txt-info-kuota-galeri');
    var txtPersen = document.getElementById('txt-persen-kuota');
    
    var totalFoto = galeriList.filter(i => i.type === 'image').length;
    var totalVideo = galeriList.filter(i => i.type === 'video').length;
    
    if(txtInfo) txtInfo.innerText = totalFoto + ' foto · ' + totalVideo + ' video';
    if(txtPersen) txtPersen.innerText = Math.round((galeriList.length / 50) * 100) + '%';

    if (!wadah) return;

    if (galeriList.length === 0) {
        wadah.innerHTML = `
        <div class="col-span-full py-8 text-center text-slate-400">
           <p class="text-xs font-semibold">Belum ada file media yang diunggah.</p>
        </div>`;
        return;
    }

    var html = '';
    galeriList.forEach(function(item) {
        if (item.type === 'video') {
            html += `
            <div class="bg-white border border-kmBorder rounded-2xl overflow-hidden relative group aspect-square modern-shadow">
               <video src="${item.url}" class="w-full h-full object-cover"></video>
               <button onclick="hapusDariGaleri(${item.id})" class="absolute top-2 right-2 w-7 h-7 bg-rose-600/90 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md">✕</button>
            </div>`;
        } else {
            html += `
            <div class="bg-white border border-kmBorder rounded-2xl overflow-hidden relative group aspect-square modern-shadow">
               <img src="${item.url}" class="w-full h-full object-cover" />
               <button onclick="hapusDariGaleri(${item.id})" class="absolute top-2 right-2 w-7 h-7 bg-rose-600/90 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md">✕</button>
            </div>`;
        }
    });
    wadah.innerHTML = html;
}

// ------------------------------------------
// FITUR BARU: RENDER VIDEO KE GRID (BYPASS API-ENGINE)
// ------------------------------------------
window.renderVideoAsliKeGrid = function() {
  var wadahDashboard = document.getElementById('wadah-job-terbaru-dashboard');
  var wadahHistory = document.getElementById('wadah-list-history');
  var txtCounter = document.getElementById('txt-counter-history');
  
  var dataTerbaru = [];

  // MENGAMBIL DATA DATABASE LU
  if (typeof riwayatGenerateList !== 'undefined' && riwayatGenerateList && riwayatGenerateList.length > 0) {
      dataTerbaru = [...riwayatGenerateList].reverse();
      if (txtCounter) txtCounter.innerText = riwayatGenerateList.length + ' tugas';
  } else {
      var htmlKosong = `
         <div class="p-6 border border-kmBorder border-dashed rounded-3xl bg-white/50 text-center text-sm font-medium text-slate-400 flex flex-col items-center justify-center gap-2 col-span-full py-12">
            <span class="text-2xl">🎬</span>
            Belum ada video yang di-generate.
         </div>`;
      if (wadahDashboard) wadahDashboard.innerHTML = htmlKosong;
      if (wadahHistory) wadahHistory.innerHTML = htmlKosong;
      if (txtCounter) txtCounter.innerText = '0 tugas';
      return;
  }

  function bikinKartuHTML(video) {
      // Nyari link di semua kemungkinan struktur database
      var linkVideo = video.url || video.video_url || video.hasil_url || video.videoUrl || '';
      var namaEngine = video.engine || video.provider || 'Wan Motion Control';
      
      var areaMedia = linkVideo ? 
          `<video src="${linkVideo}" class="w-full h-full object-cover bg-slate-900" controls preload="metadata" playsinline></video>
          <div class="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm z-10 pointer-events-none">
             <i class="ph ph-check-circle"></i> Selesai
          </div>` : 
          `<div class="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400">
             <i class="ph-fill ph-spinner animate-spin text-3xl text-kmViolet mb-2"></i>
             <span class="text-xs font-bold">Sedang Diproses...</span>
          </div>`;

      return `
      <div class="bg-white border border-kmBorder rounded-2xl overflow-hidden modern-shadow hover:shadow-lg transition flex flex-col group">
        <div class="bg-black aspect-video relative flex items-center justify-center overflow-hidden">
           ${areaMedia}
        </div>
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
                 <button onclick="tampilkanNotif('Fitur Hapus sedang dalam perbaikan', 'error')" class="text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Hapus">
                    <i class="ph ph-trash text-lg hover:scale-110"></i>
                 </button>
              </div>
           </div>
        </div>
      </div>`;
  }

  // Tampilkan semua di History
  if (wadahHistory) {
      var htmlHistory = '';
      dataTerbaru.forEach(function(v) { htmlHistory += bikinKartuHTML(v); });
      wadahHistory.innerHTML = htmlHistory;
  }

  // Tampilkan max 3 di Dashboard
  if (wadahDashboard) {
      var htmlDashboard = '';
      dataTerbaru.slice(0, 3).forEach(function(v) { htmlDashboard += bikinKartuHTML(v); });
      wadahDashboard.innerHTML = htmlDashboard;
  }
}

// =========================================================================
// KODE SAKTI: PENCEGAT FUNGSI RENDER LAMA DARI FILE API-ENGINE.JS
// =========================================================================
// Kita nimpa fungsi asli dari file api-engine lu, jadi desain lama ga bakal muncul lagi!
window.renderLayarHistory = function() { 
    renderVideoAsliKeGrid(); 
};

// Mencegah file api-engine lu nimpa HTML History pakai innerHTML desain putih lama
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.target.id === 'wadah-list-history' || mutation.target.id === 'wadah-job-terbaru-dashboard') {
            // Kalau api-engine lu ketahuan ngedit kontennya pake kode lama...
            if(mutation.target.innerHTML.includes('text-slate-700 font-bold')) {
                // ...kita hantam balik pake fungsi desain Grid estetik kita!
                renderVideoAsliKeGrid();
            }
        }
    });
});

// Jalankan pengawas ini pas web kebuka
document.addEventListener("DOMContentLoaded", function() {
    var wadahHist = document.getElementById('wadah-list-history');
    var wadahDash = document.getElementById('wadah-job-terbaru-dashboard');
    if(wadahHist) observer.observe(wadahHist, { childList: true, subtree: true });
    if(wadahDash) observer.observe(wadahDash, { childList: true, subtree: true });
    
    // Tembak navigasi awal
    setTimeout(function() {
        gantiLayarNav('dashboard');
    }, 500);
});
