/**
 * Innflu Floating HUD & Painel de Mineração Avançado — v3
 * Suporte a Mineração Multi-Fonte (Palavra-chave, Hashtag, Reels, Seguidores),
 * Extração de Contatos (WhatsApp & Email), Tabela de Leads em Tempo Real e Exportação CSV.
 */
(function() {
  if (document.getElementById('innflu-hud-root')) return;

  const root = document.createElement('div');
  root.id = 'innflu-hud-root';
  root.innerHTML = `
    <div class="innflu-hud" id="innfluHud">
      <!-- Header -->
      <div class="innflu-hud-header" id="innfluHudHeader">
        <div class="innflu-brand">
          <div class="innflu-logo-badge">I</div>
          <span class="innflu-brand-text">Innflu</span>
        </div>
        <div class="innflu-actions">
          <span class="innflu-status-badge status-idle" id="hudGlobalBadge">
            <span class="innflu-status-pulse"></span>
            <span id="hudStatusBadgeText">Parado</span>
          </span>
          <span class="innflu-header-countdown" id="hudHeaderCountdown" style="display:none;"></span>
          <button class="innflu-btn-icon" id="btnHeaderPauseResume" title="Pausar / Retomar Operação" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="iconHeaderPause"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="iconHeaderResume" style="display:none;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="innflu-btn-icon" id="btnMinimize" title="Minimizar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
          </button>
        </div>
      </div>

      <!-- Barra de Progresso de Delay Anti-Ban -->
      <div class="innflu-delay-bar-container" id="hudDelayBarContainer" style="display:none;">
        <div class="innflu-delay-bar-fill" id="hudDelayBarFill"></div>
        <div class="innflu-delay-bar-text" id="hudDelayBarText">Aguardando delay humano seguro...</div>
      </div>

      <!-- Banner de Alerta Anti-Ban -->
      <div class="innflu-alert-banner" id="hudSafetyAlertBanner" style="display:none;">
        <span class="innflu-alert-icon">🛡️</span>
        <div class="innflu-alert-body">
          <strong id="hudAlertTitle">Pausa Preventiva de Segurança</strong>
          <p id="hudAlertDesc">Aviso do Instagram detectado. Automação pausada para proteger sua conta.</p>
        </div>
        <button class="innflu-alert-dismiss" id="btnDismissAlert" title="Fechar aviso">&times;</button>
      </div>

      <!-- Toasts Notificações Internas -->
      <div class="innflu-toast-container" id="hudToastContainer"></div>

      <!-- Navegação de Abas -->
      <div class="innflu-nav-tabs">
        <button class="innflu-nav-btn active" id="tabBtnAuto">⚡ Automação</button>
        <button class="innflu-nav-btn" id="tabBtnMine">⛏️ Minerar</button>
        <button class="innflu-nav-btn" id="tabBtnLeads">📋 Leads (<span id="tabLeadsCount">0</span>)</button>
        <button class="innflu-nav-btn" id="tabBtnSender">✉️ Captação</button>
        <button class="innflu-nav-btn" id="tabBtnLive">🎯 Ao Vivo</button>
      </div>

      <!-- Corpo do HUD -->
      <div class="innflu-hud-body">
        
        <!-- ==========================================
             ABA 0: AUTOMAÇÃO COMPLETA (MINERA -> ENVIA DM -> REPETE)
             ========================================== -->
        <div id="viewAuto" class="innflu-tab-content">
          <div class="innflu-section-title">⚡ Automação Contínua (Mineração + DM)</div>
          <div style="font-size:10.5px;color:#94a3b8;line-height:1.4;margin-bottom:10px;background:rgba(99,102,241,0.12);padding:8px 10px;border-radius:8px;border:1px solid rgba(99,102,241,0.3);">
            O robô <b>minera</b> a criadora, <b>valida os filtros</b>, <b>envia a mensagem</b>, aguarda o delay humano e <b>segue minerando automaticamente</b>.
          </div>

          <div class="innflu-form-group">
            <label class="innflu-form-label">Nicho / Palavra-chave ou Perfil @:</label>
            <input type="text" class="innflu-input" id="inputAutoTarget" placeholder="ex: maternidade, @vihtube, #modafeminina" value="maternidade" />
          </div>

          <div class="innflu-filters-row">
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Mín. Seguidores:</label>
              <select class="innflu-select" id="selAutoMinFollowers">
                <option value="1000">1.000+ seg.</option>
                <option value="5000">5.000+ seg.</option>
                <option value="10000" selected>10.000+ (Ideal)</option>
                <option value="20000">20.000+ seg.</option>
                <option value="50000">50.000+ seg.</option>
              </select>
            </div>
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Stories Ativos:</label>
              <select class="innflu-select" id="selAutoStories">
                <option value="true" selected>⚡ Apenas c/ Stories</option>
                <option value="false">Todos</option>
              </select>
            </div>
          </div>

          <div style="margin-top:12px;">
            <div class="innflu-btn-group-actions">
              <button class="innflu-cta-btn start" id="btnToggleAuto" style="background:linear-gradient(135deg, #10b981, #6366f1);flex:2;">
                <span>⚡</span>
                <span id="btnAutoLabel">Iniciar Automação</span>
              </button>
              <button class="innflu-btn-pause" id="btnPauseAuto" style="display:none;" title="Pausar ou retomar automação">
                <span id="btnPauseAutoIcon">⏸️</span>
                <span id="btnPauseAutoLabel">Pausar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ==========================================
             ABA 1: PAINEL DE MINERAÇÃO (ONDE ESCOLHE COMO MINERAR)
             ========================================== -->
        <div id="viewMine" class="innflu-tab-content" style="display:none;">
          <div class="innflu-section-title">1. Escolha Onde Minerar</div>
          <div class="innflu-sources-grid">
            <button class="innflu-source-btn active" data-source="similar" id="srcBtnSimilar">
              <span class="innflu-source-icon">✨</span>
              <div class="innflu-source-label">
                <span class="innflu-source-name">Semelhantes a @</span>
                <span class="innflu-source-sub">Recomendados pelo Instagram</span>
              </div>
            </button>
            <button class="innflu-source-btn" data-source="keyword" id="srcBtnKeyword">
              <span class="innflu-source-icon">🔍</span>
              <div class="innflu-source-label">
                <span class="innflu-source-name">Palavra-chave</span>
                <span class="innflu-source-sub">Busca geral e virais</span>
              </div>
            </button>
            <button class="innflu-source-btn" data-source="hashtag" id="srcBtnHashtag">
              <span class="innflu-source-icon">#️⃣</span>
              <div class="innflu-source-label">
                <span class="innflu-source-name">Hashtag (#)</span>
                <span class="innflu-source-sub">Página de hashtag</span>
              </div>
            </button>
            <button class="innflu-source-btn" data-source="following" id="srcBtnFollowing">
              <span class="innflu-source-icon">👥</span>
              <div class="innflu-source-label">
                <span class="innflu-source-name">Seguindo de @</span>
                <span class="innflu-source-sub">Quem ela segue (Parceiras)</span>
              </div>
            </button>
          </div>

          <div class="innflu-form-group">
            <label class="innflu-form-label" id="lblMiningTarget">Termo de Pesquisa / Nicho:</label>
            <input type="text" class="innflu-input" id="inputMiningTarget" placeholder="ex: maternidade, nutricionista, moda" value="maternidade" />
          </div>

          <div class="innflu-section-title">2. Filtros de Qualificação</div>
          <div class="innflu-filters-row">
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Mín. Seguidores:</label>
              <select class="innflu-select" id="selMinFollowers">
                <option value="0">Qualquer tamanho</option>
                <option value="1000">1.000+ seguidores</option>
                <option value="2000">2.000+ seguidores</option>
                <option value="3000">3.000+ seguidores</option>
                <option value="4000">4.000+ seguidores</option>
                <option value="5000">5.000+ seguidores</option>
                <option value="10000" selected>10.000+ (Recomendado)</option>
                <option value="20000">20.000+ seguidores</option>
                <option value="30000">30.000+ seguidores</option>
                <option value="50000">50.000+ seguidores</option>
                <option value="100000">100.000+ seguidores</option>
              </select>
            </div>
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Stories Ativos (24h):</label>
              <select class="innflu-select" id="selRequireStories">
                <option value="true" selected>⚡ Apenas c/ Stories Ativos</option>
                <option value="false">Todos (com ou sem stories)</option>
              </select>
            </div>
          </div>
          <div class="innflu-filters-row" style="margin-top:6px;">
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Filtro de Contato:</label>
              <select class="innflu-select" id="selRequireContact">
                <option value="all" selected>Todos os contatos</option>
                <option value="any_contact">Apenas com WA ou Email</option>
                <option value="wa_only">Apenas com WhatsApp</option>
                <option value="email_only">Apenas com E-mail</option>
              </select>
            </div>
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Gênero Alvo:</label>
              <select class="innflu-select" id="selTargetGender">
                <option value="female" selected>Apenas Feminino</option>
                <option value="all">Todos os Gêneros</option>
              </select>
            </div>
          </div>

          <div style="margin-top:10px;">
            <div class="innflu-btn-group-actions">
              <button class="innflu-cta-btn start" id="btnToggleMining" style="flex:2;">
                <span>🚀</span>
                <span id="btnMiningLabel">Iniciar Mineração</span>
              </button>
              <button class="innflu-btn-pause" id="btnPauseMining" style="display:none;" title="Pausar ou retomar sem perder a fila">
                <span id="btnPauseMiningIcon">⏸️</span>
                <span id="btnPauseMiningLabel">Pausar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ==========================================
             ABA 2: LEADS MINERADOS (TABELA EM TEMPO REAL)
             ========================================== -->
        <div id="viewLeads" class="innflu-tab-content" style="display:none;">
          <div class="innflu-leads-summary">
            <div class="innflu-summary-box">
              <div class="innflu-summary-val" id="sumTotalLeads">0</div>
              <div class="innflu-summary-label">Total Leads</div>
            </div>
            <div class="innflu-summary-box">
              <div class="innflu-summary-val wa" id="sumWaLeads">0</div>
              <div class="innflu-summary-label">Com WhatsApp</div>
            </div>
            <div class="innflu-summary-box">
              <div class="innflu-summary-val email" id="sumEmailLeads">0</div>
              <div class="innflu-summary-label">Com E-mail</div>
            </div>
          </div>

          <!-- Barra de Exportação e Ações -->
          <div class="innflu-export-bar">
            <button class="innflu-export-btn csv" id="btnExportCSV" title="Baixar planilha completa">
              📥 Baixar CSV
            </button>
            <button class="innflu-export-btn" id="btnImportCSV" title="Importar lista de influenciadoras CSV para o CRM">
              📤 Importar CSV
            </button>
            <input type="file" id="hudInputImportCSV" accept=".csv,text/csv,text/plain" style="display:none;" />
            <button class="innflu-export-btn" id="btnCopyWhatsapps" title="Copiar todos os números">
              📱 Copiar Whats
            </button>
            <button class="innflu-export-btn" id="btnCopyEmails" title="Copiar todos os e-mails">
              ✉️ Copiar Emails
            </button>
            <button class="innflu-export-btn" id="btnRefreshLeads" title="Recarregar">
              🔄
            </button>
          </div>

          <!-- Filtro de Visualização -->
          <div class="innflu-filter-chips">
            <button class="innflu-chip active" data-filter="all" id="chipFilterAll">Todos</button>
            <button class="innflu-chip" data-filter="wa" id="chipFilterWa">Com WhatsApp</button>
            <button class="innflu-chip" data-filter="email" id="chipFilterEmail">Com Email</button>
          </div>

          <!-- Lista de Cards -->
          <div class="innflu-leads-scroll" id="leadsCardsContainer">
            <div style="font-size:11px;color:#64748b;text-align:center;padding:16px;">
              Nenhum lead minerado ainda.<br>Clique em "Iniciar Mineração" para começar!
            </div>
          </div>
        </div>

        <!-- ==========================================
             ABA 3: CAPTAÇÃO & TEMPLATES (DMs)
             ========================================== -->
        <div id="viewSender" class="innflu-tab-content" style="display:none;">
          <div class="innflu-template-section">
            <label class="innflu-form-label">Mensagem com Spintax {Olá|Oi|Oie} e {nome}:</label>
            <textarea class="innflu-template-textarea" id="hudTemplateContent">{Olá|Oi|Oie} {nome}! {Tudo bem com você?|Como você está?}

Vi seu perfil e adorei o conteúdo que você compartilha sobre maternidade real!

Somos uma marca e gostaríamos de te convidar para uma parceria com envio de produtos exclusivos sem nenhum custo. Você teria interesse em conhecer mais da nossa proposta?</textarea>
            
            <div class="innflu-template-actions">
              <button class="innflu-btn-sub" id="btnTestSpintax">🎲 Testar Variação</button>
              <button class="innflu-btn-sub" id="btnSaveTemplate" style="background:#7c3aed;color:white;">💾 Salvar Template</button>
            </div>
          </div>

          <div style="margin-top:12px;">
            <div class="innflu-btn-group-actions">
              <button class="innflu-cta-btn start" id="btnToggleSender" style="background:linear-gradient(135deg, #ec4899, #8b5cf6);flex:2;">
                <span>✉️</span>
                <span id="btnSenderLabel">Iniciar Envio de DMs (Captação)</span>
              </button>
              <button class="innflu-btn-pause" id="btnPauseSender" style="display:none;" title="Pausar ou retomar envios">
                <span id="btnPauseSenderIcon">⏸️</span>
                <span id="btnPauseSenderLabel">Pausar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ==========================================
             ABA 4: AO VIVO & STATUS
             ========================================== -->
        <div id="viewLive" class="innflu-tab-content" style="display:none;">
          <div class="innflu-live-card">
            <div class="innflu-live-header">
              <span class="innflu-status-badge">
                <span class="innflu-status-pulse"></span>
                <span id="hudLiveStatusText">Aguardando comando...</span>
              </span>
              <span class="innflu-countdown" id="hudCountdown"></span>
            </div>
            <div class="innflu-live-target">
              <span id="hudCurrentAction">Pronto para operar</span>
            </div>
            <div style="font-size:10px;color:#64748b;margin-top:4px;" id="hudPageType"></div>
            
            <div class="innflu-counters-row">
              <div class="innflu-counter-box">
                <div class="innflu-summary-label">Mineradas</div>
                <div class="innflu-counter-val" id="hudMinedCount">0</div>
              </div>
              <div class="innflu-counter-box">
                <div class="innflu-summary-label">DMs Hoje</div>
                <div class="innflu-counter-val" id="hudSentTodayCount">0 / 40</div>
              </div>
              <div class="innflu-counter-box">
                <div class="innflu-summary-label">Na Fila</div>
                <div class="innflu-counter-val" id="hudQueueCount">0</div>
              </div>
            </div>
          </div>

          <div style="margin-top:8px;">
            <div class="innflu-section-title">Registro de Atividades</div>
            <div class="innflu-feed" id="hudActivityFeed">
              <div style="font-size:10px;color:#64748b;text-align:center;padding:8px;">Nenhuma atividade recente.</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Rodapé -->
      <div class="innflu-hud-footer">
        <button class="innflu-btn-secondary" id="btnQuickInspect">🔎 Analisar Perfil Aberto</button>
        <button class="innflu-btn-secondary" id="btnOpenDashboard" style="border-color:rgba(56,189,248,0.4);color:#38bdf8;">📊 Painel Web</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // Helper de DOM
  const $ = id => document.getElementById(id);

  // Referências aos elementos
  const hud = $('innfluHud');
  const hudHeader = $('innfluHudHeader');
  const hudToastContainer = $('hudToastContainer');
  const hudStatusBadgeText = $('hudStatusBadgeText');
  const hudGlobalBadge = $('hudGlobalBadge');
  const hudHeaderCountdown = $('hudHeaderCountdown');
  const btnHeaderPauseResume = $('btnHeaderPauseResume');
  const iconHeaderPause = $('iconHeaderPause');
  const iconHeaderResume = $('iconHeaderResume');
  const hudDelayBarContainer = $('hudDelayBarContainer');
  const hudDelayBarFill = $('hudDelayBarFill');
  const hudDelayBarText = $('hudDelayBarText');
  const hudSafetyAlertBanner = $('hudSafetyAlertBanner');
  const hudAlertTitle = $('hudAlertTitle');
  const hudAlertDesc = $('hudAlertDesc');
  const btnDismissAlert = $('btnDismissAlert');

  const hudLiveStatusText = $('hudLiveStatusText');
  const hudCurrentAction = $('hudCurrentAction');
  const hudPageType = $('hudPageType');
  const hudCountdown = $('hudCountdown');
  const hudMinedCount = $('hudMinedCount');
  const hudSentTodayCount = $('hudSentTodayCount');
  const hudQueueCount = $('hudQueueCount');
  const hudActivityFeed = $('hudActivityFeed');
  const hudTemplateContent = $('hudTemplateContent');
  const tabLeadsCount = $('tabLeadsCount');
  const sumTotalLeads = $('sumTotalLeads');
  const sumWaLeads = $('sumWaLeads');
  const sumEmailLeads = $('sumEmailLeads');
  const leadsCardsContainer = $('leadsCardsContainer');

  // Controles de Automação Contínua
  const inputAutoTarget = $('inputAutoTarget');
  const selAutoMinFollowers = $('selAutoMinFollowers');
  const selAutoStories = $('selAutoStories');
  const btnToggleAuto = $('btnToggleAuto');
  const btnAutoLabel = $('btnAutoLabel');
  const btnPauseAuto = $('btnPauseAuto');
  const btnPauseAutoIcon = $('btnPauseAutoIcon');
  const btnPauseAutoLabel = $('btnPauseAutoLabel');

  // Controles de Mineração
  const inputMiningTarget = $('inputMiningTarget');
  const lblMiningTarget = $('lblMiningTarget');
  const selMinFollowers = $('selMinFollowers');
  const selRequireStories = $('selRequireStories');
  const selRequireContact = $('selRequireContact');
  const selTargetGender = $('selTargetGender');
  const btnToggleMining = $('btnToggleMining');
  const btnMiningLabel = $('btnMiningLabel');
  const btnPauseMining = $('btnPauseMining');
  const btnPauseMiningIcon = $('btnPauseMiningIcon');
  const btnPauseMiningLabel = $('btnPauseMiningLabel');

  // Controles de Envio / Captação
  const btnToggleSender = $('btnToggleSender');
  const btnSenderLabel = $('btnSenderLabel');
  const btnPauseSender = $('btnPauseSender');
  const btnPauseSenderIcon = $('btnPauseSenderIcon');
  const btnPauseSenderLabel = $('btnPauseSenderLabel');

  // Botões de Fonte
  const sourceButtons = {
    similar: $('srcBtnSimilar'),
    keyword: $('srcBtnKeyword'),
    hashtag: $('srcBtnHashtag'),
    following: $('srcBtnFollowing'),
    followers: $('srcBtnFollowing') // fallback
  };

  let countdownInterval = null;
  let activeLeadFilter = 'all'; // 'all' | 'wa' | 'email'
  let cachedLeads = [];
  let knownCRMUsersCache = new Set();

  // ==========================================
  // NOTIFICAÇÕES (TOASTS INTERNOS) & BANNER
  // ==========================================
  function showToast({ type = 'info', title = '', message = '', duration = 4000 }) {
    const toast = document.createElement('div');
    toast.className = `innflu-toast ${type}`;
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `
      <div class="innflu-toast-icon">${icons[type] || 'ℹ️'}</div>
      <div class="innflu-toast-content">
        <div class="innflu-toast-title">${title}</div>
        <div class="innflu-toast-desc">${message}</div>
      </div>
      <button class="innflu-toast-close">&times;</button>
    `;
    toast.querySelector('.innflu-toast-close').onclick = () => toast.remove();
    hudToastContainer.appendChild(toast);
    if (duration > 0) setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration);
  }

  function showSafetyBanner(title, desc) {
    if (hudAlertTitle) hudAlertTitle.innerText = title;
    if (hudAlertDesc) hudAlertDesc.innerText = desc;
    if (hudSafetyAlertBanner) hudSafetyAlertBanner.style.display = 'flex';
  }

  if (btnDismissAlert) {
    btnDismissAlert.onclick = () => {
      if (hudSafetyAlertBanner) hudSafetyAlertBanner.style.display = 'none';
    };
  }

  // ==========================================
  // STORAGE PERSISTENTE (COM PROTEÇÃO ANTI-INVALIDATED CONTEXT)
  // ==========================================
  function isExtensionContextValid() {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }

  let localBotCache = null;

  async function getState() {
    return new Promise(resolve => {
      const fallback = {
        bot: {
          isRunning: false,
          isPaused: false,
          actionBlocked: false,
          activeMode: null,
          miningSource: 'similar',
          miningTarget: 'anaclaralopes',
          minFollowers: 10000,
          requireStories: true,
          requireContact: 'all',
          targetGender: 'female',
          queue: [],
          visited: [],
          visitedPosts: [],
          minedCount: 0,
          sentCount: 0,
          nextActionAt: 0,
          activityFeed: []
        },
        apiBaseUrl: 'http://127.0.0.1:8787',
        activeTemplate: hudTemplateContent ? hudTemplateContent.value : '',
        savedLeads: []
      };

      if (!isExtensionContextValid()) {
        localBotCache = fallback.bot;
        resolve(fallback);
        return;
      }

      try {
        chrome.storage.local.get(['innfluBot', 'apiBaseUrl', 'activeTemplate', 'savedLeadsCache'], res => {
          if (chrome.runtime.lastError) {
            localBotCache = fallback.bot;
            resolve(fallback);
            return;
          }
          const bot = res?.innfluBot || fallback.bot;
          if (!bot.queue) bot.queue = [];
          if (!bot.visited) bot.visited = [];
          if (!bot.visitedPosts) bot.visitedPosts = [];
          if (bot.isPaused === undefined) bot.isPaused = false;
          if (bot.actionBlocked === undefined) bot.actionBlocked = false;

          localBotCache = { ...bot };

          resolve({
            bot,
            apiBaseUrl: res?.apiBaseUrl || fallback.apiBaseUrl,
            activeTemplate: res?.activeTemplate || fallback.activeTemplate,
            savedLeads: res?.savedLeadsCache || []
          });
        });
      } catch (err) {
        localBotCache = fallback.bot;
        resolve(fallback);
      }
    });
  }

  async function saveBot(partial) {
    if (!isExtensionContextValid()) return;
    if (!localBotCache) {
      const s = await getState();
      localBotCache = s.bot;
    }
    // Atualiza imediatamente a cópia em memória para eliminar qualquer race condition
    localBotCache = { ...localBotCache, ...partial };
    const updated = { ...localBotCache };

    return new Promise(resolve => {
      try {
        chrome.storage.local.set({ innfluBot: updated }, () => resolve(updated));
      } catch (e) {
        resolve(updated);
      }
    });
  }

  // ==========================================
  // SINCRONIZAÇÃO DE UI & ESTADOS VISUAIS
  // ==========================================
  function syncUI(bot) {
    hudMinedCount.innerText = bot.minedCount || 0;
    hudSentTodayCount.innerText = `${bot.sentCount || 0} / 40`;
    hudQueueCount.innerText = (bot.queue || []).length;
    renderFeed(bot.activityFeed);

    // Sincroniza formulário de mineração
    if (bot.miningTarget && inputMiningTarget.value !== bot.miningTarget) {
      inputMiningTarget.value = bot.miningTarget;
    }
    if (bot.minFollowers !== undefined && selMinFollowers) {
      selMinFollowers.value = bot.minFollowers.toString();
    }
    if (bot.requireStories !== undefined && selRequireStories) {
      selRequireStories.value = bot.requireStories ? 'true' : 'false';
    }
    if (bot.requireContact && selRequireContact) {
      selRequireContact.value = bot.requireContact;
    }
    if (bot.targetGender && selTargetGender) {
      selTargetGender.value = bot.targetGender;
    }

    // Seleciona botão de fonte ativo
    selectSourceUI(bot.miningSource || 'similar');

    // Estado do Badge Global e Indicadores
    if (bot.actionBlocked) {
      hudGlobalBadge.className = 'innflu-status-badge status-blocked';
      hudStatusBadgeText.innerText = 'Bloqueio Preventivo';
      hudLiveStatusText.innerText = 'Ação Bloqueada pelo Instagram';
    } else if (bot.isRunning && bot.isPaused) {
      hudGlobalBadge.className = 'innflu-status-badge status-paused';
      hudStatusBadgeText.innerText = 'Pausado';
      hudLiveStatusText.innerText = 'Operação Pausada (Fila Preservada)';
    } else if (bot.isRunning) {
      hudGlobalBadge.className = 'innflu-status-badge status-running';
      if (bot.activeMode === 'auto') {
        hudStatusBadgeText.innerText = 'Automação Ativa...';
        hudLiveStatusText.innerText = 'Automação Contínua (Minerar + DM)';
      } else if (bot.activeMode === 'miner') {
        hudStatusBadgeText.innerText = 'Minerando...';
        hudLiveStatusText.innerText = 'Mineração Ativa';
      } else {
        hudStatusBadgeText.innerText = 'Captando...';
        hudLiveStatusText.innerText = 'Enviando DMs';
      }
    } else {
      hudGlobalBadge.className = 'innflu-status-badge status-idle';
      hudStatusBadgeText.innerText = 'Parado';
      hudLiveStatusText.innerText = 'Parado';
      hudCountdown.innerText = '';
      hudHeaderCountdown.style.display = 'none';
      hudDelayBarContainer.style.display = 'none';
    }

    // Controle rápido no Header (Pause / Resume)
    if (bot.isRunning) {
      btnHeaderPauseResume.style.display = 'flex';
      if (bot.isPaused) {
        iconHeaderPause.style.display = 'none';
        iconHeaderResume.style.display = 'block';
        btnHeaderPauseResume.title = 'Retomar Operação';
      } else {
        iconHeaderPause.style.display = 'block';
        iconHeaderResume.style.display = 'none';
        btnHeaderPauseResume.title = 'Pausar Operação';
      }
    } else {
      btnHeaderPauseResume.style.display = 'none';
    }

    // Botões de Execução - Automação Contínua
    if (bot.isRunning && bot.activeMode === 'auto') {
      btnToggleAuto.classList.remove('start');
      btnToggleAuto.classList.add('stop');
      btnAutoLabel.innerText = '⏹ Parar Automação';

      btnPauseAuto.style.display = 'flex';
      if (bot.isPaused) {
        btnPauseAuto.classList.add('resumed');
        btnPauseAutoIcon.innerText = '▶️';
        btnPauseAutoLabel.innerText = 'Retomar';
      } else {
        btnPauseAuto.classList.remove('resumed');
        btnPauseAutoIcon.innerText = '⏸️';
        btnPauseAutoLabel.innerText = 'Pausar';
      }
    } else {
      btnToggleAuto.classList.remove('stop');
      btnToggleAuto.classList.add('start');
      btnAutoLabel.innerText = '⚡ Iniciar Automação';
      btnPauseAuto.style.display = 'none';
    }

    // Botões de Execução - Mineração
    if (bot.isRunning && bot.activeMode === 'miner') {
      btnToggleMining.classList.remove('start');
      btnToggleMining.classList.add('stop');
      btnMiningLabel.innerText = '⏹ Parar Mineração';

      btnPauseMining.style.display = 'flex';
      if (bot.isPaused) {
        btnPauseMining.classList.add('resumed');
        btnPauseMiningIcon.innerText = '▶️';
        btnPauseMiningLabel.innerText = 'Retomar';
      } else {
        btnPauseMining.classList.remove('resumed');
        btnPauseMiningIcon.innerText = '⏸️';
        btnPauseMiningLabel.innerText = 'Pausar';
      }
    } else {
      btnToggleMining.classList.remove('stop');
      btnToggleMining.classList.add('start');
      btnMiningLabel.innerText = '🚀 Iniciar Mineração';
      btnPauseMining.style.display = 'none';
    }

    // Botões de Execução - Captação (Sender)
    if (bot.isRunning && bot.activeMode === 'sender') {
      btnToggleSender.classList.remove('start');
      btnToggleSender.classList.add('stop');
      btnSenderLabel.innerText = '⏹ Parar Captação';

      btnPauseSender.style.display = 'flex';
      if (bot.isPaused) {
        btnPauseSender.classList.add('resumed');
        btnPauseSenderIcon.innerText = '▶️';
        btnPauseSenderLabel.innerText = 'Retomar';
      } else {
        btnPauseSender.classList.remove('resumed');
        btnPauseSenderIcon.innerText = '⏸️';
        btnPauseSenderLabel.innerText = 'Pausar';
      }
    } else {
      btnToggleSender.classList.remove('stop');
      btnToggleSender.classList.add('start');
      btnSenderLabel.innerText = '✉️ Iniciar Envio de DMs';
      btnPauseSender.style.display = 'none';
    }

    const pageType = window.InnfluCrawler.detectCurrentPage();
    hudPageType.innerText = `Página atual: ${pageType} • Fila: ${(bot.queue || []).length} alvos`;
  }

  function selectSourceUI(source) {
    Object.entries(sourceButtons).forEach(([key, btn]) => {
      if (btn) {
        if (key === source) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    // Atualiza labels e placeholders dinamicamente
    if (source === 'similar') {
      lblMiningTarget.innerText = 'Perfil de Referência (ex: @marialuizazamoner):';
      inputMiningTarget.placeholder = 'ex: @marialuizazamoner, @vihtube';
    } else if (source === 'keyword') {
      lblMiningTarget.innerText = 'Palavra-chave do Nicho:';
      inputMiningTarget.placeholder = 'ex: maternidade, moda praia, nutrição';
    } else if (source === 'hashtag') {
      lblMiningTarget.innerText = 'Hashtag (com ou sem #):';
      inputMiningTarget.placeholder = 'ex: #maternidadereal, #lookdodia';
    } else if (source === 'following' || source === 'followers') {
      lblMiningTarget.innerText = 'Quem ela segue (ex: @marialuizazamoner):';
      inputMiningTarget.placeholder = 'ex: @marialuizazamoner, @vihtube';
    }
  }

  // Cliques nos botões de fonte
  Object.entries(sourceButtons).forEach(([src, btn]) => {
    if (btn) {
      btn.onclick = () => {
        selectSourceUI(src);
        saveBot({ miningSource: src });
      };
    }
  });

  inputMiningTarget.addEventListener('input', () => {
    const val = inputMiningTarget.value.trim();
    if (val.startsWith('@')) {
      selectSourceUI('similar');
      saveBot({ miningSource: 'similar', miningTarget: val.replace(/^@/, '') });
    } else if (val.startsWith('#')) {
      selectSourceUI('hashtag');
      saveBot({ miningSource: 'hashtag', miningTarget: val });
    } else {
      saveBot({ miningTarget: val });
    }
  });

  selMinFollowers.addEventListener('change', () => {
    saveBot({ minFollowers: parseInt(selMinFollowers.value, 10) });
  });

  if (selRequireStories) {
    selRequireStories.addEventListener('change', () => {
      saveBot({ requireStories: selRequireStories.value === 'true' });
    });
  }

  selRequireContact.addEventListener('change', () => {
    saveBot({ requireContact: selRequireContact.value });
  });

  if (selTargetGender) {
    selTargetGender.addEventListener('change', () => {
      saveBot({ targetGender: selTargetGender.value });
    });
  }

  // ==========================================
  // NAVEGAÇÃO ENTRE ABAS
  // ==========================================
  const tabs = {
    auto: [$('tabBtnAuto'), $('viewAuto')],
    mine: [$('tabBtnMine'), $('viewMine')],
    leads: [$('tabBtnLeads'), $('viewLeads')],
    sender: [$('tabBtnSender'), $('viewSender')],
    live: [$('tabBtnLive'), $('viewLive')]
  };

  function switchTab(target) {
    Object.values(tabs).forEach(([btn, view]) => {
      if (btn && view) {
        btn.classList.remove('active');
        view.style.display = 'none';
      }
    });
    if (tabs[target]) {
      tabs[target][0].classList.add('active');
      tabs[target][1].style.display = 'block';
    }
    if (target === 'leads') {
      loadLeadsFromApiAndRender();
    }
  }

  $('tabBtnAuto').onclick = () => switchTab('auto');
  $('tabBtnMine').onclick = () => switchTab('mine');
  $('tabBtnLeads').onclick = () => switchTab('leads');
  $('tabBtnSender').onclick = () => switchTab('sender');
  $('tabBtnLive').onclick = () => switchTab('live');

  // Drag & Minimizar
  let isDragging = false, startX, startY, initX, initY;
  hudHeader.addEventListener('mousedown', e => {
    if (e.target.closest('button')) return;
    isDragging = true; startX = e.clientX; startY = e.clientY;
    const r = root.getBoundingClientRect(); initX = r.left; initY = r.top;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onDragEnd);
  });
  function onDrag(e) {
    if (!isDragging) return;
    const newX = Math.max(10, Math.min(window.innerWidth - hud.offsetWidth - 10, initX + e.clientX - startX));
    const newY = Math.max(10, Math.min(window.innerHeight - 50, initY + e.clientY - startY));
    root.style.left = `${newX}px`;
    root.style.top = `${newY}px`;
    root.style.bottom = 'auto';
    root.style.right = 'auto';
  }
  function onDragEnd() { isDragging = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', onDragEnd); }
  $('btnMinimize').addEventListener('click', () => hud.classList.toggle('minimized'));

  // Abrir Dashboard Web
  $('btnOpenDashboard').onclick = async () => {
    const { apiBaseUrl } = await getState();
    window.open(apiBaseUrl, '_blank');
  };

  // ==========================================
  // TEMPLATES SPINTAX
  // ==========================================
  $('btnTestSpintax').onclick = () => {
    const text = window.InnfluSpintax.interpolate(hudTemplateContent.value, { nome: 'Marina', username: 'marinaferrarig' });
    showToast({ type: 'info', title: 'Variação Teste', message: text, duration: 6000 });
  };

  $('btnSaveTemplate').onclick = async () => {
    await chrome.storage.local.set({ activeTemplate: hudTemplateContent.value });
    const { apiBaseUrl } = await getState();
    try {
      await fetch(`${apiBaseUrl}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Template Ativo', content: hudTemplateContent.value })
      });
    } catch (e) {}
    showToast({ type: 'success', title: 'Template Salvo', message: 'Atualizado no armazenamento e Cloudflare D1.' });
  };

  // ==========================================
  // SINCRONIZAÇÃO DA MEMÓRIA DO CRM (ANTI-REPETIÇÃO INSTANTÂNEA)
  // ==========================================
  async function syncKnownCRMUsers(apiBaseUrl) {
    const { bot, savedLeads } = await getState();
    const set = new Set();

    // 1. Histórico da extensão (visited)
    (bot.visited || []).forEach(u => {
      if (u) set.add(u.toLowerCase());
    });

    // 2. Cache local de leads
    (savedLeads || []).forEach(l => {
      if (l.username) set.add(l.username.toLowerCase());
    });

    // 3. Busca lista remota do Cloudflare D1 (/api/leads)
    try {
      const res = await fetch(`${apiBaseUrl}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        if (data.leads && Array.isArray(data.leads)) {
          data.leads.forEach(l => {
            if (l.username) set.add(l.username.toLowerCase());
          });
        }
      }
    } catch (e) {
      console.warn('[Innflu] Aviso ao sincronizar CRM:', e);
    }

    knownCRMUsersCache = set;

    // Persiste a lista completa em bot.visited para garantir que mesmo pausando/recarregando ela se lembre de todas!
    const mergedVisited = Array.from(set).slice(-1000);
    bot.visited = mergedVisited;
    await saveBot({ visited: mergedVisited });
    console.log(`[Innflu] ⚡ Memória do CRM carregada: ${set.size} influenciadoras registradas (serão descartadas na hora se reaparecerem).`);
    return set;
  }

  // ==========================================
  // BOTÕES PRINCIPAIS DE EXECUÇÃO
  // ==========================================
  btnToggleMining.onclick = async () => {
    const { bot, apiBaseUrl } = await getState();
    if (bot.isRunning && bot.activeMode === 'miner') {
      await saveBot({ isRunning: false, activeMode: null, nextActionAt: 0 });
      clearInterval(countdownInterval);
      syncUI({ ...bot, isRunning: false, activeMode: null });
      showToast({ type: 'info', title: 'Mineração Pausada', message: 'Operação interrompida.' });
      return;
    }

    const rawInput = (inputMiningTarget.value || '').trim();
    let currentSource = bot.miningSource || 'keyword';

    // Se o usuário já selecionou "following" ou "hashtag", respeita!
    if (rawInput.startsWith('@')) {
      if (currentSource !== 'following' && currentSource !== 'followers') {
        currentSource = 'similar';
        selectSourceUI('similar');
      }
    } else if (rawInput.startsWith('#')) {
      currentSource = 'hashtag';
      selectSourceUI('hashtag');
    }

    const targetClean = rawInput.replace(/^[@#]/, '').trim().toLowerCase();

    if (!targetClean) {
      showToast({ type: 'error', title: 'Alvo Vazio', message: 'Digite uma palavra-chave, hashtag ou perfil de referência.' });
      return;
    }

    // Carrega todo o histórico do CRM para nunca re-chamar nem re-analisar influenciadoras já conhecidas
    await syncKnownCRMUsers(apiBaseUrl);

    // Ao iniciar uma nova mineração, limpa a fila e histórico de posts inspecionados para a nova rodada
    await saveBot({
      isRunning: true,
      activeMode: 'miner',
      miningSource: currentSource,
      miningTarget: targetClean,
      keyword: targetClean,
      queue: [],
      visitedPosts: [],
      nextActionAt: 0
    });

    const updated = await getState();
    syncUI(updated.bot);
    showToast({
      type: 'success',
      title: 'Mineração Iniciada',
      message: `Minerando via ${currentSource}: "${targetClean}"`
    });
    runLoop();
  };

  btnToggleAuto.onclick = async () => {
    const { bot, apiBaseUrl } = await getState();
    if (bot.isRunning && bot.activeMode === 'auto') {
      await saveBot({ isRunning: false, isPaused: false, activeMode: null, nextActionAt: 0 });
      clearInterval(countdownInterval);
      syncUI({ ...bot, isRunning: false, isPaused: false, activeMode: null });
      showToast({ type: 'info', title: 'Automação Encerrada', message: 'Ciclo interrompido.' });
      return;
    }

    const rawInput = (inputAutoTarget.value || '').trim();
    let currentSource = 'keyword';
    if (rawInput.startsWith('@')) {
      currentSource = 'similar';
    } else if (rawInput.startsWith('#')) {
      currentSource = 'hashtag';
    }

    const targetClean = rawInput.replace(/^[@#]/, '').trim().toLowerCase();
    if (!targetClean) {
      showToast({ type: 'error', title: 'Alvo Vazio', message: 'Digite um nicho, hashtag ou perfil de referência.' });
      return;
    }

    const minFollowersVal = parseInt(selAutoMinFollowers.value, 10) || 10000;
    const requireStoriesVal = selAutoStories.value === 'true';

    await syncKnownCRMUsers(apiBaseUrl);

    await saveBot({
      isRunning: true,
      isPaused: false,
      activeMode: 'auto',
      miningSource: currentSource,
      miningTarget: targetClean,
      keyword: targetClean,
      minFollowers: minFollowersVal,
      requireStories: requireStoriesVal,
      queue: [],
      visitedPosts: [],
      nextActionAt: 0
    });

    const updated = await getState();
    syncUI(updated.bot);
    showToast({
      type: 'success',
      title: '⚡ Automação Iniciada!',
      message: `Minerando "${targetClean}" e disparando DMs em loop contínuo.`
    });
    runLoop();
  };

  btnToggleSender.onclick = async () => {
    const { bot } = await getState();
    if (bot.isRunning && bot.activeMode === 'sender') {
      await saveBot({ isRunning: false, isPaused: false, activeMode: null, nextActionAt: 0 });
      clearInterval(countdownInterval);
      syncUI({ ...bot, isRunning: false, isPaused: false, activeMode: null });
      showToast({ type: 'info', title: 'Captação Encerrada', message: 'Envio interrompido.' });
      return;
    }

    await saveBot({ isRunning: true, isPaused: false, activeMode: 'sender', nextActionAt: 0 });
    const updated = await getState();
    syncUI(updated.bot);
    showToast({ type: 'success', title: 'Captação Iniciada', message: 'Enviando DMs com delays seguros anti-ban.' });
    runLoop();
  };

  // Controle Compartilhado de Pausa e Retomada
  async function togglePause() {
    const { bot } = await getState();
    if (!bot.isRunning) return;

    const newPauseState = !bot.isPaused;
    await saveBot({ isPaused: newPauseState });
    syncUI({ ...bot, isPaused: newPauseState });

    if (newPauseState) {
      showToast({ type: 'warning', title: 'Operação Pausada', message: 'Fila e histórico preservados. Clique em Retomar quando desejar.' });
      hudCurrentAction.innerText = 'Operação pausada pelo usuário.';
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    } else {
      showToast({ type: 'success', title: 'Operação Retomada', message: 'Continuando de onde parou!' });
      runLoop();
    }
  }

  btnHeaderPauseResume.onclick = togglePause;
  btnPauseAuto.onclick = togglePause;
  btnPauseMining.onclick = togglePause;
  btnPauseSender.onclick = togglePause;

  // ==========================================
  // MOTOR DE AUTOMAÇÃO E MINERAÇÃO
  // ==========================================
  async function runLoop() {
    const { bot, apiBaseUrl, activeTemplate } = await getState();
    if (!bot.isRunning) return;

    if (bot.isPaused) {
      hudCurrentAction.innerText = 'Operação pausada. Clique em "Retomar" para prosseguir.';
      return;
    }

    if (bot.nextActionAt && bot.nextActionAt > Date.now()) {
      startCountdown(bot.nextActionAt, runLoop);
      return;
    }

    const pageType = window.InnfluCrawler.detectCurrentPage();
    hudPageType.innerText = `Página: ${pageType} • Fila: ${(bot.queue || []).length} perfis`;

    if (bot.activeMode === 'auto') {
      await stepAutomation(bot, apiBaseUrl, activeTemplate, pageType);
    } else if (bot.activeMode === 'miner') {
      await stepMiner(bot, apiBaseUrl, pageType);
    } else if (bot.activeMode === 'sender') {
      await stepSender(bot, apiBaseUrl, activeTemplate, pageType);
    }
  }

  // ==========================================
  // PIPELINE DE AUTOMAÇÃO CONTÍNUA (MINERA -> DM -> CONTINUA)
  // ==========================================
  async function stepAutomation(bot, apiBaseUrl, activeTemplate, pageType) {
    if ((bot.sentCount || 0) >= (bot.dailyLimit || 40)) {
      showToast({ type: 'warning', title: 'Meta Diária Atingida', message: 'Limite diário de abordagens alcançado por hoje!' });
      await saveBot({ isRunning: false, isPaused: false, activeMode: null });
      syncUI({ ...bot, isRunning: false, activeMode: null });
      return;
    }

    // 1. Se temos criadoras na fila pronta para abordagem:
    if (bot.queue && bot.queue.length > 0) {
      const nextUser = bot.queue[0];
      const cleanUser = nextUser.toLowerCase();

      // Estamos no perfil da influenciadora?
      if (pageType === 'profile' && window.InnfluCrawler.getCurrentProfileUsername() === cleanUser) {
        hudCurrentAction.innerText = `[⚡ Automação] Avaliando e contatando @${cleanUser}...`;

        const rawTarget = (bot.miningTarget || 'Geral').trim();
        const currentNiche = bot.miningSource === 'hashtag' ? ('#' + rawTarget.replace(/^#/, '')) : rawTarget;
        const profile = window.InnfluInspector.extractCurrentProfileData(currentNiche);

        const remainingQueue = bot.queue.slice(1);
        const visitedSet = new Set(bot.visited || []);
        visitedSet.add(cleanUser);
        knownCRMUsersCache.add(cleanUser);

        if (!profile) {
          hudCurrentAction.innerText = `[⚡ Automação] Falha ao ler @${cleanUser}. Avançando...`;
          await saveBot({ queue: remainingQueue, visited: Array.from(visitedSet).slice(-1000) });
          scheduleNext(1200);
          return;
        }

        // Validação de critérios
        const evalResult = window.InnfluInspector.evaluateCandidate(profile, {
          minFollowers: bot.minFollowers || 10000,
          requireActiveStories: bot.requireStories !== false,
          targetGender: bot.targetGender || 'female',
          requireContact: bot.requireContact || 'all'
        });

        if (!evalResult.approved) {
          const rejectReason = evalResult.reasons.join(', ');
          hudCurrentAction.innerText = `[⚡ Automação] @${cleanUser} pulada: ${rejectReason}`;
          await logActivity({ username: cleanUser, status: `Pulada (${rejectReason})` });
          await saveBot({ queue: remainingQueue, visited: Array.from(visitedSet).slice(-1000) });
          scheduleNext(1200);
          return;
        }

        // Perfil qualificado: Salva no D1 e dispara mensagem
        await saveLead(apiBaseUrl, profile, 'minerada', currentNiche);
        await cacheLocalLead(profile, 'minerada', currentNiche);

        const newMined = (bot.minedCount || 0) + 1;
        await saveBot({
          minedCount: newMined,
          queue: remainingQueue,
          visited: Array.from(visitedSet).slice(-1000)
        });
        hudMinedCount.innerText = newMined;

        // Disparo de DM com Spintax
        try {
          const influencerName = profile.fullName ? profile.fullName.split(' ')[0] : cleanUser;
          const msg = window.InnfluSpintax.interpolate(activeTemplate, { username: cleanUser, nome: influencerName });

          hudCurrentAction.innerText = `[⚡ Automação] Digitando DM para @${cleanUser}...`;
          await window.InnfluSender.sendDirectMessage(msg);

          const newSent = (bot.sentCount || 0) + 1;
          await saveBot({ sentCount: newSent });
          hudSentTodayCount.innerText = `${newSent} / 40`;
          await logActivity({ username: cleanUser, status: 'Automação: DM Enviada ✉️⚡' });
          showToast({ type: 'success', title: `DM Enviada! @${cleanUser}`, message: 'Automação: aguardando delay seguro para minerar próxima...' });

          // Registra no Cloudflare D1
          try {
            await fetch(`${apiBaseUrl}/api/log-sent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: cleanUser, message_text: msg, status: 'success' })
            });
          } catch (e) {}

          // Delay anti-ban seguro (60s a 180s)
          const delaySec = Math.floor(Math.random() * 121) + 60;
          const nextAt = Date.now() + delaySec * 1000;
          await saveBot({ nextActionAt: nextAt });
          hudCurrentAction.innerText = `[⚡ Automação] Descanso anti-ban (${delaySec}s) antes da próxima...`;
          startCountdown(nextAt, runLoop, delaySec * 1000);
          return;
        } catch (err) {
          showToast({ type: 'error', title: 'Falha no Envio', message: err.message });
          const delaySec = 20;
          const nextAt = Date.now() + delaySec * 1000;
          await saveBot({ nextActionAt: nextAt });
          startCountdown(nextAt, runLoop, delaySec * 1000);
          return;
        }
      } else {
        // Navega até o perfil da criadora
        hudCurrentAction.innerText = `[⚡ Automação] Abrindo @${cleanUser}...`;
        window.InnfluCrawler.openProfile(cleanUser);
        return;
      }
    }

    // 2. Fila vazia: executa mineração contínua para encontrar a próxima influenciadora
    hudCurrentAction.innerText = `[⚡ Automação] Fila vazia. Minerando novos perfis...`;
    await stepMiner(bot, apiBaseUrl, pageType);
  }

  function startCountdown(targetTs, callback, totalDurationMs) {
    clearInterval(countdownInterval);
    const duration = totalDurationMs || Math.max(1000, targetTs - Date.now());

    hudDelayBarContainer.style.display = 'flex';
    hudHeaderCountdown.style.display = 'inline-block';

    const tick = () => {
      if (localBotCache && localBotCache.isPaused) {
        hudCountdown.innerText = '⏸️ Pausado';
        hudHeaderCountdown.innerText = '⏸️ Pausado';
        hudDelayBarText.innerText = '⏸️ Pausado pelo usuário';
        return;
      }

      const rem = targetTs - Date.now();
      if (rem <= 0) {
        clearInterval(countdownInterval);
        hudCountdown.innerText = '';
        hudHeaderCountdown.innerText = '';
        hudHeaderCountdown.style.display = 'none';
        hudDelayBarContainer.style.display = 'none';
        callback();
        return;
      }

      const s = Math.ceil(rem / 1000);
      const timeFormatted = `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
      hudCountdown.innerText = `⏳ ${timeFormatted}`;
      hudHeaderCountdown.innerText = `⏳ ${timeFormatted}`;

      const pct = Math.min(100, Math.max(0, ((duration - rem) / duration) * 100));
      hudDelayBarFill.style.width = `${pct}%`;
      hudDelayBarText.innerText = `⏳ Delay Humano Seguro Anti-Ban: ${s}s restantes`;
    };

    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // ==========================================
  // PASSO DE MINERAÇÃO (MULTI-FONTE & PROGRESSIVA)
  // ==========================================
  async function stepMiner(bot, apiBaseUrl, pageType) {
    const source = bot.miningSource || 'keyword';
    const target = (bot.miningTarget || 'maternidade').trim();
    const targetClean = target.replace(/^[@#]/, '').toLowerCase().trim();
    const currentProfileUser = window.InnfluCrawler.getCurrentProfileUsername();

    // ========================================================
    // 1. ESTAMOS NO PERFIL DE UMA INFLUENCIADORA (pageType === 'profile')
    // ========================================================
    if (pageType === 'profile' && currentProfileUser) {
      const visited = bot.visited || [];
      const hasBeenVisited = visited.includes(currentProfileUser);

      // A) Se ainda não analisou este perfil, analisa e salva no CRM agora!
      if (!hasBeenVisited) {
        await analyzeAndMineProfile(bot, apiBaseUrl);
        const updatedVisited = [...visited, currentProfileUser].slice(-1000);
        const updatedQueue = (bot.queue || []).filter(u => u !== currentProfileUser);
        bot.visited = updatedVisited;
        bot.queue = updatedQueue;
        knownCRMUsersCache.add(currentProfileUser.toLowerCase());
        await saveBot({ visited: updatedVisited, queue: updatedQueue });
        hudQueueCount.innerText = updatedQueue.length;
        scheduleNext(window.InnfluCrawler.randomDelay(1000, 1600));
        return;
      }

      // B) FONTE: ✨ Semelhantes a @
      if (source === 'similar') {
        // Se estamos no perfil de referência e a fila está vazia, extrai semelhantes!
        if (currentProfileUser === targetClean && (bot.queue || []).length === 0) {
          hudCurrentAction.innerText = `Buscando perfis semelhantes a @${currentProfileUser}...`;
          const similarAccounts = await window.InnfluCrawler.extractSimilarAccounts();
          const visitedNow = bot.visited || [];
          const newCandidates = similarAccounts.filter(u => !visitedNow.includes(u) && u !== targetClean);

          if (newCandidates.length > 0) {
            await saveBot({ queue: newCandidates.slice(0, 50) });
            hudQueueCount.innerText = Math.min(newCandidates.length, 50);
            showToast({
              type: 'success',
              title: `${newCandidates.length} Semelhantes Encontradas!`,
              message: newCandidates.slice(0, 3).map(u => `@${u}`).join(', ') + '...'
            });
            scheduleNext(2000);
            return;
          } else {
            showToast({
              type: 'info',
              title: 'Sem Novas Sugestões',
              message: `Não foram encontradas mais contas semelhantes a @${currentProfileUser}.`
            });
            scheduleNext(4000);
            return;
          }
        }

        // Se ainda temos semelhantes na fila, abre o próximo!
        const currentQueue = (bot.queue || []).filter(u => u !== currentProfileUser);
        if (currentQueue.length > 0) {
          const nextTarget = currentQueue[0];
          hudCurrentAction.innerText = `Abrindo próxima semelhante: @${nextTarget}...`;
          window.InnfluCrawler.openProfile(nextTarget);
          return;
        }

        // Fila esgotada
        hudCurrentAction.innerText = `Mineração de semelhantes concluída (${(bot.minedCount || 0)} salvas).`;
        showToast({ type: 'success', title: 'Mineração Concluída', message: 'Todos os perfis semelhantes foram analisados.' });
        await saveBot({ isRunning: false, activeMode: null });
        syncUI({ ...bot, isRunning: false });
        return;
      }

      // C) FONTE: 👥 Seguindo de @
      if (source === 'following' || source === 'followers') {
        if (currentProfileUser === targetClean && (bot.queue || []).length === 0) {
          hudCurrentAction.innerText = `Extraindo quem @${currentProfileUser} está seguindo...`;
          const modalCandidates = await window.InnfluCrawler.extractFollowingFromModal(6);
          const visitedNow = bot.visited || [];
          const newCandidates = modalCandidates.filter(u => !visitedNow.includes(u) && u !== targetClean);

          if (newCandidates.length > 0) {
            await saveBot({ queue: newCandidates.slice(0, 50) });
            hudQueueCount.innerText = Math.min(newCandidates.length, 50);
            showToast({
              type: 'success',
              title: `${newCandidates.length} Perfis Encontrados!`,
              message: `Fila preenchida com quem @${currentProfileUser} segue.`
            });
            scheduleNext(2000);
            return;
          } else {
            showToast({
              type: 'warning',
              title: 'Nenhum perfil extraído',
              message: `Não foi possível extrair a lista de quem @${currentProfileUser} segue. Verifique se a conta é aberta.`
            });
            scheduleNext(4000);
            return;
          }
        }

        const currentQueue = (bot.queue || []).filter(u => u !== currentProfileUser);
        if (currentQueue.length > 0) {
          const nextTarget = currentQueue[0];
          hudCurrentAction.innerText = `Abrindo influenciadora que ela segue: @${nextTarget}...`;
          window.InnfluCrawler.openProfile(nextTarget);
          return;
        }

        hudCurrentAction.innerText = `Mineração de quem ela segue concluída!`;
        await saveBot({ isRunning: false, activeMode: null });
        syncUI({ ...bot, isRunning: false });
        return;
      }

      // D) FONTE: 🔍 Palavra-chave ou #️⃣ Hashtag
      const remainingQueue = (bot.queue || []).filter(u => u !== currentProfileUser && !(bot.visited || []).includes(u));
      if (remainingQueue.length > 0) {
        const nextTarget = remainingQueue[0];
        hudCurrentAction.innerText = `Abrindo próxima criadora da fila: @${nextTarget}...`;
        window.InnfluCrawler.openProfile(nextTarget);
        return;
      }

      // Fila concluída -> volta para a pesquisa / hashtag para avançar para as próximas publicações!
      hudCurrentAction.innerText = `Voltando para busca (${target}) para minerar novas publicações...`;
      await window.InnfluCrawler.sleep(1500);
      window.InnfluCrawler.navigateToSource(source, target);
      return;
    }

    // ========================================================
    // 2. SE TEMOS GENTE NA FILA E NÃO ESTAMOS NUM PERFIL: ABRE O PRIMEIRO!
    // ========================================================
    const pendingQueue = (bot.queue || []).filter(u => !(bot.visited || []).includes(u));
    if (pendingQueue.length > 0) {
      const nextUser = pendingQueue[0];
      hudCurrentAction.innerText = `Abrindo influenciadora da fila: @${nextUser}...`;
      window.InnfluCrawler.openProfile(nextUser);
      return;
    }

    // ========================================================
    // 3. FONTE: ✨ Semelhantes ou 👥 Seguindo -> se não está no perfil alvo, navega até ele
    // ========================================================
    if ((source === 'similar' || source === 'following' || source === 'followers') && targetClean) {
      if (currentProfileUser !== targetClean) {
        hudCurrentAction.innerText = `Navegando até o perfil de referência @${targetClean}...`;
        window.InnfluCrawler.openProfile(targetClean);
        return;
      }
    }

    // ========================================================
    // 4. ESTAMOS NUM POST DIRETO (/p/ ou /reel/)
    // ========================================================
    if (pageType === 'post') {
      hudCurrentAction.innerText = 'Inspecionando publicação aberta...';
      const normPath = window.InnfluCrawler.normalizePostHref(window.location.pathname);
      const visitedPosts = new Set(bot.visitedPosts || []);
      if (normPath) {
        visitedPosts.add(normPath);
        await saveBot({ visitedPosts: Array.from(visitedPosts).slice(-600) });
      }

      const author = window.InnfluCrawler.extractPostAuthor();
      const visitedUsers = new Set(bot.visited || []);

      if (author && !visitedUsers.has(author)) {
        hudCurrentAction.innerText = `Criadora identificada: @${author}. Abrindo perfil...`;
        await window.InnfluCrawler.sleep(1200);
        window.InnfluCrawler.openProfile(author);
        return;
      }

      // Se já foi visitada ou autor não identificado, volta para a busca/hashtag
      hudCurrentAction.innerText = 'Publicação já avaliada. Retornando para busca...';
      await window.InnfluCrawler.sleep(1200);
      window.InnfluCrawler.navigateToSource(source, target);
      return;
    }

    // ========================================================
    // 5. ESTAMOS NA PÁGINA DE BUSCA / EXPLORE / HASHTAG (pageType === 'search')
    // ========================================================
    if (pageType === 'search') {
      hudCurrentAction.innerText = `Varrendo publicações de "${target}"...`;
      await window.InnfluCrawler.sleep(1200);

      if (knownCRMUsersCache.size === 0) {
        await syncKnownCRMUsers(apiBaseUrl);
      }

      const visitedUsers = new Set([...(bot.visited || []), ...Array.from(knownCRMUsersCache)]);
      const visitedPosts = new Set((bot.visitedPosts || []).map(h => window.InnfluCrawler.normalizePostHref(h)));

      // PASSO 1: Extrai criadoras diretamente das imagens da grade (alt-text)
      const { creators, postHrefs } = window.InnfluCrawler.extractCreatorsFromVisibleGrid(Array.from(visitedUsers));
      (postHrefs || []).forEach(h => visitedPosts.add(h));

      if (creators && creators.length > 0) {
        const newQueue = creators.slice(0, 40);
        await saveBot({
          queue: newQueue,
          visitedPosts: Array.from(visitedPosts).slice(-600)
        });
        hudQueueCount.innerText = newQueue.length;
        showToast({
          type: 'success',
          title: `${newQueue.length} Criadoras Encontradas!`,
          message: newQueue.slice(0, 4).map(u => `@${u}`).join(', ') + '...'
        });
        hudCurrentAction.innerText = `Abrindo primeira criadora: @${newQueue[0]}...`;
        scheduleNext(800);
        return;
      }

      // PASSO 2: Se não pegou criadoras novas no alt-text, seleciona a PRÓXIMA publicação ainda não inspecionada
      const nextPost = window.InnfluCrawler.getNextUnvisitedPost(Array.from(visitedPosts));

      if (!nextPost) {
        // Todos os posts visíveis foram inspecionados! Rola para carregar novos posts
        hudCurrentAction.innerText = 'Rolando feed para carregar novas publicações...';
        await window.InnfluCrawler.scrollDown();
        await window.InnfluCrawler.sleep(2000);

        const retryPost = window.InnfluCrawler.getNextUnvisitedPost(Array.from(visitedPosts));
        if (!retryPost) {
          hudCurrentAction.innerText = 'Carregando mais conteúdo do feed...';
          await window.InnfluCrawler.scrollDown();
          scheduleNext(2500);
          return;
        }
        return handleInspectPostElement(retryPost, visitedPosts, visitedUsers, source, target, apiBaseUrl);
      }

      return handleInspectPostElement(nextPost, visitedPosts, visitedUsers, source, target, apiBaseUrl);
    }

    // ========================================================
    // 6. QUALQUER OUTRA PÁGINA (Feed inicial, etc.) -> vai para a fonte
    // ========================================================
    hudCurrentAction.innerText = `Navegando para ${source}: "${target}"...`;
    window.InnfluCrawler.navigateToSource(source, target);
  }

  /**
   * Inspeciona uma publicação específica na grade e avança sequencialmente
   */
  async function handleInspectPostElement(postInfo, visitedPostsSet, visitedUsersSet, source, target, apiBaseUrl) {
    const { element, href } = postInfo;
    
    // IMPORTANTE: Salva o post no storage ANTES de clicar para garantir que nunca será repetido
    visitedPostsSet.add(href);
    await saveBot({ visitedPosts: Array.from(visitedPostsSet).slice(-600) });

    hudCurrentAction.innerText = `Inspecionando publicação (${href})...`;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await window.InnfluCrawler.sleep(300);

    // Clica na publicação
    element.click();

    // Aguarda o autor da publicação carregar de forma responsiva e rápida (máx 1400ms)
    let author = null;
    let curPath = '';
    for (let t = 0; t < 7; t++) {
      await window.InnfluCrawler.sleep(200);
      curPath = window.location.pathname.toLowerCase();
      if (curPath.startsWith('/p/') || curPath.startsWith('/reel/')) {
        const directNorm = window.InnfluCrawler.normalizePostHref(curPath);
        visitedPostsSet.add(directNorm);
      }
      author = window.InnfluCrawler.extractPostAuthor();
      if (author) break;
    }

    if (author) {
      const authorLower = author.toLowerCase();
      // VERIFICAÇÃO INSTANTÂNEA: Está no CRM ou já foi visitada?
      const isAlreadyInCRM = visitedUsersSet.has(authorLower) || knownCRMUsersCache.has(authorLower);

      if (isAlreadyInCRM) {
        hudCurrentAction.innerText = `@${author} já está no CRM / visitada. Descartando na hora! ⚡`;
        console.log(`[Innflu] ⚡ Descarte rápido: @${author} já consta no CRM. Não precisa abrir perfil.`);
        await logActivity({ username: author, status: 'Descartada (Já no CRM ⚡)' });
      } else {
        // Checagem de elegibilidade da regra dos 7 dias antes de abrir perfil
        const check7d = await check7DayRule(apiBaseUrl, authorLower);
        if (!check7d.eligible) {
          hudCurrentAction.innerText = `@${author} contatada nos últimos 7 dias. Descartando na hora! ⚡`;
          visitedUsersSet.add(authorLower);
          knownCRMUsersCache.add(authorLower);
          await saveBot({ visited: Array.from(visitedUsersSet).slice(-1000) });
          await logActivity({ username: author, status: 'Descartada (Regra 7d ⚡)' });
        } else {
          // ELEGÍVEL E INÉDITA! Abre o perfil para auditar seguidores, stories e contatos!
          hudCurrentAction.innerText = `Nova criadora: @${author}! Abrindo perfil...`;
          await window.InnfluCrawler.sleep(600);
          window.InnfluCrawler.openProfile(author);
          return;
        }
      }
    } else {
      hudCurrentAction.innerText = 'Não foi possível ler o autor deste post. Próximo...';
    }

    // Fecha modal ou volta se navegou
    if (curPath.startsWith('/p/') || curPath.startsWith('/reel/')) {
      window.history.back();
      await window.InnfluCrawler.sleep(1400);
    } else {
      await window.InnfluCrawler._closeModal();
      await window.InnfluCrawler.sleep(500);
    }

    scheduleNext(800);
  }

  // ==========================================
  // ANÁLISE E EXTRAÇÃO COMPLETA DE CONTATOS
  // ==========================================
  async function analyzeAndMineProfile(bot, apiBaseUrl) {
    const rawTarget = (bot.miningTarget || 'Geral').trim();
    const currentNiche = bot.miningSource === 'hashtag' ? ('#' + rawTarget.replace(/^#/, '')) : rawTarget;

    const profile = window.InnfluInspector.extractCurrentProfileData(currentNiche);
    if (!profile) {
      hudCurrentAction.innerText = 'Não foi possível ler este perfil.';
      return;
    }

    const minFollowersRequired = bot.minFollowers !== undefined ? bot.minFollowers : 10000;
    const requireStoriesFilter = bot.requireStories !== undefined ? bot.requireStories : true;
    const requireContactFilter = bot.requireContact || 'all';
    const targetGenderFilter = bot.targetGender || 'female';

    let fDisplay = '?';
    if (profile.followersCount > 0) {
      fDisplay = profile.followersCount >= 1000000
        ? (profile.followersCount / 1000000).toFixed(1).replace('.', ',') + ' mi'
        : profile.followersCount >= 1000
          ? (profile.followersCount / 1000).toFixed(1).replace('.', ',') + ' mil'
          : profile.followersCount.toString();
    }

    const storiesStatusText = profile.hasActiveStories ? 'c/ Stories ⚡' : 's/ Stories';
    hudCurrentAction.innerText = `Avaliando @${profile.username} (${fDisplay} seg., ${storiesStatusText})...`;

    // Avaliação centralizada e robusta de critérios da campanha
    const evaluation = window.InnfluInspector.evaluateCandidate(profile, {
      minFollowers: minFollowersRequired,
      maxFollowers: 10000000,
      requireActiveStories: requireStoriesFilter,
      targetGender: targetGenderFilter,
      requireContact: requireContactFilter
    });

    const isApproved = evaluation.approved;
    const rejectReason = evaluation.reasons && evaluation.reasons.length > 0 ? evaluation.reasons.join(', ') : '';

    if (isApproved) {
      const statusText = 'minerada';
      // 1. Salva no Cloudflare D1 com Nicho
      await saveLead(apiBaseUrl, profile, statusText, currentNiche);

      // 2. Salva no cache local com Nicho
      await cacheLocalLead(profile, statusText, currentNiche);

      // 3. Registra na memória de conhecidos
      knownCRMUsersCache.add(profile.username.toLowerCase());

      const newMined = (bot.minedCount || 0) + 1;
      await saveBot({ minedCount: newMined });
      hudMinedCount.innerText = newMined;

      await logActivity({
        username: profile.username,
        status: profile.whatsapp ? '📱 WhatsApp' : profile.email ? '✉️ Email' : 'Minerada ✅',
        whatsapp: profile.whatsapp,
        email: profile.email
      });

      showToast({
        type: 'success',
        title: `Salva: @${profile.username} [${currentNiche}]`,
        message: `${fDisplay} seg. • ${storiesStatusText} • ${profile.whatsapp ? '📱 ' + profile.whatsapp : ''} ${profile.email ? '✉️ ' + profile.email : (!profile.whatsapp ? 'Sem telefone direto' : '')}`
      });

      // Atualiza aba de leads se estiver aberta
      renderLeadsTable();
    } else {
      hudCurrentAction.innerText = `@${profile.username}: Pulada (${rejectReason})`;
      await logActivity({ username: profile.username, status: `Pulada (${rejectReason})` });
    }
  }

  // ==========================================
  // ENVIO DE DMS (CAPTAÇÃO)
  // ==========================================
  async function stepSender(bot, apiBaseUrl, activeTemplate, pageType) {
    hudCurrentAction.innerText = 'Buscando próxima influenciadora minerada...';
    let target = null;

    try {
      const res = await fetch(`${apiBaseUrl}/api/leads?status=minerada`);
      const data = await res.json();
      if (data.leads && data.leads.length > 0) target = data.leads[0];
    } catch (e) {}

    if (!target) {
      showToast({ type: 'info', title: 'Fila de Envio Vazia', message: 'Minere influenciadoras primeiro na aba "⛏️ Minerar".' });
      await saveBot({ isRunning: false, activeMode: null });
      syncUI({ ...bot, isRunning: false });
      return;
    }

    // Regra dos 7 dias
    const check = await check7DayRule(apiBaseUrl, target.username);
    if (!check.eligible) {
      hudCurrentAction.innerText = `@${target.username} contatada recentemente. Pulando...`;
      await logActivity({ username: target.username, status: 'Pulada (7d)' });
      try {
        await fetch(`${apiBaseUrl}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: target.username, status: 'skipped' })
        });
      } catch (e) {}
      scheduleNext(3000);
      return;
    }

    if (pageType !== 'profile' || window.InnfluCrawler.getCurrentProfileUsername() !== target.username) {
      hudCurrentAction.innerText = `Navegando até @${target.username}...`;
      window.InnfluCrawler.openProfile(target.username);
      return;
    }

    // No perfil: dispara DM
    await dispatchDM(target.username, apiBaseUrl, activeTemplate);
  }

  async function dispatchDM(username, apiBaseUrl, template) {
    try {
      let chosenTemplate = template;
      try {
        const { apiKey } = await getState();
        const headers = apiKey ? { 'X-API-Key': apiKey } : {};
        const tmplRes = await fetch(`${apiBaseUrl}/api/templates`, { headers });
        if (tmplRes.ok) {
          const tmplData = await tmplRes.json();
          if (tmplData.templates && tmplData.templates.length > 0) {
            const { bot } = await getState();
            const idx = (bot.sentCount || 0) % tmplData.templates.length;
            chosenTemplate = tmplData.templates[idx].content || template;
          }
        }
      } catch (e) {}

      // Busca primeiro nome real do perfil se disponível
      let influencerName = username;
      try {
        if (window.InnfluCrawler && typeof window.InnfluCrawler.getCurrentProfileFullName === 'function') {
          const profileName = window.InnfluCrawler.getCurrentProfileFullName();
          if (profileName) influencerName = profileName.split(' ')[0];
        }
      } catch (e) {}

      const msg = window.InnfluSpintax.interpolate(chosenTemplate, { username, nome: influencerName });
      hudCurrentAction.innerText = `Digitando DM para @${username}...`;
      await window.InnfluSender.sendDirectMessage(msg);

      const { bot } = await getState();
      const newSent = (bot.sentCount || 0) + 1;
      await saveBot({ sentCount: newSent });
      hudSentTodayCount.innerText = `${newSent} / 40`;
      await logActivity({ username, status: 'DM Enviada ✉️' });
      showToast({ type: 'success', title: `DM Enviada! @${username}`, message: 'Digitação humana concluída.' });

      try {
        await fetch(`${apiBaseUrl}/api/log-sent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, message_text: msg, status: 'success' })
        });
      } catch (e) {}

      // Delay seguro anti-ban (60s a 180s)
      const delaySec = Math.floor(Math.random() * 121) + 60;
      const nextAt = Date.now() + delaySec * 1000;
      await saveBot({ nextActionAt: nextAt });
      hudCurrentAction.innerText = `Pausa anti-ban (${delaySec}s)...`;
      startCountdown(nextAt, runLoop);
    } catch (err) {
      showToast({ type: 'error', title: 'Falha no Envio', message: err.message });
      const nextAt = Date.now() + 15000;
      await saveBot({ nextActionAt: nextAt });
      startCountdown(nextAt, runLoop);
    }
  }

  function scheduleNext(ms) {
    setTimeout(runLoop, ms);
  }

  // ==========================================
  // GERENCIAMENTO DA LISTA DE LEADS
  // ==========================================
  async function cacheLocalLead(profile, status, niche) {
    const { savedLeads } = await getState();
    const cleanUser = profile.username.toLowerCase();
    const existingIndex = savedLeads.findIndex(l => (l.username || '').toLowerCase() === cleanUser);

    const leadItem = {
      username: cleanUser,
      full_name: profile.fullName || '',
      followers_count: profile.followersCount || 0,
      whatsapp: profile.whatsapp || null,
      email: profile.email || null,
      bio: profile.bio || '',
      niche: niche || profile.niche || 'Geral',
      status: status || 'minerada',
      discovered_at: new Date().toISOString()
    };

    let updatedList;
    if (existingIndex >= 0) {
      updatedList = [...savedLeads];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...leadItem };
    } else {
      updatedList = [leadItem, ...savedLeads].slice(0, 500);
    }

    cachedLeads = updatedList;
    await chrome.storage.local.set({ savedLeadsCache: updatedList });
    updateLeadsCountHeader(updatedList);
  }

  function updateLeadsCountHeader(leads) {
    tabLeadsCount.innerText = leads.length;
    sumTotalLeads.innerText = leads.length;
    sumWaLeads.innerText = leads.filter(l => !!l.whatsapp).length;
    sumEmailLeads.innerText = leads.filter(l => !!l.email).length;
  }

  async function loadLeadsFromApiAndRender() {
    leadsCardsContainer.innerHTML = '<div style="font-size:11px;color:#94a3b8;text-align:center;padding:12px;">Carregando influenciadoras...</div>';
    try {
      const { apiBaseUrl, savedLeads } = await getState();
      let leads = savedLeads || [];

      try {
        const res = await fetch(`${apiBaseUrl}/api/leads`);
        const data = await res.json();
        if (data.leads && Array.isArray(data.leads)) {
          leads = data.leads;
          cachedLeads = leads;
          await chrome.storage.local.set({ savedLeadsCache: leads });
        }
      } catch (e) {}

      cachedLeads = leads;
      updateLeadsCountHeader(leads);
      renderLeadsTable();
    } catch (err) {
      leadsCardsContainer.innerHTML = '<div style="font-size:11px;color:#ef4444;text-align:center;padding:12px;">Erro ao carregar lista.</div>';
    }
  }

  function renderLeadsTable() {
    let filtered = cachedLeads;
    if (activeLeadFilter === 'wa') filtered = cachedLeads.filter(l => !!l.whatsapp);
    if (activeLeadFilter === 'email') filtered = cachedLeads.filter(l => !!l.email);

    if (filtered.length === 0) {
      leadsCardsContainer.innerHTML = '<div style="font-size:11px;color:#64748b;text-align:center;padding:16px;">Nenhuma influenciadora encontrada com este filtro.</div>';
      return;
    }

    leadsCardsContainer.innerHTML = filtered.map(l => {
      let fDisplay = '?';
      if (l.followers_count > 0) {
        fDisplay = l.followers_count >= 1000000
          ? (l.followers_count / 1000000).toFixed(1).replace('.', ',') + ' mi'
          : l.followers_count >= 1000
            ? (l.followers_count / 1000).toFixed(1).replace('.', ',') + ' mil'
            : l.followers_count.toString();
      }

      let waCleanDigits = l.whatsapp ? l.whatsapp.replace(/\D/g, '') : '';
      let waLink = waCleanDigits ? `https://wa.me/${waCleanDigits.startsWith('55') ? waCleanDigits : '55' + waCleanDigits}` : '#';

      return `
        <div class="innflu-lead-card">
          <div class="innflu-lead-top">
            <a href="https://www.instagram.com/${l.username}/" target="_blank" class="innflu-lead-user">
              @${l.username} ↗
            </a>
            <div style="display:flex;align-items:center;gap:4px;">
              <span class="innflu-lead-followers" style="background:rgba(168,85,247,0.18);color:#c084fc;border:1px solid rgba(168,85,247,0.3);font-size:9px;">🏷️ ${l.niche || 'Geral'}</span>
              <span class="innflu-lead-followers">${fDisplay} seg.</span>
            </div>
          </div>
          ${l.full_name ? `<div class="innflu-lead-name">${l.full_name}</div>` : ''}
          <div class="innflu-lead-contacts">
            ${l.whatsapp ? `
              <a href="${waLink}" target="_blank" class="innflu-contact-pill wa" title="Abrir conversa no WhatsApp">
                📱 ${l.whatsapp}
              </a>
            ` : ''}
            ${l.email ? `
              <a href="mailto:${l.email}" class="innflu-contact-pill email" title="Enviar e-mail">
                ✉️ ${l.email}
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Filtros de Leads (Todos / Com Whats / Com Email)
  $('chipFilterAll').onclick = () => { setActiveChip('all'); };
  $('chipFilterWa').onclick = () => { setActiveChip('wa'); };
  $('chipFilterEmail').onclick = () => { setActiveChip('email'); };

  function setActiveChip(type) {
    activeLeadFilter = type;
    ['chipFilterAll', 'chipFilterWa', 'chipFilterEmail'].forEach(id => $(id).classList.remove('active'));
    if (type === 'all') $('chipFilterAll').classList.add('active');
    if (type === 'wa') $('chipFilterWa').classList.add('active');
    if (type === 'email') $('chipFilterEmail').classList.add('active');
    renderLeadsTable();
  }

  $('btnRefreshLeads').onclick = () => { loadLeadsFromApiAndRender(); };

  // ==========================================
  // EXPORTAÇÃO & IMPORTAÇÃO CSV, CÓPIA DE CONTATOS
  // ==========================================
  $('btnExportCSV').onclick = () => {
    if (cachedLeads.length === 0) {
      showToast({ type: 'warning', title: 'Lista Vazia', message: 'Minere alguns perfis antes de exportar.' });
      return;
    }

    const headers = ['ID', 'Username', 'Nome Completo', 'WhatsApp', 'Email', 'Seguidores', 'Stories Ativos', 'Nicho', 'Status', 'Bio', 'Link Perfil', 'Data'];
    const rows = cachedLeads.map(l => [
      `"${l.id || ''}"`,
      `"${l.username || ''}"`,
      `"${(l.full_name || '').replace(/"/g, '""')}"`,
      `"${l.whatsapp || ''}"`,
      `"${l.email || ''}"`,
      l.followers_count || 0,
      `"${l.has_active_stories ? 1 : 0}"`,
      `"${(l.niche || 'Geral').replace(/"/g, '""')}"`,
      `"${l.status || 'minerada'}"`,
      `"${(l.bio || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
      `"https://www.instagram.com/${l.username}/"`,
      `"${l.discovered_at || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_innflu_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({ type: 'success', title: 'Download Concluído', message: `${cachedLeads.length} leads exportados com sucesso!` });
  };

  function parseCSVToLeads(text) {
    if (!text || !text.trim()) return [];
    let cleanText = text.replace(/^\uFEFF/, '');
    const firstLine = cleanText.split(/\r?\n/)[0] || '';
    let delimiter = ',';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    if (semicolonCount > commaCount && semicolonCount >= tabCount) delimiter = ';';
    else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < cleanText.length) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          currentField += char;
          i++;
          continue;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
          continue;
        } else if (char === delimiter) {
          currentRow.push(currentField.trim());
          currentField = '';
          i++;
          continue;
        } else if (char === '\r') {
          if (nextChar === '\n') i++;
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          i++;
          continue;
        } else if (char === '\n') {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          i++;
          continue;
        } else {
          currentField += char;
          i++;
          continue;
        }
      }
    }
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }

    if (rows.length < 2) return [];

    const rawHeaders = rows[0].map(h => (h || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const colMap = {};
    rawHeaders.forEach((h, idx) => {
      if (/^(id|lead_id)$/i.test(h)) colMap.id = idx;
      else if (/^(username|usuario|user|influenciadora|perfil|handle|@)$/i.test(h)) colMap.username = idx;
      else if (/^(nome|nome\s*completo|full_name|name)$/i.test(h)) colMap.full_name = idx;
      else if (/^(seguidores|followers|followers_count|seguidor|seg)$/i.test(h)) colMap.followers_count = idx;
      else if (/^(whatsapp|whats|telefone|celular|phone|tel|contato)$/i.test(h)) colMap.whatsapp = idx;
      else if (/^(email|e-mail|mail)$/i.test(h)) colMap.email = idx;
      else if (/^(stories|stories\s*ativos|has_active_stories|active_stories|story)$/i.test(h)) colMap.has_active_stories = idx;
      else if (/^(nicho|niche|categoria|segmento)$/i.test(h)) colMap.niche = idx;
      else if (/^(bio|biografia|descricao|about)$/i.test(h)) colMap.bio = idx;
      else if (/^(status|situacao|estado)$/i.test(h)) colMap.status = idx;
      else if (/^(data|data\s*descoberta|discovered_at|created_at|date)$/i.test(h)) colMap.discovered_at = idx;
    });

    if (colMap.username === undefined) {
      const userIdx = rawHeaders.findIndex(h => h.includes('user') || h.includes('perfil') || h.includes('influenciador'));
      if (userIdx !== -1) colMap.username = userIdx;
      else colMap.username = 0;
    }

    const leads = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

      let username = (colMap.username !== undefined && row[colMap.username]) ? row[colMap.username] : '';
      username = username.replace(/^@/, '').trim().toLowerCase();
      if (username.includes('instagram.com/')) {
        username = username.split('instagram.com/')[1].split('/')[0].split('?')[0].trim().toLowerCase();
      }

      if (!username || username.length < 2) continue;

      let followersCount = 0;
      if (colMap.followers_count !== undefined && row[colMap.followers_count]) {
        let rawF = String(row[colMap.followers_count]).toLowerCase().trim();
        if (/(mil\b|k\b|\d+k)/i.test(rawF)) {
          followersCount = Math.round(parseFloat(rawF.replace(/[^0-9.,]/g, '').replace(',', '.')) * 1000) || 0;
        } else if (/(milh[aã]o|milh[oõ]es|mi\b|\d+m\b)/i.test(rawF)) {
          followersCount = Math.round(parseFloat(rawF.replace(/[^0-9.,]/g, '').replace(',', '.')) * 1000000) || 0;
        } else {
          let cleanNumber = rawF.trim();
          if (/^\d{1,3}(\.\d{3})+$/.test(cleanNumber)) {
            followersCount = parseInt(cleanNumber.replace(/\./g, ''), 10) || 0;
          } else if (/^\d{1,3}(,\d{3})+$/.test(cleanNumber)) {
            followersCount = parseInt(cleanNumber.replace(/,/g, ''), 10) || 0;
          } else {
            followersCount = parseInt(cleanNumber.replace(/[^0-9]/g, ''), 10) || 0;
          }
        }
      }

      let hasActiveStories = 0;
      if (colMap.has_active_stories !== undefined && row[colMap.has_active_stories]) {
        const rawStory = String(row[colMap.has_active_stories]).toLowerCase().trim();
        if (rawStory === '1' || rawStory === 'true' || rawStory === 'sim' || rawStory === 'yes' || rawStory === 's' || rawStory.includes('ativo')) {
          hasActiveStories = 1;
        }
      }

      leads.push({
        id: (colMap.id !== undefined && row[colMap.id]) ? row[colMap.id].trim() : undefined,
        username,
        full_name: (colMap.full_name !== undefined && row[colMap.full_name]) ? row[colMap.full_name].trim() : '',
        followers_count: followersCount,
        whatsapp: (colMap.whatsapp !== undefined && row[colMap.whatsapp]) ? row[colMap.whatsapp].trim() : null,
        email: (colMap.email !== undefined && row[colMap.email]) ? row[colMap.email].trim() : null,
        has_active_stories: hasActiveStories,
        niche: (colMap.niche !== undefined && row[colMap.niche]) ? row[colMap.niche].trim() : 'Geral',
        bio: (colMap.bio !== undefined && row[colMap.bio]) ? row[colMap.bio].trim() : '',
        status: (colMap.status !== undefined && row[colMap.status]) ? row[colMap.status].trim() : 'minerada',
        discovered_at: (colMap.discovered_at !== undefined && row[colMap.discovered_at]) ? row[colMap.discovered_at].trim() : new Date().toISOString()
      });
    }

    return leads;
  }

  const hudInputImportCSV = $('hudInputImportCSV');
  if ($('btnImportCSV') && hudInputImportCSV) {
    $('btnImportCSV').onclick = () => {
      hudInputImportCSV.click();
    };

    hudInputImportCSV.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const leads = parseCSVToLeads(text);

        if (!leads || leads.length === 0) {
          showToast({ type: 'warning', title: 'Arquivo Vazio ou Inválido', message: 'Nenhuma influenciadora válida com @ ou username encontrada no CSV.' });
          hudInputImportCSV.value = '';
          return;
        }

        showToast({ type: 'info', title: 'Importando...', message: `Enviando ${leads.length} influenciadoras para o CRM...` });

        const { apiBaseUrl } = await getState();
        const res = await fetch(`${apiBaseUrl}/api/leads/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads })
        });

        const data = await res.json();
        if (data.success) {
          showToast({ type: 'success', title: 'Importação Concluída', message: `🎉 ${data.imported} leads importados para o CRM com sucesso!` });
          await loadLeadsFromApiAndRender();
        } else {
          showToast({ type: 'error', title: 'Erro na Importação', message: data.error || 'Falha ao importar leads.' });
        }
      } catch (err) {
        showToast({ type: 'error', title: 'Falha no Arquivo', message: err.message });
      } finally {
        hudInputImportCSV.value = '';
      }
    };
  }

  $('btnCopyWhatsapps').onclick = () => {
    const numbers = cachedLeads.filter(l => !!l.whatsapp).map(l => l.whatsapp);
    if (numbers.length === 0) {
      showToast({ type: 'warning', title: 'Sem Telefones', message: 'Nenhum WhatsApp encontrado na lista.' });
      return;
    }
    navigator.clipboard.writeText(numbers.join('\n'));
    showToast({ type: 'success', title: 'Copiado!', message: `${numbers.length} números de WhatsApp copiados.` });
  };

  $('btnCopyEmails').onclick = () => {
    const emails = cachedLeads.filter(l => !!l.email).map(l => l.email);
    if (emails.length === 0) {
      showToast({ type: 'warning', title: 'Sem E-mails', message: 'Nenhum e-mail encontrado na lista.' });
      return;
    }
    navigator.clipboard.writeText(emails.join(', '));
    showToast({ type: 'success', title: 'Copiado!', message: `${emails.length} e-mails copiados para a área de transferência.` });
  };

  // ==========================================
  // FEED DE ATIVIDADES RECENTES
  // ==========================================
  function renderFeed(feed) {
    if (!feed || feed.length === 0) return;
    hudActivityFeed.innerHTML = '';
    feed.slice(0, 15).forEach(item => {
      const el = document.createElement('div');
      el.className = 'innflu-feed-item';
      let badges = '';
      if (item.whatsapp) badges += `<span class="innflu-badge-mini innflu-badge-wa">📱 WA</span>`;
      if (item.email) badges += `<span class="innflu-badge-mini innflu-badge-email">✉️ Email</span>`;
      el.innerHTML = `<span class="innflu-feed-user">@${item.username}</span><div class="innflu-feed-meta">${badges || `<span style="color:#94a3b8">${item.status}</span>`}</div>`;
      hudActivityFeed.appendChild(el);
    });
  }

  async function logActivity(entry) {
    const { bot } = await getState();
    const newFeed = [entry, ...(bot.activityFeed || [])].slice(0, 30);
    await saveBot({ activityFeed: newFeed });
    renderFeed(newFeed);
  }

  // ==========================================
  // HELPERS DE REDE & API
  // ==========================================
  async function check7DayRule(apiBaseUrl, username) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/check-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      return await res.json();
    } catch (e) { return { eligible: true }; }
  }

  async function saveLead(apiBaseUrl, profile, status, niche) {
    try {
      const { bot } = await getState();
      const headers = { 'Content-Type': 'application/json' };
      const token = (bot && bot.apiToken) || (await chrome.storage.local.get('apiToken'))?.apiToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-API-Key'] = token;
      }

      const leadPayload = {
        username: profile.username,
        full_name: profile.fullName || '',
        followers_count: profile.followersCount || 0,
        has_active_stories: profile.hasActiveStories ? 1 : 0,
        detected_gender: profile.isFemale ? 'female' : 'other',
        whatsapp: profile.whatsapp || null,
        email: profile.email || null,
        bio: profile.bio || '',
        niche: niche || profile.niche || 'Geral',
        status: status || 'minerada'
      };

      const res = await fetch(`${apiBaseUrl}/api/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify(leadPayload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      // Guarda no buffer offline para sincronizar quando a conexão com o D1 estiver ativa
      try {
        const stored = await chrome.storage.local.get('pendingLeadsBuffer');
        const buf = stored.pendingLeadsBuffer || [];
        buf.push({
          username: profile.username,
          full_name: profile.fullName || '',
          followers_count: profile.followersCount || 0,
          has_active_stories: profile.hasActiveStories ? 1 : 0,
          whatsapp: profile.whatsapp || null,
          email: profile.email || null,
          niche: niche || profile.niche || 'Geral',
          bio: profile.bio || '',
          status: status || 'minerada'
        });
        await chrome.storage.local.set({ pendingLeadsBuffer: buf.slice(-200) });
      } catch (err) {}
    }
  }

  /**
   * Descarrega o buffer de leads pendentes no Cloudflare D1 em lote
   */
  async function flushPendingLeadsBuffer(apiBaseUrl) {
    try {
      const stored = await chrome.storage.local.get(['pendingLeadsBuffer', 'apiToken']);
      const buf = stored.pendingLeadsBuffer || [];
      if (buf.length === 0) return;

      const headers = { 'Content-Type': 'application/json' };
      if (stored.apiToken) {
        headers['Authorization'] = `Bearer ${stored.apiToken}`;
        headers['X-API-Key'] = stored.apiToken;
      }

      const res = await fetch(`${apiBaseUrl}/api/leads/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ leads: buf })
      });

      if (res.ok) {
        await chrome.storage.local.set({ pendingLeadsBuffer: [] });
        console.log(`[Innflu] Sincronizados ${buf.length} leads pendentes no Cloudflare D1.`);
      }
    } catch (err) {}
  }

  // ==========================================
  // BOTÃO INSPECIONAR PERFIL ABERTO
  // ==========================================
  $('btnQuickInspect').onclick = async () => {
    const { bot, apiBaseUrl } = await getState();
    const currentNiche = (bot.miningTarget || 'Geral').trim();
    const profile = window.InnfluInspector.extractCurrentProfileData(currentNiche);
    if (!profile) {
      showToast({ type: 'warning', title: 'Perfil Não Detectado', message: 'Abra a página de um perfil para analisar.' });
      return;
    }
    let fDisplay = profile.followersCount >= 1000000
      ? (profile.followersCount / 1000000).toFixed(1).replace('.', ',') + ' mi'
      : (profile.followersCount >= 1000 ? (profile.followersCount / 1000).toFixed(1).replace('.', ',') + ' mil' : profile.followersCount.toString());

    showToast({
      type: 'success',
      title: `@${profile.username} (${fDisplay}) [${currentNiche}]`,
      message: `Nome: ${profile.fullName} • WA: ${profile.whatsapp || 'Não'} • Email: ${profile.email || 'Não'}`
    });

    // Salva automaticamente o perfil inspecionado no D1 e no cache local
    await saveLead(apiBaseUrl, profile, 'minerada', currentNiche);
    await cacheLocalLead(profile, 'minerada', currentNiche);
    renderLeadsTable();
  };

  // ==========================================
  // COMUNICAÇÃO COM O SERVICE WORKER (BACKGROUND)
  // ==========================================
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'UPDATE_HUD' && request.data) {
        handleBackgroundUpdate(request.data);
      } else if (request.action === 'EXECUTE_CURRENT_PROFILE_DM') {
        handleExecuteDMFromBackground(sendResponse);
        return true; // resposta assíncrona
      }
    });
  }

  function handleBackgroundUpdate(data) {
    if (data.dailyCount !== undefined && data.dailyLimit !== undefined) {
      hudSentTodayCount.innerText = `${data.dailyCount} / ${data.dailyLimit}`;
    }
    if (data.status) {
      hudCurrentAction.innerText = data.status;
    }
    if (data.actionBlocked) {
      showSafetyBanner('Pausa Preventiva Anti-Ban', data.status);
      showToast({ type: 'error', title: 'Aviso Anti-Ban', message: data.status, duration: 8000 });
      saveBot({ isRunning: false, isPaused: false, actionBlocked: true });
      if (localBotCache) syncUI({ ...localBotCache, isRunning: false, actionBlocked: true });
    }
    if (data.countdownSeconds) {
      const targetTs = Date.now() + data.countdownSeconds * 1000;
      startCountdown(targetTs, () => {}, data.countdownSeconds * 1000);
    }
  }

  async function handleExecuteDMFromBackground(sendResponse) {
    try {
      const preCheck = window.InnfluSender.checkActionBlock();
      if (preCheck.blocked) {
        showSafetyBanner('Alerta do Instagram', preCheck.message);
        sendResponse({ blocked: true, message: preCheck.message });
        return;
      }

      const profile = window.InnfluInspector.extractCurrentProfileData();
      const username = profile ? profile.username : window.InnfluCrawler.getCurrentProfileUsername();
      const { activeTemplate } = await getState();
      const influencerName = profile && profile.fullName ? profile.fullName.split(' ')[0] : (username || 'influenciadora');
      const msg = window.InnfluSpintax.interpolate(activeTemplate, { username, nome: influencerName });

      hudCurrentAction.innerText = `Digitando DM para @${username}...`;
      await window.InnfluSender.sendDirectMessage(msg);

      sendResponse({ success: true, username, messageText: msg });
    } catch (err) {
      const isBlocked = err.message && (err.message.includes('bloque') || err.message.includes('blocked'));
      if (isBlocked) {
        showSafetyBanner('Bloqueio Detectado', err.message);
      }
      sendResponse({ blocked: isBlocked, message: err.message });
    }
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  getState().then(({ bot, apiBaseUrl, activeTemplate, savedLeads }) => {
    if (activeTemplate) hudTemplateContent.value = activeTemplate;
    if (savedLeads && savedLeads.length > 0) {
      cachedLeads = savedLeads;
      updateLeadsCountHeader(savedLeads);
    }
    syncUI(bot);
    flushPendingLeadsBuffer(apiBaseUrl);

    if (bot.isRunning) {
      console.log('[Innflu] Retomando operação automática após recarregamento...');
      setTimeout(runLoop, 2500);
    }
  });

})();
