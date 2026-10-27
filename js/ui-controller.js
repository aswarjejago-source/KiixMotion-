// ==========================================
// PILAR 2: UI CONTROLLER (FULL VERSION - FINAL FIX)
// File: js/ui-controller.js
// ==========================================

var currentView = 'workbench';
var navLayarAktif = 'dashboard';
var tabAkunAktif = 'runninghub';
var isModePilih = false;
var pendingKonfirmasiFn = null;
var linkTelegramResmi = "https://t.me/+JS435ITO1h0xMWJl";

var paketKreditAktif = '5k';

// -------------------------------------------------------------
// FUNGSI NOTIFIKASI & MODAL GLOBAL
// -------------------------------------------------------------

window.tampilkanNotif = function(pesan, jenis) {
    var wadah = document.getElementById('toast-container');
    if (!wadah) return;
    
    var el = document.createElement('div');
    var warnaBg = 'bg-slate-900 text-white';
    var ikon = 'ℹ️';

    if (jenis === 'error') {
        warnaBg = 'bg-rose-600 text-white';
        ikon = '⚠️';
    } else if (jenis === 'sukses') {
        warnaBg = 'bg-emerald-600 text-white';
        ikon = '✓';
    }

    el.className = 'animate-toast px-5 py-3 rounded-2xl shadow-xl font-bold text-xs sm:text-sm flex items-center gap-2 mb-2 ' + warnaBg;
    el.innerHTML = '<span>' + ikon + '</span> <span>' + pesan + '</span>';
    
    wadah.appendChild(el);
    
    setTimeout(function() {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        el.style.transition = 'all 0.3s ease';
        setTimeout(function() { 
            el.remove(); 
        }, 300);
    }, 4500);
};

window.aturTampilanHalamanUtama = function() {
    var vWorkbench = document.getElementById('view-workbench');
    var navHeader = document.getElementById('main-header-nav');
    
    if (vWorkbench) vWorkbench.style.display = 'block';
    if (navHeader) navHeader.style.display = 'flex';
    
    gantiLayarNav(navLayarAktif);
};

window.mintaKonfirmasi = function(pesan, callbackYa) {
    var modal = document.getElementById('modal-konfirmasi-box');
    var txt = document.getElementById('modal-konfirmasi-teks');
    
    if (!modal || !txt) return;
    
    txt.innerText = pesan;
    pendingKonfirmasiFn = callbackYa;
    modal.style.display = 'flex';
};

window.tutupModalKonfirmasi = function(apakahYa) {
    var modal = document.getElementById('modal-konfirmasi-box');
    if (modal) modal.style.display = 'none';
    
    if (apakahYa && typeof pendingKonfirmasiFn === 'function') {
        pendingKonfirmasiFn();
    }
    pendingKonfirmasiFn = null;
};

window.bukaGrupTelegram = function() {
    window.open(linkTelegramResmi, '_blank');
};

window.bukaModalFormKey = function() {
    var modal = document.getElementById('modal-popup-key');
    var inKey = document.getElementById('in-modal-key');
    
    if (inKey) inKey.value = ''; 
    if (modal) modal.style.display = 'flex';
};

window.tutupModalFormKey = function() {
    var modal = document.getElementById('modal-popup-key');
    if (modal) modal.style.display = 'none';
};

window.togglePanduanKey = function() {
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
};

// -------------------------------------------------------------
// NAVIGASI UTAMA (MEMUAT DATA OTOMATIS SAAT PINDAH TAB)
// -------------------------------------------------------------

window.gantiLayarNav = function(layar) {
    navLayarAktif = layar;
    var ids = [
        'dashboard', 'generate', 'history', 
        'galeri', 'kelola-akun', 'beli-kredit', 'langganan', 'admin-pool'
    ];
    
    ids.forEach(function(id) {
        var el = document.getElementById('layar-' + id);
        var btn = document.getElementById('nav-btn-' + id); 
        
        if (el) {
            el.style.display = (layar === id) ? 'block' : 'none';
        }
        
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
        if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI();
        renderVideoAsliKeGrid();
    }
    
    if (layar === 'generate') {
        setProviderUtama(window.engineProvider || 'kiix');
        renderListAkunDiKelola(); 
    }
    
    if (layar === 'history') {
        renderVideoAsliKeGrid();
    }
    
    if (layar === 'galeri') {
        renderGaleri();
    }
    
    if (layar === 'kelola-akun') {
        renderListAkunDiKelola();
    }
    
    if (layar === 'beli-kredit') {
        if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI();
        pilihPaketKredit(paketKreditAktif || '5k');
    }
    
    if (layar === 'langganan') {
        if (typeof updateStatusMemberUI === 'function') updateStatusMemberUI();
    }
    
    if (layar === 'admin-pool') {
        if (typeof muatDataKolamAdmin === 'function') muatDataKolamAdmin();
    }
};

// -------------------------------------------------------------
// FITUR GENERATE (PILIH ENGINE & BADGE KOIN) - TERMASUK MINIMAX H3
// -------------------------------------------------------------

window.engineProvider = 'kiix';

// FUNGSI GANTI KATEGORI TAB SWITCHER
window.switchKategoriEngine = function(kategori) {
    var btnMotion = document.getElementById('tab-btn-motion');
    var btnMinimax = document.getElementById('tab-btn-minimax');
    var contentMotion = document.getElementById('tab-content-motion');
    var contentMinimax = document.getElementById('tab-content-minimax');
    
    if (kategori === 'motion') {
        if (btnMotion) btnMotion.className = "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 border-kmViolet bg-violet-50 text-kmViolet shadow-sm whitespace-nowrap cursor-pointer";
        if (btnMinimax) btnMinimax.className = "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 border-transparent bg-white border-kmBorder text-slate-500 hover:bg-slate-50 whitespace-nowrap modern-shadow cursor-pointer";
        if (contentMotion) contentMotion.classList.remove('hidden');
        if (contentMinimax) contentMinimax.classList.add('hidden');
        setProviderUtama('kiix');
    } else {
        if (btnMinimax) btnMinimax.className = "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 border-orange-500 bg-orange-50 text-orange-600 shadow-sm whitespace-nowrap cursor-pointer";
        if (btnMotion) btnMotion.className = "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 border-transparent bg-white border-kmBorder text-slate-500 hover:bg-slate-50 whitespace-nowrap modern-shadow cursor-pointer";
        if (contentMinimax) contentMinimax.classList.remove('hidden');
        if (contentMotion) contentMotion.classList.add('hidden');
        setProviderUtama('minimax');
    }
};

window.setProviderUtama = function(prov) {
    window.engineProvider = prov;
    window.engineMode = prov;
    if (typeof engineMode !== 'undefined') {
        engineMode = (prov === 'runninghub') ? 'pro' : prov;
    }
    
    var providers = ['kiix', 'runninghub', 'kling', 'minimax'];
    
    providers.forEach(function(p) {
        let card = document.getElementById('c-prov-' + p);
        let badge = document.getElementById('b-prov-' + p);
        
        if (card) {
            if (p === 'minimax') {
                card.className = "bg-white border border-kmBorder p-5 rounded-2xl cursor-pointer modern-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition";
            } else {
                card.className = "min-w-[220px] sm:min-w-[240px] flex-1 bg-white border border-kmBorder p-5 rounded-2xl cursor-pointer hover:border-violet-300 transition modern-shadow";
            }
        }
        if (badge) {
            badge.style.display = 'none';
        }
    });
    
    let activeCard = document.getElementById('c-prov-' + prov);
    let activeBadge = document.getElementById('b-prov-' + prov);
    
    if (activeCard) {
        if (prov === 'minimax') {
            activeCard.className = "bg-white border-2 border-orange-500 p-5 rounded-2xl cursor-pointer modern-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ring-4 ring-orange-50";
        } else {
            activeCard.className = "min-w-[220px] sm:min-w-[240px] flex-1 bg-white border-2 border-kmViolet p-5 rounded-2xl modern-shadow ring-4 ring-violet-50 cursor-pointer transition";
        }
    }
    if (activeBadge) {
        activeBadge.style.display = 'inline-block';
    }

    let title = document.getElementById('t-engine-title');
    let cost = document.getElementById('t-engine-total');
    let boxAkun = document.getElementById('box-wrap-dropdown-akun');
    
    if (prov === 'kiix') {
        if (title) title.innerText = 'WAN MOTION CONTROL 1080HD';
        if (cost) cost.innerText = '1 Kredit';
        if (boxAkun) boxAkun.style.display = 'none'; 
    } else if (prov === 'runninghub' || prov === 'pro') {
        if (title) title.innerText = 'RUNNINGHUB PRO (WAN)';
        if (cost) cost.innerText = '≈ 478 coin';
        if (boxAkun) boxAkun.style.display = 'block'; 
        updateBadgeKoinGenerate(); 
    } else if (prov === 'kling') {
        if (title) title.innerText = 'KLING 2.6 MOTION CONTROL';
        if (cost) cost.innerText = '1 Coin VIP';
        if (boxAkun) boxAkun.style.display = 'none';
    } else if (prov === 'minimax') {
        if (title) title.innerText = 'MINIMAX H3 MASTER WORKFLOW';
        if (cost) cost.innerText = 'Sesuai Konsumsi';
        if (boxAkun) boxAkun.style.display = 'block';
        updateBadgeKoinGenerate();
    }
};

window.updateBadgeKoinGenerate = function() {
    var drop = document.getElementById('sel-dropdown-akun');
    var badge = document.getElementById('badge-total-saldo-gen');
    
    if (!drop || !badge) return;
    
    var val = drop.value;
    var dbAkun = window.dbAkun || JSON.parse(localStorage.getItem('kiix_akun_local_v1') || '[]');
    
    var selected = dbAkun.find(function(a) { 
        return String(a.id) === String(val); 
    });
    
    if (!selected && dbAkun.length > 0) { 
        selected = dbAkun[0]; 
    }

    if (selected) {
        badge.innerText = selected.saldo + " coin";
        
        if (selected.saldo >= 478) {
            badge.className = "text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg";
        } else {
            badge.className = "text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg";
        }
    } else {
        badge.innerText = "0 coin";
        badge.className = "text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg";
    }
};

// -------------------------------------------------------------
// HISTORY RENDER (DENGAN FALLBACK GANDA)
// -------------------------------------------------------------

window.renderVideoAsliKeGrid = function() {
    var wadahDashboard = document.getElementById('wadah-job-terbaru-dashboard');
    var wadahHistory = document.getElementById('wadah-list-history');
    var txtCounter = document.getElementById('txt-counter-history');
    
    var riwayatLokal = [];
    
    try {
        if (typeof window.riwayatGenerateList !== 'undefined' && window.riwayatGenerateList.length > 0) {
            riwayatLokal = window.riwayatGenerateList;
        } else {
            var dariStorage = localStorage.getItem('kiix_riwayat_gen_v1');
            if (dariStorage) {
                riwayatLokal = JSON.parse(dariStorage);
            }
        }
    } catch (e) {
        riwayatLokal = [];
        console.error("Gagal memuat riwayat", e);
    }

    var dataTerbaru = [];

    if (riwayatLokal.length > 0) {
        dataTerbaru = [...riwayatLokal].reverse();
        if (txtCounter) txtCounter.innerText = riwayatLokal.length + ' tugas';
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
            areaMedia = `
            <video src="${linkVideo}" class="w-full h-full object-cover bg-slate-900" controls preload="metadata" playsinline></video>
            <div class="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm z-10 pointer-events-none">
                <i class="ph ph-check-circle"></i> Selesai
            </div>`;
        } else if (isFailed || (isSelesai && !linkVideo)) {
            var teksError = video.status || "❌ Gagal Dirender Server";
            areaMedia = `
            <div class="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-rose-500 p-4 text-center">
                <i class="ph-fill ph-warning-circle text-4xl mb-2 drop-shadow-md"></i>
                <span class="text-xs sm:text-sm font-bold leading-tight">${teksError}</span>
            </div>`;
        } else {
            var progress = video.progress || 0;
            areaMedia = `
            <div class="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400">
                <i class="ph-fill ph-spinner animate-spin text-3xl text-kmViolet mb-2"></i>
                <span class="text-xs font-bold mb-1">Sedang Memproses Video...</span>
                <span class="text-[10px] text-kmViolet font-bold tabular-nums">${progress}%</span>
            </div>`;
        }

        var tombolDownload = '';
        if (linkVideo) {
            tombolDownload = `
            <a href="${linkVideo}" target="_blank" class="text-slate-400 hover:text-kmViolet transition cursor-pointer" title="Download">
                <i class="ph ph-download-simple text-lg hover:scale-110"></i>
            </a>`;
        }

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
        dataTerbaru.forEach(function(v) { 
            htmlHistory += bikinKartuHTML(v); 
        });
        wadahHistory.innerHTML = htmlHistory;
    }

    if (wadahDashboard) {
        var htmlDashboard = '';
        dataTerbaru.slice(0, 3).forEach(function(v) { 
            htmlDashboard += bikinKartuHTML(v); 
        });
        wadahDashboard.innerHTML = htmlDashboard;
    }
};

window.hapusTugasBerdasarkanId = function(id) {
    mintaKonfirmasi("Yakin ingin menghapus riwayat tugas ini?", function() {
        if (typeof window.riwayatGenerateList !== 'undefined' && window.riwayatGenerateList.length > 0) {
            var findIdx = window.riwayatGenerateList.findIndex(function(t) { 
                return String(t.id) === String(id); 
            });
            
            if (findIdx > -1) {
                if (window.riwayatGenerateList[findIdx].intervalObj) {
                    clearInterval(window.riwayatGenerateList[findIdx].intervalObj);
                }
                window.riwayatGenerateList.splice(findIdx, 1);
                
                if (typeof simpanStorage === 'function') {
                    simpanStorage();
                }
            }
        } else {
            var rwLokal = JSON.parse(localStorage.getItem('kiix_riwayat_gen_v1') || '[]');
            rwLokal = rwLokal.filter(function(t) {
                return String(t.id) !== String(id);
            });
            localStorage.setItem('kiix_riwayat_gen_v1', JSON.stringify(rwLokal));
        }
        
        renderVideoAsliKeGrid();
        tampilkanNotif('Riwayat tugas berhasil dihapus', 'sukses');
    });
};

window.renderLayarHistory = function() { 
    renderVideoAsliKeGrid(); 
};

// -------------------------------------------------------------
// KELOLA AKUN API KEY (LOKAL) & SINKRONISASI
// -------------------------------------------------------------

window.renderListAkunDiKelola = function() {
    var wadah = document.getElementById('wadah-kartu-akun-list');
    var dropAkun = document.getElementById('sel-dropdown-akun');
    
    var dbAkun = JSON.parse(localStorage.getItem('kiix_akun_local_v1') || '[]');
    window.dbAkun = dbAkun;

    if (dbAkun.length === 0) {
        if (wadah) {
            wadah.innerHTML = `
            <div class="text-center py-10 bg-slate-50/50 border border-kmBorder border-dashed rounded-3xl text-slate-400">
                <span class="text-3xl mb-2 block">🔑</span>
                <p class="text-sm font-bold">Belum ada API key terhubung</p>
                <p class="text-xs mt-1">Klik "+ Add Apikey" di atas untuk menambahkan.</p>
            </div>`;
        }
        
        if (dropAkun) {
            dropAkun.innerHTML = '<option value="">(Kosong) Tambah API Key dulu</option>';
            updateBadgeKoinGenerate(); 
        }
        return;
    }

    var html = '';
    var dropHtml = '';
    
    dbAkun.forEach(function(akun) {
        var isAktif = (akun.id === (window.akunAktifId || dbAkun[0].id));
        var maskedKey = akun.key ? (akun.key.substring(0, 8) + '••••••••' + akun.key.slice(-6)) : '••••••••';
        
        html += `
        <div class="bg-white border ${isAktif ? 'border-kmViolet shadow-sm' : 'border-kmBorder'} rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-md">
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">R</div>
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <h4 class="text-sm font-bold text-slate-900">${akun.nama || 'RunningHub Account'}</h4>
                        ${isAktif ? '<span class="px-2 py-0.5 bg-kmViolet/10 text-kmViolet text-[10px] font-black rounded uppercase tracking-wider">Default</span>' : ''}
                    </div>
                    <p class="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">${maskedKey}</p>
                </div>
            </div>
            <div class="flex flex-row items-center gap-2 w-full sm:w-auto">
                <div class="flex-1 sm:flex-none text-left sm:text-right px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p class="text-[9px] uppercase font-bold text-emerald-600 mb-0.5 tracking-wider">Sisa Koin</p>
                    <p class="text-sm font-black text-emerald-700 tabular-nums leading-none">${akun.saldo || 0}</p>
                </div>
                <button onclick="hapusAkunLokal(${akun.id})" class="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition cursor-pointer" title="Hapus Akun">
                    <i class="ph ph-trash text-lg"></i>
                </button>
            </div>
        </div>`;

        dropHtml += `
        <option value="${akun.id}" ${isAktif ? 'selected' : ''}>
            ${akun.nama || 'RunningHub'} - ${akun.saldo || 0} coin
        </option>`;
    });

    if (wadah) wadah.innerHTML = html;
    if (dropAkun) {
        dropAkun.innerHTML = dropHtml;
        updateBadgeKoinGenerate(); 
    }
};

window.hapusAkunLokal = function(id) {
    mintaKonfirmasi("Yakin ingin menghapus API Key ini dari perangkat?", function() {
        var dbAkun = JSON.parse(localStorage.getItem('kiix_akun_local_v1') || '[]');
        
        dbAkun = dbAkun.filter(function(a) {
            return String(a.id) !== String(id);
        });
        
        localStorage.setItem('kiix_akun_local_v1', JSON.stringify(dbAkun));
        window.dbAkun = dbAkun;
        
        renderListAkunDiKelola();
        tampilkanNotif("API Key berhasil dihapus", "sukses");
    });
};

window.simpanAkunBaruDariModal = async function() {
    var inKey = document.getElementById('in-modal-key');
    var btn = document.getElementById('btn-simpan-key');
    
    if (!inKey || !inKey.value.trim()) {
        return tampilkanNotif('API Key tidak boleh kosong!', 'error');
    }
    var newKey = inKey.value.trim();

    var dbAkun = JSON.parse(localStorage.getItem('kiix_akun_local_v1') || '[]');
    
    var exists = dbAkun.find(function(a) { return a.key === newKey; });
    if(exists) {
        return tampilkanNotif('API Key sudah pernah ditambahkan!', 'error');
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Mengecek...';
    }

    try {
        var res = await fetch('/api/saldo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: newKey })
        });
        var hasil = await res.json();
        
        if (res.ok && hasil) {
            var rawData = hasil.data || hasil;
            var c = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.remainCoins;
            var saldo = c !== undefined && c !== null ? Number(c) : 0;

            dbAkun.push({ 
                id: Date.now(), 
                key: newKey, 
                nama: 'RunningHub Account', 
                saldo: saldo 
            });
            
            localStorage.setItem('kiix_akun_local_v1', JSON.stringify(dbAkun));
            window.dbAkun = dbAkun;
            
            tutupModalFormKey();
            renderListAkunDiKelola();
            tampilkanNotif('Berhasil menambahkan API Key!', 'sukses');
        } else {
            tampilkanNotif('API Key tidak valid atau server bermasalah!', 'error');
        }
    } catch(e) {
        tampilkanNotif('Gagal mengecek API Key. Coba lagi nanti.', 'error');
    }

    if (btn) {
        btn.disabled = false;
        btn.innerText = 'Tambah';
    }
};

window.refreshSemuaAkunLokal = async function() {
    var dbAkun = JSON.parse(localStorage.getItem('kiix_akun_local_v1') || '[]');
    
    if (dbAkun.length === 0) {
        return tampilkanNotif('Belum ada API Key terhubung untuk di-refresh.', 'error');
    }
    
    tampilkanNotif('Menyinkronkan saldo koin ke server...', 'info');

    var berhasilsync = 0;
    
    for (let i = 0; i < dbAkun.length; i++) {
        try {
            var res = await fetch('/api/saldo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: dbAkun[i].key })
            });
            
            var hasil = await res.json();
            if (res.ok && hasil) {
                var rawData = hasil.data || hasil;
                var c = rawData.totalCoins ?? rawData.coins ?? rawData.coin ?? rawData.remainCoins;
                
                if (c !== undefined && c !== null) {
                    dbAkun[i].saldo = Number(c);
                    berhasilsync++;
                }
            }
        } catch (e) {
            console.error('Gagal sync akun:', dbAkun[i].key);
        }
    }

    localStorage.setItem('kiix_akun_local_v1', JSON.stringify(dbAkun));
    window.dbAkun = dbAkun;
    
    renderListAkunDiKelola(); 
    
    if (berhasilsync > 0) {
        tampilkanNotif('✓ Saldo berhasil disinkronisasi ulang!', 'sukses');
    } else {
        tampilkanNotif('Gagal menyinkronkan data dengan server RunningHub.', 'error');
    }
};

// -------------------------------------------------------------
// FITUR GALERI MEDIA
// -------------------------------------------------------------

window.unggahKeGaleri = function(input) {
    var galeriList = JSON.parse(localStorage.getItem('kiix_galeri_v1') || '[]');
    
    if (!input.files || !input.files[0]) return;
    
    if (galeriList.length >= 50) {
        return tampilkanNotif('Kapasitas galeri penuh (Maksimal 50 file).', 'error');
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
    mintaKonfirmasi("Yakin ingin menghapus media ini?", function() {
        var galeriList = JSON.parse(localStorage.getItem('kiix_galeri_v1') || '[]');
        
        galeriList = galeriList.filter(function(item) {
            return item.id !== id;
        });
        
        localStorage.setItem('kiix_galeri_v1', JSON.stringify(galeriList));
        renderGaleri();
        tampilkanNotif('File berhasil dihapus.', 'sukses');
    });
};

window.renderGaleri = function() {
    var wadah = document.getElementById('wadah-grid-galeri');
    var txtInfo = document.getElementById('txt-info-kuota-galeri');
    var txtPersen = document.getElementById('txt-persen-kuota');
    
    var galeriList = JSON.parse(localStorage.getItem('kiix_galeri_v1') || '[]');
    
    var totalFoto = galeriList.filter(i => i.type === 'image').length;
    var totalVideo = galeriList.filter(i => i.type === 'video').length;
    
    if (txtInfo) txtInfo.innerText = totalFoto + ' foto · ' + totalVideo + ' video';
    if (txtPersen) txtPersen.innerText = Math.round((galeriList.length / 50) * 100) + '%';

    if (!wadah) return;

    if (galeriList.length === 0) {
        wadah.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400"><p class="text-xs font-semibold">Belum ada file media yang diunggah.</p></div>`;
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

// -------------------------------------------------------------
// BELI KREDIT & LANGGANAN VIP PRO
// -------------------------------------------------------------

window.pilihPaketKredit = function(tipe) {
    paketKreditAktif = tipe;
    
    var btnList = ['2k', '5k', '10k'];
    
    btnList.forEach(function(id) {
        var btn = document.getElementById('btn-kredit-' + id);
        if(btn) {
            btn.className = "p-4 rounded-2xl border border-slate-200 hover:border-violet-300 text-left transition cursor-pointer relative group";
            let dot = btn.querySelector('.rounded-full');
            if (dot) dot.className = "w-2 h-2 rounded-full bg-slate-300";
        }
    });

    var btnAktif = document.getElementById('btn-kredit-' + tipe);
    if(btnAktif) {
        btnAktif.className = "p-4 rounded-2xl border-2 border-kmViolet bg-violet-50/40 text-left transition cursor-pointer relative group shadow-sm";
        let dot = btnAktif.querySelector('.rounded-full');
        if (dot) dot.className = "w-2 h-2 rounded-full bg-kmViolet";
    }

    var txtItem = document.getElementById('txt-kredit-item');
    var txtHarga = document.getElementById('txt-kredit-harga');
    var txtTotal = document.getElementById('txt-kredit-total');
    var btnEksekusi = document.getElementById('btn-eksekusi-kredit');

    if (tipe === '2k') {
        if(txtItem) txtItem.innerText = "Paket 4 Kredit (4 Video / 24 Jam)";
        if(txtHarga) txtHarga.innerText = "Rp 2.000";
        if(txtTotal) txtTotal.innerText = "Rp 2.800";
        if(btnEksekusi) btnEksekusi.innerHTML = '<span>Bayar Rp 2.800 via QRIS (4 Kredit)</span> &rarr;';
    } else if (tipe === '5k') {
        if(txtItem) txtItem.innerText = "Paket 10 Kredit (10 Video / 24 Jam)";
        if(txtHarga) txtHarga.innerText = "Rp 5.000";
        if(txtTotal) txtTotal.innerText = "Rp 5.800";
        if(btnEksekusi) btnEksekusi.innerHTML = '<span>Bayar Rp 5.800 via QRIS (10 Kredit)</span> &rarr;';
    } else if (tipe === '10k') {
        if(txtItem) txtItem.innerText = "Paket 20 Kredit (20 Video / 24 Jam)";
        if(txtHarga) txtHarga.innerText = "Rp 10.000";
        if(txtTotal) txtTotal.innerText = "Rp 10.800";
        if(btnEksekusi) btnEksekusi.innerHTML = '<span>Bayar Rp 10.800 via QRIS (20 Kredit)</span> &rarr;';
    }
};

window.jalankanBayarKredit = async function() {
    tampilkanNotif("Menghubungkan ke secure payment iPaymu...", "info");
    
    var userEmail = prompt("Masukkan email aktif Anda untuk tagihan QRIS:", "");
    if (!userEmail) return tampilkanNotif("Email wajib diisi untuk transaksi!", "error");

    var nominal = 5800;
    var namaItem = "Paket 10 Kredit KiixMotion";
    var jmlKredit = 10;

    if (paketKreditAktif === '2k') {
        nominal = 2800;
        namaItem = "Paket 4 Kredit";
        jmlKredit = 4;
    } else if (paketKreditAktif === '10k') {
        nominal = 10800;
        namaItem = "Paket 20 Kredit";
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
    .then(res => res.json())
    .then(data => {
        if (data.Success || data.Data) {
            window.location.href = data.Data.Url || data.url;
        } else {
            tampilkanNotif("Gagal membuat transaksi", "error");
        }
    })
    .catch(() => {
        tampilkanNotif("Gagal koneksi ke server pembayaran.", "error");
    });
};

window.jalankanBayarVIP = async function() {
    var userEmail = prompt("Masukkan email aktif Anda untuk tagihan QRIS:", "");
    if (!userEmail) return tampilkanNotif("Email wajib diisi untuk transaksi!", "error");

    fetch('/api/bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: userEmail, 
            amount: 35850, 
            name: "Member Pro (25 Hari)", 
            phone: "081122334455",
            tipe: "vip",
            kredit: 0 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.Success || data.Data) {
            window.location.href = data.Data.Url || data.url;
        } else {
            tampilkanNotif("Gagal membuat transaksi", "error");
        }
    })
    .catch(() => {
        tampilkanNotif("Gagal koneksi ke server pembayaran.", "error");
    });
};

window.prosesBeliVIP = jalankanBayarVIP;
window.prosesBeliKredit = function(nom, krd) {
    if (krd <= 4) pilihPaketKredit('2k');
    else if (krd <= 10) pilihPaketKredit('5k');
    else pilihPaketKredit('10k');
    
    jalankanBayarKredit();
};

// -------------------------------------------------------------
// FITUR MASTER POOL API ADMIN (KOLAM CLOUD)
// -------------------------------------------------------------

async function cekAksesAdminPool() {
    if (typeof supa === 'undefined') return;
    try {
        const { data: { session } } = await supa.auth.getSession();
        const email = session?.user?.email?.toLowerCase().trim();
        
        if (email === 'anggraingki@gmail.com') {
            const btnAdminNav = document.getElementById('nav-btn-admin-pool');
            if (btnAdminNav) btnAdminNav.style.display = 'flex';
        }
    } catch (err) {
        console.error("Gagal verifikasi admin pool");
    }
}

window.muatDataKolamAdmin = async function() {
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
        </tr>`;
    });
    
    wadah.innerHTML = html;
};

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

window.simpanBulkKeysKeSupabase = async function() {
    var area = document.getElementById('in-bulk-keys');
    var btn = document.getElementById('btn-submit-bulk-pool');
    
    if (!area || !area.value.trim()) {
        return tampilkanNotif('Tempel minimal satu API Key!', 'error');
    }

    var baris = area.value.split('\n').map(k => k.trim()).filter(k => k.length > 10);
    if (baris.length === 0) {
        return tampilkanNotif('Format API key tidak valid!', 'error');
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Cek Saldo & Simpan...';
    }

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
        } catch (e) {
            console.error('Gagal fetch koin saat bulk insert', e);
        }

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

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-bold ph-upload-simple text-sm"></i> Simpan ke Database Kolam';
    }

    if (!error) {
        area.value = '';
        tampilkanNotif(`✓ Berhasil! ${dataInsert.length} API Key dicek & status otomatis aktif.`, 'sukses');
        muatDataKolamAdmin();
    } else {
        tampilkanNotif('Gagal menyimpan: ' + error.message, 'error');
    }
};

window.hapusSatuKunciPool = async function(id) {
    mintaKonfirmasi("Yakin ingin menghapus kunci ini dari kolam?", async function() {
        const { error } = await supa.from('runninghub_pool').delete().eq('id', id);
        if (!error) {
            tampilkanNotif('Kunci berhasil dihapus dari database', 'sukses');
            muatDataKolamAdmin();
        }
    });
};

window.sapuBersihAkunHabis = async function() {
    mintaKonfirmasi("Hapus semua akun yang statusnya 'HABIS' dari database?", async function() {
        const { error } = await supa.from('runninghub_pool').delete().eq('status', 'habis');
        if (!error) {
            tampilkanNotif('Seluruh akun koin habis berhasil dibersihkan!', 'sukses');
            muatDataKolamAdmin();
        }
    });
};

window.kosongkanSeluruhKolam = async function() {
    mintaKonfirmasi("PERINGATAN NUKLIR: Yakin ingin MENGHAPUS SELURUH AKUN di kolam tanpa terkecuali?", async function() {
        const { error } = await supa.from('runninghub_pool').delete().not('id', 'is', null);
        if (!error) {
            tampilkanNotif('Seluruh akun di kolam berhasil dihapus total!', 'sukses');
            muatDataKolamAdmin();
        }
    });
};

window.refreshDataKolamAdmin = async function() {
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
        } catch (e) {
            console.error('Error saat refresh kunci kolam', e);
        }
    }
    tampilkanNotif('✓ Sinkronisasi saldo kolam selesai!', 'sukses');
    muatDataKolamAdmin();
};

// -------------------------------------------------------------
// CHECKER API KEY (LOKAL - TANPA SIMPAN DB)
// -------------------------------------------------------------

window.jalankanCheckerKeys = async function() {
    var area = document.getElementById('in-checker-keys');
    var btn = document.getElementById('btn-submit-checker');
    var wadah = document.getElementById('wadah-hasil-checker');
    
    if (!area || !area.value.trim()) {
        return tampilkanNotif('Tempel minimal satu API Key buat dicek!', 'error');
    }
    
    var baris = area.value.split('\n').map(k => k.trim()).filter(k => k.length > 10);
    if (baris.length === 0) {
        return tampilkanNotif('Format API key tidak valid!', 'error');
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner animate-spin text-sm"></i> Mengecek...';
    }
    
    if (wadah) {
        wadah.innerHTML = '<div class="text-center text-xs text-slate-500 py-4 font-semibold">Sedang mengecek ' + baris.length + ' akun ke server RunningHub...</div>';
    }

    var totalKoinDitemukan = 0;
    var checkerResults = [];

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
            console.error('Gagal cek key checker lokal', e);
        }
        
        checkerResults.push({ key: k, koin: koinAsli, status: statusCek });
    }

    if (wadah) wadah.innerHTML = '';
    
    checkerResults.forEach(function(item) {
        var keyMasked = item.key.substring(0, 8) + '••••••••' + item.key.slice(-6);
        var colorKoin = item.koin >= 478 ? 'text-emerald-600' : (item.koin >= 200 ? 'text-amber-500' : 'text-rose-500');
        var iconStatus = item.status === 'sukses' ? '<i class="ph-fill ph-check-circle text-emerald-500 text-base"></i>' : '<i class="ph-fill ph-x-circle text-rose-500 text-base"></i>';
        
        var el = document.createElement('div');
        el.className = "flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100 shadow-sm transition";
        el.innerHTML = `
            <div class="flex items-center gap-3">
                ${iconStatus}
                <span class="font-mono text-xs font-bold text-slate-700">${keyMasked}</span>
            </div>
            <div class="flex items-center gap-4">
                <span class="text-sm font-black ${colorKoin} tabular-nums">${item.koin} <span class="text-[9px] font-bold text-slate-400 uppercase">coin</span></span>
                <button onclick="navigator.clipboard.writeText('${item.key}'); tampilkanNotif('API Key Disalin!', 'sukses');" class="text-blue-400 hover:text-blue-600 cursor-pointer">
                    <i class="ph-bold ph-copy text-sm"></i>
                </button>
            </div>
        `;
        if (wadah) wadah.appendChild(el);
    });

    document.getElementById('checker-stat-akun').innerText = checkerResults.length;
    document.getElementById('checker-stat-koin').innerText = totalKoinDitemukan;
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-bold ph-play text-sm"></i> Cek Saldo Sekarang';
    }
};

window.bersihkanChecker = function() {
    document.getElementById('in-checker-keys').value = '';
    document.getElementById('wadah-hasil-checker').innerHTML = '';
    document.getElementById('checker-stat-akun').innerText = '0';
    document.getElementById('checker-stat-koin').innerText = '0';
};

// -------------------------------------------------------------
// EVENT LISTENER AWAL APLIKASI
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function() {
    cekAksesAdminPool();
    
    setTimeout(function() {
        gantiLayarNav('dashboard');
    }, 300);
});
