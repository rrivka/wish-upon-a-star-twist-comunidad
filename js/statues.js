(() => {
  const wrap = document.querySelector('.statues');
  const tablist = document.querySelector('.extras [role="tablist"]');
  if (!wrap || !tablist) return;

  const track = wrap.querySelector('.statues__track');
  const statues = [...track.querySelectorAll('.statue')];
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const STAGGER = 0.06; // segundos entre una estatua y la siguiente

  let index = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));

  // posición de la fila para cada pestaña, repartida de izquierda a derecha:
  // Normas muestra el extremo izquierdo, Prerrequisitos el centro y Contáctanos el derecho
  const shiftFor = (i) => {
    const t = tabs.length > 1 ? i / (tabs.length - 1) : 0;
    const over = track.scrollWidth - wrap.clientWidth;
    if (over > 0) return -over * t;
    const center = -over / 2;           // la fila cabe entera: se centra y oscila un poco
    return center + 60 - 120 * t;
  };

  const apply = () => track.style.setProperty('--shift', `${shiftFor(index)}px`);

  const go = (next) => {
    if (next === index) return;
    const dir = next > index ? 'left' : 'right';
    index = next;

    // la estatua que va al frente del movimiento arranca primero
    statues.forEach((s, i) => {
      const order = dir === 'left' ? i : statues.length - 1 - i;
      s.style.setProperty('--delay', `${(order * STAGGER).toFixed(2)}s`);
    });

    // reinicia la animación de balanceo
    wrap.dataset.dir = '';
    void wrap.offsetWidth;
    wrap.dataset.dir = dir;

    apply();
  };

  // posición inicial sin animación
  wrap.classList.add('no-anim');
  apply();
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('no-anim')));

  tablist.addEventListener('tabchange', (e) => go(e.detail.index));

  new ResizeObserver(() => {
    wrap.classList.add('no-anim');
    apply();
    requestAnimationFrame(() => wrap.classList.remove('no-anim'));
  }).observe(wrap);
})();
