// include-nav.js
(async function () {
  const mount = document.getElementById('navbar-include');
  if (!mount) return;

  // Fetch & inject navbar.html (cache-bust to avoid stale iOS cache)
  let html = '';
  try {
    const res = await fetch('navbar.html?v=2', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`navbar fetch failed: ${res.status}`);
    html = await res.text();
  } catch (e) {
    console.error('Failed to load navbar:', e);
    return;
  }
  mount.innerHTML = html;

  const root      = mount.querySelector('#tbc-navbar') || mount;
  const nav       = root.querySelector('.tbc-nav') || root.querySelector('.nav');
  const burger    = root.querySelector('.tbc-hamburger') || root.querySelector('.hamburger');
  const menu      = root.querySelector('#tbcNavMenu') || root.querySelector('#navMenu');

  if (!nav || !burger || !menu) {
    console.warn('Navbar elements not found; check navbar.html structure.');
    return;
  }

  // ——— iOS-safe toggle helpers ———
  const openMenu  = () => { menu.classList.add('open');  burger.setAttribute('aria-expanded','true');  };
  const closeMenu = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); };

  // Ensure the hamburger is actually tappable on iOS
  burger.style.webkitTapHighlightColor = 'transparent';
  burger.style.touchAction = 'manipulation'; // hint to avoid 300ms delay
  burger.style.pointerEvents = 'auto';

  // Click handler (desktop + most mobiles)
  burger.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }, { passive: true });

  // Touch handler (iOS Safari/Chrome)
  burger.addEventListener('touchend', (e) => {
    e.preventDefault();   // prevent ghost click
    e.stopPropagation();  // avoid bubbling to document close handler
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }, { passive: false });

  // Dropdowns (desktop + mobile sheet)
  const dropdowns = Array.from(root.querySelectorAll('.tbc-dropdown, .dropdown'));
  const toggles   = dropdowns.map(d => d.querySelector('.tbc-dropdown-toggle, .dropdown-toggle'));
  const closeAllDropdowns = () => {
    dropdowns.forEach(d => d.classList.remove('open'));
    toggles.forEach(t => t && t.setAttribute('aria-expanded','false'));
  };
  toggles.forEach((toggle, i) => {
    const dd = dropdowns[i];
    if (!toggle || !dd) return;

    // Click
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dd.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) { dd.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
    }, { passive: true });

    // Touch (iOS)
    toggle.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = dd.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) { dd.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
    }, { passive: false });
  });

  // Close on outside click / Esc / resize
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) { closeAllDropdowns(); closeMenu(); }
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (!root.contains(e.target)) { closeAllDropdowns(); closeMenu(); }
  }, { passive: true });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAllDropdowns(); closeMenu(); }
  });

  let lastWide = window.innerWidth > 720;
  window.addEventListener('resize', () => {
    const wide = window.innerWidth > 720;
    if (wide !== lastWide) { closeAllDropdowns(); closeMenu(); lastWide = wide; }
  }, { passive: true });

  // Admin POST actions
  const REGEN_TOKEN = '2025';
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: '1100',
      background: 'rgba(17,17,17,.95)', color: '#fff', padding: '10px 14px',
      borderRadius: '10px', fontSize: '13px', boxShadow: '0 10px 24px rgba(0,0,0,.3)'
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }
  async function postAdmin(url) {
    try {
      const resp = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + REGEN_TOKEN, 'Content-Type': 'application/json' } });
      const txt = await resp.text();
      if (!resp.ok) return showToast(`Failed: ${resp.status}`);
      try { const data = JSON.parse(txt); return showToast(data?.ok ? `Success (${data.features ?? 'ok'})` : 'Done'); }
      catch { return showToast('Done'); }
    } catch { showToast('Request error'); }
  }
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.tbc-admin-action, .admin-action');
    if (!btn) return;
    e.preventDefault();
    postAdmin(btn.getAttribute('data-url'));
  });

  // Keep Leaflet behind navbar (extra safety)
  const style = document.createElement('style');
  style.textContent = `.leaflet-container { z-index: 0 !important; }`;
  document.head.appendChild(style);
})();
