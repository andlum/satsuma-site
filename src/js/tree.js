// The satsuma tree: growth, picking, cards (docs/spec-2026-11-rebrand.md).
// Reads everything from tree.njk's markup: .fruit groups with data-slug,
// data-status, data-name; a <template data-slug> per ripe fruit for its card.
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
    setTimeout(function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} }, 2600);
  }
  var grown = false;
  try { grown = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (!grown) grow();
  svg.querySelector('.trunk').addEventListener('click', grow);

  // picking
  var HOLD = 250, DETACH = 40, DROP = 24, STEM = 12; // ms, svg units
  var card = tree.querySelector('.card');
  var tip = tree.querySelector('.tip');
  var open = null;
  var narrow = matchMedia('(max-width: 639px)');

  function unit() { return svg.viewBox.baseVal.width / svg.getBoundingClientRect().width; }
  function go(c, s) { c.state = s; c.f.dataset.state = s; }
  function setPos(c, x, y) {
    c.x = x; c.y = y;
    c.body.style.transform = 'translate(' + x + 'px,' + (STEM + y) + 'px)';
    if (c.state !== 'detached' && c.state !== 'open')
      c.stem.setAttribute('d', 'M0 0Q' + x * .2 + ' ' + (STEM + y) * .6 + ' ' + x + ' ' + (STEM + y));
  }
  svg.addEventListener('animationend', function (e) {
    if (e.animationName === 'wobble') e.target.closest('.fruit').classList.remove('wobble');
  });
  // a point in the fruit's coordinates, relative to .tree
  function at(f, x, y) {
    var p = svg.createSVGPoint(); p.x = x; p.y = y;
    p = p.matrixTransform(f.parentNode.getScreenCTM());
    var r = tree.getBoundingClientRect();
    return { x: p.x - r.left, y: p.y - r.top };
  }

  function detach(c) {
    go(c, 'detached');
    c.stem.classList.add('snap');
    void c.body.getBoundingClientRect();
    setPos(c, c.x, c.y + DROP);
    openCard(c);
  }
  function spring(c) {
    go(c, 'returning');
    c.stem.classList.remove('snap');
    var x0 = c.x, y0 = c.y, t0 = performance.now();
    if (reduced) x0 = y0 = 0;
    (function step(now) {
      var t = Math.min(1, (now - t0) / 300), p = t - 1;
      var e = 1 + 2.7 * p * p * p + 1.7 * p * p;
      setPos(c, x0 * (1 - e), y0 * (1 - e));
      if (t < 1) requestAnimationFrame(step); else go(c, 'idle');
    })(t0);
  }

  function onDown(e) {
    var c = e.currentTarget.__c;
    if (e.button > 0 || (c.state && c.state !== 'idle')) return;
    c.f.setPointerCapture(e.pointerId);
    c.px = e.clientX; c.py = e.clientY;
    go(c, 'pressed');
    c.timer = setTimeout(function () { go(c, 'grabbed'); }, HOLD);
  }
  function onMove(e) {
    var c = e.currentTarget.__c;
    if (c.state !== 'grabbed' && c.state !== 'dragging') return;
    var k = unit();
    if (c.state === 'grabbed') go(c, 'dragging');
    setPos(c, (e.clientX - c.px) * k, (e.clientY - c.py) * k);
    if (Math.hypot(c.x, c.y) > DETACH) detach(c);
  }
  function onUp(e) {
    var c = e.currentTarget.__c;
    clearTimeout(c.timer);
    if (c.state === 'pressed') { go(c, 'idle'); c.f.classList.add('wobble'); }
    else if (c.state === 'grabbed' || c.state === 'dragging') spring(c);
  }

  function notYet(e) {
    var f = e.currentTarget;
    f.classList.add('wobble');
    var p = at(f, 0, -6);
    tip.textContent = f.dataset.name + ' · ' + f.dataset.status + ' · not ripe yet';
    tip.style.left = p.x + 'px'; tip.style.top = p.y + 'px'; tip.hidden = false;
    clearTimeout(tip.timer);
    tip.timer = setTimeout(function () { tip.hidden = true; }, 1800);
  }

  // card
  function openCard(c) {
    if (open && open !== c) closeCard(false);
    open = c;
    var t = tree.querySelector('template[data-slug="' + c.f.dataset.slug + '"]');
    var body = card.querySelector('.card-body');
    body.innerHTML = '';
    if (t) body.appendChild(t.content.cloneNode(true));
    body.querySelector('h2').id = 'card-title';
    tree.classList.add('has-open');
    card.hidden = false;
    go(c, 'open');
    place(c);
    card.focus();
  }
  // desktop only; phones get the bottom sheet from CSS
  function place(c) {
    if (narrow.matches) return;
    var p = at(c.f, c.x, STEM + c.y + 36);
    var w = Math.min(320, tree.clientWidth);
    var left = Math.max(0, Math.min(tree.clientWidth - w, p.x - w / 2));
    card.style.left = left + 'px'; card.style.top = p.y + 'px'; card.style.width = w + 'px';
    card.style.setProperty('--arrow', (p.x - left) + 'px');
  }
  function closeCard(refocus) {
    if (!open) return;
    var c = open; open = null;
    card.hidden = true;
    tree.classList.remove('has-open');
    spring(c);
    if (refocus !== false) c.f.focus();
  }
  card.querySelector('.close').addEventListener('click', function () { closeCard(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
  document.addEventListener('pointerdown', function (e) {
    if (open && !card.contains(e.target) && !open.f.contains(e.target)) closeCard();
  });

  // Enter or Space opens directly, no hold
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    var c = e.currentTarget.__c;
    if (c.state === 'open') closeCard();
    else if (c.state === 'idle') { go(c, 'grabbed'); detach(c); }
  }

  svg.querySelectorAll('.fruit').forEach(function (f) {
    if (!f.classList.contains('ripe')) {
      f.setAttribute('aria-hidden', 'true');
      f.addEventListener('pointerdown', notYet);
      return;
    }
    f.__c = { f: f, body: f.querySelector('.body'), stem: f.querySelector('.stem'), x: 0, y: 0, state: 'idle' };
    f.setAttribute('role', 'button');
    f.setAttribute('tabindex', '0');
    f.setAttribute('aria-label', f.dataset.name + ', ' + f.dataset.status + '. Pick to see details.');
    f.addEventListener('pointerdown', onDown);
    f.addEventListener('pointermove', onMove);
    f.addEventListener('pointerup', onUp);
    f.addEventListener('pointercancel', onUp);
    f.addEventListener('keydown', onKey);
  });
})();
