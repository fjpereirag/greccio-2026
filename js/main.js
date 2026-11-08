/* El Fuego y la Ternura de Greccio · interacción (sin dependencias) */
(() => {
  const root = document.documentElement;
  const state = window.GRECCIO = { tone: 0, reduce: false, sound: false };
  const $ = (s) => document.querySelector(s);

  /* ---------- Movimiento reducido (sigue la preferencia del sistema) ---------- */
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const setReduce = (v) => { state.reduce = v; root.classList.toggle('reduce-motion', v); };
  setReduce(mq.matches); mq.addEventListener?.('change', (e) => setReduce(e.matches));

  /* ---------- Música ----------
     1) Si existe audio/musica.mp3 (con derechos de uso), suena en bucle.
     2) Si no, un laúd sintetizado aquí mismo toca una pieza ORIGINAL en modo de re, al estilo de las danzas medievales. */
  let ctx = null, out = null, track = null, usingTrack = false, started = false, loopTimer = null;
  const reverb = (c) => {
    const len = c.sampleRate * 2.8, buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    const cv = c.createConvolver(); cv.buffer = buf; return cv;
  };
  // Cuerda pulsada (Karplus-Strong): suena a laúd / guitarra
  const cache = new Map();
  const pluckBuffer = (f) => {
    const key = Math.round(f * 10); if (cache.has(key)) return cache.get(key);
    const sr = ctx.sampleRate, len = Math.floor(sr * 2.6), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f)), damp = 0.996 - Math.min(.006, f / 200000);
    let prev = 0; for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * .55 + r * .45; d[i] = prev; } // ruido suavizado: ataque de yema, no de púa
    for (let i = N; i < len; i++) d[i] = damp * .5 * (d[i - N] + d[i - N - 1 < 0 ? 0 : i - N - 1]);
    cache.set(key, buf); return buf;
  };
  const pluck = (f, t, vol) => {
    const s = ctx.createBufferSource(); s.buffer = pluckBuffer(f);
    const g = ctx.createGain(); g.gain.value = vol; s.connect(g).connect(out); s.start(t);
  };
  const NOTE = (n) => 146.83 * Math.pow(2, n / 12); // n = semitonos desde Re3
  // Pieza original: 8 compases en 3/4, modo de re. Acordes como [bajo, notas del arpegio...]
  const BARS = [
    [-12, [0, 7, 12, 15, 12, 7]],   // Re menor
    [-14, [-2, 5, 10, 14, 10, 5]],  // Do
    [-12, [0, 7, 12, 17, 15, 12]],  // Re menor
    [-17, [-5, 4, 7, 12, 7, 4]],    // La menor
    [-21, [-9, 0, 3, 8, 3, 0]],     // Fa (en la grave)
    [-14, [-2, 5, 10, 14, 17, 14]], // Do
    [-12, [0, 7, 12, 14, 12, 7]],   // Re (suspendido)
    [-17, [-5, 4, 9, 13, 16, 19]],  // La mayor: vuelve a casa
  ];
  // Melodía alta (una nota por compás, larga), solo en la segunda vuelta
  const TOP = [24, 22, 27, 24, 20, 22, 26, 25];
  const playLoop = () => {
    const beat = 60 / 66, eighth = beat / 2; let t = ctx.currentTime + .3;
    for (let round = 0; round < 2; round++) {
      BARS.forEach(([bass, arp], i) => {
        pluck(NOTE(bass), t, .55);
        arp.forEach((n, j) => pluck(NOTE(n), t + j * eighth + (j ? (Math.random() - .5) * .015 : 0), .22 + (j === 3 ? .06 : 0)));
        if (round === 1) { pluck(NOTE(TOP[i]), t + .01, .3); pluck(NOTE(TOP[i]), t + beat * 2, .18); }
        t += beat * 3;
      });
    }
    loopTimer = setTimeout(playLoop, (t - ctx.currentTime + 2.5) * 1000);
  };
  const startLute = () => {
    if (!ctx || loopTimer) return;
    out = ctx.createGain(); out.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const rv = reverb(ctx), wet = ctx.createGain(); wet.gain.value = .5;
    out.connect(lp); lp.connect(ctx.destination); lp.connect(rv).connect(wet).connect(ctx.destination);
    playLoop();
  };
  /* La música (audio/musica.mp3) y la voz pasan por Web Audio: así el volumen y el «agacharse» de la música
     mientras habla Álvaro funcionan también en iPhone (allí el volumen de <audio> no se puede cambiar). */
  let musicGain = null, voiceGain = null, voices = [], voiceSrc = null, lastVoiced = -1, voiceTimer = null;
  const MUSIC = .55, MUSIC_DUCK = .16;
  const setMusic = (v, tau = .9) => { if (!musicGain) return; musicGain.gain.cancelScheduledValues(ctx.currentTime); musicGain.gain.setTargetAtTime(v, ctx.currentTime, tau); };
  // una voz por ancla: I, las cuatro de la parroquia, el Belén final en silencio (null) y «¡Paz y Bien!»
  const VOICE_FILES = ['voz-1', 'voz-p1', 'voz-p3', 'voz-p4', 'voz-p5', null, 'voz-5'];
  const FINAL_VOICE = VOICE_FILES.length - 1, PORTAL = FINAL_VOICE - 1;
  const loadVoices = () => {
    VOICE_FILES.forEach((name, n) => {
      if (!name) return;
      fetch(`audio/${name}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
        .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)))
        .then(buf => { voices[n] = buf; if (n === pendingScene) speak(n); })
        .catch(() => {});
    });
  };
  let pendingScene = -1;
  const stopVoice = () => { clearTimeout(voiceTimer); if (voiceSrc) { try { voiceSrc.onended = null; voiceSrc.stop(); } catch (e) {} voiceSrc = null; } };
  const speak = (i) => {
    if (!state.sound || !ctx) return;
    if (!VOICE_FILES[i]) return;
    if (!voices[i]) { pendingScene = i; return; }       // aún cargando: suena en cuanto llegue
    if (i === lastVoiced) return;
    lastVoiced = i; pendingScene = -1; stopVoice();
    voiceTimer = setTimeout(() => {
      if (!state.sound) return;
      const s = ctx.createBufferSource(); s.buffer = voices[i]; s.connect(voiceGain);
      setMusic(usingTrack ? MUSIC_DUCK : .25, .35);
      s.onended = () => { if (voiceSrc === s) { voiceSrc = null; setMusic(state.sound ? (usingTrack ? MUSIC : .9) : 0, 1.2); } };
      s.start(); voiceSrc = s;
    }, 700);
  };
  window.GRECCIO.speak = speak;
  // susurro de viento al ponerse en camino (ruido filtrado que barre de grave a agudo)
  state.whoosh = (amt = 1) => {
    if (!state.sound || !ctx || state.reduce) return;
    const dur = 1.8, n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(260, ctx.currentTime); bp.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + dur * .7);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(.09 * Math.min(1, amt + .3), ctx.currentTime + dur * .45); g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    n.connect(bp).connect(g).connect(ctx.destination); n.start();
  };
  const voiceDur = (i) => voices[i] ? voices[i].duration : 0;
  const applySound = () => {
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (usingTrack) { if (state.sound) track.play().catch(() => {}); setMusic(state.sound ? (voiceSrc ? MUSIC_DUCK : MUSIC) : 0); }
    else if (out) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(state.sound ? .9 : 0, ctx.currentTime, .8); musicGain = out; }
    if (!state.sound) { stopVoice(); lastVoiced = -1; }
  };
  const startAudio = () => { // dentro del toque del usuario (requisito de iOS)
    if (started) return; started = true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); ctx.resume();
    voiceGain = ctx.createGain(); voiceGain.gain.value = 1; voiceGain.connect(ctx.destination);
    track = new Audio('audio/musica.mp3'); track.loop = true; track.preload = 'auto';
    try { const src = ctx.createMediaElementSource(track); musicGain = ctx.createGain(); musicGain.gain.value = 0; src.connect(musicGain).connect(ctx.destination); } catch (e) {}
    const fallback = () => { if (usingTrack) return; track = null; musicGain = null; startLute(); applySound(); };
    track.addEventListener('error', fallback, { once: true });
    track.play().then(() => { usingTrack = true; applySound(); }).catch(fallback);
    loadVoices();
  };
  const btnSound = $('#btn-sound');
  const setSound = (v) => {
    state.sound = v;
    btnSound.setAttribute('aria-pressed', String(v));
    btnSound.setAttribute('aria-label', v ? 'Apagar música y voz' : 'Encender música y voz');
    if (v) startAudio();
    applySound();
    if (v) { const c = Math.round(state.tone); if (c < PORTAL) speak(c); else if (document.querySelector('.final').getBoundingClientRect().top < innerHeight * .45) speak(FINAL_VOICE); }
  };
  btnSound.addEventListener('click', () => setSound(!state.sound));

  /* ---------- Umbral ---------- */
  const gate = $('#gate');
  const enter = (withSound) => {
    setSound(withSound);
    state.entered = true;
    document.body.classList.add('is-flying');
    gate.classList.add('is-gone');
    document.body.classList.remove('is-gated');
    setTimeout(() => document.querySelectorAll('#noche .reveal').forEach((el) => el.classList.add('is-in')), 900);
    setTimeout(() => autoplay.start(), 3200);   // tras el vuelo de entrada
  };
  gate.addEventListener('click', (e) => { const b = e.target.closest('[data-enter]'); if (b) enter(b.dataset.enter === 'sound'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !gate.classList.contains('is-gone')) enter(false); });
  gate.querySelector('button').focus({ preventScroll: true });

  /* ---------- Texto cinético: cada palabra entra por separado ---------- */
  document.querySelectorAll('.phrase, .final__text').forEach((el) => {
    let n = 0;
    const walk = (node) => [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', n++); s.textContent = w; frag.appendChild(s);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(el);
  });
  const bar = document.querySelector('.progress span');

  /* ---------- Revelados ---------- */
  const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }),
    { rootMargin: '0px 0px -12% 0px', threshold: .15 });
  document.querySelectorAll('main .reveal, .final__title').forEach(el => { if (!el.closest('#noche')) io.observe(el); });

  /* ---------- Escena actual → cámara y luces ---------- */
  // Cada escena tiene un «ancla» (su texto). Cuando el ancla está en pantalla, la cámara está en esa escena.
  const anchors = [...document.querySelectorAll('.anchor')];
  const dots = [...document.querySelectorAll('.hud__dots a')];
  let ticking = false, lastCur = -1, pos = [];
  const measure = () => { pos = anchors.map(el => { const r = el.getBoundingClientRect(); return r.top + scrollY + r.height / 2; }); };
  const onScroll = () => {
    ticking = false;
    const eye = scrollY + innerHeight * .72;
    let tone = 0;
    if (eye >= pos[pos.length - 1]) tone = pos.length - 1;
    else for (let i = 0; i < pos.length - 1; i++) if (eye >= pos[i] && eye < pos[i + 1]) tone = i + (eye - pos[i]) / (pos[i + 1] - pos[i]);
    state.tone = tone;
    if (bar) bar.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
    const cur = Math.min(anchors.length - 1, Math.round(tone));
    if (cur !== lastCur) { lastCur = cur; const sec = anchors[cur].closest('[data-dot]').dataset.dot; dots.forEach((d) => d.setAttribute('aria-current', String(d.getAttribute('href') === '#' + sec))); }
    // Álvaro lee la escena cuando su texto queda en el centro (no mientras se pasa de largo)
    // escenas I–IV: Álvaro lee cuando el texto queda centrado. Ante el Belén final, silencio;
    // la voz 5 («¡Paz y Bien!») suena cuando sube el saludo final.
    const finalCard = document.querySelector('.final');
    const atFinal = finalCard.getBoundingClientRect().top < innerHeight * .45;
    if (atFinal) speak(FINAL_VOICE);
    else if (cur < PORTAL && Math.abs(tone - cur) < .22) speak(cur);
  };
  addEventListener('resize', () => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); onScroll(); });
  measure();
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();


  /* ---------- Recorrido automático ----------
     Tras pulsar «Entrar», el camino avanza solo: se detiene en cada escena mientras Álvaro la lee
     (o unos segundos si no hay sonido) y sigue hasta el Belén. Si tocas, deslizas o usas el teclado, se pausa;
     el botón ▶/❚❚ de arriba lo reanuda o lo detiene. */
  const autoplay = (() => {
    const btn = $('#btn-play');
    let on = false, idx = 0, raf = 0, timer = 0;
    const target = (i) => {
      if (i >= anchors.length) return document.documentElement.scrollHeight - innerHeight;   // el saludo final
      const r = anchors[i].getBoundingClientRect(); return Math.max(0, r.top + scrollY + r.height / 2 - innerHeight * .72);
    };
    const setBtn = () => { btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', on ? 'Recorrido automático: pausar' : 'Recorrido automático: reanudar'); };
    const glide = (to, ms, done) => {
      cancelAnimationFrame(raf);
      const from = scrollY, t0 = performance.now(), root = document.documentElement;
      root.style.scrollBehavior = 'auto';
      if (state.reduce || Math.abs(to - from) < 2) { scrollTo(0, to); return done(); }
      const step = (now) => {
        if (!on) return;
        const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        scrollTo(0, from + (to - from) * e);
        if (k < 1) raf = requestAnimationFrame(step); else done();
      };
      raf = requestAnimationFrame(step);
    };
    const holdFor = (i) => {
      if (i >= anchors.length) return 0;
      if (i === anchors.length - 1) return 6000;            // el Belén final: 6 s en silencio
      const v = state.sound ? voiceDur(i) : 0;
      return v ? (v + 2.2) * 1000 : 7000;
    };
    const next = () => {
      if (!on) return;
      if (idx > anchors.length) { stop(); return; }
      const dist = Math.abs(target(idx) - scrollY);
      glide(target(idx), Math.min(7000, 2200 + dist * 2.2), () => {
        if (!on) return;
        const wait = holdFor(idx); idx++;
        if (idx > anchors.length) { stop(); return; }   // llegó al saludo final
        timer = setTimeout(next, wait);
      });
    };
    const start = () => {
      measure();
      // continuar desde la escena en la que está
      idx = 0; while (idx < anchors.length && target(idx) < scrollY - 40) idx++;
      on = true; setBtn(); next();
    };
    const stop = () => { on = false; cancelAnimationFrame(raf); clearTimeout(timer); setBtn(); document.documentElement.style.scrollBehavior = ''; };
    btn.addEventListener('click', () => on ? stop() : start());
    document.querySelector('.hud__dots').addEventListener('click', () => stop());
    // el usuario toma el control
    const interrupt = () => { if (on) stop(); };
    addEventListener('wheel', interrupt, { passive: true });
    addEventListener('touchstart', (e) => { if (!e.target.closest('.hud, .gate, button, a')) interrupt(); }, { passive: true });
    addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) interrupt(); });
    return { start, stop };
  })();

  /* ---------- Enviar el christmas ---------- */
  const url = location.href.split('#')[0];
  const msg = '¡Paz y Bien! Te envío este christmas franciscano: «El Fuego y la Ternura de Greccio». Feliz Navidad.';
  $('#btn-wa').href = 'https://wa.me/?text=' + encodeURIComponent(msg + ' ' + url);
  $('#btn-share').addEventListener('click', async () => {
    if (navigator.share) { try { await navigator.share({ title: 'El Fuego y la Ternura de Greccio', text: msg, url }); } catch (e) {} }
    else { try { await navigator.clipboard.writeText(msg + ' ' + url); $('#btn-share').textContent = 'Enlace copiado ✓'; } catch (e) { location.href = $('#btn-wa').href; } }
  });
  $('#btn-again').addEventListener('click', () => { autoplay.stop(); scrollTo({ top: 0, behavior: 'auto' }); setTimeout(() => autoplay.start(), 600); });
})();
