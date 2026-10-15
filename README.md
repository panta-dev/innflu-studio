# Innflu - Automated Instagram Influencer Discovery & Outreach SaaS

> **Innflu** é uma plataforma de automação e prospecção de influenciadores para Instagram com **mineração automática por palavra-chave**, filtros avançados (10k+ seguidores, Stories ativos nas últimas 24h, gênero e nicho), infraestrutura **Cloudflare** (Workers, Pages, D1 e Workers AI) e uma **Extensão de Navegador Anti-Ban** com comportamento 100% humano (delays aleatórios de 60s a 180s).

---

## 🌟 O Diferencial: Por que o Innflu supera concorrentes como o DirectSpeed?

No DirectSpeed e ferramentas similares, o usuário precisa **garimpar e importar listas manuais de arrobas** (@). Isso consome horas de trabalho manual diário.

No **Innflu**:
1. Você apenas digita a **palavra-chave / nicho** (ex: `maternidade`, `skincare`, `moda fitness`).
2. O sistema **descobre e analisa perfis automaticamente**:
   - 👥 **Filtro de Seguidores:** Valida piso mínimo (ex: $\ge 10.000$ seguidores).
   - 🔴 **Filtro de Stories Ativos:** Identifica o anel gradiente no avatar (sinal de que a influenciadora postou hoje e está com engajamento quente).
   - 👩 **Filtro de Gênero & Nicho:** Heurística de nomes brasileiros + termos na bio + IA leve (Workers AI).
3. **Disparo Anti-Ban 100% Humano:**
   - Envio 1 a 1 diretamente na sessão real do navegador.
   - Digitação simulada tecla por tecla com variação de velocidade humana.
   - Delays aleatórios seguros de **60 a 180 segundos** entre envios.
   - Pausas de descanso (cooldown) e limites diários estritos (ex: 35-50 DMs/dia).
   - **Histórico Persistente (Cloudflare D1):** Garante que o mesmo perfil nunca seja contatado duas vezes.

---

## 🏗️ Arquitetura do Projeto

```text
innflu/
├── cloudflare/                  # Backend Serverless & Dashboard Web (Cloudflare)
│   ├── wrangler.toml            # Configuração do Worker, D1 e Workers AI
│   ├── schema.sql               # Banco SQLite D1 (Campanhas, Leads, Histórico, Blacklist)
│   ├── package.json             # Dependências do Worker (Hono REST API)
│   ├── src/
│   │   ├── index.ts             # API REST completa (Leads, Campanhas, Sincronização)
│   │   └── ai.ts                # Análise inteligente de Bio com Workers AI / LLM
│   └── public/                  # Dashboard Web SPA moderno (Cloudflare Pages)
│       └── index.html           # Interface Glassmorphism (Controle, CRM e Métricas)
│
└── extension/                   # Extensão Manifest V3 (Chrome & Microsoft Edge)
    ├── manifest.json            # Configuração Manifest V3
    ├── popup/                   # Popup da extensão (Conexão API e Status)
    ├── background/              # Service Worker (Fila de Tarefas, Alarmes de Delay e Sync)
    ├── content/                 # Scripts injetados no Instagram Web
    │   ├── inspector.js         # Validador de Stories, Seguidores e Bio
    │   ├── sender.js            # Simulador de digitação humana e envio de DM
    │   └── overlay.js           # Painel flutuante interativo (HUD) no Instagram
    ├── lib/                     # Utilitários (Spintax, Dicionário de Nomes e Gênero)
    └── styles/                  # Estilo Dark Glassmorphism do HUD
```

---

## 🚀 Como Iniciar e Rodar o Projeto

### 1. Configurando o Backend no Cloudflare (Workers + D1)

```bash
cd cloudflare
npm install

# 1. Criar o banco de dados Cloudflare D1
npx wrangler d1 create innflu-db

# 2. Executar o schema no banco de dados local para desenvolvimento
npx wrangler d1 execute innflu-db --local --file=./schema.sql

# 3. Rodar a API localmente
npm run dev
```

Para fazer o deploy em produção no Cloudflare:
```bash
# Executar migration no D1 remoto
npx wrangler d1 execute innflu-db --remote --file=./schema.sql

# Deploy do Worker e Painel
npx wrangler deploy
```

---

### 2. Instalando a Extensão no Navegador (Chrome / Edge)

1. Abra seu navegador Chrome ou Microsoft Edge.
2. Acesse `chrome://extensions` ou `edge://extensions`.
3. Ative o **Modo do Desenvolvedor** (Developer Mode) no canto superior direito.
4. Clique em **"Carregar sem compactação"** (Load unpacked).
5. Selecione a pasta `extension/` deste projeto.
6. Abra o [Instagram Web](https://www.instagram.com) já logado na sua conta.
7. O painel flutuante do **Innflu** aparecerá no canto inferior direito da tela!

---

## 🛡️ Políticas de Segurança & Anti-Ban

- **Padrão de Delays:** O Innflu utiliza intervalo randômico de 60 a 180 segundos. Nunca diminua esse tempo para menos de 60 segundos.
- **Volume Diário Recomendado:** Contas novas: 15-25 DMs/dia. Contas aquecidas (> 6 meses): 40-50 DMs/dia.
- **Spintax Ativo:** Sempre utilize variações de mensagem (`{Olá|Oi|Tudo bem}`) para garantir que cada DM seja única.
