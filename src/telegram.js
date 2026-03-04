const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Token ou Chat ID não configurado.');
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    });
    console.log('[Telegram] Notificação enviada.');
  } catch (err) {
    console.error('[Telegram] Erro ao enviar:', err.message);
  }
}

// Notificação de nova encomenda
function notifyNewOrder({ produto, cor, cliente, endereco, hora, telefone }) {
  const msg = `
🔔 <b>NOVA ENCOMENDA — C Store Angola</b>
━━━━━━━━━━━━━━━━
📦 <b>Produto:</b> ${produto}
🎨 <b>Cor:</b> ${cor || 'N/A'}
👤 <b>Cliente:</b> ${cliente}
📍 <b>Endereço:</b> ${endereco}
🕐 <b>Hora desejada:</b> ${hora}
📱 <b>Contacto:</b> ${telefone}
━━━━━━━━━━━━━━━━
⚠️ <b>Confirme e encaminhe ao entregador.</b>
  `.trim();
  return sendTelegram(msg);
}

// Notificação de pedido de intervenção humana
function notifyHumanNeeded({ nome, telefone, ultimaMensagem }) {
  const msg = `
👤 <b>INTERVENÇÃO HUMANA NECESSÁRIA</b>
━━━━━━━━━━━━━━━━
👤 <b>Cliente:</b> ${nome || 'Desconhecido'}
📱 <b>Número:</b> ${telefone}
💬 <b>Última mensagem:</b> "${ultimaMensagem}"
━━━━━━━━━━━━━━━━
🤖 <b>J.A.R.V.I.S pausado.</b> Entre no WhatsApp e responda manualmente.
Quando terminar, reative o bot respondendo: <code>/bot on ${telefone}</code>
  `.trim();
  return sendTelegram(msg);
}

module.exports = { sendTelegram, notifyNewOrder, notifyHumanNeeded };
