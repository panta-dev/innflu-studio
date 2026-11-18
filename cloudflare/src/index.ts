import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { analyzeProfileWithAI } from './ai';

type Bindings = {
  DB: D1Database;
  AI?: any;
  ASSETS?: Fetcher;
  ENVIRONMENT?: string;
  DEFAULT_DAILY_LIMIT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Configuração de CORS para permitir requisições da extensão e do dashboard
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Auto-inicialização transparente do Banco D1
let dbInitialized = false;
async function ensureSchema(db: D1Database) {
  if (dbInitialized) return;
  try {
    const check = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first();
    if (!check) {
      const tableQueries = [
        `CREATE TABLE IF NOT EXISTS users (
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
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS campaigns (
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
        )`,
        `CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'usr_admin_01',
            campaign_id TEXT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS leads (
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
        )`,
        `CREATE TABLE IF NOT EXISTS sent_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'usr_admin_01',
            campaign_id TEXT,
            username TEXT NOT NULL,
            message_text TEXT NOT NULL,
            status TEXT DEFAULT 'success',
            error_message TEXT,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS blacklist (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'usr_admin_01',
            username TEXT NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, username)
        )`,
        `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`
      ];

      for (const q of tableQueries) {
        await db.prepare(q).run();
      }

      const indexQueries = [
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_users_api_token ON users(api_token)",
        "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)",
        "CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_leads_username ON leads(username)",
        "CREATE INDEX IF NOT EXISTS idx_leads_user_username ON leads(user_id, username)",
        "CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)",
        "CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp)",
        "CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)",
        "CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche)",
        "CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_sent_logs_user_id ON sent_logs(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_sent_logs_username ON sent_logs(username)",
        "CREATE INDEX IF NOT EXISTS idx_sent_logs_sent_at ON sent_logs(sent_at)",
        "CREATE INDEX IF NOT EXISTS idx_blacklist_user_id ON blacklist(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_blacklist_user_username ON blacklist(user_id, username)"
      ];

      for (const idx of indexQueries) {
        await db.prepare(idx).run().catch(() => {});
      }

      await db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, full_name, company_name, plan, api_token) VALUES
        ('usr_admin_01', 'admin@innflu.com.br', 'dec448ad30b43c85ad3a9390e70535fd66442f27621c9d8b3edc2168aea66ba3', 'Administrador Innflu', 'Innflu HQ', 'pro', 'inf_live_adm123456789')
      `).run().catch(() => {});

      await db.prepare(`
        INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('api_key', 'inf_live_adm123456789'),
        ('safe_mode_enabled', 'true'),
        ('daily_sent_count', '0'),
        ('last_reset_date', DATE('now'))
      `).run().catch(() => {});
    }
    dbInitialized = true;
  } catch (err) {
    console.error('Auto-ensureSchema error:', err);
  }
}

app.use('/api/*', async (c, next) => {
  if (c.env?.DB) {
    await ensureSchema(c.env.DB);
  }
  await next();
});

// Endpoint explícito de verificação/inicialização do banco
app.get('/api/setup-db', async (c) => {
  if (!c.env?.DB) {
    return c.json({ error: 'DB binding ausente. Vincule o banco D1 (com a variável DB) nas configurações do Cloudflare Pages.' }, 500);
  }
  dbInitialized = false;
  await ensureSchema(c.env.DB);
  return c.json({ success: true, message: 'Banco D1 inicializado com sucesso!' });
});


// ==========================================
// HELPERS CRIPTOGRÁFICOS WEBCRYPTO (ZERO-DEPENDENCY)
// ==========================================
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = 'innflu_secure_salt_2026';
  const data = enc.encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(prefix: string = 'inf'): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const str = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${str}`;
}

// Helper de autenticação multi-tenant: identifica o usuário por sessão Bearer ou API Token
async function getAuthUser(db: D1Database, c: any): Promise<{ id: string; email: string; full_name: string; company_name?: string; plan: string; api_token: string; avatar_url?: string } | null> {
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || 
                c.req.header('X-API-Key') || 
                c.req.query('api_token') || 
                c.req.query('token') || '';

  if (token) {
    const sessionUser = await db.prepare(`
      SELECT u.id, u.email, u.full_name, u.company_name, u.plan, u.api_token, u.avatar_url
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
    `).bind(token).first<any>();
    if (sessionUser) return sessionUser;

    const apiUser = await db.prepare(`
      SELECT id, email, full_name, company_name, plan, api_token, avatar_url
      FROM users
      WHERE api_token = ?
    `).bind(token).first<any>();
    if (apiUser) return apiUser;
  }

  // Acesso sem autenticação estritamente bloqueado (Login e senha obrigatórios)
  return null;
}

// Rotas explícitas de navegação
app.get('/login', (c) => {
  return c.redirect('/login.html');
});

app.get('/dashboard', (c) => {
  return c.redirect('/dashboard/');
});

// ==========================================
// 0. AUTENTICAÇÃO SAAS (LOGIN, CADASTRO, SESSÃO)
// ==========================================
app.post('/api/auth/register', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Banco de dados D1 não configurado. Vincule o banco D1 (com a variável DB) nas configurações do Cloudflare Pages.' }, 500);

  const body = await c.req.json();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const fullName = (body.full_name || body.name || 'Usuário Innflu').trim();
  const companyName = (body.company_name || '').trim();

  if (!email || !password || password.length < 6) {
    return c.json({ error: 'E-mail válido e senha com no mínimo 6 caracteres são obrigatórios' }, 400);
  }

  // Verificar se usuário já existe
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return c.json({ error: 'Este e-mail já está cadastrado na plataforma' }, 409);
  }

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const passwordHash = await hashPassword(password);
  const apiToken = generateToken('inf_live');
  const sessionToken = generateToken('ses');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias

  try {
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, company_name, plan, api_token, avatar_url)
      VALUES (?, ?, ?, ?, ?, 'pro', ?, NULL)
    `).bind(userId, email, passwordHash, fullName, companyName, apiToken).run();

    await db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind('ses_' + Date.now(), userId, sessionToken, expiresAt).run();

    // Cria campanha inicial individual para o novo usuário
    await db.prepare(`
      INSERT INTO campaigns (id, user_id, name, keyword, target_gender, min_followers, max_followers, require_active_stories, daily_limit, min_delay_sec, max_delay_sec, status)
      VALUES (?, ?, 'Campanha Maternidade & Mamães', 'maternidade', 'female', 10000, 10000000, 1, 40, 60, 180, 'active')
    `).bind('camp_' + userId + '_01', userId).run();

    // Cria template inicial com Spintax para o novo usuário
    await db.prepare(`
      INSERT INTO templates (id, user_id, campaign_id, title, content, is_active)
      VALUES (?, ?, ?, 'Publicidade Stories Infoproduto', ?, 1)
    `).bind(
      'tmpl_' + userId + '_01',
      userId,
      'camp_' + userId + '_01',
      '{Olá|Oi|Oie} {nome}! {Tudo bem com você?|Como você está?|Tudo certinho?}\n\n{Adorei seu perfil|Achei seu conteúdo incrível|Vi seu perfil e amei seu trabalho}!\n\nGostaria de saber se você faz publicidade nos stories. Temos uma proposta de publicidade nos stories de um infoproduto digital.\n\n{Podemos conversar a respeito?|Topa saber mais detalhes?|Você tem disponibilidade?}'
    ).run();

    return c.json({
      success: true,
      message: 'Conta criada com sucesso!',
      token: sessionToken,
      user: {
        id: userId,
        email,
        full_name: fullName,
        company_name: companyName,
        plan: 'pro',
        api_token: apiToken,
        avatar_url: null
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Erro ao criar conta: ' + err.message }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Banco de dados D1 não configurado. Vincule o banco D1 (com a variável DB) nas configurações do Cloudflare Pages.' }, 500);

  const body = await c.req.json();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email || !password) {
    return c.json({ error: 'Informe e-mail e senha' }, 400);
  }

  const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
  if (!user) {
    return c.json({ error: 'E-mail ou senha incorretos' }, 401);
  }

  const computedHash = await hashPassword(password);
  if (computedHash !== user.password_hash) {
    return c.json({ error: 'E-mail ou senha incorretos' }, 401);
  }

  const sessionToken = generateToken('ses');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind('ses_' + Date.now(), user.id, sessionToken, expiresAt).run();

  return c.json({
    success: true,
    message: 'Login realizado com sucesso!',
    token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      company_name: user.company_name,
      plan: user.plan,
      api_token: user.api_token,
      avatar_url: user.avatar_url || null
    }
  });
});

app.get('/api/auth/me', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'DB não configurado' }, 500);

  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || c.req.query('token') || c.req.header('X-API-Key') || '';

  if (!token) {
    return c.json({ authenticated: false, error: 'Token não fornecido' }, 401);
  }

  // Tenta encontrar por token de sessão
  let user = await db.prepare(`
    SELECT u.id, u.email, u.full_name, u.company_name, u.plan, u.api_token, u.avatar_url, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).bind(token).first<any>();

  // Se não achou, tenta por API Token direto
  if (!user) {
    user = await db.prepare(`
      SELECT id, email, full_name, company_name, plan, api_token, avatar_url, created_at
      FROM users
      WHERE api_token = ?
    `).bind(token).first<any>();
  }

  if (!user) {
    return c.json({ authenticated: false, error: 'Sessão inválida ou expirada' }, 401);
  }

  return c.json({
    authenticated: true,
    user
  });
});

app.post('/api/auth/logout', async (c) => {
  const db = c.env.DB;
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (db && token) {
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  return c.json({ success: true, message: 'Logout efetuado' });
});

// ==========================================
// 0.1 GERENCIAMENTO COMPLETO DE PERFIL & CONTA
// ==========================================
app.get('/api/user/profile', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'DB não configurado' }, 500);

  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  const profile = await db.prepare(`
    SELECT id, email, full_name, company_name, plan, api_token, avatar_url, created_at
    FROM users WHERE id = ?
  `).bind(user.id).first<any>();

  return c.json({ success: true, user: profile });
});

app.put('/api/user/profile', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'DB não configurado' }, 500);

  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  const body = await c.req.json();
  const fullName = (body.full_name || user.full_name || '').trim();
  const companyName = body.company_name !== undefined ? (body.company_name || '').trim() : (user.company_name || '');
  const email = (body.email || user.email || '').trim().toLowerCase();
  const avatarUrl = body.avatar_url !== undefined ? body.avatar_url : (user.avatar_url || null);

  if (!email || !fullName) {
    return c.json({ error: 'Nome e E-mail são obrigatórios' }, 400);
  }

  if (email !== user.email) {
    const existing = await db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(email, user.id).first();
    if (existing) {
      return c.json({ error: 'Este e-mail já está em uso por outro usuário' }, 409);
    }
  }

  await db.prepare(`
    UPDATE users 
    SET full_name = ?, company_name = ?, email = ?, avatar_url = ?
    WHERE id = ?
  `).bind(fullName, companyName, email, avatarUrl, user.id).run();

  const updatedUser = await db.prepare(`
    SELECT id, email, full_name, company_name, plan, api_token, avatar_url, created_at
    FROM users WHERE id = ?
  `).bind(user.id).first<any>();

  return c.json({
    success: true,
    message: 'Perfil atualizado com sucesso!',
    user: updatedUser
  });
});

app.put('/api/user/password', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'DB não configurado' }, 500);

  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  const body = await c.req.json();
  const currentPassword = body.current_password || '';
  const newPassword = body.new_password || '';

  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Informe a senha atual e a nova senha' }, 400);
  }

  if (newPassword.length < 6) {
    return c.json({ error: 'A nova senha deve ter no mínimo 6 caracteres' }, 400);
  }

  const dbUser = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first<any>();
  const currentHash = await hashPassword(currentPassword);
  if (!dbUser || dbUser.password_hash !== currentHash) {
    return c.json({ error: 'Senha atual incorreta' }, 400);
  }

  const newHash = await hashPassword(newPassword);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newHash, user.id).run();

  return c.json({
    success: true,
    message: 'Senha alterada com sucesso!'
  });
});

app.post('/api/user/regenerate-token', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'DB não configurado' }, 500);

  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  const newToken = generateToken('inf_live');
  await db.prepare("UPDATE users SET api_token = ? WHERE id = ?").bind(newToken, user.id).run();

  return c.json({
    success: true,
    api_token: newToken,
    message: 'Novo Token de API gerado com sucesso!'
  });
});

// ==========================================
// 1. HEALTH CHECK & STATS
// ==========================================
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'Innflu Cloudflare API',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 1.1 SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA OTA (OVER-THE-AIR)
// ==========================================
app.get('/api/extension/version', (c) => {
  return c.json({
    status: 'ok',
    version: '1.3.6',
    minSupportedVersion: '1.0.0',
    releaseNotes: 'v1.3.6: Login obrigatório integrado, sincronização multi-tenant direta com Cloudflare D1 e novo popup com visão de conta.',
    downloadUrl: '/innflu-extensao.zip',
    publishedAt: '2026-11-18T10:00:00Z',
    dynamicRules: {
      selectors: {
        messageButtons: ['enviar mensagem', 'mensagem', 'message', 'send message'],
        actionBlockKeywords: [
          'bloqueio', 'bloqueamos', 'action blocked', 'try again later',
          'limite de ação', 'checkpoint', 'temporariamente bloqueado', 'restringimos determinadas atividades'
        ]
      },
      delays: {
        minDelaySec: 60,
        maxDelaySec: 180,
        typingCharMinMs: 40,
        typingCharMaxMs: 110
      },
      blacklistBioKeywords: [
        'sorteio', 'rifa', 'dropshipping', 'afiliado', 'afiliada', 'bet', 'tigrinho', 'cassino', 'privacy', 'onlyfans',
        'loja oficial', 'compre no site', 'loja virtual', 'loja online', 'site oficial', 'compre online', 'baixe o app',
        'e-commerce', 'ecommerce', 'varejo', 'atacado e varejo', 'atacadista', 'cnpj:', 'sac:',
        'enviamos para todo brasil', 'entregamos para todo brasil', 'frete grátis', 'frete gratis'
      ],
      heuristicsVersion: '2026.11.17-v3'
    }
  });
});

app.get('/api/stats', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database binding não configurado' }, 500);
  }

  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  try {
    const totalLeadsRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ?").bind(userId).first<{ count: number }>();
    const pendingLeadsRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ? AND status IN ('pending', 'minerada')").bind(userId).first<{ count: number }>();
    const sentTodayRes = await db.prepare(
      "SELECT count(*) as count FROM sent_logs WHERE user_id = ? AND date(sent_at) = date('now') AND status = 'success'"
    ).bind(userId).first<{ count: number }>();
    const totalSentRes = await db.prepare("SELECT count(*) as count FROM sent_logs WHERE user_id = ? AND status = 'success'").bind(userId).first<{ count: number }>();
    const repliedRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ? AND status = 'replied'").bind(userId).first<{ count: number }>();
    const withWhatsappRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ? AND whatsapp IS NOT NULL AND whatsapp != ''").bind(userId).first<{ count: number }>();
    const withEmailRes = await db.prepare("SELECT count(*) as count FROM leads WHERE user_id = ? AND email IS NOT NULL AND email != ''").bind(userId).first<{ count: number }>();

    const totalSent = totalSentRes?.count || 0;
    const totalReplied = repliedRes?.count || 0;
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0.0';

    return c.json({
      totalLeads: totalLeadsRes?.count || 0,
      pendingLeads: pendingLeadsRes?.count || 0,
      sentToday: sentTodayRes?.count || 0,
      totalSent,
      totalReplied,
      replyRate,
      withWhatsapp: withWhatsappRes?.count || 0,
      withEmail: withEmailRes?.count || 0,
      dailyLimit: 40,
      userId
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 2. CAMPANHAS (CAMPAIGNS)
// ==========================================
app.get('/api/campaigns', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const { results } = await db.prepare("SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
  return c.json({ campaigns: results });
});

app.post('/api/campaigns', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const id = body.id || 'camp_' + Date.now();
  const name = body.name || 'Nova Campanha';
  const keyword = body.keyword || 'maternidade';
  const targetGender = body.target_gender || 'female';
  const minFollowers = Number(body.min_followers || 10000);
  const maxFollowers = Number(body.max_followers || 10000000);
  const requireActiveStories = body.require_active_stories ? 1 : 0;
  const dailyLimit = Number(body.daily_limit || 40);
  const minDelaySec = Number(body.min_delay_sec || 60);
  const maxDelaySec = Number(body.max_delay_sec || 180);

  await db.prepare(`
    INSERT INTO campaigns (id, user_id, name, keyword, target_gender, min_followers, max_followers, require_active_stories, daily_limit, min_delay_sec, max_delay_sec, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(id, userId, name, keyword, targetGender, minFollowers, maxFollowers, requireActiveStories, dailyLimit, minDelaySec, maxDelaySec).run();

  return c.json({ success: true, id });
});

// ==========================================
// 3. TEMPLATES DE MENSAGENS (COM SPINTAX MULTI-MODELOS)
// ==========================================
app.get('/api/templates', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const { results } = await db.prepare("SELECT * FROM templates WHERE user_id = ? AND is_active = 1 ORDER BY id ASC").bind(userId).all();
  return c.json({ templates: results, userId });
});

app.post('/api/templates', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();

  // Suporte a salvar múltiplos templates em lote (ex: os 5 modelos)
  if (Array.isArray(body.templates)) {
    for (const t of body.templates) {
      const id = t.id || 'tmpl_' + Math.random().toString(36).substring(2, 9);
      const title = t.title || 'Modelo de Mensagem';
      const content = t.content || '';
      await db.prepare(`
        INSERT INTO templates (id, user_id, campaign_id, title, content, is_active)
        VALUES (?, ?, NULL, ?, ?, 1)
        ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content
      `).bind(id, userId, title, content).run();
    }
    return c.json({ success: true, count: body.templates.length, userId });
  }

  // Suporte a salvar modelo individual
  const id = body.id || 'tmpl_' + Date.now();
  const campaignId = body.campaign_id || null;
  const title = body.title || 'Novo Modelo';
  const content = body.content || '';

  await db.prepare(`
    INSERT INTO templates (id, user_id, campaign_id, title, content, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content
  `).bind(id, userId, campaignId, title, content).run();

  return c.json({ success: true, id, userId });
});

// ==========================================
// 4. LEADS & INFLUENCERS (MINERAÇÃO COM WHATSAPP, EMAIL & NICHO)
// ==========================================
app.get('/api/leads', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const status = c.req.query('status');
  const niche = c.req.query('niche');
  let query = "SELECT * FROM leads WHERE user_id = ?";
  const params: any[] = [userId];

  if (status && status !== 'all') {
    query += " AND status = ?";
    params.push(status);
  }
  if (niche && niche !== 'all') {
    query += " AND niche LIKE ?";
    params.push(`%${niche}%`);
  }

  query += " ORDER BY discovered_at DESC LIMIT 300";

  const stmt = db.prepare(query);
  const { results } = await stmt.bind(...params).all();
  return c.json({ leads: results, userId });
});

// Salvar / Sincronizar lead minerado (com WhatsApp, Email, Nicho e seguidores)
app.post('/api/leads', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();

  if (!username) {
    return c.json({ error: 'Username obrigatório' }, 400);
  }

  // Verificar se o perfil está na blacklist do usuário
  const isBlacklisted = await db.prepare("SELECT id FROM blacklist WHERE user_id = ? AND username = ?").bind(userId, username).first();
  if (isBlacklisted) {
    return c.json({ error: 'Perfil está na blacklist', blacklisted: true }, 400);
  }

  const id = 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const campaignId = body.campaign_id || null;
  const fullName = body.full_name || '';
  const followersCount = Number(body.followers_count || 0);
  const detectedGender = body.detected_gender || 'unknown';
  const hasActiveStories = body.has_active_stories ? 1 : 0;
  const whatsapp = body.whatsapp || null;
  const email = body.email || null;
  const bio = body.bio || '';
  const niche = body.niche || 'Geral';
  const status = body.status || 'minerada';

  try {
    await db.prepare(`
      INSERT INTO leads (id, user_id, campaign_id, username, full_name, followers_count, detected_gender, has_active_stories, whatsapp, email, bio, niche, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, username) DO UPDATE SET
        followers_count = excluded.followers_count,
        has_active_stories = excluded.has_active_stories,
        whatsapp = COALESCE(excluded.whatsapp, leads.whatsapp),
        email = COALESCE(excluded.email, leads.email),
        bio = excluded.bio,
        niche = COALESCE(excluded.niche, leads.niche),
        status = CASE WHEN leads.status = 'sent' THEN 'sent' ELSE excluded.status END
    `).bind(id, userId, campaignId, username, fullName, followersCount, detectedGender, hasActiveStories, whatsapp, email, bio, niche, status).run();

    return c.json({ success: true, username, niche, userId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Importação em Lote de Leads (CSV & Migração de Contas)
app.post('/api/leads/import', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'DB não configurado' }, 500);

  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  try {
    const body = await c.req.json();
    const leads: any[] = Array.isArray(body) ? body : (body.leads || []);

    if (!leads || leads.length === 0) {
      return c.json({ error: 'Nenhum lead fornecido para importação' }, 400);
    }

    // Carrega perfis na blacklist do usuário
    const blacklistRows = await db.prepare("SELECT username FROM blacklist WHERE user_id = ?").bind(userId).all();
    const blacklistedSet = new Set((blacklistRows.results || []).map((r: any) => (r.username || '').toLowerCase()));

    let imported = 0;
    let skipped = 0;

    // Lotes de 50 para otimização do D1 batch
    const batchSize = 50;
    for (let i = 0; i < leads.length; i += batchSize) {
      const chunk = leads.slice(i, i + batchSize);
      const statements: any[] = [];

      for (const lead of chunk) {
        const username = (lead.username || '').replace('@', '').trim().toLowerCase();
        if (!username || blacklistedSet.has(username)) {
          skipped++;
          continue;
        }

        const id = lead.id || ('lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        const campaignId = lead.campaign_id || null;
        const fullName = (lead.full_name || lead.name || '').trim();
        const followersCount = Number(lead.followers_count || 0);
        const detectedGender = lead.detected_gender || 'unknown';
        const hasActiveStories = (lead.has_active_stories === 1 || lead.has_active_stories === true || String(lead.has_active_stories).toLowerCase() === 'sim') ? 1 : 0;
        const whatsapp = lead.whatsapp ? String(lead.whatsapp).trim() : null;
        const email = lead.email ? String(lead.email).trim() : null;
        const bio = lead.bio ? String(lead.bio).trim() : '';
        const niche = lead.niche ? String(lead.niche).trim() : 'Geral';
        const status = lead.status || 'minerada';
        const discoveredAt = lead.discovered_at || new Date().toISOString();

        statements.push(db.prepare(`
          INSERT INTO leads (id, user_id, campaign_id, username, full_name, followers_count, detected_gender, has_active_stories, whatsapp, email, bio, niche, status, discovered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, username) DO UPDATE SET
            full_name = CASE WHEN excluded.full_name != '' THEN excluded.full_name ELSE leads.full_name END,
            followers_count = CASE WHEN excluded.followers_count > 0 THEN excluded.followers_count ELSE leads.followers_count END,
            has_active_stories = excluded.has_active_stories,
            whatsapp = COALESCE(excluded.whatsapp, leads.whatsapp),
            email = COALESCE(excluded.email, leads.email),
            bio = CASE WHEN excluded.bio != '' THEN excluded.bio ELSE leads.bio END,
            niche = COALESCE(excluded.niche, leads.niche),
            status = CASE WHEN leads.status = 'sent' THEN 'sent' ELSE excluded.status END
        `).bind(id, userId, campaignId, username, fullName, followersCount, detectedGender, hasActiveStories, whatsapp, email, bio, niche, status, discoveredAt));
      }

      if (statements.length > 0) {
        await db.batch(statements);
        imported += statements.length;
      }
    }

    return c.json({
      success: true,
      message: `${imported} influenciadoras importadas com sucesso!`,
      imported,
      skipped,
      total: leads.length,
      userId
    });
  } catch (err: any) {
    return c.json({ error: 'Erro ao importar leads: ' + err.message }, 500);
  }
});

// ==========================================
// 5. REGRA DOS 7 DIAS & VERIFICAÇÃO DE CONTATO
// ==========================================
app.post('/api/check-lead', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();

  if (!username) {
    return c.json({ eligible: false, reason: 'Username inválido' });
  }

  // 1. Checa Blacklist do usuário
  const isBlacklisted = await db.prepare("SELECT id FROM blacklist WHERE user_id = ? AND username = ?").bind(userId, username).first();
  if (isBlacklisted) {
    return c.json({ eligible: false, reason: 'blacklisted' });
  }

  // 2. Checa histórico de envio com a REGRA DE 7 DIAS do usuário
  const lastSent = await db.prepare(`
    SELECT id, sent_at, 
      (julianday('now') - julianday(sent_at)) as days_ago
    FROM sent_logs 
    WHERE user_id = ? AND username = ? AND status = 'success'
    ORDER BY sent_at DESC LIMIT 1
  `).bind(userId, username).first<{ id: string; sent_at: string; days_ago: number }>();

  if (lastSent) {
    const daysAgo = Math.floor(lastSent.days_ago || 0);
    if (daysAgo < 7) {
      return c.json({
        eligible: false,
        reason: 'contacted_recently',
        daysAgo,
        sent_at: lastSent.sent_at,
        message: `Já recebeu mensagem há ${daysAgo} dia(s). Só poderá ser chamada após 7 dias.`
      });
    } else {
      return c.json({
        eligible: true,
        reason: 'follow_up_eligible',
        daysAgo,
        sent_at: lastSent.sent_at
      });
    }
  }

  return c.json({ eligible: true, reason: 'never_contacted' });
});

// ==========================================
// 6. REGISTRO DE DISPARO (ANTI-BAN & LOGS)
// ==========================================
app.post('/api/log-sent', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();
  const messageText = body.message_text || '';
  const campaignId = body.campaign_id || null;
  const status = body.status || 'success';
  const errorMessage = body.error_message || null;

  const logId = 'log_' + Date.now();

  try {
    // Registra no sent_logs com user_id
    await db.prepare(`
      INSERT INTO sent_logs (id, user_id, campaign_id, username, message_text, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(logId, userId, campaignId, username, messageText, status, errorMessage).run();

    // Atualiza status na tabela de leads do usuário
    if (status === 'success') {
      await db.prepare(`
        UPDATE leads SET status = 'sent', last_contacted_at = CURRENT_TIMESTAMP WHERE user_id = ? AND username = ?
      `).bind(userId, username).run();
    }

    return c.json({ success: true, logId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 7. BLACKLIST (BLOQUEIO PERMANENTE COM MOTIVO)
// ==========================================
app.get('/api/blacklist', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const { results } = await db.prepare("SELECT * FROM blacklist WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
  return c.json({ blacklist: results, userId });
});

app.post('/api/blacklist', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();
  const reason = body.reason || null;

  if (!username) {
    return c.json({ error: 'Username obrigatório' }, 400);
  }

  const id = 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  await db.prepare(`
    INSERT INTO blacklist (id, user_id, username, reason) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, username) DO UPDATE SET reason = excluded.reason
  `).bind(id, userId, username, reason).run();

  // Marca também no CRM como 'blacklisted'
  await db.prepare("UPDATE leads SET status = 'blacklisted' WHERE user_id = ? AND username = ?").bind(userId, username).run();

  return c.json({ success: true, username, reason, userId });
});

// Adicionar múltiplas influenciadoras à Blacklist em lote
app.post('/api/blacklist/bulk', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const body = await c.req.json();
  const usernames: string[] = body.usernames || [];
  const reason = body.reason || null;

  if (!usernames || !usernames.length) {
    return c.json({ error: 'Nenhum usuário informado' }, 400);
  }

  const statements = [];
  for (const rawUser of usernames) {
    const username = (rawUser || '').replace('@', '').trim().toLowerCase();
    if (!username) continue;
    const id = 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    statements.push(
      db.prepare(`
        INSERT INTO blacklist (id, user_id, username, reason) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, username) DO UPDATE SET reason = COALESCE(excluded.reason, blacklist.reason)
      `).bind(id, userId, username, reason)
    );

    statements.push(
      db.prepare("UPDATE leads SET status = 'blacklisted' WHERE user_id = ? AND username = ?").bind(userId, username)
    );
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return c.json({ success: true, count: usernames.length, reason, userId });
});

// Remover influenciadora da Blacklist
app.delete('/api/blacklist/:username', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const username = c.req.param('username').replace('@', '').trim().toLowerCase();
  await db.prepare("DELETE FROM blacklist WHERE user_id = ? AND username = ?").bind(userId, username).run();
  
  // Reverte status no CRM de 'blacklisted' para 'minerada'
  await db.prepare("UPDATE leads SET status = 'minerada' WHERE user_id = ? AND username = ? AND status = 'blacklisted'").bind(userId, username).run();

  return c.json({ success: true, username, userId });
});

// ==========================================
// 8. LOGS DE ATIVIDADE & AUDITORIA
// ==========================================
app.get('/api/logs', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  const limit = Number(c.req.query('limit') || 100);
  const { results } = await db.prepare("SELECT * FROM sent_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT ?").bind(userId, limit).all();
  return c.json({ logs: results });
});

// ==========================================
// 9. ANALYTICS & TENDÊNCIAS
// ==========================================
app.get('/api/analytics', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;

  try {
    const byStatus = await db.prepare("SELECT status, count(*) as count FROM leads WHERE user_id = ? GROUP BY status").bind(userId).all();
    
    const last7Days = await db.prepare(`
      SELECT date(sent_at) as date, count(*) as count
      FROM sent_logs
      WHERE user_id = ? AND sent_at >= date('now', '-7 days')
      GROUP BY date(sent_at)
      ORDER BY date(sent_at) ASC
    `).bind(userId).all();

    const totalLeads = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ?").bind(userId).first<{ c: number }>())?.c || 0;
    const withWhatsapp = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ? AND whatsapp IS NOT NULL AND whatsapp != ''").bind(userId).first<{ c: number }>())?.c || 0;
    const withEmail = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ? AND email IS NOT NULL AND email != ''").bind(userId).first<{ c: number }>())?.c || 0;
    const withBoth = (await db.prepare("SELECT count(*) as c FROM leads WHERE user_id = ? AND whatsapp IS NOT NULL AND whatsapp != '' AND email IS NOT NULL AND email != ''").bind(userId).first<{ c: number }>())?.c || 0;

    return c.json({
      totalLeads,
      channels: {
        whatsapp: withWhatsapp,
        email: withEmail,
        both: withBoth,
        onlyDirect: totalLeads - (withWhatsapp + withEmail - withBoth)
      },
      byStatus: byStatus.results || [],
      last7Days: last7Days.results || []
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 10. QUALIFICAÇÃO DE PERFIL COM AI
// ==========================================
app.post('/api/qualify', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }

  try {
    const body = await c.req.json();
    const fullName = body.full_name || '';
    const bio = body.bio || '';
    const niche = body.niche || 'maternidade';

    const result = await analyzeProfileWithAI(c.env.AI, fullName, bio, niche);
    return c.json({ result });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ==========================================
// 11. GESTÃO AVANÇADA DE LEADS (STATUS & DELETE)
// ==========================================
app.delete('/api/leads/:id', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const id = c.req.param('id');
  await db.prepare("DELETE FROM leads WHERE user_id = ? AND (id = ? OR username = ?)").bind(userId, id, id).run();
  return c.json({ success: true });
});

app.post('/api/leads/:id/status', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const id = c.req.param('id');
  const body = await c.req.json();
  const status = body.status || 'minerada';
  await db.prepare("UPDATE leads SET status = ? WHERE user_id = ? AND (id = ? OR username = ?)").bind(status, userId, id, id).run();
  return c.json({ success: true, status });
});

// Atualizar status de múltiplos leads em lote (ex: 'partner', 'negotiating', 'sent', 'minerada')
app.post('/api/leads/bulk-status', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const ids: string[] = body.ids || [];
  const status: string = body.status || 'partner';

  if (!ids || !ids.length) {
    return c.json({ error: 'Nenhum lead informado' }, 400);
  }

  const statements = ids.map(id => 
    db.prepare("UPDATE leads SET status = ? WHERE user_id = ? AND (id = ? OR username = ?)").bind(status, userId, id, id)
  );

  await db.batch(statements);
  return c.json({ success: true, count: ids.length, status, userId });
});

// Excluir múltiplos leads em lote
app.post('/api/leads/bulk-delete', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }
  const userId = user.id;
  const body = await c.req.json();
  const ids: string[] = body.ids || [];

  if (!ids || !ids.length) {
    return c.json({ error: 'Nenhum lead informado' }, 400);
  }

  const statements = ids.map(id => 
    db.prepare("DELETE FROM leads WHERE user_id = ? AND (id = ? OR username = ?)").bind(userId, id, id)
  );

  await db.batch(statements);
  return c.json({ success: true, count: ids.length, userId });
});

// ==========================================
// 12. CONFIGURAÇÕES DA CONTA & SISTEMA
// ==========================================
app.get('/api/settings', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }

  const { results } = await db.prepare("SELECT * FROM settings").all();
  const settingsObj: Record<string, string> = {};
  results.forEach((row: any) => {
    settingsObj[row.key] = row.value;
  });
  return c.json({ settings: settingsObj });
});

app.put('/api/settings', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }

  const body = await c.req.json();
  for (const [key, val] of Object.entries(body)) {
    await db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, String(val)).run();
  }
  return c.json({ success: true, settings: body });
});

app.post('/api/settings', async (c) => {
  const db = c.env.DB;
  const user = await getAuthUser(db, c);
  if (!user) {
    return c.json({ error: 'Não autorizado. Login e senha obrigatórios.', authenticated: false }, 401);
  }

  const body = await c.req.json();
  for (const [key, val] of Object.entries(body)) {
    await db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, String(val)).run();
  }
  return c.json({ success: true, settings: body });
});

// Fallback para arquivos estáticos no Cloudflare Pages / Workers com ASSETS
app.notFound(async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

// Tratamento global de erros para retornar sempre JSON informativo
app.onError((err, c) => {
  console.error('Unhandled Server Error:', err);
  return c.json({ error: 'Erro no servidor: ' + (err.message || 'Desconhecido') }, 500);
});

export default app;
