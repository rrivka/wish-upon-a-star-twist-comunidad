(() => {
  const loader = document.querySelector('.loader');
  if (!loader) return;

  const MIN_TIME = 2000;   // la pantalla de carga dura al menos 2 s
  const MAX_WAIT = 5000;   // pero nunca espera más de esto a que cargue todo
  const LIGHT_UP = 650;    // tiempo que las estrellas brillan antes de elevarse
  const EXIT = 1400;       // duración de la subida + fundido

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const sfx = window.SFX;
  const pageLoaded = new Promise((r) => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r, { once: true });
  });

  // la carga empieza cuando la persona entrega su deseo en la pantalla de entrada
  const start = () => {
    loader.classList.remove('is-waiting');
    // tintineos de cristal mientras las estrellas entran colgando
    sfx?.loaderEnter(loader.querySelectorAll('.hanger').length);

    Promise.all([wait(MIN_TIME), Promise.race([pageLoaded, wait(MAX_WAIT)])])
      .then(() => {
        loader.classList.add('is-lit');
        sfx?.lightUp();
        return wait(LIGHT_UP);
      })
      .then(() => {
        loader.classList.add('is-leaving');
        document.body.classList.remove('is-loading');
        sfx?.rise();
        setTimeout(() => sfx?.headerOpen(), 450);   // estrellas suaves al aparecer el header
        return wait(EXIT);
      })
      .then(() => loader.remove());
  };

  (window.WishGate || Promise.resolve()).then(start);
})();
