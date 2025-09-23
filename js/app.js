const smoothTo = (hash) => {
  const el = document.querySelector(hash);
  if (!el) return;
  warp(1.8, 700);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

(function navBurger(){
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('nav--open', open);
  });

  nav.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      nav.classList.remove('nav--open');
      burger.setAttribute('aria-expanded','false');
      smoothTo(a.getAttribute('href'));
    });
  });
})();

(function planetsParallax(){
  const planets = document.querySelectorAll('.hero__planet');
  if (!planets.length) return;
  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    planets.forEach((p, i) => {
      const depth = (i + 1) * 6;
      p.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
    });
  });
})();

(function revealOnView(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach((e)=>{
      if(e.isIntersecting){
        e.target.classList.add('is-visible');
        if (e.target.matches('[data-section]')) warp(1.2, 400);
      }
    });
  }, { threshold: .2 });

  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  document.querySelectorAll('[data-section]').forEach(el=>io.observe(el));
})();

(function slider(){
  const track = document.getElementById('slidesTrack');
  if(!track) return;
  const slides = track.children;
  const prev = document.querySelector('.slider__btn--prev');
  const next = document.querySelector('.slider__btn--next');
  let index = 0;

  const update = () => track.style.transform = `translateX(${-index*100}%)`;
  const clamp = (i) => (i<0 ? slides.length-1 : (i>=slides.length ? 0 : i));

  prev && prev.addEventListener('click', ()=>{ index = clamp(index-1); update(); warp(1.05, 250); });
  next && next.addEventListener('click', ()=>{ index = clamp(index+1); update(); warp(1.05, 250); });
})();

(function copyButtons(){
  document.querySelectorAll('[data-copy]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const sel = btn.getAttribute('data-copy');
      const src = document.querySelector(sel);
      if(!src) return;
      try{
        await navigator.clipboard.writeText(src.textContent.trim());
        const status = document.getElementById('copyStatus');
        if(status){
          const old = status.textContent;
          status.textContent = 'Copied!';
          setTimeout(()=> status.textContent = old || '', 1500);
        }
      }catch(e){ console.warn('Clipboard error', e); }
    });
  });
})();

const canvas = document.getElementById('space');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, stars = [], baseSpeed = 0.6, speed = baseSpeed, targetSpeed = baseSpeed;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = Array.from({length: Math.min(260, Math.floor(w*h/6000))}, () => ({
      x: (Math.random()*w - w/2),
      y: (Math.random()*h - h/2),
      z: Math.random()*w,
      o: Math.random()*0.8 + 0.2
    }));
  };
  resize();
  window.addEventListener('resize', resize);

  function draw(){
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0,0,w,h);

    speed += (targetSpeed - speed) * 0.06;

    ctx.save();
    ctx.translate(w/2, h/2);
    for (let s of stars){
      s.z -= speed;
      if (s.z <= 0) { s.x = (Math.random()*w - w/2); s.y = (Math.random()*h - h/2); s.z = w; }

      const k = 128 / s.z;
      const px = s.x * k;
      const py = s.y * k;

      const size = (1 - s.z / w) * 2.2 + 0.2;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${s.o})`;
      ctx.arc(px, py, size, 0, Math.PI*2);
      ctx.fill();

      if (speed > 1){
        ctx.strokeStyle = `rgba(255,255,255,${0.25*s.o})`;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px * (1 + speed*0.03), py * (1 + speed*0.03));
        ctx.stroke();
      }
    }
    ctx.restore();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  window.warp = (mult=1.4, dur=600) => {
    targetSpeed = baseSpeed * mult;
    setTimeout(()=> targetSpeed = baseSpeed, dur);
  };

  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const dy = Math.abs(window.scrollY - lastY);
    lastY = window.scrollY;
    if (dy > 40) warp(1.2, 300);
  }, {passive:true});
} else {
  window.warp = ()=>{};
}

(function wheelTransitions(){
  const sections = Array.from(document.querySelectorAll('[data-section]'));
  const overlay = document.getElementById('transition');
  if (sections.length < 2 || !overlay) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  let animLock = false;
  let index = currentIndexByScroll();

  function currentIndexByScroll(){
    const y = window.scrollY + 10;
    let i = 0;
    for (let k = 0; k < sections.length; k++){
      const s = sections[k];
      const top = s.offsetTop;
      const bottom = top + s.offsetHeight;
      if (y >= top && y < bottom){ i = k; break; }
    }
    return i;
  }

  window.addEventListener('scroll', () => { index = currentIndexByScroll(); }, {passive:true});

  window.addEventListener('wheel', (e) => {
    if (animLock) return;
    if (Math.abs(e.deltaY) < 24) return;

    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const next = clamp(index + dir, 0, sections.length - 1);
    if (next === index) return;

    animLock = true;
    playTransition(dir);

    const targetTop = sections[next].offsetTop;
    warp(1.6, 700);
    window.scrollTo({ top: targetTop, behavior: 'smooth' });

    setTimeout(() => { animLock = false; index = next; }, 820);
  }, { passive: false });

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function playTransition(dir){
    overlay.classList.remove('transition--reverse');
    if (dir < 0) overlay.classList.add('transition--reverse');
    overlay.classList.add('transition--active');
    setTimeout(()=> overlay.classList.remove('transition--active'), 780);
  }
})();

(function driftFlyer(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (reduce || isTouch) return;

  const sections = Array.from(document.querySelectorAll('[data-section]'));
  if (!sections.length) return;

  const IMG_SRC = 'images/flyer.png';
  const WIDTH_PX = 280;
  const DRIFT_SPEED = 80;
  const DASH_SPEED  = 1400;
  const ENTER_SPEED = 900;
  const MARGIN_Y = 24;
  const ACTIVATE_AT_INDEX = 1;

  const flyer = new Image();
  flyer.className = 'flyer-bg';
  flyer.alt = '';
  flyer.src = IMG_SRC;
  flyer.width = WIDTH_PX;
  flyer.setAttribute('aria-hidden','true');

  let curSec = null;
  let x = -9999, y = 0, w = WIDTH_PX;
  let running = false;
  let dashing = false;
  let rafId = 0, lastT = 0;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if (!ent.isIntersecting) return;
      const idx = sections.indexOf(ent.target);
      if (idx === ACTIVATE_AT_INDEX && !running && !dashing){
        startInSection(sections[idx]);
        hookPointer();
      }
    });
  }, { threshold: 0.55 });
  sections.forEach(s => io.observe(s));

  function loop(t){
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    if (!lastT) { lastT = t; return; }
    const dt = (t - lastT) / 1000;
    lastT = t;

    x += DRIFT_SPEED * dt;
    applyTransform(x, y);

    const r = curSec.getBoundingClientRect();
    if (x > r.width + 40){
      x = -w - 20;
      randomizeY(r);
      applyTransform(x, y);
    }
  }

  function startInSection(sec){
    moveToSectionNode(sec);
    const r = sec.getBoundingClientRect();
    x = -w - 20;
    randomizeY(r);
    applyTransform(x, y);

    running = true; dashing = false;
    lastT = 0;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function hookPointer(){
    sections.forEach(sec=>{
      sec.addEventListener('pointerenter', ()=>{
        if (!curSec || sec === curSec) return;
        dashToEdgeThenEnter(sec);
      }, { passive:true });
    });
  }

  function dashToEdgeThenEnter(nextSec){
    if (dashing) return;
    dashing = true;

    const r = curSec.getBoundingClientRect();
    const distRight = (r.width + 40) - x;
    const distLeft  = (x + w + 20);
    const goRight = distRight <= distLeft;
    const targetX = goRight ? (r.width + 40) : (-w - 40);

    tweenX(targetX, DASH_SPEED, () => {
      moveToSectionNode(nextSec);
      const nr = nextSec.getBoundingClientRect();

      x = -w - 40;
      randomizeY(nr);
      applyTransform(x, y);

      const insideX = Math.min(40, nr.width * 0.08);
      tweenX(insideX, ENTER_SPEED, () => {
        dashing = false;
        running = true;
        lastT = 0;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(loop);
      });
    });
  }

  function tweenX(targetX, speedPxPerSec, done){
    const startX = x;
    const distance = Math.abs(targetX - startX);
    const dur = Math.max(120, distance / speedPxPerSec * 1000);

    running = false;
    const t0 = performance.now();
    cancelAnimationFrame(rafId);

    (function step(t){
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      x = startX + (targetX - startX) * ease;
      applyTransform(x, y);
      if (p < 1) requestAnimationFrame(step);
      else done && done();
    })(t0);
  }

  function moveToSectionNode(sec){
    curSec = sec;
    if (flyer.parentNode !== sec){
      if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
      if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
      sec.appendChild(flyer);
    }
  }

  function randomizeY(rect){
    const minY = MARGIN_Y;
    const maxY = Math.max(MARGIN_Y + 10, rect.height - MARGIN_Y - 10);
    const mid  = rect.height * 0.5;
    const span = Math.max(40, rect.height * 0.35);
    y = clamp(mid + (Math.random() * 2 - 1) * span, minY, maxY);
  }

  function applyTransform(tx, ty){
    const sx = Math.round(tx * 10) / 10;
    const sy = Math.round(ty * 10) / 10;
    flyer.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
})();

(function roadmapEnhance(){
  const section = document.getElementById('roadmap');
  if (!section) return;

  const items = Array.from(section.querySelectorAll('.roadmap__item'));
  if (!items.length) return;

  items.forEach(li => {
    if (li.querySelector('.roadmap__label')) return;
    const tag = li.querySelector('.roadmap__tag');
    if (!tag) return;
    const label = document.createElement('span');
    label.className = 'roadmap__label';
    let n = tag.nextSibling;
    const toMove = [];
    while (n) { const next = n.nextSibling; toMove.push(n); n = next; }
    toMove.forEach(node => label.appendChild(node));
    li.appendChild(label);
  });

  items.forEach((li, i) => {
    if (!li.querySelector('.saber-blade')) {
      const blade = document.createElement('i');
      blade.className = 'saber-blade';
      blade.setAttribute('aria-hidden', 'true');
      blade.style.setProperty('--delay', `${i * 180}ms`);
      li.appendChild(blade);
    }
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { section.classList.add('is-lit'); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        section.classList.add('is-lit');
        io.disconnect();
      }
    });
  }, { threshold: 0.25 });

  io.observe(section);
})();
