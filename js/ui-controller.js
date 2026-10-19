// ==========================================
// PILAR 2: UI CONTROLLER
// File: js/ui-controller.js
// ==========================================

var currentView = 'workbench';
var navLayarAktif = 'dashboard';
var tabAkunAktif = 'runninghub';
var isModePilih = false;
var pendingKonfirmasiFn = null;
var linkTelegramResmi = "https://t.me/+JS435ITO1h0xMWJl";

var paketKreditAktif = '5k';

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

function gantiLayarNav(layar) {
  navLayarAktif = layar;
  var ids = ['dashboard', 'generate', 'history', 'workflow-ugc', 'galeri', 'kelola-akun', 'beli-kredit', 'langganan', 'admin-pool'];
  
  ids.forEach(function(id) {
    var el = document.getElementById('layar-' + id);
    var btn = document.getElementById('nav-btn-' + id); 
    
    if (el) el.style.display = (layar === id) ? 'block' : 'none';
    
    if (btn) {
      if (id === 'admin-pool') {
        if (layar === 'admin-pool') {
          btn.className = "btn-nav-sidebar nav-btn-smooth px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-white border border-amber-500 cursor-pointer whitespace-nowrap transition mt-2 shadow-sm";
        } else {
          btn.className = "btn-nav-sidebar nav-btn-smooth px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500/10 text-amber-600 border border-amber-300 hover:bg-amber-500 hover:text-white cursor-pointer whitespace-nowrap transition mt-2";
        }
      } else {
        var baseClass = "btn-nav-sidebar nav-btn-smooth px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap transition ";
        if (layar === id) {
          btn.className = baseClass + "bg-[#F3EEFF] text-[#7C3AED]"; 
        } else {
          btn.className = baseClass + "text-slate-600 hover:bg-slate-50 hover:text-slate-800"; 
        }
      }
    }
  });
  
  if (layar === 'dashboard') {
    if (typeof updateStatistikDashboard === 'function') updateStatistikDashboard();
    if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI();
    setTimeout(renderVideoAsliKeGrid, 100);
  }
  if (layar === 'generate') {
    if (typeof setProviderUtama === 'function') setProviderUtama(engineProvider || 'kiix');
  }
  if (layar === 'history') {
    setTimeout(renderVideoAsliKeGrid, 100);
  }
  if (layar === 'workflow-ugc' && typeof initWorkflowUGC === 'function') {
    initWorkflowUGC();
  }
  if (layar === 'galeri') renderGaleri();
  if (layar === 'kelola-akun' && typeof renderListAkunDiKelola === 'function') renderListAkunDiKelola();
  if (layar === 'beli-kredit') {
    if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI();
    pilihPaketKredit(paketKreditAktif || '5k');
  }
  if (layar === 'langganan') {
    if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI();
  }
  if (layar === 'admin-pool' && typeof muatDataKolamAdmin === 'function') muatDataKolamAdmin();
}

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
};

window.hapusDariGaleri = function(id) {
  mintaKonfirmasi("Apakah Anda yakin ingin menghapus media ini dari galeri?", function() {
    galeriList = galeriList.filter(item => item.id !== id);
    localStorage.setItem('kiix_galeri_v1', JSON.stringify(galeriList));
    renderGaleri();
    tampilkanNotif('File berhasil dihapus.', 'sukses');
  });
};

window.renderGaleri = function() {
  var wadah = document.getElementById('wadah-grid-galeri');
  var txtInfo = document.getElementById('txt-info-kuota-galeri');
  var txtPersen = document.getElementById('txt-persen-kuota');
  
  var totalFoto = galeriList.filter(i => i.type === 'image').length;
  var totalVideo = galeriList.filter(i => i.type === 'video').length;
  
  if (txtInfo) txtInfo.innerText = totalFoto + ' foto · ' + totalVideo + ' video';
  if (txtPersen) txtPersen.innerText = Math.round((galeriList.length / 50) * 100) + '%';

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
};

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
         <span class="text-xs font-bold mb-1">Sedang Memproses Video...</span>
         <span class="text-[10px] text-kmViolet font-bold tabular-nums">${progress}%</span>
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
};

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

function pilihPaketKredit(tipe) {
  paketKreditAktif = tipe;

  var btn2k = document.getElementById('btn-kredit-2k');
  var btn5k = document.getElementById('btn-kredit-5k');
  var btn10k = document.getElementById('btn-kredit-10k');

  var txtItem = document.getElementById('txt-kredit-item');
  var txtHarga = document.getElementById('txt-kredit-harga');
  var txtFee = document.getElementById('txt-kredit-fee');
  var txtTotal = document.getElementById('txt-kredit-total');
  var btnEksekusi = document.getElementById('btn-eksekusi-kredit');

  [btn2k, btn5k, btn10k].forEach(function(b) {
    if (!b) return;
    b.className = "p-4 rounded-2xl border border-slate-200 hover:border-violet-300 text-left transition cursor-pointer relative group";
    var dot = b.querySelector('.rounded-full');
    if (dot) dot.className = "w-2 h-2 rounded-full bg-slate-300";
  });

  if (tipe === '2k') {
    if (btn2k) {
      btn2k.className = "p-4 rounded-2xl border-2 border-kmViolet bg-violet-50/40 text-left transition cursor-pointer relative group shadow-sm";
      var dot2 = btn2k.querySelector('.rounded-full');
      if (dot2) dot2.className = "w-2 h-2 rounded-full bg-kmViolet";
    }
    if (txtItem) txtItem.innerText = "Paket 4 Kredit (4 Video / 24 Jam)";
    if (txtHarga) txtHarga.innerText = "Rp 2.000";
    if (txtFee) txtFee.innerText = "Rp 800";
    if (txtTotal) txtTotal.innerText = "Rp 2.800";
    if (btnEksekusi) btnEksekusi.innerHTML = '<span>Bayar Rp 2.800 via QRIS (4 Kredit)</span> &rarr;';

  } else if (tipe === '5k') {
    if (btn5k) {
      btn5k.className = "p-4 rounded-2xl border-2 border-kmViolet bg-violet-50/40 text-left transition cursor-pointer relative group shadow-sm";
      var dot5 = btn5k.querySelector('.rounded-full');
      if (dot5) dot5.className = "w-2 h-2 rounded-full bg-kmViolet";
    }
    if (txtItem) txtItem.innerText = "Paket 10 Kredit (10 Video / 24 Jam)";
    if (txtHarga) txtHarga.innerText = "Rp 5.000";
    if (txtFee) txtFee.innerText = "Rp 800";
    if (txtTotal) txtTotal.innerText = "Rp 5.800";
    if (btnEksekusi) btnEksekusi.innerHTML = '<span>Bayar Rp 5.800 via QRIS (10 Kredit)</span> &rarr;';

  } else if (tipe === '10k') {
    if (btn10k) {
      btn10k.className = "p-4 rounded-2xl border-2 border-kmViolet bg-violet-50/40 text-left transition cursor-pointer relative group shadow-sm";
      var dot10 = btn10k.querySelector('.rounded-full');
      if (dot10) dot10.className = "w-2 h-2 rounded-full bg-kmViolet";
    }
    if (txtItem) txtItem.innerText = "Paket 20 Kredit (20 Video / 24 Jam)";
    if (txtHarga) txtHarga.innerText = "Rp 10.000";
    if (txtFee) txtFee.innerText = "Rp 800";
    if (txtTotal) txtTotal.innerText = "Rp 10.800";
    if (btnEksekusi) btnEksekusi.innerHTML = '<span>Bayar Rp 10.800 via QRIS (20 Kredit)</span> &rarr;';
  }
}

async function jalankanBayarKredit() {
  tampilkanNotif("Menghubungkan ke secure payment iPaymu...", "info");

  var userEmail = "";
  if (typeof supa !== 'undefined') {
    try {
      var sessionRes = await supa.auth.getSession();
      userEmail = sessionRes?.data?.session?.user?.email || "";
    } catch(e) {}
  }
  
  if (!userEmail) {
    try {
      var sbData = localStorage.getItem('sb-fybyupwcburndxulqqnn-auth-token');
      if (sbData) {
        var parsed = JSON.parse(sbData);
        userEmail = parsed?.user?.email || "";
      }
    } catch(e) {}
  }

  if (!userEmail) {
    userEmail = prompt("Masukkan email aktif Anda untuk tagihan QRIS:", "");
    if (!userEmail) return tampilkanNotif("Email wajib diisi untuk transaksi!", "error");
  }

  var nominal = 5800;
  var namaItem = "Paket 10 Kredit KiixMotion";
  var jmlKredit = 10;

  if (paketKreditAktif === '2k') {
    nominal = 2800;
    namaItem = "Paket 4 Kredit KiixMotion";
    jmlKredit = 4;
  } else if (paketKreditAktif === '10k') {
    nominal = 10800;
    namaItem = "Paket 20 Kredit KiixMotion";
    jmlKredit = 20;
  }

  fetch('/api/bayar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: userEmail, 
      amount: nominal, 
      name: namaItem, 
      phone: "081122334455",
      tipe: "kredit",
      kredit: jmlKredit
    })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.Success === true || data.Status === 200 || data.Data) {
      tampilkanNotif("Berhasil! Mengarahkan ke pembayaran QRIS...", "sukses");
      setTimeout(function() {
        var paymentLink = (data.Data && data.Data.Url) ? data.Data.Url : data.url;
        if (paymentLink) window.location.href = paymentLink;
        else tampilkanNotif("Gagal membaca link pembayaran iPaymu", "error");
      }, 800);
    } else {
      tampilkanNotif("Gagal membuat transaksi: " + (data.message || data.Message || "Kesalahan iPaymu"), "error");
    }
  })
  .catch(function() {
    tampilkanNotif("Gagal koneksi ke server pembayaran.", "error");
  });
}

async function jalankanBayarVIP() {
  tampilkanNotif("Menghubungkan ke secure payment iPaymu...", "info");

  var userEmail = "";
  if (typeof supa !== 'undefined') {
    try {
      var sessionRes = await supa.auth.getSession();
      userEmail = sessionRes?.data?.session?.user?.email || "";
    } catch(e) {}
  }

  if (!userEmail) {
    userEmail = prompt("Masukkan email aktif Anda untuk tagihan QRIS:", "");
    if (!userEmail) return tampilkanNotif("Email wajib diisi untuk transaksi!", "error");
  }

  fetch('/api/bayar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: userEmail, 
      amount: 35850, 
      name: "Member Pro KiixMotion (25 Hari)", 
      phone: "081122334455",
      tipe: "vip",
      kredit: 0
    })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.Success === true || data.Status === 200 || data.Data) {
      tampilkanNotif("Berhasil! Mengarahkan ke pembayaran QRIS...", "sukses");
      setTimeout(function() {
        var paymentLink = (data.Data && data.Data.Url) ? data.Data.Url : data.url;
        if (paymentLink) window.location.href = paymentLink;
        else tampilkanNotif("Gagal membaca link pembayaran iPaymu", "error");
      }, 800);
    } else {
      tampilkanNotif("Gagal membuat transaksi: " + (data.message || data.Message || "Kesalahan iPaymu"), "error");
    }
  })
  .catch(function() {
    tampilkanNotif("Gagal koneksi ke server pembayaran.", "error");
  });
}

window.prosesBeliVIP = jalankanBayarVIP;
window.prosesBeliKredit = function(nom, krd) {
  if (krd <= 4) pilihPaketKredit('2k');
  else if (krd <= 10) pilihPaketKredit('5k');
  else pilihPaketKredit('10k');
  jalankanBayarKredit();
};

async function cekAksesAdminPool() {
  if (typeof supa === 'undefined') return;
  try {
    const { data: { session } } = await supa.auth.getSession();
    const email = session?.user?.email?.toLowerCase().trim();
    if (email === 'anggraingki@gmail.com') {
      const btnAdminNav = document.getElementById('nav-btn-admin-pool');
      if (btnAdminNav) btnAdminNav.style.display = 'flex';
    }
  } catch (err) {}
}

async function muatDataKolamAdmin() {
  if (typeof supa === 'undefined') return;
  var wadah = document.getElementById('wadah-baris-pool-admin');
  if (!wadah) return;

  wadah.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">Mengambil data dari Supabase...</td></tr>';

  const { data: listAkun, error } = await supa
    .from('runninghub_pool')
    .select('*')
    .order('id', { ascending: false });

  if (error || !listAkun || listAkun.length === 0) {
    wadah.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">Belum ada akun di kolam. Masukkan API key di form atas.</td></tr>';
    updateStatistikPool(0, 0, 0, 0);
    return;
  }

  var total = listAkun.length;
  var idle = listAkun.filter(a => a.status === 'idle').length;
  var busy = listAkun.filter(a => a.status === 'busy').length;
  var habis = listAkun.filter(a => a.status === 'habis').length;
  updateStatistikPool(total, idle, busy, habis);

  var html = '';
  listAkun.forEach(function(a) {
    var keyMasked = a.api_key.substring(0, 8) + '••••••••' + a.api_key.slice(-6);
    
    var badgeStatus = '';
    if (a.status === 'idle') {
      badgeStatus = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">🟢 IDLE</span>';
    } else if (a.status === 'busy') {
      badgeStatus = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">🟡 RENDERING</span>';
    } else {
      badgeStatus = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">🔴 HABIS</span>';
    }

    var tglPakai = a.last_used_at ? new Date(a.last_used_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

    html += `
      <tr class="hover:bg-slate-50/60 transition">
        <td class="py-3 px-3">${badgeStatus}</td>
        <td class="py-3 px-3 font-mono font-bold text-slate-700">${keyMasked}</td>
        <td class="py-3 px-3 font-extrabold tabular-nums ${a.koin < 200 ? 'text-rose-500' : 'text-kmViolet'}">${a.koin || 0} coin</td>
        <td class="py-3 px-3 text-slate-400 text-[11px]">${tglPakai}</td>
        <td class="py-3 px-3 text-right">
          <button onclick="hapusSatuKunciPool(${a.id})" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="Hapus Kunci Ini">
            <i class="ph-bold ph-trash text-base"></i>
          </button>
        </td>
      </tr>
    `;
  });
  wadah.innerHTML = html;
}

function updateStatistikPool(tot, idl, bsy, hbs) {
  var sTot = document.getElementById('stat-pool-total');
  var sIdl = document.getElementById('stat-pool-idle');
  var sBsy = document.getElementById('stat-pool-busy');
  var sHbs = document.getElementById('stat-pool-habis');
  if (sTot) sTot.innerText = tot;
  if (sIdl) sIdl.innerText = idl;
  if (sBsy) sBsy.innerText = bsy;
  if (sHbs) sHbs.innerText = hbs;
}

async function simpanBulkKeysKeSupabase() {
  var area = document.getElementById('in-bulk-keys');
  var btn = document.getElementById('btn-submit-bulk-pool');
  if (!area || !area.value.trim()) return tampilkanNotif('Tempel minimal satu API Key!', 'error');

  var baris = area.value.split('\n').map(k => k.trim()).filter(k => k.length > 10);
  if (baris.length === 0) return tampilkanNotif('Format API key tidak valid!', 'error');

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Cek Saldo & Simpan...'; }

  var dataInsert = [];
  for (var k of baris) {
    var koinAsli = 0;
    try {
      var resSaldo = await fetch('/api/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: k })
      });
      var hasilSaldo = await resSaldo.json();
      if (resSaldo.ok && hasilSaldo) {
        var rawData = hasilSaldo.data || hasilSaldo;
        var c = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.remainCoins;
        if (c !== undefined && c !== null) koinAsli = Number(c);
      }
    } catch (e) {}

    var statusOtomatis = koinAsli >= 200 ? 'idle' : 'habis';
    dataInsert.push({
      api_key: k,
      koin: koinAsli,
      status: statusOtomatis,
      last_used_at: new Date()
    });
  }

  const { error } = await supa
    .from('runninghub_pool')
    .upsert(dataInsert, { onConflict: 'api_key' });

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-upload-simple text-sm"></i> Simpan ke Database Kolam'; }

  if (!error) {
    area.value = '';
    tampilkanNotif(`✓ Berhasil! ${dataInsert.length} API Key dicek & status otomatis aktif.`, 'sukses');
    muatDataKolamAdmin();
    refreshDataKolamAdmin();
  } else {
    tampilkanNotif('Gagal menyimpan: ' + error.message, 'error');
  }
}

async function hapusSatuKunciPool(id) {
  mintaKonfirmasi("Yakin ingin menghapus kunci ini dari kolam?", async function() {
    const { error } = await supa.from('runninghub_pool').delete().eq('id', id);
    if (!error) {
      tampilkanNotif('Kunci berhasil dihapus dari database', 'sukses');
      muatDataKolamAdmin();
    }
  });
}

async function sapuBersihAkunHabis() {
  mintaKonfirmasi("Hapus semua akun yang statusnya 'HABIS' dari database?", async function() {
    const { error } = await supa.from('runninghub_pool').delete().eq('status', 'habis');
    if (!error) {
      tampilkanNotif('Seluruh akun koin habis berhasil dibersihkan!', 'sukses');
      muatDataKolamAdmin();
    }
  });
}

async function refreshDataKolamAdmin() {
  tampilkanNotif('Menyinkronkan saldo seluruh kunci kolam...', 'info');
  const { data: listAkun } = await supa.from('runninghub_pool').select('id, api_key');
  if (!listAkun || listAkun.length === 0) return;

  for (let akun of listAkun) {
    try {
      const res = await fetch('/api/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: akun.api_key })
      });
      const hasil = await res.json();
      if (res.ok && hasil) {
        var rawData = hasil.data || hasil;
        var k = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.remainCoins;
        if (k !== undefined && k !== null) {
          var koinVal = Number(k);
          var statusBaru = koinVal < 200 ? 'habis' : 'idle';
          await supa.from('runninghub_pool').update({ koin: koinVal, status: statusBaru }).eq('id', akun.id);
        }
      }
    } catch (e) {}
  }
  tampilkanNotif('✓ Sinkronisasi saldo kolam selesai!', 'sukses');
  muatDataKolamAdmin();
}

// =========================================================================
// FITUR CHECKER API KEY (LOKAL - KHUSUS ADMIN)
// =========================================================================
var checkerResults = [];

window.jalankanCheckerKeys = async function() {
    var area = document.getElementById('in-checker-keys');
    var btn = document.getElementById('btn-submit-checker');
    var wadah = document.getElementById('wadah-hasil-checker');
    var statAkun = document.getElementById('checker-stat-akun');
    var statKoin = document.getElementById('checker-stat-koin');

    if (!area || !area.value.trim()) {
        if (typeof tampilkanNotif === 'function') tampilkanNotif('Tempel minimal satu API Key buat dicek!', 'error');
        return;
    }

    var baris = area.value.split('\n').map(k => k.trim()).filter(k => k.length > 10);
    if (baris.length === 0) {
        if (typeof tampilkanNotif === 'function') tampilkanNotif('Format API key tidak valid!', 'error');
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph ph-spinner animate-spin text-sm"></i> Mengecek...'; }
    
    if (wadah) wadah.innerHTML = '<div class="text-center text-xs text-slate-500 py-4 font-semibold">Sedang mengecek ' + baris.length + ' akun ke server RunningHub...</div>';
    checkerResults = [];
    var totalKoinDitemukan = 0;

    for (var k of baris) {
        var koinAsli = 0;
        var statusCek = 'gagal';
        try {
            var resSaldo = await fetch('/api/saldo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: k })
            });
            var hasilSaldo = await resSaldo.json();
            if (resSaldo.ok && hasilSaldo) {
                var rawData = hasilSaldo.data || hasilSaldo;
                var c = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.remainCoins;
                if (c !== undefined && c !== null) {
                    koinAsli = Number(c);
                    statusCek = 'sukses';
                    totalKoinDitemukan += koinAsli;
                }
            }
        } catch (e) {
            console.error('Gagal cek key', k, e);
        }

        checkerResults.push({ key: k, koin: koinAsli, status: statusCek });
    }

    if (wadah) wadah.innerHTML = '';
    checkerResults.forEach(function(item) {
        var keyMasked = item.key.substring(0, 8) + '••••••••' + item.key.slice(-6);
        var colorKoin = item.koin >= 478 ? 'text-emerald-600' : (item.koin >= 200 ? 'text-amber-500' : 'text-rose-500');
        var iconStatus = item.status === 'sukses' ? '<i class="ph-fill ph-check-circle text-emerald-500 text-base"></i>' : '<i class="ph-fill ph-x-circle text-rose-500 text-base"></i>';
        
        var el = document.createElement('div');
        el.className = "flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100 shadow-sm hover:border-blue-300 transition group";
        el.innerHTML = `
            <div class="flex items-center gap-3">
                ${iconStatus}
                <span class="font-mono text-xs font-bold text-slate-700">${keyMasked}</span>
            </div>
            <div class="flex items-center gap-4">
                <span class="text-sm font-black ${colorKoin} tabular-nums">${item.koin} <span class="text-[9px] font-bold text-slate-400 uppercase">coin</span></span>
                <button onclick="salinSatuKey('${item.key}')" class="text-blue-400 hover:text-blue-600 transition cursor-pointer" title="Salin Key Lengkap">
                    <i class="ph-bold ph-copy text-sm"></i>
                </button>
            </div>
        `;
        if (wadah) wadah.appendChild(el);
    });

    if (statAkun) statAkun.innerText = checkerResults.length;
    if (statKoin) statKoin.innerText = totalKoinDitemukan;

    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-play text-sm"></i> Cek Saldo Sekarang'; }
    if (typeof tampilkanNotif === 'function') tampilkanNotif('Selesai mengecek ' + checkerResults.length + ' API Key!', 'sukses');
}

window.bersihkanChecker = function() {
    checkerResults = [];
    var area = document.getElementById('in-checker-keys');
    var wadah = document.getElementById('wadah-hasil-checker');
    var statAkun = document.getElementById('checker-stat-akun');
    var statKoin = document.getElementById('checker-stat-koin');

    if (area) area.value = '';
    if (wadah) wadah.innerHTML = '';
    if (statAkun) statAkun.innerText = '0';
    if (statKoin) statKoin.innerText = '0';

    if (typeof tampilkanNotif === 'function') tampilkanNotif('Area checker berhasil dibersihkan', 'info');
}

window.salinSatuKey = function(key) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(key).then(() => {
            if (typeof tampilkanNotif === 'function') tampilkanNotif('API Key disalin!', 'sukses');
        }).catch(() => {
            prompt('Salin teks ini:', key);
        });
    } else {
        prompt('Salin teks ini:', key);
    }
}

const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.target.id === 'wadah-list-history' || mutation.target.id === 'wadah-job-terbaru-dashboard') {
      if (mutation.target.innerHTML.includes('text-slate-700 font-bold')) {
        renderVideoAsliKeGrid();
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", function() {
  var wadahHist = document.getElementById('wadah-list-history');
  var wadahDash = document.getElementById('wadah-job-terbaru-dashboard');
  if (wadahHist) observer.observe(wadahHist, { childList: true, subtree: true });
  if (wadahDash) observer.observe(wadahDash, { childList: true, subtree: true });
  
  if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI();
  cekAksesAdminPool();
  
  setTimeout(function() {
    gantiLayarNav('dashboard');
  }, 500);
});
