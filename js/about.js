(() => {
  const box = document.querySelector('.about__text');
  if (!box) return;

  const paragraphs = [...box.querySelectorAll('p')];
  let i = 0;

  paragraphs.forEach((p, n) => {
    let text = p.textContent.trim();
    p.textContent = '';

    // la letra capital va aparte para poder animarla
    if (n === 0 && text) {
      const cap = document.createElement('span');
      cap.className = 'dropcap';
      cap.textContent = text[0];
      p.appendChild(cap);
      text = text.slice(1);
    }

    // cada palabra en su propio span; los espacios quedan como texto normal
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        p.appendChild(document.createTextNode(' '));
        return;
      }
      const w = document.createElement('span');
      w.className = 'w';
      w.style.setProperty('--i', i++);
      w.textContent = part;
      p.appendChild(w);
    });
  });

  box.classList.add('has-js');

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      box.classList.add('is-revealed');
      io.disconnect();
    }
  }, { threshold: 0.3 });
  io.observe(box);
})();
