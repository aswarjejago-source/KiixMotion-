// ==========================================
// KODINGAN CCTV DENGAN NOTIFIKASI TRANSPARAN (DIJAMIN KETAUHAN)
// ==========================================
function pantauTaskRunningHub(tugas, apiKey) {
  if (!tugas.progress) tugas.progress = 10; 

  var cekInterval = setInterval(async function() {
    try {
      if (tugas.progress < 90) {
        tugas.progress += Math.floor(Math.random() * 12) + 5;
        if (tugas.progress > 90) tugas.progress = 90;
        simpanStorage();
        if (navLayarAktif === 'history') renderLayarHistory();
      }

      var resStatus = await fetch('https://www.runninghub.ai/task/openapi/outputs?taskId=' + tugas.id, { 
        headers: { 'Authorization': 'Bearer ' + apiKey } 
      });
      
      var textBalasan = await resStatus.text();
      var jsonStatus = JSON.parse(textBalasan);
      
      // Ambil status langsung dari root respons JSON
      var st = (jsonStatus.status || jsonStatus.taskStatus || jsonStatus.data?.status || "").toUpperCase();
      
      // PERINGATAN: Notifikasi ini bakal bunyi tiap 7 detik ngasih tau status aslinya ke layar HP lu!
      // Kalau udah tau statusnya apa, nanti kita gampang eksekusinya.
      console.log("CCTV Check ID " + tugas.id + " -> Status Server: " + st);

      if (st === "SUCCESS" || st === "FINISHED" || st === "0" || st === "DONE") {
        clearInterval(cekInterval);
        tugas.status = "Selesai"; 
        tugas.selesai = true;
        tugas.progress = 100; 
        
        var vidUrl = null;
        var laciResults = jsonStatus.results || jsonStatus.data?.results;
        
        if (laciResults && Array.isArray(laciResults)) {
          for (var i = 0; i < laciResults.length; i++) {
            var item = laciResults[i];
            if (item && item.url && item.url.includes('.mp4')) {
              vidUrl = item.url;
              break; 
            }
          }
        }
        
        tugas.videoUrl = vidUrl;
        simpanStorage();
        if (navLayarAktif === 'history') renderLayarHistory();
        
        if (vidUrl) {
          tampilkanNotif('✓ Berhasil ditarik! Video siap diputar.', 'sukses');
        } else {
          tampilkanNotif('❌ Status SUCCESS tapi link .mp4 tidak ketemu!', 'error');
        }
      } else if (st === "FAILED" || st === "ERROR" || st === "-1") {
        clearInterval(cekInterval);
        tugas.status = "Gagal Dirender"; 
        tugas.selesai = true;
        tugas.progress = 100;
        simpanStorage();
        if (navLayarAktif === 'history') renderLayarHistory();
        tampilkanNotif('❌ Render gagal dari server GPU!', 'error');
      } else {
        // Kalau masih proses (misal RUNNING / QUEUED), kasih tau tipis di notif biar lu tahu CCTV-nya jalan
        tampilkanNotif('⏳ Status server saat ini: ' + (st || 'MENUNGGU'), 'info');
      }
    } catch (err) { 
      console.warn("CCTV Error:", err);
      tampilkanNotif('⚠️ Gagal ngetok server: ' + err.message, 'error');
    }
  }, 7000); 
}
