const WF_ID = "2096475206973194241";
let listAkun = JSON.parse(localStorage.getItem('kiix_accounts') || localStorage.getItem('rh_accounts') || '[]');
let listHistory = JSON.parse(localStorage.getItem('kiix_history') || localStorage.getItem('rh_history') || '[]');
let fileFotoUrl = null, fileVideoUrl = null;

function renderDropdownAkun() {
  const el = document.getElementById('pilihAkun');
  if (!el) return;
  if (!listAkun.length) {
    el.innerHTML = '<option value="">(Belum ada akun, tambahkan di tab Akun)</option>';
    document.getElementById('badge-saldo').innerText = '0 koin';
    return;
  }
  el.innerHTML = listAkun.map((a, i) => `<option value="${i}">${a.nama || 'RunningHub #' + (i + 1)}</option>`).join('');
  updateInfoAkun();
  renderDaftarAkunKelola();
}

function updateInfoAkun() {
  const idx = document.getElementById('pilihAkun').value;
  if (idx !== "" && listAkun[idx]) {
    const text = listAkun[idx].nama || '';
    const match = text.match(/(\d+)\s*koin/i);
    document.getElementById('badge-saldo').innerText = match ? match[1] + ' koin' : 'Aktif';
  }
}

function renderDaftarAkunKelola() {
  const box = document.getElementById('wadahDaftarAkun');
  if (!box) return;
  box.innerHTML = listAkun.map((a, i) => `
    <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
      <div>
        <p class="font-bold text-slate-800">${a.nama}</p>
        <p class="text-[10px] text-slate-400 font-mono">${(a.key || '').slice(0, 8)}••••••••</p>
      </div>
      <button onclick="hapusAkun(${i})" class="text-rose-500 font-bold text-xs">Hapus</button>
    </div>`).join('');
}

function simpanAkunBaru() {
  const nama = document.getElementById('inputNamaAkun').value.trim();
  const key = document.getElementById('inputKeyAkun').value.trim();
  if (!nama || !key) return alert('Nama dan API Key wajib diisi!');
  listAkun.push({ nama, key });
  localStorage.setItem('kiix_accounts', JSON.stringify(listAkun));
  document.getElementById('inputNamaAkun').value = '';
  document.getElementById('inputKeyAkun').value = '';
  renderDropdownAkun();
  alert('Akun berhasil disimpan!');
}

function hapusAkun(i) {
  listAkun.splice(i, 1);
  localStorage.setItem('kiix_accounts', JSON.stringify(listAkun));
  renderDropdownAkun();
}

function pindahTab(tab) {
  ['generate', 'history', 'account', 'dashboard'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tab);
    const nav = document.getElementById(`nav-${t}`);
    if (t === tab) {
      nav.className = 'px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm';
    } else {
      nav.className = 'px-3 py-1.5 rounded-lg text-slate-500 font-medium';
    }
  });
}

async function prosesUnggah(input, jenis) {
  const file = input.files[0];
  if (!file) return;
  const idx = document.getElementById('pilihAkun').value;
  if (idx === "") return alert('Pilih atau tambahkan akun terlebih dahulu di tab Akun!');
  const key = listAkun[idx].key;

  const txt = document.getElementById(`txt-${jenis}`);
  const box = document.getElementById(`box-${jenis}`);
  box.classList.add('border-indigo-500');

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.runninghub.ai/task/openapi/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${key}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const p = Math.round((e.loaded / e.total) * 100);
        txt.innerHTML = `<span class="text-indigo-600">⏳ Mengunggah: ${p}%</span>`;
      }
    };

    const resPromise = new Promise((resolve, reject) => {
      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.code === 0 && res.data) resolve(res.data.fileName || res.data.fileUrl);
          else reject(new Error(res.msg || 'Gagal upload'));
        } catch (err) { reject(err); }
      };
      xhr.onerror = () => reject(new Error('Koneksi upload terputus'));
    });

    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);

    const uploadResult = await resPromise;
    if (jenis === 'foto') fileFotoUrl = uploadResult;
    if (jenis === 'video') fileVideoUrl = uploadResult;

    txt.innerHTML = `<span class="text-emerald-600 font-bold">✓ Terunggah (${(file.size / (1024 * 1024)).toFixed(1)} MB)</span>`;
  } catch (err) {
    txt.innerHTML = `<span class="text-rose-500">✕ Gagal: ${err.message}</span>`;
  }
}

async function mulaiRender() {
  const idx = document.getElementById('pilihAkun').value;
  if (idx === "") return alert('Pilih akun pemotong saldo terlebih dahulu!');
  if (!fileFotoUrl || !fileVideoUrl) return alert('Pastikan Foto Karakter DAN Video Gerakan keduanya sudah selesai diunggah 100%!');

  const akun = listAkun[idx];
  const prompt = document.getElementById('inputPrompt').value.trim() || "cinematic dancing, smooth fluid motion, high details, ultra realistic";
  const btn = document.getElementById('btnGenerate');

  btn.disabled = true;
  btn.innerText = "MENGIRIM TASK KE GPU...";

  // Node input murni MotionFly: 3 (Prompt), 89 (Video), 308 (Foto), 444 (Foto) - Node 426 DIBUANG
  const payload = {
    workflowId: WF_ID,
    nodeInfoList: [
      { nodeId: "3", fieldName: "text", fieldValue: prompt },
      { nodeId: "89", fieldName: "image", fieldValue: fileVideoUrl },
      { nodeId: "308", fieldName: "image", fieldValue: fileFotoUrl },
      { nodeId: "444", fieldName: "image", fieldValue: fileFotoUrl }
    ]
  };

  try {
    const res = await fetch('https://www.runninghub.ai/task/openapi/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${akun.key}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.code === 0 && data.data) {
      const taskId = data.data.taskId;
      listHistory.unshift({
        taskId: taskId,
        apiKey: akun.key,
        status: 'Sedang Render di GPU...',
        videoUrl: null,
        waktu: 'Baru saja'
      });
      localStorage.setItem('kiix_history', JSON.stringify(listHistory));
      renderHistoryList();
      pindahTab('history');
      pantauStatusTask(taskId, akun.key);
    } else {
      alert('Pesan Server RunningHub:\n' + (data.msg || JSON.stringify(data)));
    }
  } catch (err) {
    alert('Koneksi Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "GENERATE VIDEO";
  }
}

function renderHistoryList() {
  const box = document.getElementById('wadahHistory');
  if (!box) return;
  if (!listHistory.length) {
    box.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Belum ada riwayat render.</p>';
    return;
  }
  box.innerHTML = listHistory.map(h => `
    <div class="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-sm">
      <div>
        <p class="font-bold text-slate-800">Wan Motion Control 1080HD <span class="text-[9px] text-slate-400">RunningHub</span></p>
        <p class="text-[10px] text-slate-400 font-mono">ID: ${h.taskId} • ${h.waktu} • ⚡ 478 koin</p>
      </div>
      <div class="flex items-center gap-2">
        ${h.videoUrl ? `
          <a href="${h.videoUrl}" target="_blank" class="px-3 py-1 bg-emerald-600 rounded-lg text-[11px] font-bold text-white shadow-sm">Putar</a>
          <a href="${h.videoUrl}" download class="px-3 py-1 bg-slate-800 rounded-lg text-[11px] font-bold text-white shadow-sm">Download</a>
        ` : `<span class="text-amber-500 font-bold text-[11px]">⏳ ${h.status}</span>`}
      </div>
    </div>`).join('');
}

async function pantauStatusTask(taskId, key) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`https://www.runninghub.ai/task/openapi/outputs?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const json = await res.json();
      if (json.code === 0 && json.data) {
        const status = json.data.taskStatus;
        if (status === 'SUCCESS') {
          clearInterval(interval);
          const url = json.data.fileUrl || (json.data.outputs && json.data.outputs[0]?.fileUrl);
          perbaruiStatus(taskId, 'Selesai', url);
        } else if (status === 'FAILED') {
          clearInterval(interval);
          perbaruiStatus(taskId, 'Gagal Render', null);
        }
      }
    } catch (e) { /* retry */ }
  }, 7000);
}

function perbaruiStatus(taskId, st, url) {
  listHistory = listHistory.map(h => h.taskId === taskId ? { ...h, status: st, videoUrl: url } : h);
  localStorage.setItem('kiix_history', JSON.stringify(listHistory));
  renderHistoryList();
}

function hapusSemuaHistory() {
  if (confirm('Hapus semua riwayat render?')) {
    listHistory = [];
    localStorage.setItem('kiix_history', JSON.stringify([]));
    renderHistoryList();
  }
}

window.onload = () => {
  renderDropdownAkun();
  renderHistoryList();
  listHistory.filter(h => !h.videoUrl && h.status.includes('Sedang')).forEach(h => pantauStatusTask(h.taskId, h.apiKey));
};
