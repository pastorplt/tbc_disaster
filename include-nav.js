// include-nav.js

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

  fetch('navbar.html', { cache: 'no-cache' })
    .then(function(r){ return r.text(); })
    .then(function(html){
      mount.innerHTML = html;

      // Apply domain-specific configuration
      applyNavbarConfig(mount, config);

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

      // If we're on a Maps subpage, also highlight the "Maps ▾" parent
      var mapsFiles = ['network_map.html', 'org_map.html', 'disaster_data.html'];
      if (mapsFiles.indexOf(file) !== -1) {
        var mapsDropdowns = mount.querySelectorAll('.dropdown-toggle');
        for (var i = 0; i < mapsDropdowns.length; i++) {
          if (mapsDropdowns[i].textContent.indexOf('Maps') !== -1) {
            mapsDropdowns[i].classList.add('active');
            break;
          }
        }
      }

      // If we're on a View subpage, also highlight the "View ▾" parent
      var viewFiles = ['organizations.html','leaders.html','networks.html'];
      if (viewFiles.indexOf(file) !== -1) {
        var viewDropdowns = mount.querySelectorAll('.dropdown-toggle');
        for (var i = 0; i < viewDropdowns.length; i++) {
          if (viewDropdowns[i].textContent.indexOf('View') !== -1) {
            viewDropdowns[i].classList.add('active');
            break;
          }
        }
      }

      // If we're on the root (index.html) there's no "Home" link – logo serves as home.
    })
    .catch(function(err){
      console.error('Navbar include failed:', err);
      mount.innerHTML = '<div style="background:#bf3426;color:#fff;padding:8px 12px;">Navigation failed to load</div>';
    });

  // Function to apply domain-specific navbar configuration
  function applyNavbarConfig(mount, config) {
    // Hide/show Maps dropdown
    if (!config.showMaps) {
      var mapsDropdown = mount.querySelector('.dropdown:has(.dropdown-toggle:contains("Maps"))');
      if (!mapsDropdown) {
        // Fallback for browsers that don't support :has() or :contains()
        var dropdowns = mount.querySelectorAll('.dropdown');
        for (var i = 0; i < dropdowns.length; i++) {
          var toggle = dropdowns[i].querySelector('.dropdown-toggle');
          if (toggle && toggle.textContent.indexOf('Maps') !== -1) {
            mapsDropdown = dropdowns[i];
            break;
          }
        }
      }
      if (mapsDropdown) {
        mapsDropdown.style.display = 'none';
      }
    }

    // Hide/show View dropdown
    if (!config.showView) {
      var viewDropdown = mount.querySelector('.dropdown:has(.dropdown-toggle:contains("View"))');
      if (!viewDropdown) {
        // Fallback for browsers that don't support :has() or :contains()
        var dropdowns = mount.querySelectorAll('.dropdown');
        for (var i = 0; i < dropdowns.length; i++) {
          var toggle = dropdowns[i].querySelector('.dropdown-toggle');
          if (toggle && toggle.textContent.indexOf('View') !== -1) {
            viewDropdown = dropdowns[i];
            break;
          }
        }
      }
      if (viewDropdown) {
        viewDropdown.style.display = 'none';
      }
    }

    // Hide/show Touchpoint link
    if (!config.showTouchpoint) {
      var touchpointLink = mount.querySelector('a[href="touchpoint.html"]');
      if (touchpointLink && touchpointLink.parentNode.tagName === 'LI') {
        touchpointLink.parentNode.style.display = 'none';
      }
    }
  }
})();
