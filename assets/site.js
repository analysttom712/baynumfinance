/* Baynum Financial & Analytics - menu, landing glow, theme toggle. No libraries. */
(function () {
  // Mobile menu: one button, works without JS (links just wrap under the bar).
  var b = document.querySelector('.nav-toggle'), nav = document.getElementById('site-nav');
  if (b && nav) {
    b.hidden = false;
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      b.textContent = open ? 'Close' : 'Menu';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { b.click(); b.focus(); }
    });
  }

  // Landing glow: restart it when the same link is tapped twice, and move focus to the section.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    var el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    el.classList.remove('is-landed'); void el.offsetWidth; el.classList.add('is-landed');
    if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
    setTimeout(function () { el.focus({ preventScroll: true }); }, 0);
    setTimeout(function () { el.classList.remove('is-landed'); }, 2600);
  });

  // Theme toggle: follows the phone's setting until the visitor picks one.
  var root = document.documentElement;
  function isDark() { return root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (t) {
    function label() { t.setAttribute('aria-pressed', String(isDark())); t.title = isDark() ? 'Switch to light theme' : 'Switch to dark theme'; }
    label();
    t.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
    });
  });

  // Keep sticky banners (sample dashboard) just under the sticky header.
  var hdr = document.querySelector('.site-header');
  function setH() { if (hdr) root.style.setProperty('--header-h', hdr.offsetHeight + 'px'); }
  setH(); addEventListener('resize', setH);

  // Count key button clicks in Google Analytics (never sends form contents or numbers).
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (typeof gtag === 'function') gtag('event', el.dataset.track, { page: location.pathname });
    });
  });
})();
