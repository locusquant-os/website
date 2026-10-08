// Shared behaviour for every LocusQuant page.
(function () {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ── Analytics: three numbers, cookieless, live domain only ────
    // product pages reached · forms opened · requests sent
    var LIVE = /(^|\.)locusquant\.com$/.test(window.location.hostname);
    if (LIVE) {
        window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
        var sc = document.createElement('script');
        sc.defer = true;
        sc.setAttribute('data-domain', 'locusquant.com');
        sc.src = 'https://plausible.io/js/script.js';
        document.head.appendChild(sc);
    }
    function track(name, props) {
        if (LIVE && typeof window.plausible === 'function') window.plausible(name, { props: props || {} });
    }
    if (/^\/instruments\/[^/]+\//.test(window.location.pathname)) {
        track('Product page', { page: window.location.pathname });
    }

    // ── Header: hairline once scrolled, menu below 900px ──────────
    (function () {
        var header = document.querySelector('.site-header');
        if (!header) return;
        function onScroll() {
            header.classList.toggle('scrolled', window.scrollY > 8);
            header.classList.toggle('brand-collapsed', window.scrollY > 80);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        var toggle = header.querySelector('.menu-toggle');
        var links = header.querySelector('.nav-links');
        if (!toggle || !links) return;
        var label = toggle.querySelector('.menu-label');
        function isOpen() { return links.classList.contains('open'); }
        function setOpen(open, restoreFocus) {
            if (open === isOpen()) return;
            links.classList.toggle('open', open);
            header.classList.toggle('menu-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (label) label.textContent = open ? 'Close' : 'Menu';
            document.documentElement.style.overflow = open ? 'hidden' : '';
            if (open) {
                links.setAttribute('tabindex', '-1');
                setTimeout(function () { links.focus({ preventScroll: true }); }, 60);
            } else if (restoreFocus) {
                toggle.focus();
            }
        }
        toggle.addEventListener('click', function () { setOpen(!isOpen(), true); });
        links.addEventListener('click', function (e) { if (e.target.closest('a, button')) setOpen(false); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen()) setOpen(false, true);
        });
        window.addEventListener('resize', function () { if (window.innerWidth > 900) setOpen(false); });
    })();

    // ── Reveals: words are always on the page; motion only follows ─
    (function () {
        var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
        if (!els.length || reduceMotion || !('IntersectionObserver' in window)) return;
        var vh = window.innerHeight;
        els.forEach(function (el) {
            if (el.getBoundingClientRect().top < vh) el.classList.add('in');
        });
        document.documentElement.classList.add('has-motion');
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        els.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
    })();

    // ── Audit trail: decisions stream into the hero panel ─────────
    (function () {
        var log = document.getElementById('audit-log');
        if (!log) return;
        var events = [
            ['research', 'house view logged', 'pass', 'recorded'],
            ['scribe', 'claim verified against filing', 'pass', 'verified'],
            ['risk', 'exposure within mandate', 'pass', 'pass'],
            ['execution', 'ticket denied: limit', 'held', 'denied'],
            ['assay', 'backtest assayed', 'pass', 'scored'],
            ['steward', 'thesis re-underwritten', 'pass', 'recorded'],
            ['execution', 'entry outside window', 'held', 'held'],
            ['bias-gate', 'herding check', 'pass', 'pass']
        ];
        var i = 0;
        var t0 = new Date();
        function pad(n) { return (n < 10 ? '0' : '') + n; }
        function stamp(offset) {
            var d = new Date(t0.getTime() + offset * 1000);
            return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }
        function add(animate, offset) {
            var e = events[i % events.length]; i++;
            var row = document.createElement('div');
            row.className = 'log' + (animate ? ' log-enter' : '');
            var cells = [['t', stamp(offset)], ['ag', e[0]], ['desc', e[1]], ['st st-' + e[2], e[3]]];
            cells.forEach(function (c) {
                var span = document.createElement('span');
                span.className = c[0];
                span.textContent = c[1];
                row.appendChild(span);
            });
            log.insertBefore(row, log.firstChild);
            while (log.children.length > 7) log.removeChild(log.lastChild);
            if (animate) requestAnimationFrame(function () {
                requestAnimationFrame(function () { row.classList.remove('log-enter'); });
            });
        }
        for (var s = 7; s > 0; s--) add(false, -s * 11);
        if (reduceMotion) return;
        var tick = 0;
        setInterval(function () {
            if (document.hidden) return;
            tick += 3;
            add(true, tick);
        }, 2800);
    })();

    // ── The quill: an ink trail that lives in the hero only ───────
    (function () {
        var hero = document.querySelector('[data-quill]');
        if (!hero || reduceMotion || !finePointer) return;
        var canvas = document.createElement('canvas');
        canvas.className = 'quill-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        hero.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W = 0, H = 0;

        function resize() {
            W = hero.offsetWidth; H = hero.offsetHeight;
            canvas.width = W * dpr; canvas.height = H * dpr;
            canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        var anchor = hero.querySelector('.panel');
        var mouse = { x: W * 0.7, y: H * 0.4 };
        var pen = { x: mouse.x, y: mouse.y };
        var pts = [];
        var angle = 0;
        var lastMove = -1e9;
        var running = false;

        hero.addEventListener('mousemove', function (e) {
            var r = hero.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
            lastMove = performance.now();
        });

        function frame(now) {
            var active = now - lastMove < 2400;
            var tx, ty, ease;
            if (active) {
                tx = mouse.x; ty = mouse.y;
                var dx = tx - pen.x, dy = ty - pen.y;
                ease = Math.sqrt(dx * dx + dy * dy) > 160 ? 0.08 : 0.26;
            } else {
                var hr = hero.getBoundingClientRect();
                var ar = anchor ? anchor.getBoundingClientRect() : hr;
                var cx = ar.left - hr.left + ar.width / 2;
                var cy = ar.top - hr.top + ar.height / 2;
                angle += 0.009;
                tx = cx + Math.cos(angle) * (ar.width / 2 + 26);
                ty = cy + Math.sin(angle) * (ar.height / 2 + 26);
                ease = 0.1;
            }
            pen.x += (tx - pen.x) * ease;
            pen.y += (ty - pen.y) * ease;
            pts.push({ x: pen.x, y: pen.y, life: 1 });
            if (pts.length > 54) pts.shift();

            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < pts.length; i++) pts[i].life -= 0.04;
            while (pts.length && pts[0].life <= 0) pts.shift();
            var n = pts.length;
            var alpha = active ? 1 : 0.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (var j = 1; j < n; j++) {
                var a = pts[j - 1], b = pts[j];
                var frac = j / n, life = (a.life + b.life) / 2;
                ctx.lineWidth = (frac * frac * 11 * life + 0.4) * (active ? 1 : 0.7);
                ctx.strokeStyle = 'rgba(23,20,13,' + ((0.1 + frac * 0.6 * life) * alpha).toFixed(3) + ')';
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            if (n) {
                var head = pts[n - 1];
                ctx.fillStyle = 'rgba(23,20,13,' + (0.85 * head.life * alpha).toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(head.x, head.y, (active ? 5.5 : 3.8) * (0.55 + head.life * 0.45), 0, Math.PI * 2);
                ctx.fill();
            }
            if (running) requestAnimationFrame(frame);
        }

        function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) start(); else running = false;
            }).observe(hero);
        } else {
            start();
        }
    })();

    // ── Effective panel size: N / (1 + (N-1)ρ) ────────────────────
    document.querySelectorAll('[data-neff]').forEach(function (root) {
        var n = root.querySelector('[data-neff-n]');
        var rho = root.querySelector('[data-neff-rho]');
        var nOut = root.querySelector('[data-neff-n-out]');
        var rhoOut = root.querySelector('[data-neff-rho-out]');
        var out = root.querySelector('[data-neff-out]');
        if (!n || !rho || !out) return;
        function update() {
            var N = parseInt(n.value, 10), R = parseFloat(rho.value);
            if (nOut) nOut.textContent = N;
            if (rhoOut) rhoOut.textContent = R.toFixed(2);
            out.textContent = (N / (1 + (N - 1) * R)).toFixed(2);
        }
        n.addEventListener('input', update);
        rho.addEventListener('input', update);
        update();
    });

    document.querySelectorAll('[data-print]').forEach(function (b) {
        b.addEventListener('click', function () { window.print(); });
    });

    // ── FAQ: a true accordion ─────────────────────────────────────
    (function () {
        var items = document.querySelectorAll('.faq details');
        items.forEach(function (item) {
            item.addEventListener('toggle', function () {
                if (!item.open) return;
                items.forEach(function (other) { if (other !== item) other.open = false; });
            });
        });
    })();

    // ── Request Access: one form, everywhere ──────────────────────
    (function () {
        var triggers = document.querySelectorAll('[data-modal]');
        if (!triggers.length) return;

        var WEB3FORMS_KEY = 'a91d092d-9247-49a5-98f2-77c461eee51d';
        var RECIPIENTS = {
            both: { intended_for: 'Both founders', tag: '[ACCESS REQUEST]', heading: 'Request Access' },
            partner: { intended_for: 'Both founders', tag: '[PARTNERSHIP]', heading: 'Request Access' },
            divyanshu: { intended_for: 'Divyanshu', tag: '[FOR: DIVYANSHU]', heading: 'Write to Divyanshu' },
            ayush: { intended_for: 'Ayush', tag: '[FOR: AYUSH]', heading: 'Write to Ayush' },
            assay: { intended_for: 'Both founders', tag: '[ASSAY]', heading: 'Request Access', instrument: 'Assay' },
            tare: { intended_for: 'Both founders', tag: '[TARE]', heading: 'Request Access', instrument: 'Tare' },
            scribe: { intended_for: 'Both founders', tag: '[SCRIBE]', heading: 'Request Access', instrument: 'Scribe' },
            research: { intended_for: 'Both founders', tag: '[RESEARCH]', heading: 'Request Access' },
            peek: { intended_for: 'Both founders', tag: '[IN BUILD]', heading: 'Ask about it' }
        };

        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="modal-overlay" id="contact-modal" aria-hidden="true">' +
            '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-heading">' +
            '<button type="button" class="modal-close" id="modal-close" aria-label="Close">&times;</button>' +
            '<div class="modal-heading" id="modal-heading">Request Access</div>' +
            '<div class="modal-recipient" id="modal-recipient"></div>' +
            '<form id="contact-form" novalidate>' +
            '<div class="field"><label for="cf-name">Name</label>' +
            '<input class="modal-input" id="cf-name" name="name" type="text" required autocomplete="name"></div>' +
            '<div class="field"><label for="cf-email">Email</label>' +
            '<input class="modal-input" id="cf-email" name="email" type="email" required autocomplete="email"></div>' +
            '<div class="field"><label for="cf-message">Message</label>' +
            '<textarea class="modal-input modal-textarea" id="cf-message" name="message" required ' +
            'placeholder="Tell us which instrument interests you and what you are working on."></textarea></div>' +
            '<input type="checkbox" name="botcheck" class="modal-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<button type="submit" class="modal-submit" id="modal-submit">Send request &rarr;</button>' +
            '<p class="modal-promise">A founder replies within one business day.</p>' +
            '<div class="modal-status" id="modal-status" role="status" aria-live="polite"></div>' +
            '</form></div></div>';
        document.body.appendChild(wrap.firstChild);

        var modal = document.getElementById('contact-modal');
        var heading = document.getElementById('modal-heading');
        var recipient = document.getElementById('modal-recipient');
        var form = document.getElementById('contact-form');
        var status = document.getElementById('modal-status');
        var submit = document.getElementById('modal-submit');
        var nameEl = document.getElementById('cf-name');
        var emailEl = document.getElementById('cf-email');
        var msgEl = document.getElementById('cf-message');
        var current = RECIPIENTS.both;
        var lastTrigger = null;

        function setStatus(cls, main, sub) {
            status.className = 'modal-status ' + cls;
            status.textContent = main;
            if (sub) {
                var s = document.createElement('span');
                s.className = 'modal-status-sub';
                s.textContent = sub;
                status.appendChild(s);
            }
        }

        function open(key, trigger) {
            current = Object.assign({}, RECIPIENTS[key] || RECIPIENTS.both);
            var named = trigger && trigger.getAttribute('data-instrument');
            if (named) {
                current.instrument = named;
                current.tag = '[IN BUILD: ' + named.toUpperCase() + ']';
                current.heading = 'Ask about ' + named;
            }
            lastTrigger = trigger || null;
            track('Form open', { source: current.instrument || key, page: window.location.pathname });
            heading.textContent = current.heading;
            recipient.textContent = current.instrument
                ? 'About ' + current.instrument + '. Goes to both founders.'
                : 'Goes to ' + (current.intended_for === 'Both founders' ? 'both founders.' : current.intended_for + ' directly.');
            form.reset();
            form.style.display = '';
            [nameEl, emailEl, msgEl].forEach(function (f) { f.removeAttribute('aria-invalid'); });
            if (current.instrument) msgEl.value = current.instrument + ': ';
            status.className = 'modal-status';
            status.textContent = '';
            submit.disabled = false;
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            setTimeout(function () { nameEl.focus(); }, 50);
        }

        function close() {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (lastTrigger) lastTrigger.focus();
        }

        triggers.forEach(function (el) {
            el.addEventListener('click', function () { open(el.getAttribute('data-modal'), el); });
        });
        document.getElementById('modal-close').addEventListener('click', close);
        modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) close();
        });

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var fd = new FormData(form);
            if (fd.get('botcheck')) return;

            var name = nameEl.value.trim();
            var email = emailEl.value.trim();
            var message = msgEl.value.trim();
            var bad = [];
            if (!name) bad.push(nameEl);
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push(emailEl);
            if (!message || (current.instrument && message === current.instrument + ':')) bad.push(msgEl);
            [nameEl, emailEl, msgEl].forEach(function (f) {
                if (bad.indexOf(f) === -1) f.removeAttribute('aria-invalid');
                else f.setAttribute('aria-invalid', 'true');
            });
            if (bad.length) {
                setStatus('failure', bad.length > 1 ? 'A few fields need another look.' : 'One field needs another look.',
                    'Name, a valid email and a short message are all we ask for.');
                bad[0].focus();
                return;
            }

            submit.disabled = true;
            setStatus('pending', 'Sending…');

            try {
                var res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        access_key: WEB3FORMS_KEY,
                        subject: 'LocusQuant ' + current.tag + ' from ' + name,
                        name: name,
                        email: email,
                        message: message,
                        intended_for: current.intended_for,
                        from_url: window.location.href,
                        botcheck: false
                    })
                });
                var data = await res.json().catch(function () { return {}; });
                if (!res.ok || !data.success) throw new Error('submit failed');
                track('Request sent', { source: current.instrument || 'general', page: window.location.pathname });
                form.style.display = 'none';
                setStatus('success', 'Request received.',
                    'A founder will reply within one business day. You can close this window.');
            } catch (err) {
                submit.disabled = false;
                setStatus('failure', 'That did not go through.', 'Please try again in a moment.');
            }
        });
    })();
})();
