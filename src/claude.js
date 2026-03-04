const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT } = require('./prompt');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Histórico de conversa por número de telefone (em memória)
const conversationHistory = new Map();

function getHistory(phone) {
  if (!conversationHistory.has(phone)) {
    conversationHistory.set(phone, []);
  }
  return conversationHistory.get(phone);
}

function addToHistory(phone, role, content) {
  const history = getHistory(phone);
  history.push({ role, content });
  // Manter apenas as últimas 20 mensagens para não exceder o limite
  if (history.length > 20) history.splice(0, history.length - 20);
}

async function askJarvis(phone, userMessage) {
  addToHistory(phone, 'user', userMessage);

  const history = getHistory(phone);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  const assistantReply = response.content[0].text;
  addToHistory(phone, 'assistant', assistantReply);

  return assistantReply;
}

function clearHistory(phone) {
  conversationHistory.delete(phone);
}

module.exports = { askJarvis, clearHistory };
