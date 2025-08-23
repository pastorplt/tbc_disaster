// include-nav.js
(async function () {
  const host = document.getElementById('navbar-include');
  if (!host) return;

  // Fetch & inject (cache-bust for iOS)
  const res = await fetch('navbar.html?v=cssonly1', { cache: 'no-cache' });
  if (!res.ok) { console.error('navbar fetch failed:', res.status); return; }
  host.innerHTML = await res.text();

  const root = host.querySelector('#tbc-navbar');
  if (!root) return;

  // Close the mobile menu when clicking a link (so it doesn't stay open)
  const toggle = root.querySelector('#tbcNavToggle');
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a && toggle && toggle.checked) toggle.checked = false;
  });

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
      const resp = await fetch(btn.dataset.url, {
        method: 'POST',
        headers: { 'Authorization':'Bearer '+TOKEN, 'Content-Type':'application/json' }
      });
      const txt = await resp.text();
      if (!resp.ok) return toast(`Failed: ${resp.status}`);
      try { const data = JSON.parse(txt); toast(data?.ok ? `Success (${data.features ?? 'ok'})` : 'Done'); }
      catch { toast('Done'); }
    } catch { toast('Request error'); }
  });
})();
