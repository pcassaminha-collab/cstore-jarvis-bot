# 🤖 J.A.R.V.I.S — Guia de Instalação Completo
## C Store Angola — WhatsApp Bot

---

## ✅ PRÉ-REQUISITOS

- [ ] Conta no **Railway.app** (já tens ✓)
- [ ] Conta no **GitHub** (para fazer deploy)
- [ ] Chave API do **Claude** (console.anthropic.com)
- [ ] **Bot do Telegram** criado (@BotFather)

---

## PASSO 1 — Obter a chave do Claude (Anthropic)

1. Vai a: https://console.anthropic.com
2. Clica em **API Keys** → **Create Key**
3. Copia a chave (começa por `sk-ant-...`)
4. Guarda — só aparece uma vez!

---

## PASSO 2 — Criar o Bot do Telegram

1. Abre o Telegram e procura: **@BotFather**
2. Envia: `/newbot`
3. Escolhe um nome: `CStore Angola`
4. Escolhe um username: `cstore_angola_bot`
5. Copia o **token** que o BotFather te dá
6. Para obter o teu **Chat ID**:
   - Envia uma mensagem ao teu bot
   - Vai a: `https://api.telegram.org/botTEU_TOKEN/getUpdates`
   - Copia o número em `"id"` dentro de `"chat"`

---

## PASSO 3 — Publicar no GitHub

1. Cria uma conta em **github.com** (se não tiveres)
2. Cria um repositório novo: `cstore-jarvis-bot`
3. Faz upload de todos os ficheiros desta pasta
   - Atenção: NÃO faças upload do ficheiro `.env`!

---

## PASSO 4 — Deploy no Railway

1. Vai a **railway.app** e entra na tua conta
2. Clica em **New Project** → **Deploy from GitHub repo**
3. Selecciona o repositório `cstore-jarvis-bot`
4. Railway detecta automaticamente e faz o deploy

**Configurar as variáveis de ambiente no Railway:**
1. Clica no teu projecto → **Variables**
2. Adiciona cada variável do ficheiro `.env.example`:

```
ANTHROPIC_API_KEY     = sk-ant-XXXXX
EVOLUTION_API_URL     = (ver passo 5)
EVOLUTION_API_KEY     = (ver passo 5)
EVOLUTION_INSTANCE    = cstore
TELEGRAM_BOT_TOKEN    = 123456:AAXXXXX
TELEGRAM_CHAT_ID      = 123456789
PORT                  = 3000
```

3. Railway reinicia automaticamente com as novas variáveis
4. Copia o URL do teu servidor: `https://cstore-jarvis-bot.up.railway.app`

---

## PASSO 5 — Instalar e Configurar a Evolution API

A Evolution API é o que conecta o servidor ao WhatsApp.

**Opção A — No mesmo Railway (mais fácil):**
1. No Railway, clica **New** → **Deploy Template**
2. Procura **Evolution API**
3. Faz deploy — fica no mesmo projecto
4. Copia o URL e a API Key gerados

**Opção B — Evolution API já instalada:**
- Usa o URL e API Key que já tens

**Configurar o Webhook:**
1. Abre o painel da Evolution API
2. Vai a: **Instances** → **cstore** → **Webhook**
3. URL do Webhook: `https://cstore-jarvis-bot.up.railway.app/webhook`
4. Eventos a activar: ✅ `messages.upsert`
5. Guarda

---

## PASSO 6 — Conectar o WhatsApp (QR Code)

1. Abre o painel da Evolution API
2. Vai a **Instances** → **cstore** → **Connect**
3. Aparece o QR Code — lê com o teu WhatsApp
4. ✅ Conectado!

---

## PASSO 7 — Configurar o Telegram para receber comandos

Para o Telegram enviar comandos ao servidor:
1. No Telegram, vai às definições do teu bot (@BotFather)
2. `/setwebhook` → URL: `https://cstore-jarvis-bot.up.railway.app/telegram-command`

Ou faz manualmente via browser:
```
https://api.telegram.org/botTEU_TOKEN/setWebhook?url=https://cstore-jarvis-bot.up.railway.app/telegram-command
```

---

## 🎮 COMANDOS DO TELEGRAM (depois de tudo configurado)

| Comando | Descrição |
|---------|-----------|
| `/bot on 244923441882` | Reactiva o J.A.R.V.I.S para esse número |
| `/bot off 244923441882` | Pausa o bot (modo humano) |
| `/lista` | Ver quais conversas estão em modo humano |

---

## ✅ TESTAR SE ESTÁ TUDO OK

1. Abre o browser e vai a: `https://cstore-jarvis-bot.up.railway.app`
2. Deves ver: `{ "status": "🤖 J.A.R.V.I.S online", ... }`
3. Envia uma mensagem ao número do WhatsApp conectado
4. O J.A.R.V.I.S deve responder automaticamente!

---

## 🆘 PROBLEMAS COMUNS

**Bot não responde:**
- Verifica se o Railway está a correr (sem erros nos logs)
- Confirma que o Webhook está configurado na Evolution API
- Verifica se as variáveis de ambiente estão todas preenchidas

**Mensagens duplicadas:**
- O WhatsApp pode estar conectado em dois lugares
- Desconecta e reconecta o QR Code

**Erro de API Key:**
- Confirma que a chave do Claude está correcta
- Verifica se tens créditos em console.anthropic.com

---

## 📞 SUPORTE

Se tiveres dúvidas, tira uma captura de ecrã dos logs do Railway
e partilha para diagnóstico.
