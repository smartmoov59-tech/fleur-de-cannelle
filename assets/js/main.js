/* ==========================================================================
   Fleur de cannelle · Floralova — interactions & animations
   GSAP + ScrollTrigger + Lenis (fichiers locaux, aucun CDN, aucun back-end)
   ========================================================================== */
(() => {
  'use strict';

  const C = window.FC_CONFIG || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const animate = hasGsap && !reduce;
  const root = document.documentElement;
  const pad = (n) => String(n).padStart(2, '0');
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const hLabel = (s) => s.replace(':', 'h');
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let lenis = null;
  if (animate && !location.hash) {
    // le loader et les sections épinglées démarrent toujours depuis le haut de page
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }
  if (animate) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    root.classList.add('anim');
  }

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */
  function split(el) {
    const chars = [];
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    if (/^H[1-6]$/.test(el.tagName)) el.setAttribute('aria-label', label);
    const holder = document.createDocumentFragment();
    const walk = (node, target) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { target.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            Array.from(p).forEach((ch) => {
              const c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
              w.appendChild(c); chars.push(c);
            });
            target.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          const clone = n.cloneNode(false); target.appendChild(clone); walk(n, clone);
        }
      });
    };
    walk(el, holder);
    el.textContent = ''; el.appendChild(holder);
    return chars;
  }

  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('is-on'), 4200);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select(); let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove(); return ok;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Décors dessinés en SVG (branches, pampa, pétales)                   */
  /* ------------------------------------------------------------------ */
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  };
  const quad = (a, b, c, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; };
  const dquad = (a, b, c, t) => [2 * (1 - t) * (b[0] - a[0]) + 2 * t * (c[0] - b[0]), 2 * (1 - t) * (b[1] - a[1]) + 2 * t * (c[1] - b[1])];

  function drawEucalyptus(host) {
    const svg = svgEl('svg', { viewBox: '0 0 420 900', 'aria-hidden': 'true' }, host);
    const P0 = [70, 900], P1 = [90, 430], P2 = [290, 40];
    svgEl('path', { d: `M${P0} Q${P1} ${P2}`, fill: 'none', stroke: '#5b7565', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
    const greens = ['#8aa391', '#7d9782', '#9bb1a0', '#6f8a78'];
    const N = 15;
    for (let i = 0; i < N; i++) {
      const t = 0.08 + 0.9 * i / (N - 1);
      const [x, y] = quad(P0, P1, P2, t); const [dx, dy] = dquad(P0, P1, P2, t);
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const side = i % 2 ? 1 : -1;
      const len = 84 - 46 * t + (i % 3) * 7, wid = len * 0.74;
      const g = svgEl('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang + side * (54 - 12 * t)).toFixed(1)})` }, svg);
      svgEl('ellipse', { cx: len / 2, cy: 0, rx: len / 2, ry: wid / 2, fill: greens[i % greens.length], opacity: 0.95 }, g);
      svgEl('path', { d: `M2 0 H${len - 8}`, stroke: '#5b7565', 'stroke-width': 1.2, opacity: 0.45 }, g);
    }
    svgEl('ellipse', { cx: P2[0] + 6, cy: P2[1] - 14, rx: 14, ry: 26, fill: greens[0], transform: `rotate(24 ${P2[0]} ${P2[1]})` }, svg);
  }

  function drawPampas(host) {
    const svg = svgEl('svg', { viewBox: '0 0 400 900', 'aria-hidden': 'true' }, host);
    const stems = [
      [[330, 900], [300, 520], [190, 150]], [[345, 900], [370, 450], [320, 70]],
      [[315, 900], [240, 620], [105, 260]], [[352, 900], [335, 640], [385, 320]]
    ];
    stems.forEach((s) => {
      svgEl('path', { d: `M${s[0]} Q${s[1]} ${s[2]}`, fill: 'none', stroke: '#b99560', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg);
      for (let k = 0; k < 9; k++) {
        const t = 1 - k * 0.026;
        const [x, y] = quad(s[0], s[1], s[2], t); const [dx, dy] = dquad(s[0], s[1], s[2], t);
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        [-1, 1].forEach((side) => {
          svgEl('ellipse', { cx: 0, cy: 0, rx: 5 + (9 - k) * 0.5, ry: 24 - k * 1.6, fill: k % 2 ? '#e9d3b6' : '#f3e3d0', opacity: 0.88, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang + 90 + side * 28).toFixed(1)}) translate(0 ${-(10 + (9 - k))})` }, svg);
        });
      }
    });
    [[120, 330], [150, 285], [88, 292]].forEach(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 7, fill: '#a4532f' }, svg));
    svgEl('path', { d: 'M105 260 Q120 290 110 330', stroke: '#8f6a3d', fill: 'none', 'stroke-width': 1.6 }, svg);
  }

  function makePetals(host, n, min, max, drift) {
    const colors = ['#f2d3cb', '#e3a29c', '#fbf4ec', '#c9a66b'];
    const tl = gsap.timeline({ paused: false });
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'fp';
      const s = gsap.utils.random(min, max);
      el.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;color:${gsap.utils.random(colors)};opacity:${gsap.utils.random(0.4, 0.95).toFixed(2)};${s > max * 0.7 ? `filter:blur(${gsap.utils.random(1, 3).toFixed(1)}px)` : ''}`;
      el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-petal"/></svg>';
      host.appendChild(el);
      gsap.set(el, { rotate: gsap.utils.random(0, 360) });
      tl.to(el, { y: gsap.utils.random(-drift, drift), x: gsap.utils.random(-drift, drift), rotate: `+=${gsap.utils.random(-200, 200)}`, duration: gsap.utils.random(7, 14), ease: 'sine.inOut', repeat: -1, yoyo: true }, 0);
    }
    ScrollTrigger.create({ trigger: host, start: 'top bottom', end: 'bottom top', onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) });
    return tl;
  }

  /* ------------------------------------------------------------------ */
  /* Lenis (défilement doux) + ancres                                    */
  /* ------------------------------------------------------------------ */
  function initLenis() {
    if (!animate || typeof Lenis === 'undefined') return;
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(id) {
    if (id === '#haut') { lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    const el = $(id); if (!el) return;
    const pin = animate && ScrollTrigger.getById(id.slice(1));
    if (pin) { const y = pin.start; lenis ? lenis.scrollTo(y, { duration: 1.8 }) : window.scrollTo({ top: y }); return; }
    if (lenis) lenis.scrollTo(el, { duration: 1.8, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (!id || id.length < 2) return;
      if (id !== '#haut' && !$(id)) return;
      e.preventDefault(); closeMenu(true);
      const occ = a.dataset.occasion;
      if (occ) setOccasion(occ);
      setTimeout(() => scrollToTarget(id), $('#menu').classList.contains('is-open') ? 500 : 0);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Loader + entrée du hero                                             */
  /* ------------------------------------------------------------------ */
  let heroChars = [];

  function runLoader() {
    const loader = $('#loader'); const num = $('#loaderNum'); const nav = $('#nav');
    const video = $('#heroVideo');
    if (!animate) {
      loader.classList.add('is-done');
      if (video && reduce) { video.removeAttribute('autoplay'); video.pause(); }
      return;
    }
    nav.classList.add('is-hidden');
    lenis && lenis.stop();
    heroChars = $$('.hero__title .line').flatMap((l) => split(l));
    gsap.set(heroChars, { yPercent: 120, rotate: 5 });
    gsap.set('#heroMedia', { scale: 1.4, clipPath: 'circle(0% at 50% 64%)' });
    gsap.set(['[data-hero="kicker"]', '[data-hero="tag"]', '[data-hero="cta"] .btn', '[data-hero="badge"]', '.scrollcue', '.hero__leaf'], { opacity: 0 });

    const petals = $$('.loader__flower path, .loader__flower circle');
    const st = { v: 0 };
    const tl = gsap.timeline();
    tl.to(petals, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.08 }, 0)
      .fromTo('.loader__name', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out' }, 0.5)
      .fromTo('.loader__tag', { opacity: 0 }, { opacity: 0.85, duration: 0.8 }, 0.9)
      .to(st, { v: 100, duration: 2, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(st.v); } }, 0);

    const mediaReady = new Promise((res) => {
      if (!video || video.readyState >= 3) return res();
      const t = setTimeout(res, 3500);
      video.addEventListener('canplay', () => { clearTimeout(t); res(); }, { once: true });
      video.addEventListener('error', () => { clearTimeout(t); res(); }, { once: true });
    });
    const done = new Promise((res) => tl.eventCallback('onComplete', res));
    Promise.all([done, mediaReady, document.fonts ? document.fonts.ready : null]).then(exitLoader);

    function exitLoader() {
      const ex = gsap.timeline({ onComplete: () => { loader.classList.add('is-done'); lenis && lenis.start(); ScrollTrigger.refresh(); } });
      ex.to('.loader__center', { yPercent: -25, opacity: 0, duration: 0.6, ease: 'power3.in' }, 0)
        .to('.loader__count', { opacity: 0, duration: 0.4 }, 0)
        .to(loader, { yPercent: -106, duration: 1.25, ease: 'expo.inOut' }, 0.3)
        .add(heroIntro, 0.5);
    }
  }

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('#heroMedia', { scale: 1, duration: 2.6, ease: 'power3.out' }, 0)
      .to('#heroMedia', { clipPath: 'circle(90% at 50% 64%)', duration: 1.9, ease: 'power3.inOut', onComplete: () => gsap.set('#heroMedia', { clearProps: 'clipPath' }) }, 0)
      .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.04 }, 0.35)
      .fromTo('[data-hero="kicker"]', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1.1 }, 0.7)
      .fromTo('[data-hero="tag"]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.95)
      .fromTo('[data-hero="cta"] .btn', { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 }, 1.1)
      .fromTo('[data-hero="badge"]', { opacity: 0, scale: 0.2, rotate: -120 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.6, ease: 'elastic.out(1,.65)' }, 1.2)
      .fromTo('.hero__leaf', { opacity: 0, yPercent: 24 }, { opacity: 1, yPercent: 0, duration: 2, stagger: 0.2 }, 0.6)
      .to('.scrollcue', { opacity: 0.85, duration: 1 }, 1.8)
      .add(() => $('#nav').classList.remove('is-hidden'), 1.3);
  }

  /* ------------------------------------------------------------------ */
  /* Hero : parallax multicouche                                         */
  /* ------------------------------------------------------------------ */
  function initHero() {
    drawEucalyptus($('.hero__leaf--l'));
    drawPampas($('.hero__leaf--r'));
    if (!animate) return;
    const trg = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('#heroMedia', { yPercent: 14, ease: 'none', scrollTrigger: trg });
    $$('.hero [data-depth]').forEach((el, i) => {
      const d = parseFloat(el.dataset.depth);
      gsap.to(el, { y: () => -innerHeight * d * 0.9, rotate: el.classList.contains('hero__leaf') ? (i % 2 ? 6 : -6) : 0, ease: 'none', scrollTrigger: trg });
    });
    gsap.to('.hero__shade', { opacity: 1.0, ease: 'none', scrollTrigger: trg });
    const mobile = innerWidth < 760;
    makePetals($('#heroPetals'), mobile ? 7 : 14, 14, 44, 70);
    const v = $('#heroVideo');
    if (v) ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => { if (s.isActive) { v.play().catch(() => {}); } else { v.pause(); } } });
  }

  /* ------------------------------------------------------------------ */
  /* Marquee réactif au scroll                                           */
  /* ------------------------------------------------------------------ */
  function initMarquee() {
    if (!animate) return;
    const rows = $$('.marquee__row').map((el) => {
      const g = el.firstElementChild; const w = g.offsetWidth || 1;
      const copies = Math.ceil((innerWidth * 1.4) / w) + 1;
      for (let i = 0; i < copies; i++) el.appendChild(g.cloneNode(true));
      return { el, w, dir: parseFloat(el.dataset.dir) || -1, x: 0 };
    });
    const measure = () => rows.forEach((r) => { r.w = r.el.firstElementChild.offsetWidth || r.w; });
    if (document.fonts) document.fonts.ready.then(measure);
    addEventListener('resize', measure);
    let flip = 1;
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      const target = v < -0.3 ? -1 : 1; flip += (target - flip) * 0.06;
      const boost = clamp(Math.abs(v) * 0.5, 0, 22);
      rows.forEach((r) => {
        r.x += r.dir * flip * (0.7 + boost);
        if (r.x <= -r.w) r.x += r.w; if (r.x > 0) r.x -= r.w;
        r.el.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0)`;
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* L'atelier : section pinnée                                          */
  /* ------------------------------------------------------------------ */
  function initStory() {
    if (!animate) { const v = $('#atelierVideo'); if (v) v.removeAttribute('autoplay'); return; }
    const steps = $$('.step'); const frames = $$('.story__right .frame');
    const video = $('#atelierVideo'); const rail = $('.story__rail b'); const count = $('#storyCount');
    const T = 1.5;
    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'atelier', trigger: '.story', start: 'top top', end: () => '+=' + Math.round(innerHeight * 4.4), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = clamp(Math.floor(self.progress * 4 * 0.999), 0, 3);
          count.textContent = `${pad(idx + 1)} / 04`;
          gsap.set(rail, { scaleX: self.progress });
          if (video) { const on = idx === 2; if (on && video.paused) video.play().catch(() => {}); if (!on && !video.paused) video.pause(); }
        }
      }
    });
    gsap.set(steps.slice(1), { opacity: 0, y: 50 });
    for (let i = 1; i < 4; i++) {
      const at = i * T;
      tl.to(steps[i - 1], { opacity: 0, y: -50, duration: 0.55, ease: 'power2.in' }, at - 0.15)
        .to(steps[i], { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, at + 0.15)
        .fromTo(frames[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.inOut' }, at - 0.15)
        .fromTo(frames[i].querySelector('img,video'), { scale: 1.35 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, at - 0.15)
        .to(frames[i - 1].querySelector('img,video'), { scale: 1.12, duration: 1, ease: 'none' }, at - 0.15);
    }
    tl.to({}, { duration: 0.8 });
    frames.forEach((f) => { const m = f.querySelector('img,video'); tl.fromTo(m, { yPercent: 3 }, { yPercent: -3, ease: 'none', duration: tl.duration() }, 0); });
  }

  /* ------------------------------------------------------------------ */
  /* Créations : défilement horizontal                                   */
  /* ------------------------------------------------------------------ */
  function initCrea() {
    if (!animate) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 821px)', () => {
      const track = $('#creaTrack');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { id: 'creations', trigger: '.crea', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.9, invalidateOnRefresh: true, anticipatePin: 1 } });
      $$('.card').forEach((card) => {
        gsap.fromTo(card.querySelector('.card__img img'), { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        gsap.fromTo(card, { opacity: 0.001 }, { opacity: 1, ease: 'power2.out', duration: 1, scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 96%', toggleActions: 'play none none none' } });
        gsap.fromTo(card.querySelector('.card__body'), { y: 50 }, { y: 0, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 90%', toggleActions: 'play none none none' } });
      });
    });
    mm.add('(max-width: 820px)', () => {
      $$('.card, .crea__intro, .crea__end').forEach((el) => gsap.set(el, { clearProps: 'all' }));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Titres, révélations, compteurs                                      */
  /* ------------------------------------------------------------------ */
  function initReveals() {
    if (!animate) return;
    $$('[data-split]').forEach((el) => {
      if (el.closest('.hero')) return;
      const chars = split(el);
      gsap.set(chars, { yPercent: 118, rotate: 4 });
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(chars, { yPercent: 0, rotate: 0, duration: 1.15, ease: 'expo.out', stagger: { each: 0.022 } }) });
    });
    $$('[data-reveal]').forEach((el, i) => {
      gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, delay: (i % 4) * 0.08 });
    });
    $$('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count); const dec = parseInt(el.dataset.decimals || '0', 10); const o = { v: 0 };
      const fmt = (v) => v.toFixed(dec).replace('.', ',');
      el.textContent = fmt(0);
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2.4, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } }) });
    });
    gsap.to('#numsFlower', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.nums', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.book__bg', { rotate: -90, ease: 'none', scrollTrigger: { trigger: '.book', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.nums__flower', { y: -60, ease: 'none', scrollTrigger: { trigger: '.nums', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('#footBig', { yPercent: 55 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.cta h2', { scale: 0.92 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } });
    if (innerWidth > 640) makePetals($('#ctaPetals'), 12, 18, 54, 90);
    else makePetals($('#ctaPetals'), 6, 18, 40, 50);
  }

  /* ------------------------------------------------------------------ */
  /* Langage des fleurs                                                  */
  /* ------------------------------------------------------------------ */
  const FLOWERS = [
    { name: 'La rose', desc: 'L’amour, dit sans détour. Poudrée, elle devient tendresse.', img: 'assets/img/roses-gypsophile.jpg', alt: 'Roses poudrées et gypsophile' },
    { name: 'La pivoine', desc: 'Tendresse et bonheur à venir : la reine des bouquets de mariée.', img: 'assets/img/ig-pivoine.jpg', alt: 'Pivoine rose vif dans un vase en bois' },
    { name: 'La gypsophile', desc: 'L’amour sincère et l’innocence : le petit nuage qui rend chaque bouquet plus léger.', img: 'assets/img/ig-roses.jpg', alt: 'Roses roses dans un nuage de gypsophile' },
    { name: 'La jonquille', desc: 'Le renouveau, la lumière qui revient : la fleur des nouveaux départs.', img: 'assets/img/ig-jonquilles.jpg', alt: 'Jonquilles, hellébores et eucalyptus dans un vase' },
    { name: 'L’anthurium', desc: 'La passion et l’hospitalité : un cœur graphique, venu de loin.', img: 'assets/img/bouquet-exotique.jpg', alt: 'Bouquet d’anthuriums et d’orchidées' },
    { name: 'L’eucalyptus', desc: 'La protection et la sérénité : le feuillage frais qui apaise et structure.', img: 'assets/img/centre-eucalyptus.jpg', alt: 'Centre de table à l’eucalyptus' }
  ];

  function initLang() {
    const tabs = $$('.lang__item'); const box = $('#langImg'); const name = $('#langName'); const desc = $('#langDesc'); const panel = $('#langPanel');
    let cur = 0;
    function show(i, focus) {
      if (i === cur && !focus) return;
      const f = FLOWERS[i]; cur = i;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'tab' + i);
      if (focus) tabs[i].focus();
      const old = $('img', box);
      const img = new Image(); img.alt = f.alt; img.src = f.img; img.className = 'is-front';
      box.appendChild(img);
      if (animate) {
        gsap.fromTo(img, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.25 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, ease: 'expo.inOut', onComplete: () => { old && old.remove(); img.classList.remove('is-front'); gsap.set(img, { clearProps: 'all' }); } });
        gsap.fromTo([name, desc], { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 });
      } else { old && old.remove(); img.classList.remove('is-front'); }
      name.textContent = f.name; desc.textContent = f.desc;
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('mouseenter', () => { if (fine) show(i); });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); show((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); show((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Galerie + lightbox                                                  */
  /* ------------------------------------------------------------------ */
  function initGallery() {
    const figs = $$('[data-gal]');
    figs.forEach((fig, i) => {
      if (animate) {
        gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 94%', once: true }, delay: (i % 3) * 0.1, onComplete: () => gsap.set(fig, { clearProps: 'clipPath' }) });
        const img = $('img', fig);
        gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
      tilt(fig, 5);
      $('.g__btn', fig).addEventListener('click', () => openLb(i));
    });
    const lb = $('#lb'); const img = $('#lbImg'); const cap = $('#lbCap'); let idx = 0;
    function openLb(i) {
      idx = (i + figs.length) % figs.length;
      const f = figs[idx]; const im = $('img', f);
      img.src = im.currentSrc || im.src; img.alt = im.alt; cap.textContent = $('figcaption', f).textContent;
      if (!lb.open) { lb.showModal(); lenis && lenis.stop(); }
      if (animate) gsap.fromTo(img, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
    }
    $('#lbClose').addEventListener('click', () => lb.close());
    $('#lbPrev').addEventListener('click', () => openLb(idx - 1));
    $('#lbNext').addEventListener('click', () => openLb(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', () => { lenis && lenis.start(); });
    lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') openLb(idx - 1); if (e.key === 'ArrowRight') openLb(idx + 1); });
  }

  /* inclinaison 3D + reflet qui suit la souris */
  function tilt(el, max) {
    if (!fine || reduce) return;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width; const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      el.classList.add('is-hover');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('is-hover'); });
  }

  /* ------------------------------------------------------------------ */
  /* Avis : carrousel                                                    */
  /* ------------------------------------------------------------------ */
  function initReviews() {
    const track = $('#revTrack'); const notes = $$('.note', track); const dots = $$('#revDots i');
    const step = () => (notes[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 24));
    const go = (dir) => { const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8; if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' }); else track.scrollBy({ left: dir * step(), behavior: 'smooth' }); };
    $('#revPrev').addEventListener('click', () => go(-1));
    $('#revNext').addEventListener('click', () => go(1));
    const upd = () => {
      let best = 0, bd = 1e9; const c = track.scrollLeft + track.clientWidth / 2;
      notes.forEach((n, i) => { const d = Math.abs(n.offsetLeft + n.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } });
      dots.forEach((d, i) => d.classList.toggle('is-on', i === best));
    };
    track.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
    let paused = false, visible = false, down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener('pointerenter', () => { paused = true; }); track.addEventListener('pointerleave', () => { paused = false; });
    track.addEventListener('focusin', () => { paused = true; }); track.addEventListener('focusout', () => { paused = false; });
    track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft; track.classList.add('is-drag'); track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointermove', (e) => { if (!down) return; moved = e.clientX - sx; track.scrollLeft = sl - moved; });
    const end = () => { if (!down) return; down = false; track.classList.remove('is-drag'); };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    track.addEventListener('click', (e) => { if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.35 }).observe(track);
    if (!reduce) setInterval(() => { if (!paused && visible && !down) go(1); }, 5600);
    if (animate) gsap.fromTo(notes, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: track, start: 'top 85%', once: true }, onComplete: () => gsap.set(notes, { clearProps: 'transform,opacity' }) });
  }

  /* ------------------------------------------------------------------ */
  /* Boutons magnétiques, curseur, navigation, menu                      */
  /* ------------------------------------------------------------------ */
  function initMagnetic() {
    if (!animate || !fine) return;
    $$('.magnetic').forEach((b) => {
      const t = $('.btn__t', b);
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2); const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(b, { x: dx * 0.32, y: dy * 0.4, duration: 0.5, ease: 'power3.out' });
        t && gsap.to(t, { x: dx * 0.12, y: dy * 0.16, duration: 0.5, ease: 'power3.out' });
      });
      b.addEventListener('pointerleave', () => {
        gsap.to(b, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)' });
        t && gsap.to(t, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)' });
      });
    });
  }

  function initCursor() {
    if (!animate || !fine) return;
    const cur = $('.cursor'); const label = $('.cursor__label');
    gsap.set(cur, { opacity: 0 });
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }); const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    let shown = false;
    addEventListener('pointermove', (e) => { if (!shown) { shown = true; gsap.to(cur, { opacity: 1, duration: 0.4 }); } xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      if (lab) { label.textContent = lab.dataset.cursor; cur.classList.add('is-label'); cur.classList.remove('is-link'); return; }
      cur.classList.remove('is-label');
      cur.classList.toggle('is-link', !!e.target.closest('a, button, label, .day, input, select, textarea'));
    });
    root.addEventListener('pointerleave', () => { shown = false; gsap.to(cur, { opacity: 0, duration: 0.3 }); });
  }

  function initNav() {
    const nav = $('#nav'); const fab = $('#fab'); let last = window.scrollY; let ticking = false;
    const update = () => {
      const y = window.scrollY; const d = y - last;
      nav.classList.toggle('is-solid', y > 80);
      if (!root.classList.contains('menu-lock')) {
        if (y > 320 && d > 6) nav.classList.add('is-hidden');
        else if (d < -6 || y < 320) nav.classList.remove('is-hidden');
      }
      fab.classList.toggle('is-on', y > innerHeight * 0.7 && !fabHide);
      if (Math.abs(d) > 6) last = y;
      ticking = false;
    };
    let fabHide = false;
    const book = $('#reserver');
    new IntersectionObserver((en) => { fabHide = en[0].isIntersecting && en[0].intersectionRatio > 0.25; update(); }, { threshold: [0, 0.25, 0.5] }).observe(book);
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    const links = $$('.nav__links a');
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((s) => io.observe(s));
    const bar = $('.progress i');
    if (animate) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    else addEventListener('scroll', () => { bar.style.transform = `scaleX(${(window.scrollY / (document.body.scrollHeight - innerHeight)).toFixed(3)})`; }, { passive: true });
  }

  const menu = $('#menu'); const burger = $('#burger');
  function openMenu() {
    menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu');
    $('#nav').classList.add('menu-open'); root.classList.add('menu-lock'); lenis && lenis.stop();
    if (animate) {
      gsap.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 3rem) 2.6rem)' }, { clipPath: 'circle(150% at calc(100% - 3rem) 2.6rem)', duration: 1.1, ease: 'expo.inOut' });
      gsap.fromTo('.menu__list a, .menu__foot', { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 1.1, ease: 'expo.out', delay: 0.3 });
    } else { menu.style.clipPath = 'none'; }
  }
  function closeMenu(quick) {
    if (!menu.classList.contains('is-open')) return;
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu');
    $('#nav').classList.remove('menu-open'); root.classList.remove('menu-lock'); menu.setAttribute('aria-hidden', 'true');
    const finish = () => { menu.classList.remove('is-open'); lenis && lenis.start(); };
    if (animate) gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 3rem) 2.6rem)', duration: quick ? 0.6 : 0.9, ease: 'expo.inOut', onComplete: finish }); else finish();
  }
  function initMenu() {
    burger.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu() : openMenu()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ------------------------------------------------------------------ */
  /* Horaires & « ouvert maintenant »                                    */
  /* ------------------------------------------------------------------ */
  function parisNow() {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const g = (t) => p.find((x) => x.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
    return { day, min: (parseInt(g('hour'), 10) % 24) * 60 + parseInt(g('minute'), 10) };
  }
  const rangesText = (r) => (r === null ? 'Nous consulter' : r.length ? r.map(([a, b]) => `${hLabel(a)} – ${hLabel(b)}`).join('  ·  ') : 'Fermé');

  function initHours() {
    const body = $('#hoursTable tbody'); const now = parisNow();
    [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
      const r = C.hours[d]; const tr = document.createElement('tr'); if (d === now.day) tr.className = 'is-today';
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = DAYS[d];
      const td = document.createElement('td'); td.textContent = rangesText(r);
      td.className = r === null ? 'ask' : r.length ? '' : 'closed';
      tr.append(th, td); body.appendChild(tr);
    });
    const el = $('#nowOpen'); const txt = $('span', el);
    const today = C.hours[now.day];
    if (today === null) { txt.textContent = 'Horaires du jour : appelez-nous pour confirmer'; return; }
    const cur = today.find(([a, b]) => now.min >= toMin(a) && now.min < toMin(b));
    if (cur) { el.classList.add('is-open'); txt.textContent = `Ouvert · ferme à ${hLabel(cur[1])}`; return; }
    for (let k = 0; k < 8; k++) {
      const d = (now.day + k) % 7; const r = C.hours[d]; if (!r) continue;
      const nx = r.find(([a]) => (k > 0 ? true : toMin(a) > now.min));
      if (nx) { txt.textContent = `Fermé · ouvre ${k === 0 ? 'aujourd’hui' : k === 1 ? 'demain' : DAYS[d]} à ${hLabel(nx[0])}`; return; }
    }
    txt.textContent = 'Fermé pour le moment';
  }

  /* ------------------------------------------------------------------ */
  /* Réservation (100 % statique : SMS / appel / Instagram / .ics)       */
  /* ------------------------------------------------------------------ */
  const OCC = {
    bouquet: { label: 'Un bouquet à retirer en boutique', slot: 'Créneau de retrait', hint: 'Pour aujourd’hui ou demain matin, appelez-nous directement : c’est le plus rapide.', note: 'Pour qui ? Quelles couleurs, quelles fleurs ?' },
    mariage: { label: 'Mariage : rendez-vous conseil', slot: 'Créneau de rendez-vous', hint: 'Venez avec vos inspirations : photos, couleurs, lieu de réception.', note: 'Date et lieu du mariage, ambiance, couleurs, nombre d’invités…' },
    deuil: { label: 'Hommage : composition de deuil', slot: 'Créneau pour échanger', hint: 'Pour un décès, le plus simple est d’appeler : Laurence s’organise tout de suite avec vous.', note: 'Date et lieu de la cérémonie, type de composition souhaité…' },
    surmesure: { label: 'Création sur mesure ou événement', slot: 'Créneau de rendez-vous', hint: 'Décrivez votre idée, même floue : on la précise ensemble.', note: 'Quel événement, quel style, quel budget approximatif ?' }
  };
  const S = { occasion: 'bouquet', date: null, slot: null, step: 1, ref: '', data: null };
  const fmtLong = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const slotsFor = (d) => {
    const r = C.hours[d.getDay()]; if (!r || C.holidays.includes(ymd(d))) return [];
    const step = C.slotMinutes || 30; const out = [];
    r.forEach(([a, b]) => { for (let m = toMin(a); m + step <= toMin(b); m += step) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`); });
    return out;
  };

  function setOccasion(k) {
    if (!OCC[k]) return; S.occasion = k;
    const inp = $(`#oc-${k}`); if (inp) inp.checked = true;
    $('#occHint').textContent = OCC[k].hint; $('#slotsLabel').textContent = OCC[k].slot;
    $('#f-note').placeholder = OCC[k].note;
    if (k === 'deuil') $('#occHint').innerHTML = `${OCC[k].hint} <a href="tel:${C.phoneTel}">${C.phoneDisplay}</a>`;
  }

  function buildCal() {
    const wrap = $('#cal'); wrap.innerHTML = '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const first = new Date(today); first.setDate(first.getDate() + 1);
    const last = new Date(today); last.setDate(last.getDate() + (C.bookingDays || 28));
    const start = new Date(today); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(last); end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
    const head = document.createElement('div'); head.className = 'cal__head';
    head.innerHTML = `<span>${MONTHS[first.getMonth()]}${first.getMonth() !== last.getMonth() ? ' – ' + MONTHS[last.getMonth()] : ''} ${last.getFullYear()}</span><span>Dès demain</span>`;
    const dow = document.createElement('div'); dow.className = 'cal__dow'; dow.setAttribute('aria-hidden', 'true');
    dow.innerHTML = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => `<span>${x}</span>`).join('');
    const grid = document.createElement('div'); grid.className = 'cal__grid'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Choisissez un jour');
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d); const b = document.createElement('button'); b.type = 'button'; b.className = 'day';
      b.textContent = day.getDate();
      const inRange = day >= first && day <= last;
      const wk = day.getDay(); const unknown = C.hours[wk] === null; const closed = !unknown && slotsFor(day).length === 0;
      if (!inRange) { b.disabled = true; b.style.visibility = day < first ? 'hidden' : 'visible'; b.setAttribute('aria-hidden', 'true'); }
      else if (unknown || closed || C.holidays.includes(ymd(day))) {
        b.disabled = true; b.setAttribute('aria-label', `${fmtLong(day)} : ${unknown ? 'nous appeler' : 'fermé'}`);
        if (unknown) { const s = document.createElement('small'); s.textContent = 'appel'; b.appendChild(s); }
      } else {
        b.setAttribute('aria-label', fmtLong(day)); b.setAttribute('aria-pressed', 'false'); b.dataset.date = ymd(day);
        b.addEventListener('click', () => selectDate(day, b));
      }
      grid.appendChild(b);
    }
    wrap.append(head, dow, grid);
  }

  function selectDate(day, btn) {
    S.date = day; S.slot = null;
    $$('#cal .day[data-date]').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    const slots = slotsFor(day); const wrap = $('#slots'); wrap.innerHTML = '';
    slots.forEach((s) => {
      const id = 'slot-' + s.replace(':', ''); const d = document.createElement('div'); d.className = 'slot';
      d.innerHTML = `<input type="radio" name="slot" id="${id}" value="${s}"><label for="${id}">${hLabel(s)}</label>`;
      $('input', d).addEventListener('change', () => { S.slot = s; $('#dateHint').textContent = `${fmtLong(day)} à ${hLabel(s)}, parfait.`; $('#dateHint').classList.remove('hint--warn'); });
      wrap.appendChild(d);
    });
    $('#slotsWrap').hidden = false;
    $('#dateHint').textContent = `${fmtLong(day)} : choisissez maintenant un créneau.`; $('#dateHint').classList.remove('hint--warn');
    if (animate) gsap.fromTo('#slots .slot', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.025 });
  }

  function goStep(n, dir) {
    const panes = $$('.pane'); const from = panes[S.step - 1]; const to = panes[n - 1]; S.step = n;
    const li = $$('#bookSteps li'); li.forEach((x, i) => { x.classList.toggle('is-on', i === n - 1); x.classList.toggle('is-done', i < n - 1); });
    const show = () => { from.hidden = true; to.hidden = false; if (animate) gsap.fromTo(to, { x: (dir || 1) * 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }); const f = $('input:checked, button, input', to); };
    if (animate && from !== to) gsap.to(from, { x: -(dir || 1) * 40, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { show(); gsap.set(from, { clearProps: 'all' }); } }); else show();
  }

  function validateStep(n) {
    if (n === 2) {
      if (!S.date || !S.slot) { const h = $('#dateHint'); h.innerHTML = `Choisissez un jour <b>et</b> un créneau, ou <a href="tel:${C.phoneTel}">appelez-nous</a> si rien ne convient.`; h.classList.add('hint--warn'); return false; }
    }
    if (n === 3) {
      let ok = true;
      const name = $('#f-name'); const tel = $('#f-tel');
      const setErr = (inp, msg) => { const f = inp.closest('.field'); f.classList.toggle('has-error', !!msg); $('.err', f).textContent = msg || ''; if (msg) ok = false; };
      setErr(name, name.value.trim().length >= 2 ? '' : 'Votre prénom, s’il vous plaît.');
      const digits = tel.value.replace(/[\s.\-]/g, '');
      setErr(tel, /^(?:(?:\+|00)33|0)[1-9]\d{8}$/.test(digits) ? '' : 'Un numéro français valide, ex. 06 12 34 56 78.');
      if (!ok) (name.closest('.has-error') ? name : tel).focus();
      return ok;
    }
    return true;
  }

  function makeRef(d) {
    const alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = '';
    for (let i = 0; i < 3; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
    return `FC-${pad(d.getDate())}${pad(d.getMonth() + 1)}-${s}`;
  }

  function compose() {
    const o = OCC[S.occasion]; const f = $('#bookForm'); const v = (n) => (f.elements[n] ? f.elements[n].value.trim() : '');
    const data = { name: v('name'), tel: v('tel'), budget: v('budget'), eventdate: v('eventdate'), note: v('note') };
    const when = `${fmtLong(S.date)} à ${hLabel(S.slot)}`;
    const lines = [
      'Bonjour Laurence, je souhaite réserver chez Fleur de cannelle.',
      `Occasion : ${o.label}`,
      `Créneau souhaité : ${when}`,
      data.budget ? `Budget : ${data.budget}` : null,
      data.eventdate ? `Date de l’événement : ${data.eventdate}` : null,
      data.note ? `Mes envies : ${data.note}` : null,
      `Prénom : ${data.name} · Tél. : ${data.tel}`,
      `Réf. ${S.ref}`,
      'Merci de me confirmer par retour.'
    ].filter(Boolean);
    S.data = Object.assign(data, { when, occLabel: o.label, text: lines.join('\n') });
  }

  function showResult() {
    S.ref = makeRef(S.date); compose();
    $('#refCode').textContent = S.ref;
    const dl = $('#recapList');
    const rows = [['Occasion', S.data.occLabel], ['Créneau', S.data.when], S.data.budget ? ['Budget', S.data.budget] : null, S.data.eventdate ? ['Événement', S.data.eventdate] : null, S.data.note ? ['Envies', S.data.note] : null, ['Pour', `${S.data.name} · ${S.data.tel}`]].filter(Boolean);
    dl.innerHTML = ''; rows.forEach(([k, val]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = val; dl.append(dt, dd); });

    const enc = encodeURIComponent(S.data.text); const box = $('#sendBtns'); box.innerHTML = '';
    const mk = (cls, href, icon, text, opts = {}) => {
      const a = document.createElement('a'); a.className = 'btn ' + cls; a.href = href;
      if (opts.blank) { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = `<span class="btn__t"><svg aria-hidden="true"><use href="#${icon}"/></svg> ${text}</span>`;
      if (opts.onClick) a.addEventListener('click', opts.onClick);
      box.appendChild(a); return a;
    };
    mk('btn--full', `tel:${C.phoneTel}`, 'i-phone', `Appeler la boutique · ${C.phoneDisplay}`);
    if (C.smsNumber) mk('btn--dark', `sms:${C.smsNumber}?&body=${enc}`, 'i-chat', 'Envoyer par SMS');
    if (C.whatsapp) mk('btn--dark', `https://wa.me/${C.whatsapp}?text=${enc}`, 'i-chat', 'WhatsApp', { blank: true });
    if (C.email) mk('btn--dark', `mailto:${C.email}?subject=${encodeURIComponent('Réservation ' + S.ref)}&body=${enc}`, 'i-mail', 'Envoyer par e-mail');
    mk('btn--rose btn--full', `https://ig.me/m/${C.instagram}`, 'i-insta', 'Écrire sur Instagram (message copié)', { blank: true, onClick: async () => { const ok = await copyText(S.data.text); toast(ok ? 'Message copié : collez-le dans la conversation Instagram.' : 'Copie impossible : utilisez « Copier le message ».'); } });

    $('#statusText').textContent = S.occasion === 'deuil'
      ? 'Pour un hommage, appelez de préférence : Laurence s’organise tout de suite. Vous pouvez aussi lui envoyer ce message.'
      : 'Ce site ne transmet rien automatiquement : envoyez cette demande ou appelez la boutique, Laurence vous confirmera le créneau.';

    $('#bookForm').hidden = true; const res = $('#bookResult'); res.hidden = false;
    if (animate) { gsap.fromTo(res, { y: 40, opacity: 0, rotate: -1.5 }, { y: 0, opacity: 1, rotate: 0, duration: 1.2, ease: 'expo.out' }); gsap.fromTo('.stamp', { scale: 2.4, opacity: 0, rotate: -40 }, { scale: 1, opacity: 1, rotate: -14, duration: 0.8, ease: 'back.out(2)', delay: 0.5 }); gsap.fromTo('#sendBtns .btn', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.08, delay: 0.4 }); }
    const y = res.getBoundingClientRect().top + window.scrollY - 100;
    lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  function makeIcs() {
    const d = S.date; const [h, m] = S.slot.split(':').map(Number); const startMin = h * 60 + m; const endMin = startMin + (C.slotMinutes || 30);
    const stamp = (min) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(Math.floor(min / 60))}${pad(min % 60)}00`;
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const now = new Date(); const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fleur de cannelle//Reservation//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${S.ref}@fleur-de-cannelle`, `DTSTAMP:${dtstamp}`, `DTSTART:${stamp(startMin)}`, `DTEND:${stamp(endMin)}`,
      `SUMMARY:${esc('Fleur de cannelle : ' + S.data.occLabel)}`, `LOCATION:${esc(C.shop + ', ' + C.address)}`,
      `DESCRIPTION:${esc(S.data.text + '\n\nDemande à confirmer avec la boutique : ' + C.phoneDisplay)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:Rappel : Fleur de cannelle', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fleur-de-cannelle-${S.ref}.ics`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function initBooking() {
    buildCal(); setOccasion('bouquet');
    $$('input[name="occasion"]').forEach((r) => r.addEventListener('change', () => setOccasion(r.value)));
    $$('[data-next]').forEach((b) => b.addEventListener('click', () => { if (validateStep(S.step)) goStep(S.step + 1, 1); }));
    $$('[data-prev]').forEach((b) => b.addEventListener('click', () => goStep(S.step - 1, -1)));
    $('#bookForm').addEventListener('submit', (e) => { e.preventDefault(); if (S.step < 3) { if (validateStep(S.step)) goStep(S.step + 1, 1); return; } if (validateStep(3)) showResult(); });
    $('#btnCopy').addEventListener('click', async () => { const ok = await copyText(S.data.text); toast(ok ? 'Message copié.' : 'Copie impossible sur ce navigateur.'); });
    $('#btnIcs').addEventListener('click', makeIcs);
    $('#btnEdit').addEventListener('click', () => { $('#bookResult').hidden = true; $('#bookForm').hidden = false; goStep(3, -1); });
    ['f-name', 'f-tel'].forEach((id) => $('#' + id).addEventListener('input', (e) => { const f = e.target.closest('.field'); f.classList.remove('has-error'); $('.err', f).textContent = ''; }));
  }

  /* ------------------------------------------------------------------ */
  /* Divers                                                              */
  /* ------------------------------------------------------------------ */
  function initLegal() {
    const d = $('#legal');
    $('#legalOpen').addEventListener('click', () => d.showModal());
    $('#legalClose').addEventListener('click', () => d.close());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  }

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */
  function boot() {
    initLenis();
    initAnchors();
    runLoader();
    initHero();
    initMarquee();
    initStory();
    initCrea();
    initReveals();
    initLang();
    initGallery();
    initReviews();
    initMagnetic();
    initCursor();
    initNav();
    initMenu();
    initHours();
    initBooking();
    initLegal();
    $$('[data-tilt]').forEach((c) => tilt(c, 8));
    if (animate) {
      addEventListener('load', () => ScrollTrigger.refresh());
      if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
