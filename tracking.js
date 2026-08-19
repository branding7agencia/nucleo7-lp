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
  // Tudo que pode vir na URL e diz de onde a pessoa veio.
  //
  // `ad` e o nome do anuncio, mandado pela Meta na URL do criativo. Sem ele o
  // relatorio para em "veio do Instagram" e nunca chega em "veio DESTE
  // anuncio", que e a pergunta que decide o que pausar.
  //
  // Os do Google (adgroup, keyword, placement, network, device) vem do
  // ValueTrack: {campaignid}, {creative}, {adgroupid}, {keyword},
  // {placement}, {network}, {device} sao substituidos pelo proprio Google no
  // clique. Sem captura-los, campanha de busca vira uma linha so no painel.
  var UTM_KEYS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "fbclid", "gclid", "ttclid",
    "ad",
    "adgroup", "keyword", "placement", "network", "device"
  ];

  // O Google manda a macro crua quando a URL final foi montada errada
  // ("{keyword}" em vez da palavra). Guardar isso sujaria o relatorio com uma
  // origem chamada {campaignid} — ja aconteceu com {{ad.name}} vindo da Meta.
  function macroNaoSubstituida(v) {
    return /^\{.*\}$/.test(v) || /^\{\{.*\}\}$/.test(v);
  }
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
      if (v && !macroNaoSubstituida(v)) { stored[k] = v; found = true; }
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

  /* ---------------------------------------------------------
     4.0 IDENTIDADE DA VISITA
     --------------------------------------------------------- */
  // Um id por visitante, guardado no navegador. E o que permite contar o funil
  // por PESSOA: sem ele, quem volta na etapa 2 tres vezes viraria tres pessoas
  // e a taxa de conclusao sairia menor do que e.
  //
  // localStorage e nao cookie de propósito: nao vai no cabecalho de toda
  // requisicao e sobrevive ao fechamento da aba.
  var SESSION_KEY = 'n7_sid';
  function sessionId() {
    try {
      var id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      // Navegador em modo restrito: o funil desta visita fica solto, mas o
      // evento nao pode ser perdido por causa disso.
      return 's_' + Date.now().toString(36);
    }
  }
  var SID = sessionId();

  // O GA4 grava o proprio id no cookie _ga como "GA1.1.<id>.<ts>". Mandar o
  // mesmo id no Measurement Protocol faz o evento do servidor cair na MESMA
  // sessao do evento do browser, em vez de inventar um usuario novo.
  function gaClientId() {
    var raw = getCookie('_ga');
    if (!raw) return '';
    var p = raw.split('.');
    return p.length >= 4 ? p[2] + '.' + p[3] : '';
  }

  // Eventos que a Edge Function lp-meta-capi aceita. Precisa bater com a
  // allowlist de la — o que nao estiver nos dois lados volta 400 e so polui o
  // console. Os demais (ClickCTA, FormStep...) continuam so no browser.
  // Eventos que a Meta recebe SO pelo servidor, para o gate de 7 dias valer.
  // Ver comentario dentro de track().
  var SO_SERVIDOR = ["FormStep1", "FormStep2", "FormStep3", "Lead", "InitiateCheckout"];

  var CAPI_EVENTS = ["PageView", "ViewContent", "Lead", "Contact",
                     "CompleteRegistration", "InitiateCheckout",
                     "FormStep1", "FormStep2", "FormStep3",
                     "Scroll25", "Scroll50", "Scroll75", "Scroll100"];

  // Copia do evento pelo servidor (Conversions API). Existe porque bloqueador
  // de anuncio e ITP do Safari matam parte dos disparos do browser. O mesmo
  // event_id vai nos dois caminhos: a Meta descarta a copia e nao conta dobrado.
  //
  // Nao manda token nenhum — quem guarda o token e a Edge Function.
  function sendCapi(evento, eventId, params, userData) {
    if (!CFG.META_CAPI_ENDPOINT || !eventId) return;
    if (CAPI_EVENTS.indexOf(evento) === -1) return;

    var body = {
      event_name: evento,
      event_id: eventId,
      event_source_url: window.location.href,
      custom_data: params || {},
      user_data: Object.assign({
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc")
      }, userData || {})
    };

    // keepalive: o Lead dispara junto com a troca de pagina para o obrigado.html.
    // Sem isso o navegador cancela a requisicao no unload e o evento se perde.
    try {
      fetch(CFG.META_CAPI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
        mode: "cors"
      }).then(function (r) {
        return r.json().catch(function () { return {}; });
      }).then(function (j) {
        LOG("CAPI", evento, j && j.ok ? "ok" : "falhou", j);
      }).catch(function (e) {
        // CAPI e redundancia: se cair, o pixel do browser ja registrou.
        LOG("CAPI falhou (evento segue valendo pelo browser):", evento, e);
      });
    } catch (e) {
      LOG("CAPI nao pode ser chamada:", e);
    }
  }

  // Coleta propria: grava o evento no banco (area admin) e repassa ao GA4 pelo
  // servidor. Independente da CAPI da Meta — se um cair, o outro continua.
  function sendLpTrack(evento, params, eventIdEvento, lead) {
    if (!CFG.LP_TRACK_ENDPOINT) return;

    // ?ga_debug=1 na URL manda o evento para o DebugView do GA4.
    //
    // Existe porque o Tag Assistant NAO mostra evento de Measurement Protocol:
    // ele so enxerga o que o navegador dispara. O evento das etapas sai do
    // nosso servidor, entao a unica forma de ve-lo ao vivo e o DebugView.
    var body = {
      session_id: SID,
      ga_debug: /[?&]ga_debug=1/.test(window.location.search),
      event_name: evento,
      event_id: eventIdEvento || '',
      ga_client_id: gaClientId(),
      params: params || {},
      attribution: attribution()
    };
    if (lead) body.lead = lead;

    try {
      fetch(CFG.LP_TRACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
        mode: 'cors'
      }).then(function (r) {
        return r.json().catch(function () { return {}; });
      }).then(function (j) {
        LOG('lp-track', evento, j && j.ok ? 'ok' : 'falhou', j);
      }).catch(function (e) {
        LOG('lp-track falhou:', evento, e);
      });
    } catch (e) {
      LOG('lp-track nao pode ser chamada:', e);
    }
  }

  function track(evento, params, eventIdArg, userData, lead) {
    params = params || {};
    var payload = Object.assign({}, params, {
      campanha: CFG.NOME_CAMPANHA || "",
      origem_sessao: ATTRIB.origem_sessao || ""
    });

    // Todo evento espelhado na CAPI precisa de id proprio para a deduplicacao.
    // Quem chama pode passar o seu (o formulario passa, para casar com a planilha).
    var eid = eventIdArg || (CFG.META_CAPI_ENDPOINT && CAPI_EVENTS.indexOf(evento) > -1 ? eventId() : "");

    // Meta.
    //
    // Os eventos do formulario NAO saem pelo navegador: vao so pelo servidor,
    // onde existe o gate de "um por telefone a cada 7 dias". Disparar aqui
    // tambem furaria o gate — o event_id da deduplicacao da Meta so vale por
    // 48h, e o pedido e de 7 dias, entao o segundo preenchimento entraria como
    // pessoa nova.
    var soPeloServidor = SO_SERVIDOR.indexOf(evento) > -1;
    if (pixelReady && window.fbq && !soPeloServidor) {
      var opts = eid ? { eventID: eid } : undefined;
      if (STANDARD.indexOf(evento) > -1) fbq('track', evento, payload, opts);
      else fbq('trackCustom', evento, payload, opts);
    }
    // GA4
    if (window.gtag) gtag('event', evento, payload);
    // GTM
    dataLayer.push(Object.assign({ event: 'n7_' + evento }, payload));
    // Meta pelo servidor.
    //
    // Sem telefone o gate de 7 dias nao tem por onde deduplicar, e os eventos
    // de etapa mandam os dados no snapshot (5o argumento), nao em userData.
    // Entao um vira o outro aqui.
    var dadosMeta = userData;
    if (!dadosMeta && lead && (lead.whatsapp_e164 || lead.whatsapp)) {
      dadosMeta = {
        phone: lead.whatsapp_e164 || lead.whatsapp,
        email: lead.email || '',
        first_name: (lead.nome || '').split(' ')[0] || '',
        last_name: (lead.nome || '').split(' ').slice(1).join(' ')
      };
    }
    sendCapi(evento, eid, payload, dadosMeta);
    // Coleta propria + GA4 pelo servidor
    sendLpTrack(evento, payload, eid, lead);

    LOG("evento:", evento, payload, eid ? "(id " + eid + ")" : "");
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
      // Nome do anuncio (Meta) e detalhamento do Google Ads (ValueTrack).
      anuncio:      a.ad           || "",
      adgroup:      a.adgroup      || "",
      keyword:      a.keyword      || "",
      placement:    a.placement    || "",
      network:      a.network      || "",
      device_ads:   a.device       || "",
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
    sessionId: function () { return SID; },
    attribution: attribution,
    config: CFG,
    log: LOG
  };
})();
