(() => {
  const check = document.getElementById('accept-rules');
  const frame = document.querySelector('.frame--square');
  if (!check || !frame) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#fff1bf', '#f3c94f', '#cfe9ff', '#ffffff'];

  // estallido de destellos desde el centro del QR
  const burst = () => {
    if (reduced) return;
    const N = 22;
    for (let i = 0; i < N; i++) {
      const el = document.createElement('span');
      el.className = 'qr-spark';
      const size = 8 + Math.random() * 14;
      el.style.width = el.style.height = `${size}px`;
      el.style.color = COLORS[i % COLORS.length];
      el.innerHTML = '<svg><use href="#sparkle"/></svg>';
      frame.appendChild(el);

      const angle = (i / N) * Math.PI * 2 + Math.random() * .4;
      const dist = 70 + Math.random() * 110;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      el.animate([
        { transform: 'translate(-50%, -50%) scale(.2) rotate(0deg)', opacity: 0 },
        { opacity: 1, offset: .2 },
        { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1) rotate(${180 + Math.random() * 180}deg)`, opacity: 0 },
      ], {
        duration: 1100 + Math.random() * 700,
        delay: Math.random() * 180,
        easing: 'cubic-bezier(.15, .8, .3, 1)',
        fill: 'forwards',
      }).finished.then(() => el.remove());
    }
  };

  check.addEventListener('change', () => {
    frame.classList.toggle('is-unveiled', check.checked);
    if (check.checked) {
      window.SFX?.reveal();
      burst();
      // reinicia el destello del marco
      frame.classList.remove('is-flash');
      void frame.offsetWidth;
      frame.classList.add('is-flash');
    } else {
      window.SFX?.veil();
    }
  });

  // el enlace "normas de convivencia" abre esa pestaña
  document.querySelector('.accept__link')?.addEventListener('click', () => {
    const tab = document.getElementById('tab-rules');
    tab.click();
    tab.focus();
  });
})();
