async function mulaiProsesGenerate() {
  var targetAkun = (engineProvider === 'roboneo') ? akunRoboneo : akunRunningHub;
  if (engineProvider !== 'kiix' && targetAkun.length === 0) return tampilkanNotif('Hubungkan akun di menu Kelola Akun terlebih dahulu!', 'error');
  var sel = document.getElementById('sel-dropdown-akun'), idx = sel ? sel.value : "";
  var akunAktif = (idx === "random" || idx === "") ? targetAkun[0] : targetAkun[parseInt(idx, 10)];
  
  if (!urlBahanFoto || !urlBahanVideo) return tampilkanNotif('Foto dan Video keduanya harus selesai diunggah!', 'error');
  var btn = document.getElementById('btn-submit-generate');
  if (btn) { btn.disabled = true; btn.innerText = "⚡ MENGIRIM KE GPU..."; }
  var taskIdAsli = null;

  if (engineProvider === 'runninghub') {
    try {
      // ==========================================
      // RACIKAN NODE WORKFLOW (API PAYLOAD)
      // ==========================================
      var nodeParams = [
        { nodeId: "30", fieldName: "image", fieldValue: urlBahanFoto }, // Masukin foto referensi lu
        { nodeId: "33", fieldName: "video", fieldValue: urlBahanVideo }, // Masukin video target durasi & gerak
        { nodeId: "271", fieldName: "value", fieldValue: "true" }, // SAKLAR WAJIB: Memaksa mode ganti karakter (Face/Body Replace) aktif
        { nodeId: "454", fieldName: "value", fieldValue: "false" } // SAKLAR ANTI-NGELES: Mematikan Multi-Reference biar gak masuk ke jalur bypass/fallback
      ];
      
      var res = await fetch('https://www.runninghub.ai/task/openapi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + akunAktif.key },
        body: JSON.stringify({ workflowId: RUNNINGHUB_WORKFLOW_ID, apiKey: akunAktif.key, nodeInfoList: nodeParams })
      });
      
      var textRes = await res.text();
      var data;
      try { data = textRes ? JSON.parse(textRes) : null; } catch(err) { throw new Error("Format server gak valid."); }

      if (data && (data.code === 0 || data.data) && (data.data?.taskId || data.taskId)) { 
        taskIdAsli = data.data?.taskId || data.taskId; 
        tampilkanNotif('Tugas berhasil dikirim ke GPU! ID: ' + taskIdAsli, 'sukses');
      } else { 
        tampilkanNotif('Gagal RunningHub: ' + (data ? (data.msg || JSON.stringify(data)) : 'Respon kosong'), 'error');
        if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; } return; 
      }
    } catch (e) { 
      tampilkanNotif('Proses Gagal: ' + e.message, 'error'); 
      if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; } return; 
    }
  }

  var tugasBaru = {
    id: taskIdAsli || ("RH-" + Date.now().toString().slice(-6)),
    key: akunAktif.key, model: "Wan Motion Control", prov: "RunningHub",
    tgl: "Baru saja", biaya: "≈ 478 coin", videoUrl: null,
    status: "Sedang Render di GPU...", selesai: false, progress: 10
  };
  
  riwayatGenerateList.unshift(tugasBaru); simpanStorage(); gantiLayarNav('history');
  if (btn) { btn.innerText = "GENERATE VIDEO"; btn.disabled = false; }
  if (taskIdAsli) pantauTaskRunningHub(tugasBaru, akunAktif.key);
}

// ==========================================
// KODINGAN PENARIK VIDEO (STRICT FILTER)
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

      var resStatus = await fetch('https://www.runninghub.ai/task/openapi/outputs?taskId=' + tugas.id, { headers: { 'Authorization': 'Bearer ' + apiKey } });
      var textBalasan = await resStatus.text();
      var jsonStatus = JSON.parse(textBalasan);
      var src = jsonStatus.data || jsonStatus;
      
      if (src) {
        var st = (src.status || src.taskStatus || "").toUpperCase();
        if (st === "SUCCESS" || st === "FINISHED" || st === "DONE") {
          clearInterval(cekInterval);
          tugas.status = "Selesai"; 
          tugas.selesai = true;
          tugas.progress = 100; 
          
          var vidUrl = null;
          var namaBahanRef = urlBahanVideo ? urlBahanVideo.split('/').pop().split('?')[0] : "";
          var outputsObj = src.outputs || (src.data && src.data.outputs);
          
          // TARIKAN UTAMA: Langsung todong Node 490 (VideoHelperSuite) dari screenshot lu
          if (outputsObj) {
            var node490 = outputsObj["490"] || outputsObj[490];
            if (node490) {
              var targetItem = Array.isArray(node490) ? node490[0] : node490;
              if (targetItem) {
                var link490 = targetItem.fileUrl || targetItem.url || targetItem.video || targetItem.path;
                // FILTER MUTLAK: Pastikan link hasil BUKAN link video referensi lu
                if (link490 && (!namaBahanRef || link490.indexOf(namaBahanRef) === -1)) {
                  vidUrl = link490;
                }
              }
            }
          }
          
          tugas.videoUrl = vidUrl;
          simpanStorage();
          if (navLayarAktif === 'history') renderLayarHistory();
          
          if (vidUrl) {
            tampilkanNotif('✓ Render video AI berhasil ditarik ke web! ID: ' + tugas.id, 'sukses');
          } else {
            tampilkanNotif('❌ Render dibatalkan dari GPU (AI gagal ngebaca foto baru lu).', 'error');
          }
        } else if (st === "FAILED" || st === "ERROR") {
          clearInterval(cekInterval);
          tugas.status = "Gagal Dirender"; 
          tugas.selesai = true;
          tugas.progress = 100;
          simpanStorage();
          if (navLayarAktif === 'history') renderLayarHistory();
          tampilkanNotif('❌ Render gagal dari server GPU!', 'error');
        }
      }
    } catch (err) { console.warn("CCTV Polling tertunda:", err); }
  }, 7000);
}
