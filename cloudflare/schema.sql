-- ==========================================================
-- INNFLU - DATABASE SCHEMA (Cloudflare D1 SQLite)
-- ==========================================================

-- Tabela de Campanhas de Prospecção
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    keyword TEXT NOT NULL,
    target_gender TEXT DEFAULT 'female', -- 'female', 'male', 'all'
    min_followers INTEGER DEFAULT 10000,
    max_followers INTEGER DEFAULT 10000000,
    require_active_stories INTEGER DEFAULT 1, -- 1 = Sim, 0 = Não
    daily_limit INTEGER DEFAULT 40,
    min_delay_sec INTEGER DEFAULT 60,
    max_delay_sec INTEGER DEFAULT 180,
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Templates de Mensagens (com suporte a Spintax)
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Tabela de Leads / Influenciadores Minerados (Com WhatsApp e Email)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    followers_count INTEGER DEFAULT 0,
    detected_gender TEXT DEFAULT 'unknown',
    has_active_stories INTEGER DEFAULT 0,
    whatsapp TEXT,
    email TEXT,
    bio TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'minerada', 'sent', 'replied', 'skipped', 'blacklisted'
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contacted_at DATETIME,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

-- Histórico de Disparos de DM (Persistente Anti-Repetição com Regra de 7 Dias)
CREATE TABLE IF NOT EXISTS sent_logs (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    username TEXT NOT NULL,
    message_text TEXT NOT NULL,
    status TEXT DEFAULT 'success', -- 'success', 'failed', 'blocked'
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Blacklist
CREATE TABLE IF NOT EXISTS blacklist (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurações Gerais da Plataforma
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_leads_username ON leads(username);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_sent_logs_username ON sent_logs(username);
CREATE INDEX IF NOT EXISTS idx_sent_logs_sent_at ON sent_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_blacklist_username ON blacklist(username);

-- Dados Iniciais Padrão
INSERT OR IGNORE INTO settings (key, value) VALUES 
('api_key', 'innflu_secret_token_12345'),
('safe_mode_enabled', 'true'),
('daily_sent_count', '0'),
('last_reset_date', DATE('now'));

-- Campanha Padrão
INSERT OR IGNORE INTO campaigns (id, name, keyword, target_gender, min_followers, max_followers, require_active_stories, daily_limit, min_delay_sec, max_delay_sec, status)
VALUES (
    'camp_maternidade_01', 
    'Campanha Maternidade & Mamães', 
    'maternidade', 
    'female', 
    10000, 
    10000000, 
    1, 
    40, 
    60, 
    180, 
    'active'
);

-- Template Padrão com Spintax
INSERT OR IGNORE INTO templates (id, campaign_id, title, content, is_active)
VALUES (
    'tmpl_maternidade_01',
    'camp_maternidade_01',
    'Convite Parceria Maternidade',
    '{Olá|Oi|Oie} {nome}! {Tudo bem com você?|Como você está?|Espero que esteja tudo bem!}\n\nVi seu perfil e adorei o conteúdo que você compartilha sobre maternidade! {Estou muito encantada com sua rotina.|Achei suas publicações super autênticas e acolhedoras.}\n\nSomos uma marca e gostaríamos de te convidar para uma parceria com envio de produtos exclusivos sem nenhum custo. Você teria interesse em conhecer mais da nossa proposta?',
    1
);
