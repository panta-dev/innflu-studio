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
          <span class="innflu-status-badge" id="hudGlobalBadge">
            <span class="innflu-status-pulse"></span>
            <span id="hudStatusBadgeText">Parado</span>
          </span>
          <button class="innflu-btn-icon" id="btnMinimize" title="Minimizar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
          </button>
        </div>
      </div>

      <!-- Toasts Notificações Internas -->
      <div class="innflu-toast-container" id="hudToastContainer"></div>

      <!-- Navegação de Abas -->
      <div class="innflu-nav-tabs">
        <button class="innflu-nav-btn active" id="tabBtnMine">⛏️ Minerar</button>
        <button class="innflu-nav-btn" id="tabBtnLeads">📋 Leads (<span id="tabLeadsCount">0</span>)</button>
        <button class="innflu-nav-btn" id="tabBtnSender">✉️ Captação</button>
        <button class="innflu-nav-btn" id="tabBtnLive">🎯 Ao Vivo</button>
      </div>

      <!-- Corpo do HUD -->
      <div class="innflu-hud-body">
        
        <!-- ==========================================
             ABA 1: PAINEL DE MINERAÇÃO (ONDE ESCOLHE COMO MINERAR)
             ========================================== -->
        <div id="viewMine" class="innflu-tab-content">
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
                <option value="5000">5.000+ seguidores</option>
                <option value="10000" selected>10.000+ (Recomendado)</option>
                <option value="25000">25.000+ seguidores</option>
                <option value="50000">50.000+ seguidores</option>
              </select>
            </div>
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Filtro de Contato:</label>
              <select class="innflu-select" id="selRequireContact">
                <option value="all" selected>Todos os perfis</option>
                <option value="any_contact">Apenas com WA ou Email</option>
                <option value="wa_only">Apenas com WhatsApp</option>
                <option value="email_only">Apenas com E-mail</option>
              </select>
            </div>
          </div>

          <div style="margin-top:10px;">
            <button class="innflu-cta-btn start" id="btnToggleMining">
              <span>🚀</span>
              <span id="btnMiningLabel">Iniciar Mineração</span>
            </button>
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
            <button class="innflu-cta-btn start" id="btnToggleSender" style="background:linear-gradient(135deg, #ec4899, #8b5cf6);">
              <span>✉️</span>
              <span id="btnSenderLabel">Iniciar Envio de DMs (Captação)</span>
            </button>
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

  // Controles de Mineração
  const inputMiningTarget = $('inputMiningTarget');
  const lblMiningTarget = $('lblMiningTarget');
  const selMinFollowers = $('selMinFollowers');
  const selRequireContact = $('selRequireContact');
  const btnToggleMining = $('btnToggleMining');
  const btnMiningLabel = $('btnMiningLabel');
  const btnToggleSender = $('btnToggleSender');
  const btnSenderLabel = $('btnSenderLabel');

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

  // ==========================================
  // NOTIFICAÇÕES (TOASTS INTERNOS)
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

  // ==========================================
  // STORAGE PERSISTENTE (COM PROTEÇÃO ANTI-INVALIDATED CONTEXT)
  // ==========================================
  function isExtensionContextValid() {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }

  async function getState() {
    return new Promise(resolve => {
      const fallback = {
        bot: {
          isRunning: false,
          activeMode: null,
          miningSource: 'similar',
          miningTarget: 'marialuizazamoner',
          minFollowers: 10000,
          requireContact: 'all',
          queue: [],
          visited: [],
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
        resolve(fallback);
        return;
      }

      try {
        chrome.storage.local.get(['innfluBot', 'apiBaseUrl', 'activeTemplate', 'savedLeadsCache'], res => {
          if (chrome.runtime.lastError) {
            resolve(fallback);
            return;
          }
          resolve({
            bot: res?.innfluBot || fallback.bot,
            apiBaseUrl: res?.apiBaseUrl || fallback.apiBaseUrl,
            activeTemplate: res?.activeTemplate || fallback.activeTemplate,
            savedLeads: res?.savedLeadsCache || []
          });
        });
      } catch (err) {
        resolve(fallback);
      }
    });
  }

  async function saveBot(partial) {
    if (!isExtensionContextValid()) return;
    const { bot } = await getState();
    const updated = { ...bot, ...partial };
    return new Promise(resolve => {
      try {
        chrome.storage.local.set({ innfluBot: updated }, () => resolve(updated));
      } catch (e) {
        resolve(updated);
      }
    });
  }

  // ==========================================
  // SINCRONIZAÇÃO DE UI
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
    if (bot.minFollowers !== undefined) {
      selMinFollowers.value = bot.minFollowers.toString();
    }
    if (bot.requireContact) {
      selRequireContact.value = bot.requireContact;
    }

    // Seleciona botão de fonte ativo
    selectSourceUI(bot.miningSource || 'similar');

    // Botões de execução
    if (bot.isRunning && bot.activeMode === 'miner') {
      btnToggleMining.classList.remove('start');
      btnToggleMining.classList.add('stop');
      btnMiningLabel.innerText = '⏹ Parar Mineração';
      hudStatusBadgeText.innerText = 'Minerando...';
      hudLiveStatusText.innerText = 'Mineração em andamento';
    } else {
      btnToggleMining.classList.remove('stop');
      btnToggleMining.classList.add('start');
      btnMiningLabel.innerText = '🚀 Iniciar Mineração';
    }

    if (bot.isRunning && bot.activeMode === 'sender') {
      btnToggleSender.classList.remove('start');
      btnToggleSender.classList.add('stop');
      btnSenderLabel.innerText = '⏹ Parar Captação';
      hudStatusBadgeText.innerText = 'Captando...';
      hudLiveStatusText.innerText = 'Enviando DMs';
    } else {
      btnToggleSender.classList.remove('stop');
      btnToggleSender.classList.add('start');
      btnSenderLabel.innerText = '✉️ Iniciar Envio de DMs';
    }

    if (!bot.isRunning) {
      hudStatusBadgeText.innerText = 'Parado';
      hudLiveStatusText.innerText = 'Parado';
      hudCountdown.innerText = '';
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

  selRequireContact.addEventListener('change', () => {
    saveBot({ requireContact: selRequireContact.value });
  });

  // ==========================================
  // NAVEGAÇÃO ENTRE ABAS
  // ==========================================
  const tabs = {
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
  function onDrag(e) { if (!isDragging) return; root.style.left = `${initX + e.clientX - startX}px`; root.style.top = `${initY + e.clientY - startY}px`; root.style.bottom = 'auto'; root.style.right = 'auto'; }
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
  // BOTÕES PRINCIPAIS DE EXECUÇÃO
  // ==========================================
  btnToggleMining.onclick = async () => {
    const { bot } = await getState();
    if (bot.isRunning && bot.activeMode === 'miner') {
      await saveBot({ isRunning: false, activeMode: null, nextActionAt: 0 });
      clearInterval(countdownInterval);
      syncUI({ ...bot, isRunning: false, activeMode: null });
      showToast({ type: 'info', title: 'Mineração Pausada', message: 'Operação interrompida.' });
      return;
    }

    const rawInput = (inputMiningTarget.value || '').trim();
    let currentSource = bot.miningSource || 'keyword';

    // Auto-detecção inteligente de prefixos sem sobrescrever a escolha deliberada do usuário
    if (rawInput.startsWith('@')) {
      currentSource = 'similar';
      selectSourceUI('similar');
    } else if (rawInput.startsWith('#')) {
      currentSource = 'hashtag';
      selectSourceUI('hashtag');
    }

    const targetClean = rawInput.replace(/^[@#]/, '').trim().toLowerCase();

    if (!targetClean) {
      showToast({ type: 'error', title: 'Alvo Vazio', message: 'Digite uma palavra-chave, hashtag ou perfil de referência.' });
      return;
    }

    // Ao iniciar uma nova mineração, SEMPRE limpa a fila antiga para não navegar para resquícios anteriores
    await saveBot({
      isRunning: true,
      activeMode: 'miner',
      miningSource: currentSource,
      miningTarget: targetClean,
      keyword: targetClean,
      queue: [],
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

  btnToggleSender.onclick = async () => {
    const { bot } = await getState();
    if (bot.isRunning && bot.activeMode === 'sender') {
      await saveBot({ isRunning: false, activeMode: null, nextActionAt: 0 });
      clearInterval(countdownInterval);
      syncUI({ ...bot, isRunning: false, activeMode: null });
      showToast({ type: 'info', title: 'Captação Pausada', message: 'Envio interrompido.' });
      return;
    }

    await saveBot({ isRunning: true, activeMode: 'sender', nextActionAt: 0 });
    const updated = await getState();
    syncUI(updated.bot);
    showToast({ type: 'success', title: 'Captação Iniciada', message: 'Enviando DMs com delays seguros anti-ban.' });
    runLoop();
  };

  // ==========================================
  // MOTOR DE AUTOMAÇÃO E MINERAÇÃO
  // ==========================================
  async function runLoop() {
    const { bot, apiBaseUrl, activeTemplate } = await getState();
    if (!bot.isRunning) return;

    if (bot.nextActionAt && bot.nextActionAt > Date.now()) {
      startCountdown(bot.nextActionAt, runLoop);
      return;
    }

    const pageType = window.InnfluCrawler.detectCurrentPage();
    hudPageType.innerText = `Página: ${pageType} • Fila: ${(bot.queue || []).length} perfis`;

    if (bot.activeMode === 'miner') {
      await stepMiner(bot, apiBaseUrl, pageType);
    } else if (bot.activeMode === 'sender') {
      await stepSender(bot, apiBaseUrl, activeTemplate, pageType);
    }
  }

  function startCountdown(targetTs, callback) {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      const rem = targetTs - Date.now();
      if (rem <= 0) { clearInterval(countdownInterval); hudCountdown.innerText = ''; callback(); return; }
      const s = Math.ceil(rem / 1000);
      hudCountdown.innerText = `⏳ ${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    }, 1000);
  }

  // ==========================================
  // PASSO DE MINERAÇÃO (MULTI-FONTE)
  // ==========================================
  async function stepMiner(bot, apiBaseUrl, pageType) {
    const source = bot.miningSource || 'keyword';
    const target = bot.miningTarget || 'maternidade';

    // 1. Se tem gente na fila de perfis descobertos, visita e extrai dados
    if (bot.queue.length > 0) {
      const next = bot.queue[0];
      const rest = bot.queue.slice(1);
      const visited = [...(bot.visited || []), next].slice(-300);
      await saveBot({ queue: rest, visited });
      hudQueueCount.innerText = rest.length;

      if (pageType === 'profile' && window.InnfluCrawler.getCurrentProfileUsername() === next) {
        // Já estamos no perfil certo -> extrai contatos completos
        await analyzeAndMineProfile(bot, apiBaseUrl);

        // Se a fonte for 'similar' e a fila estiver ficando curta, descobre semelhantes desta influenciadora também!
        if (source === 'similar' && rest.length < 5) {
          hudCurrentAction.innerText = `Descobrindo mais semelhantes a partir de @${next}...`;
          const moreSimilar = await window.InnfluCrawler.extractSimilarAccounts();
          const visitedNow = [...visited, next];
          const fresh = moreSimilar.filter(u => !visitedNow.includes(u) && !rest.includes(u));
          if (fresh.length > 0) {
            const updatedQueue = [...rest, ...fresh.slice(0, 30)];
            await saveBot({ queue: updatedQueue });
            hudQueueCount.innerText = updatedQueue.length;
          }
        }

        scheduleNext(window.InnfluCrawler.randomDelay(2500, 4500));
      } else {
        hudCurrentAction.innerText = `Abrindo @${next}...`;
        window.InnfluCrawler.openProfile(next);
      }
      return;
    }

    // 2. Se a fonte for "✨ Semelhantes a @" ou "👥 Seguindo de @" e NÃO estamos no perfil alvo, navega até ele primeiro!
    const targetUser = (target || '').replace(/^@/, '').toLowerCase().trim();
    const currentProfileUser = window.InnfluCrawler.getCurrentProfileUsername();

    if ((source === 'similar' || source === 'following' || source === 'followers') && targetUser && currentProfileUser !== targetUser) {
      hudCurrentAction.innerText = `Navegando até o perfil alvo @${targetUser}...`;
      window.InnfluCrawler.openProfile(targetUser);
      return;
    }

    // 3. Se estamos num perfil sem fila: analisa e extrai fontes (semelhantes, quem está seguindo ou volta para busca)
    if (pageType === 'profile') {
      // Primeiro, extrai os dados do perfil atual (WhatsApp, email, seguidores) e salva
      await analyzeAndMineProfile(bot, apiBaseUrl);

      // CASO A: Fonte é "✨ Semelhantes a @"
      if (source === 'similar') {
        hudCurrentAction.innerText = `Buscando perfis semelhantes a @${currentProfileUser}...`;
        const similarAccounts = await window.InnfluCrawler.extractSimilarAccounts();
        const visited = bot.visited || [];
        const newCandidates = similarAccounts.filter(u => !visited.includes(u) && u !== currentProfileUser);

        if (newCandidates.length > 0) {
          await saveBot({ queue: newCandidates.slice(0, 50) });
          hudQueueCount.innerText = Math.min(newCandidates.length, 50);
          showToast({
            type: 'success',
            title: `${newCandidates.length} Semelhantes Encontradas!`,
            message: newCandidates.slice(0, 3).map(u => `@${u}`).join(', ') + '...'
          });
          scheduleNext(2500);
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

      // CASO B: Fonte é "👥 Seguindo de @" (quem ela segue - parceiras/influenciadoras)
      if ((source === 'following' || source === 'followers') && currentProfileUser === targetUser) {
        hudCurrentAction.innerText = `Extraindo quem @${currentProfileUser} está seguindo...`;
        const modalCandidates = source === 'following' 
          ? await window.InnfluCrawler.extractFollowingFromModal(5)
          : await window.InnfluCrawler.extractFollowersFromModal(5);
        const visited = bot.visited || [];
        const newCandidates = modalCandidates.filter(u => !visited.includes(u));
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
            type: 'info',
            title: 'Nenhum perfil extraído',
            message: `Não foi possível extrair a lista de seguindo de @${currentProfileUser}.`
          });
          scheduleNext(4000);
          return;
        }
      }

      // CASO C: Outras fontes (keyword/hashtag) -> volta para a página de busca/hashtag
      hudCurrentAction.innerText = `Voltando para busca (${target})...`;
      await window.InnfluCrawler.sleep(1500);
      window.InnfluCrawler.navigateToSource(source, target);
      return;
    }

    // 3. Se estamos na página de busca / explore / hashtag
    if (pageType === 'search') {
      hudCurrentAction.innerText = `Varrendo influenciadoras de "${target}"...`;
      await window.InnfluCrawler.sleep(2000);

      const visited = bot.visited || [];
      const candidateSet = new Set();

      // Estratégia A: Sugestões de contas no dropdown/painel de busca
      if (window.InnfluCrawler.extractFromSearchDropdown) {
        const fromDropdown = window.InnfluCrawler.extractFromSearchDropdown();
        fromDropdown.forEach(u => candidateSet.add(u));
      }

      // Estratégia B: Usernames via Alt-text e links contextuais da página
      const fromPage = window.InnfluCrawler.extractUsernamesFromPage();
      fromPage.forEach(u => candidateSet.add(u));

      // Estratégia C (Principal): Clicar nas publicações/reels para extrair autor de cada vídeo
      hudCurrentAction.innerText = `Inspecionando vídeos/posts para extrair criadores de "${target}"...`;
      const fromPosts = await window.InnfluCrawler.clickPostsAndExtractAuthors(5);
      fromPosts.forEach(u => candidateSet.add(u));

      let newCandidates = Array.from(candidateSet).filter(u => !visited.includes(u));

      // Se ainda nenhum candidato, rola e tenta mais uma vez
      if (newCandidates.length === 0) {
        hudCurrentAction.innerText = 'Rolando feed para carregar mais publicações...';
        await window.InnfluCrawler.scrollDown();
        await window.InnfluCrawler.sleep(1800);
        const fromPostsRetry = await window.InnfluCrawler.clickPostsAndExtractAuthors(4);
        fromPostsRetry.forEach(u => candidateSet.add(u));
        newCandidates = Array.from(candidateSet).filter(u => !visited.includes(u));
      }

      if (newCandidates.length > 0) {
        await saveBot({ queue: newCandidates.slice(0, 50) });
        hudQueueCount.innerText = Math.min(newCandidates.length, 50);
        showToast({
          type: 'success',
          title: `${newCandidates.length} Influenciadoras Encontradas!`,
          message: newCandidates.slice(0, 4).map(u => `@${u}`).join(', ') + '...'
        });
        scheduleNext(1500);
      } else {
        hudCurrentAction.innerText = 'Nenhum novo criador encontrado nesta rolagem. Rolando mais...';
        await window.InnfluCrawler.scrollDown();
        scheduleNext(3500);
      }
      return;
    }

    // Se estamos diretamente num post individual/reel
    if (pageType === 'post') {
      hudCurrentAction.innerText = 'Extraindo criador do post/vídeo...';
      const fromPosts = await window.InnfluCrawler.clickPostsAndExtractAuthors(1);
      if (fromPosts.length > 0) {
        const visited = bot.visited || [];
        const fresh = fromPosts.filter(u => !visited.includes(u));
        if (fresh.length > 0) {
          await saveBot({ queue: [...(bot.queue || []), ...fresh] });
        }
      }
      window.history.back();
      scheduleNext(2000);
      return;
    }

    // 4. Qualquer outra página: vai para a fonte escolhida
    hudCurrentAction.innerText = `Navegando para ${source}: "${target}"...`;
    window.InnfluCrawler.navigateToSource(source, target);
  }

  // ==========================================
  // ANÁLISE E EXTRAÇÃO COMPLETA DE CONTATOS
  // ==========================================
  async function analyzeAndMineProfile(bot, apiBaseUrl) {
    const profile = window.InnfluInspector.extractCurrentProfileData();
    if (!profile) {
      hudCurrentAction.innerText = 'Não foi possível ler este perfil.';
      return;
    }

    const minFollowersRequired = bot.minFollowers !== undefined ? bot.minFollowers : 10000;
    const requireContactFilter = bot.requireContact || 'all';
    const currentNiche = (bot.miningTarget || 'Geral').trim();

    let fDisplay = '?';
    if (profile.followersCount > 0) {
      fDisplay = profile.followersCount >= 1000000
        ? (profile.followersCount / 1000000).toFixed(1).replace('.', ',') + ' mi'
        : profile.followersCount >= 1000
          ? (profile.followersCount / 1000).toFixed(1).replace('.', ',') + ' mil'
          : profile.followersCount.toString();
    }

    hudCurrentAction.innerText = `Avaliando @${profile.username} (${fDisplay} seg.)...`;

    // Checagem de filtros de qualificação
    let isApproved = true;
    let rejectReason = '';

    if (profile.followersCount > 0 && profile.followersCount < minFollowersRequired) {
      isApproved = false;
      rejectReason = `${fDisplay} seg. (< ${minFollowersRequired.toLocaleString('pt-BR')} mín.)`;
    }

    if (requireContactFilter === 'any_contact' && !profile.whatsapp && !profile.email) {
      isApproved = false;
      rejectReason = 'Sem WhatsApp nem E-mail';
    } else if (requireContactFilter === 'wa_only' && !profile.whatsapp) {
      isApproved = false;
      rejectReason = 'Sem WhatsApp';
    } else if (requireContactFilter === 'email_only' && !profile.email) {
      isApproved = false;
      rejectReason = 'Sem E-mail';
    }

    if (isApproved) {
      const statusText = 'minerada';
      // 1. Salva no Cloudflare D1 com Nicho
      await saveLead(apiBaseUrl, profile, statusText, currentNiche);

      // 2. Salva no cache local com Nicho
      await cacheLocalLead(profile, statusText, currentNiche);

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
        message: `${fDisplay} seg. • ${profile.whatsapp ? '📱 ' + profile.whatsapp : ''} ${profile.email ? '✉️ ' + profile.email : (!profile.whatsapp ? 'Sem telefone direto' : '')}`
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
      const msg = window.InnfluSpintax.interpolate(template, { username, nome: username });
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
  // EXPORTAÇÃO CSV & CÓPIA DE CONTATOS
  // ==========================================
  $('btnExportCSV').onclick = () => {
    if (cachedLeads.length === 0) {
      showToast({ type: 'warning', title: 'Lista Vazia', message: 'Minere alguns perfis antes de exportar.' });
      return;
    }

    const headers = ['Username', 'Nome Completo', 'WhatsApp', 'Email', 'Seguidores', 'Status', 'Bio', 'Link Perfil', 'Data'];
    const rows = cachedLeads.map(l => [
      `"${l.username || ''}"`,
      `"${(l.full_name || '').replace(/"/g, '""')}"`,
      `"${l.whatsapp || ''}"`,
      `"${l.email || ''}"`,
      l.followers_count || 0,
      `"${l.status || 'minerada'}"`,
      `"${(l.bio || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
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
      if (bot && bot.apiToken) {
        headers['Authorization'] = `Bearer ${bot.apiToken}`;
        headers['X-API-Key'] = bot.apiToken;
      }
      await fetch(`${apiBaseUrl}/api/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: profile.username,
          full_name: profile.fullName,
          followers_count: profile.followersCount,
          has_active_stories: profile.hasActiveStories,
          detected_gender: profile.isFemale ? 'female' : 'other',
          whatsapp: profile.whatsapp,
          email: profile.email,
          bio: profile.bio,
          niche: niche || profile.niche || 'Geral',
          status
        })
      });
    } catch (e) {}
  }

  // ==========================================
  // BOTÃO INSPECIONAR PERFIL ABERTO
  // ==========================================
  $('btnQuickInspect').onclick = async () => {
    const profile = window.InnfluInspector.extractCurrentProfileData();
    if (!profile) {
      showToast({ type: 'warning', title: 'Perfil Não Detectado', message: 'Abra a página de um perfil para analisar.' });
      return;
    }
    const { bot, apiBaseUrl } = await getState();
    const currentNiche = (bot.miningTarget || 'Geral').trim();
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
  // INICIALIZAÇÃO
  // ==========================================
  getState().then(({ bot, activeTemplate, savedLeads }) => {
    if (activeTemplate) hudTemplateContent.value = activeTemplate;
    if (savedLeads && savedLeads.length > 0) {
      cachedLeads = savedLeads;
      updateLeadsCountHeader(savedLeads);
    }
    syncUI(bot);

    if (bot.isRunning) {
      console.log('[Innflu] Retomando operação automática após recarregamento...');
      setTimeout(runLoop, 2500);
    }
  });

})();
