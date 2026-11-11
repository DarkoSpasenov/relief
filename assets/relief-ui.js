/* RELIEF — interactions (navigation, ordinateurs 3D, cartes en relief, formulaire) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- configuration (site-config.js) ---------- */
  var cfg = window.DS_CONFIG || {};
  if (cfg.contactEmail) {
    document.querySelectorAll('[data-email]').forEach(function (a) {
      a.href = 'mailto:' + cfg.contactEmail; a.textContent = cfg.contactEmail;
    });
  }
  var form = document.querySelector('[data-form]');
  if (form && cfg.formspreeEndpoint) form.action = cfg.formspreeEndpoint;
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- navigation ---------- */
  var nav = document.querySelector('[data-nav]');
  function onScroll() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
      if (nav) nav.classList.toggle('is-scrolled', !open || window.scrollY > 20);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; }
    });
  }

  /* ---------- réalisations : les ordinateurs s'ouvrent à l'arrivée ---------- */
  var climbs = document.querySelectorAll('[data-climb]');
  if (reduce || !('IntersectionObserver' in window)) {
    climbs.forEach(function (c) { c.classList.add('is-open'); });
  } else {
    var lio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-open'); lio.unobserve(x.target); } });
    }, { threshold: 0.35 });
    climbs.forEach(function (c) { lio.observe(c); });
  }
  // l'ordinateur suit légèrement la souris
  if (finePointer && !reduce) {
    document.querySelectorAll('.laptop').forEach(function (lap) {
      var body = lap.querySelector('.laptop-3d');
      lap.addEventListener('mousemove', function (e) {
        var r = lap.getBoundingClientRect();
        body.style.setProperty('--mx', (((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(2) + 'deg');
        body.style.setProperty('--my', ((0.5 - (e.clientY - r.top) / r.height) * 8).toFixed(2) + 'deg');
      });
      lap.addEventListener('mouseleave', function () { body.style.setProperty('--mx', '0deg'); body.style.setProperty('--my', '0deg'); });
    });
  }

  /* ---------- cartes en relief (tilt) ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var target = el.querySelector('.card3d-in') || el;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        target.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg');
        target.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
        target.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        target.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('mouseleave', function () {
        target.style.setProperty('--rx', '0deg'); target.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- apparition au scroll ---------- */
  var toReveal = document.querySelectorAll('.sec-head, .climb-copy, .team > *, .steps > *, .contact-card');
  if ('IntersectionObserver' in window && !reduce) {
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); rio.unobserve(x.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    toReveal.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (el.parentElement.classList.contains('steps') || el.parentElement.classList.contains('team') ? (Array.prototype.indexOf.call(el.parentElement.children, el) * 0.12) : 0) + 's';
      rio.observe(el);
    });
  }

  /* ---------- formulaire (Formspree) ---------- */
  if (form && window.fetch) {
    var status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; status.textContent = 'Envoi en cours…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset(); status.textContent = 'Merci ! Votre message est bien parti.';
        })
        .catch(function () { status.textContent = 'Oups, l’envoi a échoué. Écrivez-nous directement par e-mail.'; })
        .then(function () { btn.disabled = false; });
    });
  }
})();
