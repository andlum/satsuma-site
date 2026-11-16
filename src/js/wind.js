// Rustle for the satsuma tree. The tree stands still; moving the pointer over
// it (or swiping across it on a phone) rustles the leaves under the pointer,
// nudges any fruit it passes and stirs the grass. Nothing else moves.
//
// The model is a handful of "puffs": small discs of moving air left behind
// the pointer, which fade. Each leaf, fruit and grass tuft is a damped spring
// pushed by the puffs over it. The loop only runs while something is moving.
(function () {
  var tree = document.querySelector('.tree');
  if (!tree || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var svg = tree.querySelector('svg');
  var RAD = Math.PI / 180;

  // The moving parts, read once from the markup.
  function placed(el) { // the translate / rotate / scale on an element's parent <g>
    var t = el.parentNode.getAttribute('transform') || '';
    var at = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(t) || [0, 0, 0];
    var rot = /rotate\(([-\d.]+)/.exec(t);
    var flip = /scale\((-)/.test(t);
    return { x: +at[1], y: +at[2], rot: rot ? +rot[1] * RAD : 0, flip: flip ? -1 : 1 };
  }
  function spring(el, extra) {
    var p = placed(el);
    var s = { el: el, x: p.x, y: p.y, cos: Math.cos(p.rot) * p.flip, sin: Math.sin(p.rot) * p.flip, a: 0, va: 0, on: false,
              f: 16 + Math.random() * 14, ph: Math.random() * 6.3 };
    for (var k in extra) s[k] = extra[k];
    return s;
  }
  var each = function (sel, fn) { return Array.prototype.map.call(svg.querySelectorAll(sel), fn); };
  // k: stiffness, c: damping, gain: degrees of pull per unit of wind, flutter, max: clamp
  var leaves = each('use.leaf', function (el) { return spring(el, { k: 130, c: 5, gain: 5, flutter: 5, max: 32 }); });
  var tufts = each('use.tuft', function (el) { return spring(el, { k: 90, c: 5, gain: 5, flutter: 1.5, max: 30 }); });
  var fruits = each('.fruit', function (el) { // hangs straight down, so only sideways air swings it
    var s = spring(el, { k: 42, c: 1.8, gain: -1.6, flutter: 0, max: 22 });
    s.cos = 1; s.sin = 0; s.y += 20;
    return s;
  });
  var parts = leaves.concat(tufts, fruits);

  var puffs = [], running = false, last = 0;

  function puff(x, y, vx, vy, r, life) {
    puffs.push({ x: x, y: y, vx: vx, vy: vy, r: r, life: life, age: 0 });
    if (puffs.length > 10) puffs.shift();
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  }

  var wx = 0, wy = 0;
  function windAt(x, y) {
    wx = wy = 0;
    for (var i = 0; i < puffs.length; i++) {
      var p = puffs[i], d = Math.hypot(x - p.x, y - p.y) / p.r;
      if (d >= 1) continue;
      var t = p.age / p.life;
      var s = (1 - d * d) * (t < .15 ? t / .15 : 1 - (t - .15) / .85);
      wx += p.vx * s; wy += p.vy * s;
    }
  }

  function rest(s) {
    s.a = s.va = 0; s.on = false;
    if (s.q) { s.q = 0; s.el.style.transform = ''; }
  }

  function frame(now) {
    var dt = Math.min(.032, (now - last) / 1000); last = now;
    var t = now / 1000, i, s, live = puffs.length > 0;

    // the box the live puffs cover: a part outside it feels no air, so it
    // skips windAt, and if it's also at rest it costs nothing this frame
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (i = puffs.length - 1; i >= 0; i--) {
      var p = puffs[i];
      p.age += dt;
      if (p.age >= p.life) { puffs.splice(i, 1); continue; }
      if (p.x - p.r < x0) x0 = p.x - p.r; if (p.x + p.r > x1) x1 = p.x + p.r;
      if (p.y - p.r < y0) y0 = p.y - p.r; if (p.y + p.r > y1) y1 = p.y + p.r;
    }

    for (i = 0; i < parts.length; i++) {
      s = parts[i];
      if (s.x > x0 && s.x < x1 && s.y > y0 && s.y < y1) windAt(s.x, s.y);
      else if (!s.on) continue;
      else wx = wy = 0;
      var along = wx * s.cos + wy * s.sin; // air across the part, in its own frame
      var mag = Math.abs(wx) + Math.abs(wy);
      if (!mag && !s.on) continue;
      if (s.el.dataset.state && s.el.dataset.state !== 'idle') { rest(s); continue; } // a fruit being picked
      var force = s.gain * along + s.flutter * mag * Math.sin(t * s.f + s.ph);
      s.va += (force - s.k * s.a - s.c * s.va) * dt;
      s.a += s.va * dt;
      if (s.a > s.max) { s.a = s.max; s.va = 0; } else if (s.a < -s.max) { s.a = -s.max; s.va = 0; }
      if (!mag && Math.abs(s.a) < .15 && Math.abs(s.va) < 2) { rest(s); continue; }
      s.on = live = true;
      // Half a degree is finer than the eye can follow on a leaf this size.
      // Writing only when the rounded angle changes spares the browser a
      // style and paint pass for every part that has barely moved.
      var q = Math.round(s.a * 2) / 2;
      if (q !== s.q) { s.q = q; s.el.style.transform = q ? 'rotate(' + q + 'deg)' : ''; }
    }

    if (live) requestAnimationFrame(frame); else running = false;
  }

  // Pointer: each stretch of movement leaves a puff where the pointer is,
  // blowing the way it was going. Slow movement still rustles a little.
  var prev = null, lastPuff = 0;
  function toSvg(e) {
    var m = svg.getScreenCTM();
    return m ? [(e.clientX - m.e) / m.a, (e.clientY - m.f) / m.d] : [0, 0];
  }
  svg.addEventListener('pointermove', function (e) {
    var p = toSvg(e), now = e.timeStamp;
    if (prev && now > prev.t && now - prev.t < 200 && now - lastPuff > 45) {
      var dt = Math.max(8, now - prev.t) / 1000;
      var vx = (p[0] - prev.x) / dt, vy = (p[1] - prev.y) / dt, speed = Math.hypot(vx, vy);
      if (speed > 8) {
        var push = Math.min(260, Math.max(90, speed * .4)) / speed; // 90 to 260 units, whatever the hand speed
        lastPuff = now;
        puff(p[0], p[1], vx * push, vy * push, 44, .6);
      }
    }
    prev = { x: p[0], y: p[1], t: now };
  }, { passive: true });
  svg.addEventListener('pointerleave', function () { prev = null; });
})();
