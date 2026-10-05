// ==========================================
// CCTV PEMANTAUAN (FINAL FIX: NANGKEP FAILED & ERROR CODE 500)
// ==========================================
function pantauTaskRunningHub(tugas, apiKey) {
  if (tugas.selesai) return; 
  if (!tugas.progress) tugas.progress = 0; 
  if (!tugas.cekCount) tugas.cekCount = 0;

  if (tugas.intervalObj) clearInterval(tugas.intervalObj);

  var cekInterval = setInterval(async function() {
    tugas.intervalObj = cekInterval;

    if (tugas.selesai) {
        clearInterval(cekInterval);
        return;
    }

    tugas.cekCount++;
    if (tugas.cekCount > 90) { // 15 Menit Timeout
        clearInterval(cekInterval);
        tugas.status = "Gagal (Timeout)"; 
        tugas.selesai = true;
        tugas.progress = 100;
        simpanStorage();
        if (typeof renderLayarHistory === 'function' && navLayarAktif === 'history') renderLayarHistory();
        return;
    }

    try {
      var resStatus = await fetch('/api/outputs', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ taskId: tugas.id, apiKey: apiKey })
      });
      
      if (!resStatus.ok) return; 
      
      var jsonStatus = await resStatus.json();
      var stringData = JSON.stringify(jsonStatus);
      var cleanString = stringData.toUpperCase().replace(/\s/g, '');

      // 1. KALO ADA FILE MP4 = MUTLAK SUKSES
      if (cleanString.includes('.MP4')) {
        clearInterval(cekInterval);
        tugas.status = "Selesai"; 
        tugas.selesai = true;
        tugas.progress = 100; 
        
        var vidUrl = null;
        var match = stringData.match(/https?:\/\/[^"'\s]+\.mp4/i);
        if (match) vidUrl = match[0];
        
        tugas.videoUrl = vidUrl;
        simpanStorage();
        if (typeof renderLayarHistory === 'function' && navLayarAktif === 'history') renderLayarHistory();
        
        if (vidUrl) tampilkanNotif('✓ Render sukses! Video ditarik.', 'sukses');
        else tampilkanNotif('❌ Sukses tapi link kosong!', 'error');
        return;
      }
      
      // 2. KALO STATUS FAILED ATAU ERRORCODE BUKAN KOSONG/0 = MUTLAK GAGAL
      var isServerFailed = false;
      if (cleanString.includes('"STATUS":"FAILED"') || cleanString.includes('"TASKSTATUS":"FAILED"')) {
        isServerFailed = true;
      }
      // Nangkep errorCode seperti "500" dari screenshot lu
      if (jsonStatus.errorCode && jsonStatus.errorCode !== null && jsonStatus.errorCode !== "0" && jsonStatus.errorCode !== 0) {
        isServerFailed = true;
      }
      if (jsonStatus.code !== undefined && jsonStatus.code !== 0 && jsonStatus.code !== 200) {
        isServerFailed = true;
      }

      if (isServerFailed) {
        clearInterval(cekInterval);
        tugas.status = "Gagal Dirender"; 
        tugas.selesai = true;
        tugas.progress = 100;
        simpanStorage();
        if (typeof renderLayarHistory === 'function' && navLayarAktif === 'history') renderLayarHistory();
        tampilkanNotif('❌ Render dibatalkan / gagal di server!', 'error');
        return;
      }
      
      // 3. SELAIN ITU = MASIH JALAN AMAN
      if (tugas.progress < 95) {
        tugas.progress += Math.floor(Math.random() * 3) + 2; 
      }
      simpanStorage();
      if (typeof renderLayarHistory === 'function' && navLayarAktif === 'history') renderLayarHistory();

    } catch (err) { 
      // Jaringan ngadat
    }
  }, 10000); 
}
