/* ============================================================
   NÚCLEO7 — CAMADA DE RASTREAMENTO
   Meta Pixel + GA4 + GTM + captura de UTMs
   Depende de config.js (window.N7_CONFIG)
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.N7_CONFIG || {};
  var LOG = function () {
    if (CFG.DEBUG && window.console) console.log.apply(console, ["[N7]"].concat([].slice.call(arguments)));
  };

  /* ---------------------------------------------------------
     1. CAPTURA E PERSISTÊNCIA DE UTMs / CLICK IDs
     Guarda no sessionStorage para sobreviver à navegação
     (ex.: index.html -> obrigado.html)
     --------------------------------------------------------- */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"];
  var STORE_KEY = "n7_attrib";

  function getParams() {
    try { return new URLSearchParams(window.location.search); }
    catch (e) { return { get: function () { return null; } }; }
  }

  function readStore() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function writeStore(obj) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : "";
  }

  function detectDevice() {
    var ua = navigator.userAgent || "";
    if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/i.test(ua)) return "mobile";
    return "desktop";
  }

  function initAttribution() {
    var stored = readStore();
    var p = getParams();
    var found = false;

    UTM_KEYS.forEach(function (k) {
      var v = p.get(k);
      if (v) { stored[k] = v; found = true; }
    });

    // Primeira sessão: registra landing page e origem
    if (!stored.first_seen) {
      stored.first_seen = new Date().toISOString();
      stored.landing_page = window.location.href;
      stored.referrer = document.referrer || "(direto)";
    }
    if (found) stored.last_touch = new Date().toISOString();

    // Origem da sessão (heurística quando não há UTM)
    if (!stored.utm_source) {
      var ref = document.referrer || "";
      if (stored.fbclid || /facebook|instagram|fb\.me/i.test(ref)) stored.origem_sessao = "meta";
      else if (/google|bing|duckduckgo/i.test(ref)) stored.origem_sessao = "busca";
      else if (ref) stored.origem_sessao = "referral";
      else stored.origem_sessao = "direto";
    } else {
      stored.origem_sessao = stored.utm_source;
    }

    writeStore(stored);
    return stored;
  }

  var ATTRIB = initAttribution();

  /* ---------------------------------------------------------
     2. META PIXEL
     --------------------------------------------------------- */
  var pixelReady = false;

  function loadPixel() {
    if (!CFG.META_PIXEL_ID) {
      LOG("META_PIXEL_ID vazio em config.js — pixel NÃO carregado.");
      return;
    }
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', String(CFG.META_PIXEL_ID));
    pixelReady = true;
    LOG("Pixel inicializado:", CFG.META_PIXEL_ID);

    // noscript fallback
    var ns = document.createElement('noscript');
    ns.innerHTML = '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' +
      CFG.META_PIXEL_ID + '&ev=PageView&noscript=1" alt=""/>';
    document.head.appendChild(ns);
  }

  /* ---------------------------------------------------------
     3. GTM / GA4
     --------------------------------------------------------- */
  window.dataLayer = window.dataLayer || [];

  function loadGTM() {
    if (!CFG.GTM_ID) return;
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', CFG.GTM_ID);
    LOG("GTM carregado:", CFG.GTM_ID);
  }

  function loadGA4() {
    if (!CFG.GA4_ID) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.GA4_ID;
    document.head.appendChild(s);
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', CFG.GA4_ID);
    LOG("GA4 carregado:", CFG.GA4_ID);
  }

  /* ---------------------------------------------------------
     4. API PÚBLICA DE EVENTOS
     N7.track('Lead', {...})  -> dispara em Meta + GA4 + dataLayer
     --------------------------------------------------------- */
  var STANDARD = ["PageView", "ViewContent", "Lead", "CompleteRegistration",
                  "Contact", "Schedule", "SubmitApplication", "InitiateCheckout"];

  function track(evento, params, eventId) {
    params = params || {};
    var payload = Object.assign({}, params, {
      campanha: CFG.NOME_CAMPANHA || "",
      origem_sessao: ATTRIB.origem_sessao || ""
    });

    // Meta
    if (pixelReady && window.fbq) {
      var opts = eventId ? { eventID: eventId } : undefined;
      if (STANDARD.indexOf(evento) > -1) fbq('track', evento, payload, opts);
      else fbq('trackCustom', evento, payload, opts);
    }
    // GA4
    if (window.gtag) gtag('event', evento, payload);
    // GTM
    dataLayer.push(Object.assign({ event: 'n7_' + evento }, payload));

    LOG("evento:", evento, payload, eventId ? "(id " + eventId + ")" : "");
  }

  function eventId() {
    return 'n7_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  /* ---------------------------------------------------------
     5. DADOS DE ATRIBUIÇÃO PARA ANEXAR AO LEAD
     --------------------------------------------------------- */
  function attribution() {
    var a = readStore();
    return {
      utm_source:   a.utm_source   || "",
      utm_medium:   a.utm_medium   || "",
      utm_campaign: a.utm_campaign || "",
      utm_content:  a.utm_content  || "",
      utm_term:     a.utm_term     || "",
      fbclid:       a.fbclid       || "",
      gclid:        a.gclid        || "",
      fbp:          getCookie("_fbp"),
      fbc:          getCookie("_fbc"),
      pagina_url:   window.location.href,
      landing_page: a.landing_page || "",
      referrer:     a.referrer     || "",
      origem_sessao: a.origem_sessao || "",
      data_hora:    new Date().toISOString(),
      data_hora_br: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      dispositivo:  detectDevice(),
      user_agent:   navigator.userAgent,
      resolucao:    window.screen.width + "x" + window.screen.height,
      idioma:       navigator.language || "",
      campanha:     CFG.NOME_CAMPANHA || ""
    };
  }

  /* ---------------------------------------------------------
     6. BOOT
     --------------------------------------------------------- */
  loadPixel();
  loadGTM();
  loadGA4();

  // PageView imediato
  track('PageView');

  // ViewContent quando a página é efetivamente visualizada
  var vcSent = false;
  function sendViewContent() {
    if (vcSent) return; vcSent = true;
    track('ViewContent', {
      content_name: document.title,
      content_category: 'landing-page',
      content_type: 'product'
    });
  }
  if (document.visibilityState === 'visible') setTimeout(sendViewContent, 1200);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') sendViewContent();
  });

  // Marcos de scroll (úteis para otimização e públicos)
  var marcos = [25, 50, 75, 100], disparados = {};
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var pct = Math.round((h.scrollTop || document.body.scrollTop) /
      ((h.scrollHeight || document.body.scrollHeight) - h.clientHeight) * 100);
    marcos.forEach(function (m) {
      if (pct >= m && !disparados[m]) { disparados[m] = true; track('Scroll' + m); }
    });
  }, { passive: true });

  window.N7 = {
    track: track,
    eventId: eventId,
    attribution: attribution,
    config: CFG,
    log: LOG
  };
})();
