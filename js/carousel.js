(() => {
  // carruseles de tarjetas con flechas, contador y deslizamiento con el dedo.
  // Es independiente de las pestañas: no mueve las estatuas.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OFFSET = 48; // px que se desplaza la tarjeta al entrar/salir

  document.querySelectorAll('.carousel').forEach((root) => {
    const slides = [...root.querySelectorAll('.slide')];
    const current = root.querySelector('.carousel__current');
    let index = 0;

    const sync = () => {
      slides.forEach((s, i) => s.setAttribute('aria-hidden', i !== index));
      current.textContent = index + 1;
    };

    const go = (step) => {
      const next = (index + step + slides.length) % slides.length;
      if (next === index) return;
      window.SFX?.swipe(step);
      const out = slides[index];
      const inn = slides[next];

      if (!reduced) {
        // la nueva tarjeta entra desde el lado hacia donde se avanza
        inn.style.transition = 'none';
        inn.style.translate = `${step * OFFSET}px 0`;
        void inn.offsetWidth;
        inn.style.transition = '';
        inn.style.translate = '0 0';
        out.style.translate = `${-step * OFFSET}px 0`;
      }

      out.classList.remove('is-active');
      inn.classList.add('is-active');
      index = next;
      sync();

      // pequeño destello en el contador
      current.classList.remove('is-bump');
      void current.offsetWidth;
      current.classList.add('is-bump');
    };

    root.querySelectorAll('.carousel__arrow').forEach((btn) => {
      btn.addEventListener('click', () => go(Number(btn.dataset.step)));
    });

    // deslizar con el dedo en teléfonos
    let startX = null;
    let startY = null;
    const track = root.querySelector('.carousel__track');
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      startX = null;
    });

    // flechas del teclado cuando el foco está dentro del carrusel
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });

    sync();
  });
})();
