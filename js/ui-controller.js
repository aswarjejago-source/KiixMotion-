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
// FITUR PONDASI
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
// NAVIGASI
// ------------------------------------------
function gantiLayarNav(layar) {
  navLayarAktif = layar;
  var ids = ['dashboard', 'generate', 'history', 'galeri', 'kelola-akun', 'langganan'];
  
  ids.forEach(function(id) {
    var el = document.getElementById('layar-' + id);
    var btn = document.getElementById('nav-btn-' + id); 
    
    if (el) el.style.display = (layar === id) ? 'block' : 'none';
    
    if (btn) {
      var baseClass = "btn-nav-sidebar nav-btn-smooth px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap transition ";
      if (layar === id) {
        btn.className = baseClass + "bg-[#F3EEFF] text-[#7C3AED]"; 
      } else {
        btn.className = baseClass + "text-slate-600 hover:bg-slate-50 hover:text-slate-800"; 
      }
    }
  });
  
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
// GALERI
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
// FITUR BARU: RENDER VIDEO KE GRID (ANTI-MUTER)
// ------------------------------------------
window.renderVideoAsliKeGrid = function() {
  var wadahDashboard = document.getElementById('wadah-job-terbaru-dashboard');
  var wadahHistory = document.getElementById('wadah-list-history');
  var txtCounter = document.getElementById('txt-counter-history');
  
  var dataTerbaru = [];

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
      var linkVideo = video.url || video.video_url || video.hasil_url || video.videoUrl || '';
      var namaEngine = video.engine || video.provider || video.model || 'Wan Motion Control';
      
      var isFailed = (video.status && (video.status.toLowerCase().includes('gagal') || video.status.includes('❌')));
      var isSelesai = video.selesai === true;

      var areaMedia = '';

      if (linkVideo) {
          areaMedia = `<video src="${linkVideo}" class="w-full h-full object-cover bg-slate-900" controls preload="metadata" playsinline></video>
          <div class="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm z-10 pointer-events-none">
             <i class="ph ph-check-circle"></i> Selesai
          </div>`;
      } else if (isFailed || (isSelesai && !linkVideo)) {
          var teksError = video.status || "❌ Gagal Dirender Server";
          areaMedia = `<div class="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-rose-500 p-4 text-center">
             <i class="ph-fill ph-warning-circle text-4xl mb-2 drop-shadow-md"></i>
             <span class="text-xs sm:text-sm font-bold leading-tight">${teksError}</span>
          </div>`;
      } else {
          var progress = video.progress || 0;
          areaMedia = `<div class="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400">
             <i class="ph-fill ph-spinner animate-spin text-3xl text-kmViolet mb-2"></i>
             <span class="text-xs font-bold mb-1">Sedang Diproses...</span>
             <span class="text-[10px] text-kmViolet font-bold">${progress}%</span>
          </div>`;
      }

      var tombolDownload = linkVideo ? 
          `<a href="${linkVideo}" target="_blank" class="text-slate-400 hover:text-kmViolet transition cursor-pointer" title="Download">
              <i class="ph ph-download-simple text-lg hover:scale-110"></i>
           </a>` : '';

      return `
      <div class="bg-white border border-kmBorder rounded-2xl overflow-hidden modern-shadow hover:shadow-lg transition flex flex-col group">
        <div class="bg-black aspect-video relative flex items-center justify-center overflow-hidden">
           ${areaMedia}
        </div>
        <div class="p-4 space-y-3">
           <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full ${isFailed ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]' : 'bg-kmViolet shadow-[0_0_8px_#7C3AED]'}"></span>
              <h4 class="text-sm font-bold text-slate-800 truncate">${namaEngine}</h4>
           </div>
           <div class="flex items-center justify-between border-t border-kmBorder pt-3 mt-2">
              <div class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate max-w-[60%]">
                 <i class="ph-fill ph-tiktok-logo text-sm text-slate-800"></i> ID: ${video.id || '-'}
              </div>
              <div class="flex items-center gap-4">
                 ${tombolDownload}
                 <button onclick="hapusTugasBerdasarkanId('${video.id}')" class="text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Hapus Tugas">
                    <i class="ph ph-trash text-lg hover:scale-110"></i>
                 </button>
              </div>
           </div>
        </div>
      </div>`;
  }

  if (wadahHistory) {
      var htmlHistory = '';
      dataTerbaru.forEach(function(v) { htmlHistory += bikinKartuHTML(v); });
      wadahHistory.innerHTML = htmlHistory;
  }

  if (wadahDashboard) {
      var htmlDashboard = '';
      dataTerbaru.slice(0, 3).forEach(function(v) { htmlDashboard += bikinKartuHTML(v); });
      wadahDashboard.innerHTML = htmlDashboard;
  }
}

// ------------------------------------------
// FITUR HAPUS TUGAS
// ------------------------------------------
window.hapusTugasBerdasarkanId = function(id) {
  if (typeof mintaKonfirmasi === 'function') {
      mintaKonfirmasi("Yakin ingin menghapus riwayat tugas ini?", function() {
          if (typeof riwayatGenerateList !== 'undefined') {
              var idx = riwayatGenerateList.findIndex(function(t) { return String(t.id) === String(id); });
              if (idx > -1) {
                  if (riwayatGenerateList[idx].intervalObj) clearInterval(riwayatGenerateList[idx].intervalObj);
                  riwayatGenerateList.splice(idx, 1);
                  if (typeof simpanStorage === 'function') simpanStorage();
                  renderVideoAsliKeGrid();
                  tampilkanNotif('Riwayat tugas berhasil dihapus', 'sukses');
              }
          }
      });
  }
};

window.renderLayarHistory = function() { 
    renderVideoAsliKeGrid(); 
};

// ------------------------------------------
// FITUR OTOMATIS UBAH "MEMBER AKTIF" JADI "MEMBER PRO"
// ------------------------------------------
async function updateStatusMemberUI() {
  if (typeof supa === 'undefined') return;
  
  try {
    var sessionRes = await supa.auth.getSession();
    var user = sessionRes?.data?.session?.user;
    
    if (user && user.email) {
      var { data: profile, error } = await supa.from('users').select('is_vip, vip_expires_at').eq('email', user.email).single();
      
      var badgeEl = document.getElementById('label-member-status');
      if (!badgeEl) return;
      
      if (!error && profile && profile.is_vip === true) {
        var isExpired = false;
        if (profile.vip_expires_at) {
          if (new Date(profile.vip_expires_at).getTime() < new Date().getTime()) {
            isExpired = true;
          }
        }

        if (!isExpired) {
          badgeEl.innerText = "⭐ Member Pro";
          badgeEl.className = "text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block";
        } else {
          badgeEl.innerText = "Member Aktif (Expired)";
          badgeEl.className = "text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block";
        }
      } else {
        badgeEl.innerText = "Member Aktif";
        badgeEl.className = "text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block";
      }
    }
  } catch (err) {
    console.error("Gagal ngecek status member UI:", err);
  }
}

// ------------------------------------------
// OBSERVER UNTUK UPDATE OTOMATIS UI
// ------------------------------------------
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.target.id === 'wadah-list-history' || mutation.target.id === 'wadah-job-terbaru-dashboard') {
            if(mutation.target.innerHTML.includes('text-slate-700 font-bold')) {
                renderVideoAsliKeGrid();
            }
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var wadahHist = document.getElementById('wadah-list-history');
    var wadahDash = document.getElementById('wadah-job-terbaru-dashboard');
    if(wadahHist) observer.observe(wadahHist, { childList: true, subtree: true });
    if(wadahDash) observer.observe(wadahDash, { childList: true, subtree: true });
    
    // PANGGIL DI SINI SUPAYA OTOMATIS JALAN PAS HALAMAN DIMUAT
    updateStatusMemberUI();
    
    setTimeout(function() {
        gantiLayarNav('dashboard');
    }, 500);
});

// =========================================================================
// INTEGRASI API IPAYMU
// =========================================================================
window.prosesBeliVIP = function() {
    tampilkanNotif("Menghubungkan ke secure payment iPaymu...", "info");
    
    let userEmail = "";
    
    try {
        const sbData = localStorage.getItem('sb-fybyupwcburndxulqqnn-auth-token'); 
        if (sbData) {
            const parsedData = JSON.parse(sbData);
            if (parsedData.user && parsedData.user.email) {
                userEmail = parsedData.user.email;
            }
        }
        
        if (!userEmail && typeof currentKiiXUser !== 'undefined' && currentKiiXUser.email) {
            userEmail = currentKiiXUser.email;
        }
    } catch(e) {}

    if (!userEmail) {
        userEmail = prompt("Masukkan email aktif Anda untuk mengirim struk tagihan iPaymu:", "");
        if (!userEmail) {
            tampilkanNotif("Gagal: Email wajib diisi untuk transaksi!", "error");
            return; 
        }
    }
    
    fetch('/api/bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, amount: 35630, name: "Member KiiXMotion", phone: "081122334455" })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.Success === true || data.Status === 200 || data.Data) {
            tampilkanNotif("Berhasil! Mengarahkan ke secure payment...", "sukses");
            setTimeout(function() {
                var paymentLink = (data.Data && data.Data.Url) ? data.Data.Url : data.url; 
                if(paymentLink) window.location.href = paymentLink;
                else tampilkanNotif("Gagal membaca link pembayaran dari iPaymu", "error");
            }, 1000);
        } else {
            tampilkanNotif("Gagal bikin transaksi: " + (data.message || data.Message || "Kesalahan iPaymu"), "error");
        }
    })
    .catch(function(err) {
        tampilkanNotif("Gagal koneksi ke server Vercel/iPaymu.", "error");
    });
};
