/* Free cost-per-mile calculator. Runs only in the browser; nothing is sent or saved. */
(function () {
  var form = document.getElementById('cpm-form');
  if (!form) return;
  var n = window.bfaNumber;
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var cents = function (x) { return usd.format(x); };
  var fixedIds = ['c-payment', 'c-insurance', 'c-permits'];
  var varIds = ['c-fuel', 'c-maint', 'c-tolls', 'c-pay', 'c-other'];
  var out = {
    big: document.getElementById('r-cpm'), total: document.getElementById('r-total'),
    fixed: document.getElementById('r-fixed'), variable: document.getElementById('r-var'),
    rpm: document.getElementById('r-rpm'), ppm: document.getElementById('r-ppm'),
    say: document.getElementById('r-say'), load: document.getElementById('r-load'),
    revRows: document.querySelectorAll('.r-rev'), note: document.getElementById('r-example')
  };
  function val(id) { var x = n(document.getElementById(id).value); return isFinite(x) ? x : NaN; }
  function sum(ids) { return ids.reduce(function (s, id) { return s + val(id); }, 0); }

  function render() {
    var miles = val('c-miles');
    var fixed = sum(fixedIds), variable = sum(varIds);
    var anyNeg = fixedIds.concat(varIds).some(function (id) { return val(id) < 0; });
    var bad = !(miles > 0) || isNaN(fixed) || isNaN(variable) || anyNeg;
    if (bad) {
      out.big.textContent = '—';
      out.say.textContent = !(miles > 0) ? 'Add your miles to see a result.' : 'Fix the boxes marked "Information needed" to see a result.';
      [out.total, out.fixed, out.variable, out.rpm, out.ppm].forEach(function (o) { o.textContent = '—'; });
      out.load.textContent = '';
      return;
    }
    var total = fixed + variable, cpm = total / miles;
    out.big.textContent = cents(cpm) + ' per mile';
    out.total.textContent = cents(total);
    out.fixed.textContent = cents(fixed / miles) + '/mi';
    out.variable.textContent = cents(variable / miles) + '/mi';
    out.say.textContent = 'Below ' + cents(cpm) + ' per mile, you lose money on a load.';
    out.say.className = 'calc-say';

    var rev = val('c-revenue');
    var showRev = rev > 0;
    out.revRows.forEach(function (r) { r.hidden = !showRev; });
    if (showRev) {
      var rpm = rev / miles, ppm = rpm - cpm;
      out.rpm.textContent = cents(rpm) + '/mi';
      out.ppm.textContent = (ppm < 0 ? 'Loss ' : '') + cents(ppm) + '/mi';
      out.ppm.className = ppm < 0 ? 'is-loss' : 'is-gain';
      out.say.textContent = ppm >= 0
        ? 'At these numbers you keep ' + cents(ppm) + ' for every mile. Below ' + cents(cpm) + ' per mile, you lose money on a load.'
        : 'At these numbers you lose ' + cents(-ppm) + ' on every mile (a loss). You need more than ' + cents(cpm) + ' per mile to break even.';
    }

    var pay = val('c-load-pay'), lmiles = val('c-load-miles');
    if (pay > 0 && lmiles > 0) {
      var lr = pay / lmiles, diff = (lr - cpm) * lmiles;
      out.load.textContent = 'That load pays ' + cents(lr) + ' per mile, counting deadhead. ' +
        (diff >= 0 ? 'You would clear about ' + cents(diff) + ' after costs.' : 'You would lose about ' + cents(-diff) + ' on it (a loss).');
      out.load.className = diff >= 0 ? 'is-gain calc-say' : 'is-loss calc-say';
    } else {
      out.load.textContent = '';
    }
  }

  form.addEventListener('input', function () { out.note.hidden = true; render(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = window.bfaValidate(form);
    if (bad.length) { bad[0].focus(); return; }
    render();
    if (typeof gtag === 'function') gtag('event', 'calculator_used');
    document.getElementById('calc-result').focus();
  });
  document.getElementById('c-clear').addEventListener('click', function () {
    form.querySelectorAll('input').forEach(function (i) { i.value = ''; });
    out.note.hidden = true;
    window.bfaClear(form);
    form.dispatchEvent(new Event('bfa:reset'));
    render();
    document.getElementById('c-miles').focus();
  });
  render();
})();
