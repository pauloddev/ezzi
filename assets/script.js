(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  // Intro
  var intro = $("#intro");
  if (intro) {
    var hide = function () { intro.classList.add("is-done"); };
    if (reduce) hide(); else window.addEventListener("load", function () { setTimeout(hide, 500); });
    setTimeout(hide, 2600);
  }

  // Cabeçalho e menu
  var header = $(".header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 10); };
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  var burger = $(".burger"), drawer = $("#drawer");
  var setMenu = function (open) {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    drawer.classList.toggle("is-open", open);
  };
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  $$("#drawer a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  // Escolha da loja (WhatsApp)
  var modal = $("#lojaModal"), lastFocus = null;
  var openModal = function (e) {
    e.preventDefault(); lastFocus = document.activeElement; setMenu(false);
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    setTimeout(function () { $(".opt", modal).focus(); }, 60);
  };
  var closeModal = function () {
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus();
  };
  $$("[data-wa]").forEach(function (b) { b.addEventListener("click", openModal); });
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", closeModal); });
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setMenu(false); if (modal.classList.contains("is-open")) closeModal(); }
  });

  // Revelar ao rolar (textos, mídias, listas)
  $$("[data-stagger]").forEach(function (l) { Array.prototype.forEach.call(l.children, function (el, i) { el.style.setProperty("--i", i); }); });
  var items = $$("[data-reveal],[data-media],[data-stagger]");
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-live"); sio.unobserve(e.target); } });
    }, { threshold: 0.1 });
    $$("main > .section").forEach(function (s) { sio.observe(s); });
  } else items.forEach(function (el) { el.classList.add("is-in"); });

  // Vídeos: tocam só quando aparecem na tela
  var vids = $$("video[data-auto]");
  if (hasIO) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (v.preload === "none") { v.preload = "auto"; v.load(); } var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  // Carrosséis: setas, pontos, cartão em foco e passagem automática
  $$(".carousel").forEach(function (box) {
    var strip = $(".strip", box), cards = $$(".ccard", strip), dotsBox = $(".dots", box), dots = [];
    var step = function () { return cards[0].getBoundingClientRect().width + 16; };
    var go = function (dir) {
      var max = strip.scrollWidth - strip.clientWidth - 4;
      if (dir > 0 && strip.scrollLeft >= max) strip.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
      else if (dir < 0 && strip.scrollLeft <= 4) strip.scrollTo({ left: max + 4, behavior: reduce ? "auto" : "smooth" });
      else strip.scrollBy({ left: step() * dir, behavior: reduce ? "auto" : "smooth" });
    };
    $$(".arrow", box).forEach(function (b) { b.addEventListener("click", function () { go(Number(b.dataset.dir)); }); });
    cards.forEach(function () { var d = document.createElement("span"); dotsBox.appendChild(d); dots.push(d); });
    if (hasIO) {
      strip.classList.add("is-js");
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var i = cards.indexOf(e.target), on = e.intersectionRatio > 0.6;
          e.target.classList.toggle("is-on", on); if (dots[i]) dots[i].classList.toggle("is-on", on);
        });
      }, { root: strip, threshold: [0, 0.6, 1] });
      cards.forEach(function (c) { cio.observe(c); });
    }
    var hold = false, visible = false;
    ["mouseenter", "focusin", "touchstart", "pointerdown"].forEach(function (ev) { strip.addEventListener(ev, function () { hold = true; }, { passive: true }); });
    ["mouseleave", "focusout"].forEach(function (ev) { strip.addEventListener(ev, function () { hold = false; }); });
    if (hasIO && !reduce) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.3 }).observe(strip);
      setInterval(function () { if (!hold && visible && !document.hidden) go(1); }, 4200);
    }
  });

  // Aberto agora? (horário de Alagoas, UTC-3)
  var now = new Date(Date.now() + (new Date().getTimezoneOffset() - 180) * 60000);
  var d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
  $$(".store").forEach(function (st) {
    var sat = Number(st.dataset.sat), status = $(".status", st);
    var h = d >= 1 && d <= 5 ? [480, 1080] : d === 6 ? [480, sat] : null;
    $$(".hours tr", st).forEach(function (tr) { if (tr.dataset.days.split(",").indexOf(String(d)) > -1) tr.classList.add("is-today"); });
    if (h && m >= h[0] && m < h[1]) {
      var left = h[1] - m;
      status.textContent = left <= 60 ? "Aberto agora · fecha em " + left + " min" : "Aberto agora";
      status.classList.add("is-open");
    } else { status.textContent = "Fechado agora"; status.classList.add("is-closed"); }
  });

  // Mapas: carregam só quando chegam perto
  $$(".map[data-src]").forEach(function (mf) {
    var load = function () {
      if (mf.firstChild) return;
      var f = document.createElement("iframe");
      f.src = mf.dataset.src; f.loading = "lazy"; f.title = mf.dataset.title;
      f.referrerPolicy = "no-referrer-when-downgrade"; mf.appendChild(f);
    };
    if (hasIO) {
      var mio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { load(); mio.disconnect(); } }, { rootMargin: "400px" });
      mio.observe(mf);
    } else load();
  });

  var ano = $("#ano"); if (ano) ano.textContent = new Date().getFullYear();
})();
