-- ==========================================================
-- INNFLU - MIGRATION MULTI-TENANT (USER ISOLATION)
-- ==========================================================

-- 1. MIGRAÇÃO DA TABELA DE LEADS COM UNIQUE(user_id, username)
CREATE TABLE IF NOT EXISTS leads_new (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'usr_admin_01',
    campaign_id TEXT,
    username TEXT NOT NULL,
    full_name TEXT,
    followers_count INTEGER DEFAULT 0,
    detected_gender TEXT DEFAULT 'unknown',
    has_active_stories INTEGER DEFAULT 0,
    whatsapp TEXT,
    email TEXT,
    bio TEXT,
    niche TEXT DEFAULT 'Geral',
    status TEXT DEFAULT 'pending',
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contacted_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    UNIQUE(user_id, username)
);

INSERT OR IGNORE INTO leads_new (id, user_id, campaign_id, username, full_name, followers_count, detected_gender, has_active_stories, whatsapp, email, bio, niche, status, discovered_at, last_contacted_at)
SELECT id, 'usr_admin_01', campaign_id, username, full_name, followers_count, detected_gender, has_active_stories, whatsapp, email, bio, niche, status, discovered_at, last_contacted_at 
FROM leads;

DROP TABLE leads;
ALTER TABLE leads_new RENAME TO leads;

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_username ON leads(username);
CREATE INDEX IF NOT EXISTS idx_leads_user_username ON leads(user_id, username);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche);

-- 2. MIGRAÇÃO DA TABELA DE CAMPANHAS
ALTER TABLE campaigns ADD COLUMN user_id TEXT DEFAULT 'usr_admin_01';
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

-- 3. MIGRAÇÃO DA TABELA DE TEMPLATES
ALTER TABLE templates ADD COLUMN user_id TEXT DEFAULT 'usr_admin_01';
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- 4. MIGRAÇÃO DA TABELA DE SENT_LOGS
ALTER TABLE sent_logs ADD COLUMN user_id TEXT DEFAULT 'usr_admin_01';
CREATE INDEX IF NOT EXISTS idx_sent_logs_user_id ON sent_logs(user_id);

-- 5. MIGRAÇÃO DA TABELA DE BLACKLIST COM UNIQUE(user_id, username)
CREATE TABLE IF NOT EXISTS blacklist_new (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'usr_admin_01',
    username TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, username)
);

INSERT OR IGNORE INTO blacklist_new (id, user_id, username, reason, created_at)
SELECT id, 'usr_admin_01', username, reason, created_at 
FROM blacklist;

DROP TABLE blacklist;
ALTER TABLE blacklist_new RENAME TO blacklist;

CREATE INDEX IF NOT EXISTS idx_blacklist_user_id ON blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_user_username ON blacklist(user_id, username);
