// Model picker: photo slideshow and a preview image that follows the cursor over the list.
(() => {
  document.documentElement.classList.add('ready');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = [...document.querySelectorAll('.slide')], dots = [...document.querySelectorAll('.dots i')];
  let i = 0;
  const show = n => { slides.forEach((s, k) => s.classList.toggle('on', k === n)); dots.forEach((d, k) => { d.classList.remove('on'); if (k === n) { void d.offsetWidth; d.classList.add('on'); } }); };
  show(0);
  if (!reduce && slides.length > 1) setInterval(() => { i = (i + 1) % slides.length; show(i); }, 6000);

  const fl = document.querySelector('.float'), fimg = fl.querySelector('img');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; });
  document.querySelectorAll('.rows a').forEach(a => {
    a.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse' || !a.dataset.img) return; fimg.src = a.dataset.img; fl.classList.add('on'); });
    a.addEventListener('pointerleave', () => fl.classList.remove('on'));
  });
  const loop = () => { cx += (x - cx) * .14; cy += (y - cy) * .14; fl.style.left = cx + 'px'; fl.style.top = cy + 'px'; requestAnimationFrame(loop); };
  loop();
})();
