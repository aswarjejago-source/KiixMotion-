// ==========================================
// PILAR 1: DATABASE & STATE MANAGEMENT
// File: js/database.js
// Fungsi: Mengelola variabel utama dan LocalStorage
// ==========================================

var akunRunningHub = [];
var akunRoboneo = [];
var riwayatGenerateList = [];
var currentUserEmail = "aswar@kiixmotion.com"; 

// Fungsi untuk menarik data dari penyimpanan browser
function muatStorage() {
  try {
    var sRH = localStorage.getItem('kiix_rh_vFINAL');
    var sRB = localStorage.getItem('kiix_rb_vFINAL');
    var sHist = localStorage.getItem('kiix_hist_vFINAL');
    
    if (sRH) akunRunningHub = JSON.parse(sRH);
    if (sRB) akunRoboneo = JSON.parse(sRB);
    if (sHist) riwayatGenerateList = JSON.parse(sHist);
  } catch (e) {
    console.error("Gagal muat penyimpanan:", e);
  }
}

// Fungsi untuk menyimpan data terbaru ke penyimpanan browser
function simpanStorage() {
  try {
    localStorage.setItem('kiix_rh_vFINAL', JSON.stringify(akunRunningHub));
    localStorage.setItem('kiix_rb_vFINAL', JSON.stringify(akunRoboneo));
    localStorage.setItem('kiix_hist_vFINAL', JSON.stringify(riwayatGenerateList));
  } catch (e) {
    console.error("Gagal simpan penyimpanan:", e);
  }
}
