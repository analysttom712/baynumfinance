/* Shared "Information needed" checks for the contact form and the calculator.
   Each problem field gets a red box, a warning icon, text that starts with "Information needed:",
   aria-invalid and aria-describedby, a summary list at the top, and focus on the first problem. */
(function () {
  function clean(v) { return String(v || '').replace(/[$,\s]/g, ''); }
  window.bfaNumber = function (v) { var s = clean(v); return s === '' ? 0 : Number(s); };

  function problem(el) {
    var v = (el.value || '').trim();
    if (el.type === 'radio') {
      var group = el.form.querySelectorAll('input[name="' + el.name + '"]');
      return Array.prototype.some.call(group, function (r) { return r.checked; }) ? '' : el.dataset.msgMissing;
    }
    if (el.required && !v) return el.dataset.msgMissing || 'Information needed: please fill this in.';
    if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return el.dataset.msgInvalid;
    if (el.dataset.number !== undefined && v) {
      var n = Number(clean(v));
      if (!isFinite(n)) return el.dataset.msgInvalid || 'Information needed: use numbers only, like 1250 or 1250.50.';
      if (el.dataset.min !== undefined && n < Number(el.dataset.min)) return el.dataset.msgRange;
      if (el.dataset.minExclusive !== undefined && n <= Number(el.dataset.minExclusive)) return el.dataset.msgRange;
    }
    return '';
  }

  function show(el, msg) {
    var box = el.closest('.field');
    var err = box.querySelector('.field-error');
    var group = el.type === 'radio' ? el.form.querySelectorAll('input[name="' + el.name + '"]') : [el];
    Array.prototype.forEach.call(group, function (g) {
      var ids = (g.getAttribute('aria-describedby') || '').split(' ').filter(function (id) { return id && id !== err.id; });
      if (msg) { ids.push(err.id); g.setAttribute('aria-invalid', 'true'); } else { g.removeAttribute('aria-invalid'); }
      if (ids.length) g.setAttribute('aria-describedby', ids.join(' ')); else g.removeAttribute('aria-describedby');
    });
    box.classList.toggle('is-invalid', !!msg);
    err.textContent = msg || '';
    err.hidden = !msg;
  }

  window.bfaValidate = function (form) {
    var summary = form.querySelector('.form-summary');
    var list = summary && summary.querySelector('.form-summary__list');
    var seen = {}, bad = [];
    var fields = Array.prototype.filter.call(form.querySelectorAll('[required], [data-number]'), function (el) {
      if (el.closest('[hidden]')) return false;
      if (el.type !== 'radio') return true;
      if (seen[el.name]) return false; seen[el.name] = 1; return true;
    });
    if (list) list.innerHTML = '';
    fields.forEach(function (el) {
      var msg = problem(el); show(el, msg);
      if (msg) {
        bad.push(el);
        if (list) {
          var li = document.createElement('li'), a = document.createElement('a');
          a.href = '#' + el.id; a.textContent = msg.replace(/^Information needed:\s*/, '');
          a.addEventListener('click', function (e) { e.preventDefault(); el.focus(); });
          li.appendChild(a); list.appendChild(li);
        }
      }
    });
    if (summary) summary.hidden = bad.length === 0;
    return bad;
  };

  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var tried = false;
    form.addEventListener('submit', function (e) {
      tried = true;
      var bad = window.bfaValidate(form);
      if (bad.length) { e.preventDefault(); e.stopImmediatePropagation(); bad[0].focus(); }
    });
    form.addEventListener('change', function () { if (tried) window.bfaValidate(form); });
    form.addEventListener('focusout', function () { if (tried) window.bfaValidate(form); });
    form.addEventListener('bfa:reset', function () { tried = false; });
  });

  // Contact form: pre-select the audience from ?for=, show "trucks" only for trucking,
  // and hand the message to the visitor's own email app (nothing goes to a server).
  var cf = document.getElementById('checkup-form');
  if (!cf) return;
  var pre = new URLSearchParams(location.search).get('for');
  var map = { trucking: 'f-aud-lease', 'small-business': 'f-aud-other' };
  if (pre && map[pre]) document.getElementById(map[pre]).checked = true;
  var trucks = document.getElementById('f-trucks-field');
  function syncTrucks() {
    var v = (cf.querySelector('input[name="audience"]:checked') || {}).value || '';
    trucks.hidden = !/owner-operator|authority|fleet/.test(v);
  }
  cf.addEventListener('change', syncTrucks); syncTrucks();

  cf.addEventListener('submit', function (e) {
    e.preventDefault();
    if (cf.elements._gotcha.value) return;
    var f = cf.elements;
    var aud = (cf.querySelector('input[name="audience"]:checked') || {}).value || '';
    var lines = [
      'Name: ' + f.name.value.trim(),
      'Email: ' + f.email.value.trim(),
      'I am: ' + aud
    ];
    if (!trucks.hidden && f.trucks.value) lines.push('Trucks: ' + f.trucks.value);
    lines.push('Uses QuickBooks Online: ' + f.qbo.value);
    if (f.message.value.trim()) lines.push('', f.message.value.trim());
    var href = 'mailto:tom@baynumfinancial.com?subject=' + encodeURIComponent('Books Checkup request from ' + f.name.value.trim()) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    if (typeof gtag === 'function') gtag('event', 'checkup_form_sent', { audience: aud });
    window.location.href = href;
    var done = document.getElementById('form-done');
    done.hidden = false; cf.hidden = true;
    done.querySelector('h2').focus();
  });
})();
