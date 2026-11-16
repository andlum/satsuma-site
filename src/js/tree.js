// The satsuma tree: growth, picking, the hover label (docs/spec-2026-11-rebrand.md).
// Reads everything from tree.njk's markup: .fruit elements with data-name,
// data-status and data-line; a ripe fruit is an <a href> to the project.
(function () {
  var tree = document.querySelector('.tree');
  if (!tree) return;
  var svg = tree.querySelector('svg');
  var KEY = 'satsuma:grown';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // growth: once per browser, replayed by a click on the trunk
  function grow() {
    if (reduced) return;
    svg.classList.remove('grow');
    void svg.getBoundingClientRect();
    svg.classList.add('grow');
    setTimeout(function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} }, 3200);
  }
  var grown = false;
  try { grown = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (!grown) grow();
  svg.querySelector('.trunk').addEventListener('click', grow);

  // picking: press a ripe fruit and pull. Mouse, pen and touch share one
  // path, so a drag on a phone does what a drag with a mouse does. Release
  // past DETACH and the fruit is tossed off toward its link, which then
  // opens; release short of it and the fruit springs back. A press without
  // a pull says how to pick.
  var MOVE = 4, DETACH = 40, STEM = 12; // svg units
  var FADE = 450; // ms for the page to turn orange before the link loads
  var tip = tree.querySelector('.tip');
  var peek = tree.querySelector('.peek');

  function unit() { return svg.viewBox.baseVal.width / svg.getBoundingClientRect().width; }
  function go(c, s) { c.state = s; c.f.dataset.state = s; }
  // the stem comes away with the fruit at its own length; it never stretches
  function setPos(c, x, y) {
    c.x = x; c.y = y;
    c.body.style.transform = 'translate(' + x + 'px,' + (STEM + y) + 'px)';
    c.stem.style.transform = x || y ? 'translate(' + x + 'px,' + y + 'px)' : '';
  }
  svg.addEventListener('animationend', function (e) {
    if (e.animationName === 'wobble') e.target.closest('.fruit').classList.remove('wobble');
    if (e.animationName === 'regrow') e.target.closest('.fruit').classList.remove('regrow');
  });
  // a point in the fruit's coordinates, relative to .tree
  function at(f, x, y) {
    var p = svg.createSVGPoint(); p.x = x; p.y = y;
    p = p.matrixTransform(f.parentNode.getScreenCTM());
    var r = tree.getBoundingClientRect();
    return { x: p.x - r.left, y: p.y - r.top };
  }
  function say(f, text, x, y) {
    var p = at(f, x || 0, y == null ? -6 : y);
    tip.textContent = text;
    tip.style.left = p.x + 'px'; tip.style.top = p.y + 'px'; tip.hidden = false;
    clearTimeout(tip.timer);
    tip.timer = setTimeout(function () { tip.hidden = true; }, 1800);
  }

  // the label above the tree: hover with a mouse or pen, keyboard focus, or
  // a finger on the fruit (touch has no hover)
  var shown = null;
  function show(f) {
    shown = f;
    peek.querySelector('.peek-name').textContent = f.dataset.name;
    peek.querySelector('.peek-status').textContent = f.classList.contains('ripe') ? '' : f.dataset.status;
    peek.querySelector('.peek-line').textContent = f.dataset.line;
    peek.classList.add('on');
  }
  function hide(f) {
    if (shown !== f || (f.__c && f.__c.state !== 'idle')) return;
    shown = null;
    peek.classList.remove('on');
  }

  function spring(c) {
    go(c, 'returning');
    var x0 = c.x, y0 = c.y, t0 = performance.now();
    if (reduced) x0 = y0 = 0;
    (function step(now) {
      var t = Math.min(1, (now - t0) / 300), p = t - 1;
      var e = 1 + 2.7 * p * p * p + 1.7 * p * p;
      setPos(c, x0 * (1 - e), y0 * (1 - e));
      if (t < 1) requestAnimationFrame(step);
      else { go(c, 'idle'); if (!c.f.matches(':hover, :focus-visible')) hide(c.f); }
    })(t0);
  }
  // A picked fruit turns the whole page orange, with "Taking you to…" and
  // the project's name (as in the hover label) in the middle, and the link loads in this tab behind it. The colour
  // holds until the next page paints, so there's no white flash between.
  var curtain = null, leaving = null;
  function leave(c) {
    go(c, 'leaving');
    leaving = c;
    var href = c.f.getAttribute('href');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.className = 'curtain';
      curtain.setAttribute('aria-hidden', 'true');
      curtain.innerHTML = '<span></span>';
      document.body.appendChild(curtain);
    }
    curtain.firstChild.textContent = 'Taking you to… ' + c.f.dataset.name;
    curtain.classList.remove('on');
    void curtain.offsetWidth; // restart the fade if it ran before
    curtain.classList.add('on');
    setTimeout(function () { location.assign(href); }, reduced ? 0 : FADE);
  }
  // Back from the project: the page comes out of the back-forward cache as it
  // was left, orange. Lift the curtain and grow a new fruit on the stem.
  addEventListener('pageshow', function (e) {
    if (!e.persisted || !leaving) return;
    if (curtain) curtain.classList.remove('on');
    var c = leaving; leaving = null;
    go(c, 'idle');
    setPos(c, 0, 0);
    c.f.classList.add('regrow');
    hide(c.f);
  });

  function onDown(e) {
    var c = e.currentTarget.__c;
    if (e.button > 0 || c.state !== 'idle') return;
    try { c.f.setPointerCapture(e.pointerId); } catch (err) {}
    c.px = e.clientX; c.py = e.clientY;
    go(c, 'pressed');
    show(c.f);
  }
  function onMove(e) {
    var c = e.currentTarget.__c;
    if (c.state !== 'pressed' && c.state !== 'dragging') return;
    var k = unit(), x = (e.clientX - c.px) * k, y = (e.clientY - c.py) * k;
    if (c.state === 'pressed') {
      if (Math.hypot(x, y) < MOVE) return;
      go(c, 'dragging');
    }
    setPos(c, x, y);
  }
  function onUp(e) {
    var c = e.currentTarget.__c;
    if (c.state === 'pressed') {
      go(c, 'idle');
      c.f.classList.add('wobble');
      say(c.f, 'Grab it and pull');
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') hide(c.f);
    } else if (c.state === 'dragging') {
      if (e.type === 'pointerup' && Math.hypot(c.x, c.y) > DETACH) leave(c);
      else spring(c);
    }
  }

  function notYet(e) {
    var f = e.currentTarget;
    f.classList.add('wobble');
    show(f);
    say(f, f.dataset.name + ' · ' + f.dataset.status.toLowerCase() + ' · not ready to pick yet');
  }

  // the "Pick one" cue goes for good once any fruit is hovered, focused or
  // pressed: by then the visitor has found them
  function tried() { tree.classList.add('tried'); }
  svg.querySelectorAll('.fruit').forEach(function (f) {
    ['pointerenter', 'pointerdown', 'focus'].forEach(function (t) { f.addEventListener(t, tried); });
    f.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') show(f); });
    f.addEventListener('pointerleave', function () { hide(f); });
    if (!f.hasAttribute('href')) {
      f.setAttribute('aria-hidden', 'true');
      f.addEventListener('pointerdown', notYet);
      return;
    }
    f.__c = { f: f, body: f.querySelector('.body'), stem: f.querySelector('.stem'), x: 0, y: 0, state: 'idle' };
    f.dataset.state = 'idle';
    f.addEventListener('pointerdown', onDown);
    f.addEventListener('pointermove', onMove);
    f.addEventListener('pointerup', onUp);
    f.addEventListener('pointercancel', onUp);
    // keep the page from scrolling or zooming under a finger on the fruit
    f.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    f.addEventListener('dragstart', function (e) { e.preventDefault(); }); // no native link drag
    // Enter on the focused link (a click with detail 0) picks it the same
    // way. Pointer clicks are picking gestures, handled above, so they don't
    // follow the link. A modified click still opens a new tab as usual.
    f.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (e.detail === 0 && f.__c.state === 'idle') leave(f.__c);
    });
    f.addEventListener('focus', function () { if (f.matches(':focus-visible')) show(f); });
    f.addEventListener('blur', function () { hide(f); });
  });
})();
