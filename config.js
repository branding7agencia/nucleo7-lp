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
  GTM_ID:  "",   // ex.: "GTM-XXXXXXX"
  GA4_ID:  "",   // ex.: "G-XXXXXXXXXX"

  /* ---------- DESTINO DOS LEADS ---------- */
  // URL do webhook (n8n / Make / Zapier). O lead é enviado via POST JSON.
  WEBHOOK_URL: "",

  // Enviar também para o WhatsApp caso o webhook não esteja configurado (fallback)
  WHATSAPP_FALLBACK: true,
  WHATSAPP_NUMERO: "5577981223827", // Comercial Núcleo7 — (77) 98122-3827

  /* ---------- PÁGINAS ---------- */
  PAGINA_OBRIGADO: "obrigado.html",

  /* ---------- CAMPANHA ---------- */
  NOME_CAMPANHA: "selecao-empresa-2026",

  /* ---------- MODO DEBUG ---------- */
  // true = imprime no console todos os eventos e o payload do lead
  DEBUG: false
};
