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

// ==========================================
// 1. HEALTH CHECK & STATS
// ==========================================
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'Innflu Cloudflare API',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/stats', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database binding não configurado' }, 500);
  }

  try {
    const totalLeadsRes = await db.prepare("SELECT count(*) as count FROM leads").first<{ count: number }>();
    const pendingLeadsRes = await db.prepare("SELECT count(*) as count FROM leads WHERE status IN ('pending', 'minerada')").first<{ count: number }>();
    const sentTodayRes = await db.prepare(
      "SELECT count(*) as count FROM sent_logs WHERE date(sent_at) = date('now') AND status = 'success'"
    ).first<{ count: number }>();
    const totalSentRes = await db.prepare("SELECT count(*) as count FROM sent_logs WHERE status = 'success'").first<{ count: number }>();
    const withWhatsappRes = await db.prepare("SELECT count(*) as count FROM leads WHERE whatsapp IS NOT NULL AND whatsapp != ''").first<{ count: number }>();
    const withEmailRes = await db.prepare("SELECT count(*) as count FROM leads WHERE email IS NOT NULL AND email != ''").first<{ count: number }>();

    return c.json({
      totalLeads: totalLeadsRes?.count || 0,
      pendingLeads: pendingLeadsRes?.count || 0,
      sentToday: sentTodayRes?.count || 0,
      totalSent: totalSentRes?.count || 0,
      withWhatsapp: withWhatsappRes?.count || 0,
      withEmail: withEmailRes?.count || 0,
      dailyLimit: 40,
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
  const { results } = await db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC").all();
  return c.json({ campaigns: results });
});

app.post('/api/campaigns', async (c) => {
  const db = c.env.DB;
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
    INSERT INTO campaigns (id, name, keyword, target_gender, min_followers, max_followers, require_active_stories, daily_limit, min_delay_sec, max_delay_sec, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(id, name, keyword, targetGender, minFollowers, maxFollowers, requireActiveStories, dailyLimit, minDelaySec, maxDelaySec).run();

  return c.json({ success: true, id });
});

// ==========================================
// 3. TEMPLATES DE MENSAGENS (COM SPINTAX)
// ==========================================
app.get('/api/templates', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare("SELECT * FROM templates WHERE is_active = 1 ORDER BY created_at DESC").all();
  return c.json({ templates: results });
});

app.post('/api/templates', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const id = body.id || 'tmpl_' + Date.now();
  const campaignId = body.campaign_id || null;
  const title = body.title || 'Novo Modelo';
  const content = body.content || '';

  await db.prepare(`
    INSERT INTO templates (id, campaign_id, title, content, is_active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content
  `).bind(id, campaignId, title, content).run();

  return c.json({ success: true, id });
});

// ==========================================
// 4. LEADS & INFLUENCERS (MINERAÇÃO COM WHATSAPP & EMAIL)
// ==========================================
app.get('/api/leads', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status');
  let query = "SELECT * FROM leads";
  const params: any[] = [];

  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY discovered_at DESC LIMIT 200";

  const stmt = db.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json({ leads: results });
});

// Salvar / Sincronizar lead minerado (com WhatsApp, Email e seguidores)
app.post('/api/leads', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();

  if (!username) {
    return c.json({ error: 'Username obrigatório' }, 400);
  }

  // Verificar se o perfil está na blacklist
  const isBlacklisted = await db.prepare("SELECT id FROM blacklist WHERE username = ?").bind(username).first();
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
  const status = body.status || 'minerada';

  try {
    await db.prepare(`
      INSERT INTO leads (id, campaign_id, username, full_name, followers_count, detected_gender, has_active_stories, whatsapp, email, bio, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        followers_count = excluded.followers_count,
        has_active_stories = excluded.has_active_stories,
        whatsapp = COALESCE(excluded.whatsapp, leads.whatsapp),
        email = COALESCE(excluded.email, leads.email),
        bio = excluded.bio,
        status = CASE WHEN leads.status = 'sent' THEN 'sent' ELSE excluded.status END
    `).bind(id, campaignId, username, fullName, followersCount, detectedGender, hasActiveStories, whatsapp, email, bio, status).run();

    return c.json({ success: true, username });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 5. REGRA DOS 7 DIAS & VERIFICAÇÃO DE CONTATO
// ==========================================
app.post('/api/check-lead', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();

  if (!username) {
    return c.json({ eligible: false, reason: 'Username inválido' });
  }

  // 1. Checa Blacklist
  const isBlacklisted = await db.prepare("SELECT id FROM blacklist WHERE username = ?").bind(username).first();
  if (isBlacklisted) {
    return c.json({ eligible: false, reason: 'blacklisted' });
  }

  // 2. Checa histórico de envio com a REGRA DE 7 DIAS
  const lastSent = await db.prepare(`
    SELECT id, sent_at, 
      (julianday('now') - julianday(sent_at)) as days_ago
    FROM sent_logs 
    WHERE username = ? AND status = 'success'
    ORDER BY sent_at DESC LIMIT 1
  `).bind(username).first<{ id: string; sent_at: string; days_ago: number }>();

  if (lastSent) {
    const daysAgo = Math.floor(lastSent.days_ago || 0);
    // Se foi contatada há MENOS de 7 dias: PULA!
    if (daysAgo < 7) {
      return c.json({
        eligible: false,
        reason: 'contacted_recently',
        daysAgo,
        sent_at: lastSent.sent_at,
        message: `Já recebeu mensagem há ${daysAgo} dia(s). Só poderá ser chamada após 7 dias.`
      });
    } else {
      // Já se passaram 7 ou mais dias: Pode reenviar (follow-up)
      return c.json({
        eligible: true,
        reason: 'follow_up_eligible',
        daysAgo,
        sent_at: lastSent.sent_at
      });
    }
  }

  // Nunca foi contatada: elegível!
  return c.json({ eligible: true, reason: 'never_contacted' });
});

// ==========================================
// 6. REGISTRO DE DISPARO (ANTI-BAN & LOGS)
// ==========================================
app.post('/api/log-sent', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();
  const messageText = body.message_text || '';
  const campaignId = body.campaign_id || null;
  const status = body.status || 'success';
  const errorMessage = body.error_message || null;

  const logId = 'log_' + Date.now();

  try {
    // Registra no sent_logs
    await db.prepare(`
      INSERT INTO sent_logs (id, campaign_id, username, message_text, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(logId, campaignId, username, messageText, status, errorMessage).run();

    // Atualiza status na tabela de leads
    if (status === 'success') {
      await db.prepare(`
        UPDATE leads SET status = 'sent', last_contacted_at = CURRENT_TIMESTAMP WHERE username = ?
      `).bind(username).run();
    }

    return c.json({ success: true, logId });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 7. BLACKLIST
// ==========================================
app.get('/api/blacklist', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare("SELECT * FROM blacklist ORDER BY created_at DESC").all();
  return c.json({ blacklist: results });
});

app.post('/api/blacklist', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const username = (body.username || '').replace('@', '').trim().toLowerCase();
  const reason = body.reason || 'Adicionado manualmente';

  if (!username) {
    return c.json({ error: 'Username obrigatório' }, 400);
  }

  const id = 'blk_' + Date.now();
  await db.prepare(`
    INSERT OR IGNORE INTO blacklist (id, username, reason) VALUES (?, ?, ?)
  `).bind(id, username, reason).run();

  return c.json({ success: true, username });
});

// ==========================================
// 8. LOGS DE ATIVIDADE & AUDITORIA
// ==========================================
app.get('/api/logs', async (c) => {
  const db = c.env.DB;
  const limit = Number(c.req.query('limit') || 100);
  const { results } = await db.prepare("SELECT * FROM sent_logs ORDER BY sent_at DESC LIMIT ?").bind(limit).all();
  return c.json({ logs: results });
});

// ==========================================
// 9. ANALYTICS & TENDÊNCIAS
// ==========================================
app.get('/api/analytics', async (c) => {
  const db = c.env.DB;
  try {
    // Leads agrupados por status
    const byStatus = await db.prepare("SELECT status, count(*) as count FROM leads GROUP BY status").all();
    
    // Disparos dos últimos 7 dias
    const last7Days = await db.prepare(`
      SELECT date(sent_at) as date, count(*) as count
      FROM sent_logs
      WHERE sent_at >= date('now', '-7 days')
      GROUP BY date(sent_at)
      ORDER BY date(sent_at) ASC
    `).all();

    // Distribuição de canais de contato
    const totalLeads = (await db.prepare("SELECT count(*) as c FROM leads").first<{ c: number }>())?.c || 0;
    const withWhatsapp = (await db.prepare("SELECT count(*) as c FROM leads WHERE whatsapp IS NOT NULL AND whatsapp != ''").first<{ c: number }>())?.c || 0;
    const withEmail = (await db.prepare("SELECT count(*) as c FROM leads WHERE email IS NOT NULL AND email != ''").first<{ c: number }>())?.c || 0;
    const withBoth = (await db.prepare("SELECT count(*) as c FROM leads WHERE whatsapp IS NOT NULL AND whatsapp != '' AND email IS NOT NULL AND email != ''").first<{ c: number }>())?.c || 0;

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
  const id = c.req.param('id');
  await db.prepare("DELETE FROM leads WHERE id = ? OR username = ?").bind(id, id).run();
  return c.json({ success: true });
});

app.post('/api/leads/:id/status', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  const status = body.status || 'minerada';
  await db.prepare("UPDATE leads SET status = ? WHERE id = ? OR username = ?").bind(status, id, id).run();
  return c.json({ success: true, status });
});

// ==========================================
// 12. CONFIGURAÇÕES DA CONTA & SISTEMA
// ==========================================
app.get('/api/settings', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare("SELECT * FROM settings").all();
  const settingsObj: Record<string, string> = {};
  results.forEach((row: any) => {
    settingsObj[row.key] = row.value;
  });
  return c.json({ settings: settingsObj });
});

app.put('/api/settings', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  for (const [key, val] of Object.entries(body)) {
    await db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, String(val)).run();
  }
  return c.json({ success: true });
});

export default app;
