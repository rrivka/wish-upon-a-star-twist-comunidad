(() => {
  const lore = document.querySelector('.lore');
  if (!lore) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wither = lore.querySelector('.lore__p--wither');

  // aleatorio con semilla: la mancha tiene la misma forma cada vez que se redibuja
  const seeded = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const between = (r, a, b) => a + r() * (b - a);
  const f = (n) => n.toFixed(1);

  /* ---------- 1. mancha de tinta detrás del último párrafo ---------- */
  // contorno orgánico: superelipse con bordes irregulares, suavizada con curvas
  const blobPath = (cx, cy, rx, ry, r) => {
    const N = 40;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      // exponente 4: forma de rectángulo redondeado, como el bloque de texto
      const k = 1 / Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(s), 4), 1 / 4);
      const noise = between(r, 0.93, 1.07);
      pts.push([cx + c * rx * k * noise, cy + s * ry * k * noise]);
    }
    // Catmull-Rom cerrada → curvas Bézier
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % N];
      const p3 = pts[(i + 2) % N];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}`
         + ` ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}`
         + ` ${f(p2[0])} ${f(p2[1])}`;
    }
    return `${d} Z`;
  };

  const buildInk = () => {
    wither.querySelector('.lore__ink')?.remove();
    const r = seeded(11);
    const narrow = innerWidth < 600;
    const pad = narrow ? 18 : 30;
    const maxDrip = narrow ? 240 : 340;
    const W = wither.offsetWidth + pad * 2;
    const H = wither.offsetHeight + pad * 2;
    const cx = W / 2;
    const cy = H / 2;
    const rx = W / 2 - 4;
    const ry = H / 2 - 4;

    // chorros que cuelgan del borde inferior de la mancha
    let drips = '';
    const count = Math.max(5, Math.round(W / 46));
    for (let i = 0; i < count; i++) {
      const x = pad + (i + between(r, 0.15, 0.85)) / count * (W - pad * 2);
      const w = between(r, 6, narrow ? 12 : 16);
      const len = between(r, 0.3, 1) * maxDrip;
      const top = cy + ry * 0.7;            // nace dentro de la mancha
      const full = len + ry * 0.3;           // largo total del chorro
      const start = between(r, 0.25, 0.7).toFixed(2);
      drips += `
        <g class="ink-drip" style="--full:${f(full)}px; --start:${start}; --dt:${between(r, 1.8, 3.4).toFixed(2)}s; --delay:${between(r, 0, 3).toFixed(2)}s">
          <rect class="ink-drip__body" x="${f(x - w / 2)}" y="${f(top)}" width="${f(w)}" height="${f(full)}" rx="${f(w / 2)}"/>
          <circle class="ink-drip__head" cx="${f(x)}" cy="${f(top)}" r="${f(w * 0.85)}"/>
          <circle class="ink-drip__fall" cx="${f(x)}" cy="${f(top)}" r="${f(w * 0.45)}"/>
        </g>`;
    }

    const id = 'ink-goo';
    const svg = `
      <svg class="lore__ink" aria-hidden="true" width="${f(W)}" height="${f(H + maxDrip)}"
           viewBox="0 0 ${f(W)} ${f(H + maxDrip)}" style="left:${-pad}px; top:${-pad}px">
        <defs>
          <!-- bordes irregulares + efecto líquido (las formas se funden entre sí) -->
          <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="${narrow ? 8 : 12}" result="rough"/>
            <feGaussianBlur in="rough" stdDeviation="${narrow ? 4 : 6}" result="blur"/>
            <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"/>
          </filter>
        </defs>
        <g filter="url(#${id})">
          <g class="ink-blob" style="transform-origin:${f(cx)}px ${f(cy)}px">
            <path d="${blobPath(cx, cy, rx, ry, r)}"/>
          </g>
          ${drips}
        </g>
      </svg>`;
    wither.insertAdjacentHTML('afterbegin', svg);
  };

  /* ---------- 2. los párrafos y las estrellas aparecen al llegar a ellos ---------- */
  lore.classList.add('has-js');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  lore.querySelectorAll('.lore__p, .lore__sep').forEach((el) => io.observe(el));

  /* ---------- 3. la tinta avanza con el scroll ---------- */
  // al empezar a gotear la tinta suena el goteo (se rearma al volver arriba)
  let dripped = false;
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    const rect = wither.getBoundingClientRect();
    // empieza cuando el párrafo está a media pantalla y termina cuando sale por arriba
    const p = Math.min(1, Math.max(0, (vh * 0.75 - rect.top) / (vh * 0.75)));
    lore.style.setProperty('--w', p.toFixed(3));
    lore.classList.toggle('is-bleeding', p > 0.97 && !reduced);
    if (p < 0.05) dripped = false;
    if (!dripped && p >= 0.3) {
      window.SFX?.drip();
      dripped = true;
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });

  // la mancha se dibuja a la medida del párrafo (con la fuente ya cargada)
  let resizeTimer;
  let lastWidth = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastWidth) return;   // en móvil la barra del navegador cambia el alto
    lastWidth = innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildInk(); update(); }, 150);
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    buildInk();
    update();
  });
})();
