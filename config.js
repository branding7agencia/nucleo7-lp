/* ============================================================
   NÚCLEO7 — ÁREA DE CONFIGURAÇÃO
   Altere APENAS este arquivo para trocar IDs e integrações.
   Nenhum ID fica fixo dentro do código da página.
   ============================================================ */

window.N7_CONFIG = {

  /* ---------- META / FACEBOOK ---------- */
  // Pixel "Nucleo7 - Site" — criado em 16/08/2026 na conta Núcleo7 (Nova Conta de Anúncio)
  // Conta de anúncios: 1439142090326862 · Portfólio: Agência B7 (436217605742161)
  META_PIXEL_ID: "1045184531818561",

  // Token da Conversions API (opcional, usado pelo servidor/webhook — NÃO exponha em produção)
  META_CAPI_ENDPOINT: "", // ex.: "https://seu-n8n.com/webhook/capi"

  /* ---------- GOOGLE ---------- */
  GTM_ID:  "GTM-W4W74PLC",   // Conta "Núcleo7" · contêiner "nucleosete.com.br"
  // GA4 = G-YL73DB5NW8 (propriedade "nucleosete.com.br", fluxo "LP Trafego e Marketing").
  // Deixado VAZIO de propósito: quem carrega o GA4 é o GTM.
  // Preencher aqui faria a página carregar o GA4 duas vezes e dobrar as sessões.
  GA4_ID:  "",

  /* ---------- DESTINO DOS LEADS ---------- */
  // Google Apps Script "Recebedor de Leads - LP Nucleo7".
  // Grava na planilha "Leads LP Trafego e Marketing - Nucleo7", aba "Leads":
  // https://docs.google.com/spreadsheets/d/1RtiOzePuxcadXRDl1oP9grqxej7GRiKgHrZlR7sDVNc/edit
  WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbxtFSb_GsWfkEta_DsqGGcvvl1W9g6_y2IIDVY8bX65SbVB7YM8KqORhAQ-WurafQQG/exec",

  // text/plain evita o preflight CORS que o Apps Script não responde.
  // Se um dia trocar para Make/Zapier/n8n, pode voltar para "application/json".
  WEBHOOK_CONTENT_TYPE: "text/plain;charset=utf-8",

  // Fallback por WhatsApp DESLIGADO a pedido do cliente.
  WHATSAPP_FALLBACK: false,
  WHATSAPP_NUMERO: "5577981223827", // Comercial Núcleo7 — (77) 98122-3827

  /* ---------- PÁGINAS ---------- */
  PAGINA_OBRIGADO: "obrigado.html",

  /* ---------- CAMPANHA ---------- */
  NOME_CAMPANHA: "selecao-empresa-2026",

  /* ---------- MODO DEBUG ---------- */
  // true = imprime no console todos os eventos e o payload do lead
  DEBUG: false
};
