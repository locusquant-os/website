// Shared behaviour for every LocusQuant page: the reusable contact modal.
// Page-specific effects (wordmark dock, scroll reveals) stay inline on their
// own page.
(function () {
    'use strict';

    // ── Contact modal (single reusable component, recipient-parameterized) ──
    var modal = document.getElementById('contact-modal');
    if (!modal) return; // page without the modal markup, nothing more to wire

    var WEB3FORMS_KEY = "a91d092d-9247-49a5-98f2-77c461eee51d";
    var RECIPIENTS = {
        both: { intended_for: "Both founders", tag: "[ACCESS REQUEST]", heading: "Request Access" },
        divyanshu: { intended_for: "Divyanshu", tag: "[FOR: DIVYANSHU]", heading: "Contact Divyanshu" },
        ayush: { intended_for: "Ayush", tag: "[FOR: AYUSH]", heading: "Contact Ayush" }
    };

    var modalHeading = document.getElementById('modal-heading');
    var modalRecipient = document.getElementById('modal-recipient');
    var contactForm = document.getElementById('contact-form');
    var modalStatus = document.getElementById('modal-status');
    var modalSubmit = document.getElementById('modal-submit');
    var firstField = document.getElementById('cf-name');
    var currentRecipient = RECIPIENTS.both;

    function openModal(key) {
        currentRecipient = RECIPIENTS[key] || RECIPIENTS.both;
        modalHeading.textContent = currentRecipient.heading;
        modalRecipient.textContent = "// intended_for: " + currentRecipient.intended_for;
        contactForm.reset();
        contactForm.style.display = '';
        modalStatus.textContent = '';
        modalStatus.className = 'modal-status';
        modalSubmit.disabled = false;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // Focus the first field once the modal is painted.
        if (firstField) {
            setTimeout(function () { firstField.focus(); }, 50);
        }
    }

    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-modal]').forEach(function (el) {
        el.addEventListener('click', function () { openModal(el.getAttribute('data-modal')); });
    });
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var fd = new FormData(contactForm);
        // Honeypot: if the hidden checkbox is set, silently drop (treat as bot).
        if (fd.get('botcheck')) return;

        var name = (fd.get('name') || '').toString().trim();
        var email = (fd.get('email') || '').toString().trim();
        var message = (fd.get('message') || '').toString().trim();
        if (!name || !email || !message) {
            modalStatus.className = 'modal-status failure';
            modalStatus.innerHTML = '$ missing_fields ✕<span class="modal-status-sub">Name, email and message are all required.</span>';
            return;
        }

        var payload = {
            access_key: WEB3FORMS_KEY,
            subject: "LocusQuant " + currentRecipient.tag + " from " + (name || "anonymous"),
            name: name,
            email: email,
            message: message,
            intended_for: currentRecipient.intended_for,
            from_url: window.location.href,
            botcheck: false
        };

        modalSubmit.disabled = true;
        modalStatus.className = 'modal-status pending';
        modalStatus.textContent = '$ transmitting...';

        try {
            var res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            var data = await res.json().catch(function () { return {}; });
            if (res.ok && data.success) {
                contactForm.style.display = 'none';
                modalStatus.className = 'modal-status success';
                modalStatus.innerHTML = '$ request_transmitted ✓<span class="modal-status-sub">We\'ll be in touch. You can close this window.</span>';
            } else {
                throw new Error((data && data.message) || 'submit failed');
            }
        } catch (err) {
            modalSubmit.disabled = false;
            modalStatus.className = 'modal-status failure';
            modalStatus.innerHTML = '$ transmission_failed ✕<span class="modal-status-sub">Please try again in a moment.</span>';
        }
    });
})();

// ── Sub-page header wordmark: collapse LocusQuant → LQ on scroll ──
(function () {
    var header = document.querySelector('header');
    var brand = document.querySelector('.nav-brand');
    if (!header || !brand) return; // homepage uses the animated wordmark instead
    function onScroll() {
        header.classList.toggle('brand-collapsed', window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();

// ── Staggered scroll reveals (runs on every page) ──────────────
(function () {
    var sections = document.querySelectorAll('.reveal-on-scroll');
    if (!sections.length) return;

    function stagger(section) {
        var kids = section.querySelectorAll(
            '.features-grid > *, .guard-grid > *, .team-grid > *, .spec-grid > *, ' +
            '.pipeline > *, .wn-timeline > *, .roadmap-row, .status-line');
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

// ── Count-up stat numbers when the stat row scrolls into view ──
(function () {
    var rows = document.querySelectorAll('.stat-row');
    if (!rows.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function run(num) {
        var span = num.querySelector('span');
        var suffix = span ? span.outerHTML : '';
        var m = num.textContent.match(/(\$?)(\d+)/);
        if (!m) return;
        var prefix = m[1], target = parseInt(m[2], 10);
        if (reduce || target === 0) { num.innerHTML = prefix + target + suffix; return; }
        var dur = 1600, start = null;
        function tick(now) {
            if (!start) start = now;
            var t = Math.min((now - start) / dur, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            num.innerHTML = prefix + Math.round(eased * target) + suffix;
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // The hero stat row is geometrically in view on load but the hero is held
    // invisible for the ~1.1s brand intro, so defer the count until it reveals,
    // otherwise the roll finishes off-screen and you only ever see the final value.
    function startWhenReady(row) {
        var needsIntro = document.querySelector('.hero-clarity') &&
            !document.body.classList.contains('intro-done');
        if (!needsIntro) { row.querySelectorAll('.num').forEach(run); return; }
        var mo = new MutationObserver(function () {
            if (document.body.classList.contains('intro-done')) {
                mo.disconnect();
                setTimeout(function () { row.querySelectorAll('.num').forEach(run); }, 150);
            }
        });
        mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    if (!('IntersectionObserver' in window)) {
        rows.forEach(startWhenReady);
        return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            obs.unobserve(entry.target);
            startWhenReady(entry.target);
        });
    }, { threshold: 0.4 });
    rows.forEach(function (r) { io.observe(r); });
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
    var SEL = '.hero-visual, .pipeline, .features-grid, .guard-grid, .dark-panel, ' +
        '.today-grid, .road-panel, .team-grid, .wn-rel, .spec-grid, .stat-row, .ink-final';
    var targets = Array.prototype.slice.call(document.querySelectorAll(SEL));
    var finals = Array.prototype.slice.call(document.querySelectorAll('.ink-final'));
    var darkEls = Array.prototype.slice.call(document.querySelectorAll('.dark-panel, .btn-primary'));
    var homepage = !!document.querySelector('.hero-clarity');
    function ready() { return !homepage || document.body.classList.contains('intro-done'); }

    // Ink turns cream over dark backgrounds (the Trust panel, primary buttons).
    function overDark(x, y) {
        for (var i = 0; i < darkEls.length; i++) {
            var r = darkEls[i].getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
        }
        return false;
    }
    var inkMix = 0; // 0 = dark ink, 1 = cream ink

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
        var active = (now - lastMove) < 3200;
        var canAuto = ready();
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
