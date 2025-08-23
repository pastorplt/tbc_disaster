// include-nav.js
(async function () {
  const mount = document.getElementById('navbar-include');
  if (!mount) return;

  // Fetch & inject (cache-bust so iOS Chrome doesn't serve an old file)
  const res = await fetch('navbar.html?v=3', { cache: 'no-cache' });
  if (!res.ok) { console.error('navbar fetch failed', res.status); return; }
  mount.innerHTML = await res.text();

  const root   = mount.querySelector('#tbc-navbar') || mount;
  const nav    = root.querySelector('.tbc-nav') || root.querySelector('.nav');
  const burger = root.querySelector('.tbc-hamburger') || root.querySelector('.hamburger');
  const menu   = root.querySelector('#tbcNavMenu') || root.querySelector('#navMenu');
  if (!nav || !burger || !menu) { console.warn('Navbar elements missing'); return; }

  const openMenu  = () => { menu.classList.add('open');  burger.setAttribute('aria-expanded','true');  };
  const closeMenu = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); };

  // --- iOS Chrome: avoid double toggle (touchend + synthetic click)
  let lastTouchTime = 0;
  const isRecentTouch = () => (Date.now() - lastTouchTime) < 500;

  // Make element clearly tappable on iOS
  burger.style.webkitTapHighlightColor = 'transparent';
  burger.style.touchAction = 'manipulation';
  burger.style.pointerEvents = 'auto';

  // Pointer Events first (where supported)
  if (window.PointerEvent) {
    burger.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') {
        lastTouchTime = Date.now();
      }
      menu.classList.contains('open') ? closeMenu() : openMenu();
    }, { passive: true });
  }

  // Fallback touch (for older iOS)
  burger.addEventListener('touchend', (e) => {
    lastTouchTime = Date.now();
    e.preventDefault();   // stop ghost click
    e.stopPropagation();
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }, { passive: false });

  // Click (desktop / non-touch). Ignore if a touch just happened.
  burger.addEventListener('click', (e) => {
    if (isRecentTouch()) return; // ignore synthetic click after touch
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }, { passive: true });

  // Dropdowns (desktop + mobile)
  const dropdowns = Array.from(root.querySelectorAll('.tbc-dropdown, .dropdown'));
  const toggles   = dropdowns.map(d => d.querySelector('.tbc-dropdown-toggle, .dropdown-toggle'));
  const closeAllDropdowns = () => {
    dropdowns.forEach(d => d.classList.remove('open'));
    toggles.forEach(t => t && t.setAttribute('aria-expanded','false'));
  };

  const toggleDropdown = (dd, toggle) => {
    const isOpen = dd.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) { dd.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
  };

  // Pointer/touch/click for dropdown toggles
  toggles.forEach((toggle, i) => {
    const dd = dropdowns[i];
    if (!toggle || !dd) return;

    if (window.PointerEvent) {
      toggle.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'touch') lastTouchTime = Date.now();
        e.stopPropagation();
        toggleDropdown(dd, toggle);
      }, { passive: true });
    }

    toggle.addEventListener('touchend', (e) => {
      lastTouchTime = Date.now();
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(dd, toggle);
    }, { passive: false });

    toggle.addEventListener('click', (e) => {
      if (isRecentTouch()) return;
      e.stopPropagation();
      toggleDropdown(dd, toggle);
    }, { passive: true });
  });

  // Close on outside click/touch, Esc, or resize
  const closeAll = () => { closeAllDropdowns(); closeMenu(); };
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) closeAll(); }, { passive: true });
  document.addEventListener('touchend', (e) => { if (!root.contains(e.target)) closeAll(); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

  let lastWide = window.innerWidth > 720;
  window.addEventListener('resize', () => {
    const wide = window.innerWidth > 720;
    if (wide !== lastWide) { closeAll(); lastWide = wide; }
  }, { passive: true });

  // Admin POST buttons (works unchanged)
  const REGEN_TOKEN = '2025';
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    Object.assign(t.style, {
      position:'fixed', right:'16px', bottom:'16px', zIndex:'1100',
      background:'rgba(17,17,17,.95)', color:'#fff', padding:'10px 14px',
      borderRadius:'10px', fontSize:'13px', boxShadow:'0 10px 24px rgba(0,0,0,.3)'
    });
    t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
  }
  async function postAdmin(url) {
    try {
      const resp = await fetch(url, { method:'POST', headers:{ 'Authorization':'Bearer '+REGEN_TOKEN, 'Content-Type':'application/json' } });
      const txt = await resp.text();
      if (!resp.ok) return showToast(`Failed: ${resp.status}`);
      try { const data = JSON.parse(txt); showToast(data?.ok ? `Success (${data.features ?? 'ok'})` : 'Done'); }
      catch { showToast('Done'); }
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
