/* Relief v2 : menu, apparitions au défilement, léger parallaxe, formulaire */
(function () {
  var nav = document.querySelector('[data-nav]');
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');
  var photo = document.querySelector('[data-parallax]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // menu collé : fond clair après l'accueil
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > window.innerHeight * 0.55);
    if (photo && !reduce && y < window.innerHeight * 1.2) {
      photo.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // menu mobile
  function closeMenu() {
    burger.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    nav.classList.remove('open');
  }
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    nav.classList.toggle('open', open);
  });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });

  // apparitions
  var items = document.querySelectorAll('.reveal, .steps li');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // année
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // coordonnées depuis site-config.js
  window.addEventListener('DOMContentLoaded', function () {
    var c = window.DS_CONFIG || {};
    if (c.contactEmail) document.querySelectorAll('[data-email]').forEach(function (a) {
      a.href = 'mailto:' + c.contactEmail; a.textContent = c.contactEmail;
    });
  });

  // formulaire (Formspree)
  var form = document.querySelector('[data-form]');
  var status = document.querySelector('[data-form-status]');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var c = window.DS_CONFIG || {};
    status.textContent = 'Envoi…';
    fetch(c.formspreeEndpoint || form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset();
        status.textContent = 'Merci ! Nous vous répondons sous 48 h.';
      })
      .catch(function () { status.textContent = 'Oups, l’envoi a échoué. Écrivez-nous à info@ds-digital.ch.'; });
  });
})();
