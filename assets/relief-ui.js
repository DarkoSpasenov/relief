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
  var toTop = document.querySelector('[data-to-top]');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 20);
    if (toTop) toTop.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.6);
  }
  /* ---------- téléphone : un écran par swipe, contenu centré verticalement ---------- */
  var snapMq = window.matchMedia('(max-width: 760px) and (prefers-reduced-motion: no-preference)');
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function q(s) { return document.querySelector(s); }
  /* hauteur fixe (barre d'adresse iPhone visible) : évite que les arrêts bougent quand la barre se replie */
  var probe;
  function stableH() {
    if (!probe) { probe = document.createElement('div'); probe.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:100svh;visibility:hidden;pointer-events:none'; document.body.appendChild(probe); }
    return probe.offsetHeight || window.innerHeight;
  }
  var lastW = window.innerWidth;
  /* téléphone : la montée de la caméra 3D suit les écrans (même position du sommet sur tous les téléphones) */
  var snapYs = [];
  window.reliefProg = function () {
    if (!snapMq.matches || snapYs.length < 2) return null;
    var n = snapYs.length - 1, end = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    /* chaque écran a sa hauteur de caméra ; le contact (dernier écran) s'arrête juste sous le sommet, le bas de page l'atteint */
    var ys = snapYs.concat([Math.max(end, snapYs[n] + 1)]);
    var fr = snapYs.map(function (_, i) { return i < n ? i / n : 0.93; });
    fr.push(1);
    var y = window.scrollY;
    if (y <= ys[0]) return 0;
    for (var i = 0; i < ys.length - 1; i++) {
      if (y < ys[i + 1]) return fr[i] + (fr[i + 1] - fr[i]) * (y - ys[i]) / Math.max(1, ys[i + 1] - ys[i]);
    }
    return 1;
  };
  function layoutSnaps() {
    document.querySelectorAll('.snap-pt').forEach(function (el) { el.classList.remove('snap-pt'); el.style.scrollMarginTop = ''; });
    snapYs = [];
    var faqHead = q('#faq .sec-head'); if (faqHead) faqHead.style.marginBottom = '';
    if (!snapMq.matches) return;
    var navH = 76, vh = stableH(), avail = vh - navH;
    var climbs = document.querySelectorAll('.climb');
    var groups = [
      [q('.sommets .sec-head'), climbs[1]],
      [climbs[2], climbs[3]],
      [q('#services .wrap')], [q('#studio .wrap')], [q('#methode .wrap')], [q('#faq .wrap')],
      [q('.contact .contact-card')]
    ];
    var hero = q('.hero'); if (hero) { hero.classList.add('snap-pt'); hero.style.scrollMarginTop = '0px'; }
    snapYs = [0];
    groups.forEach(function (g) {
      var a = g[0], b = g[g.length - 1]; if (!a || !b) return;
      var h = docTop(b) + b.offsetHeight - docTop(a);
      var m = navH + Math.max(12, (avail - h) / 2);
      /* FAQ : titre collé sous le menu, questions en bas, le drapeau du sommet reste visible entre les deux */
      if (faqHead && a === q('#faq .wrap') && avail - h > 40) {
        faqHead.style.marginBottom = Math.round(parseFloat(getComputedStyle(faqHead).marginBottom) + avail - h - 100) + "px";
        m = navH + 12;
      }
      /* contact : la carte descend en bas de l'écran, le drapeau du sommet reste visible au-dessus */
      if (a === q('.contact .contact-card')) m = navH + Math.max(12, avail - h - 20);
      a.classList.add('snap-pt'); a.style.scrollMarginTop = Math.round(m) + 'px';
      snapYs.push(docTop(a) - Math.round(m));
    });
  }
  var snapT; function askSnaps() { clearTimeout(snapT); snapT = setTimeout(layoutSnaps, 120); }
  window.addEventListener('resize', function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; askSnaps(); } }); window.addEventListener('load', layoutSnaps);
  if (snapMq.addEventListener) snapMq.addEventListener('change', layoutSnaps);
  document.querySelectorAll('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', askSnaps); });
  layoutSnaps();

  /* logo, flèche et liens du menu : défilement sans être bloqué par l'aimant des écrans */
  var root = document.documentElement, unlockT;
  function glideTo(y) {
    y = Math.max(0, Math.round(y));
    clearTimeout(unlockT);
    root.style.scrollSnapType = 'none';
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    var t0 = Date.now();
    (function wait() {
      if (Math.abs(window.scrollY - y) < 2 || Date.now() - t0 > 2500) { unlockT = setTimeout(function () { root.style.scrollSnapType = ''; }, 120); return; }
      requestAnimationFrame(wait);
    })();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"], [data-to-top]');
    if (!a) return;
    var id = a.hasAttribute('data-to-top') ? 'top' : a.getAttribute('href').slice(1);
    if (!id) return;
    var y;
    if (id === 'top') y = 0;
    else {
      if (!snapMq.matches) return; /* ordinateur : défilement natif */
      var target = document.getElementById(id); if (!target) return;
      var pt = target.querySelector('.snap-pt') || target;
      y = docTop(pt) - (parseFloat(pt.style.scrollMarginTop) || 80);
    }
    e.preventDefault();
    glideTo(y);
    if (history.replaceState) history.replaceState(null, '', id === 'top' ? location.pathname + location.search : '#' + id);
  });
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
