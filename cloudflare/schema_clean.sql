CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    plan TEXT DEFAULT 'pro',
    api_token TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'usr_admin_01',
    name TEXT NOT NULL,
    keyword TEXT NOT NULL,
    target_gender TEXT DEFAULT 'female',
    min_followers INTEGER DEFAULT 10000,
    max_followers INTEGER DEFAULT 10000000,
    require_active_stories INTEGER DEFAULT 1,
    daily_limit INTEGER DEFAULT 40,
    min_delay_sec INTEGER DEFAULT 60,
    max_delay_sec INTEGER DEFAULT 180,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'usr_admin_01',
    campaign_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
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

CREATE TABLE IF NOT EXISTS sent_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'usr_admin_01',
    campaign_id TEXT,
    username TEXT NOT NULL,
    message_text TEXT NOT NULL,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blacklist (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'usr_admin_01',
    username TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, username)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_token ON users(api_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_username ON leads(username);
CREATE INDEX IF NOT EXISTS idx_leads_user_username ON leads(user_id, username);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_logs_user_id ON sent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_logs_username ON sent_logs(username);
CREATE INDEX IF NOT EXISTS idx_sent_logs_sent_at ON sent_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_blacklist_user_id ON blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_user_username ON blacklist(user_id, username);

INSERT OR IGNORE INTO users (id, email, password_hash, full_name, company_name, plan, api_token) VALUES
('usr_admin_01', 'admin@innflu.com.br', 'dec448ad30b43c85ad3a9390e70535fd66442f27621c9d8b3edc2168aea66ba3', 'Administrador Innflu', 'Innflu HQ', 'pro', 'inf_live_adm123456789');

INSERT OR IGNORE INTO settings (key, value) VALUES 
('api_key', 'inf_live_adm123456789'),
('safe_mode_enabled', 'true'),
('daily_sent_count', '0'),
('last_reset_date', DATE('now'));
