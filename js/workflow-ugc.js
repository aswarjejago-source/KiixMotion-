// =========================================================
// FILE: js/workflow-ugc.js
// INGKI AI STUDIOPRO v6.1 — FULL WORKFLOW UGC ENGINE
// Terintegrasi Khusus untuk KiixMotion Studio (BYOK Member)
// =========================================================

(function () {
  var isMounted = false;
  var isLoadingScripts = false;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-loaded') === 'true') return resolve();
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        s.setAttribute('data-loaded', 'true');
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  window.initWorkflowUGC = async function () {
    var container = document.getElementById('wadah-utama-workflow-ugc');
    if (!container || isMounted || isLoadingScripts) return;

    isLoadingScripts = true;
    container.innerHTML =
      '<div class="p-12 text-center bg-slate-950 text-emerald-400 rounded-3xl border border-emerald-500/30">' +
      '<p class="text-xs font-bold uppercase tracking-widest animate-pulse">Memuat INGKI AI STUDIOPRO v6.1...</p>' +
      '</div>';

    try {
      if (!window.React) {
        await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
      }
      if (!window.ReactDOM) {
        await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
      }
      mountIngkiStudioApp(container);
      isMounted = true;
    } catch (err) {
      console.error('Gagal memuat engine Workflow UGC:', err);
      container.innerHTML =
        '<div class="p-8 text-center bg-rose-950 text-rose-300 rounded-3xl border border-rose-500/30">' +
        '<p class="text-xs font-bold">Gagal memuat komponen Studio. Silakan muat ulang halaman.</p>' +
        '</div>';
    } finally {
      isLoadingScripts = false;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof navLayarAktif !== 'undefined' && navLayarAktif === 'workflow-ugc') {
      window.initWorkflowUGC();
    }
  });

  function mountIngkiStudioApp(container) {
    var React = window.React;
    var ReactDOM = window.ReactDOM;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var h = React.createElement;

    // --- KOMPONEN IKON LUCIDE SETARA ASLI ---
    function createIcon(paths) {
      return function IconComponent(props) {
        var className = (props && props.className) || 'w-5 h-5';
        return h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: className
          },
          paths.map(function (p, i) {
            return h(p.tag || 'path', Object.assign({ key: i }, p.attrs));
          })
        );
      };
    }

    var Upload = createIcon([
      { attrs: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
      { tag: 'polyline', attrs: { points: '17 8 12 3 7 8' } },
      { tag: 'line', attrs: { x1: '12', y1: '3', x2: '12', y2: '15' } }
    ]);
    var ImageIcon = createIcon([
      { tag: 'rect', attrs: { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' } },
      { tag: 'circle', attrs: { cx: '9', cy: '9', r: '2' } },
      { attrs: { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' } }
    ]);
    var Sparkles = createIcon([
      { attrs: { d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z' } },
      { attrs: { d: 'M5 3v4' } },
      { attrs: { d: 'M19 17v4' } },
      { attrs: { d: 'M3 5h4' } },
      { attrs: { d: 'M17 19h4' } }
    ]);
    var Download = createIcon([
      { attrs: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
      { tag: 'polyline', attrs: { points: '7 10 12 15 17 10' } },
      { tag: 'line', attrs: { x1: '12', y1: '15', x2: '12', y2: '3' } }
    ]);
    var Camera = createIcon([
      { attrs: { d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z' } },
      { tag: 'circle', attrs: { cx: '12', cy: '13', r: '3' } }
    ]);
    var Package = createIcon([
      { attrs: { d: 'm7.5 4.27 9 5.15' } },
      { attrs: { d: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z' } },
      { attrs: { d: 'm3.3 7 8.7 5 8.7-5' } },
      { attrs: { d: 'M12 22V12' } }
    ]);
    var ArrowRight = createIcon([
      { attrs: { d: 'M5 12h14' } },
      { attrs: { d: 'm12 5 7 7-7 7' } }
    ]);
    var Video = createIcon([
      { attrs: { d: 'm22 8-6 4 6 4V8Z' } },
      { tag: 'rect', attrs: { width: '14', height: '12', x: '2', y: '6', rx: '2', ry: '2' } }
    ]);
    var Hand = createIcon([
      { attrs: { d: 'M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0' } },
      { attrs: { d: 'M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2' } },
      { attrs: { d: 'M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8' } },
      { attrs: { d: 'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15' } }
    ]);
    var Smartphone = createIcon([
      { tag: 'rect', attrs: { width: '14', height: '20', x: '5', y: '2', rx: '2', ry: '2' } },
      { attrs: { d: 'M12 18h.01' } }
    ]);
    var ChevronLeft = createIcon([{ attrs: { d: 'm15 18-6-6 6-6' } }]);
    var Layout = createIcon([
      { tag: 'rect', attrs: { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' } },
      { tag: 'line', attrs: { x1: '3', y1: '9', x2: '21', y2: '9' } },
      { tag: 'line', attrs: { x1: '9', y1: '21', x2: '9', y2: '9' } }
    ]);
    var Layers = createIcon([
      { attrs: { d: 'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z' } },
      { attrs: { d: 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65' } },
      { attrs: { d: 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' } }
    ]);
    var CheckCircle2 = createIcon([
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
      { attrs: { d: 'm9 12 2 2 4-4' } }
    ]);
    var Monitor = createIcon([
      { tag: 'rect', attrs: { width: '20', height: '14', x: '2', y: '3', rx: '2' } },
      { tag: 'line', attrs: { x1: '8', y1: '21', x2: '16', y2: '21' } },
      { tag: 'line', attrs: { x1: '12', y1: '17', x2: '12', y2: '21' } }
    ]);
    var Loader2 = createIcon([{ attrs: { d: 'M21 12a9 9 0 1 1-6.219-8.56' } }]);
    var Aperture = createIcon([
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
      { attrs: { d: 'm14.31 8 5.74 9.94' } },
      { attrs: { d: 'M9.69 8h11.48' } },
      { attrs: { d: 'm7.38 12 5.74-9.94' } },
      { attrs: { d: 'M9.69 16 3.95 6.06' } },
      { attrs: { d: 'M14.31 16H2.83' } },
      { attrs: { d: 'm16.62 12-5.74 9.94' } }
    ]);
    var X = createIcon([
      { attrs: { d: 'M18 6 6 18' } },
      { attrs: { d: 'm6 6 12 12' } }
    ]);
    var ChevronDown = createIcon([{ attrs: { d: 'm6 9 6 6 6-6' } }]);
    var ChevronUp = createIcon([{ attrs: { d: 'm18 15-6-6-6 6' } }]);
    var ZoomIn = createIcon([
      { tag: 'circle', attrs: { cx: '11', cy: '11', r: '8' } },
      { tag: 'line', attrs: { x1: '21', y1: '21', x2: '16.65', y2: '16.65' } },
      { tag: 'line', attrs: { x1: '11', y1: '8', x2: '11', y2: '14' } },
      { tag: 'line', attrs: { x1: '8', y1: '11', x2: '14', y2: '11' } }
    ]);
    var Eye = createIcon([
      { attrs: { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' } },
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } }
    ]);
    var Copy = createIcon([
      { tag: 'rect', attrs: { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' } },
      { attrs: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' } }
    ]);
    var FileText = createIcon([
      { attrs: { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' } },
      { tag: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
      { tag: 'line', attrs: { x1: '16', y1: '13', x2: '8', y2: '13' } },
      { tag: 'line', attrs: { x1: '16', y1: '17', x2: '8', y2: '17' } },
      { tag: 'line', attrs: { x1: '10', y1: '9', x2: '8', y2: '9' } }
    ]);
    var Volume2 = createIcon([
      { tag: 'polygon', attrs: { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' } },
      { attrs: { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' } },
      { attrs: { d: 'M19.07 4.93a10 10 0 0 1 0 14.14' } }
    ]);
    var Wand2 = createIcon([
      { attrs: { d: 'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z' } },
      { attrs: { d: 'm14 7 3 3' } },
      { attrs: { d: 'M5 6v4' } },
      { attrs: { d: 'M19 14v4' } },
      { attrs: { d: 'M10 2v2' } },
      { attrs: { d: 'M7 8H3' } },
      { attrs: { d: 'M21 16h-4' } },
      { attrs: { d: 'M11 3H9' } }
    ]);
    var PlayCircle = createIcon([
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
      { tag: 'polygon', attrs: { points: '10 8 16 12 10 16 10 8' } }
    ]);
    var Mic = createIcon([
      { attrs: { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' } },
      { attrs: { d: 'M19 10v2a7 7 0 0 1-14 0v-2' } },
      { tag: 'line', attrs: { x1: '12', y1: '19', x2: '12', y2: '22' } }
    ]);
    var ExternalLink = createIcon([
      { attrs: { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' } },
      { tag: 'polyline', attrs: { points: '15 3 21 3 21 9' } },
      { tag: 'line', attrs: { x1: '10', y1: '14', x2: '21', y2: '3' } }
    ]);
    var Archive = createIcon([
      { tag: 'rect', attrs: { width: '20', height: '5', x: '2', y: '3', rx: '1' } },
      { attrs: { d: 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8' } },
      { attrs: { d: 'M10 12h4' } }
    ]);
    var RotateCcw = createIcon([
      { attrs: { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' } },
      { attrs: { d: 'M3 3v5h5' } }
    ]);
    var PenTool = createIcon([
      { attrs: { d: 'm12 19 7-7 3 3-7 7-3-3z' } },
      { attrs: { d: 'm18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' } },
      { attrs: { d: 'm2 2 7.586 7.586' } },
      { tag: 'circle', attrs: { cx: '11', cy: '11', r: '2' } }
    ]);
    var KeyIcon = createIcon([
      { tag: 'circle', attrs: { cx: '7.5', cy: '15.5', r: '5.5' } },
      { attrs: { d: 'm21 2-9.6 9.6' } },
      { attrs: { d: 'm15.5 7.5 3 3L22 7l-3-3' } }
    ]);

    // --- KONSTANTA MODEL & PROMPT ENGINE ASLI (100% UTUH) ---
    var STORAGE_KEY_UGC = 'kiix_ugc_gemini_key';
    var GENERATIVE_MODEL = "gemini-2.5-flash-image-preview";
    var TEXT_MODEL = "gemini-2.5-flash-preview-09-2025";
    var TTS_MODEL = "gemini-2.5-flash-preview-tts";

    var AppLogo = function (props) {
      var className = (props && props.className) || "";
      return h(
        'div',
        { className: "flex items-center justify-center font-elegant font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 " + className },
        'I'
      );
    };

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

    // --- PROMPT ENGINE LOGIC (100% UTUH) ---
    var IDENTITY_LOCK = "CRITICAL IDENTITY LOCK: The person MUST have the EXACT same face, gender, facial structure, hair style (e.g., if hair is down it stays down, if tied it stays tied), skin tone, and body proportions as the base model reference. This is the exact same person. Do NOT change their gender, identity, or ethnicity. Clone their physical appearance perfectly.";

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

          subjectPrompt = "RAW AUTHENTIC UGC PHOTO (" + cameraLogic.split('.')[0] + "). Model facing camera naturally. Candid mid-sentence expression. Model casually interacting with " + productName + " (" + productDesc + ") in an everyday setting. CRITICAL: Extremely realistic human skin texture, visible pores, subtle blemishes, unedited natural look. Single harsh light casting distinct, realistic shadows for 3D depth. Real-world lived-in background, no studio setup.";
          negPrompt = "studio lighting, softbox, flat lighting, professional photography, DSLR, perfect smooth plastic skin, beauty filter, airbrushed, over-polished, cinematic lighting, 3d render, illustration.";
          lipSyncLogic = "LIP-SYNC: Model is speaking, mouth moving precisely to dialogue: '[SCRIPT_SCENE_TERSEBUT]'.";
          break;

        case 'commercial':
          cameraLogic = "Professional high-end commercial product photography. Shot on Hasselblad medium format. Single harsh directional spotlight, deep striking shadows, crisp sharp details, highly polished catalog aesthetic, 8k resolution.";
          subjectPrompt = "AWARD-WINNING COMMERCIAL SHOT. Masterpiece photography. Model looking pristine and perfectly styled, elegantly presenting " + productName + " (" + productDesc + "). The product is heroically displayed with distinct shadows for 3D dimensionality, high contrast, and hyper-realistic textures. Clean, aesthetic background.";
          negPrompt = "Amateur, smartphone photo, messy background, low quality, flat lighting, softbox, grainy, blurry, casual everyday lighting, distorted, bad anatomy, ugly, candid, snapshot, text, watermark.";
          motionCamera = "Smooth cinematic slider movement, slow motion, showcasing the product elegantly.";
          lipSyncLogic = "LIP-SYNC: Professional commercial delivery, smiling while speaking dialogue: '[SCRIPT_SCENE_TERSEBUT]'.";
          break;

        case 'mirror':
          cameraLogic = "Authentic mirror selfie. Shot on iPhone 15 Pro. Harsh directional room light or hard flash creating deep shadows, photorealistic.";
          subjectPrompt = "RAW MIRROR SELFIE PHOTO. Model standing in front of a mirror taking a mirror selfie with a smartphone. Model is stylishly showcasing " + productName + " (" + productDesc + "). Trendy OOTD aesthetic. Real skin texture, unedited look. Single harsh light creating bold 3D dimensionality. Mirror reflection visible.";
          negPrompt = "Flat lighting, soft ambient light, TV commercial look, amateur, basic white background, 3d render, illustration, not a mirror selfie, missing phone.";
          motionCamera = "Slight natural handheld camera shake, mimicking a mirror selfie recording.";
          lipSyncLogic = "AMBIENT: Casual posing in the mirror, natural breathing, no talking.";
          break;

        case 'pov':
          cameraLogic = "Authentic everyday first-person POV, shot on an iPhone 15, looking down, harsh directional lighting casting distinct hand shadows, photorealistic.";
          subjectPrompt = "RAW FIRST-PERSON POV SHOT. Authentic everyday lifestyle. Only hands visible naturally holding or unboxing " + productName + " (" + productDesc + "). Shot from user's eye-level looking down at hands. Single harsh directional light, distinct hard shadows. NO FACES, NO BODIES. Real skin texture, highly detailed macro focus on product. ABSOLUTELY NO TEXT OR UI.";
          negPrompt = "Face, head, hair, eyes, mouth, neck, torso, legs, feet, full body, flat lighting, over-rendered, artificial studio lighting, highly polished professional shot, 3D render, illustration, painting, text, typography, watermark, UI.";
          motionCamera = "Authentic first-person POV, slight natural smartphone camera shake, looking down. Pair of hands naturally interacting with the product.";
          break;

        default:
          cameraLogic = "Standard high quality camera setup.";
          subjectPrompt = "High quality photorealistic shot of model with " + productName + " (" + productDesc + ").";
          negPrompt = "Distorted, blurry, illustration, 3d.";
          motionCamera = "Static.";
          break;
      }

      return { subjectPrompt: subjectPrompt, negPrompt: negPrompt, cameraLogic: cameraLogic, motionCamera: motionCamera, lipSyncLogic: lipSyncLogic };
    };

    var GeneratingState = function (props) {
      var index = props.index;
      return h(
        'div',
        { className: "absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20 transition-all duration-500" },
        h('div', { className: "absolute w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" }),
        h(
          'div',
          { className: "relative z-10 flex flex-col items-center gap-6" },
          h(
            'div',
            { className: "relative w-12 h-12" },
            h('div', { className: "absolute inset-0 rounded-full border-[1px] border-white/5" }),
            h('div', { className: "absolute inset-0 rounded-full border-t-[1px] border-emerald-400 animate-[spin_1.5s_linear_infinite]" }),
            h('div', { className: "absolute inset-0 flex items-center justify-center" }, h('div', { className: "w-1 h-1 bg-emerald-300 rounded-full animate-ping" }))
          ),
          h(
            'div',
            { className: "text-center space-y-3" },
            h('p', { className: "text-[10px] font-bold tracking-[0.4em] text-white uppercase animate-pulse" }, 'Rendering'),
            h(
              'div',
              { className: "flex items-center justify-center gap-3 opacity-50" },
              h('div', { className: "w-3 h-px bg-gradient-to-r from-transparent to-emerald-400" }),
              h('p', { className: "text-[9px] font-medium tracking-widest text-emerald-200 uppercase font-mono" }, 'Scene ' + String(index + 1).padStart(2, '0')),
              h('div', { className: "w-3 h-px bg-gradient-to-l from-transparent to-emerald-400" })
            )
          )
        )
      );
    };

    var LayoutWrapper = function (props) {
      var className = props.className || "";
      return h(
        'div',
        { className: "relative rounded-3xl min-h-[84vh] bg-slate-950 text-slate-100 font-sans selection:bg-emerald-900 selection:text-white overflow-x-hidden border border-emerald-500/20 shadow-2xl " + className },
        h('style', null, "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap'); .font-elegant { font-family: 'Playfair Display', serif; } .font-modern { font-family: 'Montserrat', sans-serif; }"),
        h('div', { className: "absolute top-[-10%] left-[-10%] w-[70%] h-[40%] rounded-full bg-green-600/15 blur-[120px] md:blur-[150px] pointer-events-none" }),
        h('div', { className: "absolute bottom-[-10%] right-[-10%] w-[70%] h-[40%] rounded-full bg-teal-500/10 blur-[120px] md:blur-[150px] pointer-events-none" }),
        h('div', { className: "relative z-10 w-full h-full flex flex-col min-h-[84vh]" }, props.children)
      );
    };

    var SectionTitle = function (props) {
      return h(
        'div',
        { className: "animate-in fade-in slide-in-from-bottom-4 duration-700" },
        h('h2', { className: "text-3xl md:text-5xl font-elegant font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 mb-3 drop-shadow-sm" }, props.title),
        props.subtitle && h('p', { className: "text-emerald-100/60 font-modern text-sm md:text-base font-medium leading-relaxed max-w-xl" }, props.subtitle)
      );
    };

    var UploadZone = function (props) {
      var image = props.image;
      var onClick = props.onClick;
      var label = props.label;
      var Icon = props.icon;
      return h(
        'div',
        { className: "space-y-3 group" },
        h(
          'div',
          { className: "flex justify-between items-baseline px-1" },
          h('span', { className: "text-[10px] md:text-xs font-bold tracking-widest text-zinc-500 uppercase" }, label),
          image && h('span', { className: "text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1" }, h(CheckCircle2, { className: "w-3 h-3" }), ' Ready')
        ),
        h(
          'div',
          {
            onClick: function () { playClick(); onClick(); },
            className: "relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 border border-white/5 bg-zinc-900/20 group-hover:border-green-500/30 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group-hover:bg-green-950/20"
          },
          image
            ? h(
                React.Fragment,
                null,
                h('img', { src: image, className: "w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 scale-100 group-hover:scale-105" }),
                h(
                  'div',
                  { className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]" },
                  h('span', { className: "px-4 py-2 rounded-full border border-green-400/50 bg-green-950/80 text-xs font-medium text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]" }, 'Change')
                ),
                h(
                  'div',
                  { className: "absolute bottom-2 right-2 md:hidden" },
                  h('div', { className: "bg-emerald-500 rounded-full p-1" }, h(CheckCircle2, { className: "w-3 h-3 text-black" }))
                )
              )
            : h(
                'div',
                { className: "absolute inset-0 flex flex-col items-center justify-center gap-4 md:gap-6 p-4 text-center" },
                h(
                  'div',
                  { className: "w-12 h-12 md:w-16 md:h-16 rounded-full border border-white/5 flex items-center justify-center bg-white/5 text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:scale-110 transition-all duration-500 shadow-2xl" },
                  h(Icon, { className: "w-5 h-5 md:w-6 md:h-6" })
                ),
                h('p', { className: "text-[10px] md:text-xs text-zinc-600 group-hover:text-emerald-300 font-medium tracking-wide transition-colors" }, 'TAP TO UPLOAD')
              )
        )
      );
    };

    var ButtonCTA = function (props) {
      return h(
        'button',
        {
          type: 'button',
          onClick: function () { playClick(); props.onClick(); },
          disabled: props.disabled,
          className: "relative overflow-hidden w-full py-4 md:py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] border border-emerald-400/50 cursor-pointer"
        },
        props.children
      );
    };

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

    // --- MAIN APP COMPONENT ---
    function App() {
      // State Khusus API Key Member (Terpisah dari Add Apikey utama)
      var _ugcKeyState = useState(function () { return localStorage.getItem(STORAGE_KEY_UGC) || ''; });
      var ugcApiKey = _ugcKeyState[0], setUgcApiKey = _ugcKeyState[1];

      var _tempKeyState = useState(function () { return localStorage.getItem(STORAGE_KEY_UGC) || ''; });
      var tempKeyInput = _tempKeyState[0], setTempKeyInput = _tempKeyState[1];

      var _keyModalState = useState(function () { return !localStorage.getItem(STORAGE_KEY_UGC); });
      var isKeyPanelOpen = _keyModalState[0], setIsKeyPanelOpen = _keyModalState[1];

      var apiKey = (ugcApiKey || '').trim();

      var ensureApiKey = function () {
        if (!apiKey) {
          setIsKeyPanelOpen(true);
          if (typeof tampilkanNotif === 'function') {
            tampilkanNotif('Pasang API Key Google AI Studio kamu dulu di kotak atas Workflow UGC!', 'error');
          } else {
            alert('Pasang API Key Google AI Studio kamu dulu di kotak atas Workflow UGC!');
          }
          return false;
        }
        return true;
      };

      var handleSaveMemberKey = function () {
        var cleaned = (tempKeyInput || '').trim();
        if (!cleaned) {
          if (typeof tampilkanNotif === 'function') tampilkanNotif('Tempel kode API Key Google AI Studio terlebih dahulu!', 'error');
          return;
        }
        setUgcApiKey(cleaned);
        localStorage.setItem(STORAGE_KEY_UGC, cleaned);
        setIsKeyPanelOpen(false);
        if (typeof tampilkanNotif === 'function') tampilkanNotif('API Key Workflow UGC berhasil disimpan!', 'sukses');
      };

      var handleClearMemberKey = function () {
        setTempKeyInput('');
        setUgcApiKey('');
        localStorage.removeItem(STORAGE_KEY_UGC);
        setIsKeyPanelOpen(true);
        if (typeof tampilkanNotif === 'function') tampilkanNotif('API Key Workflow UGC dihapus.', 'info');
      };

      var _view = useState('mode-selection'), view = _view[0], setView = _view[1];
      var _selMode = useState(null), selectedMode = _selMode[0], setSelectedMode = _selMode[1];

      var _modelImg = useState(null), modelImage = _modelImg[0], setModelImage = _modelImg[1];
      var _prodImg = useState(null), productImage = _prodImg[0], setProductImage = _prodImg[1];
      var _clothImg = useState(null), clothingImage = _clothImg[0], setClothingImage = _clothImg[1];
      var _prodName = useState(""), productName = _prodName[0], setProductName = _prodName[1];
      var _prodDesc = useState(""), productDesc = _prodDesc[0], setProductDesc = _prodDesc[1];
      var _dynBgs = useState(MODE_BACKGROUNDS.ugc), dynamicBackgrounds = _dynBgs[0], setDynamicBackgrounds = _dynBgs[1];

      var _bgType = useState('preset'), bgType = _bgType[0], setBgType = _bgType[1];
      var _customBg = useState(""), customBg = _customBg[0], setCustomBg = _customBg[1];

      var _isAnal = useState(false), isAnalyzingProduct = _isAnal[0], setIsAnalyzingProduct = _isAnal[1];
      var _isConf = useState(false), isProductConfirmed = _isConf[0], setIsProductConfirmed = _isConf[1];

      var _config = useState({
        background: MODE_BACKGROUNDS.ugc[0],
        ratio: '9:16',
        scenes: 4,
        ugcStyle: 'Handheld'
      }), config = _config[0], setConfig = _config[1];

      var _isGen = useState(false), isGenerating = _isGen[0], setIsGenerating = _isGen[1];
      var _genImgs = useState([]), generatedImages = _genImgs[0], setGeneratedImages = _genImgs[1];
      var _scLoad = useState({}), sceneLoadings = _scLoad[0], setSceneLoadings = _scLoad[1];
      var _scPrompts = useState({}), scenePrompts = _scPrompts[0], setScenePrompts = _scPrompts[1];
      var _prevImg = useState(null), previewImage = _prevImg[0], setPreviewImage = _prevImg[1];
      var _copStates = useState({}), copiedStates = _copStates[0], setCopiedStates = _copStates[1];

      var _audOpen = useState(false), isAudioStudioOpen = _audOpen[0], setIsAudioStudioOpen = _audOpen[1];
      var _audMin = useState(false), isAudioStudioMinimized = _audMin[0], setIsAudioStudioMinimized = _audMin[1];

      var _voScript = useState(""), voScript = _voScript[0], setVoScript = _voScript[1];
      var _voDur = useState("15s"), voDuration = _voDur[0], setVoDuration = _voDur[1];
      var _voVoice = useState(VOICES[0].id), voVoice = _voVoice[0], setVoVoice = _voVoice[1];
      var _voTone = useState(TONES[1]), voTone = _voTone[0], setVoTone = _voTone[1];
      var _voUrl = useState(null), voAudioUrl = _voUrl[0], setVoAudioUrl = _voUrl[1];
      var _isGenVOS = useState(false), isGeneratingVOScript = _isGenVOS[0], setIsGeneratingVOScript = _isGenVOS[1];
      var _isGenVOA = useState(false), isGeneratingVOAudio = _isGenVOA[0], setIsGeneratingVOAudio = _isGenVOA[1];

      var _sosTitle = useState(""), sosmedTitle = _sosTitle[0], setSosmedTitle = _sosTitle[1];
      var _sosPlat = useState("TikTok"), sosmedPlatform = _sosPlat[0], setSosmedPlatform = _sosPlat[1];
      var _sosRes = useState(""), sosmedResult = _sosRes[0], setSosmedResult = _sosmedResult[1];
      var _isGenSos = useState(false), isGeneratingSosmed = _isGenSos[0], setIsGeneratingSosmed = _isGeneratingSosmed[1];
      var _copSos = useState(false), copiedSosmed = _copSos[0], setCopiedSosmed = _copSos[1];

      var _carImg = useState(null), carImage = _carImg[0], setCarImage = _carImg[1];
      var _carTpl = useState("Testimonial / Review"), carTemplate = _carTpl[0], setCarTemplate = _carTpl[1];
      var _carSld = useState(5), carSlides = _carSld[0], setCarSlides = _carSld[1];
      var _carBrd = useState(""), carBrand = _carBrd[0], setCarBrand = _carBrd[1];
      var _carUsr = useState(""), carUsername = _carUsr[0], setCarUsername = _carUsr[1];
      var _carPrd = useState(""), carProductName = _carPrd[0], setCarProductName = _carPrd[1];
      var _carCat = useState(""), carCategory = _carCat[0], setCarCategory = _carCat[1];
      var _carDsc = useState(""), carDesc = _carDsc[0], setCarDesc = _carDsc[1];
      var _carBen = useState(""), carBenefit = _carBen[0], setCarBenefit = _carBen[1];
      var _carTgt = useState(""), carTarget = _carTgt[0], setCarTarget = _carTgt[1];
      var _carVis = useState("Natural Lifestyle"), carVisual = _carVis[0], setCarVisual = _carVis[1];
      var _carClr = useState("Warm"), carColor = _carClr[0], setCarColor = _carClr[1];
      var _carTon = useState("Friendly / Casual"), carTone = _carTon[0], setCarTone = _carTon[1];
      var _carPlt = useState("Instagram"), carPlatform = _carPlt[0], setCarPlatform = _carPlt[1];
      var _carRat = useState("1:1 (Square)"), carRatio = _carRat[0], setCarRatio = _carRat[1];
      var _carCTA = useState("Order Sekarang"), carCTA = _carCTA[0], setCarCTA = _carCTA[1];
      var _isGenCar = useState(false), isGeneratingCarousel = _isGenCar[0], setIsGeneratingCarousel = _isGenCar[1];
      var _carProg = useState(0), carouselProgress = _carProg[0], setCarouselProgress = _carProg[1];
      var _carRes = useState([]), carouselResults = _carRes[0], setCarouselResults = _carRes[1];
      var carImageInputRef = useRef(null);

      var _ugcGen = useState(UGC_GENDERS[1]), ugcGender = _ugcGen[0], setUgcGender = _ugcGen[1];
      var _ugcAge = useState(UGC_AGES[3]), ugcAge = _ugcAge[0], setUgcAge = _ugcAge[1];
      var _ugcCnt = useState(UGC_COUNTRIES[0]), ugcCountry = _ugcCnt[0], setUgcCountry = _ugcCnt[1];
      var _ugcSkn = useState(UGC_SKIN_TONES[1]), ugcSkin = _ugcSkn[0], setUgcSkin = _ugcSkn[1];
      var _ugcHSt = useState(UGC_HAIR_STYLES[0]), ugcHairStyle = _ugcHSt[0], setUgcHairStyle = _ugcHSt[1];
      var _ugcHCl = useState(UGC_HAIR_COLORS[0]), ugcHairColor = _ugcHCl[0], setUgcHairColor = _ugcHCl[1];
      var _ugcRat = useState(UGC_RATIOS[0].value), ugcRatio = _ugcRat[0], setUgcRatio = _ugcRat[1];

      var _ugcGImg = useState(null), ugcGeneratedImage = _ugcGImg[0], setUgcGeneratedImage = _ugcGImg[1];
      var _ugcDImg = useState(null), ugcDetailImage = _ugcDImg[0], setUgcDetailImage = _ugcDImg[1];
      var _isGUgc = useState(false), isGeneratingUgc = _isGUgc[0], setIsGeneratingUgc = _isGUgc[1];
      var _isGDet = useState(false), isGeneratingUgcDetail = _isGDet[0], setIsGeneratingUgcDetail = _isGDet[1];

      var _isVidOpen = useState(false), isVideoGeneratorsOpen = _isVidOpen[0], setIsVideoGeneratorsOpen = _isVidOpen[1];
      var _isDlZip = useState(false), isDownloadingZip = _isDlZip[0], setIsDownloadingZip = _isDlZip[1];

      useEffect(function () {
        if (view === 'mode-selection' || view === 'upload-setup') {
          var expensiveGreenBg = 'Latar Hitam Aksen Hijau Mewah (Premium Studio)';
          setBgType('custom');
          setCustomBg(expensiveGreenBg);
        }
      }, [view]);

      var modelInputRef = useRef(null);
      var productInputRef = useRef(null);
      var clothingInputRef = useRef(null);

      // Navbar dengan Tombol API Key Khusus Workflow UGC
      var Navbar = function (navProps) {
        return h(
          'div',
          { className: "relative z-[90] px-4 md:px-8 pt-4 pb-3 flex flex-col gap-3 bg-gradient-to-b from-slate-950/95 to-transparent border-b border-white/5" },
          h(
            'div',
            { className: "flex items-center justify-between gap-2" },
            h(
              'div',
              { className: "flex items-center gap-3" },
              h(
                'div',
                { className: "w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 flex items-center justify-center shadow-lg" },
                h(AppLogo, { className: "text-xl md:text-2xl" })
              ),
              h(
                'div',
                { className: "flex flex-col" },
                h(
                  'div',
                  { className: "flex items-center gap-2 mb-0.5" },
                  h('span', { className: "font-bold tracking-tight text-sm md:text-lg leading-none text-white uppercase font-modern" }, 'INGKI AI STUDIOPRO'),
                  h('span', { className: "px-1.5 py-0.5 rounded bg-gradient-to-r from-green-600 to-emerald-500 text-[8px] font-bold text-white tracking-widest uppercase leading-none" }, 'v6.1')
                ),
                h('span', { className: "text-[9px] md:text-[10px] text-zinc-400 tracking-widest uppercase leading-none" }, 'AI Visual Generator')
              )
            ),
            h(
              'div',
              { className: "flex flex-wrap items-center gap-2" },
              h(
                'button',
                {
                  type: 'button',
                  onClick: function () { playClick(); setIsKeyPanelOpen(!isKeyPanelOpen); },
                  className: "px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer " +
                    (apiKey
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse")
                },
                h(KeyIcon, { className: "w-3.5 h-3.5" }),
                h('span', null, apiKey ? 'Key UGC Aktif' : 'Pasang Apikey')
              ),
              navProps.onViewResult && h(
                'button',
                {
                  type: 'button',
                  onClick: function () { playClick(); navProps.onViewResult(); },
                  className: "backdrop-blur-md bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-emerald-400 border border-green-500/50 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:from-green-600 hover:to-emerald-600 hover:text-white transition-all cursor-pointer"
                },
                h(Eye, { className: "w-3 h-3" }), ' Result'
              ),
              navProps.onReset && h(
                'button',
                {
                  type: 'button',
                  onClick: function () { playClick(); navProps.onReset(); },
                  className: "backdrop-blur-md bg-white/5 border border-white/10 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[10px] md:text-xs font-medium uppercase tracking-widest hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all cursor-pointer"
                },
                h(RotateCcw, { className: "w-3 h-3" }), ' Reset'
              ),
              navProps.onBack && h(
                'button',
                {
                  type: 'button',
                  onClick: function () { playClick(); navProps.onBack(); },
                  className: "backdrop-blur-md bg-white/5 border border-white/10 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[10px] md:text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer"
                },
                h(ChevronLeft, { className: "w-3 h-3" }), ' Back'
              )
            )
          ),
          isKeyPanelOpen && h(
            'div',
            { className: "bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-xl" },
            h(
              'div',
              { className: "flex flex-wrap items-center justify-between gap-2" },
              h('span', { className: "text-[11px] font-bold text-emerald-300 uppercase tracking-wider" }, '🔑 API Key Google AI Studio (Khusus Workflow UGC)'),
              h(
                'a',
                {
                  href: 'https://aistudio.google.com/app/apikey',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: "text-[11px] font-bold text-emerald-400 hover:text-emerald-200 underline flex items-center gap-1"
                },
                'Ambil API Key Gratis Disini ↗'
              )
            ),
            h(
              'div',
              { className: "flex flex-col sm:flex-row gap-2" },
              h('input', {
                type: 'password',
                value: tempKeyInput,
                onChange: function (e) { setTempKeyInput(e.target.value); },
                placeholder: 'Tempel kode API Key Google AI Studio (AIzaSy...) di sini',
                className: "flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
              }),
              h(
                'div',
                { className: "flex gap-2" },
                h(
                  'button',
                  {
                    type: 'button',
                    onClick: handleSaveMemberKey,
                    className: "flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  },
                  'Simpan Key'
                ),
                apiKey && h(
                  'button',
                  {
                    type: 'button',
                    onClick: handleClearMemberKey,
                    className: "px-3.5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer"
                  },
                  'Hapus'
                )
              )
            ),
            h('p', { className: "text-[10px] text-zinc-400" }, '*Tersimpan aman di browser kamu dan tidak bercampur dengan API Key RunningHub.')
          )
        );
      };

      var handleResetAndNew = function () {
        playClick();
        setSelectedMode(null);
        setModelImage(null);
        setProductImage(null);
        setClothingImage(null);
        setProductName("");
        setProductDesc("");
        setIsProductConfirmed(false);
        setBgType('preset');
        setCustomBg("");
        setConfig({
          background: MODE_BACKGROUNDS.ugc[0],
          ratio: '9:16',
          scenes: 4,
          ugcStyle: 'Handheld'
        });
        setGeneratedImages([]);
        setSceneLoadings({});
        setScenePrompts({});
        setPreviewImage(null);
        setCopiedStates({});
        setVoScript("");
        setVoAudioUrl(null);
        setSosmedTitle("");
        setSosmedResult("");

        setCarImage(null);
        setCarBrand("");
        setCarUsername("");
        setCarProductName("");
        setCarCategory("");
        setCarDesc("");
        setCarBenefit("");
        setCarTarget("");
        setCarouselResults([]);
        setCarouselProgress(0);

        setUgcGeneratedImage(null);
        setUgcDetailImage(null);
        setIsGeneratingUgc(false);
        setIsGeneratingUgcDetail(false);

        setIsGeneratingSosmed(false);
        setIsAudioStudioOpen(false);
        setIsAudioStudioMinimized(false);
        setIsVideoGeneratorsOpen(false);
        setView('mode-selection');
      };

      var updateSceneData = function (index, updates) {
        setGeneratedImages(function (prev) {
          var newArr = prev.slice();
          if (newArr[index]) {
            newArr[index] = Object.assign({}, newArr[index], updates);
          }
          return newArr;
        });
      };

      var getPromptForScene = function (sceneData) {
        if (!sceneData) return "";
        var contextLogic = "";
        if (sceneData.voActive) {
          if (sceneData.isBRoll) {
            contextLogic = "NARRATIVE VOICE-OVER: '" + sceneData.voText + "'. Product remains the main focus.";
          } else {
            contextLogic = "LIP-SYNC: Model is speaking, mouth moving precisely to dialogue: '" + sceneData.voText + "'.";
          }
        } else {
          contextLogic = sceneData.isBRoll ? "AMBIENT: No human visible, purely product focused." : "AMBIENT: Mouth closed or natural breathing, no talking.";
        }
        return "PROMPT: " + sceneData.videoMotion + " CAMERA: " + sceneData.videoCamera + " DETAILS: Photorealistic high-fidelity video generation. Maintain strict consistency with the provided image reference. CONTEXT: " + contextLogic + " ENVIRONMENT: " + sceneData.activeBackground + ". NEGATIVE: distortion, morphing, bad hands, text overlays.";
      };

      var handleCopyPrompt = function (index) {
        playClick();
        var sceneData = generatedImages[index];
        if (!sceneData) return;
        var dynamicPrompt = getPromptForScene(sceneData);
        safeCopyToClipboard(dynamicPrompt);
        setCopiedStates(function (prev) {
          var next = Object.assign({}, prev);
          next[index] = true;
          return next;
        });
        setTimeout(function () {
          setCopiedStates(function (prev) {
            var next = Object.assign({}, prev);
            next[index] = false;
            return next;
          });
        }, 2000);
      };

      var analyzeProductImage = async function (base64Image) {
        if (!ensureApiKey()) return;
        setIsAnalyzingProduct(true);
        setProductName("Sedang menganalisis...");
        setProductDesc("AI sedang mengidentifikasi detail produk...");
        try {
          var imageBase64 = base64Image.split(',')[1];
          var modeTitle = (selectedMode && selectedMode.title) || 'Komersial';
          var systemPrompt =
            'Tugas Anda adalah menganalisis gambar produk dan mengembalikan HANYA format JSON valid.\n' +
            '1. "productName": Identifikasi produk, maksimal 3 kata (Bahasa Indonesia).\n' +
            '2. "productDesc": Deskripsi SANGAT RINGKAS (kategori, merek, warna/ciri menonjol).\n' +
            '3. "backgrounds": Array berisi 7 rekomendasi latar/background yang eksklusif & estetik untuk sesi ' + modeTitle + ' produk tersebut di Indonesia.\n\n' +
            'Contoh output:\n' +
            '{\n' +
            '  "productName": "Sepatu Lari Nike",\n' +
            '  "productDesc": "Sepatu lari Nike Air Max warna putih dan biru.",\n' +
            '  "backgrounds": ["Trek Lari Senayan", "Jalanan Sudirman", "Studio Putih", "Teras Cafe", "Ruang Tamu Estetik", "Track Urban", "Taman Kota"]\n' +
            '}';

          var payload = {
            contents: [{
              parts: [
                { text: systemPrompt },
                { inlineData: { mimeType: "image/png", data: imageBase64 } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          };

          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + TEXT_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            var result = await response.json();
            var text = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].text;
            if (text) {
              var data = JSON.parse(text);
              setProductName(data.productName || "Produk Terdeteksi");
              setProductDesc(data.productDesc || "Detail produk.");
              var baseBgs = selectedMode ? MODE_BACKGROUNDS[selectedMode.id] : MODE_BACKGROUNDS.ugc;
              if (data.backgrounds && Array.isArray(data.backgrounds) && data.backgrounds.length > 0) {
                var mergedBackgrounds = Array.from(new Set(data.backgrounds.concat(baseBgs)));
                setDynamicBackgrounds(mergedBackgrounds);
                setConfig(function (prev) { return Object.assign({}, prev, { background: data.backgrounds[0] || mergedBackgrounds[0] }); });
                setBgType('preset');
              } else {
                setDynamicBackgrounds(baseBgs);
                setConfig(function (prev) { return Object.assign({}, prev, { background: baseBgs[0] }); });
              }
            } else {
              setProductName("Produk Manual"); setProductDesc("Isi manual");
            }
          } else {
            setProductName("Produk Manual"); setProductDesc("Isi manual");
          }
        } catch (error) {
          console.error("Product analysis error:", error);
          setProductName("Produk Manual"); setProductDesc("Gagal memuat AI. Silakan isi manual.");
          var baseBgsFallback = selectedMode ? MODE_BACKGROUNDS[selectedMode.id] : MODE_BACKGROUNDS.ugc;
          setDynamicBackgrounds(baseBgsFallback);
          setConfig(function (prev) { return Object.assign({}, prev, { background: baseBgsFallback[0] }); });
        } finally {
          setIsAnalyzingProduct(false);
        }
      };

      var handleProductUpload = function (e) {
        playClick();
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onloadend = function () {
            var base64 = reader.result;
            setProductImage(base64);
            setIsProductConfirmed(false);
            analyzeProductImage(base64);
          };
          reader.readAsDataURL(file);
        }
      };

      var handleModelUpload = function (e) {
        playClick();
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onloadend = function () { setModelImage(reader.result); };
          reader.readAsDataURL(file);
        }
      };

      var handleClothingUpload = function (e) {
        playClick();
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onloadend = function () { setClothingImage(reader.result); };
          reader.readAsDataURL(file);
        }
      };

      var modes = [
        { id: 'ugc', title: 'Influencer Character', icon: Smartphone, desc: 'Buat Karakter Terbaikmu disini' },
        { id: 'affiliate', title: 'Affiliate Creator', icon: Video, desc: 'Gaya promosi kasual ala kreator TikTok/Reels, sangat natural' },
        { id: 'commercial', title: 'Commercial', icon: Package, desc: 'Kualitas studio profesional, bersih dan tajam' },
        { id: 'mirror', title: 'Mirror Check', icon: Camera, desc: 'Gaya mirror selfie, estetika OOTD di depan kaca' },
        { id: 'pov', title: 'POV Hand Review', icon: Hand, desc: 'Sudut pandang orang pertama (First-person view)' },
        { id: 'tts', title: 'Text To Voice Over', icon: Mic, desc: 'Buat Voice Over AI gratis dengan intonasi natural kualitas studio' },
        { id: 'sosmed', title: 'Sosmed Desk', icon: PenTool, desc: 'Buat caption & hashtag viral otomatis dari judul singkat' },
        { id: 'carousel', title: 'Carousel Product', icon: Layers, desc: 'Buat konten microblog/carousel slide-by-slide bersambung' }
      ];

      var ratios = [
        { label: 'Portrait', sub: '9:16', value: '9:16' },
        { label: 'Square', sub: '1:1', value: '1:1' },
        { label: 'Landscape', sub: '16:9', value: '16:9' }
      ];

      var sceneCounts = [4, 8, 12];

      var generateScripts = async function () {
        var toneInstruction = "Tone: Profesional, jernih, persuasif.";
        var narrativeArc = "Follow a logical 6-act narrative arc: context -> problem -> discovery -> interaction -> transformation -> resolution.";

        if ((selectedMode && selectedMode.id === 'ugc') || (selectedMode && selectedMode.id === 'affiliate')) {
          toneInstruction = "Tone: Sangat natural, ngobrol santai seperti UGC TikTok/Reels sungguhan, tidak terkesan membaca script, gunakan bahasa sehari-hari yang sangat membumi.";
          narrativeArc = "Follow a highly organic, natural TikTok/Reels style narrative: casual hook -> relatable problem -> introducing product as an everyday find -> showing real usage -> genuine reaction -> soft recommendation.";
        } else if (selectedMode && selectedMode.id === 'commercial') {
          toneInstruction = "Tone: Elegan, profesional, sangat meyakinkan seperti iklan TV premium.";
        } else if (selectedMode && selectedMode.id === 'mirror') {
          toneInstruction = "Tone: Stylish, trendy, fokus pada penampilan (OOTD) dan kepercayaan diri (Mirror Selfie style).";
        } else if (selectedMode && selectedMode.id === 'pov') {
          toneInstruction = "Tone: Review langsung, fokus pada detail produk, praktis, dan interaktif.";
        }

        var prompt = "Generate a JSON object with a single key 'scripts' containing an array of precisely " + config.scenes + " strings for a storyboard about " + productName + " (" + productDesc + "). " + narrativeArc + " IMPORTANT: Use Bahasa Indonesia. " + toneInstruction + " EXACT DURATION: Each script string MUST take exactly 6 to 8 seconds to speak. To achieve this, write STRICTLY between 18 and 25 words per string. Do not make it too short (< 15 words) or too long (> 25 words).";

        var payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        };

        try {
          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + TEXT_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            var result = await response.json();
            var text = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].text;
            var data = JSON.parse(text);
            if (data.scripts && data.scripts.length > 0) {
              return data.scripts;
            }
          }
        } catch (err) {
          console.error("Script gen error", err);
        }

        return Array.from({ length: config.scenes }).map(function (_, i) { return "Scene " + (i + 1) + ": Narasi default untuk " + productName + "."; });
      };

      var generateUgcInfluencer = async function () {
        if (!ensureApiKey()) return;
        playClick();
        setIsGeneratingUgc(true);
        setUgcGeneratedImage(null);
        setUgcDetailImage(null);
        setView('ugc-result');

        var prompt = "RAW AUTHENTIC SMARTPHONE PHOTO of a " + ugcAge + " " + ugcGender + " influencer/model. Nationality/Ethnicity: " + ugcCountry + ". Skin tone: " + ugcSkin + ". Hair style: " + ugcHairStyle + ". Hair color: " + ugcHairColor + ". Looking confidently at the camera. Extremely detailed real human skin texture, natural imperfections, visible pores. Casual, highly aesthetic everyday background. Single natural light source casting realistic shadows. UNEDITED authentic social media snapshot style. \nNEGATIVE: 3d render, cartoon, illustration, anime, deformed, plastic skin, professional studio setup, flat lighting, text, watermark.";

        var payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"], aspectRatio: ugcRatio }
        };

        try {
          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + GENERATIVE_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            var result = await response.json();
            var parts = (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) || [];
            var imgPart = parts.find(function (p) { return p.inlineData; });
            var base64Output = imgPart && imgPart.inlineData && imgPart.inlineData.data;
            if (base64Output) {
              setUgcGeneratedImage("data:image/png;base64," + base64Output);
            }
          }
        } catch (err) {
          console.error("UGC Influencer Gen Error", err);
        } finally {
          setIsGeneratingUgc(false);
        }
      };

      var generateUgcDetailing = async function () {
        if (!ugcGeneratedImage || !ensureApiKey()) return;
        playClick();
        setIsGeneratingUgcDetail(true);

        var base64Model = ugcGeneratedImage.split(',')[1];
        var prompt = "[CRITICAL: EXACT IDENTITY MATCH] Character Design Reference Sheet Grid. Use the provided reference image to create a highly detailed photo grid layout of THIS EXACT SAME PERSON'S face. \nThe grid MUST include these exact angles: \n1. Extreme macro close-up of the eyes.\n2. Close-up of the nose and cheeks.\n3. Full front face portrait.\n4. Left side profile face.\n5. Right side profile face.\nStyling: Photorealistic, ultra-detailed skin texture, clean studio white background for the grid layout itself.\nNEGATIVE: different person, altered facial features, illustration, drawing, text, watermarks, not a grid, messy layout.";

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
          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + GENERATIVE_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            var result = await response.json();
            var parts = (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) || [];
            var imgPart = parts.find(function (p) { return p.inlineData; });
            var base64Output = imgPart && imgPart.inlineData && imgPart.inlineData.data;
            if (base64Output) {
              setUgcDetailImage("data:image/png;base64," + base64Output);
            }
          }
        } catch (err) {
          console.error("UGC Detailing Gen Error", err);
        } finally {
          setIsGeneratingUgcDetail(false);
        }
      };

      var generateVisual = async function () {
        if (!ensureApiKey()) return;
        playClick();
        setIsGenerating(true);
        setGeneratedImages(new Array(config.scenes).fill(null));
        setSceneLoadings({});
        setScenePrompts({});
        setCopiedStates({});
        setView('result');

        try {
          var activeBackground = bgType === 'custom' ? (customBg || 'Studio Foto Polos') : config.background;
          var scriptsArray = await generateScripts();

          var generateSingleScene = async function (index) {
            try {
              var base64Model = modelImage ? modelImage.split(',')[1] : null;
              var scriptText = scriptsArray[index] || ("Scene " + (index + 1));
              var isBRoll = (index % 3 === 2) && (index !== config.scenes - 1);

              var role = isBRoll ? "B-ROLL DETAIL" : ("ACT " + (index + 1));
              if (index === 0) role = "HOOK";
              if (index === config.scenes - 1) role = "CTA";

              var modeParams = getModeLogic(selectedMode && selectedMode.id, index, productName, productDesc, activeBackground, config.ugcStyle);

              var finalSubjectPrompt = modeParams.subjectPrompt;
              var finalNegPrompt = modeParams.negPrompt;
              var videoMotion = modeParams.motionCamera;
              var videoCamera = modeParams.cameraLogic;

              if (isBRoll) {
                if ((selectedMode && selectedMode.id === 'ugc') || (selectedMode && selectedMode.id === 'affiliate')) {
                  finalSubjectPrompt = "RAW LIFESTYLE B-ROLL PHOTO. Casual close-up of " + productName + " (" + productDesc + ") held casually by hands. Shot on iPhone 15 Pro Max. Background: " + activeBackground + ". Single harsh directional light creating strong distinct shadows. CRITICAL: Match the exact gender, skin tone, and characteristics of the Base Model reference for the hands. Real human skin texture, visible pores. NO FACES, NO BODIES. Unedited, raw, candid.";
                  finalNegPrompt = "Human face, eyes, mouth, floating product, opposite gender hands, mismatched hands, masculine hands on female, overly stylized studio lighting, flat lighting, artificial look, 3d render, DSLR, softbox, professional macro, smooth plastic skin.";
                  videoMotion = "Slight natural handheld camera shake, showcasing the product.";
                  videoCamera = "Smartphone camera, close up.";
                } else if (selectedMode && selectedMode.id === 'commercial') {
                  finalSubjectPrompt = "PREMIUM STUDIO B-ROLL. Masterpiece macro close-up of " + productName + " (" + productDesc + "). Focus on premium texture and material details. Background: " + activeBackground + ". Dramatic commercial lighting with a single harsh spotlight, distinct shadows, elegant reflections, 8k resolution. NO HUMAN FACES.";
                  finalNegPrompt = "Human face, eyes, mouth, messy background, low quality, flat lighting, grainy, amateur, everyday lighting, blurry.";
                  videoMotion = "Smooth macro pan/slide over the product surface.";
                  videoCamera = "Macro Lens, sharp focus, high-end commercial style.";
                } else if (selectedMode && selectedMode.id === 'mirror') {
                  finalSubjectPrompt = "RAW MIRROR SELFIE B-ROLL. Close-up of " + productName + " (" + productDesc + ") reflected in a mirror. Held casually. Background: " + activeBackground + ". Harsh directional room light creating distinct shadows, highly detailed textures. NO FACES.";
                  finalNegPrompt = "Human face, flat lighting, lack of shadows, overexposed, clean commercial look, 3d render.";
                  videoMotion = "Slight handheld shake, focusing on the product in the mirror.";
                  videoCamera = "Smartphone camera, mirror reflection close up.";
                }
              }

              var globalNeg = ", wrong gender, opposite sex, different person, wrong hair style, different clothing, altered outfit, missing clothes, wrong hands, mismatched hands, text, words, letters, typography, watermark, signature, logo, brand name, subtitles, captions, text overlays, UI elements, illustration, painting, cartoon, anime, 3d render, CGI, unreal engine, deformed, bad anatomy, distorted, different face, morphed body, flat lighting, soft ambient light, lack of shadows, AI generated look, synthetic, plastic, generic AI face, overly smooth, midjourney style, washed out";
              if (['ugc', 'affiliate', 'pov', 'mirror'].indexOf(selectedMode && selectedMode.id) !== -1) {
                globalNeg += ", flawless perfect lighting, professional photography, softbox, studio flash, plastic skin";
              }
              finalNegPrompt += globalNeg;

              var rolePrefix = "PHOTOGRAPHY MASTERCLASS TASK:";
              var styling = "Hyper-realistic color processing. Single harsh directional light source creating deep, hard shadows and bold 3D dimensionality. ABSOLUTELY NO TEXT OR WATERMARKS.";
              var realismLaws = "MANDATORY: Must look like a real, actual photograph. Ultra-detailed, lifelike. NOT AI GENERATED. Include natural photographic imperfections and high-contrast depth. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";

              if (['ugc', 'affiliate', 'pov', 'mirror'].indexOf(selectedMode && selectedMode.id) !== -1) {
                rolePrefix = "RAW SMARTPHONE PHOTO TASK:";
                styling = "Authentic raw aesthetic. Single harsh directional light (like direct sunlight or hard smartphone flash) casting distinct, hard shadows for realistic depth. Shot on iPhone. ABSOLUTELY NO TEXT OR WATERMARKS.";
                realismLaws = "AUTHENTIC UGC REALISM: Must look EXACTLY like an unedited iPhone photo posted directly to social media. ZERO AI VIBE. CRITICAL: Highly detailed real human skin texture, visible pores, natural imperfections, distinct harsh lighting contrast. NO soft studio lights, NO beauty filters. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
              } else if (selectedMode && selectedMode.id === 'commercial') {
                rolePrefix = "HIGH-END COMMERCIAL PHOTOGRAPHY TASK:";
                styling = "Premium catalog aesthetic, razor-sharp details. Single harsh spotlight creating dramatic, deep shadows and striking 3D dimensionality. ABSOLUTELY NO TEXT OR WATERMARKS.";
              }

              var base64ProductRaw = productImage ? productImage.split(',')[1] : null;
              var base64Clothing = clothingImage ? clothingImage.split(',')[1] : null;
              var hasModelActive = base64Model && (selectedMode && selectedMode.id !== 'pov');

              var refInfo = "";
              var payloadParts = [];
              var refInfoArray = [];
              var imageIndex = 1;

              if (hasModelActive) {
                if (isBRoll) {
                  refInfoArray.push("Image " + imageIndex + " = Base Model (Use ONLY for matching exact gender, skin tone, and vibe for the hands holding the product. NO FACES IN FINAL IMAGE).");
                  payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
                  imageIndex++;
                } else {
                  refInfoArray.push("Image " + imageIndex + " = Base Model (CRITICAL: Clone this exact face, gender, hair style, and body).");
                  payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
                  imageIndex++;

                  if (base64Clothing) {
                    refInfoArray.push("Image " + imageIndex + " = Clothing Reference (CRITICAL: The model MUST wear this EXACT outfit. Do not alter color, shape, or design).");
                    payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Clothing } });
                    imageIndex++;
                  }
                }
              }

              if (base64ProductRaw) {
                refInfoArray.push("Image " + imageIndex + " = Product Reference (The EXACT Product).");
                payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
                imageIndex++;
              }

              if (refInfoArray.length > 0) {
                refInfo = "[CRITICAL] REFERENCE IMAGES: " + refInfoArray.join(" ") + " ";
              }

              var currentIdentityLock = (hasModelActive && !isBRoll) ? IDENTITY_LOCK : "";
              finalNegPrompt += ", different face, altered identity, unrecognizable person, random face";

              var diffusionPrompt = refInfo + rolePrefix + " Scene " + (index + 1) + ". " + scriptText + ". " + styling + " " + modeParams.cameraLogic + ". " + finalSubjectPrompt + " ENVIRONMENT: " + activeBackground + ". " + realismLaws + " " + currentIdentityLock + " NEGATIVE: " + finalNegPrompt + " Technical: " + config.ratio + " format.";

              payloadParts.push({ text: diffusionPrompt });

              var payload = {
                contents: [{ parts: payloadParts }],
                generationConfig: { responseModalities: ["IMAGE"], aspectRatio: config.ratio }
              };

              var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + GENERATIVE_MODEL + ":generateContent?key=" + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!response || !response.ok) {
                var errorText = response ? await response.text() : 'No response';
                throw new Error("Generation failed: " + errorText);
              }

              var result = await response.json();
              var rParts = (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) || [];
              var foundPart = rParts.find(function (p) { return p.inlineData; });
              var base64Output = foundPart && foundPart.inlineData && foundPart.inlineData.data;

              if (base64Output) {
                var imgSrc = "data:image/png;base64," + base64Output;
                var defaultVoActive = !isBRoll && (selectedMode && selectedMode.id !== 'pov');

                var scenarioData = {
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

                setGeneratedImages(function (prev) {
                  var updated = new Array(config.scenes).fill(null).map(function (_, i) {
                    if (prev[i]) return prev[i];
                    if (i === index) return scenarioData;
                    return null;
                  });
                  return updated.map(function (item, i) { return item || prev[i]; });
                });
              }
            } catch (err) {
              console.error("Scene " + index + " failed:", err);
            }
          };

          for (var i = 0; i < config.scenes; i++) {
            await generateSingleScene(i);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsGenerating(false);
        }
      };

      var regenerateSingleScene = async function (index) {
        if (!ensureApiKey()) return;
        playClick();
        var revisionInstruction = scenePrompts[index] || "";
        var originalScenario = generatedImages[index];
        var activeBackground = bgType === 'custom' ? (customBg || 'Studio Foto Polos') : config.background;

        setSceneLoadings(function (prev) {
          var next = Object.assign({}, prev);
          next[index] = true;
          return next;
        });

        try {
          var base64Model = modelImage ? modelImage.split(',')[1] : null;
          var base64ProductRaw = productImage ? productImage.split(',')[1] : null;
          var base64Clothing = clothingImage ? clothingImage.split(',')[1] : null;

          var hasModelActive = base64Model && (selectedMode && selectedMode.id !== 'pov');
          var currentIdentityLock = (hasModelActive && !originalScenario.isBRoll) ? IDENTITY_LOCK : "";

          var revisionNegPrompt = "wrong gender, opposite sex, different person, wrong hair style, different clothing, altered outfit, wrong hands, mismatched hands, different face, altered identity, unrecognized person, random face, morphed body, text, words, letters, typography, watermark, signature, logo, brand name, subtitles, captions, text overlays, UI elements, illustration, painting, cartoon, 3d render, CGI, unreal engine, deformed, distorted, flat lighting, soft ambient light, lack of shadows, AI generated look, synthetic, plastic, generic AI face, overly smooth, midjourney style";
          if (['ugc', 'affiliate', 'pov', 'mirror'].indexOf(selectedMode && selectedMode.id) !== -1) {
            revisionNegPrompt += ", flawless perfect lighting, cinematic movie shot, professional photography, DSLR, 8k, high res, softbox, studio flash, plastic skin, beauty filter";
          }

          var rolePrefix = "PHOTOGRAPHY MASTERCLASS TASK:";
          var realismLaws = "MANDATORY: Must look like a real, actual photograph. Ultra-detailed, lifelike. NOT AI GENERATED. Include natural photographic imperfections and high-contrast depth with single harsh directional lighting. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
          if (['ugc', 'affiliate', 'pov', 'mirror'].indexOf(selectedMode && selectedMode.id) !== -1) {
            rolePrefix = "RAW SMARTPHONE PHOTO TASK:";
            realismLaws = "AUTHENTIC UGC REALISM: Must look EXACTLY like an unedited iPhone photo. ZERO AI VIBE. CRITICAL: Highly detailed real human skin texture, visible pores. Single harsh directional light (like direct sunlight or hard flash) casting distinct, hard shadows for realistic depth. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
          } else if (selectedMode && selectedMode.id === 'commercial') {
            rolePrefix = "HIGH-END COMMERCIAL PHOTOGRAPHY TASK:";
            realismLaws = "MANDATORY: Premium catalog aesthetic. Single harsh spotlight creating dramatic, deep shadows and striking 3D dimensionality. STRICTLY NO TEXT, NO UI, NO WATERMARKS ALLOWED IN THE IMAGE.";
          }

          var refInfo = "";
          var payloadParts = [];
          var refInfoArray = [];
          var imageIndex = 1;

          if (hasModelActive) {
            if (originalScenario.isBRoll) {
              refInfoArray.push("Image " + imageIndex + " = Base Model (Use ONLY for matching exact gender, skin tone, and vibe for the hands. NO FACES IN FINAL IMAGE).");
              payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
              imageIndex++;
            } else {
              refInfoArray.push("Image " + imageIndex + " = Base Model (CRITICAL: Clone this exact face, gender, hair style, and body).");
              payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
              imageIndex++;

              if (base64Clothing) {
                refInfoArray.push("Image " + imageIndex + " = Clothing Reference (CRITICAL: The model MUST wear this EXACT outfit. Do not alter color or design).");
                payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Clothing } });
                imageIndex++;
              }
            }
          }

          if (base64ProductRaw) {
            refInfoArray.push("Image " + imageIndex + " = Product Reference (The EXACT Product).");
            payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
            imageIndex++;
          }

          if (refInfoArray.length > 0) {
            refInfo = "[CRITICAL] REFERENCE IMAGES: " + refInfoArray.join(" ") + " ";
          }

          var systemPrompt =
            refInfo + "\n" +
            rolePrefix + " - REVISION MODE.\n" +
            "Target: Regenerate Scene " + (index + 1) + " (" + originalScenario.role + ").\n" +
            "Product: " + productName + " (" + productDesc + ")\n" +
            "User Instruction: " + (revisionInstruction || "Improve lighting and composition.") + "\n" +
            "Keep original action: " + originalScenario.action + ". Background: " + activeBackground + ".\n" +
            realismLaws + "\n" +
            currentIdentityLock + "\n" +
            "CRITICAL NEGATIVE: " + revisionNegPrompt + ".";

          payloadParts.push({ text: systemPrompt });

          var payload = {
            contents: [{ parts: payloadParts }],
            generationConfig: { responseModalities: ["IMAGE"], aspectRatio: config.ratio }
          };

          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + GENERATIVE_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response || !response.ok) {
            var errorText = response ? await response.text() : 'No response';
            throw new Error("Generation failed: " + errorText);
          }

          var result = await response.json();
          var rParts = (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) || [];
          var foundPart = rParts.find(function (p) { return p.inlineData; });
          var base64Output = foundPart && foundPart.inlineData && foundPart.inlineData.data;

          if (base64Output) {
            var imgSrc = "data:image/png;base64," + base64Output;
            setGeneratedImages(function (prev) {
              var newArr = prev.slice();
              newArr[index] = Object.assign({}, newArr[index], { src: imgSrc });
              return newArr;
            });
            setScenePrompts(function (prev) {
              var next = Object.assign({}, prev);
              next[index] = "";
              return next;
            });
          }
        } catch (err) {
          console.error("Scene regeneration error:", err);
        } finally {
          setSceneLoadings(function (prev) {
            var next = Object.assign({}, prev);
            next[index] = false;
            return next;
          });
        }
      };

      var downloadImage = async function (imgSrc, index, e, customRatio) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        playClick();
        if (!imgSrc) return;

        var ratioToUse = customRatio || config.ratio;
        var croppedSrc = await processImageForDownload(imgSrc, ratioToUse);

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
        } catch (err) {
          var linkFallback = document.createElement('a');
          linkFallback.href = croppedSrc;
          linkFallback.download = 'image.png';
          document.body.appendChild(linkFallback);
          linkFallback.click();
          document.body.removeChild(linkFallback);
        }
      };

      var handleDownloadAllZip = async function () {
        playClick();
        setIsDownloadingZip(true);
        try {
          var JSZip = window.JSZip;
          if (!JSZip) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            JSZip = window.JSZip;
          }

          var zip = new JSZip();

          for (var i = 0; i < generatedImages.length; i++) {
            var sceneData = generatedImages[i];
            if (!sceneData || !sceneData.src) continue;

            var folderName = "Scene_0" + (i + 1);
            var folder = zip.folder(folderName);

            var croppedBase64DataUrl = await processImageForDownload(sceneData.src, config.ratio);
            var base64Data = croppedBase64DataUrl.split(',')[1];
            folder.file(folderName + "_Image.png", base64Data, { base64: true });

            var promptText = getPromptForScene(sceneData);
            folder.file(folderName + "_Prompt.txt", promptText);
          }

          var content = await zip.generateAsync({ type: 'blob' });
          var blobUrl = window.URL.createObjectURL(content);
          var link = document.createElement('a');
          link.href = blobUrl;
          link.download = "INGKI_AI_STUDIOPRO_Semua_Scene_" + Date.now() + ".zip";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(function () { window.URL.revokeObjectURL(blobUrl); }, 1000);
        } catch (err) {
          console.error("Failed to generate ZIP", err);
        } finally {
          setIsDownloadingZip(false);
        }
      };

      var handleGenerateVOScript = async function () {
        if (!ensureApiKey()) return;
        playClick();
        setIsGeneratingVOScript(true);

        var prompt = "Buatkan naskah master voiceover gaya " + ((selectedMode && selectedMode.title) || 'Komersial') + " untuk " + (productName || 'Produk') + ". Durasi: " + voDuration + ". Bahasa Indonesia. Tuliskan naskahnya saja langsung tanpa tambahan judul, markdown, atau penjelasan.";

        var payload = {
          contents: [{ parts: [{ text: prompt }] }]
        };

        try {
          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + TEXT_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response && response.ok) {
            var result = await response.json();
            var text = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].text;
            if (text) setVoScript(text.trim());
          }
        } catch (err) {
          console.error("Master VO Script gen error", err);
        } finally {
          setIsGeneratingVOScript(false);
        }
      };

      var handleGenerateVOAudio = async function () {
        if (!voScript || !ensureApiKey()) return;
        playClick();
        setIsGeneratingVOAudio(true);
        setVoAudioUrl(null);

        var payload = {
          contents: [{
            parts: [{ text: "Bacakan dengan nada " + voTone + ": " + voScript }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voVoice
                }
              }
            }
          }
        };

        try {
          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + TTS_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response && response.ok) {
            var result = await response.json();
            var base64PCM = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].inlineData && result.candidates[0].content.parts[0].inlineData.data;
            if (base64PCM) {
              var url = base64ToWavUrl(base64PCM);
              setVoAudioUrl(url);
            }
          }
        } catch (err) {
          console.error("Audio generation failed:", err);
        } finally {
          setIsGeneratingVOAudio(false);
        }
      };

      var handleGenerateSosmed = async function () {
        if (!sosmedTitle || !ensureApiKey()) return;
        playClick();
        setIsGeneratingSosmed(true);
        setSosmedResult("");
        setCopiedSosmed(false);

        var prompt = 'Buatkan caption/deskripsi postingan untuk platform ' + sosmedPlatform + ' yang menarik, engaging, copywriting memikat, dan berpotensi viral dengan topik: "' + sosmedTitle + '". \nGunakan bahasa Indonesia kekinian. Beri spasi/paragraf yang rapi dan enak dibaca. Berikan Call to Action (CTA) di bagian akhir caption.\nSetelah caption, berikan 15 hashtag yang sangat relevan dan trending.';

        var payload = { contents: [{ parts: [{ text: prompt }] }] };

        try {
          var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + TEXT_MODEL + ":generateContent?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            var result = await response.json();
            var text = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].text;
            if (text) setSosmedResult(text.trim());
          } else {
            setSosmedResult("Gagal membuat deskripsi. Silakan coba lagi.");
          }
        } catch (err) {
          console.error("Sosmed gen error", err);
          setSosmedResult("Terjadi kesalahan jaringan.");
        } finally {
          setIsGeneratingSosmed(false);
        }
      };

      var handleCopySosmed = function () {
        playClick();
        safeCopyToClipboard(sosmedResult);
        setCopiedSosmed(true);
        setTimeout(function () { setCopiedSosmed(false); }, 2000);
      };

      var handleGenerateCarousel = async function () {
        if (!ensureApiKey()) return;
        playClick();
        setIsGeneratingCarousel(true);
        setCarouselResults(new Array(carSlides).fill(null));
        setView('carousel-result');

        try {
          var base64ProductRaw = carImage ? carImage.split(',')[1] : null;

          var runSlide = async function (i) {
            setCarouselProgress(i);
            var slideObjective = "";
            var layoutDirection = "";
            var extraContext = "";

            if (i === 1) {
              slideObjective = "Hook";
              layoutDirection = "Hero layout. Image position: center / right. Text position: top-left. Main product/image as hero. Big headline top/left. Strong focal point.";
              extraContext = "This is the first slide. Make this slide create curiosity to swipe next. Do not explain everything in slide 1.";
            } else if (i === carSlides) {
              slideObjective = "CTA (Call to Action)";
              layoutDirection = "Final conversion layout. Image position: large center. Text position: bottom center. Clean strong conversion page. Main visual large, prominent CTA button.";
              extraContext = 'Finish the carousel story. Summarize main value. Add CTA button: "' + carCTA + '".';
            } else if (i === 2) {
              slideObjective = "Before Condition / The Problem";
              layoutDirection = "Comparison layout. Image position: split left/right or dynamic. Text position: top labels. Before/after or left vs right comparison.";
              extraContext = "Continue the story. The message must connect naturally to the previous slide. Focus on the problem.";
            } else {
              slideObjective = "Experience / The Solution / Features";
              layoutDirection = "Social proof or Feature layout. Image position: right or bottom. Text position: left or top. Clean premium layout.";
              extraContext = "Continue the story. Focus on the main benefit and experience.";
            }

            var prompt =
              "Create ONLY carousel slide " + i + "/" + carSlides + ".\n" +
              "This is a " + (i === 1 ? 'opening' : i === carSlides ? 'final conversion' : 'continuation') + " slide of a " + carTemplate + " carousel campaign.\n\n" +
              "PRODUCT / CONTENT CONTEXT:\n" +
              "Brand: " + (carBrand || 'Brand') + " (@" + (carUsername || 'username') + ")\n" +
              "Name: " + (carProductName || 'Produk') + "\n" +
              "Category: " + (carCategory || 'General') + "\n" +
              "Description: " + (carDesc || 'Produk berkualitas tinggi.') + "\n" +
              "Main Benefit: " + (carBenefit || 'Solusi terbaik untuk Anda.') + "\n" +
              "Target Audience: " + (carTarget || 'Semua orang') + "\n" +
              "Platform: " + carPlatform + "\n" +
              "Aspect Ratio: " + carRatio + "\n" +
              "Visual Style: " + carVisual + "\n" +
              "Color Mood: " + carColor + "\n" +
              "Copywriting Tone: " + carTone + "\n\n" +
              "SLIDE " + i + " OBJECTIVE:\n" +
              slideObjective + "\n\n" +
              "LAYOUT DIRECTION:\n" +
              "Use this layout for slide " + i + ":\n" +
              layoutDirection + "\n\n" +
              "INSTRUCTION:\n" +
              "Automatically generate the headline, subheadline, and visual idea for this slide based on the objective in Bahasa Indonesia.\n" +
              "If product image is uploaded, keep product design, color, logo, shape, and material strictly unchanged.\n" +
              extraContext + "\n" +
              "Match the campaign identity, colors, typography, lighting, and premium mood.\n" +
              "Add small slide indicator: " + i + "/" + carSlides + ".\n\n" +
              "STRICT OUTPUT RULES:\n" +
              "Generate ONLY slide " + i + ". One image only.\n" +
              "Do not create full carousel. Do not create grid. Do not create collage.\n" +
              "Output must be one standalone " + carRatio + " carousel image.\n\n" +
              "NEGATIVE PROMPT:\n" +
              "carousel grid, collage, storyboard board, multiple slides in one canvas, bad typography, unreadable text, wrong product, distorted product, changed logo, blurry visual, messy layout, watermark, low quality.";

            var payloadParts = [];
            if (base64ProductRaw) {
              payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
            }
            payloadParts.push({ text: prompt });

            var payload = {
              contents: [{ parts: payloadParts }],
              generationConfig: {
                responseModalities: ["IMAGE"],
                aspectRatio: carRatio === "1:1 (Square)" ? "1:1" : carRatio === "4:5 (Portrait)" ? "3:4" : "16:9"
              }
            };

            var response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/models/" + GENERATIVE_MODEL + ":generateContent?key=" + apiKey, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              var result = await response.json();
              var rParts = (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) || [];
              var foundPart = rParts.find(function (p) { return p.inlineData; });
              var base64Output = foundPart && foundPart.inlineData && foundPart.inlineData.data;

              if (base64Output) {
                setCarouselResults(function (prev) {
                  var newArr = prev.slice();
                  newArr[i - 1] = "data:image/png;base64," + base64Output;
                  return newArr;
                });
              }
            }
          };

          for (var s = 1; s <= carSlides; s++) {
            await runSlide(s);
          }
        } catch (err) {
          console.error("Carousel generation error", err);
        } finally {
          setIsGeneratingCarousel(false);
          setCarouselProgress(0);
        }
      };

      var handleCarImageUpload = function (e) {
        playClick();
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onloadend = function () { setCarImage(reader.result); };
          reader.readAsDataURL(file);
        }
      };

      // --- RENDER CONTENT PER VIEW (100% UTUH) ---
      var renderContent = function () {
        switch (view) {
          case 'mode-selection':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onReset: handleResetAndNew }),
              h(
                'div',
                { className: "flex-grow flex flex-col justify-center px-4 pt-8 pb-12 md:px-10 lg:px-14 z-20 relative" },
                h(
                  'div',
                  { className: "max-w-7xl mx-auto w-full" },
                  h(
                    'div',
                    { className: "flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-6 border-b border-emerald-900/30 pb-6" },
                    h(SectionTitle, { title: "Pilih Mode Visual", subtitle: "Tentukan gaya estetika kampanye visual Anda." }),
                    h(
                      'div',
                      { className: "hidden md:flex items-center gap-3 text-zinc-500" },
                      h('span', { className: "text-[10px] font-bold tracking-widest uppercase text-emerald-400" }, '01'),
                      h('div', { className: "w-16 h-px bg-emerald-500/30" }),
                      h('span', { className: "text-[10px] font-bold tracking-widest uppercase opacity-50" }, '03')
                    )
                  ),
                  h(
                    'div',
                    { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" },
                    modes.map(function (mode, idx) {
                      var CurrentIcon = mode.icon;
                      return h(
                        'button',
                        {
                          key: mode.id,
                          type: 'button',
                          onClick: function () {
                            playClick();
                            if (mode.id === 'tts') {
                              setIsAudioStudioOpen(true);
                              setIsAudioStudioMinimized(false);
                            } else if (mode.id === 'sosmed') {
                              setView('sosmed-desk');
                            } else if (mode.id === 'carousel') {
                              setView('carousel-setup');
                            } else if (mode.id === 'ugc') {
                              setSelectedMode(mode);
                              setView('ugc-setup');
                            } else if (mode.id === 'affiliate') {
                              setSelectedMode(mode);
                              setDynamicBackgrounds(MODE_BACKGROUNDS[mode.id]);
                              setConfig(function (prev) { return Object.assign({}, prev, { background: MODE_BACKGROUNDS[mode.id][0] }); });
                              setView('combined-setup');
                            } else {
                              setSelectedMode(mode);
                              setDynamicBackgrounds(MODE_BACKGROUNDS[mode.id]);
                              setConfig(function (prev) { return Object.assign({}, prev, { background: MODE_BACKGROUNDS[mode.id][0] }); });
                              setView('upload-setup');
                            }
                          },
                          className: "group relative flex flex-col justify-between h-64 md:h-72 p-6 md:p-7 rounded-3xl bg-gradient-to-b from-slate-900 to-black border border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-500 overflow-hidden text-left cursor-pointer"
                        },
                        h('div', { className: "absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-bl from-emerald-500/20 to-transparent blur-[60px] rounded-full group-hover:from-emerald-400/40 transition-all duration-700 pointer-events-none" }),
                        h(
                          'div',
                          { className: "relative z-10 flex flex-col h-full justify-between" },
                          h(
                            'div',
                            { className: "flex justify-between items-start w-full" },
                            h(
                              'div',
                              { className: "w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white group-hover:scale-110 transition-all duration-500 shadow-xl" },
                              h(CurrentIcon, { className: "w-6 h-6 md:w-7 md:h-7" })
                            ),
                            h('span', { className: "text-sm font-bold font-modern text-emerald-500/50 group-hover:text-emerald-400 transition-colors" }, '0' + (idx + 1))
                          ),
                          h(
                            'div',
                            { className: "space-y-3" },
                            h(
                              'div',
                              null,
                              h('h3', { className: "text-xl md:text-2xl font-elegant font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 mb-1.5 leading-tight" }, mode.title),
                              h('p', { className: "text-xs text-zinc-400 font-modern font-medium leading-relaxed line-clamp-2" }, mode.desc)
                            ),
                            h(
                              'div',
                              { className: "flex items-center justify-between pt-4 border-t border-emerald-500/20" },
                              h('span', { className: "text-[10px] font-bold tracking-widest uppercase text-emerald-500" }, 'Pilih Mode'),
                              h(
                                'div',
                                { className: "w-8 h-8 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-950/50 group-hover:bg-emerald-400 group-hover:text-slate-900 transition-all" },
                                h(ArrowRight, { className: "w-4 h-4" })
                              )
                            )
                          )
                        )
                      );
                    })
                  )
                )
              )
            );

          case 'ugc-setup':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onBack: function () { setView('mode-selection'); }, onReset: handleResetAndNew }),
              h(
                'div',
                { className: "flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 relative z-20" },
                h(
                  'div',
                  { className: "max-w-4xl mx-auto w-full flex flex-col gap-8" },
                  h(SectionTitle, { title: "AI Influencer Creator", subtitle: "Buat karakter model / influencer eksklusif Anda sendiri untuk kebutuhan konten." }),
                  h(
                    'div',
                    { className: "bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6" },
                    h('h3', { className: "text-sm font-bold text-white mb-2 flex items-center gap-2 border-b border-white/5 pb-4" }, h(Sparkles, { className: "w-4 h-4 text-emerald-400" }), ' Personalisasi Model AI'),
                    h(
                      'div',
                      { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                      [
                        { label: "Gender (Jenis Kelamin)", val: ugcGender, set: setUgcGender, opts: UGC_GENDERS },
                        { label: "Kategori Usia", val: ugcAge, set: setUgcAge, opts: UGC_AGES },
                        { label: "Asal Negara / Etnis", val: ugcCountry, set: setUgcCountry, opts: UGC_COUNTRIES },
                        { label: "Warna Kulit", val: ugcSkin, set: setUgcSkin, opts: UGC_SKIN_TONES },
                        { label: "Gaya Rambut", val: ugcHairStyle, set: setUgcHairStyle, opts: UGC_HAIR_STYLES },
                        { label: "Warna Rambut", val: ugcHairColor, set: setUgcHairColor, opts: UGC_HAIR_COLORS }
                      ].map(function (fld) {
                        return h(
                          'div',
                          { key: fld.label, className: "space-y-3" },
                          h('label', { className: "text-[10px] font-bold text-zinc-400 uppercase tracking-widest block" }, fld.label),
                          h(
                            'div',
                            { className: "relative" },
                            h(
                              'select',
                              {
                                value: fld.val,
                                onChange: function (e) { fld.set(e.target.value); },
                                className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer appearance-none"
                              },
                              fld.opts.map(function (o) { return h('option', { key: o, value: o, className: "bg-slate-900" }, o); })
                            ),
                            h(ChevronDown, { className: "w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" })
                          )
                        );
                      }),
                      h(
                        'div',
                        { className: "space-y-3" },
                        h('label', { className: "text-[10px] font-bold text-zinc-400 uppercase tracking-widest block" }, 'Format / Rasio Foto'),
                        h(
                          'div',
                          { className: "relative" },
                          h(
                            'select',
                            {
                              value: ugcRatio,
                              onChange: function (e) { setUgcRatio(e.target.value); },
                              className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer appearance-none"
                            },
                            UGC_RATIOS.map(function (r) { return h('option', { key: r.value, value: r.value, className: "bg-slate-900" }, r.label); })
                          ),
                          h(ChevronDown, { className: "w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" })
                        )
                      )
                    ),
                    h(
                      'div',
                      { className: "pt-6 border-t border-white/5" },
                      h(ButtonCTA, { onClick: generateUgcInfluencer }, h(Wand2, { className: "w-5 h-5" }), ' Generate AI Influencer')
                    )
                  )
                )
              )
            );

          case 'ugc-result':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onBack: function () { setView('ugc-setup'); }, onReset: handleResetAndNew }),
              h(
                'div',
                { className: "max-w-5xl mx-auto p-4 md:p-8 pb-24 flex flex-col gap-12 w-full" },
                h(
                  'div',
                  { className: "flex flex-col items-center gap-6 w-full" },
                  h('h2', { className: "text-xl md:text-2xl font-elegant font-bold text-white text-center" }, 'AI Influencer Model'),
                  h(
                    'div',
                    {
                      className: "relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl max-w-sm w-full transition-all duration-500 " +
                        (ugcRatio === '9:16' ? 'aspect-[9/16]' : ugcRatio === '16:9' ? 'aspect-video' : ugcRatio === '3:4' ? 'aspect-[3/4]' : 'aspect-square')
                    },
                    isGeneratingUgc
                      ? h(GeneratingState, { index: 0 })
                      : ugcGeneratedImage
                        ? h(
                            React.Fragment,
                            null,
                            h('img', { src: ugcGeneratedImage, alt: "AI Influencer", className: "w-full h-full object-cover" }),
                            h(
                              'div',
                              { className: "absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20" },
                              h('button', { onClick: function () { setPreviewImage(ugcGeneratedImage); }, className: "w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black text-white cursor-pointer" }, h(ZoomIn, { className: "w-5 h-5" }))
                            ),
                            h(
                              'div',
                              { className: "absolute bottom-4 right-4 z-20" },
                              h('button', { onClick: function (e) { downloadImage(ugcGeneratedImage, 0, e, ugcRatio); }, className: "px-4 py-2 bg-black/60 backdrop-blur-md text-emerald-300 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-600 hover:text-white flex items-center gap-2 cursor-pointer" }, h(Download, { className: "w-3 h-3" }), ' Unduh')
                            )
                          )
                        : null
                  ),
                  !isGeneratingUgc && ugcGeneratedImage && h(
                    'div',
                    { className: "w-full max-w-md pt-4" },
                    h(
                      ButtonCTA,
                      { onClick: generateUgcDetailing, disabled: isGeneratingUgcDetail },
                      isGeneratingUgcDetail
                        ? [h(Loader2, { key: 'l', className: "w-5 h-5 animate-spin" }), ' Memproses Detailing Wajah...']
                        : [h(Aperture, { key: 'a', className: "w-5 h-5" }), ' Detailing Muka Model (Grid)']
                    )
                  )
                ),
                ugcDetailImage && h(
                  'div',
                  { className: "flex flex-col items-center gap-6 w-full pt-8 border-t border-white/5" },
                  h('h2', { className: "text-xl md:text-2xl font-elegant font-bold text-white text-center flex items-center gap-3" }, h(Sparkles, { className: "w-5 h-5 text-emerald-400" }), ' Detailing Muka (Reference Grid)'),
                  h('p', { className: "text-sm text-zinc-400 text-center max-w-2xl" }, 'Mata, Hidung, Pipi, Tampak Depan, & Samping.'),
                  h(
                    'div',
                    { className: "relative rounded-2xl overflow-hidden bg-zinc-900 border border-emerald-500/30 shadow-2xl max-w-4xl w-full aspect-video" },
                    h('img', { src: ugcDetailImage, alt: "Detailing Grid", className: "w-full h-full object-cover" }),
                    h(
                      'div',
                      { className: "absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20" },
                      h('button', { onClick: function () { setPreviewImage(ugcDetailImage); }, className: "w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black text-white cursor-pointer" }, h(ZoomIn, { className: "w-5 h-5" }))
                    ),
                    h(
                      'div',
                      { className: "absolute bottom-4 right-4 z-20" },
                      h('button', { onClick: function (e) { downloadImage(ugcDetailImage, 1, e, '16:9'); }, className: "px-4 py-2 bg-emerald-600/80 backdrop-blur-md text-white border border-emerald-400/50 rounded-full text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-500 flex items-center gap-2 cursor-pointer" }, h(Download, { className: "w-3 h-3" }), ' Unduh Grid')
                    )
                  )
                )
              )
            );

          case 'combined-setup':
            var isUploadCompleteAffiliate = modelImage && productImage;
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onBack: function () { setView('mode-selection'); }, onReset: handleResetAndNew }),
              h(
                'div',
                { className: "flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 z-20 relative" },
                h(
                  'div',
                  { className: "max-w-4xl mx-auto w-full flex flex-col gap-10" },
                  h(SectionTitle, { title: "Setup Affiliate Creator", subtitle: "Lengkapi aset visual dan atur konfigurasi studio Anda dalam satu halaman." }),
                  h(
                    'div',
                    { className: "bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6" },
                    h('h3', { className: "text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4" }, h(ImageIcon, { className: "w-4 h-4 text-emerald-400" }), ' 1. Aset Visual & Produk'),
                    h(
                      'div',
                      { className: "grid gap-4 md:gap-8 grid-cols-1 sm:grid-cols-3" },
                      h(UploadZone, { label: "01. Base Model", image: modelImage, onClick: function () { modelInputRef.current && modelInputRef.current.click(); }, icon: Camera }),
                      h(UploadZone, { label: "02. Product Image", image: productImage, onClick: function () { productInputRef.current && productInputRef.current.click(); }, icon: Package }),
                      h(UploadZone, { label: "03. Pakaian (Opsional)", image: clothingImage, onClick: function () { clothingInputRef.current && clothingInputRef.current.click(); }, icon: Layers })
                    ),
                    h('input', { type: 'file', ref: modelInputRef, onChange: handleModelUpload, className: "hidden", accept: "image/*" }),
                    h('input', { type: 'file', ref: productInputRef, onChange: handleProductUpload, className: "hidden", accept: "image/*" }),
                    h('input', { type: 'file', ref: clothingInputRef, onChange: handleClothingUpload, className: "hidden", accept: "image/*" }),
                    h(
                      'div',
                      { className: "space-y-4 pt-4 border-t border-white/5" },
                      h(
                        'div',
                        { className: "flex items-center justify-between" },
                        h('label', { className: "text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2" }, h(FileText, { className: "w-4 h-4" }), ' Detail Produk'),
                        isAnalyzingProduct && h('span', { className: "text-[10px] text-emerald-400 flex items-center gap-2 animate-pulse" }, h(Sparkles, { className: "w-3 h-3" }), ' AI Analyzing...')
                      ),
                      h(
                        'div',
                        { className: "space-y-3" },
                        h('input', { type: 'text', value: productName, onChange: function (e) { setProductName(e.target.value); }, placeholder: "Nama Produk (Misal: Kopi Susu Aren)", className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400 font-medium" }),
                        h('textarea', { value: productDesc, onChange: function (e) { setProductDesc(e.target.value); }, placeholder: "Unggah gambar produk agar AI dapat mendeteksi deskripsinya secara otomatis, atau ketik manual...", className: "w-full h-20 bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-zinc-400 focus:outline-none focus:border-emerald-400 resize-none" })
                      ),
                      h(
                        'div',
                        { className: "flex justify-end pt-2" },
                        h(
                          'button',
                          {
                            type: 'button',
                            onClick: function () { playClick(); setIsProductConfirmed(true); },
                            disabled: !productName || isProductConfirmed || isAnalyzingProduct,
                            className: "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer " +
                              (isProductConfirmed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border border-emerald-400/50') +
                              " disabled:opacity-50"
                          },
                          isAnalyzingProduct
                            ? [h(Loader2, { key: 'l', className: "w-4 h-4 animate-spin" }), ' Analyzing']
                            : isProductConfirmed
                              ? [h(CheckCircle2, { key: 'c', className: "w-4 h-4" }), ' Confirmed']
                              : "Confirm Info"
                        )
                      )
                    )
                  ),
                  h(
                    'div',
                    { className: "bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-8" },
                    h('h3', { className: "text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4" }, h(Layout, { className: "w-4 h-4 text-emerald-400" }), ' 2. Konfigurasi Studio'),
                    h(
                      'div',
                      { className: "space-y-4" },
                      h('label', { className: "text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" }, h(Monitor, { className: "w-3 h-3" }), ' Latar / Background (Rekomendasi AI)'),
                      h(
                        'div',
                        { className: "relative" },
                        h(
                          'select',
                          {
                            value: bgType === 'custom' ? 'CUSTOM' : config.background,
                            onChange: function (e) {
                              playClick();
                              if (e.target.value === 'CUSTOM') setBgType('custom');
                              else {
                                setBgType('preset');
                                setConfig(Object.assign({}, config, { background: e.target.value }));
                              }
                            },
                            className: "w-full appearance-none bg-zinc-900/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                          },
                          dynamicBackgrounds.map(function (bg) { return h('option', { key: bg, value: bg, className: "bg-zinc-900 text-white" }, bg); }),
                          h('option', { value: "CUSTOM", className: "bg-zinc-800 text-emerald-400 font-bold" }, '✨ Custom (Ketik Sendiri)...')
                        ),
                        h('div', { className: "absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" }, h(ChevronDown, { className: "w-5 h-5" }))
                      ),
                      bgType === 'custom' && h('input', {
                        type: 'text',
                        placeholder: "Contoh: 'Garasi rumah dengan lampu neon hijau' atau 'Kantin kampus siang hari'",
                        value: customBg,
                        onChange: function (e) { setCustomBg(e.target.value); },
                        className: "w-full mt-3 bg-slate-900/60 border border-green-500/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400"
                      })
                    ),
                    h(
                      'div',
                      { className: "space-y-4 pt-4 border-t border-white/5" },
                      h('label', { className: "text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" }, h(Video, { className: "w-3 h-3" }), ' Gaya Kamera Konten'),
                      h(
                        'div',
                        { className: "grid grid-cols-1 md:grid-cols-3 gap-3" },
                        [
                          { id: 'Handheld', label: '📱 Handheld', desc: 'Gaya selfie, natural shake' },
                          { id: 'Tripod', label: '📸 Tripod', desc: 'Kamera statis & stabil' },
                          { id: 'Vlog', label: '🚶‍♂️ Vlog', desc: 'Dinamis, wide angle' }
                        ].map(function (style) {
                          return h(
                            'button',
                            {
                              key: style.id,
                              type: 'button',
                              onClick: function () { playClick(); setConfig(Object.assign({}, config, { ugcStyle: style.id })); },
                              className: "flex flex-col items-start p-4 rounded-xl border transition-all text-left cursor-pointer " + (config.ugcStyle === style.id ? 'bg-green-900/20 border-green-400/50' : 'bg-black/20 border-white/5')
                            },
                            h('span', { className: "text-sm font-bold mb-1 text-white" }, style.label),
                            h('span', { className: "text-[10px] text-zinc-400" }, style.desc)
                          );
                        })
                      )
                    ),
                    h(
                      'div',
                      { className: "grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5" },
                      h(
                        'div',
                        { className: "space-y-4" },
                        h('label', { className: "text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" }, h(Layout, { className: "w-3 h-3" }), ' Format Output'),
                        h(
                          'div',
                          { className: "flex flex-col gap-2" },
                          ratios.map(function (r) {
                            return h(
                              'button',
                              {
                                key: r.value,
                                type: 'button',
                                onClick: function () { playClick(); setConfig(Object.assign({}, config, { ratio: r.value })); },
                                className: "flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer " + (config.ratio === r.value ? 'bg-green-600/20 border-green-400/50 text-emerald-300' : 'bg-black/20 border-white/5 text-zinc-500')
                              },
                              h('span', { className: "text-xs font-medium uppercase" }, r.label),
                              h('span', { className: "text-[10px] font-mono opacity-50" }, r.sub)
                            );
                          })
                        )
                      ),
                      h(
                        'div',
                        { className: "space-y-4" },
                        h('label', { className: "text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" }, h(Layers, { className: "w-3 h-3" }), ' Jumlah Scene'),
                        h(
                          'div',
                          { className: "grid grid-cols-3 gap-2" },
                          sceneCounts.map(function (count) {
                            return h(
                              'button',
                              {
                                key: count,
                                type: 'button',
                                onClick: function () { playClick(); setConfig(Object.assign({}, config, { scenes: count })); },
                                className: "py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer " + (config.scenes === count ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-transparent' : 'bg-black/20 border-white/5 text-zinc-500')
                              },
                              count
                            );
                          })
                        )
                      )
                    )
                  ),
                  h(
                    'div',
                    { className: "pt-2 pb-10" },
                    h(ButtonCTA, { disabled: !isUploadCompleteAffiliate || !isProductConfirmed || isAnalyzingProduct, onClick: generateVisual }, 'Generate Visuals'),
                    !isProductConfirmed && isUploadCompleteAffiliate && !isAnalyzingProduct && h('p', { className: "text-center text-[10px] text-zinc-500 mt-3 animate-pulse" }, "Mohon konfirmasi info produk (Tombol 'Confirm Info') untuk melanjutkan.")
                  )
                )
              )
            );

          case 'upload-setup':
            var isUploadComplete = ((selectedMode && selectedMode.id === 'pov') ? true : modelImage) && productImage;
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onBack: function () { setView('mode-selection'); }, onReset: handleResetAndNew }),
              h(
                'div',
                { className: "flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 z-20 relative" },
                h(
                  'div',
                  { className: "max-w-3xl mx-auto w-full flex flex-col gap-10" },
                  h(SectionTitle, { title: "Aset Visual", subtitle: "Siapkan aset gambar untuk gaya " + (selectedMode && selectedMode.title) + "." }),
                  h(
                    'div',
                    { className: "grid gap-4 md:gap-8 " + ((selectedMode && selectedMode.id === 'pov') ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2') },
                    (selectedMode && selectedMode.id !== 'pov') && h(UploadZone, { label: "01. Base Model (Referensi Wajah/Tubuh)", image: modelImage, onClick: function () { modelInputRef.current && modelInputRef.current.click(); }, icon: Camera }),
                    h(UploadZone, { label: (selectedMode && selectedMode.id === 'pov') ? "01. Product Image" : "02. Product Image", image: productImage, onClick: function () { productInputRef.current && productInputRef.current.click(); }, icon: Package })
                  ),
                  h('input', { type: 'file', ref: modelInputRef, onChange: handleModelUpload, className: "hidden", accept: "image/*" }),
                  h('input', { type: 'file', ref: productInputRef, onChange: handleProductUpload, className: "hidden", accept: "image/*" }),
                  h(
                    'div',
                    { className: "bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4" },
                    h(
                      'div',
                      { className: "flex items-center justify-between" },
                      h('label', { className: "text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2" }, h(FileText, { className: "w-4 h-4" }), ' Detail Produk'),
                      isAnalyzingProduct && h('span', { className: "text-[10px] text-emerald-400 flex items-center gap-2 animate-pulse" }, h(Sparkles, { className: "w-3 h-3" }), ' AI Analyzing...')
                    ),
                    h(
                      'div',
                      { className: "space-y-3" },
                      h('input', { type: 'text', value: productName, onChange: function (e) { setProductName(e.target.value); }, placeholder: "Nama Produk (Misal: Kopi Susu Aren)", className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400" }),
                      h('textarea', { value: productDesc, onChange: function (e) { setProductDesc(e.target.value); }, placeholder: "Unggah gambar produk agar AI dapat mendeteksi deskripsinya secara otomatis, atau ketik manual...", className: "w-full h-20 bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-zinc-400 focus:outline-none focus:border-emerald-400 resize-none" })
                    ),
                    h(
                      'div',
                      { className: "flex justify-end pt-2" },
                      h(
                        'button',
                        {
                          type: 'button',
                          onClick: function () { playClick(); setIsProductConfirmed(true); },
                          disabled: !productName || isProductConfirmed || isAnalyzingProduct,
                          className: "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer " +
                            (isProductConfirmed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border border-emerald-400/50') +
                            " disabled:opacity-50"
                        },
                        isAnalyzingProduct
                          ? [h(Loader2, { key: 'l', className: "w-4 h-4 animate-spin" }), ' Analyzing']
                          : isProductConfirmed
                            ? [h(CheckCircle2, { key: 'c', className: "w-4 h-4" }), ' Confirmed']
                            : "Confirm Info"
                      )
                    )
                  ),
                  h(
                    'div',
                    { className: "pt-4 pb-10" },
                    h(ButtonCTA, { disabled: !isUploadComplete || !isProductConfirmed || isAnalyzingProduct, onClick: function () { setView('config'); } }, 'Lanjutkan')
                  )
                )
              )
            );

          case 'config':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, {
                onBack: function () { setView('upload-setup'); },
                onViewResult: generatedImages.some(function (img) { return img !== null; }) ? function () { setView('result'); } : null,
                onReset: handleResetAndNew
              }),
              h(
                'div',
                { className: "flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 z-20 relative" },
                h(
                  'div',
                  { className: "max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16" },
                  h(
                    'div',
                    { className: "lg:col-span-7 space-y-8" },
                    h(SectionTitle, { title: "Konfigurasi Studio", subtitle: "Sesuaikan pengaturan latar dan detail output visual." }),
                    h(
                      'div',
                      { className: "space-y-4" },
                      h('label', { className: "text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" }, h(Monitor, { className: "w-3 h-3" }), ' Latar / Background (Rekomendasi AI)'),
                      h(
                        'div',
                        { className: "relative" },
                        h(
                          'select',
                          {
                            value: bgType === 'custom' ? 'CUSTOM' : config.background,
                            onChange: function (e) {
                              playClick();
                              if (e.target.value === 'CUSTOM') setBgType('custom');
                              else {
                                setBgType('preset');
                                setConfig(Object.assign({}, config, { background: e.target.value }));
                              }
                            },
                            className: "w-full appearance-none bg-zinc-900/30 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                          },
                          dynamicBackgrounds.map(function (bg) { return h('option', { key: bg, value: bg, className: "bg-zinc-900 text-white" }, bg); }),
                          h('option', { value: "CUSTOM", className: "bg-zinc-800 text-emerald-400 font-bold" }, '✨ Custom (Ketik Sendiri)...')
                        ),
                        h('div', { className: "absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" }, h(ChevronDown, { className: "w-5 h-5" }))
                      ),
                      bgType === 'custom' && h('input', {
                        type: 'text',
                        placeholder: "Contoh: 'Garasi rumah dengan lampu neon hijau' atau 'Kantin kampus siang hari'",
                        value: customBg,
                        onChange: function (e) { setCustomBg(e.target.value); },
                        className: "w-full mt-3 bg-slate-900/60 border border-green-500/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400"
                      })
                    )
                  ),
                  h(
                    'div',
                    { className: "lg:col-span-5 space-y-6" },
                    h(
                      'div',
                      { className: "p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-md space-y-6" },
                      h(
                        'div',
                        { className: "space-y-4" },
                        h('label', { className: "text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" }, h(Layout, { className: "w-3 h-3" }), ' Format Output'),
                        h(
                          'div',
                          { className: "flex flex-col gap-2" },
                          ratios.map(function (r) {
                            return h(
                              'button',
                              {
                                key: r.value,
                                type: 'button',
                                onClick: function () { playClick(); setConfig(Object.assign({}, config, { ratio: r.value })); },
                                className: "flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer " + (config.ratio === r.value ? 'bg-green-600/20 border-green-400/50 text-emerald-300' : 'bg-transparent border-white/5 text-zinc-500')
                              },
                              h('span', { className: "text-xs font-medium uppercase" }, r.label),
                              h('span', { className: "text-[10px] font-mono opacity-50" }, r.sub)
                            );
                          })
                        )
                      ),
                      h(
                        'div',
                        { className: "space-y-4" },
                        h('label', { className: "text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" }, h(Layers, { className: "w-3 h-3" }), ' Jumlah Scene'),
                        h(
                          'div',
                          { className: "grid grid-cols-3 gap-2" },
                          sceneCounts.map(function (count) {
                            return h(
                              'button',
                              {
                                key: count,
                                type: 'button',
                                onClick: function () { playClick(); setConfig(Object.assign({}, config, { scenes: count })); },
                                className: "py-3 rounded-lg text-xs font-bold border transition-all cursor-pointer " + (config.scenes === count ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-transparent' : 'bg-transparent border-white/5 text-zinc-500')
                              },
                              count
                            );
                          })
                        )
                      ),
                      h('div', { className: "pt-2" }, h(ButtonCTA, { onClick: generateVisual }, 'Generate Visuals'))
                    )
                  )
                )
              )
            );

          case 'result':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, {
                onBack: function () { setView((selectedMode && selectedMode.id === 'affiliate') ? 'combined-setup' : 'config'); },
                onReset: handleResetAndNew
              }),
              h(
                'div',
                { className: "px-4 md:px-8 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60" },
                h(
                  'div',
                  { className: "flex items-center gap-3" },
                  h('span', { className: "text-xs font-bold text-emerald-400 uppercase tracking-wider" }, ((selectedMode && selectedMode.title) || 'Project') + ' / ' + (productName || 'Produk')),
                  h('span', { className: "px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] text-zinc-400" }, config.ratio)
                ),
                !isGenerating && h(
                  'button',
                  {
                    type: 'button',
                    onClick: function () { playClick(); setIsAudioStudioOpen(true); setIsAudioStudioMinimized(false); },
                    className: "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white border border-emerald-400/50 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
                  },
                  h(Volume2, { className: "w-4 h-4" }), ' Audio Studio'
                )
              ),
              h(
                'div',
                { className: "p-4 md:p-8 lg:p-10 pb-24" },
                h(
                  'div',
                  { className: "grid gap-6 md:gap-8 " + (config.scenes === 4 ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4') },
                  Array.from({ length: config.scenes }).map(function (_, index) {
                    var sceneData = generatedImages[index];
                    var image = sceneData && sceneData.src;
                    var isLoadingThis = sceneLoadings[index] || (isGenerating && !image);

                    return h(
                      'div',
                      { key: index, className: "flex flex-col gap-4 group" },
                      h(
                        'div',
                        { className: "relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 " + (config.ratio === '9:16' ? 'aspect-[9/16]' : config.ratio === '16:9' ? 'aspect-video' : 'aspect-square') },
                        image
                          ? h(
                              React.Fragment,
                              null,
                              h('img', { src: image, alt: "Output " + index, className: "w-full h-full object-cover " + (isLoadingThis ? 'scale-105 blur-sm opacity-50' : '') }),
                              isLoadingThis
                                ? h(GeneratingState, { index: index })
                                : h(
                                    'div',
                                    { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20" },
                                    h('button', { type: 'button', onClick: function () { setPreviewImage(image); }, className: "w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black text-white cursor-pointer" }, h(ZoomIn, { className: "w-5 h-5" }))
                                  ),
                              sceneData && sceneData.role && h(
                                'div',
                                { className: "absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full z-20" },
                                h('span', { className: "text-[9px] font-bold text-white uppercase tracking-widest" }, sceneData.role)
                              )
                            )
                          : h('div', { className: "absolute inset-0" }, isLoadingThis ? h(GeneratingState, { index: index }) : null)
                      ),
                      image && !isGenerating && h(
                        'div',
                        { className: "bg-zinc-900/50 border border-white/5 rounded-xl p-4 space-y-4" },
                        h(
                          'div',
                          { className: "flex items-center justify-between pb-3 border-b border-white/5" },
                          h('span', { className: "text-[10px] font-bold uppercase tracking-widest text-zinc-500" }, 'Scene 0' + (index + 1)),
                          h('button', { type: 'button', onClick: function (e) { downloadImage(image, index, e); }, className: "flex items-center gap-2 px-3 py-1.5 bg-white/10 text-emerald-300 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-600 hover:text-white cursor-pointer" }, h(Download, { className: "w-3 h-3" }), ' Unduh')
                        ),
                        h(
                          'div',
                          { className: "space-y-4 pt-1" },
                          h(
                            'div',
                            { className: "bg-green-950/40 border border-green-500/40 rounded-xl p-3.5 space-y-3" },
                            h('div', { className: "flex items-center gap-2" }, h(Sparkles, { className: "w-4 h-4 text-emerald-400" }), h('span', { className: "text-[11px] font-bold uppercase tracking-widest text-emerald-300" }, 'Revisi Visual AI')),
                            h(
                              'div',
                              { className: "flex gap-2" },
                              h('input', {
                                type: 'text',
                                disabled: isLoadingThis,
                                placeholder: "Cth: Buat pencahayaan lebih terang...",
                                className: "flex-grow bg-black/60 border border-green-500/30 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400",
                                value: scenePrompts[index] || "",
                                onChange: function (e) {
                                  var val = e.target.value;
                                  setScenePrompts(function (prev) {
                                    var next = Object.assign({}, prev);
                                    next[index] = val;
                                    return next;
                                  });
                                },
                                onKeyDown: function (e) { if (e.key === 'Enter') regenerateSingleScene(index); }
                              }),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  onClick: function () { regenerateSingleScene(index); },
                                  disabled: isLoadingThis || !scenePrompts[index],
                                  className: "px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-green-600 to-emerald-500 text-white disabled:opacity-50 cursor-pointer"
                                },
                                isLoadingThis ? h(Loader2, { className: "w-4 h-4 animate-spin" }) : "Revisi"
                              )
                            )
                          ),
                          h(
                            'div',
                            { className: "bg-black/30 p-3 rounded-lg border border-white/5 space-y-2" },
                            h(
                              'div',
                              { className: "flex items-center justify-between" },
                              h('span', { className: "text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 " + (sceneData.voActive ? 'text-emerald-400' : 'text-zinc-600') }, h(Mic, { className: "w-3 h-3" }), ' Voice Over ' + (sceneData.voActive ? 'On' : 'Off')),
                              h('input', {
                                type: 'checkbox',
                                checked: sceneData.voActive || false,
                                onChange: function (e) { updateSceneData(index, { voActive: e.target.checked }); },
                                disabled: isLoadingThis,
                                className: "cursor-pointer accent-emerald-500"
                              })
                            ),
                            sceneData.voActive
                              ? h('textarea', {
                                  value: sceneData.voText || "",
                                  onChange: function (e) { updateSceneData(index, { voText: e.target.value }); },
                                  disabled: isLoadingThis,
                                  className: "w-full bg-black/40 border border-white/10 rounded-md p-2 text-xs text-zinc-300 focus:outline-none h-16 resize-none",
                                  placeholder: "Ketik naskah Voice Over di sini..."
                                })
                              : h('div', { className: "flex items-center justify-center py-2 bg-black/20 rounded-md border border-white/5 border-dashed" }, h('p', { className: "text-[10px] text-zinc-600 italic" }, 'Tanpa Voice Over (Hanya Ambience/BGM)'))
                          )
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            onClick: function () { handleCopyPrompt(index); },
                            className: "w-full py-2.5 border text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer " + (copiedStates[index] ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-green-950/30 border-green-500/30 text-emerald-300 hover:bg-green-900/50 hover:text-white')
                          },
                          copiedStates[index]
                            ? [h(CheckCircle2, { key: 'c', className: "w-3 h-3" }), ' Tersalin!']
                            : [h(Copy, { key: 'cp', className: "w-3 h-3" }), ' Copy Prompt Generasi Video']
                        )
                      )
                    );
                  })
                ),
                !isGenerating && generatedImages.some(function (img) { return img !== null; }) && h(
                  'div',
                  { className: "mt-16 pt-10 border-t border-white/5 flex flex-col items-center gap-6" },
                  h(
                    'button',
                    {
                      onClick: handleDownloadAllZip,
                      disabled: isDownloadingZip,
                      className: "px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full text-xs font-bold tracking-widest uppercase text-white flex items-center gap-3 shadow-lg border border-emerald-400/50 cursor-pointer"
                    },
                    isDownloadingZip
                      ? [h(Loader2, { key: 'l', className: "w-5 h-5 animate-spin" }), ' Memproses ZIP...']
                      : [h(Archive, { key: 'a', className: "w-5 h-5" }), ' Download All Scene & Prompt (.ZIP)']
                  ),
                  h(
                    'button',
                    {
                      onClick: function () { playClick(); setIsVideoGeneratorsOpen(!isVideoGeneratorsOpen); },
                      className: "px-8 py-4 bg-slate-900/50 border border-white/10 rounded-full text-xs font-bold tracking-widest uppercase text-white flex items-center gap-3 cursor-pointer"
                    },
                    h(Video, { className: "w-5 h-5 text-emerald-400" }),
                    'Akses Video Generator',
                    isVideoGeneratorsOpen ? h(ChevronUp, { className: "w-4 h-4 text-zinc-400" }) : h(ChevronDown, { className: "w-4 h-4 text-zinc-400" })
                  ),
                  isVideoGeneratorsOpen && h(
                    'div',
                    { className: "flex flex-col sm:flex-row items-center gap-4 w-full justify-center" },
                    h('a', { href: "https://www.meta.ai/", target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-900/40 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase text-emerald-100" }, h(ExternalLink, { className: "w-4 h-4" }), ' Meta AI'),
                    h('a', { href: "https://grok.com/", target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900/60 border border-white/10 rounded-xl text-xs font-bold uppercase text-zinc-300" }, h(ExternalLink, { className: "w-4 h-4" }), ' Grok AI'),
                    h('a', { href: "https://labs.google/fx/tools/flow", target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-900/40 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase text-emerald-100" }, h(ExternalLink, { className: "w-4 h-4" }), ' Flow AI')
                  )
                )
              )
            );

          case 'sosmed-desk':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onBack: function () { setView('mode-selection'); }, onReset: handleResetAndNew }),
              h(
                'div',
                { className: "flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 relative z-20" },
                h(
                  'div',
                  { className: "max-w-4xl mx-auto w-full flex flex-col gap-8" },
                  h(SectionTitle, { title: "Sosmed Desk", subtitle: "AI Copywriter untuk menyusun Caption dan Hashtag viral secara otomatis." }),
                  h(
                    'div',
                    { className: "bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6" },
                    h(
                      'div',
                      { className: "space-y-4" },
                      h('label', { className: "text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2" }, h(PenTool, { className: "w-4 h-4" }), ' Topik Konten / Judul'),
                      h('input', { type: 'text', value: sosmedTitle, onChange: function (e) { setSosmedTitle(e.target.value); }, placeholder: "Contoh: Postingan TikTok tentang sepatu lari Nike terbaru...", className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400" })
                    ),
                    h(
                      'div',
                      { className: "space-y-4" },
                      h('label', { className: "text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2" }, h(Smartphone, { className: "w-4 h-4" }), ' Platform Tujuan'),
                      h(
                        'select',
                        { value: sosmedPlatform, onChange: function (e) { setSosmedPlatform(e.target.value); }, className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer" },
                        ['TikTok', 'Instagram Reels', 'Instagram Feed', 'YouTube Shorts', 'Twitter / X', 'Facebook'].map(function (p) { return h('option', { key: p, value: p, className: "bg-slate-900" }, p); })
                      )
                    ),
                    h(
                      'div',
                      { className: "pt-4" },
                      h(
                        ButtonCTA,
                        { onClick: handleGenerateSosmed, disabled: !sosmedTitle || isGeneratingSosmed },
                        isGeneratingSosmed
                          ? [h(Loader2, { key: 'l', className: "w-5 h-5 animate-spin" }), ' Menyusun Caption...']
                          : [h(Sparkles, { key: 's', className: "w-5 h-5" }), ' Generate Deskripsi & Hashtag']
                      )
                    )
                  ),
                  (sosmedResult || isGeneratingSosmed) && h(
                    'div',
                    { className: "bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-4" },
                    h(
                      'div',
                      { className: "flex items-center justify-between border-b border-white/5 pb-4" },
                      h('label', { className: "text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2" }, h(CheckCircle2, { className: "w-4 h-4" }), ' Hasil Copywriting'),
                      sosmedResult && h(
                        'button',
                        { onClick: handleCopySosmed, className: "flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-emerald-600 border border-white/10 rounded-lg text-xs font-bold uppercase text-zinc-300 hover:text-white cursor-pointer" },
                        copiedSosmed ? '✓ Tersalin!' : 'Copy Teks'
                      )
                    ),
                    isGeneratingSosmed
                      ? h('div', { className: "h-40 flex flex-col items-center justify-center gap-4 text-emerald-400/50" }, h(Loader2, { className: "w-8 h-8 animate-spin" }), h('p', { className: "text-xs font-medium uppercase tracking-widest animate-pulse" }, 'Meracik kata-kata & hashtag viral...'))
                      : h('textarea', { value: sosmedResult, onChange: function (e) { setSosmedResult(e.target.value); }, className: "w-full min-h-[300px] bg-black/40 border border-white/5 rounded-xl p-5 text-sm text-zinc-300 focus:outline-none leading-relaxed" })
                  )
                )
              )
            );

          case 'carousel-setup':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onBack: function () { setView('mode-selection'); }, onReset: handleResetAndNew }),
              h(
                'div',
                { className: "flex-grow flex flex-col px-4 pt-8 pb-12 md:px-12 relative z-20" },
                h(
                  'div',
                  { className: "max-w-4xl mx-auto w-full flex flex-col gap-8" },
                  h(SectionTitle, { title: "Carousel Product", subtitle: "Desain carousel post (slide-by-slide) dengan alur cerita berkesinambungan secara otomatis." }),
                  h(
                    'div',
                    { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    h(
                      'div',
                      { className: "bg-zinc-900/50 border border-white/5 rounded-3xl p-6" },
                      h(UploadZone, { label: "Upload Produk (Opsional)", image: carImage, onClick: function () { carImageInputRef.current && carImageInputRef.current.click(); }, icon: Package }),
                      h('input', { type: 'file', ref: carImageInputRef, onChange: handleCarImageUpload, className: "hidden", accept: "image/*" })
                    ),
                    h(
                      'div',
                      { className: "bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6" },
                      h(
                        'div',
                        { className: "space-y-3" },
                        h('label', { className: "text-[10px] font-bold text-emerald-400 uppercase tracking-widest block" }, 'Tipe Carousel'),
                        h(
                          'select',
                          { value: carTemplate, onChange: function (e) { setCarTemplate(e.target.value); }, className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-sm text-white" },
                          ['Testimonial / Review', 'Edukasi / Tips & Trik', 'Promo / Diskon', 'Storytelling / Brand Story', 'Product Launch'].map(function (t) { return h('option', { key: t, value: t, className: "bg-slate-900" }, t); })
                        )
                      ),
                      h(
                        'div',
                        { className: "space-y-3" },
                        h('label', { className: "text-[10px] font-bold text-emerald-400 uppercase tracking-widest block" }, 'Total Slide (2 - 9)'),
                        h('input', { type: 'number', min: 2, max: 9, value: carSlides, onChange: function (e) { setCarSlides(Number(e.target.value)); }, className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-sm text-white" })
                      ),
                      h(
                        'div',
                        { className: "space-y-3" },
                        h('label', { className: "text-[10px] font-bold text-emerald-400 uppercase tracking-widest block" }, 'Format / Aspect Ratio'),
                        h(
                          'select',
                          { value: carRatio, onChange: function (e) { setCarRatio(e.target.value); }, className: "w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-sm text-white" },
                          h('option', { value: "1:1 (Square)", className: "bg-slate-900" }, "1:1 (Square - Instagram Feed)"),
                          h('option', { value: "4:5 (Portrait)", className: "bg-slate-900" }, "4:5 (Portrait - Instagram Feed)")
                        )
                      )
                    )
                  ),
                  h(
                    'div',
                    { className: "bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-5" },
                    h('h3', { className: "text-sm font-bold text-white mb-2 flex items-center gap-2" }, h(Layout, { className: "w-4 h-4 text-emerald-400" }), ' Informasi Brand & Produk'),
                    h(
                      'div',
                      { className: "grid grid-cols-1 md:grid-cols-2 gap-5" },
                      h('input', { type: 'text', placeholder: "Nama Brand (cth: BrewCraft)", value: carBrand, onChange: function (e) { setCarBrand(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white" }),
                      h('input', { type: 'text', placeholder: "Username (cth: brewcraft_id)", value: carUsername, onChange: function (e) { setCarUsername(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white" }),
                      h('input', { type: 'text', placeholder: "Nama Produk / Topik", value: carProductName, onChange: function (e) { setCarProductName(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white" }),
                      h('input', { type: 'text', placeholder: "Kategori (cth: Skincare, Kopi)", value: carCategory, onChange: function (e) { setCarCategory(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white" })
                    ),
                    h('textarea', { placeholder: "Deskripsi Singkat Produk...", value: carDesc, onChange: function (e) { setCarDesc(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white h-20 resize-none" }),
                    h(
                      'div',
                      { className: "grid grid-cols-1 md:grid-cols-2 gap-5" },
                      h('input', { type: 'text', placeholder: "Manfaat Utama / Problem Solved", value: carBenefit, onChange: function (e) { setCarBenefit(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white" }),
                      h('input', { type: 'text', placeholder: "Target Audience (cth: Wanita 20-30th)", value: carTarget, onChange: function (e) { setCarTarget(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white" })
                    )
                  ),
                  h(
                    'div',
                    { className: "pt-4" },
                    h(ButtonCTA, { onClick: handleGenerateCarousel, disabled: !carProductName || isGeneratingCarousel }, h(Layers, { className: "w-5 h-5" }), ' Mulai Generate Carousel (' + carSlides + ' Slide)')
                  )
                )
              )
            );

          case 'carousel-result':
            return h(
              LayoutWrapper,
              null,
              h(Navbar, { onBack: function () { setView('carousel-setup'); }, onReset: handleResetAndNew }),
              h(
                'div',
                { className: "p-4 md:p-8 lg:p-12 pb-24" },
                isGeneratingCarousel && h(
                  'div',
                  { className: "mb-10 flex flex-col items-center justify-center p-8 bg-zinc-900/40 rounded-3xl border border-emerald-500/30" },
                  h(Loader2, { className: "w-10 h-10 text-emerald-400 animate-spin mb-4" }),
                  h('h3', { className: "text-lg font-bold text-white mb-1" }, 'Menyusun Storyboard Carousel...'),
                  h('p', { className: "text-xs text-zinc-400" }, 'AI sedang memproses Slide ' + carouselProgress + ' dari ' + carSlides)
                ),
                h(
                  'div',
                  { className: "flex flex-nowrap overflow-x-auto gap-6 pb-8" },
                  Array.from({ length: carSlides }).map(function (_, index) {
                    var image = carouselResults[index];
                    var isCurrentlyLoading = isGeneratingCarousel && carouselProgress === index + 1;
                    return h(
                      'div',
                      { key: index, className: "flex-shrink-0 flex flex-col gap-4 w-[280px] md:w-[340px]" },
                      h(
                        'div',
                        { className: "relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 " + (carRatio === '4:5 (Portrait)' ? 'aspect-[4/5]' : 'aspect-square') },
                        image
                          ? h('img', { src: image, alt: "Slide " + (index + 1), className: "w-full h-full object-cover" })
                          : h('div', { className: "absolute inset-0 flex items-center justify-center" }, isCurrentlyLoading ? h(GeneratingState, { index: index }) : h('span', { className: "text-xs text-zinc-600 uppercase" }, 'Menunggu Antrean...'))
                      ),
                      image && !isGeneratingCarousel && h(
                        'div',
                        { className: "bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between" },
                        h('span', { className: "text-[10px] font-bold uppercase text-emerald-400" }, 'Slide 0' + (index + 1) + ' / 0' + carSlides),
                        h('button', { type: 'button', onClick: function (e) { downloadImage(image, index, e, carRatio); }, className: "flex items-center gap-2 px-3 py-1.5 bg-white/10 text-emerald-300 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-600 hover:text-white cursor-pointer" }, h(Download, { className: "w-3 h-3" }), ' Unduh')
                      )
                    );
                  })
                )
              )
            );

          default:
            return null;
        }
      };

      return h(
        React.Fragment,
        null,
        renderContent(),
        previewImage && h(
          'div',
          {
            className: "fixed inset-0 z-[120] bg-slate-950/95 flex items-center justify-center p-4 md:p-12",
            onClick: function () { setPreviewImage(null); }
          },
          h(
            'div',
            {
              className: "relative overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center bg-zinc-900 max-h-[90vh] max-w-[90vw]",
              onClick: function (e) { e.stopPropagation(); }
            },
            h('img', { src: previewImage, alt: "Full Preview", className: "max-h-[88vh] w-auto object-contain" }),
            h('button', { type: 'button', onClick: function () { setPreviewImage(null); }, className: "absolute top-4 right-4 p-2 bg-black/60 hover:bg-black rounded-full text-white cursor-pointer" }, h(X, { className: "w-5 h-5" }))
          )
        ),
        isAudioStudioOpen && h(
          'div',
          {
            className: "fixed z-[110] right-4 bottom-4 md:right-8 md:bottom-8 bg-slate-950/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden " +
              (isAudioStudioMinimized ? 'w-[220px] h-[48px] rounded-2xl' : 'w-[calc(100vw-32px)] md:w-[680px] h-[500px] rounded-3xl')
          },
          h(
            'div',
            {
              className: "flex items-center justify-between px-5 py-3.5 bg-white/[0.03] border-b border-white/5 cursor-pointer",
              onClick: function () { setIsAudioStudioMinimized(!isAudioStudioMinimized); }
            },
            h(
              'div',
              { className: "flex items-center gap-2.5" },
              h('div', { className: "w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30" }, h(Volume2, { className: "w-3.5 h-3.5 text-emerald-400" })),
              h('span', { className: "text-[11px] font-bold tracking-widest uppercase text-zinc-100" }, 'Audio Studio')
            ),
            h(
              'div',
              { className: "flex items-center gap-2" },
              h('button', { type: 'button', onClick: function (e) { e.stopPropagation(); setIsAudioStudioMinimized(!isAudioStudioMinimized); }, className: "p-1 text-zinc-400 hover:text-white cursor-pointer" }, isAudioStudioMinimized ? h(ChevronUp, { className: "w-4 h-4" }) : h(ChevronDown, { className: "w-4 h-4" })),
              h('button', { type: 'button', onClick: function (e) { e.stopPropagation(); setIsAudioStudioOpen(false); setIsAudioStudioMinimized(false); }, className: "p-1 text-zinc-400 hover:text-red-400 cursor-pointer" }, h(X, { className: "w-4 h-4" }))
            )
          ),
          !isAudioStudioMinimized && h(
            'div',
            { className: "flex-grow overflow-y-auto p-5 md:p-6 flex flex-col gap-5" },
            h(
              'div',
              { className: "grid grid-cols-1 md:grid-cols-5 gap-5 flex-grow" },
              h(
                'div',
                { className: "md:col-span-3 flex flex-col gap-3 h-full" },
                h(
                  'div',
                  { className: "flex items-center justify-between" },
                  h('h3', { className: "text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5" }, h(FileText, { className: "w-3 h-3" }), ' Teks Naskah VO'),
                  h(
                    'div',
                    { className: "flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5" },
                    ['15s', '30s', '45s'].map(function (dur) {
                      return h(
                        'button',
                        {
                          key: dur,
                          type: 'button',
                          onClick: function () { playClick(); setVoDuration(dur); },
                          className: "px-2.5 py-1 text-[9px] font-bold rounded-md cursor-pointer " + (voDuration === dur ? 'bg-green-500/20 text-emerald-400' : 'text-zinc-500 hover:text-white')
                        },
                        dur
                      );
                    })
                  )
                ),
                h('textarea', {
                  value: voScript,
                  onChange: function (e) { setVoScript(e.target.value); },
                  placeholder: "Ketik naskah Voice Over Anda di sini, atau tekan tombol AI Auto-Script di bawah...",
                  className: "w-full flex-grow min-h-[120px] bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    onClick: handleGenerateVOScript,
                    disabled: isGeneratingVOScript,
                    className: "w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-zinc-200 cursor-pointer"
                  },
                  isGeneratingVOScript
                    ? [h(Loader2, { key: 'l', className: "w-3 h-3 animate-spin" }), ' Menyusun Naskah...']
                    : [h(Wand2, { key: 'w', className: "w-3 h-3 text-emerald-400" }), ' AI Auto-Script (' + voDuration + ')']
                )
              ),
              h(
                'div',
                { className: "md:col-span-2 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-5" },
                h('h3', { className: "text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5" }, h(Mic, { className: "w-3 h-3" }), ' Pengaturan Audio'),
                h(
                  'div',
                  { className: "space-y-3" },
                  h(
                    'div',
                    null,
                    h('label', { className: "text-[9px] font-bold text-zinc-500 uppercase block mb-1" }, 'Pilih Karakter Suara'),
                    h(
                      'select',
                      { value: voVoice, onChange: function (e) { setVoVoice(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white" },
                      VOICES.map(function (v) { return h('option', { key: v.id, value: v.id, className: "bg-zinc-900" }, v.name); })
                    )
                  ),
                  h(
                    'div',
                    null,
                    h('label', { className: "text-[9px] font-bold text-zinc-500 uppercase block mb-1" }, 'Emosi / Nada Bicara'),
                    h(
                      'select',
                      { value: voTone, onChange: function (e) { setVoTone(e.target.value); }, className: "w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white" },
                      TONES.map(function (t) { return h('option', { key: t, value: t, className: "bg-zinc-900" }, t); })
                    )
                  )
                ),
                h(
                  'div',
                  { className: "flex-grow flex flex-col justify-end gap-3 mt-2" },
                  voAudioUrl && h(
                    'div',
                    { className: "bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2" },
                    h('audio', { controls: true, src: voAudioUrl, className: "w-full h-8" }),
                    h('a', { href: voAudioUrl, download: "VO_" + (productName || 'Audio') + "_" + voTone + ".wav", className: "w-full py-2 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5" }, h(Download, { className: "w-3 h-3" }), ' Unduh Audio (WAV)')
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      onClick: handleGenerateVOAudio,
                      disabled: isGeneratingVOAudio || !voScript.trim(),
                      className: "w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-[11px] tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer"
                    },
                    isGeneratingVOAudio
                      ? [h(Loader2, { key: 'l', className: "w-3.5 h-3.5 animate-spin" }), ' Memproses...']
                      : [h(PlayCircle, { key: 'p', className: "w-3.5 h-3.5" }), ' Buat Audio VO']
                  )
                )
              )
            )
          )
        )
      );
    }

    container.innerHTML = '';
    var root = ReactDOM.createRoot(container);
    root.render(h(App));
  }
})();
