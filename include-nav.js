<!-- include-nav.js -->
<script>
(async function () {
  const mount = document.getElementById('navbar-include');
  if (!mount) return;

  // Fetch and inject the navbar HTML
  const res = await fetch('navbar.html', { cache: 'no-cache' });
  const html = await res.text();
  mount.innerHTML = html;

  // After inject, attach behavior (scripts inside fetched HTML don't run)
  const nav     = mount.querySelector('.nav');
  const burger  = nav?.querySelector('.hamburger');
  const menu    = nav?.querySelector('#navMenu');

  if (!nav || !burger || !menu) return;

  function closeMenu(){ menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  function openMenu(){ menu.classList.add('open'); burger.setAttribute('aria-expanded','true'); }

  burger.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Dropdowns (supports one or many)
  const dropdowns = Array.from(nav.querySelectorAll('.dropdown'));
  const toggles   = dropdowns.map(d => d.querySelector('.dropdown-toggle'));

  function closeAllDropdowns(){
    dropdowns.forEach(d => d.classList.remove('open'));
    toggles.forEach(t => t && t.setAttribute('aria-expanded','false'));
  }

  toggles.forEach((toggle, i) => {
    const dd = dropdowns[i];
    if (!toggle || !dd) return;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dd.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) { dd.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
    });
  });

  // Close on outside click / ESC / resize
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) { closeAllDropdowns(); closeMenu(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAllDropdowns(); closeMenu(); } });

  let lastWide = window.innerWidth > 720;
  window.addEventListener('resize', () => {
    const wide = window.innerWidth > 720;
    if (wide !== lastWide) { closeAllDropdowns(); closeMenu(); lastWide = wide; }
  });

  // ===== Admin POST buttons (Regen) =====
  const REGEN_TOKEN = '2025';
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
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
  mount.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-action');
    if (!btn) return;
    e.preventDefault();
    postAdmin(btn.getAttribute('data-url'));
  });
})();
</script>
