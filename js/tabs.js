(() => {
  // pestañas accesibles: clic, flechas izquierda/derecha, Inicio y Fin
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];

    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      list.dispatchEvent(new CustomEvent('tabchange', { detail: { index: tabs.indexOf(tab) } }));
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        if (tab.getAttribute('aria-selected') !== 'true') window.SFX?.tab(i);
        select(tab);
      });
      tab.addEventListener('keydown', (e) => {
        const next = {
          ArrowRight: tabs[(i + 1) % tabs.length],
          ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length],
          Home: tabs[0],
          End: tabs[tabs.length - 1],
        }[e.key];
        if (next) {
          e.preventDefault();
          window.SFX?.tab(tabs.indexOf(next));
          select(next, true);
        }
      });
    });
  });
})();
