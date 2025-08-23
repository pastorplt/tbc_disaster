/* include-nav.js (DEBUG) — pure JS, no <script> tags */
(function () {
  const DEBUG = true;

  // ---- Debug HUD ----
  const hud = document.createElement('div');
  Object.assign(hud.style, {
    position: 'fixed', left: '8px', bottom: '8px', zIndex: '99999',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: '12px', lineHeight: '1.2', color: '#fff',
    background: '#444', padding: '8px 10px', borderRadius: '8px',
    boxShadow: '0 6px 16px rgba(0,0,0,.3)', opacity: '0.9'
  });
  hud.innerHTML = 'HUD: init';
  if (DEBUG) document.body.appendChild(hud);
  const hudSet = (msg, bg) => { hud.textContent = msg; if (bg) hud.style.background = bg; };

  const log = (...args) => { if (DEBUG) console.log('[NAV]', ...args); };

  // fetch & inject navbar
  async function boot() {
    const mount = document.getElementById('navbar-include');
    if (!mount) { log('no #navbar-include on page'); hudSet('HUD: no mount', '#b91c1c'); return; }

    let html = '';
    try {
      // cache-bust heavily for iOS Chrome
      const res = await fetch('navbar.html?v=debug7&ts=' + Date.now(), { cache: 'no-cache' });
      if (!res.ok) throw new Error(`navbar fetch ${res.status}`);
      html = await res.text();
    } catch (e) {
      log('navbar fetch failed', e);
      hudSet('HUD: fetch fail', '#b91c1c');
      return;
    }

    mount.innerHTML = html;

    // Query elements (support both tbc-* and legacy classnames)
    const root   = mount.querySelector('#tbc-navbar') || mount;
    const nav    = root.querySelector('.tbc-nav') || root.querySelector('.nav');
    const burger = root.querySelector('.tbc-hamburger') || root.querySelector('.hamburger');
    const menu   = root.querySelector('#tbcNavMenu') || root.querySelector('#navMenu');

    log('UA:', navigator.userAgent);
    log('root?', !!root, 'nav?', !!nav, 'burger?', !!burger, 'menu?', !!menu);
    hudSet(`HUD: wired=${!!burger && !!menu}`, (!!burger && !!menu) ? '#065f46' : '#b91c1c');

    if (!nav || !burger || !menu) return;

    // ensure z-index and tappability
    burger.style.pointerEvents = 'auto';
    burger.style.webkitTapHighlightColor = 'transparent';
    burger.style.touchAction = 'manipulation';
    menu.style.zIndex = (menu.style.zIndex || 0) < 3300 ? '3300' : menu.style.zIndex;

    const openMenu  = () => { menu.classList.add('open');  burger.setAttribute('aria-expanded','true');  hudSet('HUD: OPEN', '#2563eb'); log('menu -> OPEN'); };
    const closeMenu = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); hudSet('HUD: CLOSED', '#374151'); log('menu -> CLOSED'); };

    // Main event handler used by all inputs
    let lastTouchTime = 0;
    const isRecentTouch = () => (Date.now() - lastTouchTime) < 500;

    function toggleFrom(source) {
      const open = menu.classList.contains('open');
      log(`toggleFrom=${source} (open=${open})`);
      open ? closeMenu() : openMenu();
    }

    // Attach an event with common logging
    function on(el, evt, handler, opts) {
      el.addEventListener(evt, (e) => {
        hudSet(`HUD: ${evt}`, '#6b7280');
        log(`EVENT ${evt}`, { type: e.type, pointerType: e.pointerType, target: e.target });
        handler(e);
      }, opts || false);
    }

    // Pointer Events first (iOS Chrome supports them)
    if (window.PointerEvent) {
      on(burger, 'pointerdown', (e) => { if (e.pointerType === 'touch') lastTouchTime = Date.now(); });
      on(burger, 'pointerup', (e) => {
        if (e.pointerType === 'touch') lastTouchTime = Date.now();
        toggleFrom('pointerup');
      }, { passive: true });
    }

    // Touch fallback (older iOS)
    on(burger, 'touchstart', (e) => { lastTouchTime = Date.now(); }, { passive: true });
    on(burger, 'touchend', (e) => {
      lastTouchTime = Date.now();
      e.preventDefault(); // avoid ghost click
      e.stopPropagation();
      toggleFrom('touchend');
    }, { passive: false });

    // Mouse/click (desktop and non-touch)
    on(burger, 'click', (e) => {
      if (isRecentTouch()) { log('ignore synthetic click after touch'); return; }
      toggleFrom('click');
    }, { passive: true });

    // Dropdown toggles
    const dropdowns = Array.from(root.querySelectorAll('.tbc-dropdown, .dropdown'));
    const toggles   = dropdowns.map(d => d.querySelector('.tbc-dropdown-toggle, .dropdown-toggle'));
    const closeAllDropdowns = () => {
      dropdowns.forEach(d => d.classList.remove('open'));
      toggles.forEach(t => t && t.setAttribute('aria-expanded','false'));
    };
    function wireDropdown(toggleEl, dd) {
      if (!toggleEl || !dd) return;
      const activate = (src) => {
        const isOpen = dd.classList.contains('open');
        log(`dropdown ${src} ->`, isOpen ? 'close' : 'open');
        closeAllDropdowns();
        if (!isOpen) { dd.classList.add('open'); toggleEl.setAttribute('aria-expanded','true'); }
      };
      if (window.PointerEvent) {
        on(toggleEl, 'pointerup', (e) => { if (e.pointerType === 'touch') lastTouchTime = Date.now(); e.stopPropagation(); activate('pointerup'); }, { passive: true });
      }
      on(toggleEl, 'touchend', (e) => { lastTouchTime = Date.now(); e.preventDefault(); e.stopPropagation(); activate('touchend'); }, { passive: false });
      on(toggleEl, 'click', (e) => { if (isRecentTouch()) return; e.stopPropagation(); activate('click'); }, { passive: true });
    }
    toggles.forEach((t, i) => wireDropdown(t, dropdowns[i]));

    // Outside close
    on(document, 'click', (e) => { if (!root.contains(e.target)) { log('outside click -> close'); closeAllDropdowns(); closeMenu(); } }, { passive: true });
    on(document, 'touchend', (e) => { if (!root.contains(e.target)) { log('outside touchend -> close'); closeAllDropdowns(); closeMenu(); } }, { passive: true });
    on(document, 'keydown', (e) => { if (e.key === 'Escape') { log('esc -> close'); closeAllDropdowns(); closeMenu(); } });

    // Resize watchdog
    let lastWide = window.innerWidth > 720;
    on(window, 'resize', () => {
      const wide = window.innerWidth > 720;
      if (wide !== lastWide) { log('resize breakpoint -> reset'); closeAllDropdowns(); closeMenu(); lastWide = wide; }
    }, { passive: true });

    // Keep Leaflet behind navbar (safety)
    const style = document.createElement('style');
    style.textContent = `.leaflet-container { z-index: 0 !important; }`;
    document.head.appendChild(style);

    // Initial state
    closeMenu();
    hudSet('HUD: wired (tap ☰)', '#065f46');
    log('navbar wired and ready');
  }

  // Global error visibility (will print into console AND HUD)
  window.addEventListener('error', (e) => {
    console.error('[NAV] window error:', e.message, e.error);
    hudSet('HUD: ERROR (see console)', '#b91c1c');
  });

  // Kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
