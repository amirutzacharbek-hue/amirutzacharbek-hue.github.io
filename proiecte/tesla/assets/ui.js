// Page effects for the Tesla concept pages: smooth scroll, reveals, pinned gallery, counters, lightbox.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // the fixed header sits right under the disclaimer, which wraps to two lines on phones
  const disc = document.querySelector('.disclaimer');
  const setDh = () => disc && document.documentElement.style.setProperty('--dh', disc.offsetHeight + 'px');
  setDh(); addEventListener('resize', setDh);
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 2.2 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  const hdr = document.getElementById('hdr');
  const onScroll = () => hdr.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // split headings into words for a masked reveal
  document.querySelectorAll('.words').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w"><i style="--i:${i}">${w}</i></span>`).join(' ');
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .25 });
  const startReveals = () => document.querySelectorAll('.rv, .words').forEach(el => io.observe(el));
  if (document.documentElement.classList.contains('ready')) startReveals();
  else new MutationObserver((_, o) => { if (document.documentElement.classList.contains('ready')) { o.disconnect(); startReveals(); } }).observe(document.documentElement, { attributes: true });
  setTimeout(startReveals, 6000); // in case WebGL is unavailable

  // counters
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const el = e.target, to = +el.dataset.to, dec = +(el.dataset.dec || 0), t0 = performance.now();
    const fmt = v => dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
    const st = t => { const q = Math.min(1, (t - t0) / 1600); el.textContent = fmt(to * (1 - Math.pow(1 - q, 3))) + (el.dataset.suf || ''); if (q < 1) requestAnimationFrame(st); };
    requestAnimationFrame(st); cio.unobserve(el);
  }), { threshold: .5 });
  document.querySelectorAll('[data-to]').forEach(el => cio.observe(el));

  // scroll-linked effects
  const gal = document.querySelector('.gallery'), track = gal && gal.querySelector('.track'), bar = gal && gal.querySelector('.progress i'), cnt = gal && gal.querySelector('.count b');
  const shots = track ? [...track.children] : [];
  const rev = document.querySelector('.reveal');
  const duo = [...document.querySelectorAll('.duo img')];
  function fit() {
    if (!gal) return;
    const extra = Math.max(0, track.scrollWidth - innerWidth);
    gal.style.height = (innerHeight + extra) + 'px';
  }
  function tick() {
    if (gal) {
      const r = gal.getBoundingClientRect(), span = r.height - innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      const extra = Math.max(0, track.scrollWidth - innerWidth);
      track.style.transform = `translate3d(${-p * extra}px,0,0)`;
      if (bar) bar.style.width = (p * 100) + '%';
      if (cnt) cnt.textContent = String(Math.min(shots.length, 1 + Math.round(p * (shots.length - 1)))).padStart(2, '0');
      shots.forEach(s => { const sr = s.getBoundingClientRect(), c = (sr.left + sr.width / 2) / innerWidth - .5; const img = s.querySelector('img'); if (img) img.style.transform = `scale(1.18) translateX(${c * -6}%)`; });
    }
    if (rev) {
      const r = rev.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .95)));
      const e = 1 - Math.pow(1 - p, 2);
      rev.style.setProperty('--ci', (18 * (1 - e)).toFixed(2) + '%');
      rev.style.setProperty('--cx', (22 * (1 - e)).toFixed(2) + '%');
      rev.style.setProperty('--sc', (1.25 - .25 * e).toFixed(3));
    }
    duo.forEach((img, i) => { const r = img.parentElement.getBoundingClientRect(); const c = (r.top + r.height / 2) / innerHeight - .5; img.style.setProperty('--py', (-8 + c * (i ? 10 : 7)).toFixed(2) + '%'); });
    requestAnimationFrame(tick);
  }
  addEventListener('resize', fit); addEventListener('load', fit); fit();
  if (!reduce) requestAnimationFrame(tick);
  else if (rev) { rev.style.setProperty('--ci', '0%'); rev.style.setProperty('--cx', '0%'); rev.style.setProperty('--sc', '1'); }

  // interior tour: real photos with hotspots; plays by itself until the visitor takes over
  document.querySelectorAll('.tour').forEach(tour => {
    const views = [...tour.querySelectorAll('.tview')], tabs = [...tour.querySelectorAll('.ttabs button')], lists = [...tour.querySelectorAll('.tlist')];
    const tip = tour.querySelector('.tip'), full = tour.querySelector('.tfull'), cred = tour.querySelector('.tcred'), count = tour.querySelector('.tcount'), prog = tour.querySelector('.tprog');
    const narrow = matchMedia('(max-width: 820px)');
    let v = 0, a = -1, auto = !reduce, inView = false, t0 = 0;
    const STEP = 4200;
    const pins = () => [...views[v].querySelectorAll('.hs')];
    const items = () => [...lists[v].querySelectorAll('button')];
    function setView(i) {
      v = i;
      views.forEach((f, k) => f.classList.toggle('on', k === i));
      lists.forEach((l, k) => l.classList.toggle('on', k === i));
      tabs.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
      full.dataset.full = views[i].dataset.src; full.dataset.cap = views[i].dataset.cap;
      cred.textContent = views[i].dataset.credit;
      setPin(0);
    }
    function setPin(j) {
      const ps = pins(), its = items(), n = ps.length;
      a = (j + n) % n;
      ps.forEach((p, k) => p.classList.toggle('on', k === a));
      its.forEach((b, k) => { b.classList.toggle('on', k === a); b.setAttribute('aria-current', String(k === a)); });
      count.textContent = String(a + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      const p = ps[a], x = parseFloat(p.style.getPropertyValue('--x')), y = parseFloat(p.style.getPropertyValue('--y'));
      const z = views[v].querySelector('.tz');
      z.style.setProperty('--ox', x + '%'); z.style.setProperty('--oy', y + '%'); z.style.setProperty('--s', reduce ? 1 : 1.14);
      // the tip sits next to the pin, measured in stage pixels
      const st = tour.querySelector('.tstage'), sr = { width: st.clientWidth, height: st.clientHeight }, zw = z.offsetWidth, zh = z.offsetHeight;
      const px = (sr.width - zw) / 2 + zw * x / 100, py = (sr.height - zh) / 2 + zh * y / 100;
      tip.style.left = px + 'px'; tip.style.top = py + 'px';
      tip.classList.toggle('l', px / sr.width > .55); tip.classList.toggle('u', py / sr.height > .72); tip.classList.toggle('d', py / sr.height < .2);
      tip.querySelector('strong').textContent = its[a].querySelector('strong').textContent;
      tip.querySelector('span').textContent = its[a].querySelector('em').textContent;
      tip.classList.add('on');
      const ol = lists[v], li = its[a];
      if (ol.scrollHeight > ol.clientHeight) ol.scrollTo({ top: li.offsetTop - ol.offsetTop - 40, behavior: 'smooth' });
      t0 = performance.now();
    }
    const stop = () => { auto = false; prog.style.transform = 'scaleX(0)'; };
    views.forEach(f => f.querySelectorAll('.hs').forEach(p => p.addEventListener('click', () => { stop(); setPin(+p.dataset.i); })));
    lists.forEach(l => l.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { stop(); setPin(+b.dataset.i); if (narrow.matches) tour.querySelector('.tstage').scrollIntoView({ behavior: 'smooth', block: 'center' }); })));
    tabs.forEach((b, k) => b.addEventListener('click', () => { stop(); setView(k); }));
    tour.querySelector('.tprev').addEventListener('click', () => { stop(); setPin(a - 1); });
    tour.querySelector('.tnext').addEventListener('click', () => { stop(); setPin(a + 1); });
    tour.querySelector('.tstage').addEventListener('keydown', e => { if (e.key === 'ArrowRight') { stop(); setPin(a + 1); } if (e.key === 'ArrowLeft') { stop(); setPin(a - 1); } });
    addEventListener('resize', () => setPin(a));
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) t0 = performance.now(); }, { threshold: .45 }).observe(tour.querySelector('.tstage'));
    (function loop(now) {
      if (auto && inView) {
        const k = (now - t0) / STEP;
        prog.style.transform = `scaleX(${Math.min(1, k)})`;
        if (k >= 1) { if (a + 1 >= pins().length) setView((v + 1) % views.length); else setPin(a + 1); }
      }
      requestAnimationFrame(loop);
    })(performance.now());
    setView(0);
  });

  // lightbox with the full 4K photo
  const lb = document.getElementById('lb');
  if (lb) {
    const img = lb.querySelector('img'), cap = lb.querySelector('p'), close = lb.querySelector('button');
    let last = null;
    document.querySelectorAll('[data-full]').forEach(f => {
      f.tabIndex = 0; f.setAttribute('role', 'button');
      const open = () => { last = f; img.src = f.dataset.full; img.alt = f.querySelector('img')?.alt || ''; cap.textContent = f.dataset.cap || ''; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lenis?.stop(); close.focus(); };
      f.addEventListener('click', open); f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    const shut = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lenis?.start(); last?.focus(); };
    close.addEventListener('click', shut); lb.addEventListener('click', e => { if (e.target === lb) shut(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) shut(); });
  }
})();
