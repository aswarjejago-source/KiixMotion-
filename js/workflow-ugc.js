// =========================================================
// FILE: js/workflow-ugc.js
// INGKI AI STUDIOPRO v6.1 — 100% FULL EDITION (PURE JS)
// Seluruh Prompt, Identity Lock, 8 Mode & Seluruh Input Utuh
// =========================================================

(function () {
  var STORAGE_KEY_UGC = 'kiix_ugc_gemini_key';
  var GENERATIVE_MODEL = "gemini-2.5-flash-image-preview";
  var TEXT_MODEL = "gemini-2.5-flash-preview-09-2025";
  var TTS_MODEL = "gemini-2.5-flash-preview-tts";

  // --- PROMPT ENGINE LOGIC ASLI (100% UTUH) ---
  var IDENTITY_LOCK = "CRITICAL IDENTITY LOCK: The person MUST have the EXACT same face, gender, facial structure, hair style (e.g., if hair is down it stays down, if tied it stays tied), skin tone, and body proportions as the base model reference. This is the exact same person. Do NOT change their gender, identity, or ethnicity. Clone their physical appearance perfectly.";

  var MODE_BACKGROUNDS = {
    ugc: [
      'Kamar Kosan Aesthetic (Lampu Warm White)',
      'Warkop Kekinian (Lampu Kuning Hangat)',
      'Teras Depan Rumah Cluster',
      'Kafe Aesthetic (Sore Hari)',
      'Lorong Minimarket',
      'Kabin Mobil Siang Hari'
    ],
    affiliate: [
      'Kamar Kosan Aesthetic (Lampu Warm White)',
      'Warkop Kekinian (Lampu Kuning Hangat)',
      'Teras Depan Rumah Cluster',
      'Kafe Aesthetic (Sore Hari)',
      'Lorong Minimarket',
      'Kabin Mobil Siang Hari'
    ],
    commercial: [
      'Studio Setup Polos (Latar Putih Bersih)',
      'Meja Marmer Elegan (Lampu Studio Cerah)',
      'Latar Pastel Estetik Minimalis',
      'Podium Display Produk Mewah',
      'Set Ruang Tamu Skandinavia Modern'
    ],
    mirror: [
      'Kamar Estetik (Cermin Full Body)',
      'Kamar Mandi Mewah (Cermin Wastafel)',
      'Fitting Room Mall (Cahaya Terang)',
      'Lift Aesthetic (Cermin Full)',
      'Studio Minimalis (Cermin Bulat Besar)'
    ],
    pov: [
      'Meja Kerja Kayu Jati (Suasana Kantor)',
      'Kasur Sprei Motif Lokal (Unboxing Paket)',
      'Di Atas Jok Motor Matic (Jalanan Komplek)',
      'Di Balik Setir Mobil (Background Jalanan)',
      'Meja Kafe Estetik (Dekat Jendela)'
    ]
  };

  var VOICES = [
    { id: 'Puck', name: 'Budi (Pria)' },
    { id: 'Kore', name: 'Ayu (Wanita)' },
    { id: 'Charon', name: 'Rio (Pria)' },
    { id: 'Zephyr', name: 'Indra (Pria)' },
    { id: 'Fenrir', name: 'Dedi (Pria Berat)' }
  ];

  var TONES = [
    'Profesional', 'Antusias', 'Meyakinkan', 'Santai', 'Edukatif',
    'Humor', 'Inspiratif', 'Serius', 'Dramatis'
  ];

  var UGC_GENDERS = ['Laki-laki', 'Perempuan'];
  var UGC_AGES = ['Bayi', 'Anak-anak', 'Remaja', 'Dewasa', 'Lansia'];
  var UGC_COUNTRIES = ['Indonesia', 'Korea Selatan', 'Jepang', 'China', 'Thailand', 'Timur Tengah', 'India', 'Eropa / Kaukasia', 'Amerika Latin', 'Afrika', 'Amerika Serikat'];
  var UGC_SKIN_TONES = ['Putih Pucat (Fair)', 'Kuning Langsat', 'Sawo Matang', 'Cokelat Gelap', 'Hitam Manis'];
  var UGC_HAIR_STYLES = ['Lurus Panjang', 'Bergelombang', 'Keriting (Curly)', 'Pendek Rapi', 'Cepak / Botak', 'Diikat Kuda (Ponytail)', 'Bob / Sebahu', 'Cepol (Bun)'];
  var UGC_HAIR_COLORS = ['Hitam Alami', 'Cokelat Gelap', 'Pirang (Blonde)', 'Merah Maroon', 'Abu-abu / Silver', 'Warna-warni (Highlight)'];
  var UGC_RATIOS = [
    { label: 'Portrait (9:16)', value: '9:16' },
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Landscape (16:9)', value: '16:9' },
    { label: 'Instagram (4:5)', value: '3:4' }
  ];

  var MODES = [
    { id: 'ugc', title: 'Influencer Character', icon: 'ph-device-mobile', desc: 'Buat Karakter Terbaikmu disini' },
    { id: 'affiliate', title: 'Affiliate Creator', icon: 'ph-video-camera', desc: 'Gaya promosi kasual ala kreator TikTok/Reels, sangat natural' },
    { id: 'commercial', title: 'Commercial', icon: 'ph-package', desc: 'Kualitas studio profesional, bersih dan tajam' },
    { id: 'mirror', title: 'Mirror Check', icon: 'ph-camera', desc: 'Gaya mirror selfie, estetika OOTD di depan kaca' },
    { id: 'pov', title: 'POV Hand Review', icon: 'ph-hand', desc: 'Sudut pandang orang pertama (First-person view)' },
    { id: 'tts', title: 'Text To Voice Over', icon: 'ph-microphone', desc: 'Buat Voice Over AI gratis dengan intonasi natural kualitas studio' },
    { id: 'sosmed', title: 'Sosmed Desk', icon: 'ph-pen-nib', desc: 'Buat caption & hashtag viral otomatis dari judul singkat' },
    { id: 'carousel', title: 'Carousel Product', icon: 'ph-stack', desc: 'Buat konten microblog/carousel slide-by-slide bersambung' }
  ];

  var RATIOS = [
    { label: 'Portrait', sub: '9:16', value: '9:16' },
    { label: 'Square', sub: '1:1', value: '1:1' },
    { label: 'Landscape', sub: '16:9', value: '16:9' }
  ];

  var SCENE_COUNTS = [4, 8, 12];

  // --- STATE LENGKAP ---
  var state = {
    ugcApiKey: localStorage.getItem(STORAGE_KEY_UGC) || '',
    isKeyPanelOpen: !localStorage.getItem(STORAGE_KEY_UGC),
    view: 'mode-selection',
    selectedMode: null,

    modelImage: null,
    productImage: null,
    clothingImage: null,
    productName: '',
    productDesc: '',
    dynamicBackgrounds: MODE_BACKGROUNDS.ugc.slice(),

    bgType: 'custom',
    customBg: 'Latar Hitam Aksen Hijau Mewah (Premium Studio)',

    isAnalyzingProduct: false,
    isProductConfirmed: false,

    config: {
      background: MODE_BACKGROUNDS.ugc[0],
      ratio: '9:16',
      scenes: 4,
      ugcStyle: 'Handheld'
    },

    isGenerating: false,
    generatedImages: [],
    sceneLoadings: {},
    scenePrompts: {},
    previewImage: null,
    copiedStates: {},

    isAudioStudioOpen: false,
    isAudioStudioMinimized: false,
    voScript: '',
    voDuration: '15s',
    voVoice: VOICES[0].id,
    voTone: TONES[1],
    voAudioUrl: null,
    isGeneratingVOScript: false,
    isGeneratingVOAudio: false,

    sosmedTitle: '',
    sosmedPlatform: 'TikTok',
    sosmedResult: '',
    isGeneratingSosmed: false,
    copiedSosmed: false,

    carImage: null,
    carTemplate: 'Testimonial / Review',
    carSlides: 5,
    carBrand: '',
    carUsername: '',
    carProductName: '',
    carCategory: '',
    carDesc: '',
    carBenefit: '',
    carTarget: '',
    carVisual: 'Natural Lifestyle',
    carColor: 'Warm',
    carTone: 'Friendly / Casual',
    carPlatform: 'Instagram',
    carRatio: '1:1 (Square)',
    carCTA: 'Order Sekarang',
    isGeneratingCarousel: false,
    carouselProgress: 0,
    carouselResults: [],

    ugcGender: UGC_GENDERS[1],
    ugcAge: UGC_AGES[3],
    ugcCountry: UGC_COUNTRIES[0],
    ugcSkin: UGC_SKIN_TONES[1],
    ugcHairStyle: UGC_HAIR_STYLES[0],
    ugcHairColor: UGC_HAIR_COLORS[0],
    ugcRatio: UGC_RATIOS[0].value,

    ugcGeneratedImage: null,
    ugcDetailImage: null,
    isGeneratingUgc: false,
    isGeneratingUgcDetail: false,

    isVideoGeneratorsOpen: false,
    isDownloadingZip: false
  };

  function notify(msg, type) {
    if (typeof tampilkanNotif === 'function') {
      tampilkanNotif(msg, type || 'info');
    } else {
      alert(msg);
    }
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureKey() {
    var k = (state.ugcApiKey || '').trim();
    if (!k) {
      state.isKeyPanelOpen = true;
      renderApp();
      notify('Pasang API Key Google AI Studio kamu dulu di kotak atas Workflow UGC!', 'error');
      return null;
    }
    return k;
  }

  // --- UTILS ASLI (100% UTUH) ---
  var fetchWithRetry = async function (url, options) {
    var delays = [1000, 2000, 4000, 8000, 16000];
    for (var i = 0; i <= delays.length; i++) {
      try {
        var response = await fetch(url, options);
        if (response.ok) return response;
        if (i === delays.length) return response;
      } catch (error) {
        if (i === delays.length) throw error;
      }
      if (i < delays.length) {
        await new Promise(function (res) { setTimeout(res, delays[i]); });
      }
    }
  };

  var playClick = function () {};

  var safeCopyToClipboard = function (text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error('Fallback copy failed', err); }
    document.body.removeChild(textArea);
  };

  var processImageForDownload = function (base64, ratioStr) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        var targetRatio;
        if (ratioStr === '16:9') targetRatio = 16 / 9;
        else if (ratioStr === '9:16') targetRatio = 9 / 16;
        else if (ratioStr === '4:5 (Portrait)' || ratioStr === '4:5') targetRatio = 4 / 5;
        else if (ratioStr === '3:4') targetRatio = 3 / 4;
        else targetRatio = 1;

        var srcRatio = img.width / img.height;
        if (Math.abs(srcRatio - targetRatio) < 0.05) {
          resolve(base64);
          return;
        }

        var renderWidth, renderHeight, offsetX, offsetY;
        if (srcRatio > targetRatio) {
          renderHeight = img.height;
          renderWidth = img.height * targetRatio;
          offsetX = (img.width - renderWidth) / 2;
          offsetY = 0;
        } else {
          renderWidth = img.width;
          renderHeight = img.width / targetRatio;
          offsetX = 0;
          if (targetRatio > 1) { offsetY = (img.height - renderHeight) / 2; }
          else { offsetY = (img.height - renderHeight) * 0.1; }
        }

        canvas.width = Math.floor(renderWidth);
        canvas.height = Math.floor(renderHeight);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = base64;
    });
  };

  var writeString = function (view, offset, string) {
    for (var i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  var base64ToWavUrl = function (base64PCM) {
    var binaryString = window.atob(base64PCM);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    var sampleRate = 24000;
    var numChannels = 1;
    var bitsPerSample = 16;
    var blockAlign = numChannels * (bitsPerSample / 8);
    var byteRate = sampleRate * blockAlign;
    var dataSize = bytes.length;

    var buffer = new ArrayBuffer(44 + dataSize);
    var view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    var pcmData = new Uint8Array(buffer, 44);
    pcmData.set(bytes);

    var blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  var getModeLogic = function (modeId, index, productName, productDesc, background, ugcStyle) {
    if (!ugcStyle) ugcStyle = 'Handheld';
    var subjectPrompt = "";
    var negPrompt = "";
    var cameraLogic = "";
    var motionCamera = "";
    var lipSyncLogic = "AMBIENT: Mouth closed or natural breathing, no talking.";

    switch (modeId) {
      case 'ugc':
      case 'affiliate':
        if (ugcStyle === 'Vlog') {
          cameraLogic = "Shot on iPhone 15 Pro Max front camera. Raw unedited vlog style. Wide angle lens, harsh directional sunlight or strong room light. Zero post-processing.";
          motionCamera = "Smooth handheld tracking shot, natural forward movement. Model walking and talking.";
        } else if (ugcStyle === 'Tripod') {
          cameraLogic = "Shot on iPhone 15 Pro Max mounted on a simple tripod. Raw unedited smartphone photo, single harsh directional light source creating distinct shadows, authentic everyday creator setup.";
          motionCamera = "Perfectly static camera on a tripod, no movement.";
        } else {
          cameraLogic = "HANDHELD SELFIE STYLE. Shot on iPhone 15 Pro Max front camera. Candid framing, hard flash or harsh direct sunlight, authentic raw social media snapshot.";
          motionCamera = "Slight natural handheld camera shake.";
        }

        subjectPrompt = `RAW AUTHENTIC UGC PHOTO (${cameraLogic.split('.')[0]}). Model facing camera naturally. Candid mid-sentence expression. Model casually interacting with ${productName} (${productDesc}) in an everyday setting. CRITICAL: Extremely realistic human skin texture, visible pores, subtle blemishes, unedited natural look. Single harsh light casting distinct, realistic shadows for 3D depth. Real-world lived-in background, no studio setup.`;
        negPrompt = "studio lighting, softbox, flat lighting, professional photography, DSLR, perfect smooth plastic skin, beauty filter, airbrushed, over-polished, cinematic lighting, 3d render, illustration.";
        lipSyncLogic = "LIP-SYNC: Model is speaking, mouth moving precisely to dialogue: '[SCRIPT_SCENE_TERSEBUT]'.";
        break;

      case 'commercial':
        cameraLogic = "Professional high-end commercial product photography. Shot on Hasselblad medium format. Single harsh directional spotlight, deep striking shadows, crisp sharp details, highly polished catalog aesthetic, 8k resolution.";
        subjectPrompt = `AWARD-WINNING COMMERCIAL SHOT. Masterpiece photography. Model looking pristine and perfectly styled, elegantly presenting ${productName} (${productDesc}). The product is heroically displayed with distinct shadows for 3D dimensionality, high contrast, and hyper-realistic textures. Clean, aesthetic background.`;
        negPrompt = "Amateur, smartphone photo, messy background, low quality, flat lighting, softbox, grainy, blurry, casual everyday lighting, distorted, bad anatomy, ugly, candid, snapshot, text, watermark.";
        motionCamera = "Smooth cinematic slider movement, slow motion, showcasing the product elegantly.";
        lipSyncLogic = "LIP-SYNC: Professional commercial delivery, smiling while speaking dialogue: '[SCRIPT_SCENE_TERSEBUT]'.";
        break;

      case 'mirror':
        cameraLogic = "Authentic mirror selfie. Shot on iPhone 15 Pro. Harsh directional room light or hard flash creating deep shadows, photorealistic.";
        subjectPrompt = `RAW MIRROR SELFIE PHOTO. Model standing in front of a mirror taking a mirror selfie with a smartphone. Model is stylishly showcasing ${productName} (${productDesc}). Trendy OOTD aesthetic. Real skin texture, unedited look. Single harsh light creating bold 3D dimensionality. Mirror reflection visible.`;
        negPrompt = "Flat lighting, soft ambient light, TV commercial look, amateur, basic white background, 3d render, illustration, not a mirror selfie, missing phone.";
        motionCamera = "Slight natural handheld camera shake, mimicking a mirror selfie recording.";
        lipSyncLogic = "AMBIENT: Casual posing in the mirror, natural breathing, no talking.";
        break;

      case 'pov':
        cameraLogic = "Authentic everyday first-person POV, shot on an iPhone 15, looking down, harsh directional lighting casting distinct hand shadows, photorealistic.";
        subjectPrompt = `RAW FIRST-PERSON POV SHOT. Authentic everyday lifestyle. Only hands visible naturally holding or unboxing ${productName} (${productDesc}). Shot from user's eye-level looking down at hands. Single harsh directional light, distinct hard shadows. NO FACES, NO BODIES. Real skin texture, highly detailed macro focus on product. ABSOLUTELY NO TEXT OR UI.`;
        negPrompt = "Face, head, hair, eyes, mouth, neck, torso, legs, feet, full body, flat lighting, over-rendered, artificial studio lighting, highly polished professional shot, 3D render, illustration, painting, text, typography, watermark, UI.";
        motionCamera = "Authentic first-person POV, slight natural smartphone camera shake, looking down. Pair of hands naturally interacting with the product.";
        break;

      default:
        cameraLogic = "Standard high quality camera setup.";
        subjectPrompt = `High quality photorealistic shot of model with ${productName} (${productDesc}).`;
        negPrompt = "Distorted, blurry, illustration, 3d.";
        motionCamera = "Static.";
        break;
    }

    return { subjectPrompt, negPrompt, cameraLogic, motionCamera, lipSyncLogic };
  };

  var getPromptForScene = function (sceneData) {
    if (!sceneData) return "";
    var contextLogic = "";
    if (sceneData.voActive) {
      if (sceneData.isBRoll) {
        contextLogic = `NARRATIVE VOICE-OVER: '${sceneData.voText}'. Product remains the main focus.`;
      } else {
        contextLogic = `LIP-SYNC: Model is speaking, mouth moving precisely to dialogue: '${sceneData.voText}'.`;
      }
    } else {
      contextLogic = sceneData.isBRoll ? "AMBIENT: No human visible, purely product focused." : "AMBIENT: Mouth closed or natural breathing, no talking.";
    }
    return `PROMPT: ${sceneData.videoMotion} CAMERA: ${sceneData.videoCamera} DETAILS: Photorealistic high-fidelity video generation. Maintain strict consistency with the provided image reference. CONTEXT: ${contextLogic} ENVIRONMENT: ${sceneData.activeBackground}. NEGATIVE: distortion, morphing, bad hands, text overlays.`;
  };

  // --- API & GENERATION FUNCTIONS ASLI (100% UTUH) ---
  async function analyzeProductImage(base64Image) {
    var apiKey = ensureKey();
    if (!apiKey) return;

    state.isAnalyzingProduct = true;
    state.productName = "Sedang menganalisis...";
    state.productDesc = "AI sedang mengidentifikasi detail produk...";
    renderApp();

    try {
      var imageBase64 = base64Image.split(',')[1];
      var modeTitle = (state.selectedMode && state.selectedMode.title) || 'Komersial';
      var systemPrompt = `
        Tugas Anda adalah menganalisis gambar produk dan mengembalikan HANYA format JSON valid.
        1. "productName": Identifikasi produk, maksimal 3 kata (Bahasa Indonesia).
        2. "productDesc": Deskripsi SANGAT RINGKAS (kategori, merek, warna/ciri menonjol).
        3. "backgrounds": Array berisi 7 rekomendasi latar/background yang eksklusif & estetik untuk sesi ${modeTitle} produk tersebut di Indonesia.
        
        Contoh output:
        {
          "productName": "Sepatu Lari Nike",
          "productDesc": "Sepatu lari Nike Air Max warna putih dan biru.",
          "backgrounds": ["Trek Lari Senayan", "Jalanan Sudirman", "Studio Putih", "Teras Cafe", "Ruang Tamu Estetik", "Track Urban", "Taman Kota"]
        }
        `;

      var payload = {
        contents: [{
          parts: [
            { text: systemPrompt },
            { inlineData: { mimeType: "image/png", data: imageBase64 } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      };

      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        var result = await response.json();
        var text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          var data = JSON.parse(text);
          state.productName = data.productName || "Produk Terdeteksi";
          state.productDesc = data.productDesc || "Detail produk.";
          var baseBgs = state.selectedMode ? MODE_BACKGROUNDS[state.selectedMode.id] : MODE_BACKGROUNDS.ugc;
          if (data.backgrounds && Array.isArray(data.backgrounds) && data.backgrounds.length > 0) {
            var mergedBackgrounds = Array.from(new Set([...data.backgrounds, ...baseBgs]));
            state.dynamicBackgrounds = mergedBackgrounds;
            state.config.background = data.backgrounds[0] || mergedBackgrounds[0];
            state.bgType = 'preset';
          } else {
            state.dynamicBackgrounds = baseBgs.slice();
            state.config.background = baseBgs[0];
          }
        } else {
          state.productName = "Produk Manual";
          state.productDesc = "Isi manual";
        }
      } else {
        state.productName = "Produk Manual";
        state.productDesc = "Isi manual";
      }
    } catch (error) {
      console.error("Product analysis error:", error);
      state.productName = "Produk Manual";
      state.productDesc = "Gagal memuat AI. Silakan isi manual.";
      var baseBgsFallback = state.selectedMode ? MODE_BACKGROUNDS[state.selectedMode.id] : MODE_BACKGROUNDS.ugc;
      state.dynamicBackgrounds = baseBgsFallback.slice();
      state.config.background = baseBgsFallback[0];
    } finally {
      state.isAnalyzingProduct = false;
      renderApp();
    }
  }

  async function generateScripts() {
    var apiKey = ensureKey();
    var toneInstruction = "Tone: Profesional, jernih, persuasif.";
    var narrativeArc = "Follow a logical 6-act narrative arc: context -> problem -> discovery -> interaction -> transformation -> resolution.";

    var modeId = state.selectedMode && state.selectedMode.id;
    if (modeId === 'ugc' || modeId === 'affiliate') {
      toneInstruction = "Tone: Sangat natural, ngobrol santai seperti UGC TikTok/Reels sungguhan, tidak terkesan membaca script, gunakan bahasa sehari-hari yang sangat membumi.";
      narrativeArc = "Follow a highly organic, natural TikTok/Reels style narrative: casual hook -> relatable problem -> introducing product as an everyday find -> showing real usage -> genuine reaction -> soft recommendation.";
    } else if (modeId === 'commercial') {
      toneInstruction = "Tone: Elegan, profesional, sangat meyakinkan seperti iklan TV premium.";
    } else if (modeId === 'mirror') {
      toneInstruction = "Tone: Stylish, trendy, fokus pada penampilan (OOTD) dan kepercayaan diri (Mirror Selfie style).";
    } else if (modeId === 'pov') {
      toneInstruction = "Tone: Review langsung, fokus pada detail produk, praktis, dan interaktif.";
    }

    var prompt = `Generate a JSON object with a single key 'scripts' containing an array of precisely ${state.config.scenes} strings for a storyboard about ${state.productName} (${state.productDesc}). ${narrativeArc} IMPORTANT: Use Bahasa Indonesia. ${toneInstruction} EXACT DURATION: Each script string MUST take exactly 6 to 8 seconds to speak. To achieve this, write STRICTLY between 18 and 25 words per string. Do not make it too short (< 15 words) or too long (> 25 words).`;

    var payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    try {
      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        var result = await response.json();
        var text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        var data = JSON.parse(text);
        if (data.scripts && data.scripts.length > 0) {
          return data.scripts;
        }
      }
    } catch (err) {
      console.error("Script gen error", err);
    }

    return Array.from({ length: state.config.scenes }).map(function (_, i) {
      return `Scene ${i + 1}: Narasi default untuk ${state.productName}.`;
    });
  }

  async function generateUgcInfluencer() {
    var apiKey = ensureKey();
    if (!apiKey) return;

    playClick();
    state.isGeneratingUgc = true;
    state.ugcGeneratedImage = null;
    state.ugcDetailImage = null;
    state.view = 'ugc-result';
    renderApp();

    var prompt = `RAW AUTHENTIC SMARTPHONE PHOTO of a ${state.ugcAge} ${state.ugcGender} influencer/model. Nationality/Ethnicity: ${state.ugcCountry}. Skin tone: ${state.ugcSkin}. Hair style: ${state.ugcHairStyle}. Hair color: ${state.ugcHairColor}. Looking confidently at the camera. Extremely detailed real human skin texture, natural imperfections, visible pores. Casual, highly aesthetic everyday background. Single natural light source casting realistic shadows. UNEDITED authentic social media snapshot style. 
      NEGATIVE: 3d render, cartoon, illustration, anime, deformed, plastic skin, professional studio setup, flat lighting, text, watermark.`;

    var payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], aspectRatio: state.ugcRatio }
    };

    try {
      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GENERATIVE_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        var result = await response.json();
        var base64Output = result.candidates?.[0]?.content?.parts?.find(function (p) { return p.inlineData; })?.inlineData?.data;
        if (base64Output) {
          state.ugcGeneratedImage = `data:image/png;base64,${base64Output}`;
        }
      } else {
        var err = await response.json().catch(function () { return {}; });
        notify('Gagal generate: ' + ((err.error && err.error.message) || response.status), 'error');
      }
    } catch (err) {
      console.error("UGC Influencer Gen Error", err);
    } finally {
      state.isGeneratingUgc = false;
      renderApp();
    }
  }

  async function generateUgcDetailing() {
    var apiKey = ensureKey();
    if (!apiKey || !state.ugcGeneratedImage) return;

    playClick();
    state.isGeneratingUgcDetail = true;
    renderApp();

    var base64Model = state.ugcGeneratedImage.split(',')[1];
    var prompt = `[CRITICAL: EXACT IDENTITY MATCH] Character Design Reference Sheet Grid. Use the provided reference image to create a highly detailed photo grid layout of THIS EXACT SAME PERSON'S face. 
      The grid MUST include these exact angles: 
      1. Extreme macro close-up of the eyes.
      2. Close-up of the nose and cheeks.
      3. Full front face portrait.
      4. Left side profile face.
      5. Right side profile face.
      Styling: Photorealistic, ultra-detailed skin texture, clean studio white background for the grid layout itself.
      NEGATIVE: different person, altered facial features, illustration, drawing, text, watermarks, not a grid, messy layout.`;

    var payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: base64Model } }
        ]
      }],
      generationConfig: { responseModalities: ["IMAGE"], aspectRatio: "16:9" }
    };

    try {
      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GENERATIVE_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        var result = await response.json();
        var base64Output = result.candidates?.[0]?.content?.parts?.find(function (p) { return p.inlineData; })?.inlineData?.data;
        if (base64Output) {
          state.ugcDetailImage = `data:image/png;base64,${base64Output}`;
        }
      }
    } catch (err) {
      console.error("UGC Detailing Gen Error", err);
    } finally {
      state.isGeneratingUgcDetail = false;
      renderApp();
    }
  }

  async function generateVisual() {
    var apiKey = ensureKey();
    if (!apiKey) return;

    playClick();
    state.isGenerating = true;
    state.generatedImages = new Array(state.config.scenes).fill(null);
    state.sceneLoadings = {};
    state.scenePrompts = {};
    state.copiedStates = {};
    state.view = 'result';
    renderApp();

    try {
      var activeBackground = state.bgType === 'custom' ? (state.customBg || 'Studio Foto Polos') : state.config.background;
      var scriptsArray = await generateScripts();
      var selectedModeId = state.selectedMode && state.selectedMode.id;

      var generateSingleScene = async function (index) {
        try {
          var base64Model = state.modelImage ? state.modelImage.split(',')[1] : null;
          var scriptText = scriptsArray[index] || `Scene ${index + 1}`;
          var isBRoll = (index % 3 === 2) && (index !== state.config.scenes - 1);

          var role = isBRoll ? "B-ROLL DETAIL" : `ACT ${index + 1}`;
          if (index === 0) role = "HOOK";
          if (index === state.config.scenes - 1) role = "CTA";

          var modeParams = getModeLogic(selectedModeId, index, state.productName, state.productDesc, activeBackground, state.config.ugcStyle);

          var finalSubjectPrompt = modeParams.subjectPrompt;
          var finalNegPrompt = modeParams.negPrompt;
          var diffusionPrompt = "";
          var videoMotion = modeParams.motionCamera;
          var videoCamera = modeParams.cameraLogic;

          if (isBRoll) {
            if (selectedModeId === 'ugc' || selectedModeId === 'affiliate') {
              finalSubjectPrompt = `RAW LIFESTYLE B-ROLL PHOTO. Casual close-up of ${state.productName} (${state.productDesc}) held casually by hands. Shot on iPhone 15 Pro Max. Background: ${activeBackground}. Single harsh directional light creating strong distinct shadows. CRITICAL: Match the exact gender, skin tone, and characteristics of the Base Model reference for the hands. Real human skin texture, visible pores. NO FACES, NO BODIES. Unedited, raw, candid.`;
              finalNegPrompt = "Human face, eyes, mouth, floating product, opposite gender hands, mismatched hands, masculine hands on female, overly stylized studio lighting, flat lighting, artificial look, 3d render, DSLR, softbox, professional macro, smooth plastic skin.";
              videoMotion = "Slight natural handheld camera shake, showcasing the product.";
              videoCamera = "Smartphone camera, close up.";
            } else if (selectedModeId === 'commercial') {
              finalSubjectPrompt = `PREMIUM STUDIO B-ROLL. Masterpiece macro close-up of ${state.productName} (${state.productDesc}). Focus on premium texture and material details. Background: ${activeBackground}. Dramatic commercial lighting with a single harsh spotlight, distinct shadows, elegant reflections, 8k resolution. NO HUMAN FACES.`;
              finalNegPrompt = "Human face, eyes, mouth, messy background, low quality, flat lighting, grainy, amateur, everyday lighting, blurry.";
              videoMotion = "Smooth macro pan/slide over the product surface.";
              videoCamera = "Macro Lens, sharp focus, high-end commercial style.";
            } else if (selectedModeId === 'mirror') {
              finalSubjectPrompt = `RAW MIRROR SELFIE B-ROLL. Close-up of ${state.productName} (${state.productDesc}) reflected in a mirror. Held casually. Background: ${activeBackground}. Harsh directional room light creating distinct shadows, highly detailed textures. NO FACES.`;
              finalNegPrompt = "Human face, flat lighting, lack of shadows, overexposed, clean commercial look, 3d render.";
              videoMotion = "Slight handheld shake, focusing on the product in the mirror.";
              videoCamera = "Smartphone camera, mirror reflection close up.";
            }
          }

          var globalNeg = ", wrong gender, opposite sex, different person, wrong hair style, different clothing, altered outfit, missing clothes, wrong hands, mismatched hands, text, words, letters, typography, watermark, signature, logo, brand name, subtitles, captions, text overlays, UI elements, illustration, painting, cartoon, anime, 3d render, CGI, unreal engine, deformed, bad anatomy, distorted, different face, morphed body, flat lighting, soft ambient light, lack of shadows, AI generated look, synthetic, plastic, generic AI face, overly smooth, midjourney style, washed out";
          if (['ugc', 'affiliate', 'pov', 'mirror'].includes(selectedModeId)) {
            globalNeg += ", flawless perfect lighting, professional photography, softbox, studio flash, plastic skin";
          }
          finalNegPrompt += globalNeg;

          var rolePrefix = "PHOTOGRAPHY MASTERCLASS TASK:";
          var styling = "Hyper-realistic color processing. Single harsh directional light source creating deep, hard shadows and bold 3D dimensionality. ABSOLUTELY NO TEXT OR WATERMARKS.";
          var realismLaws = "MANDATORY: Must look like a real, actual photograph. Ultra-detailed, lifelike. NOT AI GENERATED. Include natural photographic imperfections and high-contrast depth. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";

          if (['ugc', 'affiliate', 'pov', 'mirror'].includes(selectedModeId)) {
            rolePrefix = "RAW SMARTPHONE PHOTO TASK:";
            styling = "Authentic raw aesthetic. Single harsh directional light (like direct sunlight or hard smartphone flash) casting distinct, hard shadows for realistic depth. Shot on iPhone. ABSOLUTELY NO TEXT OR WATERMARKS.";
            realismLaws = "AUTHENTIC UGC REALISM: Must look EXACTLY like an unedited iPhone photo posted directly to social media. ZERO AI VIBE. CRITICAL: Highly detailed real human skin texture, visible pores, natural imperfections, distinct harsh lighting contrast. NO soft studio lights, NO beauty filters. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
          } else if (selectedModeId === 'commercial') {
            rolePrefix = "HIGH-END COMMERCIAL PHOTOGRAPHY TASK:";
            styling = "Premium catalog aesthetic, razor-sharp details. Single harsh spotlight creating dramatic, deep shadows and striking 3D dimensionality. ABSOLUTELY NO TEXT OR WATERMARKS.";
          }

          var base64ProductRaw = state.productImage ? state.productImage.split(',')[1] : null;
          var base64Clothing = state.clothingImage ? state.clothingImage.split(',')[1] : null;
          var hasModelActive = base64Model && selectedModeId !== 'pov';

          var refInfo = "";
          var payloadParts = [];
          var refInfoArray = [];
          var imageIndex = 1;

          if (hasModelActive) {
            if (isBRoll) {
              refInfoArray.push(`Image ${imageIndex} = Base Model (Use ONLY for matching exact gender, skin tone, and vibe for the hands holding the product. NO FACES IN FINAL IMAGE).`);
              payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
              imageIndex++;
            } else {
              refInfoArray.push(`Image ${imageIndex} = Base Model (CRITICAL: Clone this exact face, gender, hair style, and body).`);
              payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
              imageIndex++;

              if (base64Clothing) {
                refInfoArray.push(`Image ${imageIndex} = Clothing Reference (CRITICAL: The model MUST wear this EXACT outfit. Do not alter color, shape, or design).`);
                payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Clothing } });
                imageIndex++;
              }
            }
          }

          if (base64ProductRaw) {
            refInfoArray.push(`Image ${imageIndex} = Product Reference (The EXACT Product).`);
            payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
            imageIndex++;
          }

          if (refInfoArray.length > 0) {
            refInfo = `[CRITICAL] REFERENCE IMAGES: ${refInfoArray.join(" ")} `;
          }

          var currentIdentityLock = (hasModelActive && !isBRoll) ? IDENTITY_LOCK : "";
          finalNegPrompt += ", different face, altered identity, unrecognizable person, random face";

          diffusionPrompt = `${refInfo}${rolePrefix} Scene ${index + 1}. ${scriptText}. ${styling} ${modeParams.cameraLogic}. ${finalSubjectPrompt} ENVIRONMENT: ${activeBackground}. ${realismLaws} ${currentIdentityLock} NEGATIVE: ${finalNegPrompt} Technical: ${state.config.ratio} format.`;

          payloadParts.push({ text: diffusionPrompt });

          var payload = {
            contents: [{ parts: payloadParts }],
            generationConfig: { responseModalities: ["IMAGE"], aspectRatio: state.config.ratio }
          };

          var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GENERATIVE_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response || !response.ok) {
            var errorText = response ? await response.text() : 'No response';
            throw new Error(`Generation failed: ${errorText}`);
          }

          var result = await response.json();
          var base64Output = result.candidates?.[0]?.content?.parts?.find(function (p) { return p.inlineData; })?.inlineData?.data;

          if (base64Output) {
            var imgSrc = `data:image/png;base64,${base64Output}`;
            var defaultVoActive = !isBRoll && (selectedModeId !== 'pov');

            state.generatedImages[index] = {
              src: imgSrc,
              role: role,
              action: finalSubjectPrompt,
              scriptHint: scriptText,
              videoMotion: videoMotion,
              videoCamera: videoCamera,
              activeBackground: activeBackground,
              isBRoll: isBRoll,
              voActive: defaultVoActive,
              voText: scriptText
            };
            renderApp();
          }
        } catch (err) {
          console.error(`Scene ${index} failed:`, err);
        }
      };

      for (var i = 0; i < state.config.scenes; i++) {
        await generateSingleScene(i);
      }
    } catch (err) {
      console.error(err);
    } finally {
      state.isGenerating = false;
      renderApp();
    }
  }

  async function regenerateSingleScene(index) {
    var apiKey = ensureKey();
    if (!apiKey) return;

    playClick();
    var revisionInstruction = state.scenePrompts[index] || "";
    var originalScenario = state.generatedImages[index];
    if (!originalScenario) return;

    var activeBackground = state.bgType === 'custom' ? (state.customBg || 'Studio Foto Polos') : state.config.background;
    var selectedModeId = state.selectedMode && state.selectedMode.id;

    state.sceneLoadings[index] = true;
    renderApp();

    try {
      var base64Model = state.modelImage ? state.modelImage.split(',')[1] : null;
      var base64ProductRaw = state.productImage ? state.productImage.split(',')[1] : null;
      var base64Clothing = state.clothingImage ? state.clothingImage.split(',')[1] : null;

      var hasModelActive = base64Model && selectedModeId !== 'pov';
      var currentIdentityLock = (hasModelActive && !originalScenario.isBRoll) ? IDENTITY_LOCK : "";

      var revisionNegPrompt = "wrong gender, opposite sex, different person, wrong hair style, different clothing, altered outfit, wrong hands, mismatched hands, different face, altered identity, unrecognized person, random face, morphed body, text, words, letters, typography, watermark, signature, logo, brand name, subtitles, captions, text overlays, UI elements, illustration, painting, cartoon, 3d render, CGI, unreal engine, deformed, distorted, flat lighting, soft ambient light, lack of shadows, AI generated look, synthetic, plastic, generic AI face, overly smooth, midjourney style";
      if (['ugc', 'affiliate', 'pov', 'mirror'].includes(selectedModeId)) {
        revisionNegPrompt += ", flawless perfect lighting, cinematic movie shot, professional photography, DSLR, 8k, high res, softbox, studio flash, plastic skin, beauty filter";
      }

      var rolePrefix = "PHOTOGRAPHY MASTERCLASS TASK:";
      var realismLaws = "MANDATORY: Must look like a real, actual photograph. Ultra-detailed, lifelike. NOT AI GENERATED. Include natural photographic imperfections and high-contrast depth with single harsh directional lighting. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
      if (['ugc', 'affiliate', 'pov', 'mirror'].includes(selectedModeId)) {
        rolePrefix = "RAW SMARTPHONE PHOTO TASK:";
        realismLaws = "AUTHENTIC UGC REALISM: Must look EXACTLY like an unedited iPhone photo. ZERO AI VIBE. CRITICAL: Highly detailed real human skin texture, visible pores. Single harsh directional light (like direct sunlight or hard flash) casting distinct, hard shadows for realistic depth. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
      } else if (selectedModeId === 'commercial') {
        rolePrefix = "HIGH-END COMMERCIAL PHOTOGRAPHY TASK:";
        realismLaws = "MANDATORY: Premium catalog aesthetic. Single harsh spotlight creating dramatic, deep shadows and striking 3D dimensionality. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
      }

      var refInfo = "";
      var payloadParts = [];
      var refInfoArray = [];
      var imageIndex = 1;

      if (hasModelActive) {
        if (originalScenario.isBRoll) {
          refInfoArray.push(`Image ${imageIndex} = Base Model (Use ONLY for matching exact gender, skin tone, and vibe for the hands. NO FACES IN FINAL IMAGE).`);
          payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
          imageIndex++;
        } else {
          refInfoArray.push(`Image ${imageIndex} = Base Model (CRITICAL: Clone this exact face, gender, hair style, and body).`);
          payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
          imageIndex++;

          if (base64Clothing) {
            refInfoArray.push(`Image ${imageIndex} = Clothing Reference (CRITICAL: The model MUST wear this EXACT outfit. Do not alter color or design).`);
            payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Clothing } });
            imageIndex++;
          }
        }
      }

      if (base64ProductRaw) {
        refInfoArray.push(`Image ${imageIndex} = Product Reference (The EXACT Product).`);
        payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
        imageIndex++;
      }

      if (refInfoArray.length > 0) {
        refInfo = `[CRITICAL] REFERENCE IMAGES: ${refInfoArray.join(" ")} `;
      }

      var systemPrompt = `
      ${refInfo}
      ${rolePrefix} - REVISION MODE.
      Target: Regenerate Scene ${index + 1} (${originalScenario.role}).
      Product: ${state.productName} (${state.productDesc})
      User Instruction: ${revisionInstruction || "Improve lighting and composition."}
      Keep original action: ${originalScenario.action}. Background: ${activeBackground}.
      ${realismLaws}
      ${currentIdentityLock}
      CRITICAL NEGATIVE: ${revisionNegPrompt}.
      `;

      payloadParts.push({ text: systemPrompt });

      var payload = {
        contents: [{ parts: payloadParts }],
        generationConfig: { responseModalities: ["IMAGE"], aspectRatio: state.config.ratio }
      };

      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GENERATIVE_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response && response.ok) {
        var result = await response.json();
        var base64Output = result.candidates?.[0]?.content?.parts?.find(function (p) { return p.inlineData; })?.inlineData?.data;
        if (base64Output) {
          state.generatedImages[index].src = `data:image/png;base64,${base64Output}`;
          state.scenePrompts[index] = "";
        }
      }
    } catch (err) {
      console.error("Scene regeneration error:", err);
    } finally {
      state.sceneLoadings[index] = false;
      renderApp();
    }
  }

  async function handleDownloadAllZip() {
    playClick();
    state.isDownloadingZip = true;
    renderApp();
    try {
      var JSZip = window.JSZip;
      if (!JSZip) {
        await new Promise(function (resolve, reject) {
          var script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          script.onload = function () { resolve(); };
          script.onerror = reject;
          document.head.appendChild(script);
        });
        JSZip = window.JSZip;
      }

      var zip = new JSZip();

      for (var i = 0; i < state.generatedImages.length; i++) {
        var sceneData = state.generatedImages[i];
        if (!sceneData || !sceneData.src) continue;

        var folderName = `Scene_0${i + 1}`;
        var folder = zip.folder(folderName);

        var croppedBase64DataUrl = await processImageForDownload(sceneData.src, state.config.ratio);
        var base64Data = croppedBase64DataUrl.split(',')[1];
        folder.file(`${folderName}_Image.png`, base64Data, { base64: true });

        var promptText = getPromptForScene(sceneData);
        folder.file(`${folderName}_Prompt.txt`, promptText);
      }

      var content = await zip.generateAsync({ type: 'blob' });
      var blobUrl = window.URL.createObjectURL(content);
      var link = document.createElement('a');
      link.href = blobUrl;
      link.download = `INGKI_AI_STUDIOPRO_Semua_Scene_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { window.URL.revokeObjectURL(blobUrl); }, 1000);
    } catch (err) {
      console.error("Failed to generate ZIP", err);
    } finally {
      state.isDownloadingZip = false;
      renderApp();
    }
  }

  async function handleGenerateVOScript() {
    var apiKey = ensureKey();
    if (!apiKey) return;

    playClick();
    state.isGeneratingVOScript = true;
    renderApp();

    var prompt = `Buatkan naskah master voiceover gaya ${(state.selectedMode && state.selectedMode.title) || 'Komersial'} untuk ${state.productName || 'Produk'}. Durasi: ${state.voDuration}. Bahasa Indonesia. Tuliskan naskahnya saja langsung tanpa tambahan judul, markdown, atau penjelasan.`;

    var payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    try {
      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response && response.ok) {
        var result = await response.json();
        var text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) state.voScript = text.trim();
      }
    } catch (err) {
      console.error("Master VO Script gen error", err);
    } finally {
      state.isGeneratingVOScript = false;
      renderApp();
    }
  }

  async function handleGenerateVOAudio() {
    var apiKey = ensureKey();
    if (!apiKey || !state.voScript) return;

    playClick();
    state.isGeneratingVOAudio = true;
    state.voAudioUrl = null;
    renderApp();

    var payload = {
      contents: [{
        parts: [{ text: `Bacakan dengan nada ${state.voTone}: ${state.voScript}` }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: state.voVoice
            }
          }
        }
      }
    };

    try {
      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response && response.ok) {
        var result = await response.json();
        var base64PCM = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64PCM) {
          state.voAudioUrl = base64ToWavUrl(base64PCM);
        }
      }
    } catch (err) {
      console.error("Audio generation failed:", err);
    } finally {
      state.isGeneratingVOAudio = false;
      renderApp();
    }
  }

  async function handleGenerateSosmed() {
    var apiKey = ensureKey();
    if (!apiKey || !state.sosmedTitle) return;

    playClick();
    state.isGeneratingSosmed = true;
    state.sosmedResult = "";
    state.copiedSosmed = false;
    renderApp();

    var prompt = `Buatkan caption/deskripsi postingan untuk platform ${state.sosmedPlatform} yang menarik, engaging, copywriting memikat, dan berpotensi viral dengan topik: "${state.sosmedTitle}". 
      Gunakan bahasa Indonesia kekinian. Beri spasi/paragraf yang rapi dan enak dibaca. Berikan Call to Action (CTA) di bagian akhir caption.
      Setelah caption, berikan 15 hashtag yang sangat relevan dan trending.`;

    var payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        var result = await response.json();
        var text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) state.sosmedResult = text.trim();
      } else {
        state.sosmedResult = "Gagal membuat deskripsi. Silakan coba lagi.";
      }
    } catch (err) {
      console.error("Sosmed gen error", err);
      state.sosmedResult = "Terjadi kesalahan jaringan.";
    } finally {
      state.isGeneratingSosmed = false;
      renderApp();
    }
  }

  async function handleGenerateCarousel() {
    var apiKey = ensureKey();
    if (!apiKey) return;

    playClick();
    state.isGeneratingCarousel = true;
    state.carouselResults = new Array(state.carSlides).fill(null);
    state.view = 'carousel-result';
    renderApp();

    try {
      var base64ProductRaw = state.carImage ? state.carImage.split(',')[1] : null;

      for (var i = 1; i <= state.carSlides; i++) {
        state.carouselProgress = i;
        renderApp();

        var slideObjective = "";
        var layoutDirection = "";
        var extraContext = "";

        if (i === 1) {
          slideObjective = "Hook";
          layoutDirection = "Hero layout. Image position: center / right. Text position: top-left. Main product/image as hero. Big headline top/left. Strong focal point.";
          extraContext = "This is the first slide. Make this slide create curiosity to swipe next. Do not explain everything in slide 1.";
        } else if (i === state.carSlides) {
          slideObjective = "CTA (Call to Action)";
          layoutDirection = "Final conversion layout. Image position: large center. Text position: bottom center. Clean strong conversion page. Main visual large, prominent CTA button.";
          extraContext = `Finish the carousel story. Summarize main value. Add CTA button: "${state.carCTA}".`;
        } else if (i === 2) {
          slideObjective = "Before Condition / The Problem";
          layoutDirection = "Comparison layout. Image position: split left/right or dynamic. Text position: top labels. Before/after or left vs right comparison.";
          extraContext = "Continue the story. The message must connect naturally to the previous slide. Focus on the problem.";
        } else {
          slideObjective = "Experience / The Solution / Features";
          layoutDirection = "Social proof or Feature layout. Image position: right or bottom. Text position: left or top. Clean premium layout.";
          extraContext = "Continue the story. Focus on the main benefit and experience.";
        }

        var prompt = `Create ONLY carousel slide ${i}/${state.carSlides}.
        This is a ${i === 1 ? 'opening' : i === state.carSlides ? 'final conversion' : 'continuation'} slide of a ${state.carTemplate} carousel campaign.

        PRODUCT / CONTENT CONTEXT:
        Brand: ${state.carBrand || 'Brand'} (@${state.carUsername || 'username'})
        Name: ${state.carProductName || 'Produk'}
        Category: ${state.carCategory || 'General'}
        Description: ${state.carDesc || 'Produk berkualitas tinggi.'}
        Main Benefit: ${state.carBenefit || 'Solusi terbaik untuk Anda.'}
        Target Audience: ${state.carTarget || 'Semua orang'}
        Platform: ${state.carPlatform}
        Aspect Ratio: ${state.carRatio}
        Visual Style: ${state.carVisual}
        Color Mood: ${state.carColor}
        Copywriting Tone: ${state.carTone}

        SLIDE ${i} OBJECTIVE:
        ${slideObjective}

        LAYOUT DIRECTION:
        Use this layout for slide ${i}:
        ${layoutDirection}

        INSTRUCTION:
        Automatically generate the headline, subheadline, and visual idea for this slide based on the objective in Bahasa Indonesia.
        If product image is uploaded, keep product design, color, logo, shape, and material strictly unchanged.
        ${extraContext}
        Match the campaign identity, colors, typography, lighting, and premium mood.
        Add small slide indicator: ${i}/${state.carSlides}.

        STRICT OUTPUT RULES:
        Generate ONLY slide ${i}. One image only.
        Do not create full carousel. Do not create grid. Do not create collage.
        Output must be one standalone ${state.carRatio} carousel image.

        NEGATIVE PROMPT:
        carousel grid, collage, storyboard board, multiple slides in one canvas, bad typography, unreadable text, wrong product, distorted product, changed logo, blurry visual, messy layout, watermark, low quality.`;

        var payloadParts = [];
        if (base64ProductRaw) {
          payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
        }
        payloadParts.push({ text: prompt });

        var payload = {
          contents: [{ parts: payloadParts }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            aspectRatio: state.carRatio === "1:1 (Square)" ? "1:1" : state.carRatio === "4:5 (Portrait)" ? "3:4" : "16:9"
          }
        };

        var response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GENERATIVE_MODEL}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response && response.ok) {
          var result = await response.json();
          var base64Output = result.candidates?.[0]?.content?.parts?.find(function (p) { return p.inlineData; })?.inlineData?.data;
          if (base64Output) {
            state.carouselResults[i - 1] = `data:image/png;base64,${base64Output}`;
            renderApp();
          }
        }
      }
    } catch (err) {
      console.error("Carousel generation error", err);
    } finally {
      state.isGeneratingCarousel = false;
      state.carouselProgress = 0;
      renderApp();
    }
  }

  // --- ACTIONS DISPATCHER ---
  window.ugcAppActions = {
    toggleKeyPanel: function () {
      state.isKeyPanelOpen = !state.isKeyPanelOpen;
      renderApp();
    },
    saveApiKey: function () {
      var el = document.getElementById('ugc-member-key-input');
      var val = (el ? el.value : state.ugcApiKey).trim();
      if (!val) {
        notify('Tempel kode API Key Google AI Studio terlebih dahulu!', 'error');
        return;
      }
      state.ugcApiKey = val;
      localStorage.setItem(STORAGE_KEY_UGC, val);
      state.isKeyPanelOpen = false;
      renderApp();
      notify('✓ API Key Workflow UGC berhasil disimpan!', 'sukses');
    },
    clearApiKey: function () {
      state.ugcApiKey = '';
      localStorage.removeItem(STORAGE_KEY_UGC);
      state.isKeyPanelOpen = true;
      renderApp();
      notify('API Key Workflow UGC dihapus.', 'info');
    },
    setView: function (v) {
      state.view = v;
      if (v === 'mode-selection' || v === 'upload-setup') {
        state.bgType = 'custom';
        state.customBg = 'Latar Hitam Aksen Hijau Mewah (Premium Studio)';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderApp();
    },
    selectMode: function (modeId) {
      var m = MODES.find(function (x) { return x.id === modeId; });
      if (!m) return;
      if (modeId === 'tts') {
        state.isAudioStudioOpen = true;
        state.isAudioStudioMinimized = false;
        renderApp();
      } else if (modeId === 'sosmed') {
        state.view = 'sosmed-desk';
        renderApp();
      } else if (modeId === 'carousel') {
        state.view = 'carousel-setup';
        renderApp();
      } else if (modeId === 'ugc') {
        state.selectedMode = m;
        state.view = 'ugc-setup';
        renderApp();
      } else if (modeId === 'affiliate') {
        state.selectedMode = m;
        state.dynamicBackgrounds = MODE_BACKGROUNDS[modeId].slice();
        state.config.background = MODE_BACKGROUNDS[modeId][0];
        state.view = 'combined-setup';
        renderApp();
      } else {
        state.selectedMode = m;
        state.dynamicBackgrounds = MODE_BACKGROUNDS[modeId].slice();
        state.config.background = MODE_BACKGROUNDS[modeId][0];
        state.view = 'upload-setup';
        renderApp();
      }
    },
    resetAll: function () {
      state.selectedMode = null;
      state.modelImage = null;
      state.productImage = null;
      state.clothingImage = null;
      state.productName = "";
      state.productDesc = "";
      state.isProductConfirmed = false;
      state.bgType = 'custom';
      state.customBg = 'Latar Hitam Aksen Hijau Mewah (Premium Studio)';
      state.config = { background: MODE_BACKGROUNDS.ugc[0], ratio: '9:16', scenes: 4, ugcStyle: 'Handheld' };
      state.generatedImages = [];
      state.sceneLoadings = {};
      state.scenePrompts = {};
      state.previewImage = null;
      state.copiedStates = {};
      state.voScript = "";
      state.voAudioUrl = null;
      state.sosmedTitle = "";
      state.sosmedResult = "";
      state.carImage = null;
      state.carBrand = "";
      state.carUsername = "";
      state.carProductName = "";
      state.carCategory = "";
      state.carDesc = "";
      state.carBenefit = "";
      state.carTarget = "";
      state.carouselResults = [];
      state.carouselProgress = 0;
      state.ugcGeneratedImage = null;
      state.ugcDetailImage = null;
      state.isGeneratingUgc = false;
      state.isGeneratingUgcDetail = false;
      state.isGeneratingSosmed = false;
      state.isAudioStudioOpen = false;
      state.isAudioStudioMinimized = false;
      state.isVideoGeneratorsOpen = false;
      state.view = 'mode-selection';
      renderApp();
    },
    triggerUpload: function (inputId) {
      var el = document.getElementById(inputId);
      if (el) el.click();
    },
    handleFileSelect: function (input, targetKey, shouldAnalyze) {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onloadend = function () {
        state[targetKey] = reader.result;
        if (shouldAnalyze) {
          state.isProductConfirmed = false;
          renderApp();
          analyzeProductImage(reader.result);
        } else {
          renderApp();
        }
      };
      reader.readAsDataURL(file);
    },
    confirmProduct: function () {
      if (!state.productName.trim()) {
        notify('Isi Nama Produk terlebih dahulu!', 'error');
        return;
      }
      state.isProductConfirmed = true;
      renderApp();
    },
    changeBgSelect: function (val) {
      if (val === 'CUSTOM') {
        state.bgType = 'custom';
      } else {
        state.bgType = 'preset';
        state.config.background = val;
      }
      renderApp();
    },
    setUgcStyle: function (styleId) {
      state.config.ugcStyle = styleId;
      renderApp();
    },
    setRatio: function (r) {
      state.config.ratio = r;
      renderApp();
    },
    setScenes: function (c) {
      state.config.scenes = Number(c);
      renderApp();
    },
    setPreview: function (src) {
      state.previewImage = src || null;
      renderApp();
    },
    toggleSceneVO: function (idx, checked) {
      if (state.generatedImages[idx]) {
        state.generatedImages[idx].voActive = checked;
        renderApp();
      }
    },
    copyScenePrompt: function (idx) {
      var sc = state.generatedImages[idx];
      if (!sc) return;
      safeCopyToClipboard(getPromptForScene(sc));
      state.copiedStates[idx] = true;
      renderApp();
      notify('✓ Prompt berhasil disalin!', 'sukses');
      setTimeout(function () {
        state.copiedStates[idx] = false;
        renderApp();
      }, 2000);
    },
    downloadSingle: async function (type, idx, customRatio) {
      var src = null;
      if (type === 'ugc-main') src = state.ugcGeneratedImage;
      else if (type === 'ugc-grid') src = state.ugcDetailImage;
      else if (type === 'scene') src = state.generatedImages[idx] && state.generatedImages[idx].src;
      else if (type === 'carousel') src = state.carouselResults[idx];
      if (!src) return;

      var ratioToUse = customRatio || state.config.ratio;
      var croppedSrc = await processImageForDownload(src, ratioToUse);
      try {
        var res = await fetch(croppedSrc);
        var blob = await res.blob();
        var blobUrl = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { window.URL.revokeObjectURL(blobUrl); }, 1000);
      } catch (e) {
        var link2 = document.createElement('a');
        link2.href = croppedSrc;
        link2.download = 'image.png';
        document.body.appendChild(link2);
        link2.click();
        document.body.removeChild(link2);
      }
    },
    toggleVideoGenLinks: function () {
      state.isVideoGeneratorsOpen = !state.isVideoGeneratorsOpen;
      renderApp();
    },
    openAudioStudio: function () {
      state.isAudioStudioOpen = true;
      state.isAudioStudioMinimized = false;
      renderApp();
    },
    toggleMinimizeAudio: function () {
      state.isAudioStudioMinimized = !state.isAudioStudioMinimized;
      renderApp();
    },
    closeAudioStudio: function () {
      state.isAudioStudioOpen = false;
      state.isAudioStudioMinimized = false;
      renderApp();
    },
    setVoDuration: function (d) {
      state.voDuration = d;
      renderApp();
    },
    copySosmedText: function () {
      safeCopyToClipboard(state.sosmedResult);
      state.copiedSosmed = true;
      renderApp();
      notify('✓ Caption & Hashtag tersalin!', 'sukses');
      setTimeout(function () {
        state.copiedSosmed = false;
        renderApp();
      }, 2000);
    },
    generateUgcInfluencer: function () { generateUgcInfluencer(); },
    generateUgcDetailing: function () { generateUgcDetailing(); },
    generateVisual: function () { generateVisual(); },
    regenerateSingleScene: function (idx) { regenerateSingleScene(idx); },
    downloadAllZip: function () { handleDownloadAllZip(); },
    generateVOScript: function () { handleGenerateVOScript(); },
    generateVOAudio: function () { handleGenerateVOAudio(); },
    generateSosmed: function () { handleGenerateSosmed(); },
    generateCarousel: function () { handleGenerateCarousel(); }
  };

  window._ugcSetField = function (k, v) {
    state[k] = v;
  };
  window._ugcSetScenePrompt = function (idx, v) {
    state.scenePrompts[idx] = v;
  };
  window._ugcSetSceneVO = function (idx, v) {
    if (state.generatedImages[idx]) state.generatedImages[idx].voText = v;
  };

  // --- KOMPONEN UI LENGKAP SETARA REACT ASLI ---
  function renderNavbar(backView, showResultBtn) {
    var hasKey = Boolean((state.ugcApiKey || '').trim());
    return `
      <div class="relative z-30 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-3 bg-gradient-to-b from-slate-950/95 to-transparent border-b border-white/5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <div class="flex items-center justify-center font-elegant font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 text-xl md:text-2xl">I</div>
            </div>
            <div class="hidden md:flex flex-col">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold tracking-tight text-lg leading-none text-white uppercase font-modern">INGKI AI STUDIOPRO</span>
                <span class="px-1.5 py-0.5 rounded bg-gradient-to-r from-green-600 to-emerald-500 text-[8px] font-bold text-white tracking-widest uppercase leading-none">v6.1</span>
              </div>
              <span class="text-[10px] text-zinc-400 tracking-widest uppercase leading-none">AI Visual Generator</span>
            </div>
            <div class="flex items-center gap-2 md:hidden">
              <span class="font-bold tracking-tight text-sm text-white uppercase max-w-[160px] truncate font-modern">INGKI AI STUDIOPRO</span>
              <span class="px-1.5 py-0.5 rounded bg-gradient-to-r from-green-600 to-emerald-500 text-[8px] font-bold text-white tracking-widest uppercase leading-none">v6.1</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <button type="button" onclick="ugcAppActions.toggleKeyPanel()" class="backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest border transition-all duration-300 cursor-pointer ${hasKey ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'}">
              <i class="ph ph-key text-sm"></i>
              <span>${hasKey ? 'Key UGC Aktif' : 'Pasang Apikey'}</span>
            </button>

            ${showResultBtn ? `
              <button type="button" onclick="ugcAppActions.setView('result')" class="backdrop-blur-md bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-emerald-400 border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:from-green-600 hover:to-emerald-600 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer">
                <i class="ph ph-eye"></i> Result
              </button>
            ` : ''}

            <button type="button" onclick="ugcAppActions.resetAll()" class="backdrop-blur-md bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium uppercase tracking-widest hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all duration-300 group active:scale-95 cursor-pointer">
              <i class="ph ph-arrow-counter-clockwise group-hover:-rotate-180 transition-transform duration-500"></i> Reset
            </button>

            ${backView ? `
              <button type="button" onclick="ugcAppActions.setView('${backView}')" class="backdrop-blur-md bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 group active:scale-95 cursor-pointer">
                <i class="ph ph-caret-left group-hover:-translate-x-1 transition-transform"></i> Back
              </button>
            ` : ''}
          </div>
        </div>

        ${state.isKeyPanelOpen ? `
          <div class="bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-2xl">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">🔑 API Key Google AI Studio (Khusus Workflow UGC)</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-[11px] font-bold text-emerald-400 hover:text-emerald-200 underline flex items-center gap-1">
                <span>Ambil API Key Gratis Disini</span>
                <i class="ph ph-arrow-square-out"></i>
              </a>
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <input id="ugc-member-key-input" type="password" value="${esc(state.ugcApiKey)}" placeholder="Tempel kode API Key Google AI Studio (AIzaSy...) di sini" class="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400" />
              <div class="flex gap-2">
                <button type="button" onclick="ugcAppActions.saveApiKey()" class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer">
                  Simpan Key
                </button>
                ${hasKey ? `
                  <button type="button" onclick="ugcAppActions.clearApiKey()" class="px-3.5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer">
                    Hapus
                  </button>
                ` : ''}
              </div>
            </div>
            <p class="text-[10px] text-zinc-400">*Kunci ini tersimpan aman di browser HP kamu dan terpisah dari API Key RunningHub.</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderSectionTitle(title, subtitle) {
    return `
      <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 class="text-3xl md:text-5xl font-elegant font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 mb-3 drop-shadow-sm">${title}</h2>
        ${subtitle ? `<p class="text-emerald-100/60 font-modern text-sm md:text-base font-medium leading-relaxed max-w-xl">${subtitle}</p>` : ''}
      </div>
    `;
  }

  function renderUploadZone(label, imgSrc, inputId, iconClass, targetKey, shouldAnalyze) {
    return `
      <div class="space-y-3 group">
        <div class="flex justify-between items-baseline px-1">
          <span class="text-[10px] md:text-xs font-bold tracking-widest text-zinc-500 uppercase">${label}</span>
          ${imgSrc ? `<span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1"><i class="ph ph-check-circle"></i> Ready</span>` : ''}
        </div>
        <div onclick="ugcAppActions.triggerUpload('${inputId}')" class="relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 border border-white/5 bg-zinc-900/20 group-hover:border-green-500/30 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group-hover:bg-green-950/20">
          ${imgSrc ? `
            <img src="${imgSrc}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 scale-100 group-hover:scale-105" />
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
              <span class="px-4 py-2 rounded-full border border-green-400/50 bg-green-950/80 text-xs font-medium text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">Change</span>
            </div>
            <div class="absolute bottom-2 right-2 md:hidden">
              <div class="bg-emerald-500 rounded-full p-1"><i class="ph ph-check text-black text-xs"></i></div>
            </div>
          ` : `
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 md:gap-6 p-4 text-center">
              <div class="w-12 h-12 md:w-16 md:h-16 rounded-full border border-white/5 flex items-center justify-center bg-white/5 text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                <i class="ph ${iconClass} text-xl md:text-2xl"></i>
              </div>
              <p class="text-[10px] md:text-xs text-zinc-600 group-hover:text-emerald-300 font-medium tracking-wide transition-colors">TAP TO UPLOAD</p>
            </div>
          `}
        </div>
        <input id="${inputId}" type="file" accept="image/*" class="hidden" onchange="ugcAppActions.handleFileSelect(this, '${targetKey}', ${shouldAnalyze ? 'true' : 'false'})" />
      </div>
    `;
  }

  function renderGeneratingState(index) {
    return `
      <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20 transition-all duration-500">
        <div class="absolute w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div class="relative z-10 flex flex-col items-center gap-6">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 rounded-full border-[1px] border-white/5"></div>
            <div class="absolute inset-0 rounded-full border-t-[1px] border-emerald-400 animate-[spin_1.5s_linear_infinite]"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-1 h-1 bg-emerald-300 rounded-full animate-ping"></div>
            </div>
          </div>
          <div class="text-center space-y-3">
            <p class="text-[10px] font-bold tracking-[0.4em] text-white uppercase animate-pulse">Rendering</p>
            <div class="flex items-center justify-center gap-3 opacity-50">
              <div class="w-3 h-px bg-gradient-to-r from-transparent to-emerald-400"></div>
              <p class="text-[9px] font-medium tracking-widest text-emerald-200 uppercase font-mono">Scene ${String(index + 1).padStart(2, '0')}</p>
              <div class="w-3 h-px bg-gradient-to-l from-transparent to-emerald-400"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMainView() {
    var v = state.view;

    // 1. MODE SELECTION
    if (v === 'mode-selection') {
      var cardsHtml = MODES.map(function (mode, idx) {
        return `
          <button type="button" onclick="ugcAppActions.selectMode('${mode.id}')" class="group relative flex flex-col justify-between h-72 md:h-80 p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-black border border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-500 overflow-hidden text-left cursor-pointer">
            <div class="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-bl from-emerald-500/20 to-transparent blur-[60px] rounded-full group-hover:from-emerald-400/40 transition-all duration-700 pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-emerald-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div class="relative z-10 flex flex-col h-full justify-between">
              <div class="flex justify-between items-start w-full">
                <div class="w-14 h-14 md:w-16 md:h-16 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] transition-all duration-500 shadow-xl">
                  <i class="ph ${mode.icon} text-2xl md:text-3xl drop-shadow-md"></i>
                </div>
                <span class="text-sm font-bold font-modern text-emerald-500/50 group-hover:text-emerald-400 transition-colors">0${idx + 1}</span>
              </div>
              <div class="space-y-4">
                <div>
                  <h3 class="text-2xl md:text-3xl font-elegant font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 mb-2 leading-tight tracking-wide group-hover:translate-x-1 group-hover:to-emerald-400 transition-all duration-300">${mode.title}</h3>
                  <p class="text-xs md:text-sm text-zinc-400 font-modern font-medium leading-relaxed max-w-[95%] group-hover:text-emerald-100 transition-colors line-clamp-2">${mode.desc}</p>
                </div>
                <div class="flex items-center justify-between pt-6 border-t border-emerald-500/20 group-hover:border-emerald-400/50">
                  <span class="text-[10px] md:text-xs font-bold tracking-widest uppercase text-emerald-500 group-hover:text-emerald-300 transition-colors">Pilih Mode</span>
                  <div class="w-8 h-8 md:w-10 md:h-10 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-950/50 group-hover:bg-gradient-to-r group-hover:from-emerald-400 group-hover:to-teal-400 group-hover:text-slate-900 group-hover:border-transparent transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0)] group-hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                    <i class="ph ph-arrow-right text-base -rotate-45 group-hover:rotate-0 transition-transform duration-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </button>
        `;
      }).join('');

      return `
        ${renderNavbar(null, false)}
        <div class="flex-grow flex flex-col justify-center px-4 pt-8 pb-12 md:px-12 lg:px-16 z-20 relative">
          <div class="max-w-7xl mx-auto w-full">
            <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6 border-b border-emerald-900/30 pb-8">
              ${renderSectionTitle('Pilih Mode Visual', 'Tentukan gaya estetika kampanye visual Anda.')}
              <div class="hidden md:flex items-center gap-3 text-zinc-500">
                <span class="text-[10px] font-bold tracking-widest uppercase text-emerald-400">01</span>
                <div class="w-16 h-px bg-emerald-500/30"></div>
                <span class="text-[10px] font-bold tracking-widest uppercase opacity-50">03</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              ${cardsHtml}
            </div>
          </div>
        </div>
      `;
    }

    // 2. UGC SETUP
    if (v === 'ugc-setup') {
      function selectBox(label, val, propName, optionsArr) {
        var opts = optionsArr.map(function (o) {
          var vOpt = typeof o === 'object' ? o.value : o;
          var lOpt = typeof o === 'object' ? o.label : o;
          return `<option value="${esc(vOpt)}" ${val === vOpt ? 'selected' : ''} class="bg-slate-900 text-white">${esc(lOpt)}</option>`;
        }).join('');
        return `
          <div class="space-y-3">
            <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">${label}</label>
            <div class="relative group">
              <select onchange="window._ugcSetField('${propName}', this.value)" class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all cursor-pointer appearance-none">
                ${opts}
              </select>
              <i class="ph ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"></i>
            </div>
          </div>
        `;
      }

      return `
        ${renderNavbar('mode-selection', false)}
        <div class="flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 lg:px-20 relative z-20">
          <div class="max-w-4xl mx-auto w-full flex flex-col gap-8">
            ${renderSectionTitle('AI Influencer Creator', 'Buat karakter model / influencer eksklusif Anda sendiri untuk kebutuhan konten.')}
            <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
              <h3 class="text-sm font-bold text-white mb-2 flex items-center gap-2 border-b border-white/5 pb-4">
                <i class="ph ph-sparkle text-emerald-400"></i> Personalisasi Model AI
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${selectBox('Gender (Jenis Kelamin)', state.ugcGender, 'ugcGender', UGC_GENDERS)}
                ${selectBox('Kategori Usia', state.ugcAge, 'ugcAge', UGC_AGES)}
                ${selectBox('Asal Negara / Etnis', state.ugcCountry, 'ugcCountry', UGC_COUNTRIES)}
                ${selectBox('Warna Kulit', state.ugcSkin, 'ugcSkin', UGC_SKIN_TONES)}
                ${selectBox('Gaya Rambut', state.ugcHairStyle, 'ugcHairStyle', UGC_HAIR_STYLES)}
                ${selectBox('Warna Rambut', state.ugcHairColor, 'ugcHairColor', UGC_HAIR_COLORS)}
                ${selectBox('Format / Rasio Foto', state.ugcRatio, 'ugcRatio', UGC_RATIOS)}
              </div>
              <div class="pt-6 border-t border-white/5">
                <button type="button" onclick="ugcAppActions.generateUgcInfluencer()" class="relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                  <i class="ph ph-magic-wand text-lg"></i> Generate AI Influencer
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 3. UGC RESULT & DETAILING GRID
    if (v === 'ugc-result') {
      var aspectCls = state.ugcRatio === '9:16' ? 'aspect-[9/16]' : state.ugcRatio === '16:9' ? 'aspect-video' : state.ugcRatio === '3:4' ? 'aspect-[3/4]' : 'aspect-square';
      return `
        <div class="relative h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-slate-950/90 backdrop-blur-md z-30 shrink-0">
          <div class="flex items-center gap-4 md:gap-6">
            <div class="flex flex-col">
              <span class="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">Project UGC</span>
              <span class="text-xs md:text-sm font-medium text-white truncate">Influencer / Model Character</span>
            </div>
          </div>
          <div class="flex items-center gap-2 md:gap-4">
            ${!state.isGeneratingUgc && !state.isGeneratingUgcDetail ? `
              <button type="button" onclick="ugcAppActions.setView('ugc-setup')" class="flex items-center gap-1 p-2 text-[10px] md:text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-white transition-colors cursor-pointer">
                <i class="ph ph-caret-left"></i> Kembali
              </button>
              <button type="button" onclick="ugcAppActions.resetAll()" class="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-[10px] md:text-xs font-bold tracking-widest uppercase rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer">Buat Baru</button>
            ` : ''}
          </div>
        </div>

        <div class="max-w-5xl mx-auto p-4 md:p-8 lg:p-12 pb-32 flex flex-col gap-12 w-full">
          <div class="flex flex-col items-center gap-6 w-full">
            <h2 class="text-xl md:text-2xl font-elegant font-bold text-white text-center">AI Influencer Model</h2>
            <div class="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl max-w-sm w-full transition-all duration-500 ${aspectCls}">
              ${state.isGeneratingUgc ? renderGeneratingState(0) : state.ugcGeneratedImage ? `
                <img src="${state.ugcGeneratedImage}" alt="AI Influencer" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                  <button type="button" onclick="ugcAppActions.setPreview(state.ugcGeneratedImage)" class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all text-white cursor-pointer">
                    <i class="ph ph-magnifying-glass-plus text-xl"></i>
                  </button>
                </div>
                <div class="absolute bottom-4 right-4 z-20">
                  <button type="button" onclick="ugcAppActions.downloadSingle('ugc-main', 0, '${state.ugcRatio}')" class="px-4 py-2 bg-black/60 backdrop-blur-md text-emerald-300 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 cursor-pointer">
                    <i class="ph ph-download-simple"></i> Unduh
                  </button>
                </div>
              ` : ''}
            </div>

            ${!state.isGeneratingUgc && state.ugcGeneratedImage ? `
              <div class="w-full max-w-md pt-4">
                <button type="button" onclick="ugcAppActions.generateUgcDetailing()" ${state.isGeneratingUgcDetail ? 'disabled' : ''} class="relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-30 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                  ${state.isGeneratingUgcDetail ? `<i class="ph ph-spinner animate-spin text-lg"></i> Memproses Detailing Wajah...` : `<i class="ph ph-aperture text-lg"></i> Detailing Muka Model (Grid)`}
                </button>
              </div>
            ` : ''}
          </div>

          ${state.ugcDetailImage ? `
            <div class="flex flex-col items-center gap-6 w-full pt-8 border-t border-white/5">
              <h2 class="text-xl md:text-2xl font-elegant font-bold text-white text-center flex items-center gap-3">
                <i class="ph ph-sparkle text-emerald-400"></i> Detailing Muka (Reference Grid)
              </h2>
              <p class="text-sm text-zinc-400 text-center max-w-2xl">Mata, Hidung, Pipi, Tampak Depan, & Samping.</p>
              <div class="relative rounded-2xl overflow-hidden bg-zinc-900 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] max-w-4xl w-full aspect-video transition-all duration-500">
                <img src="${state.ugcDetailImage}" alt="Detailing Grid" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                  <button type="button" onclick="ugcAppActions.setPreview(state.ugcDetailImage)" class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all text-white cursor-pointer">
                    <i class="ph ph-magnifying-glass-plus text-xl"></i>
                  </button>
                </div>
                <div class="absolute bottom-4 right-4 z-20">
                  <button type="button" onclick="ugcAppActions.downloadSingle('ugc-grid', 1, '16:9')" class="px-4 py-2 bg-emerald-600/80 backdrop-blur-md text-white border border-emerald-400/50 rounded-full text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-500 transition-all flex items-center gap-2 cursor-pointer">
                    <i class="ph ph-download-simple"></i> Unduh Grid
                  </button>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 4. COMBINED SETUP (AFFILIATE CREATOR)
    if (v === 'combined-setup') {
      var isUploadCompleteAffiliate = Boolean(state.modelImage && state.productImage);
      var canGenAff = isUploadCompleteAffiliate && state.isProductConfirmed && !state.isAnalyzingProduct;
      var bgOpts = state.dynamicBackgrounds.map(function (bg) {
        return `<option value="${esc(bg)}" ${state.bgType === 'preset' && state.config.background === bg ? 'selected' : ''} class="bg-zinc-900 text-white py-2">${esc(bg)}</option>`;
      }).join('');

      return `
        ${renderNavbar('mode-selection', false)}
        <div class="flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 lg:px-20 z-20 relative">
          <div class="max-w-4xl mx-auto w-full flex flex-col gap-10">
            ${renderSectionTitle('Setup Affiliate Creator', 'Lengkapi aset visual dan atur konfigurasi studio Anda dalam satu halaman.')}

            <div class="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
              <h3 class="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <i class="ph ph-image text-emerald-400"></i> 1. Aset Visual & Produk
              </h3>

              <div class="grid gap-4 md:gap-8 grid-cols-1 sm:grid-cols-3">
                ${renderUploadZone('01. Base Model', state.modelImage, 'in-ugc-model', 'ph-camera', 'modelImage', false)}
                ${renderUploadZone('02. Product Image', state.productImage, 'in-ugc-prod', 'ph-package', 'productImage', true)}
                ${renderUploadZone('03. Pakaian (Opsional)', state.clothingImage, 'in-ugc-cloth', 'ph-stack', 'clothingImage', false)}
              </div>

              <div class="space-y-4 pt-4 border-t border-white/5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <i class="ph ph-file-text"></i> Detail Produk
                  </label>
                  ${state.isAnalyzingProduct ? `<span class="text-[10px] text-emerald-400 flex items-center gap-2 animate-pulse"><i class="ph ph-sparkle"></i> AI Analyzing...</span>` : ''}
                </div>

                <div class="space-y-3">
                  <input type="text" value="${esc(state.productName)}" oninput="window._ugcSetField('productName', this.value)" placeholder="Nama Produk (Misal: Kopi Susu Aren)" class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all font-medium" />
                  <textarea oninput="window._ugcSetField('productDesc', this.value)" placeholder="Unggah gambar produk agar AI dapat mendeteksi deskripsinya secara otomatis, atau ketik manual..." class="w-full h-20 bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-zinc-400 focus:outline-none focus:border-emerald-400 transition-all resize-none">${esc(state.productDesc)}</textarea>
                </div>

                <div class="flex justify-end pt-2">
                  <button type="button" onclick="ugcAppActions.confirmProduct()" ${!state.productName || state.isProductConfirmed || state.isAnalyzingProduct ? '' : ''} class="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${state.isProductConfirmed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}">
                    ${state.isAnalyzingProduct ? `<i class="ph ph-spinner animate-spin"></i> Analyzing` : state.isProductConfirmed ? `<i class="ph ph-check-circle"></i> Confirmed` : 'Confirm Info'}
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-8">
              <h3 class="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <i class="ph ph-layout text-emerald-400"></i> 2. Konfigurasi Studio
              </h3>

              <div class="space-y-4">
                <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <i class="ph ph-monitor"></i> Latar / Background (Rekomendasi AI)
                </label>
                <div class="relative group">
                  <select onchange="ugcAppActions.changeBgSelect(this.value)" class="w-full appearance-none bg-zinc-900/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all cursor-pointer font-medium hover:bg-zinc-800">
                    ${bgOpts}
                    <option value="CUSTOM" ${state.bgType === 'custom' ? 'selected' : ''} class="bg-zinc-800 text-emerald-400 font-bold">✨ Custom (Ketik Sendiri)...</option>
                  </select>
                  <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <i class="ph ph-caret-down"></i>
                  </div>
                </div>

                ${state.bgType === 'custom' ? `
                  <div class="mt-4">
                    <input type="text" placeholder="Contoh: 'Garasi rumah dengan lampu neon hijau' atau 'Kantin kampus siang hari'" value="${esc(state.customBg)}" oninput="window._ugcSetField('customBg', this.value)" class="w-full bg-slate-900/60 border border-green-500/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all font-medium" />
                  </div>
                ` : ''}
              </div>

              <div class="space-y-4 pt-4 border-t border-white/5">
                <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <i class="ph ph-video-camera"></i> Gaya Kamera Konten
                </label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  ${[
                    { id: 'Handheld', label: '📱 Handheld', desc: 'Gaya selfie, natural shake' },
                    { id: 'Tripod', label: '📸 Tripod', desc: 'Kamera statis & stabil' },
                    { id: 'Vlog', label: '🚶‍♂️ Vlog', desc: 'Dinamis, wide angle' }
                  ].map(function (style) {
                    var active = state.config.ugcStyle === style.id;
                    return `
                      <button type="button" onclick="ugcAppActions.setUgcStyle('${style.id}')" class="flex flex-col items-start p-4 rounded-xl border transition-all duration-300 text-left cursor-pointer ${active ? 'bg-green-900/20 border-green-400/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-black/20 border-white/5 hover:border-green-500/30'}">
                        <span class="text-sm font-bold mb-1 ${active ? 'text-white' : 'text-zinc-300'}">${style.label}</span>
                        <span class="text-[10px] ${active ? 'text-emerald-200/80' : 'text-zinc-500'}">${style.desc}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                <div class="space-y-4">
                  <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <i class="ph ph-layout"></i> Format Output
                  </label>
                  <div class="flex flex-col gap-2">
                    ${RATIOS.map(function (r) {
                      var active = state.config.ratio === r.value;
                      return `
                        <button type="button" onclick="ugcAppActions.setRatio('${r.value}')" class="flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer ${active ? 'bg-green-600/20 border-green-400/50 text-emerald-300 shadow-inner' : 'bg-black/20 border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}">
                          <span class="text-xs font-medium uppercase tracking-wide">${r.label}</span>
                          <span class="text-[10px] font-mono opacity-50">${r.sub}</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div class="space-y-4">
                  <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <i class="ph ph-stack"></i> Jumlah Scene
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    ${SCENE_COUNTS.map(function (count) {
                      var active = state.config.scenes === count;
                      return `
                        <button type="button" onclick="ugcAppActions.setScenes(${count})" class="py-3 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer ${active ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black/20 border-white/5 text-zinc-500 hover:border-green-500/30 hover:text-emerald-300'}">
                          ${count}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-2 pb-10">
              <button type="button" onclick="ugcAppActions.generateVisual()" ${!canGenAff ? 'disabled' : ''} class="relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                Generate Visuals
              </button>
              ${!state.isProductConfirmed && isUploadCompleteAffiliate && !state.isAnalyzingProduct ? `
                <p class="text-center text-[10px] text-zinc-500 mt-3 animate-pulse">Mohon konfirmasi info produk (Tombol 'Confirm Info') untuk melanjutkan.</p>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // 5. UPLOAD SETUP (COMMERCIAL, MIRROR, POV)
    if (v === 'upload-setup') {
      var isPov = state.selectedMode && state.selectedMode.id === 'pov';
      var isUploadComplete = (isPov ? true : Boolean(state.modelImage)) && Boolean(state.productImage);
      var canContinue = isUploadComplete && state.isProductConfirmed && !state.isAnalyzingProduct;

      return `
        ${renderNavbar('mode-selection', false)}
        <div class="flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 lg:px-20 z-20 relative">
          <div class="max-w-3xl mx-auto w-full flex flex-col gap-10">
            ${renderSectionTitle('Aset Visual', `Siapkan aset gambar untuk gaya ${(state.selectedMode && state.selectedMode.title) || ''}.`)}

            <div class="grid gap-4 md:gap-8 ${isPov ? 'grid-cols-1 max-w-sm mx-auto w-full' : 'grid-cols-2'}">
              ${!isPov ? renderUploadZone('01. Base Model (Referensi Wajah/Tubuh)', state.modelImage, 'in-ugc-model2', 'ph-camera', 'modelImage', false) : ''}
              ${renderUploadZone(isPov ? '01. Product Image' : '02. Product Image', state.productImage, 'in-ugc-prod2', 'ph-package', 'productImage', true)}
            </div>

            <div class="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <i class="ph ph-file-text"></i> Detail Produk
                </label>
                ${state.isAnalyzingProduct ? `<span class="text-[10px] text-emerald-400 flex items-center gap-2 animate-pulse"><i class="ph ph-sparkle"></i> AI Analyzing...</span>` : ''}
              </div>

              <div class="space-y-3">
                <input type="text" value="${esc(state.productName)}" oninput="window._ugcSetField('productName', this.value)" placeholder="Nama Produk (Misal: Kopi Susu Aren)" class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all font-medium" />
                <textarea oninput="window._ugcSetField('productDesc', this.value)" placeholder="Unggah gambar produk agar AI dapat mendeteksi deskripsinya secara otomatis, atau ketik manual..." class="w-full h-20 bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-zinc-400 focus:outline-none focus:border-emerald-400 transition-all resize-none">${esc(state.productDesc)}</textarea>
              </div>

              <div class="flex justify-end pt-2">
                <button type="button" onclick="ugcAppActions.confirmProduct()" class="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${state.isProductConfirmed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}">
                  ${state.isAnalyzingProduct ? `<i class="ph ph-spinner animate-spin"></i> Analyzing` : state.isProductConfirmed ? `<i class="ph ph-check-circle"></i> Confirmed` : 'Confirm Info'}
                </button>
              </div>
            </div>

            <div class="pt-4 pb-10">
              <button type="button" onclick="ugcAppActions.setView('config')" ${!canContinue ? 'disabled' : ''} class="relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                Lanjutkan
              </button>
              ${!state.isProductConfirmed && isUploadComplete && !state.isAnalyzingProduct ? `
                <p class="text-center text-[10px] text-zinc-600 mt-3 animate-pulse">Mohon konfirmasi info produk untuk lanjut</p>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // 6. CONFIG STUDIO (DENGAN LAYOUT 12 KOLOM 7:5 & GAYA KAMERA KONTEN UTUH)
    if (v === 'config') {
      var hasResult = state.generatedImages.some(function (img) { return img !== null; });
      var bgOptsCfg = state.dynamicBackgrounds.map(function (bg) {
        return `<option value="${esc(bg)}" ${state.bgType === 'preset' && state.config.background === bg ? 'selected' : ''} class="bg-zinc-900 text-white py-2">${esc(bg)}</option>`;
      }).join('');
      var isUgcOrAff = state.selectedMode && (state.selectedMode.id === 'ugc' || state.selectedMode.id === 'affiliate');

      return `
        ${renderNavbar('upload-setup', hasResult)}
        <div class="flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 lg:px-20 z-20 relative">
          <div class="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div class="lg:col-span-7 space-y-8 md:space-y-12">
              ${renderSectionTitle('Konfigurasi Studio', 'Sesuaikan pengaturan latar dan detail output visual.')}
              <div class="space-y-4 md:space-y-6">
                <label class="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <i class="ph ph-monitor"></i> Latar / Background (Rekomendasi AI)
                </label>
                <div class="relative group">
                  <select onchange="ugcAppActions.changeBgSelect(this.value)" class="w-full appearance-none bg-zinc-900/30 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all cursor-pointer font-medium hover:bg-zinc-900/50">
                    ${bgOptsCfg}
                    <option value="CUSTOM" ${state.bgType === 'custom' ? 'selected' : ''} class="bg-zinc-800 text-emerald-400 font-bold">✨ Custom (Ketik Sendiri)...</option>
                  </select>
                  <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <i class="ph ph-caret-down"></i>
                  </div>
                </div>

                ${state.bgType === 'custom' ? `
                  <div class="mt-4">
                    <input type="text" placeholder="Contoh: 'Garasi rumah dengan lampu neon hijau' atau 'Kantin kampus siang hari'" value="${esc(state.customBg)}" oninput="window._ugcSetField('customBg', this.value)" class="w-full bg-slate-900/60 border border-green-500/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all font-medium" />
                  </div>
                ` : ''}

                ${isUgcOrAff ? `
                  <div class="pt-6 mt-4 border-t border-white/5 space-y-4">
                    <label class="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <i class="ph ph-video-camera"></i> Gaya Kamera Konten
                    </label>
                    <p class="text-xs text-zinc-400">Pilih pergerakan dan komposisi kamera (hanya berlaku di mode UGC/Affiliate).</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      ${[
                        { id: 'Handheld', label: '📱 Handheld', desc: 'Gaya selfie, natural shake' },
                        { id: 'Tripod', label: '📸 Tripod', desc: 'Kamera statis & stabil' },
                        { id: 'Vlog', label: '🚶‍♂️ Vlog', desc: 'Dinamis, wide angle' }
                      ].map(function (style) {
                        var active = state.config.ugcStyle === style.id;
                        return `
                          <button type="button" onclick="ugcAppActions.setUgcStyle('${style.id}')" class="flex flex-col items-start p-4 rounded-xl border transition-all duration-300 text-left cursor-pointer ${active ? 'bg-green-900/20 border-green-400/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-black/20 border-white/5 hover:border-green-500/30'}">
                            <span class="text-sm font-bold mb-1 ${active ? 'text-white' : 'text-zinc-300'}">${style.label}</span>
                            <span class="text-[10px] ${active ? 'text-emerald-200/80' : 'text-zinc-500'}">${style.desc}</span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="lg:col-span-5 space-y-6 md:space-y-10 lg:pt-24">
              <div class="p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-md space-y-6 md:space-y-10">
                <div class="space-y-4">
                  <label class="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <i class="ph ph-layout"></i> Format Output
                  </label>
                  <div class="flex flex-col gap-2">
                    ${RATIOS.map(function (r) {
                      var active = state.config.ratio === r.value;
                      return `
                        <button type="button" onclick="ugcAppActions.setRatio('${r.value}')" class="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 rounded-xl border transition-all duration-300 cursor-pointer ${active ? 'bg-green-600/20 border-green-400/50 text-emerald-300 shadow-inner' : 'bg-transparent border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}">
                          <span class="text-[10px] md:text-xs font-medium uppercase tracking-wide">${r.label}</span>
                          <span class="text-[10px] font-mono opacity-50">${r.sub}</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div class="space-y-4">
                  <label class="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <i class="ph ph-stack"></i> Jumlah Scene
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    ${SCENE_COUNTS.map(function (count) {
                      var active = state.config.scenes === count;
                      return `
                        <button type="button" onclick="ugcAppActions.setScenes(${count})" class="py-2 md:py-3 rounded-lg text-[10px] md:text-xs font-bold border transition-all duration-300 cursor-pointer ${active ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-transparent border-white/5 text-zinc-500 hover:border-green-500/30 hover:text-emerald-300'}">
                          ${count}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div class="pt-2 md:pt-4">
                  <button type="button" onclick="ugcAppActions.generateVisual()" class="relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                    Generate Visuals
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 7. RESULT STORYBOARD VIEW
    if (v === 'result') {
      var backTarget = (state.selectedMode && state.selectedMode.id === 'affiliate') ? 'combined-setup' : 'config';
      var ratioCls = state.config.ratio === '9:16' ? 'aspect-[9/16]' : state.config.ratio === '16:9' ? 'aspect-video' : 'aspect-square';
      var activeBgText = state.bgType === 'custom' ? (state.customBg || 'Custom') : state.config.background;

      var sceneCards = Array.from({ length: state.config.scenes }).map(function (_, index) {
        var sceneData = state.generatedImages[index];
        var image = sceneData && sceneData.src;
        var isLoadingThis = state.sceneLoadings[index] || (state.isGenerating && !image);

        return `
          <div class="flex flex-col gap-4 group">
            <div class="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-500 ${ratioCls} ${image ? 'hover:border-green-500/30' : ''}">
              ${image ? `
                <img src="${image}" alt="Output ${index}" class="w-full h-full object-cover ${state.config.ratio === '16:9' ? 'object-center' : 'object-top'} transition-all duration-700${isLoadingThis ? 'scale-105 blur-sm opacity-50' : 'group-hover:scale-105'}" />
                ${isLoadingThis ? renderGeneratingState(index) : `
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-20">
                    <button type="button" onclick="ugcAppActions.setPreview(state.generatedImages[${index}].src)" class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer" title="Preview Fullscreen">
                      <i class="ph ph-magnifying-glass-plus text-xl"></i>
                    </button>
                  </div>
                `}
                ${sceneData && sceneData.role ? `
                  <div class="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full z-20">
                    <span class="text-[9px] font-bold text-white uppercase tracking-widest">${esc(sceneData.role)}</span>
                  </div>
                ` : ''}
              ` : `
                <div class="absolute inset-0">
                  ${isLoadingThis ? renderGeneratingState(index) : `<div class="w-full h-full flex flex-col items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>`}
                </div>
              `}
            </div>

            ${image && !state.isGenerating ? `
              <div class="bg-zinc-900/50 border border-white/5 rounded-xl p-4 space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-white/5">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Scene 0${index + 1}</span>
                  <button type="button" onclick="ugcAppActions.downloadSingle('scene', ${index})" class="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-emerald-300 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all cursor-pointer">
                    <i class="ph ph-download-simple"></i> Unduh
                  </button>
                </div>

                <div class="space-y-4 pt-1">
                  <div class="bg-green-950/40 border border-green-500/40 rounded-xl p-3.5 space-y-3 relative shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                    <div class="flex items-center gap-2">
                      <i class="ph ph-sparkle text-emerald-400"></i>
                      <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-300">Revisi Visual AI</span>
                    </div>
                    <div class="relative flex gap-2">
                      <input type="text" ${isLoadingThis ? 'disabled' : ''} placeholder="Cth: Buat pencahayaan lebih terang..." value="${esc(state.scenePrompts[index] || '')}" oninput="window._ugcSetScenePrompt(${index}, this.value)" onkeydown="if(event.key==='Enter') ugcAppActions.regenerateSingleScene(${index})" class="flex-grow bg-black/60 border border-green-500/30 rounded-lg pl-3 pr-3 py-2.5 text-xs text-white placeholder:text-emerald-200/30 focus:outline-none focus:border-emerald-400 transition-all" />
                      <button type="button" onclick="ugcAppActions.regenerateSingleScene(${index})" class="px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 transition-all flex items-center justify-center shrink-0 cursor-pointer">
                        ${isLoadingThis ? `<i class="ph ph-spinner animate-spin"></i>` : 'Revisi'}
                      </button>
                    </div>
                  </div>

                  <div class="bg-black/30 p-3 rounded-lg border border-white/5 space-y-2 transition-all">
                    <div class="flex items-center justify-between">
                      <span class="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${sceneData.voActive ? 'text-emerald-400' : 'text-zinc-600'}">
                        <i class="ph ph-microphone"></i> Voice Over ${sceneData.voActive ? 'On' : 'Off'}
                      </span>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" ${sceneData.voActive ? 'checked' : ''} onchange="ugcAppActions.toggleSceneVO(${index}, this.checked)" />
                        <div class="w-7 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    ${sceneData.voActive ? `
                      <textarea oninput="window._ugcSetSceneVO(${index}, this.value)" class="w-full bg-black/40 border border-white/10 rounded-md p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all resize-none h-16" placeholder="Ketik naskah Voice Over di sini...">${esc(sceneData.voText || '')}</textarea>
                    ` : `
                      <div class="flex items-center justify-center py-2 bg-black/20 rounded-md border border-white/5 border-dashed">
                        <p class="text-[10px] text-zinc-600 font-medium italic">Tanpa Voice Over (Hanya Ambience/BGM)</p>
                      </div>
                    `}
                  </div>
                </div>

                <button type="button" onclick="ugcAppActions.copyScenePrompt(${index})" class="w-full py-2.5 border text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${state.copiedStates[index] ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-green-950/30 border-green-500/30 text-emerald-300 hover:bg-green-900/50 hover:text-white'}">
                  ${state.copiedStates[index] ? `<i class="ph ph-check-circle"></i> Tersalin!` : `<i class="ph ph-copy"></i> Copy Prompt Generasi Video`}
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      var anyDone = !state.isGenerating && state.generatedImages.some(function (img) { return img !== null; });

      return `
        <div class="relative h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-slate-950/90 backdrop-blur-md z-30 shrink-0">
          <div class="flex items-center gap-4 md:gap-6 overflow-hidden">
            <div class="flex flex-col min-w-0">
              <span class="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">Project</span>
              <span class="text-xs md:text-sm font-medium text-white truncate">${esc((state.selectedMode && state.selectedMode.title) || '')} / ${esc(state.productName)}</span>
            </div>
            <div class="hidden md:block h-8 w-px bg-white/10"></div>
            <div class="hidden md:flex items-center gap-4 text-xs text-zinc-400">
              <span class="px-3 py-1 rounded-full border border-white/5 bg-white/5 max-w-[200px] truncate">${esc(activeBgText)}</span>
              <span class="px-3 py-1 rounded-full border border-white/5 bg-white/5">${state.config.ratio}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 md:gap-4">
            ${!state.isGenerating ? `
              <button type="button" onclick="ugcAppActions.openAudioStudio()" class="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 text-white border border-emerald-400/50 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer">
                <i class="ph ph-speaker-high"></i> Audio Studio
              </button>
              <button type="button" onclick="ugcAppActions.setView('${backTarget}')" class="flex items-center gap-1 p-2 text-[10px] md:text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-white transition-colors cursor-pointer">
                <i class="ph ph-caret-left"></i> <span class="hidden md:inline">Kembali</span>
              </button>
              <button type="button" onclick="ugcAppActions.resetAll()" class="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-[10px] md:text-xs font-bold tracking-widest uppercase rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">Buat Baru</button>
            ` : ''}
          </div>
        </div>

        <div class="max-w-[1920px] mx-auto p-4 md:p-8 lg:p-12 pb-32 w-full">
          <div class="grid gap-6 md:gap-8 ${state.config.scenes === 4 ? 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}">
            ${sceneCards}
          </div>

          ${anyDone ? `
            <div class="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-6">
              <button type="button" onclick="ugcAppActions.downloadAllZip()" ${state.isDownloadingZip ? 'disabled' : ''} class="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-full text-xs font-bold tracking-widest uppercase text-white transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                ${state.isDownloadingZip ? `<i class="ph ph-spinner animate-spin"></i> Memproses ZIP...` : `<i class="ph ph-archive"></i> Download All Scene & Prompt (.ZIP)`}
              </button>

              <button type="button" onclick="ugcAppActions.toggleVideoGenLinks()" class="px-8 py-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/10 rounded-full text-xs font-bold tracking-widest uppercase text-white transition-all flex items-center gap-3 shadow-lg hover:border-emerald-500/30 cursor-pointer">
                <i class="ph ph-video-camera text-emerald-400"></i> Akses Video Generator <i class="ph ${state.isVideoGeneratorsOpen ? 'ph-caret-up' : 'ph-caret-down'} text-zinc-400"></i>
              </button>

              ${state.isVideoGeneratorsOpen ? `
                <div class="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                  <a href="https://www.meta.ai/" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-emerald-500/30 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-100 hover:from-emerald-600 hover:to-green-600 hover:text-white transition-all shadow-lg">
                    <i class="ph ph-arrow-square-out"></i> Meta AI
                  </a>
                  <a href="https://grok.com/" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-zinc-900/60 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-black hover:border-white/30 hover:text-white transition-all shadow-lg">
                    <i class="ph ph-arrow-square-out"></i> Grok AI
                  </a>
                  <a href="https://labs.google/fx/tools/flow" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-emerald-500/30 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-100 hover:from-green-600 hover:to-emerald-600 hover:text-white transition-all shadow-lg">
                    <i class="ph ph-arrow-square-out"></i> Flow AI
                  </a>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }

    // 8. SOSMED DESK
    if (v === 'sosmed-desk') {
      return `
        ${renderNavbar('mode-selection', false)}
        <div class="flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 lg:px-20 relative z-20">
          <div class="max-w-4xl mx-auto w-full flex flex-col gap-8">
            ${renderSectionTitle('Sosmed Desk', 'AI Copywriter untuk menyusun Caption dan Hashtag viral secara otomatis.')}

            <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
              <div class="space-y-4">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <i class="ph ph-pen-nib"></i> Topik Konten / Judul
                </label>
                <input type="text" value="${esc(state.sosmedTitle)}" oninput="window._ugcSetField('sosmedTitle', this.value)" placeholder="Contoh: Postingan TikTok tentang sepatu lari Nike terbaru..." class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all font-medium" />
              </div>

              <div class="space-y-4">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <i class="ph ph-device-mobile"></i> Platform Tujuan
                </label>
                <div class="relative group">
                  <select onchange="window._ugcSetField('sosmedPlatform', this.value)" class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all cursor-pointer appearance-none">
                    ${['TikTok', 'Instagram Reels', 'Instagram Feed', 'YouTube Shorts', 'Twitter / X', 'Facebook'].map(function (p) {
                      return `<option value="${p}" ${state.sosmedPlatform === p ? 'selected' : ''} class="bg-slate-900">${p}</option>`;
                    }).join('')}
                  </select>
                  <i class="ph ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"></i>
                </div>
              </div>

              <div class="pt-4">
                <button type="button" onclick="ugcAppActions.generateSosmed()" ${state.isGeneratingSosmed ? 'disabled' : ''} class="relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                  ${state.isGeneratingSosmed ? `<i class="ph ph-spinner animate-spin"></i> Menyusun Caption...` : `<i class="ph ph-sparkle"></i> Generate Deskripsi & Hashtag`}
                </button>
              </div>
            </div>

            ${state.sosmedResult || state.isGeneratingSosmed ? `
              <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
                <div class="flex items-center justify-between border-b border-white/5 pb-4">
                  <label class="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <i class="ph ph-check-circle"></i> Hasil Copywriting
                  </label>
                  ${state.sosmedResult ? `
                    <button type="button" onclick="ugcAppActions.copySosmedText()" class="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-emerald-600 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wide text-zinc-300 hover:text-white transition-all shadow-md cursor-pointer">
                      ${state.copiedSosmed ? `<i class="ph ph-check-circle"></i> Tersalin!` : `<i class="ph ph-copy"></i> Copy Teks`}
                    </button>
                  ` : ''}
                </div>

                <div class="relative">
                  ${state.isGeneratingSosmed ? `
                    <div class="h-40 flex flex-col items-center justify-center gap-4 text-emerald-400/50">
                      <i class="ph ph-spinner animate-spin text-3xl"></i>
                      <p class="text-xs font-medium uppercase tracking-widest animate-pulse">Meracik kata-kata & hashtag viral...</p>
                    </div>
                  ` : `
                    <textarea oninput="window._ugcSetField('sosmedResult', this.value)" class="w-full min-h-[300px] bg-black/40 border border-white/5 rounded-xl p-5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all resize-y leading-relaxed font-modern">${esc(state.sosmedResult)}</textarea>
                  `}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // 9. CAROUSEL SETUP (LENGKAP DENGAN KOTAK GAYA VISUAL, TONE & CTA)
    if (v === 'carousel-setup') {
      return `
        ${renderNavbar('mode-selection', false)}
        <div class="flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 lg:px-20 relative z-20">
          <div class="max-w-4xl mx-auto w-full flex flex-col gap-8">
            ${renderSectionTitle('Carousel Product', 'Desain carousel post (slide-by-slide) dengan alur cerita berkesinambungan secara otomatis.')}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
                ${renderUploadZone('Upload Produk (Opsional)', state.carImage, 'in-ugc-car-img', 'ph-package', 'carImage', false)}
                <p class="text-[10px] text-zinc-500 mt-4 text-center">AI akan menjadikan gambar ini referensi visual utama di seluruh slide.</p>
              </div>

              <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
                <div class="space-y-3">
                  <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Tipe Carousel</label>
                  <select onchange="window._ugcSetField('carTemplate', this.value)" class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all cursor-pointer">
                    <option value="Testimonial / Review" ${state.carTemplate === 'Testimonial / Review' ? 'selected' : ''}>Testimonial / Review</option>
                    <option value="Edukasi / Tips & Trik" ${state.carTemplate === 'Edukasi / Tips & Trik' ? 'selected' : ''}>Edukasi / Tips & Trik</option>
                    <option value="Promo / Diskon" ${state.carTemplate === 'Promo / Diskon' ? 'selected' : ''}>Promo / Diskon Spesial</option>
                    <option value="Storytelling / Brand Story" ${state.carTemplate === 'Storytelling / Brand Story' ? 'selected' : ''}>Storytelling / Brand Story</option>
                    <option value="Product Launch" ${state.carTemplate === 'Product Launch' ? 'selected' : ''}>Product Launch / Showcase</option>
                  </select>
                </div>

                <div class="space-y-3">
                  <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Total Slide (2 - 9)</label>
                  <input type="number" min="2" max="9" value="${state.carSlides}" oninput="window._ugcSetField('carSlides', Number(this.value))" class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all" />
                </div>

                <div class="space-y-3">
                  <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Format / Aspect Ratio</label>
                  <select onchange="window._ugcSetField('carRatio', this.value)" class="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition-all cursor-pointer">
                    <option value="1:1 (Square)" ${state.carRatio === '1:1 (Square)' ? 'selected' : ''}>1:1 (Square - Instagram Feed)</option>
                    <option value="4:5 (Portrait)" ${state.carRatio === '4:5 (Portrait)' ? 'selected' : ''}>4:5 (Portrait - Instagram Feed)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Informasi Brand & Produk -->
            <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-5">
              <h3 class="text-sm font-bold text-white mb-2 flex items-center gap-2"><i class="ph ph-layout text-emerald-400"></i> Informasi Brand & Produk</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input type="text" placeholder="Nama Brand (cth: BrewCraft)" value="${esc(state.carBrand)}" oninput="window._ugcSetField('carBrand', this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-400" />
                <input type="text" placeholder="Username (cth: brewcraft_id)" value="${esc(state.carUsername)}" oninput="window._ugcSetField('carUsername', this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-400" />
                <input type="text" placeholder="Nama Produk / Topik" value="${esc(state.carProductName)}" oninput="window._ugcSetField('carProductName', this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-400" />
                <input type="text" placeholder="Kategori (cth: Skincare, Kopi)" value="${esc(state.carCategory)}" oninput="window._ugcSetField('carCategory', this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-400" />
              </div>
              <textarea placeholder="Deskripsi Singkat Produk..." oninput="window._ugcSetField('carDesc', this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-400 h-20 resize-none">${esc(state.carDesc)}</textarea>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input type="text" placeholder="Manfaat Utama / Problem Solved" value="${esc(state.carBenefit)}" oninput="window._ugcSetField('carBenefit', this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-400" />
                <input type="text" placeholder="Target Audience (cth: Wanita 20-30th)" value="${esc(state.carTarget)}" oninput="window._ugcSetField('carTarget', this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-400" />
              </div>
            </div>

            <!-- Gaya Visual, Tone & CTA (DIKEMBALIKAN 100% UTUH) -->
            <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-5">
              <h3 class="text-sm font-bold text-white mb-2 flex items-center gap-2"><i class="ph ph-sparkle text-emerald-400"></i> Gaya Visual, Tone & CTA</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="space-y-2">
                  <label class="text-[10px] text-zinc-500 uppercase tracking-widest block">Gaya Visual</label>
                  <input type="text" value="${esc(state.carVisual)}" oninput="window._ugcSetField('carVisual', this.value)" placeholder="cth: Minimalist, Bold, Natural" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] text-zinc-500 uppercase tracking-widest block">Color Mood</label>
                  <input type="text" value="${esc(state.carColor)}" oninput="window._ugcSetField('carColor', this.value)" placeholder="cth: Warm, Pastel, Dark Elegant" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] text-zinc-500 uppercase tracking-widest block">Tone Copywriting</label>
                  <input type="text" value="${esc(state.carTone)}" oninput="window._ugcSetField('carTone', this.value)" placeholder="cth: Casual, Profesional, Humoris" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div class="space-y-2">
                  <label class="text-[10px] text-zinc-500 uppercase tracking-widest block">Platform Tujuan</label>
                  <input type="text" value="${esc(state.carPlatform)}" oninput="window._ugcSetField('carPlatform', this.value)" placeholder="cth: Instagram, LinkedIn" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] text-zinc-500 uppercase tracking-widest block">CTA (Teks Tombol Akhir)</label>
                  <input type="text" value="${esc(state.carCTA)}" oninput="window._ugcSetField('carCTA', this.value)" placeholder="cth: Beli Sekarang, Klik Link Bio" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white" />
                </div>
              </div>
            </div>

            <div class="pt-4">
              <button type="button" onclick="ugcAppActions.generateCarousel()" ${state.isGeneratingCarousel ? 'disabled' : ''} class="relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                <i class="ph ph-stack text-lg"></i> Mulai Generate Carousel (${state.carSlides} Slide)
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 10. CAROUSEL RESULT (LENGKAP DENGAN PROGRESS BAR & LABEL SLIDE)
    if (v === 'carousel-result') {
      var slidesHtml = Array.from({ length: state.carSlides }).map(function (_, index) {
        var image = state.carouselResults[index];
        var isCurrentlyLoading = state.isGeneratingCarousel && state.carouselProgress === index + 1;
        return `
          <div class="flex-shrink-0 flex flex-col gap-4 group snap-center w-[280px] md:w-[360px]">
            <div class="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-500 ${state.carRatio === '4:5 (Portrait)' ? 'aspect-[4/5]' : 'aspect-square'} ${image ? 'hover:border-green-500/30 shadow-2xl' : ''}">
              ${image ? `
                <img src="${image}" alt="Slide ${index + 1}" class="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-20">
                  <button type="button" onclick="ugcAppActions.setPreview(state.carouselResults[${index}])" class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all text-white shadow-xl cursor-pointer">
                    <i class="ph ph-magnifying-glass-plus text-xl"></i>
                  </button>
                </div>
              ` : `
                <div class="absolute inset-0 flex items-center justify-center">
                  ${isCurrentlyLoading ? renderGeneratingState(index) : `
                    <div class="text-zinc-600 text-xs font-medium tracking-widest uppercase flex flex-col items-center gap-2">
                      <i class="ph ph-stack text-2xl opacity-50"></i>
                      Menunggu Antrean...
                    </div>
                  `}
                </div>
              `}
            </div>

            ${image && !state.isGeneratingCarousel ? `
              <div class="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Slide 0${index + 1} / 0${state.carSlides}</span>
                  <span class="text-[9px] text-zinc-500">${index === 0 ? 'Hero/Hook' : index === state.carSlides - 1 ? 'Closing/CTA' : 'Body/Content'}</span>
                </div>
                <button type="button" onclick="ugcAppActions.downloadSingle('carousel', ${index}, '${state.carRatio}')" class="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-emerald-300 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
                  <i class="ph ph-download-simple"></i> Unduh
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="relative h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-slate-950/90 backdrop-blur-md z-30 shrink-0">
          <div class="flex items-center gap-4 md:gap-6">
            <div class="flex flex-col">
              <span class="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">Project Carousel</span>
              <span class="text-xs md:text-sm font-medium text-white truncate">${esc(state.carTemplate)} / ${esc(state.carProductName)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 md:gap-4">
            ${!state.isGeneratingCarousel ? `
              <button type="button" onclick="ugcAppActions.setView('carousel-setup')" class="flex items-center gap-1 p-2 text-[10px] md:text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-white transition-colors cursor-pointer">
                <i class="ph ph-caret-left"></i> Kembali
              </button>
              <button type="button" onclick="ugcAppActions.resetAll()" class="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-[10px] md:text-xs font-bold tracking-widest uppercase rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer">Buat Baru</button>
            ` : ''}
          </div>
        </div>

        <div class="max-w-[1920px] mx-auto p-4 md:p-8 lg:p-12 pb-32 w-full">
          ${state.isGeneratingCarousel ? `
            <div class="mb-12 flex flex-col items-center justify-center p-8 bg-zinc-900/40 rounded-3xl border border-emerald-500/30">
              <i class="ph ph-spinner text-4xl text-emerald-400 animate-spin mb-4"></i>
              <h3 class="text-lg font-bold text-white mb-1">Menyusun Storyboard Carousel...</h3>
              <p class="text-xs text-zinc-400">AI sedang memproses Slide ${state.carouselProgress} dari${state.carSlides}</p>
              <div class="w-full max-w-md h-2 bg-black rounded-full mt-4 overflow-hidden border border-white/10">
                <div class="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500" style="width: ${(state.carouselProgress / state.carSlides) * 100}%"></div>
              </div>
            </div>
          ` : ''}

          <div class="flex flex-nowrap overflow-x-auto gap-6 md:gap-8 pb-8 snap-x">
            ${slidesHtml}
          </div>
        </div>
      `;
    }

    return '';
  }

  function renderAudioStudioPopup() {
    if (!state.isAudioStudioOpen) return '';

    return `
      <div class="fixed z-[100] right-4 bottom-4 md:right-8 md:bottom-8 bg-slate-950/95 backdrop-blur-xl border border-emerald-500/20 shadow-[0_0_50px_rgba(34,197,94,0.15)] transition-all duration-300 flex flex-col overflow-hidden origin-bottom-right ${state.isAudioStudioMinimized ? 'w-[200px] h-[48px] rounded-2xl opacity-80 hover:opacity-100' : 'w-[calc(100vw-32px)] md:w-[700px] h-[calc(100vh-100px)] md:h-[520px] rounded-3xl opacity-100 scale-100'}">
        <div onclick="ugcAppActions.toggleMinimizeAudio()" class="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <i class="ph ph-speaker-high text-emerald-400 text-xs"></i>
            </div>
            <span class="text-[11px] font-bold tracking-widest uppercase text-zinc-100">Audio Studio</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="event.stopPropagation(); ugcAppActions.toggleMinimizeAudio()" class="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <i class="ph ${state.isAudioStudioMinimized ? 'ph-caret-up' : 'ph-caret-down'}"></i>
            </button>
            <button type="button" onclick="event.stopPropagation(); ugcAppActions.closeAudioStudio()" class="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
              <i class="ph ph-x"></i>
            </button>
          </div>
        </div>

        ${!state.isAudioStudioMinimized ? `
          <div class="flex-grow overflow-y-auto p-5 md:p-6 flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 class="text-sm font-bold text-white tracking-wide mb-1">Naskah & Suara AI</h2>
                <p class="text-[10px] md:text-xs text-zinc-400 font-light">Atur naskah Voice Over dan pilih karakter suara untuk narasi video Anda.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-5 gap-5 flex-grow">
              <div class="md:col-span-3 flex flex-col gap-3 h-full">
                <div class="flex items-center justify-between">
                  <h3 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <i class="ph ph-file-text"></i> Teks Naskah VO
                  </h3>
                  <div class="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    ${['15s', '30s', '45s'].map(function (dur) {
                      return `<button type="button" onclick="ugcAppActions.setVoDuration('${dur}')" class="px-2.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${state.voDuration === dur ? 'bg-green-500/20 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-white'}">${dur}</button>`;
                    }).join('')}
                  </div>
                </div>

                <textarea oninput="window._ugcSetField('voScript', this.value)" placeholder="Ketik naskah Voice Over Anda di sini, atau tekan tombol AI Auto-Script di bawah..." class="w-full flex-grow min-h-[120px] bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-all resize-none leading-relaxed">${esc(state.voScript)}</textarea>

                <button type="button" onclick="ugcAppActions.generateVOScript()" ${state.isGeneratingVOScript ? 'disabled' : ''} class="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-zinc-200 cursor-pointer">
                  ${state.isGeneratingVOScript ? `<i class="ph ph-spinner animate-spin"></i> Menyusun Naskah...` : `<i class="ph ph-magic-wand text-emerald-400"></i> AI Auto-Script (${state.voDuration})`}
                </button>
              </div>

              <div class="md:col-span-2 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-5">
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <i class="ph ph-microphone"></i> Pengaturan Audio
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-1">Pilih Karakter Suara</label>
                    <div class="relative">
                      <select onchange="window._ugcSetField('voVoice', this.value)" class="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-3.5 py-3 text-[11px] text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer">
                        ${VOICES.map(function (v) {
                          return `<option value="${v.id}" ${state.voVoice === v.id ? 'selected' : ''} class="bg-zinc-900">${v.name}</option>`;
                        }).join('')}
                      </select>
                      <i class="ph ph-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"></i>
                    </div>
                  </div>

                  <div>
                    <label class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-1">Emosi / Nada Bicara</label>
                    <div class="relative">
                      <select onchange="window._ugcSetField('voTone', this.value)" class="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-3.5 py-3 text-[11px] text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer">
                        ${TONES.map(function (t) {
                          return `<option value="${t}" ${state.voTone === t ? 'selected' : ''} class="bg-zinc-900">${t}</option>`;
                        }).join('')}
                      </select>
                      <i class="ph ph-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"></i>
                    </div>
                  </div>
                </div>

                <div class="flex-grow flex flex-col justify-end gap-3 mt-4">
                  ${state.voAudioUrl ? `
                    <div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2.5">
                      <audio controls src="${state.voAudioUrl}" class="w-full h-8 opacity-90 hover:opacity-100 transition-opacity"></audio>
                      <a href="${state.voAudioUrl}" download="VO_${esc(state.productName || 'Audio')}_${esc(state.voTone)}.wav" class="w-full py-2 bg-green-500/10 text-emerald-300 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-colors">
                        <i class="ph ph-download-simple"></i> Unduh Audio (WAV)
                      </a>
                    </div>
                  ` : ''}

                  <button type="button" onclick="ugcAppActions.generateVOAudio()" ${state.isGeneratingVOAudio ? 'disabled' : ''} class="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-[11px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer">
                    ${state.isGeneratingVOAudio ? `<i class="ph ph-spinner animate-spin"></i> Memproses...` : `<i class="ph ph-play-circle"></i> Buat Audio VO`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPreviewModal() {
    if (!state.previewImage) return '';
    return `
      <div onclick="ugcAppActions.setPreview(null)" class="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 md:p-12">
        <div onclick="event.stopPropagation()" class="relative overflow-hidden rounded-lg shadow-2xl transition-all flex items-center justify-center bg-zinc-900 max-h-[90vh] max-w-[90vw]">
          <img src="${state.previewImage}" alt="Full Preview" class="max-h-[88vh] w-auto object-contain" />
          <button type="button" onclick="ugcAppActions.setPreview(null)" class="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-md border border-white/10 z-20 cursor-pointer">
            <i class="ph ph-x text-lg"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderApp() {
    var container = document.getElementById('wadah-utama-workflow-ugc') || document.getElementById('layar-workflow-ugc');
    if (!container) return;

    container.innerHTML = `
      <div class="relative rounded-3xl min-h-[85vh] bg-slate-950 text-slate-100 font-sans selection:bg-emerald-900 selection:text-white overflow-x-hidden border border-emerald-500/20 shadow-2xl">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
          .font-elegant { font-family: 'Playfair Display', serif; }
          .font-modern { font-family: 'Montserrat', sans-serif; }
        </style>
        <div class="absolute top-[-10%] left-[-10%] w-[70%] h-[40%] rounded-full bg-green-600/15 blur-[120px] md:blur-[150px] pointer-events-none"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[70%] h-[40%] rounded-full bg-teal-500/10 blur-[120px] md:blur-[150px] pointer-events-none"></div>
        <div class="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div class="relative z-10 w-full h-full flex flex-col min-h-[85vh]">
          ${renderMainView()}
        </div>
        ${renderAudioStudioPopup()}
        ${renderPreviewModal()}
      </div>
    `;
  }

  window.initWorkflowUGC = function () {
    renderApp();
  };

  document.addEventListener('DOMContentLoaded', function () {
    renderApp();
  });
})();
