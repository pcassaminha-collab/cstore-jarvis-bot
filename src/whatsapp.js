const axios = require('axios');

const EVOLUTION_URL      = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY  = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'cstore';

const api = axios.create({
  baseURL: EVOLUTION_URL,
  headers: {
    'apikey': EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Enviar mensagem de texto
async function sendMessage(to, text) {
  try {
    // Limpar o número (remover @s.whatsapp.net se vier no webhook)
    const phone = to.replace('@s.whatsapp.net', '');
    await api.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
      number: phone,
      text: text,
    });
    console.log(`[WhatsApp] Mensagem enviada para ${phone}`);
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar:', err.response?.data || err.message);
  }
}

module.exports = { sendMessage };
