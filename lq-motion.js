/*! LocusQuant site motion · instrument marks + motion study · no dependencies */
/* LocusQuant instrument marks: eleven line-drawn marks on a 120 x 120 box.
   Each mark exposes set(p), p = linear progress 0..1; easing is applied inside per segment.
   p = 0 is the armed state (the object is drawn, the motion has not happened); p = 1 is rest. */
var LQMarks = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function B(t, a, b) { var u = 1 - t; return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t; }
  // cubic-bezier(0.22, 1, 0.36, 1)
  function E(x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var lo = 0, hi = 1, t = x;
    for (var i = 0; i < 22; i++) { t = (lo + hi) / 2; if (B(t, 0.22, 0.36) < x) lo = t; else hi = t; }
    return B(t, 1, 1);
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lin(p, a, b) { return clamp((p - a) / (b - a)); }
  function seg(p, a, b) { return E(lin(p, a, b)); }
  function lerp(a, b, v) { return a + (b - a) * v; }
  function keys(p, k) {
    if (p <= k[0][0]) return k[0][1];
    for (var i = 1; i < k.length; i++) {
      if (p <= k[i][0]) return lerp(k[i - 1][1], k[i][1], seg(p, k[i - 1][0], k[i][0]));
    }
    return k[k.length - 1][1];
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function drawable(e) { e.setAttribute('pathLength', '1'); e.setAttribute('stroke-dasharray', '1 1'); return e; }
  function draw(e, v) {
    e.style.strokeDashoffset = String(1 - v);
    e.style.visibility = v <= 0.0005 ? 'hidden' : '';
  }
  function P(d, cls, parent, canDraw) { var e = el('path', { d: d, 'class': cls }, parent); return canDraw ? drawable(e) : e; }
  // dashed line that draws itself: build the dash list up to v of the length
  function dashed(e, v, len, a, b) {
    if (v >= 1) { e.style.strokeDasharray = a + ' ' + b; e.style.visibility = ''; return; }
    if (v <= 0.0005) { e.style.visibility = 'hidden'; return; }
    e.style.visibility = '';
    var shown = v * len, out = [], acc = 0;
    while (acc + a + b <= shown) { out.push(a, b); acc += a + b; }
    out.push(Math.min(a, shown - acc), len + 10);
    e.style.strokeDasharray = out.join(' ');
  }

  var CSS =
    '.lqm-l{fill:none;stroke:var(--lqm-ink,#17140d);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.lqm-bg{fill:var(--lqm-paper,#f7f0e0);stroke:var(--lqm-ink,#17140d);stroke-width:2;stroke-linejoin:round}' +
    '.lqm-soft{fill:none;stroke:var(--lqm-mute,#666052);stroke-width:3.2;opacity:.75}' +
    '.lqm-thin{fill:none;stroke:var(--lqm-mute,#666052);stroke-width:1.4;stroke-linecap:round}' +
    '.lqm-fill{fill:var(--lqm-ink,#17140d)}' +
    '.lqm-gold{fill:none;stroke:var(--lqm-gold,#c9a453);stroke-width:2.6;stroke-linecap:round}' +
    '.lqm-held{fill:none;stroke:var(--lqm-held,#b02a1e);stroke-width:2;stroke-linecap:round}' +
    '.lqm-sand{fill:var(--lqm-ink,#17140d);opacity:.5}' +
    '.lqm-sandl{fill:none;stroke:var(--lqm-ink,#17140d);stroke-width:1.2;opacity:.5}' +
    '.lqm-shadow{fill:var(--lqm-ink,#17140d)}' +
    '.lqm-frak{font-family:"UnifrakturCook","Pinyon Script",serif;font-weight:700;font-size:24px;fill:var(--lqm-ink,#17140d)}';

  function injectCSS() {
    if (document.getElementById('lqm-css')) return;
    var s = document.createElement('style');
    s.id = 'lqm-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var defs = {
    assay: {
      name: 'Assay', status: 'Available', dur: 600,
      line: 'Tests whether a backtest’s edge is real.',
      build: function (g) {
        el('rect', { x: 16, y: 58, width: 88, height: 38, rx: 6, 'class': 'lqm-fill' }, g);
        var streak = P('M26 84 C 46 80, 70 74, 94 70', 'lqm-gold', g, true);
        var ingot = el('g', {}, g);
        P('M-12 0 L12 0 L8 -11 L-8 -11 Z', 'lqm-bg', ingot);
        return function (p) {
          var v = seg(p, 0.1, 1);
          draw(streak, v);
          ingot.setAttribute('transform', 'translate(' + (26 + 68 * v).toFixed(2) + ' ' + (85 - 14 * v).toFixed(2) + ')');
        };
      }
    },
    tare: {
      name: 'Tare', status: 'Available', dur: 700,
      line: 'Weighs what each data source is actually worth.',
      build: function (g) {
        P('M28 80 A32 32 0 0 1 92 80', 'lqm-thin', g);
        P('M60 42 V48 M37.4 57.4 L41.6 61.6 M82.6 57.4 L78.4 61.6', 'lqm-thin', g);
        P('M60 80 V102 M44 102 H76', 'lqm-l', g);
        var needle = P('M60 80 V46', 'lqm-l', g);
        el('circle', { cx: 60, cy: 80, r: 3.4, 'class': 'lqm-fill' }, g);
        return function (p) {
          var a = keys(p, [[0, -30], [0.38, 16], [0.62, -6], [0.82, 2], [1, 0]]);
          needle.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 60 80)');
        };
      }
    },
    scribe: {
      name: 'Scribe', status: 'Pilot', dur: 700,
      line: 'Reads filings and keeps only verified lines.',
      build: function (g) {
        var dash = '14 4 9 4 18 4 10 4';
        [['M24 36 H96'], ['M24 60 H90'], ['M24 84 H94']].forEach(function (d) {
          P(d[0], 'lqm-soft', g).setAttribute('stroke-dasharray', dash);
        });
        var ul = P('M23 43 H97', 'lqm-l', g, true);
        var st = P('M19 60 H95', 'lqm-held', g, true);
        return function (p) { draw(ul, seg(p, 0, 0.5)); draw(st, seg(p, 0.45, 0.95)); };
      }
    },
    folio: {
      name: 'Folio', status: 'In build', dur: 700,
      line: 'Keeps only what the source actually says.',
      build: function (g) {
        P('M60 34 Q40 28 16 32 V92 Q40 88 60 96 Z', 'lqm-bg', g);
        P('M60 34 Q80 28 104 32 V92 Q80 88 60 96 Z', 'lqm-bg', g);
        var pg1 = P('M60 36 Q79 31 100 34 V90 Q79 86 60 93 Z', 'lqm-bg', g);
        var pg2 = P('M60 36 Q79 31 100 34 V90 Q79 86 60 93 Z', 'lqm-bg', g);
        var rib = P('M68 33 V100 M64 105 L68 99 L72 105', 'lqm-l', g, true);
        function flip(e, sx) { e.setAttribute('transform', 'matrix(' + sx.toFixed(3) + ' 0 0 1 ' + (60 * (1 - sx)).toFixed(2) + ' 0)'); }
        return function (p) {
          flip(pg2, Math.cos(Math.PI * seg(p, 0, 0.5)));
          flip(pg1, Math.cos(Math.PI * seg(p, 0.18, 0.68)));
          draw(rib, seg(p, 0.62, 1));
        };
      }
    },
    charter: {
      name: 'Charter', status: 'In build', dur: 700,
      line: 'Sets the bounds every agent works within.',
      build: function (g) {
        var env = P('M30 22 H90 A14 14 0 0 1 104 36 V84 A14 14 0 0 1 90 98 H30 A14 14 0 0 1 16 84 V36 A14 14 0 0 1 30 22 Z', 'lqm-l', g);
        var bump = P('M104 52 V66', 'lqm-held', g, true);
        var dot = el('circle', { cx: 60, cy: 62, r: 4.6, 'class': 'lqm-fill' }, g);
        var len = 0;
        return function (p) {
          if (!len) { try { len = env.getTotalLength(); } catch (e) { len = 0; } if (!len) len = 280; }
          dashed(env, seg(p, 0, 0.45), len, 5, 4);
          var o = seg(p, 0.4, 0.72), b = seg(p, 0.74, 1);
          var x = b > 0 ? lerp(99.4, 48, b) : lerp(60, 99.4, o);
          var y = b > 0 ? lerp(59, 70, b) : lerp(62, 59, o);
          dot.setAttribute('cx', x.toFixed(2)); dot.setAttribute('cy', y.toFixed(2));
          draw(bump, seg(p, 0.68, 0.78));
        };
      }
    },
    keystone: {
      name: 'Keystone', status: 'In build', dur: 700,
      line: 'Limits how much rests on a single belief.',
      build: function (g) {
        P('M10 104 H110', 'lqm-l', g);
        var stones = [], n = 7, cx = 60, cy = 100, R = 44, r = 26;
        for (var i = 0; i < n; i++) {
          var a0 = Math.PI - (Math.PI * i) / n, a1 = Math.PI - (Math.PI * (i + 1)) / n, am = (a0 + a1) / 2;
          var pts = [[cx + R * Math.cos(a0), cy - R * Math.sin(a0)], [cx + R * Math.cos(a1), cy - R * Math.sin(a1)],
                     [cx + r * Math.cos(a1), cy - r * Math.sin(a1)], [cx + r * Math.cos(a0), cy - r * Math.sin(a0)]];
          var d = 'M' + pts.map(function (q) { return q[0].toFixed(2) + ' ' + q[1].toFixed(2); }).join(' L') + ' Z';
          stones.push({ e: P(d, 'lqm-bg', g), dx: Math.cos(am), dy: -Math.sin(am), mx: cx + 35 * Math.cos(am), my: cy - 35 * Math.sin(am) });
        }
        var key = stones[3];
        g.appendChild(key.e); // keystone on top
        var ord = [0, 6, 1, 5, 2, 4];
        return function (p) {
          ord.forEach(function (idx, k) {
            var v = seg(p, k * 0.09, k * 0.09 + 0.35), s = stones[idx], d = 12 * (1 - v);
            s.e.setAttribute('transform', 'translate(' + (s.dx * d).toFixed(2) + ' ' + (s.dy * d).toFixed(2) + ')');
          });
          var kv = seg(p, 0.62, 1), sc = lerp(1.14, 1, kv), ty = -14 * (1 - kv);
          key.e.setAttribute('transform', 'translate(0 ' + ty.toFixed(2) + ') translate(' + key.mx + ' ' + key.my + ') scale(' + sc.toFixed(3) + ') translate(' + -key.mx + ' ' + -key.my + ')');
        };
      }
    },
    hourglass: {
      name: 'Hourglass', status: 'In build', dur: 700,
      line: 'Times how long an edge lasts.',
      build: function (g) {
        var gg = el('g', {}, g);
        P('M36 18 H84 M36 102 H84', 'lqm-l', gg);
        P('M42 20 C42 44 57 52 57 60 C57 68 42 76 42 100 M78 20 C78 44 63 52 63 60 C63 68 78 76 78 100', 'lqm-l', gg);
        var top = P('M46 31 L74 31 L60 56 Z', 'lqm-sand', gg);
        var bot = P('M47 98 L73 98 L60 82 Z', 'lqm-sand', gg);
        var stream = P('M60 57 V97', 'lqm-sandl', gg);
        return function (p) {
          var r = seg(p, 0, 0.62), st = 1 - 0.9 * r, sb = 0.12 + 0.88 * r;
          top.setAttribute('transform', 'translate(60 56) scale(' + st.toFixed(3) + ') translate(-60 -56)');
          bot.setAttribute('transform', 'translate(60 98) scale(' + sb.toFixed(3) + ') translate(-60 -98)');
          stream.style.opacity = r > 0.02 && r < 0.98 ? '' : '0';
          gg.setAttribute('transform', 'rotate(' + (180 * seg(p, 0.66, 1)).toFixed(2) + ' 60 60)');
        };
      }
    },
    notary: {
      name: 'Notary', status: 'In build', dur: 600,
      line: 'Writes every decision into a ledger that cannot be altered.',
      build: function (g) {
        P('M14 104 H106', 'lqm-l', g);
        var ring = P('M36 98 A24 6 0 1 0 84 98 A24 6 0 1 0 36 98', 'lqm-l', g, true);
        var sg = el('g', {}, g);
        el('circle', { cx: 60, cy: 21, r: 7, 'class': 'lqm-bg' }, sg);
        P('M56 28 V40 M64 28 V40', 'lqm-l', sg);
        el('rect', { x: 40, y: 40, width: 40, height: 12, rx: 3, 'class': 'lqm-bg' }, sg);
        el('rect', { x: 36, y: 52, width: 48, height: 8, rx: 2, 'class': 'lqm-fill' }, sg);
        return function (p) {
          sg.setAttribute('transform', 'translate(0 ' + keys(p, [[0, 0], [0.32, 32], [0.5, 32], [1, 0]]).toFixed(2) + ')');
          draw(ring, seg(p, 0.36, 0.7));
        };
      }
    },
    quorum: {
      name: 'Quorum', status: 'In build', dur: 600,
      line: 'Asks whether agreement is real.',
      build: function (g) {
        var ys = [24, 42, 60, 78, 96], Ys = [46, 46, 46, 80, 80];
        ys.forEach(function (y) { P('M14 ' + y + ' H30', 'lqm-l', g); });
        var ls = ys.map(function (y, i) { return P('M30 ' + y + ' C 58 ' + y + ', 64 ' + Ys[i] + ', 106 ' + Ys[i], 'lqm-l', g, true); });
        return function (p) { ls.forEach(function (l, i) { draw(l, seg(p, i * 0.07, 0.62 + i * 0.07)); }); };
      }
    },
    bursar: {
      name: 'Bursar', status: 'In build', dur: 500,
      line: 'Keeps the purse beside every action.',
      build: function (g) {
        P('M26 14 V106 M94 14 V106 M26 26 H94 M26 30 H94', 'lqm-l', g);
        [44, 60, 76].forEach(function (y) {
          P('M26 ' + (y + 7) + ' H94', 'lqm-thin', g);
          P('M32 ' + y + ' H66', 'lqm-soft', g).setAttribute('stroke-dasharray', '12 3 8 3 9');
          P('M76 ' + (y - 1) + ' l3 3 l6 -6', 'lqm-l', g);
        });
        var rl = P('M26 99 H94', 'lqm-thin', g, true);
        var tx = P('M32 92 H64', 'lqm-soft', g, true);
        var tk = P('M76 91 l3 3 l6 -6', 'lqm-l', g, true);
        var cur = P('M14 -3.5 L20 0 L14 3.5 Z', 'lqm-fill', g);
        return function (p) {
          cur.setAttribute('transform', 'translate(0 ' + lerp(76, 92, seg(p, 0, 0.4)).toFixed(2) + ')');
          draw(rl, seg(p, 0.25, 0.6)); draw(tx, seg(p, 0.3, 0.65)); draw(tk, seg(p, 0.6, 0.92));
        };
      }
    },
    loqos: {
      name: 'LoQOS', status: 'In build', dur: 400,
      line: 'The foundation every instrument runs on.',
      build: function (g) {
        var lift = el('ellipse', { cx: 60, cy: 92, rx: 46, ry: 7, 'class': 'lqm-shadow' }, g);
        var press = el('ellipse', { cx: 60, cy: 81, rx: 44, ry: 3, 'class': 'lqm-shadow' }, g);
        var seal = el('g', {}, g);
        el('rect', { x: 10, y: 44, width: 100, height: 36, rx: 18, 'class': 'lqm-bg' }, seal);
        var t = el('text', { x: 60, y: 70, 'text-anchor': 'middle', 'class': 'lqm-frak' }, seal);
        t.textContent = 'LoQOS';
        return function (p) {
          var s = keys(p, [[0, 1.08], [0.7, 0.985], [1, 1]]);
          seal.setAttribute('transform', 'translate(60 62) scale(' + s.toFixed(4) + ') translate(-60 -62)');
          var v = seg(p, 0, 1);
          lift.style.opacity = String(0.12 * (1 - v));
          press.style.opacity = String(0.16 * v);
        };
      }
    }
  };

  // Mount a mark into a parent <svg> or <g>. Returns { set(p), name, ... }.
  function mount(kind, parent) {
    injectCSS();
    var d = defs[kind];
    var g = el('g', { 'class': 'lqm lqm-' + kind }, parent);
    var set = d.build(g);
    return { kind: kind, g: g, set: set, dur: d.dur, name: d.name, status: d.status, line: d.line };
  }

  return { defs: defs, mount: mount, E: E, seg: seg, lin: lin, lerp: lerp, keys: keys, el: el, draw: draw, drawable: drawable, dashed: dashed, P: P, injectCSS: injectCSS,
           order: ['assay', 'tare', 'scribe', 'folio', 'charter', 'keystone', 'hourglass', 'notary', 'quorum', 'bursar', 'loqos'] };
})();

/* ---------- LocusQuant site motion ----------
   Applies the motion study to the existing pages by their current class names.
   Install: <script src="/lq-motion.js" defer></script> after app.js on every page.
   Optional overrides before it loads: window.LQMotionConfig = { hero: false, ledger: true, ... }.
   Respects prefers-reduced-motion: everything stays in its final state. */
(function () {
  'use strict';
  var M = LQMarks;
  var cfg = Object.assign({
    hero: '[data-quill] .display, .hero .display, h1.display',
    auditLog: '.audit-log',
    stats: '.stats',
    ledger: '.ledger',          // skipped automatically when app.js already reveals it ([data-reveal])
    ink: '.ink',
    seal: '.seal',
    marks: '.inst, [data-mark]',
    ledgerRows: [
      { actor: 'Scribe', event: 'claim verified', st: 'pass' },
      { actor: 'Risk desk', event: 'ticket denied: limit', st: 'held' },
      { actor: 'Assay', event: 'backtest assayed', st: 'pass' },
      { actor: 'Research', event: 'thesis re-underwritten', st: 'pass' }
    ]
  }, window.LQMotionConfig || {});

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnim = typeof Element !== 'undefined' && 'animate' in Element.prototype;
  var hasIO = 'IntersectionObserver' in window;
  var live = !rm && canAnim && hasIO;

  var css =
    '.lqm-w{display:inline-block}' +
    '.lqm-armed .lqm-w{filter:blur(2px);opacity:.85;transform:translateY(4px)}' +
    '.lqm-odo{display:inline-flex}' +
    '.lqm-cell{display:inline-block;height:1em;overflow:hidden;line-height:1;vertical-align:baseline}' +
    '.lqm-col{display:block}.lqm-col span{display:block;height:1em;line-height:1}' +
    '.lqm-armed .lqm-col{transform:translateY(0)!important}' +
    '.lqm-ledger-armed{clip-path:inset(0 100% 0 0)}' +
    '.lqm-ink-armed{clip-path:circle(0% at 50% 50%)}' +
    '.lqm-seal-armed{transform:scale(1.08)}' +
    '.lqm-seal{position:relative;isolation:isolate}' +
    '.lqm-sh{position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none}' +
    '.lqm-sh-lift{box-shadow:0 10px 22px rgba(23,20,13,.16);opacity:0}' +
    '.lqm-sh-press{box-shadow:0 1px 2px rgba(23,20,13,.14)}' +
    '.lqm-seal-armed .lqm-sh-lift{opacity:1}.lqm-seal-armed .lqm-sh-press{opacity:0}' +
    '.lqm-logview{overflow:hidden}' +
    '.lqm-nib{position:absolute;width:14px;height:14px;opacity:0;pointer-events:none;color:var(--ink,#17140d)}' +
    '.lqm-mark{display:block;width:64px;height:64px;margin:0 0 14px -3px;overflow:visible;--lqm-paper:var(--bg-elevated,#f7f0e0);--lqm-ink:var(--ink,#17140d);--lqm-mute:var(--ink-mute,#666052);--lqm-held:var(--held,#b02a1e)}' +
    '.lqm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
  function injectCSS() {
    var s = document.createElement('style');
    s.id = 'lqm-site-css';
    s.textContent = css;
    document.head.appendChild(s);
    M.injectCSS();
  }

  function once(el, fn, threshold, margin) {
    if (!live) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: threshold == null ? 0.35 : threshold, rootMargin: margin || '0px' });
    io.observe(el);
  }

  /* 1. Ink settling: the hero headline, word by word */
  function hero() {
    if (!cfg.hero) return;
    var h = document.querySelector(cfg.hero);
    if (!h || h.dataset.lqm) return;
    h.dataset.lqm = '1';
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'lqm-w'; s.textContent = p;
            frag.appendChild(s); words.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(h);
    if (!live) return;
    h.classList.add('lqm-armed');
    once(h, function () {
      h.classList.remove('lqm-armed');
      words.forEach(function (w, i) {
        w.animate([{ filter: 'blur(2px)', opacity: 0.85, transform: 'translateY(4px)' },
                   { filter: 'blur(0px)', opacity: 1, transform: 'translateY(0)' }],
          { duration: 600, delay: i * 60, easing: EASE, fill: 'backwards' });
      });
    }, 0.2);
  }

  /* 2. The quill keeps the ledger */
  function audit() {
    var box = cfg.auditLog && document.querySelector(cfg.auditLog);
    if (!box || box.dataset.lqm) return;
    var rows = box.querySelectorAll('.log');
    if (rows.length < 2) return;
    box.dataset.lqm = '1';
    if (!live) return;
    var parent = rows[0].parentNode;
    var view = document.createElement('div'); view.className = 'lqm-logview';
    var list = document.createElement('div');
    parent.insertBefore(view, rows[0]);
    view.appendChild(list);
    Array.prototype.forEach.call(rows, function (r) { list.appendChild(r); });
    var rowH = rows[0].offsetHeight || 40, keep = rows.length;
    view.style.height = (list.offsetHeight || rowH * keep) + 'px';
    var tmpl = rows[rows.length - 1].cloneNode(true);
    tmpl.classList.remove('last');
    var sec = (function () {
      var t = rows[rows.length - 1].querySelector('.t'), m = t && /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(t.textContent);
      if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + (+(m[3] || 0));
      var d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    })();
    var hasSecs = (function () { var t = rows[0].querySelector('.t'); return !t || /\d:\d{2}:\d{2}/.test(t.textContent); })();
    function fmt(s) {
      var h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, x = s % 60;
      var a = [h, m].concat(hasSecs ? [x] : []);
      return a.map(function (n) { return (n < 10 ? '0' : '') + n; }).join(':');
    }
    var idx = 0, timer = 0, visible = false, writing = false;
    function write() {
      if (writing) return Promise.resolve();
      writing = true;
      var d = cfg.ledgerRows[idx++ % cfg.ledgerRows.length];
      var from = sec; sec += 3 + Math.floor(Math.random() * 7);
      var li = tmpl.cloneNode(true);
      var tEl = li.querySelector('.t'), ag = li.querySelector('.ag'), desc = li.querySelector('.desc'), st = li.querySelector('.st');
      if (tEl) tEl.textContent = fmt(from);
      if (ag) ag.textContent = d.actor;
      if (desc) desc.textContent = d.event;
      if (st) {
        st.classList.remove('st-pass', 'st-held');
        st.classList.add(d.st === 'pass' ? 'st-pass' : 'st-held');
        if (d.label) st.textContent = d.label;
        else st.innerHTML = d.st === 'pass' ? '✓<span class="lqm-sr"> passed</span>' : 'held';
      }
      li.style.position = 'relative';
      var nib = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      nib.setAttribute('class', 'lqm-nib'); nib.setAttribute('viewBox', '0 0 14 14'); nib.setAttribute('aria-hidden', 'true');
      nib.innerHTML = '<path d="M1.5 12.5 L4 7.5 L10.5 1 L13 3.5 L6.5 10 Z" fill="currentColor"></path>';
      li.appendChild(nib);
      if (desc) desc.style.clipPath = 'inset(0 100% 0 0)';
      if (st) st.style.opacity = '0';
      list.appendChild(li);
      var h = li.offsetHeight || rowH;
      var slide = list.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + -h + 'px)' }], { duration: 400, easing: EASE, fill: 'forwards' });
      return slide.finished.then(function () {
        list.removeChild(list.firstElementChild);
        slide.cancel();
        return new Promise(function (res) {
          var n = sec - from, i = 0, steps = Math.min(n, 6);
          if (!tEl || steps <= 0) { if (tEl) tEl.textContent = fmt(sec); return res(); }
          var id = setInterval(function () { i++; tEl.textContent = fmt(from + Math.round(n * i / steps)); if (i >= steps) { clearInterval(id); res(); } }, 40);
        });
      }).then(function () {
        if (!desc) return;
        var w = Math.min(desc.scrollWidth, desc.getBoundingClientRect().width);
        nib.style.left = (desc.offsetLeft - 2) + 'px';
        nib.style.top = (desc.offsetTop + desc.offsetHeight - 14) + 'px';
        var a = desc.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 600, easing: EASE, fill: 'forwards' });
        nib.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(' + w + 'px)', opacity: 1, offset: 0.85 }, { transform: 'translateX(' + w + 'px)', opacity: 0 }],
          { duration: 600, easing: EASE, fill: 'forwards' });
        return a.finished.then(function () { desc.style.clipPath = ''; a.cancel(); });
      }).then(function () {
        if (!st) return;
        var s = st.animate([{ opacity: 0, transform: 'scale(1.1)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 180, easing: EASE, fill: 'forwards' });
        return s.finished.then(function () { st.style.opacity = ''; s.cancel(); });
      }).catch(function () { if (desc) desc.style.clipPath = ''; if (st) st.style.opacity = ''; })
        .then(function () { writing = false; });
    }
    function schedule() {
      clearTimeout(timer);
      if (!visible || document.hidden) return;
      timer = setTimeout(function () { write().then(schedule); }, 4000);
    }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); }, { threshold: 0 }).observe(box);
    document.addEventListener('visibilitychange', schedule);
  }

  /* 3. Mechanical counter: the odometer exists only while it rolls, then the plain figures return */
  function stats() {
    if (!cfg.stats || !live) return;
    Array.prototype.forEach.call(document.querySelectorAll(cfg.stats), function (box) {
      if (box.dataset.lqm) return;
      box.dataset.lqm = '1';
      var nums = Array.prototype.filter.call(box.querySelectorAll('.num'), function (n) { return /\d/.test(n.textContent); });
      if (!nums.length) return;
      var originals = nums.map(function (n) { return n.innerHTML; });
      var cols = [];
      nums.forEach(function (num) {
        var label = num.textContent.replace(/\s+/g, ' ').trim();
        (function walk(node) {
          Array.prototype.slice.call(node.childNodes).forEach(function (n) {
            if (n.nodeType === 3 && /\d/.test(n.textContent)) {
              var frag = document.createDocumentFragment();
              n.textContent.split('').forEach(function (ch) {
                if (!/\d/.test(ch)) { frag.appendChild(document.createTextNode(ch)); return; }
                var cell = document.createElement('span'); cell.className = 'lqm-cell'; cell.setAttribute('aria-hidden', 'true');
                var col = document.createElement('span'); col.className = 'lqm-col';
                var html = ''; for (var i = 0; i < 20; i++) html += '<span>' + (i % 10) + '</span>';
                col.innerHTML = html;
                col.style.transform = 'translateY(' + -(10 + (+ch)) + 'em)';
                col.dataset.d = ch;
                cell.appendChild(col); frag.appendChild(cell); cols.push(col);
              });
              n.parentNode.replaceChild(frag, n);
            } else if (n.nodeType === 1) walk(n);
          });
        })(num);
        var sr = document.createElement('span'); sr.className = 'lqm-sr'; sr.textContent = label;
        num.insertBefore(sr, num.firstChild);
      });
      box.classList.add('lqm-armed');
      once(box, function () {
        box.classList.remove('lqm-armed');
        var anims = cols.map(function (c, i) {
          return c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + -(10 + (+c.dataset.d)) + 'em)' }],
            { duration: 700, delay: i * 60, easing: EASE, fill: 'backwards' });
        });
        Promise.all(anims.map(function (a) { return a.finished; })).then(function () {
          nums.forEach(function (n, i) { n.innerHTML = originals[i]; });
        }, function () { nums.forEach(function (n, i) { n.innerHTML = originals[i]; }); });
      });
    });
  }

  /* 4. The ledger rule */
  function ledger() {
    if (!cfg.ledger || !live) return;
    Array.prototype.forEach.call(document.querySelectorAll(cfg.ledger), function (el) {
      if (el.dataset.lqm || el.hasAttribute('data-reveal')) return;
      el.dataset.lqm = '1';
      el.classList.add('lqm-ledger-armed');
      once(el, function () {
        el.classList.remove('lqm-ledger-armed');
        el.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 500, easing: EASE, fill: 'backwards' });
      }, 0);
    });
  }

  /* 5. Ink spreading */
  function ink() {
    if (!cfg.ink || !live) return;
    Array.prototype.forEach.call(document.querySelectorAll(cfg.ink), function (el) {
      if (el.dataset.lqm) return;
      el.dataset.lqm = '1';
      el.classList.add('lqm-ink-armed');
      once(el, function () {
        el.classList.remove('lqm-ink-armed');
        el.animate([{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }], { duration: 700, easing: EASE, fill: 'backwards' });
      }, 0, '0px 0px -20% 0px'); // a fully clipped element reports no visible area, so watch its box edge
    });
  }

  /* 6. The wax seal */
  function seal() {
    if (!cfg.seal) return;
    Array.prototype.forEach.call(document.querySelectorAll(cfg.seal), function (el) {
      if (el.dataset.lqm) return;
      el.dataset.lqm = '1';
      el.classList.add('lqm-seal');
      var lift = document.createElement('span'), press = document.createElement('span');
      lift.className = 'lqm-sh lqm-sh-lift'; press.className = 'lqm-sh lqm-sh-press';
      lift.setAttribute('aria-hidden', 'true'); press.setAttribute('aria-hidden', 'true');
      el.insertBefore(press, el.firstChild); el.insertBefore(lift, el.firstChild);
      if (!live) return;
      el.classList.add('lqm-seal-armed');
      once(el, function () {
        el.classList.remove('lqm-seal-armed');
        el.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(0.985)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 400, easing: EASE, fill: 'backwards' });
        lift.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: EASE, fill: 'backwards' });
        press.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE, fill: 'backwards' });
      }, 0.6);
    });
  }

  /* 7. Instrument marks: prepended to each instrument card, once on entry, again on hover */
  function marks() {
    if (!cfg.marks) return;
    var names = Object.keys(M.defs);
    Array.prototype.forEach.call(document.querySelectorAll(cfg.marks), function (card) {
      if (card.dataset.lqmMark) return;
      var kind = (card.getAttribute('data-mark') || '').toLowerCase();
      if (!M.defs[kind]) {
        var head = card.querySelector('h1, h2, h3, h4, [class*="name"], [class*="title"]');
        var text = ((head && head.textContent) || '').toLowerCase();
        kind = names.filter(function (n) { return new RegExp('\\b' + n + '\\b').test(text); })[0];
      }
      if (!kind) return;
      card.dataset.lqmMark = kind;
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'lqm-mark');
      svg.setAttribute('viewBox', kind === 'loqos' ? '0 26 120 72' : '0 0 120 120');
      svg.setAttribute('aria-hidden', 'true');
      card.insertBefore(svg, card.firstChild);
      var m = M.mount(kind, svg), raf = 0, start = 0;
      m.set(1);
      function step(now) { var p = Math.min(1, (now - start) / m.dur); m.set(p); raf = p < 1 ? requestAnimationFrame(step) : 0; }
      function play() { if (raf || rm) return; m.set(0); start = performance.now(); raf = requestAnimationFrame(step); }
      card.__lqmPlay = play;
      card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') play(); });
      card.addEventListener('focusin', play);
      if (live) { m.set(0); once(card, play, 0.5); }
    });
  }

  function init() {
    injectCSS();
    [hero, audit, stats, ledger, ink, seal, marks].forEach(function (f) {
      try { f(); } catch (err) { if (window.console) console.warn('lq-motion:', f.name, err); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
