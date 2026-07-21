// Shared behaviour for every LocusQuant page: theme-toggle persistence
// and the reusable contact modal. Page-specific effects (hero text-wipe,
// terminal typewriter, scroll reveals) stay inline on their own page.
(function () {
    'use strict';

    // ── Theme toggle + persistence ──────────────────────────────
    // The persisted theme is applied pre-paint by an inline <head> script.
    // Here we only handle click-to-toggle and writing the choice back.
    var THEME_KEY = 'locusquant-theme';
    var rootElement = document.documentElement;
    var themeBtn = document.getElementById('theme-btn');

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var isLight = rootElement.getAttribute('data-theme') === 'light';
            if (isLight) {
                rootElement.removeAttribute('data-theme');
                try { localStorage.setItem(THEME_KEY, 'dark'); } catch (e) { }
            } else {
                rootElement.setAttribute('data-theme', 'light');
                try { localStorage.setItem(THEME_KEY, 'light'); } catch (e) { }
            }
        });
    }

    // ── Contact modal (single reusable component, recipient-parameterized) ──
    var modal = document.getElementById('contact-modal');
    if (!modal) return; // page without the modal markup — nothing more to wire

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
