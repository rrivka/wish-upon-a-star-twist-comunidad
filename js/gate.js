/*
 * Entrada: pantalla negra con el botón para entregar un deseo a las estrellas.
 * El toque habilita el sonido (los navegadores lo exigen) y, al aclararse
 * la oscuridad, empieza la pantalla de carga. loader.js espera a window.WishGate.
 */
window.WishGate = new Promise((resolve) => {
  const gate = document.querySelector('.gate');
  if (!gate) {
    resolve();
    return;
  }

  const btn = gate.querySelector('.gate__btn');
  const sky = gate.querySelector('.gate__sky');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const COLORS = ['#fff1bf', '#cfe9ff', '#ffffff', '#f3c94f'];

  // estrellitas lejanas apareciendo y desapareciendo en la oscuridad
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.className = 'gate__twinkle';
    s.style.left = `${rand(3, 97)}%`;
    s.style.top = `${rand(3, 97)}%`;
    s.style.setProperty('--s', `${rand(4, 11)}px`);
    s.style.setProperty('--c', COLORS[i % COLORS.length]);
    s.style.setProperty('--d', `${rand(3, 7)}s`);
    s.style.setProperty('--delay', `${rand(0, 6)}s`);
    s.innerHTML = '<svg><use href="#sparkle"/></svg>';
    sky.appendChild(s);
  }

  // los destellos del botón suben hacia el cielo
  const release = () => {
    if (reduced) return;
    const box = btn.getBoundingClientRect();
    const g = gate.getBoundingClientRect();
    const cx = box.left + box.width / 2 - g.left;
    const cy = box.top + box.height / 2 - g.top;
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('span');
      el.className = 'gate__spark';
      const size = rand(6, 16);
      el.style.width = el.style.height = `${size}px`;
      el.style.left = `${cx}px`;
      el.style.top = `${cy}px`;
      el.style.color = COLORS[i % COLORS.length];
      el.innerHTML = '<svg><use href="#sparkle"/></svg>';
      gate.appendChild(el);
      const x = rand(-box.width * 0.6, box.width * 0.6);
      const y = -rand(innerHeight * 0.3, innerHeight * 0.6);
      el.animate([
        { transform: 'translate(-50%, -50%) scale(.3)', opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1) rotate(${rand(90, 270)}deg)`, opacity: 0 },
      ], { duration: rand(1300, 2000), delay: rand(0, 250), easing: 'cubic-bezier(.2, .7, .3, 1)', fill: 'forwards' });
    }
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  btn.addEventListener('click', async () => {
    btn.disabled = true;

    // habilita el audio dentro del toque; no esperamos más de un instante
    await Promise.race([window.SFX?.unlock() ?? Promise.resolve(), wait(300)]).catch(() => {});
    window.SFX?.wish();

    gate.classList.add('is-sent');
    release();
    await wait(reduced ? 200 : 900);

    // la oscuridad se aclara y debajo empiezan a llegar las estrellas colgantes
    gate.classList.add('is-open');
    resolve();
    await wait(1500);
    gate.remove();
  }, { once: true });
});
