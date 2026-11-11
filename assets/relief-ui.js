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

  /* ---------- effets pilotés par le défilement ----------
     Chaque élément [data-scroll] reçoit deux variables CSS :
     --e : son entrée dans l'écran (0 = il arrive par le bas, 1 = il est en place)
     --p : sa traversée de l'écran (0 = il arrive, 1 = il est sorti par le haut)
     Les animations elles-mêmes sont dans relief.css. */
  var scrubbed = Array.prototype.slice.call(document.querySelectorAll('[data-scroll]'));
  if (!reduce && scrubbed.length) {
    var active = [], ticking = false;
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var ease = function (v) { return 1 - Math.pow(1 - v, 3); };
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      for (var i = 0; i < active.length; i++) {
        var el = active[i], r = el.getBoundingClientRect();
        el.style.setProperty('--e', ease(clamp((vh * 0.98 - r.top) / (vh * 0.62))).toFixed(4));
        el.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height)).toFixed(4));
      }
    };
    var ask = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          var k = active.indexOf(x.target);
          if (x.isIntersecting && k < 0) active.push(x.target);
          else if (!x.isIntersecting && k >= 0) {
            active.splice(k, 1);
            // sorti de l'écran : on fige l'état final du bon côté
            var above = x.boundingClientRect.top < 0;
            x.target.style.setProperty('--e', above ? '1' : '0'); x.target.style.setProperty('--p', above ? '1' : '0');
          }
        });
        ask();
      }, { rootMargin: '10% 0px 10% 0px' });
      scrubbed.forEach(function (el) { el.style.setProperty('--e', '0'); el.style.setProperty('--p', '0'); sio.observe(el); });
    } else active = scrubbed;
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    ask();
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

  /* ---------- titre : les mots montent un par un ---------- */
  document.querySelectorAll('[data-words]').forEach(function (h) {
    if (reduce) return;
    var n = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
            var o = document.createElement('span'); o.className = 'w';
            var i = document.createElement('span'); i.textContent = w; i.style.animationDelay = (0.15 + n++ * 0.07) + 's';
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) split(c);
      });
    })(h);
    h.classList.add('is-split');
  });

  /* ---------- boutons aimantés ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
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
