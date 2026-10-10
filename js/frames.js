(() => {
  /*
   * Cada marco es una foto circular (radio 80) con un aro dorado, una luna
   * creciente que abraza el aro por un lado, estrellas sobre la luna y
   * pendientes que cuelgan de su cuerno inferior, como la corona de referencia.
   * Coordenadas del SVG: centro de la foto en (0, 0); viewBox -125 -125 250 H
   * (H depende del largo de los pendientes).
   */
  const rad = (deg) => (deg * Math.PI) / 180;
  const pt = (deg, r) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];
  const f = (n) => n.toFixed(2);

  const PHOTO_R = 80;
  const HOLE_R = 90;       // la luna empieza justo por fuera del aro
  const MOON_R = 96;       // círculo exterior de la luna...
  const MOON_SHIFT = 16;   // ...desplazado hacia donde la luna es más gruesa

  const starUse = (x, y, s) =>
    `<use href="#star" x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${s}"/>`;
  const sparkleUse = (x, y, s, color = '#fff1bf') =>
    `<use href="#sparkle" x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${s}" style="color:${color}"/>`;

  // un pendiente: cadena de cuentas + gema + estrella (o destello) al final
  const pendant = ({ x, y, len, end, dur, delay }) => {
    const tip = end === 'star'
      ? starUse(0, len + 13, 22)
      : sparkleUse(0, len + 11, 16);
    return `
      <g transform="translate(${f(x)} ${f(y)})">
        <g class="pendant" style="--d:${dur}s; --delay:${delay}s">
          <line x1="0" y1="0" x2="0" y2="${len}" stroke="#c9a259" stroke-width=".8"/>
          <line x1="0" y1="2" x2="0" y2="${len}" stroke="#fff1bf" stroke-width="2.6"
                stroke-linecap="round" stroke-dasharray="0 6"/>
          <circle cy="${len + 2.5}" r="2.6" fill="url(#gold-grad)"/>
          <g class="pendant__tip">${tip}</g>
        </g>
      </g>`;
  };

  const build = (moonDeg, n) => {
    const [cx, cy] = pt(moonDeg, MOON_SHIFT);
    const [mx, my] = pt(moonDeg, MOON_SHIFT / 2);
    const id = `moon-${n}`;

    // estrellas sobre la luna: una grande en lo más grueso y destellos a los lados
    const [sx, sy] = pt(moonDeg, 104);
    let stars = starUse(sx, sy, 38);
    [[-24, 102, 15], [24, 102, 15], [-46, 100, 10], [46, 100, 10], [-66, 97, 7], [66, 97, 7]]
      .forEach(([off, r, s]) => {
        const [x, y] = pt(moonDeg + off, r);
        stars += sparkleUse(x, y, s);
      });

    // pendientes en los cuernos que quedan hacia abajo
    let pendants = '';
    let bottom = 112;   // borde inferior del dibujo; crece con los pendientes
    [moonDeg - 88, moonDeg + 88].forEach((horn, h) => {
      const [hx, hy] = pt(horn, 93);
      if (Math.sin(rad(horn)) < -0.1) return;      // este cuerno apunta hacia arriba
      const side = Math.cos(rad(horn)) < 0 ? -1 : 1; // se abren hacia afuera del aro
      const set = hy > 40
        ? [ // cuerno bajo (marcos laterales): tres pendientes
            { dx: -8, len: 40, end: 'sparkle' },
            { dx: 0,  len: 72, end: 'star' },
            { dx: 8,  len: 54, end: 'sparkle' },
          ]
        : [ // cuernos laterales (marco central): dos por lado
            { dx: 0,         len: 62, end: 'star' },
            { dx: side * 9,  len: 38, end: 'sparkle' },
          ];
      set.forEach((p, i) => {
        pendants += `<circle cx="${f(hx + p.dx)}" cy="${f(hy + Math.abs(p.dx) * .3)}" r="2.4" fill="url(#gold-grad)"/>`;
        pendants += pendant({
          x: hx + p.dx,
          y: hy + Math.abs(p.dx) * .3 + 2,
          len: p.len,
          end: p.end,
          dur: (2.4 + i * .45 + h * .2).toFixed(2),
          delay: (-(i * .7 + h * .5)).toFixed(2),
        });
        bottom = Math.max(bottom, hy + Math.abs(p.dx) * .3 + 2 + p.len + 24);
      });
      // remate del cuerno
      pendants += `<circle cx="${f(hx)}" cy="${f(hy)}" r="3.6" fill="url(#gold-grad)" stroke="#fff1bf" stroke-width=".8"/>`;
    });

    // alto del viewBox justo hasta el último pendiente (sin espacio vacío debajo)
    const H = Math.ceil(bottom + 125);
    const svg = `
      <svg class="frame__ornament" viewBox="-125 -125 250 ${H}" aria-hidden="true">
        <defs>
          <mask id="${id}" maskUnits="userSpaceOnUse" x="-125" y="-125" width="250" height="${H}">
            <circle cx="${f(cx)}" cy="${f(cy)}" r="${MOON_R}" fill="#fff"/>
            <circle r="${HOLE_R}" fill="#000"/>
          </mask>
        </defs>

        <!-- aro de la foto -->
        <circle r="${PHOTO_R + 4}" fill="none" stroke="url(#gold-grad)" stroke-width="6"/>
        <circle r="${PHOTO_R + .5}" fill="none" stroke="#fff1bf" stroke-width="1" opacity=".8"/>
        <circle r="${PHOTO_R + 9}" fill="none" stroke="#fff1bf" stroke-width="2.4"
                stroke-linecap="round" stroke-dasharray="0 6.5" opacity=".9"/>

        <!-- luna creciente que abraza el aro -->
        <g mask="url(#${id})">
          <circle cx="${f(cx)}" cy="${f(cy)}" r="${MOON_R}" fill="url(#gold-grad)"/>
          <circle cx="${f(cx)}" cy="${f(cy)}" r="${MOON_R - .6}" fill="none" stroke="#9a6418" stroke-width="1.2"/>
          <circle r="${HOLE_R + 1.2}" fill="none" stroke="#fff6d6" stroke-width="1.6"/>
          <circle cx="${f(mx)}" cy="${f(my)}" r="${MOON_R - 3}" fill="none" stroke="#fff3c8"
                  stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0 7"/>
        </g>

        ${stars}
        ${pendants}
      </svg>`;
    return [svg, H];
  };

  /*
   * Marco cuadrado (para el QR): mismo lenguaje que los circulares.
   * Luna creciente como cuna arriba, estrellas en las esquinas y
   * pendientes colgando de las esquinas inferiores.
   * Coordenadas: área interior de -80 a 80; viewBox -130 -140 260 340.
   */
  const buildSquare = (n) => {
    const id = `cradle-${n}`;
    const IN = 80;

    let sparkles = '';
    [[-30, 11], [30, 11], [-56, 8], [56, 8]].forEach(([x, s]) => {
      sparkles += sparkleUse(x, -95, s);
    });

    let pendants = '';
    [-1, 1].forEach((side, h) => {
      const ax = side * 89;
      const ay = 100;
      [
        { dx: -6, len: 38, end: 'sparkle' },
        { dx: 0,  len: 64, end: 'star' },
        { dx: 6,  len: 48, end: 'sparkle' },
      ].forEach((p, i) => {
        pendants += pendant({
          x: ax + p.dx,
          y: ay + Math.abs(p.dx) * .3,
          len: p.len,
          end: p.end,
          dur: (2.4 + i * .45 + h * .2).toFixed(2),
          delay: (-(i * .7 + h * .5)).toFixed(2),
        });
      });
    });
    pendants += pendant({ x: 0, y: 95, len: 26, end: 'star', dur: '2.9', delay: '-1.1' });

    return `
      <svg class="frame__ornament" viewBox="-130 -140 260 340" aria-hidden="true">
        <defs>
          <mask id="${id}" maskUnits="userSpaceOnUse" x="-130" y="-140" width="260" height="340">
            <circle cx="0" cy="-108" r="24" fill="#fff"/>
            <circle cx="0" cy="-116" r="22" fill="#000"/>
          </mask>
        </defs>

        <!-- marco -->
        <rect x="${-IN - 4}" y="${-IN - 4}" width="${(IN + 4) * 2}" height="${(IN + 4) * 2}" rx="6"
              fill="none" stroke="url(#gold-grad)" stroke-width="6"/>
        <rect x="${-IN - .5}" y="${-IN - .5}" width="${(IN + .5) * 2}" height="${(IN + .5) * 2}" rx="3"
              fill="none" stroke="#fff1bf" stroke-width="1" opacity=".8"/>
        <rect x="-95" y="-95" width="190" height="190" rx="10" fill="none" stroke="#fff1bf"
              stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0 6.5" opacity=".9"/>

        <!-- luna creciente como cuna sobre el borde superior -->
        <g mask="url(#${id})">
          <circle cx="0" cy="-108" r="24" fill="url(#gold-grad)"/>
          <circle cx="0" cy="-108" r="23.4" fill="none" stroke="#9a6418" stroke-width="1.2"/>
          <circle cx="0" cy="-116" r="23.2" fill="none" stroke="#fff6d6" stroke-width="1.6"/>
          <circle cx="0" cy="-112" r="23" fill="none" stroke="#fff3c8" stroke-width="2"
                  stroke-linecap="round" stroke-dasharray="0 6"/>
        </g>
        ${starUse(0, -113, 30)}
        ${sparkles}

        <!-- estrellas en las esquinas -->
        ${starUse(-89, -89, 26)}${starUse(89, -89, 26)}
        ${starUse(-89, 89, 26)}${starUse(89, 89, 26)}

        ${pendants}
      </svg>`;
  };

  document.querySelectorAll('.frame').forEach((frame, n) => {
    if (frame.classList.contains('frame--square')) {
      frame.insertAdjacentHTML('beforeend', buildSquare(n));
      return;
    }
    const [svg, H] = build(Number(frame.dataset.moon) || -90, n);
    frame.style.setProperty('--vb-h', H);   // el CSS ajusta proporción y posición de la foto
    frame.insertAdjacentHTML('beforeend', svg);
  });

  // aparecen suavemente al entrar en pantalla
  document.querySelector('.frames').classList.add('has-js');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.admin').forEach((el) => io.observe(el));
})();
