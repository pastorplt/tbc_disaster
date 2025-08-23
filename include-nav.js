// include-nav.js
(async function () {
  const host = document.getElementById('navbar-include');
  if (!host) return;

  // Fetch + inject (cache-bust for iOS)
  const res = await fetch('navbar.html?v=clean1', { cache: 'no-cache' });
  if (!res.ok) { console.error('navbar fetch failed:', res.status); return; }
  host.innerHTML = await res.text();

  // Elements
  const root   = host.querySelector('#tbc-navbar');
  const burger = root.querySelector('.tbc-hamburger');
  const nav    = root.querySelector('.tbc-nav');

  // Hamburger toggle (iOS-safe)
  let lastTouch = 0;
  const isRecentTouch = () => Date.now() - lastTouch < 500;
  const openNav  = () => { nav.classList.add('open');  burger.setAttribute('aria-expanded','true'); };
  const closeNav = () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded','false'); };

  burger.style.webkitTapHighlightColor = 'transparent';
  burger.style.touchAction = 'manipulation';

  if (window.PointerEvent) {
    burger.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') lastTouch = Date.now();
      nav.classList.contains('open') ? closeNav() : openNav();
    }, { passive: true });
  }
  burger.addEventListener('touchend', (e) => {
    lastTouch = Date.now();
    e.preventDefault(); e.stopPropagation();
    nav.classList.contains('open') ? closeNav() : openNav();
  }, { passive: false });
  burger.addEventListener('click', () => {
    if (isRecentTouch()) return;
    nav.classList.contains('open') ? closeNav() : openNav();
  }, { passive: true });

  // Close nav when clicking outside or on resize / Esc
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) closeNav(); }, { passive: true });
  document.addEventListener('touchend', (e) => { if (!root.contains(e.target)) closeNav(); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  let lastWide = window.innerWidth > 720;
  window.addEventListener('resize', () => {
    const wide = window.innerWidth > 720;
    if (wide !== lastWide) { closeNav(); lastWide = wide; }
  }, { passive: true });

  // Admin POST actions
  const TOKEN = '2025';
  function toast(msg) {
    const t = document.createElement('div');
    Object.assign(t.style, {
      position:'fixed', right:'16px', bottom:'16px', zIndex:'1100',
      background:'rgba(17,17,17,.95)', color:'#fff', padding:'10px 14px',
      borderRadius:'10px', fontSize:'13px', boxShadow:'0 10px 24px rgba(0,0,0,.3)'
    });
    t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
  }
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('.tbc-admin');
    if (!btn) return;
    e.preventDefault();
    try {
      const resp = await fetch(btn.dataset.url, { method:'POST', headers:{ 'Authorization':'Bearer '+TOKEN, 'Content-Type':'application/json' } });
      const txt = await resp.text();
      if (!resp.ok) return toast(`Failed: ${resp.status}`);
      try { const data = JSON.parse(txt); toast(data?.ok ? `Success (${data.features ?? 'ok'})` : 'Done'); }
      catch { toast('Done'); }
    } catch { toast('Request error'); }
  });
})();
