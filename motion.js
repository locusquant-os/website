// Site choreography: the screening room, scroll-linked ink, instrument marks and small physical touches.
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
    var smooth = function (x) { return x * x * (3 - 2 * x); };
    var fmt = function (s) { s = Math.max(0, s); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };

    // ── Scroll-linked work, batched into one frame ────────────────
    var scrollJobs = [];
    var queued = false;
    function runScroll() {
        queued = false;
        var vh = window.innerHeight;
        for (var i = 0; i < scrollJobs.length; i++) scrollJobs[i](vh);
    }
    function requestScroll() { if (!queued) { queued = true; requestAnimationFrame(runScroll); } }
    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', requestScroll);

    // ── 03 · words take ink as you read ───────────────────────────
    document.querySelectorAll('[data-illuminate]').forEach(function (p) {
        if (reduce) return;
        var words = [];
        var parts = p.textContent.trim().split(/\s+/);
        p.textContent = '';
        parts.forEach(function (w, i) {
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = w;
            p.appendChild(s);
            if (i < parts.length - 1) p.appendChild(document.createTextNode(' '));
            words.push(s);
        });
        scrollJobs.push(function (vh) {
            var r = p.getBoundingClientRect();
            if (r.bottom < -vh || r.top > vh * 2) return;
            var prog = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.32), 0, 1) * words.length;
            for (var i = 0; i < words.length; i++) {
                words[i].style.setProperty('--a', (0.22 + 0.78 * clamp(prog - i, 0, 1)).toFixed(3));
            }
        });
    });

    // ── 05 · the lights go down for the film ──────────────────────
    var theater = document.querySelector('[data-theater]');
    if (theater && !reduce) {
        scrollJobs.push(function (vh) {
            var r = theater.getBoundingClientRect();
            var d = Math.abs(r.top + r.height / 2 - vh / 2) / (vh * 0.7);
            theater.style.setProperty('--dim', smooth(clamp((1 - d) * 1.15, 0, 1)).toFixed(3));
        });
    }

    // ── 07 · the pipeline line draws as you pass ──────────────────
    var pipe = document.querySelector('[data-pipeline]');
    if (pipe && !reduce) {
        scrollJobs.push(function (vh) {
            var r = pipe.getBoundingClientRect();
            pipe.style.setProperty('--p', clamp((vh * 0.78 - r.top) / (r.height * 0.9), 0, 1).toFixed(3));
        });
    }

    // ── Research notes: a ledger rule fills as you read ───────────
    var article = document.querySelector('.article');
    if (article && !reduce) {
        var bar = document.createElement('div');
        bar.className = 'read-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);
        scrollJobs.push(function (vh) {
            var r = article.getBoundingClientRect();
            bar.style.setProperty('--p', clamp((vh * 0.35 - r.top) / Math.max(1, r.height - vh * 0.4), 0, 1).toFixed(4));
        });
    }

    requestScroll();

    // ── Arrivals: specimens draw themselves once seen ─────────────
    function onceSeen(el, fn, margin) {
        if (!('IntersectionObserver' in window)) { fn(); return; }
        var io = new IntersectionObserver(function (es) {
            if (es[0].isIntersecting) { io.disconnect(); fn(); }
        }, { rootMargin: margin || '0px 0px -12% 0px' });
        io.observe(el);
    }
    document.querySelectorAll('.sheet-fig').forEach(function (fig) {
        fig.querySelectorAll('rect').forEach(function (r, i) { r.style.setProperty('--i', i); });
    });
    document.querySelectorAll('.report, .claim-check, .sheet-fig, .stack-drawing, .stack').forEach(function (el) {
        if (reduce) { el.classList.add('is-in'); return; }
        onceSeen(el, function () { el.classList.add('is-in'); });
    });

    // ── Lists arrive row by row ───────────────────────────────────
    document.querySelectorAll('.verbs, .inst-rows, .peek-grid, .timeline, .notes, .promises, .phases, .spec-rows, .rows, .founders, .list, .stages').forEach(function (list) {
        if (reduce) return;
        list.setAttribute('data-stagger', '');
        Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty('--i', i); });
        onceSeen(list, function () { list.classList.add('is-in'); });
    });

    // ── Instrument marks keep breathing while on screen ───────────
    function whileVisible(el, every, fn) {
        var timer = 0, on = false;
        function tick() { if (on && !document.hidden) fn(); timer = setTimeout(tick, every); }
        new IntersectionObserver(function (es) {
            on = es[0].isIntersecting;
            clearTimeout(timer);
            if (on) timer = setTimeout(tick, every);
        }, { threshold: 0.3 }).observe(el);
    }
    if (!reduce) {
        window.addEventListener('load', function () {
            document.querySelectorAll('[data-mark-loop]').forEach(function (el) {
                whileVisible(el, 5200, function () { if (el.__lqmPlay) el.__lqmPlay(); });
            });
            document.querySelectorAll('[data-cabinet]').forEach(function (cab) {
                var cells = cab.querySelectorAll('[data-mark]');
                whileVisible(cab, 7000, function () {
                    cells.forEach(function (c, i) { setTimeout(function () { if (c.__lqmPlay) c.__lqmPlay(); }, i * 110); });
                });
            });
        });
    }

    // ── 05 · the screening room console ───────────────────────────
    (function () {
        var screen = document.querySelector('[data-screen]');
        if (!screen) return;
        var iframe = screen.querySelector('iframe');
        var toggle = document.querySelector('[data-film-toggle]');
        var track = document.querySelector('[data-film-track]');
        var fill = document.querySelector('[data-film-fill]');
        var ticks = document.querySelector('[data-film-ticks]');
        var timeEl = document.querySelector('[data-film-time]');
        var list = document.querySelector('[data-film-chapters]');
        var full = document.querySelector('[data-film-full]');
        var film = null, buttons = [], current = -1, visible = false, raf = 0;

        function connect() {
            try { film = iframe.contentWindow && iframe.contentWindow.LQFilm; } catch (e) { film = null; }
            if (!film) return false;
            screen.classList.add('is-ready');
            build();
            loop();
            return true;
        }

        function build() {
            if (buttons.length) return;
            film.chapters.forEach(function (c, i) {
                if (i > 0) {
                    var t = document.createElement('i');
                    t.style.left = (c.start / film.total * 100) + '%';
                    ticks.appendChild(t);
                }
                var li = document.createElement('li');
                var b = document.createElement('button');
                b.type = 'button';
                b.innerHTML = '<span class="no">' + String(i + 1).padStart(2, '0') + '</span>';
                b.appendChild(document.createTextNode(c.name));
                b.addEventListener('click', function () { film.seek(c.start + 0.01); film.play(); sync(); });
                li.appendChild(b);
                list.appendChild(li);
                buttons.push(b);
            });
        }

        function sync() {
            if (!film) return;
            var t = film.time, total = film.total;
            fill.style.setProperty('--p', (t / total).toFixed(4));
            timeEl.textContent = fmt(t) + ' / ' + fmt(total);
            track.setAttribute('aria-valuenow', String(Math.round(t)));
            track.setAttribute('aria-valuetext', fmt(t));
            var paused = !film.playing;
            toggle.classList.toggle('is-paused', paused);
            toggle.setAttribute('aria-label', paused ? 'Play film' : 'Pause film');
            var ci = 0;
            film.chapters.forEach(function (c, i) { if (t >= c.start) ci = i; });
            if (ci !== current) {
                if (buttons[current]) buttons[current].removeAttribute('aria-current');
                current = ci;
                var b = buttons[ci];
                if (b) {
                    b.setAttribute('aria-current', 'true');
                    if (visible) {
                        var lr = list.getBoundingClientRect(), br = b.getBoundingClientRect();
                        list.scrollTo({ left: list.scrollLeft + br.left - lr.left - lr.width / 2 + br.width / 2, behavior: reduce ? 'auto' : 'smooth' });
                    }
                }
            }
        }

        function loop() {
            cancelAnimationFrame(raf);
            if (!visible || !film) return;
            sync();
            raf = requestAnimationFrame(loop);
        }

        iframe.addEventListener('load', function () {
            if (!connect()) setTimeout(connect, 300);
        });
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') connect();

        new IntersectionObserver(function (es) {
            visible = es[0].isIntersecting;
            loop();
        }, { threshold: 0 }).observe(screen);

        toggle.addEventListener('click', function () {
            if (!film) return;
            if (film.playing) film.pause(); else film.play();
            sync();
        });

        function seekAt(clientX) {
            var r = track.getBoundingClientRect();
            film.seek(clamp((clientX - r.left) / r.width, 0, 1) * film.total);
            sync();
        }
        track.addEventListener('pointerdown', function (e) {
            if (!film) return;
            track.setPointerCapture(e.pointerId);
            seekAt(e.clientX);
            function move(ev) { seekAt(ev.clientX); }
            function up() { track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); }
            track.addEventListener('pointermove', move);
            track.addEventListener('pointerup', up);
        });
        track.addEventListener('keydown', function (e) {
            if (!film) return;
            var step = { ArrowRight: 2, ArrowLeft: -2, PageUp: 10, PageDown: -10 }[e.key];
            if (e.key === 'Home') { film.seek(0); e.preventDefault(); }
            else if (e.key === 'End') { film.seek(film.total); e.preventDefault(); }
            else if (step) { film.seek(film.time + step); e.preventDefault(); }
            else if (e.key === ' ') { if (film.playing) film.pause(); else film.play(); e.preventDefault(); }
            sync();
        });

        if (full) {
            var canFull = screen.requestFullscreen || screen.webkitRequestFullscreen;
            if (!canFull) full.hidden = true;
            full.addEventListener('click', function () {
                if (screen.requestFullscreen) screen.requestFullscreen();
                else if (screen.webkitRequestFullscreen) screen.webkitRequestFullscreen();
            });
        }
    })();

    // ── 06 · effective panel size, drawn as dots ──────────────────
    document.querySelectorAll('[data-neff]').forEach(function (root) {
        var n = root.querySelector('[data-neff-n]');
        var rho = root.querySelector('[data-neff-rho]');
        var dots = root.querySelector('[data-neff-dots]');
        if (!n || !rho || !dots) return;
        function draw() {
            var N = parseInt(n.value, 10), R = parseFloat(rho.value);
            var eff = N / (1 + (N - 1) * R);
            var html = '', k = 0;
            for (var i = 0; i < N; i++) html += '<i style="--i:' + (k++) + '"></i>';
            html += '<span class="eq">&rarr;</span>';
            var whole = Math.floor(eff + 1e-9), frac = eff - whole;
            for (var j = 0; j < whole; j++) html += '<i style="--i:' + (k++) + '"></i>';
            if (frac > 0.04) html += '<i class="part" style="--i:' + k + ';--f:' + Math.round(frac * 100) + '%"></i>';
            dots.innerHTML = html;
        }
        n.addEventListener('input', draw);
        rho.addEventListener('input', draw);
        draw();
    });

    if (reduce || !fine) return;

    // ── Spotlight: paper catches light under the cursor ───────────
    document.querySelectorAll('[data-spot]').forEach(function (el) {
        el.addEventListener('pointermove', function (e) {
            var r = el.getBoundingClientRect();
            el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    // ── Magnetic buttons: a small pull toward the hand ────────────
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
        el.addEventListener('pointermove', function (e) {
            var r = el.getBoundingClientRect();
            var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
            el.style.transform = 'translate(' + (dx * 0.22).toFixed(2) + 'px,' + (dy * 0.32).toFixed(2) + 'px)';
        });
        el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    // ── Hero objects: a sheet tilting under the light ─────────────
    document.querySelectorAll('[data-tilt]').forEach(function (tilt) {
        var target = tilt.querySelector('.panel') || tilt;
        var area = tilt.closest('.hero, .page-hero') || tilt;
        area.addEventListener('pointermove', function (e) {
            var r = tilt.getBoundingClientRect();
            var x = clamp((e.clientX - (r.left + r.width / 2)) / r.width, -1, 1);
            var y = clamp((e.clientY - (r.top + r.height / 2)) / r.height, -1, 1);
            target.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg');
            target.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
        });
        area.addEventListener('pointerleave', function () {
            target.style.setProperty('--ry', '0deg');
            target.style.setProperty('--rx', '0deg');
        });
    });
})();
