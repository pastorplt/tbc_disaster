// include-nav.js
(function injectNavbar(){
var mount = document.getElementById('navbar-include');
if (!mount) return;

fetch('navbar.html', { cache: 'no-cache' })
.then(function(r){ return r.text(); })
.then(function(html){
mount.innerHTML = html;

// Run any <script> tags that might be inside navbar.html (safety for future)
var scripts = mount.querySelectorAll('script');
scripts.forEach(function(oldScript){
var s = document.createElement('script');
if (oldScript.src) s.src = oldScript.src;
if (oldScript.type) s.type = oldScript.type;
s.text = oldScript.text || oldScript.textContent;
oldScript.replaceWith(s);
});

// ---------- Active-link highlight ----------
var file = (location.pathname.split('/').pop() || 'index.html').split('?')[0].split('#')[0];

// map file → selector in the navbar
var map = {
'network_map.html': 'a[href="network_map.html"]',
'touchpoint.html' : 'a[href="touchpoint.html"]',
'organizations.html': 'a[href="organizations.html"]',
'leaders.html'     : 'a[href="leaders.html"]',
        'networks.html'    : 'a[href="networks.html"]',
        'networks.html'    : 'a[href="networks.html"]',
        'disaster_data.html': 'a[href="disaster_data.html"]'   // <--- added
};

// Highlight exact match
var sel = map[file];
if (sel) {
var link = mount.querySelector(sel);
if (link) {
link.classList.add('active');
link.setAttribute('aria-current', 'page');
}
}

// If we’re on a View subpage, also highlight the "View ▾" parent
var viewFiles = ['organizations.html','leaders.html','networks.html'];
if (viewFiles.indexOf(file) !== -1) {
var viewRoot = mount.querySelector('.dropdown > a');
if (viewRoot) viewRoot.classList.add('active');
}

// If we’re on the root (index.html) there’s no "Home" link — logo serves as home.
})
.catch(function(err){
console.error('Navbar include failed:', err);
mount.innerHTML = '<div style="background:#bf3426;color:#fff;padding:8px 12px;">Navigation failed to load</div>';
});
})();
