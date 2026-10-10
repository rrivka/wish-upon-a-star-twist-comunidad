(() => {
  const SPARKLE = '<svg><use href="#sparkle"/></svg>';
  const rand = (min, max) => min + Math.random() * (max - min);
  const rad = (deg) => (deg * Math.PI) / 180;

  // Punto sobre la elipse del arco, en % del contenedor .crest
  // (centro abajo al medio, mismas proporciones que el path del SVG)
  const onArc = (deg, rx = 47, ry = 94) => ({
    x: 50 + rx * Math.cos(rad(deg)),
    y: 100 - ry * Math.sin(rad(deg)),
  });

  /* Estrella principal sobre el arco */
  const star = document.querySelector('.crest__star');
  const starPos = onArc(150);
  star.style.left = `${starPos.x}%`;
  star.style.top = `${starPos.y}%`;

  /* Estela: destellos que se van haciendo más pequeños y tenues */
  const trail = document.querySelector('.crest__trail');
  const BITS = 16;
  for (let i = 0; i < BITS; i++) {
    const t = i / (BITS - 1);                 // 0 = junto a la estrella, 1 = final
    const deg = 143 - t * 52;
    const p = onArc(deg, 41 + rand(-2.5, 2.5), 80 + rand(-6, 6));
    const isDot = i % 3 === 2;
    const size = isDot ? rand(3, 5) : (1 - t) * 22 + 7;

    const el = document.createElement('span');
    el.className = `trail-bit${isDot ? ' is-dot' : ''}`;
    el.style.left = `${p.x}%`;
    el.style.top = `${p.y}%`;
    el.style.setProperty('--s', `${size}px`);
    el.style.setProperty('--o', (0.85 - t * 0.55).toFixed(2));
    el.style.setProperty('--delay', `${(i * 0.18).toFixed(2)}s`);
    if (!isDot) el.innerHTML = SPARKLE;
    trail.appendChild(el);
  }

  /* Estrellitas titilando en el cielo */
  const sky = document.querySelector('.hero__sky');
  const SKY_COLORS = ['#fff1bf', '#cfe9ff', '#ffffff', '#ffe08a'];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('span');
    el.className = 'sky-star';
    el.style.left = `${rand(2, 98)}%`;
    el.style.top = `${rand(2, 95)}%`;
    el.style.setProperty('--s', `${rand(5, 13)}px`);
    el.style.setProperty('--c', SKY_COLORS[i % SKY_COLORS.length]);
    el.style.setProperty('--d', `${rand(2.5, 5.5)}s`);
    el.style.setProperty('--delay', `${rand(0, 5)}s`);
    el.innerHTML = SPARKLE;
    sky.appendChild(el);
  }

  /* Partículas de luz que suben lentamente */
  const particles = document.querySelector('.hero__particles');
  const PARTICLE_COLORS = ['rgba(255, 230, 160, .9)', 'rgba(190, 225, 255, .9)'];
  for (let i = 0; i < 26; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.style.left = `${rand(0, 100)}%`;
    el.style.setProperty('--s', `${rand(2, 4.5)}px`);
    el.style.setProperty('--c', PARTICLE_COLORS[i % 2]);
    el.style.setProperty('--x', `${rand(-60, 60)}px`);
    el.style.setProperty('--d', `${rand(10, 20)}s`);
    el.style.setProperty('--delay', `${rand(-20, 0)}s`);
    particles.appendChild(el);
  }
})();
