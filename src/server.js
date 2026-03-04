require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { askJarvis, clearHistory } = require('./claude');
const { sendMessage }             = require('./whatsapp');
const { notifyNewOrder, notifyHumanNeeded, sendTelegram } = require('./telegram');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
//  Estado do bot por número (em memória)
//  true  = bot activo
//  false = humano em controlo
// ─────────────────────────────────────────────────────────────
const botStatus = new Map(); // phone → boolean

function isBotActive(phone) {
  // Por padrão, bot está activo para todos
  return botStatus.get(phone) !== false;
}

// ─────────────────────────────────────────────────────────────
//  Parser de tags especiais que o J.A.R.V.I.S coloca
// ─────────────────────────────────────────────────────────────
function parseOrderTag(text) {
  const match = text.match(/\[NOVA_ENCOMENDA\|(.+?)\]/);
  if (!match) return null;

  const parts = {};
  match[1].split('|').forEach(p => {
    const [k, v] = p.split(':');
    if (k && v) parts[k.trim()] = v.trim();
  });
  return parts;
}

function hasHumanTransferTag(text) {
  return text.includes('[TRANSFERIR_HUMANO]');
}

function cleanResponse(text) {
  // Remove as tags internas antes de enviar ao cliente
  return text
    .replace(/\[NOVA_ENCOMENDA\|[^\]]+\]/g, '')
    .replace(/\[TRANSFERIR_HUMANO\]/g, '')
    .trim();
}

// ─────────────────────────────────────────────────────────────
//  WEBHOOK — Evolution API chama este endpoint
//  Configurar no Evolution: POST https://teu-servidor.railway.app/webhook
// ─────────────────────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Responder imediatamente para não dar timeout

  try {
    const body = req.body;

    // Ignorar eventos que não são mensagens
    if (body.event !== 'messages.upsert') return;

    const msg = body.data?.messages?.[0];
    if (!msg) return;

    // Ignorar mensagens enviadas pelo próprio bot
    if (msg.key?.fromMe) return;

    const phone       = msg.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const messageText = msg.message?.conversation
                     || msg.message?.extendedTextMessage?.text
                     || '';

    if (!phone || !messageText) return;

    console.log(`[Webhook] Mensagem de ${phone}: "${messageText}"`);

    // ── Bot pausado para este número? ──
    if (!isBotActive(phone)) {
      console.log(`[Bot] Pausado para ${phone} — humano em controlo.`);
      return;
    }

    // ── Pedir ao J.A.R.V.I.S ──
    const rawReply = await askJarvis(phone, messageText);

    // ── Verificar tags especiais ──
    const orderData = parseOrderTag(rawReply);
    const needsHuman = hasHumanTransferTag(rawReply);

    // Limpar resposta antes de enviar ao cliente
    const cleanReply = cleanResponse(rawReply);

    // Enviar resposta ao cliente
    if (cleanReply) {
      await sendMessage(phone, cleanReply);
    }

    // ── Nova encomenda detectada ──
    if (orderData) {
      console.log(`[Encomenda] Nova encomenda de ${phone}:`, orderData);
      await notifyNewOrder({
        produto:   orderData.produto   || 'N/A',
        cor:       orderData.cor       || 'N/A',
        cliente:   orderData.cliente   || 'N/A',
        endereco:  orderData.endereco  || 'N/A',
        hora:      orderData.hora      || 'N/A',
        telefone:  phone,
      });
    }

    // ── Transferência para humano ──
    if (needsHuman) {
      console.log(`[Bot] Pausando para ${phone} — transferindo para humano.`);
      botStatus.set(phone, false);
      await notifyHumanNeeded({
        nome:           orderData?.cliente || 'Desconhecido',
        telefone:       phone,
        ultimaMensagem: messageText,
      });
    }

  } catch (err) {
    console.error('[Webhook] Erro:', err.message);
  }
});

// ─────────────────────────────────────────────────────────────
//  COMANDOS DO TELEGRAM — controlar o bot remotamente
//  Envia no Telegram: /bot on 244923441882
//  Envia no Telegram: /bot off 244923441882
// ─────────────────────────────────────────────────────────────
app.post('/telegram-command', async (req, res) => {
  const { message } = req.body;
  const text = message?.text || '';

  const onMatch  = text.match(/^\/bot on (.+)/);
  const offMatch = text.match(/^\/bot off (.+)/);
  const listMatch = text.match(/^\/lista/);

  if (onMatch) {
    const phone = onMatch[1].trim();
    botStatus.set(phone, true);
    clearHistory(phone);
    await sendTelegram(`✅ J.A.R.V.I.S reactivado para ${phone}`);
    return res.sendStatus(200);
  }

  if (offMatch) {
    const phone = offMatch[1].trim();
    botStatus.set(phone, false);
    await sendTelegram(`⏸ J.A.R.V.I.S pausado para ${phone}`);
    return res.sendStatus(200);
  }

  if (listMatch) {
    const pausados = [...botStatus.entries()]
      .filter(([, v]) => v === false)
      .map(([k]) => k);
    const msg = pausados.length
      ? `👤 Conversas em modo humano:\n${pausados.join('\n')}`
      : '✅ Todas as conversas estão com o bot activo.';
    await sendTelegram(msg);
    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// ─────────────────────────────────────────────────────────────
//  API REST — para o painel de gestão (frontend)
// ─────────────────────────────────────────────────────────────

// Listar estado do bot por número
app.get('/api/status', (req, res) => {
  const status = {};
  botStatus.forEach((v, k) => { status[k] = v; });
  res.json({ status, botGlobal: true });
});

// Activar/desactivar bot para um número específico
app.post('/api/toggle/:phone', (req, res) => {
  const { phone } = req.params;
  const current   = isBotActive(phone);
  botStatus.set(phone, !current);
  console.log(`[API] Bot para ${phone}: ${!current ? 'ACTIVO' : 'PAUSADO'}`);
  res.json({ phone, botActive: !current });
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: '🤖 J.A.R.V.I.S online',
    loja: 'C Store Angola',
    horario: 'Todos os dias 9h-18h',
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🤖  J.A.R.V.I.S — C Store Angola  ║
  ║   Servidor online na porta ${PORT}      ║
  ╚══════════════════════════════════════╝
  `);
});
