// fit-embed.js
(function fitEmbeds() {
  function setHeights() {
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var NAV_H = 60; // navbar height
    document.querySelectorAll('.frame-wrap').forEach(function (wrap) {
      wrap.style.height = (vh - NAV_H) + 'px';
    });
  }
  setHeights();
  window.addEventListener('resize', setHeights);
  window.addEventListener('orientationchange', setHeights);
})();
