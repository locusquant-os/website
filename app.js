// Shared behaviour for every LocusQuant page: the inline early-access form.
// Page-specific effects (wordmark dock, scroll reveals) stay inline on their
// own page.
(function () {
    'use strict';

    // ── Early access form (inline, submits via Web3Forms) ──
    var WEB3FORMS_KEY = "a91d092d-9247-49a5-98f2-77c461eee51d";
    var form = document.getElementById('access-form');
    if (!form) return; // page without the form markup, nothing more to wire

    var status = document.getElementById('access-status');
    var submitBtn = document.getElementById('access-submit');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        // Honeypot: if the hidden checkbox is set, silently drop (treat as bot).
        if (fd.get('botcheck')) return;

        var name = (fd.get('name') || '').toString().trim();
        var email = (fd.get('email') || '').toString().trim();
        var firm = (fd.get('firm') || '').toString().trim();
        var role = (fd.get('role') || '').toString().trim();
        var firmType = (fd.get('firm_type') || '').toString().trim();
        var useCase = (fd.get('use_case') || '').toString().trim();

        if (!name || !email || !firm || !role || !firmType) {
            status.className = 'modal-status failure';
            status.innerHTML = 'Please fill in every required field.<span class="modal-status-sub">Name, work email, firm, role and type of firm are all required.</span>';
            return;
        }

        var payload = {
            access_key: WEB3FORMS_KEY,
            subject: "LocusQuant early access request from " + name + " (" + firm + ")",
            name: name,
            email: email,
            firm: firm,
            role: role,
            firm_type: firmType,
            use_case: useCase || "(not provided)",
            from_url: window.location.href,
            botcheck: false
        };

        submitBtn.disabled = true;
        status.className = 'modal-status pending';
        status.textContent = 'Sending your request…';

        try {
            var res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            var data = await res.json().catch(function () { return {}; });
            if (res.ok && data.success) {
                form.style.display = 'none';
                status.className = 'modal-status success';
                status.textContent = "Thanks. We'll be in touch within a few days.";
            } else {
                throw new Error((data && data.message) || 'submit failed');
            }
        } catch (err) {
            submitBtn.disabled = false;
            status.className = 'modal-status failure';
            status.innerHTML = 'Something went wrong.<span class="modal-status-sub">Please try again in a moment.</span>';
        }
    });
})();

// ── Staggered scroll reveals (runs on every page) ──────────────
(function () {
    var sections = document.querySelectorAll('.reveal-on-scroll');
    if (!sections.length) return;

    function stagger(section) {
        var kids = section.querySelectorAll(
            '.features-grid > *, .who-grid > *, .problem-list > *, ' +
            '.scene-list > *, .faq-list > *, .status-line');
        kids.forEach(function (k, i) { k.style.transitionDelay = (0.05 + i * 0.06).toFixed(2) + 's'; });
        // Clear the delays after the entrance so hover stays snappy.
        setTimeout(function () {
            kids.forEach(function (k) { k.style.transitionDelay = ''; });
        }, 1500);
    }

    if (!('IntersectionObserver' in window)) {
        sections.forEach(function (s) { s.classList.add('is-visible'); });
        return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            stagger(entry.target);
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    sections.forEach(function (s) { io.observe(s); });
})();

// ── Autonomous ink pen (pointer devices only) ──────────────────
// Trails the cursor while you move. When you go idle (incl. while
// scrolling) it wanders off and orbits the section box in view; the
// moment you move again it eases back to your cursor and trails you.
(function () {
    if (!window.matchMedia) return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1500';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var mouse = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
    var pen = { x: mouse.x, y: mouse.y };
    var center = { x: mouse.x, y: mouse.y };
    var pts = [];
    var angle = Math.random() * Math.PI * 2;
    var lastMove = -1e9;

    window.addEventListener('mousemove', function (e) {
        // Safari fires mousemove on scroll with the cursor stationary; ignore
        // those (same coords) so scrolling doesn't yank the pen to the cursor.
        if (e.clientX === mouse.x && e.clientY === mouse.y) return;
        mouse.x = e.clientX; mouse.y = e.clientY; lastMove = performance.now();
    });

    // Section boxes the pen will orbit when idle.
    var SEL = '.hero-visual, .signal-band, .features-grid, .who-grid, .problem-list, ' +
        '.scene-list, .status-panel, .access-panel, .faq-list, .close-cta, .ink-final';
    var targets = Array.prototype.slice.call(document.querySelectorAll(SEL));
    var finals = Array.prototype.slice.call(document.querySelectorAll('.ink-final'));
    var darkEls = Array.prototype.slice.call(document.querySelectorAll('.signal-band, .band-dark, .site-footer, .btn-primary'));
    var homepage = !!document.querySelector('.hero-clarity');
    function ready() { return !homepage || document.body.classList.contains('intro-done'); }

    // Ink turns cream over dark backgrounds (the full-bleed dark bands, primary buttons).
    function overDark(x, y) {
        for (var i = 0; i < darkEls.length; i++) {
            var r = darkEls[i].getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
        }
        return false;
    }
    var inkMix = 0; // 0 = dark ink, 1 = cream ink

    // The fiber-grass field has its own cursor interaction (blades bend away);
    // the ink trail steps aside there so the two effects don't fight.
    var fiberEl = document.querySelector('.fiber-stage');
    function overFiber(x, y) {
        if (!fiberEl) return false;
        var r = fiberEl.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    var focus = null, lastFocus = 0;
    function pickFocus() {
        // At the very bottom, frame the final call-to-action so it invites a click.
        var atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 130);
        if (atBottom) {
            for (var f = 0; f < finals.length; f++) {
                var fr = finals[f].getBoundingClientRect();
                if (fr.bottom > 40 && fr.top < window.innerHeight - 20) return fr;
            }
        }
        var vc = window.innerHeight / 2, best = null, bestD = 1e9;
        for (var i = 0; i < targets.length; i++) {
            var r = targets[i].getBoundingClientRect();
            if (r.bottom < 60 || r.top > window.innerHeight - 60) continue;
            if (r.width < 40 || r.height < 20) continue;
            var d = Math.abs((r.top + r.bottom) / 2 - vc);
            if (d < bestD) { bestD = d; best = r; }
        }
        return best;
    }

    function frame(now) {
        var inGrass = overFiber(mouse.x, mouse.y);
        var active = (now - lastMove) < 3200 && !inGrass;
        var canAuto = ready() && !inGrass;
        var auto = !active && canAuto;

        if (active || canAuto) {
            var tx, ty, ease;
            if (active) {
                tx = mouse.x; ty = mouse.y;
                // Smooth glide back when far (returning from an orbit); snappier up close.
                var dx = mouse.x - pen.x, dy = mouse.y - pen.y;
                ease = Math.sqrt(dx * dx + dy * dy) > 150 ? 0.08 : 0.26;
            } else {
                if (now - lastFocus > 180) { focus = pickFocus(); lastFocus = now; }
                if (focus) {
                    center.x += (focus.left + focus.width / 2 - center.x) * 0.06;
                    center.y += (focus.top + focus.height / 2 - center.y) * 0.06;
                    angle += 0.011;
                    tx = center.x + Math.cos(angle) * (focus.width / 2 + 30);
                    ty = center.y + Math.sin(angle) * (focus.height / 2 + 30);
                } else {
                    angle += 0.01;
                    tx = window.innerWidth / 2 + Math.cos(angle) * 150;
                    ty = window.innerHeight / 2 + Math.sin(angle * 1.3) * 90;
                }
                ease = 0.12;
            }
            pen.x += (tx - pen.x) * ease;
            pen.y += (ty - pen.y) * ease;
            pts.push({ x: pen.x, y: pen.y, life: 1 });
            if (pts.length > 55) pts.shift();
        }

        // Blend the ink colour toward cream while over a dark background.
        inkMix += ((overDark(pen.x, pen.y) ? 1 : 0) - inkMix) * 0.2;
        var ink = Math.round(23 + 222 * inkMix) + ',' +
            Math.round(20 + 222 * inkMix) + ',' + Math.round(13 + 221 * inkMix) + ',';

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        var n = pts.length;
        for (var i = 0; i < n; i++) pts[i].life -= 0.04;
        while (pts.length && pts[0].life <= 0) pts.shift();
        n = pts.length;
        var alpha = auto ? 0.58 : 1;
        if (n > 1) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (var j = 1; j < n; j++) {
                var a = pts[j - 1], b = pts[j];
                var frac = j / n;                       // 0 = tail, 1 = at nib
                var life = (a.life + b.life) / 2;
                ctx.lineWidth = (frac * frac * 12 * life + 0.4) * (auto ? 0.7 : 1);
                ctx.strokeStyle = 'rgba(' + ink + ((0.12 + frac * 0.62 * life) * alpha).toFixed(3) + ')';
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                ctx.quadraticCurveTo(a.x, a.y, mx, my);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            var head = pts[n - 1];
            ctx.fillStyle = 'rgba(' + ink + (0.88 * head.life * alpha).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(head.x, head.y, (auto ? 4 : 6) * (0.55 + head.life * 0.45), 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
