/*
 * Sonidos de la página, sintetizados con Web Audio (sin archivos).
 * Los navegadores no dejan sonar nada hasta que la persona toca la página
 * por primera vez; antes de eso las llamadas se ignoran en silencio.
 */
window.SFX = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const STORE = 'wish-sound';
  const VOLUME = 0.6;

  let enabled = true;
  try { enabled = localStorage.getItem(STORE) !== 'off'; } catch (e) { /* sin almacenamiento */ }

  let ctx = null;
  let master = null;
  let reverb = null;
  let noise = null;

  // notas altas de una escala pentatónica: suenan bien en cualquier combinación
  const NOTES = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349.3, 2637, 3136];
  const pick = () => NOTES[Math.floor(Math.random() * NOTES.length)];

  const init = () => {
    if (ctx || !AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? VOLUME : 0;
    master.connect(ctx.destination);

    // reverberación sintética: da la sensación de espacio mágico
    const len = ctx.sampleRate * 2.4;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    reverb = ctx.createConvolver();
    reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.4;
    reverb.connect(wet).connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const n = noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  };

  // solo suena si el audio ya está habilitado por el navegador
  const ready = () => {
    init();
    return !!ctx && ctx.state === 'running' && enabled;
  };

  const unlock = () => {
    init();
    if (ctx && ctx.state !== 'running') ctx.resume();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
    addEventListener(ev, unlock, { capture: true, passive: true }));

  // conecta un sonido a la salida directa y a la reverberación
  const out = (node, dry = 1, wet = 0.5) => {
    const d = ctx.createGain();
    d.gain.value = dry;
    node.connect(d).connect(master);
    const w = ctx.createGain();
    w.gain.value = wet;
    node.connect(w).connect(reverb);
  };

  /* ---------- instrumentos ---------- */

  // campanita de cristal: parciales inarmónicos con caída exponencial
  const bell = (freq, t, { vol = 0.08, dur = 1.4, wet = 0.6 } = {}) => {
    const g = ctx.createGain();
    g.gain.value = 1;
    out(g, 1, wet);
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(([ratio, amp]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * ratio;
      const e = ctx.createGain();
      const d = dur / Math.sqrt(ratio);
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(vol * amp, t + 0.006);
      e.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(e).connect(g);
      o.start(t);
      o.stop(t + d + 0.05);
    });
  };

  // brillo: ruido filtrado que barre de una frecuencia a otra
  const shimmer = (t, dur, from, to, vol = 0.04) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 6;
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    const e = ctx.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(e);
    out(e, 1, 0.7);
    src.start(t);
    src.stop(t + dur + 0.05);
  };

  // nota suave y sostenida (colchón mágico)
  const pad = (freq, t, dur, vol = 0.025) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const e = ctx.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(e);
    out(e, 0.6, 0.9);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  /* ---- caverna: reverberación larga y oscura + eco, solo para el goteo ---- */
  let cave = null;
  const caveBus = () => {
    if (cave) return cave;
    const len = ctx.sampleRate * 4.5;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const dark = ctx.createBiquadFilter();   // cola apagada, sin brillo
    dark.type = 'lowpass';
    dark.frequency.value = 2200;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    conv.connect(dark).connect(wet).connect(master);

    // eco nítido que rebota de un lado al otro y se va apagando
    const delay = ctx.createGain();            // entrada del eco
    const left = ctx.createDelay(1);
    const right = ctx.createDelay(1);
    left.delayTime.value = 0.34;
    right.delayTime.value = 0.34;
    const tone = ctx.createBiquadFilter();     // cada rebote pierde un poco de brillo
    tone.type = 'lowpass';
    tone.frequency.value = 3800;
    const fbL = ctx.createGain();
    const fbR = ctx.createGain();
    fbL.gain.value = 0.52;
    fbR.gain.value = 0.52;
    delay.connect(left);
    left.connect(tone).connect(fbL).connect(right);
    right.connect(fbR).connect(left);
    const echo = ctx.createGain();
    echo.gain.value = 0.5;
    const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (panL.pan) { panL.pan.value = -0.7; panR.pan.value = 0.7; }
    tone.connect(panL).connect(echo);
    right.connect(panR).connect(echo);
    echo.connect(master);

    cave = { conv, delay };
    return cave;
  };

  // gota de agua con eco: un "plic" corto y brillante (no un barrido largo)
  const waterDrop = (t, freq, vol = 0.12) => {
    const { conv, delay } = caveBus();
    const bus = ctx.createGain();
    bus.gain.value = 1;
    const dry = ctx.createGain();
    dry.gain.value = 0.8;
    bus.connect(dry).connect(master);
    bus.connect(conv);
    bus.connect(delay);

    // contacto: un clic diminuto de ruido agudo
    const hit = ctx.createBufferSource();
    hit.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4000;
    const he = ctx.createGain();
    he.gain.setValueAtTime(vol * 0.12, t);
    he.gain.exponentialRampToValueAtTime(0.0001, t + 0.006);
    hit.connect(hp).connect(he).connect(bus);
    hit.start(t);
    hit.stop(t + 0.01);

    // la gota: tono puro que sube apenas y muy rápido, y se apaga enseguida
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 0.86, t);
    o.frequency.exponentialRampToValueAtTime(freq * 1.1, t + 0.018);
    o.frequency.setValueAtTime(freq * 1.1, t + 0.018);
    const e = ctx.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(vol, t + 0.002);
    e.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.03);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
    o.connect(e).connect(bus);
    o.start(t);
    o.stop(t + 0.1);
  };

  // zumbido grave y disonante que crece bajo las gotas: presagio
  const dread = (t, dur) => {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    const e = ctx.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(0.045, t + dur * 0.35);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(e).connect(master);
    e.connect(caveBus().conv);
    // dos notas casi iguales que "laten" entre sí, más una quinta disminuida
    [[73.4, 'sine'], [77.8, 'sine'], [103.8, 'triangle']].forEach(([f, type]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  };

  /*
   * Candado anti-spam: cada sonido queda bloqueado mientras suena
   * y durante 1 segundo más después de terminar.
   */
  const COOLDOWN = 1;
  const lockedUntil = {};
  const play = (name, duration) => {
    if (!ready()) return false;
    const now = performance.now();
    if (now < (lockedUntil[name] || 0)) return false;
    lockedUntil[name] = now + (duration + COOLDOWN) * 1000;
    return true;
  };

  /* ---------- sonidos de la página ---------- */
  const api = {
    // estrellas colgantes que llegan: tintineos de cristal
    loaderEnter(count = 10, stagger = 0.09) {
      if (!play('loaderEnter', 0.55 + count * stagger + 1.6)) return;
      const t = ctx.currentTime + 0.55;
      for (let i = 0; i < count; i++) {
        bell(pick() * 1.5, t + i * stagger + Math.random() * 0.03, { vol: 0.035, dur: 1.6 });
      }
    },
    // las estrellas se encienden: arpegio ascendente con brillo
    lightUp() {
      if (!play('lightUp', 1.8)) return;
      const t = ctx.currentTime;
      [1046.5, 1318.5, 1568, 2093, 2637, 3136].forEach((f, i) => bell(f, t + i * 0.05, { vol: 0.05, dur: 1.8 }));
      shimmer(t, 1.1, 2000, 9000, 0.03);
      pad(523.3, t, 1.6);
      pad(784, t, 1.6);
    },
    // se elevan: soplo mágico hacia arriba
    rise() {
      if (!play('rise', 1.2)) return;
      const t = ctx.currentTime;
      shimmer(t, 1.2, 700, 6000, 0.035);
    },
    // aparece el header: estrellas suaves
    headerOpen() {
      if (!play('headerOpen', 2.7)) return;
      const t = ctx.currentTime;
      [1568, 2093, 2349.3, 2637, 3136].forEach((f, i) => bell(f, t + i * 0.13, { vol: 0.045, dur: 2.2 }));
      shimmer(t + 0.1, 1.4, 3000, 7000, 0.015);
    },
    // goteo: cuatro gotas de agua con eco, una tras otra, cada vez más lentas y un poco más graves
    drip() {
      if (!play('drip', 6.5)) return;
      const t = ctx.currentTime + 0.05;
      dread(t, 6.5);
      [[0, 1950, 0.14], [1.2, 1880, 0.13], [2.15, 1800, 0.12], [3.6, 1700, 0.11]]
        .forEach(([at, f, vol]) => waterDrop(t + at, f * (0.98 + Math.random() * 0.04), vol));
    },
    // pestañas: una nota distinta para cada una
    tab(i = 0) {
      if (!play('tab', 1)) return;
      const t = ctx.currentTime;
      const f = [1318.5, 1568, 1760][i % 3];
      bell(f, t, { vol: 0.07, dur: 1 });
      bell(f * 1.5, t + 0.06, { vol: 0.035, dur: 0.9 });
    },
    // flechas del carrusel: deslizamiento con un destello
    swipe(dir = 1) {
      if (!play('swipe', 0.7)) return;
      const t = ctx.currentTime;
      shimmer(t, 0.3, dir > 0 ? 1500 : 4500, dir > 0 ? 4500 : 1500, 0.035);
      bell(dir > 0 ? 2093 : 1568, t + 0.08, { vol: 0.04, dur: 0.7 });
    },
    // el QR se revela: cascada de campanitas y florecimiento
    reveal() {
      if (!play('reveal', 1.8)) return;
      const t = ctx.currentTime;
      NOTES.concat([3520, 4186]).forEach((f, i) => bell(f, t + i * 0.035, { vol: 0.045, dur: 1.6 }));
      shimmer(t, 1.5, 1200, 9000, 0.035);
      pad(261.6, t, 1.8, 0.03);
      pad(392, t, 1.8, 0.025);
    },
    // el velo vuelve a cubrir el QR
    veil() {
      if (!play('veil', 1.1)) return;
      const t = ctx.currentTime;
      bell(1318.5, t, { vol: 0.045, dur: 0.9 });
      bell(987.8, t + 0.1, { vol: 0.04, dur: 1 });
    },

    // el deseo se entrega: notas que suben despacio y un brillo largo hacia el cielo
    wish() {
      if (!play('wish', 2.6)) return;
      const t = ctx.currentTime;
      pad(392, t, 2.4, 0.03);
      pad(587.3, t + 0.1, 2.4, 0.025);
      [784, 1046.5, 1318.5, 1568, 2093, 2637].forEach((f, i) => bell(f, t + 0.15 + i * 0.12, { vol: 0.05, dur: 2 }));
      shimmer(t, 1.8, 900, 9000, 0.035);
    },

    // habilita el audio (debe llamarse dentro de un toque o clic)
    unlock() {
      unlock();
      return ctx ? ctx.resume() : Promise.resolve();
    },

    get enabled() { return enabled; },
    get state() { return ctx ? ctx.state : 'sin iniciar'; },
    setEnabled(on) {
      enabled = on;
      try { localStorage.setItem(STORE, on ? 'on' : 'off'); } catch (e) { /* sin almacenamiento */ }
      init();
      if (master) master.gain.setTargetAtTime(on ? VOLUME : 0, ctx.currentTime, 0.05);
      if (on) unlock();
    },
  };

  /* ---------- botón de sonido ---------- */
  const btn = document.querySelector('.sound-toggle');
  if (btn) {
    const sync = () => {
      btn.setAttribute('aria-pressed', enabled);
      btn.setAttribute('aria-label', enabled ? 'Silenciar sonidos' : 'Activar sonidos');
    };
    btn.addEventListener('click', () => {
      api.setEnabled(!enabled);
      sync();
      // pequeño tintineo de confirmación al activar
      if (enabled) setTimeout(() => api.tab(1), 60);
    });
    sync();
  }

  return api;
})();
