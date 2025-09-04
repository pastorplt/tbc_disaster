// include-nav.js (safe cross-browser version)

// ========== CONFIGURATION ==========
// Define which navigation items to show for each domain
const NAVBAR_CONFIG = {
  'app.tbc.city': {
    showMaps: true,
    showView: true,
    showTouchpoint: true
  },
  'maps.tbc.city': {
    showMaps: true,
    showView: false,
    showTouchpoint: false
  },
  // Default configuration for other domains (including localhost, staging, etc.)
  'default': {
    showMaps: true,
    showView: true,
    showTouchpoint: true
  }
};
// ===================================

(function injectNavbar(){
  var mount = document.getElementById('navbar-include');
  if (!mount) return;

  // Determine current domain configuration
  var hostname = window.location.hostname;
  var config = NAVBAR_CONFIG[hostname] || NAVBAR_CONFIG['default'];

  // Add a version query to defeat CDN caches when updating
  var VERSION = '2025-09-04-2';

  fetch('navbar.html?v=' + encodeURIComponent(VERSION), { cache: 'no-cache' })
    .then(function(r){ return r.text(); })
    .then(function(html){
      mount.innerHTML = html;

      // Apply domain-specific configuration safely
      try {
        applyNavbarConfig(mount, config);
      } catch (e) {
        console.error('applyNavbarConfig error:', e);
      }

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
        'org_map.html': 'a[href="org_map.html"]',
        'disaster_data.html': 'a[href="disaster_data.html"]',
        'touchpoint.html': 'a[href="touchpoint.html"]',
        'organizations.html': 'a[href="organizations.html"]',
        'leaders.html': 'a[href="leaders.html"]',
        'networks.html': 'a[href="networks.html"]',
        'network_prayer_request.html': 'a[href="/network_prayer_request.html"]'
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

      // If we're on a Maps subpage, also highlight the "Maps" parent
      var mapsFiles = ['network_map.html', 'org_map.html', 'disaster_data.html'];
      if (mapsFiles.indexOf(file) !== -1) {
        var mapsDropdown = findDropdownByLabel(mount, 'Maps');
        if (mapsDropdown) {
          var toggle = mapsDropdown.querySelector('.dropdown-toggle');
          if (toggle) toggle.classList.add('active');
        }
      }

      // If we're on a View subpage, also highlight the "View" parent
      var viewFiles = ['organizations.html','leaders.html','networks.html'];
      if (viewFiles.indexOf(file) !== -1) {
        var viewDropdown = findDropdownByLabel(mount, 'View');
        if (viewDropdown) {
          var toggle2 = viewDropdown.querySelector('.dropdown-toggle');
          if (toggle2) toggle2.classList.add('active');
        }
      }

      // If we're on the root (index.html) there's no "Home" link – logo serves as home.
    })
    .catch(function(err){
      console.error('Navbar include failed:', err);
      mount.innerHTML = '<div style="background:#bf3426;color:#fff;padding:8px 12px;">Navigation failed to load</div>';
    });

  // ------ Helpers ------
  function findDropdownByLabel(root, labelText) {
    // Searches for .dropdown whose .dropdown-toggle contains labelText
    var dropdowns = root.querySelectorAll('.dropdown');
    for (var i = 0; i < dropdowns.length; i++) {
      var toggle = dropdowns[i].querySelector('.dropdown-toggle');
      if (toggle && typeof toggle.textContent === 'string' && toggle.textContent.indexOf(labelText) !== -1) {
        return dropdowns[i];
      }
    }
    return null;
  }

  function hideElement(el) {
    if (el && el.style) el.style.display = 'none';
  }

  // Function to apply domain-specific navbar configuration
  function applyNavbarConfig(mount, config) {
    // Hide/show Maps dropdown
    if (!config.showMaps) {
      var mapsDropdown = findDropdownByLabel(mount, 'Maps');
      hideElement(mapsDropdown);
    }

    // Hide/show View dropdown
    if (!config.showView) {
      var viewDropdown = findDropdownByLabel(mount, 'View');
      hideElement(viewDropdown);
    }

    // Hide/show Touchpoint link
    if (!config.showTouchpoint) {
      var touchpointLink = mount.querySelector('a[href="touchpoint.html"]');
      if (touchpointLink && touchpointLink.parentNode && touchpointLink.parentNode.tagName === 'LI') {
        hideElement(touchpointLink.parentNode);
      }
    }
  }
})();
