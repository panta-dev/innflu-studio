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
      <!-- Alça de Redimensionamento Superior (Puxar pra cima / baixo) -->
      <div class="innflu-resize-handle-top" id="hudResizeHandleTop" title="Arraste para cima ou para baixo para aumentar/diminuir o tamanho"></div>

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
          <button class="innflu-btn-icon" id="btnHeaderBugReport" title="Relatório de Diagnóstico & Logs (Bug Report)" style="font-size:12px;padding:2px 4px;">
            🐛
          </button>
          <button class="innflu-btn-icon" id="btnHeaderPauseResume" title="Pausar / Retomar Operação" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="iconHeaderPause"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="iconHeaderResume" style="display:none;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="innflu-btn-icon" id="btnMinimize" title="Minimizar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
          </button>
        </div>
      </div>

      <!-- Faixa de Usuário Conectado -->
      <div class="innflu-auth-strip" id="hudAuthStrip" style="display:none;">
        <div class="innflu-auth-user-info">
          <span class="innflu-auth-avatar" id="hudAuthAvatar">U</span>
          <span class="innflu-auth-name" id="hudAuthEmail">Carregando...</span>
          <span class="innflu-plan-badge" id="hudAuthPlan">PRO</span>
          <span class="innflu-sync-dot" title="Sincronizado com Nuvem Cloudflare D1">🟢</span>
        </div>
        <button class="innflu-btn-logout" id="btnHudLogout" title="Sair da Conta">Sair</button>
      </div>

      <!-- Modal de Login Obrigatório na Extensão (Trava o robô até o usuário autenticar) -->
      <div class="innflu-login-overlay" id="hudLoginOverlay" style="display:none;">
        <div class="innflu-login-card">
          <div class="innflu-login-brand">
            <div class="innflu-logo-badge" style="width:30px;height:30px;font-size:15px;">I</div>
            <div class="innflu-login-title-group">
              <span class="innflu-brand-text" style="font-size:14px;">Innflu Studio</span>
              <span class="innflu-login-badge-sub">Login Obrigatório</span>
            </div>
          </div>
          
          <p class="innflu-login-desc">
            Entre com sua conta do Innflu Studio para sincronizar influenciadoras, disparos e automações diretamente com seu Painel Web.
          </p>

          <form id="hudLoginForm" class="innflu-login-form" onsubmit="return false;">
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">E-mail:</label>
              <input type="email" class="innflu-input" id="inputHudLoginEmail" placeholder="seu@email.com" autocomplete="email" style="font-size:11px;padding:6px 8px;" required />
            </div>

            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Senha:</label>
              <input type="password" class="innflu-input" id="inputHudLoginPassword" placeholder="Sua senha secreta" autocomplete="current-password" style="font-size:11px;padding:6px 8px;" required />
            </div>

            <div id="hudLoginFeedback" class="innflu-login-feedback" style="display:none;"></div>

            <button type="submit" class="innflu-cta-btn start" id="btnHudLoginSubmit" style="margin-top:4px;padding:7px 10px;font-size:11.5px;width:100%;">
              <span id="btnHudLoginLabel">⚡ Entrar na Conta</span>
            </button>
          </form>

          <div class="innflu-login-footer">
            <a href="https://innflu-studio.pages.dev/login.html" target="_blank" class="innflu-login-link">
              Criar conta ou redefinir senha ↗
            </a>
          </div>
        </div>
      </div>

      <!-- Modal de Assinatura & Monetização Obrigatória (Trava se o usuário não pagou) -->
      <div class="innflu-login-overlay" id="hudSubscriptionOverlay" style="display:none;z-index:99999;">
        <div class="innflu-login-card" style="border: 1px solid rgba(168,85,247,0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.2);">
          <div class="innflu-login-brand">
            <div class="innflu-logo-badge" style="width:30px;height:30px;font-size:15px;background:linear-gradient(135deg,#a855f7,#ec4899);">👑</div>
            <div class="innflu-login-title-group">
              <span class="innflu-brand-text" style="font-size:14px;">Innflu Studio</span>
              <span class="innflu-login-badge-sub" id="subOverlayBadge" style="background:rgba(239,68,68,0.2);color:#fca5a5;border-color:rgba(239,68,68,0.3);">Assinatura Necessária</span>
            </div>
          </div>
          
          <h4 id="subOverlayTitle" style="color:#ffffff;font-size:13px;font-weight:700;margin:6px 0 2px;">Acesso Bloqueado</h4>
          <p class="innflu-login-desc" id="subOverlayDesc" style="margin-bottom:12px;">
            Seu período de avaliação gratuita terminou ou sua assinatura não está ativa. Para continuar prospectando influenciadoras e enviando mensagens, assine um plano.
          </p>

          <a href="https://innflu-studio.pages.dev/dashboard/" target="_blank" class="innflu-cta-btn start" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;font-size:11.5px;width:100%;margin-top:2px;">
            <span>⚡ Escolher Plano & Assinar</span>
          </a>

          <div class="innflu-login-footer" style="margin-top:10px;">
            <button type="button" id="btnRefreshSubStatus" class="innflu-login-link" style="background:none;border:none;cursor:pointer;padding:0;">
              Já assinei? Atualizar status ↻
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de Diagnóstico & Logs em Tempo Real (Bug Report 🐛) -->
      <div class="innflu-diag-overlay" id="hudDiagnosticsModal" style="display:none;">
        <div class="innflu-diag-header">
          <div class="innflu-diag-title">
            <span>🐛 Relatório de Diagnóstico do Robô</span>
          </div>
          <button class="innflu-btn-icon" id="btnCloseDiagnostics" title="Fechar Relatório">&times;</button>
        </div>
        <div class="innflu-diag-body">
          <div class="innflu-diag-metrics">
            <div class="innflu-diag-metrics-item">Versão: <strong id="diagMetricVersion">v1.4.4</strong></div>
            <div class="innflu-diag-metrics-item">Página: <strong id="diagMetricPage">profile</strong></div>
            <div class="innflu-diag-metrics-item">Status: <strong id="diagMetricStatus">Parado</strong></div>
            <div class="innflu-diag-metrics-item">Alvo: <strong id="diagMetricTarget">provador</strong></div>
            <div class="innflu-diag-metrics-item">Na Fila: <strong id="diagMetricQueue">0</strong></div>
            <div class="innflu-diag-metrics-item">Visitadas: <strong id="diagMetricVisited">0</strong></div>
          </div>
          <div style="font-size:9.5px;font-weight:600;color:#8b949e;display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
            <span>Eventos em Tempo Real:</span>
            <span id="diagMetricLogCount" style="color:#58a6ff;">0 eventos</span>
          </div>
          <div class="innflu-diag-logs-container" id="hudDiagLogsContainer">
            <div class="innflu-diag-log-row info">Nenhum evento registrado ainda.</div>
          </div>
        </div>
        <div class="innflu-diag-footer">
          <button class="innflu-btn-copy-diag" id="btnCopyDiagnostics">
            📋 Copiar Relatório Completo
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

      <!-- Banner de Atualização OTA (Aparece automaticamente se houver versão nova) -->
      <div class="innflu-ota-banner" id="hudOtaBanner" style="display:none;">
        <div class="innflu-ota-content">
          <div class="innflu-ota-title">
            <span>🚀 Nova Atualização Disponível (<span id="hudOtaVersion">1.4.4</span>)</span>
          </div>
          <div class="innflu-ota-desc" id="hudOtaNotes">Novas regras e melhorias anti-ban disponíveis.</div>
        </div>
        <div class="innflu-ota-actions">
          <button id="btnReloadOta" class="innflu-ota-btn reload" style="background: linear-gradient(135deg, #a855f7, #ec4899); color:#fff; font-weight:700; border:none; padding: 4px 10px; cursor: pointer; border-radius: 6px;" title="Aplicar atualização instantaneamente">⚡ Atualizar Agora</button>
        </div>
      </div>

      <!-- Navegação de Abas (3 Abas Principais) -->
      <div class="innflu-nav-tabs">
        <button class="innflu-nav-btn active" id="tabBtnAuto">Automação</button>
        <button class="innflu-nav-btn" id="tabBtnMine">Mineração</button>
        <button class="innflu-nav-btn" id="tabBtnSender">Captação</button>
      </div>

      <!-- Corpo do HUD -->
      <div class="innflu-hud-body">
        
        <!-- ==========================================
             ABA 1: AUTOMAÇÃO (MINERA -> QUALIFICA -> DM -> REPETE)
             ========================================== -->
        <div id="viewAuto" class="innflu-tab-content">
          <div class="innflu-section-title">1. Onde Minerar</div>
          <div class="innflu-sources-grid">
            <button class="innflu-source-btn active" data-source="similar" id="srcBtnAutoSimilar" title="Semelhantes a @ (Recomendadas)">
              <span class="innflu-source-name">Semelhantes</span>
            </button>
            <button class="innflu-source-btn" data-source="keyword" id="srcBtnAutoKeyword" title="Palavra-chave (Busca geral)">
              <span class="innflu-source-name">Palavra</span>
            </button>
            <button class="innflu-source-btn" data-source="hashtag" id="srcBtnAutoHashtag" title="Hashtag (#)">
              <span class="innflu-source-name">Hashtag</span>
            </button>
            <button class="innflu-source-btn" data-source="following" id="srcBtnAutoFollowing" title="Seguindo de @">
              <span class="innflu-source-name">Seguindo</span>
            </button>
          </div>

          <div class="innflu-form-group" style="margin-bottom:4px;">
            <label class="innflu-form-label" id="lblAutoTarget" style="margin-bottom:2px;">Alvo ou Nicho:</label>
            <input type="text" class="innflu-input" id="inputAutoTarget" placeholder="ex: @perfil, moda, provador, beleza" value="" style="padding:5px 8px;font-size:11px;" />
          </div>

          <!-- Filtros de Qualificação (Acordeão Compacto) -->
          <div class="innflu-section-title" id="btnToggleAutoFilters" style="cursor:pointer;margin-top:2px;" title="Clique para abrir/fechar filtros">
            <span>2. Filtros de Qualificação</span>
            <span id="lblToggleAutoFilters" style="font-size:9.5px;color:#58a6ff;font-weight:600;">⚙️ Configurar ▾</span>
          </div>

          <div id="barAutoFiltersSummary" style="font-size:9.5px;color:#8b949e;cursor:pointer;margin-bottom:4px;background:#161b22;padding:4px 6px;border-radius:4px;border:1px solid #30363d;display:flex;justify-content:space-between;align-items:center;">
            <span id="txtAutoFiltersSummary">10k+ seg • Apenas c/ Stories • Feminino</span>
            <span style="color:#58a6ff;font-size:9px;">Editar</span>
          </div>

          <div id="boxAutoFilters" style="display:none;background:#161b22;padding:6px;border-radius:6px;border:1px solid #30363d;margin-bottom:6px;">
            <div class="innflu-filters-row">
              <div class="innflu-form-group" style="margin-bottom:0;">
                <label class="innflu-form-label">Mín. Seguidores:</label>
                <select class="innflu-select" id="selAutoMinFollowers">
                  <option value="0">Qualquer tamanho</option>
                  <option value="1000">1.000+ seg.</option>
                  <option value="2000">2.000+ seg.</option>
                  <option value="3000">3.000+ seg.</option>
                  <option value="5000">5.000+ seg.</option>
                  <option value="10000" selected>10.000+ seg.</option>
                  <option value="20000">20.000+ seg.</option>
                  <option value="50000">50.000+ seg.</option>
                  <option value="100000">100.000+ seg.</option>
                </select>
              </div>
              <div class="innflu-form-group" style="margin-bottom:0;">
                <label class="innflu-form-label">Stories Ativos (24h):</label>
                <select class="innflu-select" id="selAutoStories">
                  <option value="true" selected>Apenas com Stories</option>
                  <option value="false">Todos os perfis</option>
                </select>
              </div>
            </div>
            <div class="innflu-filters-row" style="margin-top:4px;">
              <div class="innflu-form-group" style="margin-bottom:0;">
                <label class="innflu-form-label">Filtro de Contato:</label>
                <select class="innflu-select" id="selAutoContact">
                  <option value="all" selected>Todos os contatos</option>
                  <option value="any_contact">WhatsApp ou E-mail</option>
                  <option value="wa_only">Apenas WhatsApp</option>
                  <option value="email_only">Apenas E-mail</option>
                </select>
              </div>
              <div class="innflu-form-group" style="margin-bottom:0;">
                <label class="innflu-form-label">Gênero Alvo:</label>
                <select class="innflu-select" id="selAutoGender">
                  <option value="female" selected>Apenas Feminino</option>
                  <option value="all">Todos os Gêneros</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 3. MENSAGEM & INTERVALO -->
          <div class="innflu-section-title" id="btnToggleMsgSection" style="cursor:pointer;margin-top:2px;display:flex;justify-content:space-between;align-items:center;" title="Clique para minimizar ou expandir a mensagem">
            <span>3. Mensagem dos Stories</span>
            <span id="lblToggleMsgSection" style="font-size:9.5px;color:#58a6ff;font-weight:600;">Recolher ▴</span>
          </div>

          <div id="barMsgSummary" style="display:none;font-size:9.5px;color:#8b949e;cursor:pointer;margin-bottom:4px;background:#161b22;padding:4px 6px;border-radius:4px;border:1px solid #30363d;justify-content:space-between;align-items:center;">
            <span id="txtMsgSummary" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px;">{Olá|Oi|Oie} {nome}! {Tudo bem...</span>
            <span style="color:#58a6ff;font-size:9px;">Editar ▾</span>
          </div>

          <div class="innflu-template-section" id="boxMsgSection">
            <textarea class="innflu-template-textarea" id="hudAutoTemplateContent" rows="4" style="min-height:95px;height:auto;font-size:11px;line-height:1.45;padding:8px;resize:vertical;overflow-y:visible;">{Olá|Oi|Oie} {nome}! {Tudo bem com você?|Como você está?|Tudo certinho?} {Adorei seu perfil|Achei seu conteúdo incrível}! Gostaria de te convidar para uma publicidade nos stories de um infoproduto digital. {Podemos conversar a respeito?|Topa saber mais detalhes?}</textarea>
            <div class="innflu-delay-row" style="margin-top:3px;">
              <div class="innflu-delay-inputs">
                <span class="innflu-form-label" style="margin:0;">Delay:</span>
                <input type="number" class="innflu-input innflu-input-mini" id="inputAutoMinDelay" value="60" min="5" max="900" title="Mínimo em segundos" style="width:34px;padding:2px 4px;font-size:10px;" />
                <span>a</span>
                <input type="number" class="innflu-input innflu-input-mini" id="inputAutoMaxDelay" value="120" min="10" max="1800" title="Máximo em segundos" style="width:34px;padding:2px 4px;font-size:10px;" />
                <span>s</span>
              </div>
              <div class="innflu-template-actions">
                <button class="innflu-btn-sub" id="btnAutoTestSpintax" title="Testar variação">🎲 Testar</button>
                <button class="innflu-btn-sub save" id="btnAutoSaveTemplate" title="Salvar mensagem">💾 Salvar</button>
              </div>
            </div>
          </div>

          <div style="margin-top:4px;">
            <div class="innflu-btn-group-actions">
              <button class="innflu-cta-btn start" id="btnToggleAuto" style="flex:2;padding:8px 10px;font-size:12px;">
                <span id="btnAutoLabel">⚡ Iniciar Automação</span>
              </button>
              <button class="innflu-btn-pause" id="btnPauseAuto" style="display:none;" title="Pausar ou retomar automação">
                <span id="btnPauseAutoIcon">⏸️</span>
                <span id="btnPauseAutoLabel">Pausar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ==========================================
             ABA 2: MINERAÇÃO & LEADS MINERADOS
             ========================================== -->
        <div id="viewMine" class="innflu-tab-content" style="display:none;">
          <div class="innflu-section-title">1. Escolha Onde Minerar</div>
          <div class="innflu-sources-grid">
            <button class="innflu-source-btn active" data-source="similar" id="srcBtnSimilar" title="Semelhantes a @ (Recomendadas)">
              <span class="innflu-source-name">Semelhantes</span>
            </button>
            <button class="innflu-source-btn" data-source="keyword" id="srcBtnKeyword" title="Palavra-chave (Busca geral)">
              <span class="innflu-source-name">Palavra-chave</span>
            </button>
            <button class="innflu-source-btn" data-source="hashtag" id="srcBtnHashtag" title="Hashtag (#)">
              <span class="innflu-source-name">Hashtag</span>
            </button>
            <button class="innflu-source-btn" data-source="following" id="srcBtnFollowing" title="Seguindo de @">
              <span class="innflu-source-name">Seguindo</span>
            </button>
          </div>

          <div class="innflu-form-group">
            <label class="innflu-form-label" id="lblMiningTarget">Termo de Pesquisa / Nicho:</label>
            <input type="text" class="innflu-input" id="inputMiningTarget" placeholder="ex: moda, provador, beleza, nutrição" value="" />
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
                <option value="5000">5.000+ seguidores</option>
                <option value="10000" selected>10.000+ seguidores</option>
                <option value="20000">20.000+ seguidores</option>
                <option value="50000">50.000+ seguidores</option>
                <option value="100000">100.000+ seguidores</option>
              </select>
            </div>
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Stories Ativos (24h):</label>
              <select class="innflu-select" id="selRequireStories">
                <option value="true" selected>Apenas com Stories</option>
                <option value="false">Todos os perfis</option>
              </select>
            </div>
          </div>
          <div class="innflu-filters-row" style="margin-top:4px;">
            <div class="innflu-form-group" style="margin-bottom:0;">
              <label class="innflu-form-label">Filtro de Contato:</label>
              <select class="innflu-select" id="selRequireContact">
                <option value="all" selected>Todos os contatos</option>
                <option value="any_contact">WhatsApp ou E-mail</option>
                <option value="wa_only">Apenas WhatsApp</option>
                <option value="email_only">Apenas E-mail</option>
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

          <div style="margin-top:6px;">
            <div class="innflu-btn-group-actions">
              <button class="innflu-cta-btn start" id="btnToggleMining" style="flex:2;">
                <span id="btnMiningLabel">Iniciar Mineração</span>
              </button>
              <button class="innflu-btn-pause" id="btnPauseMining" style="display:none;" title="Pausar ou retomar sem perder a fila">
                <span id="btnPauseMiningIcon">⏸️</span>
                <span id="btnPauseMiningLabel">Pausar</span>
              </button>
            </div>
          </div>

          <!-- SEÇÃO: LEADS MINERADOS -->
          <div style="margin-top:10px;border-top:1px solid #21262d;padding-top:8px;">
            <div class="innflu-section-title">
              <span>Leads Minerados (<span id="tabLeadsCount">0</span>)</span>
            </div>

            <div class="innflu-leads-summary">
              <div class="innflu-summary-box">
                <div class="innflu-summary-val" id="sumTotalLeads">0</div>
                <div class="innflu-summary-label">Total</div>
              </div>
              <div class="innflu-summary-box">
                <div class="innflu-summary-val wa" id="sumWaLeads">0</div>
                <div class="innflu-summary-label">WhatsApp</div>
              </div>
              <div class="innflu-summary-box">
                <div class="innflu-summary-val email" id="sumEmailLeads">0</div>
                <div class="innflu-summary-label">E-mail</div>
              </div>
            </div>

            <!-- Barra de Exportação e Ações -->
            <div class="innflu-export-bar">
              <button class="innflu-export-btn" id="btnSendDMsToLeads" style="background:#1f293d;border-color:#3b82f6;color:#60a5fa;" title="Iniciar envio de DMs para todas as criadoras mineradas">
                ✉️ Enviar DMs
              </button>
              <button class="innflu-export-btn csv" id="btnExportCSV" title="Baixar planilha completa">
                CSV
              </button>
              <button class="innflu-export-btn" id="btnImportCSV" title="Importar lista de influenciadoras CSV">
                Importar
              </button>
              <input type="file" id="hudInputImportCSV" accept=".csv,text/csv,text/plain" style="display:none;" />
              <button class="innflu-export-btn" id="btnCopyWhatsapps" title="Copiar todos os números">
                Whats
              </button>
              <button class="innflu-export-btn" id="btnCopyEmails" title="Copiar todos os e-mails">
                Emails
              </button>
              <button class="innflu-export-btn" id="btnRefreshLeads" title="Recarregar" style="min-width:24px;flex:0.4;">
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
            <div class="innflu-leads-scroll" id="leadsCardsContainer" style="max-height:140px;">
              <div style="font-size:10px;color:#8b949e;text-align:center;padding:12px;">
                Nenhum lead minerado ainda.<br>Clique em "Iniciar Mineração" para começar!
              </div>
            </div>
          </div>
        </div>

        <!-- ==========================================
             ABA 3: CAPTAÇÃO & TEMPLATES (DMs)
             ========================================== -->
        <div id="viewSender" class="innflu-tab-content" style="display:none;">
          <div class="innflu-template-section">
            <label class="innflu-form-label">Mensagem Spintax {Olá|Oi|Oie} e {nome}:</label>
            <textarea class="innflu-template-textarea" id="hudTemplateContent" rows="10" style="min-height:185px !important;height:190px !important;line-height:1.5;">{Olá|Oi|Oie} {nome}! {Tudo bem com você?|Como você está?|Tudo certinho?}

{Adorei seu perfil|Achei seu conteúdo incrível|Vi seu perfil e amei seu trabalho}!

Gostaria de saber se você faz publicidade nos stories. Temos uma proposta de publicidade nos stories de um infoproduto digital.

{Podemos conversar a respeito?|Topa saber mais detalhes?|Você tem disponibilidade?}</textarea>
            
            <div class="innflu-template-actions">
              <button class="innflu-btn-sub" id="btnTestSpintax">🎲 Testar Variação</button>
              <button class="innflu-btn-sub save" id="btnSaveTemplate">💾 Salvar Template</button>
            </div>
          </div>

          <div style="margin-top:8px;">
            <div class="innflu-btn-group-actions">
              <button class="innflu-cta-btn start" id="btnToggleSender" style="flex:2;">
                <span id="btnSenderLabel">Iniciar Envio de DMs (Captação)</span>
              </button>
              <button class="innflu-btn-pause" id="btnPauseSender" style="display:none;" title="Pausar ou retomar envios">
                <span id="btnPauseSenderIcon">⏸️</span>
                <span id="btnPauseSenderLabel">Pausar</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Telinha Ao Vivo Fixa Embaixo (Sempre Visível) -->
      <div class="innflu-live-dock" id="hudLiveDock">
        <div class="innflu-live-card">
          <div class="innflu-live-header">
            <span class="innflu-status-badge status-idle" id="hudLiveStatusBadge">
              <span class="innflu-status-pulse"></span>
              <span id="hudLiveStatusText">Aguardando comando...</span>
            </span>
            <span class="innflu-countdown" id="hudCountdown" style="display:none;"></span>
          </div>
          <div class="innflu-live-target">
            <span id="hudCurrentAction">Pronto para operar</span>
          </div>
          <div style="font-size:9px;color:#8b949e;" id="hudPageType">Página: Inicial</div>
          
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

        <!-- Mini feed ao vivo expansível -->
        <div class="innflu-live-feed-dock" id="hudActivityFeedDock">
          <div class="innflu-live-feed-title" id="btnToggleLiveFeed">
            <span>Atividades Recentes</span>
            <span id="hudLiveFeedArrow" style="font-size:9px;color:#8b949e;">▼</span>
          </div>
          <div class="innflu-feed" id="hudActivityFeed" style="display:none;max-height:70px;overflow-y:auto;">
            <div style="font-size:9px;color:#8b949e;text-align:center;padding:4px;">Nenhuma atividade recente.</div>
          </div>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="innflu-hud-footer">
        <button class="innflu-btn-secondary" id="btnQuickInspect">Analisar Perfil Aberto</button>
        <button class="innflu-btn-secondary" id="btnOpenDashboard" style="color:#38bdf8;border-color:#1e3a5f;" title="Abrir Painel Web">Painel Web</button>
        <button class="innflu-btn-secondary" id="btnCheckOtaUpdates" style="flex:0.7;font-size:10px;" title="Verificar atualizações">v1.4.4 🔄</button>
      </div>

      <!-- Alça de Redimensionamento Inferior (Puxar pra baixo / cima) -->
      <div class="innflu-resize-handle-bottom" id="hudResizeHandleBottom" title="Arraste para aumentar ou diminuir a altura do painel"></div>
      <!-- Alça de Redimensionamento do Canto -->
      <div class="innflu-resize-handle-corner" id="hudResizeHandleCorner" title="Arraste para redimensionar largura e altura livremente"></div>
    </div>
  `;
  document.body.appendChild(root);

  // Helper de DOM
  const $ = id => document.getElementById(id);

  // Referências aos elementos
  const hud = $('innfluHud');
  const hudAuthStrip = $('hudAuthStrip');
  const hudAuthAvatar = $('hudAuthAvatar');
  const hudAuthEmail = $('hudAuthEmail');
  const hudAuthPlan = $('hudAuthPlan');
  const btnHudLogout = $('btnHudLogout');

  const hudSubscriptionOverlay = $('hudSubscriptionOverlay');
  const subOverlayBadge = $('subOverlayBadge');
  const subOverlayTitle = $('subOverlayTitle');
  const subOverlayDesc = $('subOverlayDesc');
  const btnRefreshSubStatus = $('btnRefreshSubStatus');

  const hudLoginOverlay = $('hudLoginOverlay');
  const hudLoginForm = $('hudLoginForm');
  const inputHudLoginEmail = $('inputHudLoginEmail');
  const inputHudLoginPassword = $('inputHudLoginPassword');
  const btnHudLoginSubmit = $('btnHudLoginSubmit');
  const btnHudLoginLabel = $('btnHudLoginLabel');
  const hudLoginFeedback = $('hudLoginFeedback');
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
  const lblAutoTarget = $('lblAutoTarget');
  const selAutoMinFollowers = $('selAutoMinFollowers');
  const selAutoStories = $('selAutoStories');
  const selAutoContact = $('selAutoContact');
  const selAutoGender = $('selAutoGender');
  const hudAutoTemplateContent = $('hudAutoTemplateContent');
  const btnAutoTestSpintax = $('btnAutoTestSpintax');
  const btnAutoSaveTemplate = $('btnAutoSaveTemplate');
  const inputAutoMinDelay = $('inputAutoMinDelay');
  const inputAutoMaxDelay = $('inputAutoMaxDelay');
  const btnToggleAuto = $('btnToggleAuto');
  const btnAutoLabel = $('btnAutoLabel');
  const btnPauseAuto = $('btnPauseAuto');
  const btnPauseAutoIcon = $('btnPauseAutoIcon');
  const btnPauseAutoLabel = $('btnPauseAutoLabel');

  const sourceButtonsAuto = {
    similar: $('srcBtnAutoSimilar'),
    keyword: $('srcBtnAutoKeyword'),
    hashtag: $('srcBtnAutoHashtag'),
    following: $('srcBtnAutoFollowing')
  };

  const hudLiveStatusBadge = $('hudLiveStatusBadge');
  const btnToggleLiveFeed = $('btnToggleLiveFeed');
  const hudLiveFeedArrow = $('hudLiveFeedArrow');

  // Elementos do Banner OTA
  const hudOtaBanner = $('hudOtaBanner');
  const hudOtaVersion = $('hudOtaVersion');
  const hudOtaNotes = $('hudOtaNotes');
  const btnDownloadOta = $('btnDownloadOta');
  const btnReloadOta = $('btnReloadOta');
  const btnCheckOtaUpdates = $('btnCheckOtaUpdates');

  function displayOtaBanner(info) {
    if (!hudOtaBanner) return;
    if (info && (info.remoteUpdateAvailable || info.hasNewerVersion)) {
      if (hudOtaVersion) hudOtaVersion.innerText = info.remoteVersion || '1.2.0';
      if (hudOtaNotes) hudOtaNotes.innerText = info.releaseNotes || 'Atualizações e melhorias anti-ban disponíveis.';
      if (btnDownloadOta) btnDownloadOta.href = info.downloadUrl || '#';
      hudOtaBanner.style.display = 'flex';
    } else {
      hudOtaBanner.style.display = 'none';
    }
  }

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

  // Ações do Banner OTA
  if (btnReloadOta) {
    btnReloadOta.onclick = () => {
      btnReloadOta.innerText = '⚡ Atualizando...';
      btnReloadOta.disabled = true;
      showToast({ type: 'info', title: 'Atualizando...', message: 'Aplicando novas regras da nuvem e recarregando.' });
      chrome.runtime.sendMessage({ action: 'RELOAD_EXTENSION' });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };
  }

  if (btnCheckOtaUpdates) {
    btnCheckOtaUpdates.onclick = async () => {
      showToast({ type: 'info', title: 'Verificando...', message: 'Checando novas versões no servidor...' });
      chrome.runtime.sendMessage({ action: 'CHECK_UPDATES_NOW' }, () => {
        chrome.storage.local.get(['remoteUpdateAvailable', 'remoteVersion', 'releaseNotes', 'downloadUrl', 'dynamicRules'], data => {
          if (data.dynamicRules) {
            window.__innfluDynamicRules = data.dynamicRules;
          }
          if (data.remoteUpdateAvailable) {
            displayOtaBanner(data);
            showToast({ type: 'success', title: 'Atualização Encontrada!', message: `Versão ${data.remoteVersion} disponível!` });
          } else {
            displayOtaBanner(null);
            showToast({ type: 'success', title: 'Extensão 100% Atualizada', message: 'Você já está rodando a versão mais recente com regras OTA ativas.' });
          }
        });
      });
    };
  }

  // Ouvinte de mensagens do background para avisos de atualizações OTA
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'OTA_UPDATE_AVAILABLE') {
      displayOtaBanner(msg);
      showToast({ type: 'info', title: 'Atualização OTA', message: `Nova versão ${msg.remoteVersion} disponível!` });
    }
  });

  // ==========================================
  // STORAGE PERSISTENTE (COM PROTEÇÃO ANTI-INVALIDATED CONTEXT)
  // ==========================================
  function isExtensionContextValid() {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }

  let localBotCache = null;
  // Dados de sessão usados no relatório de diagnóstico
  let currentUserEmail = '';
  let currentUserPlan = '';
  let currentBearerToken = '';

  // ===== Perfis rejeitados (memória permanente) e proteção anti-loop =====
  let rejectedCache = new Set();
  async function loadRejected() {
    try {
      const r = await chrome.storage.local.get('innfluRejected');
      const obj = r.innfluRejected || {};
      const limit = Date.now() - 30 * 24 * 3600 * 1000;
      Object.keys(obj).forEach(k => { if (!obj[k] || obj[k].t < limit) delete obj[k]; });
      rejectedCache = new Set(Object.keys(obj));
    } catch (e) {}
  }
  async function addRejected(user, reason) {
    const u = (user || '').toLowerCase().trim();
    if (!u) return;
    rejectedCache.add(u);
    try {
      const r = await chrome.storage.local.get('innfluRejected');
      const obj = r.innfluRejected || {};
      obj[u] = { t: Date.now(), r: reason || '' };
      const keys = Object.keys(obj);
      if (keys.length > 3000) {
        keys.sort((a, b) => obj[a].t - obj[b].t).slice(0, keys.length - 3000).forEach(k => delete obj[k]);
      }
      await chrome.storage.local.set({ innfluRejected: obj });
    } catch (e) {}
  }
  // Abre um perfil com proteção: se o mesmo perfil for aberto repetidas vezes (loop), descarta e segue
  function openProfileSafe(user) {
    const u = (user || '').toLowerCase().replace('@', '').trim();
    if (!u) return false;
    const refTarget = ((localBotCache && localBotCache.miningTarget) || '').replace(/^[@#]/, '').trim().toLowerCase();
    if (u !== refTarget) {
      const counts = { ...((localBotCache && localBotCache.openCounts) || {}) };
      counts[u] = (counts[u] || 0) + 1;
      saveBot({ openCounts: counts });
      if (counts[u] > 4) {
        addRejected(u, 'loop');
        addDiagLog('warn', `Loop detectado em @${u} (aberto ${counts[u]}x). Descartando e seguindo para o próximo.`);
        showToast({ type: 'warning', title: 'Loop evitado', message: `@${u} foi descartado após várias tentativas.` });
        const queue = ((localBotCache && localBotCache.queue) || []).filter(x => x && x.toLowerCase() !== u);
        saveBot({ queue, visited: Array.from(new Set([...(((localBotCache && localBotCache.visited) || [])), u])).slice(-1000) });
        const nextInQueue = queue.find(x => !rejectedCache.has(x.toLowerCase()));
        if (nextInQueue) return window.InnfluCrawler.openProfile(nextInQueue);
        const navigated = window.InnfluCrawler.navigateToSource((localBotCache && localBotCache.miningSource) || 'hashtag', (localBotCache && localBotCache.miningTarget) || 'provador');
        if (!navigated) scheduleNext(1000);
        return navigated;
      }
    }
    return window.InnfluCrawler.openProfile(u);
  }

  // Sem novas candidatas a partir do perfil atual: troca de perfil-base ou encerra (nunca fica em loop)
  async function handleNoNewCandidates(currentUser) {
    const { bot: live } = await getState();
    const empty = (live.emptyExtractCount || 0) + 1;
    const pivots = new Set((live.pivotsUsed || []).map(x => (x || '').toLowerCase()));
    pivots.add((currentUser || '').toLowerCase());
    const candidates = (live.visited || []).filter(x => x && !pivots.has(x.toLowerCase()) && !rejectedCache.has(x.toLowerCase()));
    const nextPivot = candidates.length ? candidates[candidates.length - 1].toLowerCase() : null;

    if (empty >= 2 && nextPivot) {
      await saveBot({ miningTarget: nextPivot, queue: [], emptyExtractCount: 0, pivotsUsed: Array.from(pivots) });
      addDiagLog('info', `Sem novas candidatas em @${currentUser}. Trocando perfil-base para @${nextPivot}.`);
      showToast({ type: 'info', title: 'Trocando perfil-base', message: `Buscando novas influenciadoras a partir de @${nextPivot}...` });
      openProfileSafe(nextPivot);
      return;
    }
    if (empty >= 3 || (empty >= 2 && !nextPivot)) {
      await stopAutomationGracefully('no_candidates', `Não há mais influenciadoras novas a partir de @${currentUser}. Troque o perfil de referência ou o nicho.`);
      return;
    }
    await saveBot({ emptyExtractCount: empty, pivotsUsed: Array.from(pivots) });
    scheduleNext(3000);
  }

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
        apiBaseUrl: 'https://innflu-studio.pages.dev',
        authToken: null,
        authUser: null,
        apiToken: null,
        activeTemplate: hudTemplateContent ? hudTemplateContent.value : '',
        savedLeads: []
      };

      if (!isExtensionContextValid()) {
        localBotCache = fallback.bot;
        resolve(fallback);
        return;
      }

      try {
        chrome.storage.local.get([
          'innfluBot', 'apiBaseUrl', 'authToken', 'authUser', 'apiToken',
          'activeTemplate', 'savedLeadsCache', 'dynamicRules',
          'remoteUpdateAvailable', 'remoteVersion', 'releaseNotes', 'downloadUrl'
        ], res => {
          if (chrome.runtime.lastError) {
            localBotCache = fallback.bot;
            resolve(fallback);
            return;
          }

          // Sincroniza regras dinâmicas OTA em memória
          if (res?.dynamicRules) {
            window.__innfluDynamicRules = res.dynamicRules;
          }
          if (res?.remoteUpdateAvailable) {
            displayOtaBanner(res);
          }

          const bot = res?.innfluBot || fallback.bot;
          if (!bot.queue) bot.queue = [];
          if (!bot.visited) bot.visited = [];
          if (!bot.visitedPosts) bot.visitedPosts = [];
          if (bot.isPaused === undefined) bot.isPaused = false;
          if (bot.actionBlocked === undefined) bot.actionBlocked = false;

          localBotCache = { ...bot };

          let effectiveUrl = res?.apiBaseUrl || fallback.apiBaseUrl;
          if (effectiveUrl.includes('127.0.0.1') || effectiveUrl.includes('localhost')) {
            effectiveUrl = fallback.apiBaseUrl;
          }

          resolve({
            bot,
            apiBaseUrl: effectiveUrl,
            authToken: res?.authToken || null,
            authUser: res?.authUser || null,
            apiToken: res?.apiToken || null,
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

  // ==========================================
  // CLIENTE DE API AUTENTICADO CENTRALIZADO (CLOUDFLARE D1)
  // ==========================================
  async function innfluApiFetch(endpoint, options = {}) {
    const { apiBaseUrl, authToken, apiToken } = await getState();
    const baseUrl = apiBaseUrl || 'https://innflu-studio.pages.dev';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = authToken || apiToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-API-Key'] = token;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers
      });

      if (res.status === 401) {
        logDiagnostics('warn', `API 401 Não Autorizado em ${cleanEndpoint}. Sessão expirada ou não autenticado.`);
        await chrome.storage.local.set({ authToken: null, authUser: null });
        showLoginGate(true, 'Sessão expirada. Faça login novamente.');
        throw new Error('Sessão expirada ou não autenticado.');
      }

      return res;
    } catch (err) {
      throw err;
    }
  }

  // ==========================================
  // CONTROLE DO LOGIN GATE & SESSÃO SAAS
  // ==========================================
  function showLoginFeedback(text, type = 'error') {
    if (!hudLoginFeedback) return;
    if (!text) {
      hudLoginFeedback.style.display = 'none';
      hudLoginFeedback.innerText = '';
      return;
    }
    hudLoginFeedback.className = `innflu-login-feedback ${type}`;
    hudLoginFeedback.innerText = text;
    hudLoginFeedback.style.display = 'block';
  }

  function showLoginGate(show, errorMsg = '') {
    if (hudLoginOverlay) {
      hudLoginOverlay.style.display = show ? 'flex' : 'none';
      if (show && errorMsg) {
        showLoginFeedback(errorMsg, 'error');
      } else if (show) {
        showLoginFeedback('');
      }
    }
    if (hudAuthStrip) {
      hudAuthStrip.style.display = show ? 'none' : 'flex';
    }
    if (show) {
      if (localBotCache && localBotCache.isRunning) {
        saveBot({ isRunning: false, activeMode: null, isPaused: false });
        syncUI({ ...localBotCache, isRunning: false, activeMode: null, isPaused: false });
      }
      logDiagnostics('warn', 'Acesso bloqueado pelo Login Gate Obrigatório.');
    }
  }

  function showSubscriptionGate(show, user = null) {
    if (hudSubscriptionOverlay) {
      hudSubscriptionOverlay.style.display = show ? 'flex' : 'none';
      if (show && user) {
        if (subOverlayBadge) {
          subOverlayBadge.innerText = user.payment_status === 'trial' ? 'Trial Expirado' : 'Assinatura Bloqueada';
        }
        if (subOverlayTitle) {
          subOverlayTitle.innerText = user.payment_status === 'trial' ? 'Período Gratuito Encerrado' : 'Acesso Bloqueado';
        }
        if (subOverlayDesc) {
          subOverlayDesc.innerText = 'Seu acesso às automações e disparos está pausado. Assine o Plano Starter, Pro ou Scale para continuar.';
        }
      }
    }
    if (show) {
      if (localBotCache && localBotCache.isRunning) {
        if (typeof stopAutomationGracefully === 'function') {
          stopAutomationGracefully('subscription_required', 'Assinatura ativa obrigatória para automação.');
        } else {
          saveBot({ isRunning: false, activeMode: null, isPaused: false });
          syncUI({ ...localBotCache, isRunning: false, activeMode: null, isPaused: false });
        }
      }
      logDiagnostics('warn', 'Acesso bloqueado pelo Subscription Gate Obrigatório (Monetização).');
    }
  }

  function updateUserUI(user) {
    if (!user) return;
    currentUserEmail = user.email || '';
    currentUserPlan = (user.plan || '').toString().toUpperCase();
    if (hudAuthEmail) {
      hudAuthEmail.innerText = user.full_name || user.email;
      hudAuthEmail.title = user.email;
    }
    if (hudAuthPlan) {
      const p = (user.plan || 'PRO').toUpperCase();
      hudAuthPlan.innerText = p;
      if (p === 'PRO') {
        hudAuthPlan.style.background = 'rgba(168,85,247,0.2)';
        hudAuthPlan.style.borderColor = 'rgba(168,85,247,0.4)';
        hudAuthPlan.style.color = '#c084fc';
      } else if (p === 'SCALE') {
        hudAuthPlan.style.background = 'rgba(236,72,153,0.2)';
        hudAuthPlan.style.borderColor = 'rgba(236,72,153,0.4)';
        hudAuthPlan.style.color = '#f472b6';
      } else if (p === 'STARTER') {
        hudAuthPlan.style.background = 'rgba(59,130,246,0.2)';
        hudAuthPlan.style.borderColor = 'rgba(59,130,246,0.4)';
        hudAuthPlan.style.color = '#60a5fa';
      } else {
        hudAuthPlan.style.background = 'rgba(245,158,11,0.2)';
        hudAuthPlan.style.borderColor = 'rgba(245,158,11,0.4)';
        hudAuthPlan.style.color = '#fbbf24';
      }
    }
    if (hudAuthAvatar) {
      const initial = (user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)).toUpperCase();
      hudAuthAvatar.innerText = initial;
    }

    // Atualiza limite de DMs seguro com base no plano do usuário
    if (user.daily_dm_limit && localBotCache) {
      localBotCache.dailyLimit = user.daily_dm_limit;
      if (hudSentTodayCount) {
        hudSentTodayCount.innerText = `${localBotCache.sentCount || 0} / ${user.daily_dm_limit}`;
      }
    }
  }

  async function checkAndApplyAuth() {
    const { authToken, authUser, apiBaseUrl } = await getState();
    currentBearerToken = authToken || '';
    const baseUrl = apiBaseUrl || 'https://innflu-studio.pages.dev';

    if (!authToken) {
      showLoginGate(true);
      showSubscriptionGate(false);
      return false;
    }

    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': authToken
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          await chrome.storage.local.set({ authUser: data.user });
          showLoginGate(false);
          updateUserUI(data.user);

          // Validação de Monetização / Assinatura
          if (data.user.can_use === false) {
            showSubscriptionGate(true, data.user);
            return false;
          } else {
            showSubscriptionGate(false);
          }

          flushPendingLeadsBuffer();
          syncKnownCRMUsers();
          return true;
        }
      }
    } catch (e) {
      if (authUser) {
        showLoginGate(false);
        updateUserUI(authUser);
        if (authUser.can_use === false) {
          showSubscriptionGate(true, authUser);
          return false;
        }
        return true;
      }
    }

    await chrome.storage.local.set({ authToken: null, authUser: null });
    showLoginGate(true, 'Sessão expirada. Faça login para continuar.');
    showSubscriptionGate(false);
    return false;
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

    // Sincroniza formulário de automação
    if (bot.miningTarget && inputAutoTarget && inputAutoTarget.value !== bot.miningTarget) {
      inputAutoTarget.value = bot.miningTarget;
    }
    if (bot.minFollowers !== undefined && selAutoMinFollowers) {
      selAutoMinFollowers.value = bot.minFollowers.toString();
    }
    if (bot.requireStories !== undefined && selAutoStories) {
      selAutoStories.value = bot.requireStories ? 'true' : 'false';
    }
    if (bot.requireContact && selAutoContact) {
      selAutoContact.value = bot.requireContact;
    }
    if (bot.targetGender && selAutoGender) {
      selAutoGender.value = bot.targetGender;
    }
    if (bot.minDelaySec !== undefined && inputAutoMinDelay) {
      inputAutoMinDelay.value = bot.minDelaySec.toString();
    }
    if (bot.maxDelaySec !== undefined && inputAutoMaxDelay) {
      inputAutoMaxDelay.value = bot.maxDelaySec.toString();
    }
    if (bot.miningSource && typeof selectAutoSourceUI === 'function') {
      selectAutoSourceUI(bot.miningSource);
    }
    if (hudLiveStatusBadge) {
      hudLiveStatusBadge.className = hudGlobalBadge.className;
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
        hudStatusBadgeText.innerText = 'Minerando + Enviando...';
        hudLiveStatusText.innerText = 'Mineração Ativa (Minerar + DM)';
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

  // Configuração da Fonte da Automação Contínua
  let autoSelectedSource = 'similar';
  function selectAutoSourceUI(source) {
    autoSelectedSource = source;
    Object.entries(sourceButtonsAuto).forEach(([key, btn]) => {
      if (btn) {
        if (key === source) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (source === 'similar') {
      if (lblAutoTarget) lblAutoTarget.innerText = 'Perfil de Referência (ex: @marialuizazamoner):';
      if (inputAutoTarget) inputAutoTarget.placeholder = 'ex: @marialuizazamoner, @vihtube';
    } else if (source === 'keyword') {
      if (lblAutoTarget) lblAutoTarget.innerText = 'Palavra-chave do Nicho:';
      if (inputAutoTarget) inputAutoTarget.placeholder = 'ex: maternidade, moda praia, nutrição';
    } else if (source === 'hashtag') {
      if (lblAutoTarget) lblAutoTarget.innerText = 'Hashtag (com ou sem #):';
      if (inputAutoTarget) inputAutoTarget.placeholder = 'ex: #maternidadereal, #modafeminina';
    } else if (source === 'following') {
      if (lblAutoTarget) lblAutoTarget.innerText = 'Perfil para minerar quem ela segue:';
      if (inputAutoTarget) inputAutoTarget.placeholder = 'ex: @marialuizazamoner, @vihtube';
    }
  }

  Object.entries(sourceButtonsAuto).forEach(([src, btn]) => {
    if (btn) {
      btn.onclick = () => {
        selectAutoSourceUI(src);
        saveBot({ miningSource: src });
      };
    }
  });

  if (inputAutoTarget) {
    inputAutoTarget.addEventListener('input', () => {
      const val = inputAutoTarget.value.trim();
      if (val.startsWith('@')) {
        selectAutoSourceUI('similar');
        saveBot({ miningSource: 'similar', miningTarget: val.replace(/^@/, '') });
      } else if (val.startsWith('#')) {
        selectAutoSourceUI('hashtag');
        saveBot({ miningSource: 'hashtag', miningTarget: val });
      } else {
        saveBot({ miningTarget: val });
      }
    });
  }

  if (btnToggleLiveFeed) {
    btnToggleLiveFeed.onclick = () => {
      const feed = $('hudActivityFeed');
      if (feed.style.display === 'none') {
        feed.style.display = 'flex';
        if (hudLiveFeedArrow) hudLiveFeedArrow.innerText = '▼';
      } else {
        feed.style.display = 'none';
        if (hudLiveFeedArrow) hudLiveFeedArrow.innerText = '▲';
      }
    };
  }

  // ==========================================
  // EVENTOS DO LOGIN OBRIGATÓRIO (HUD OVERLAY)
  // ==========================================
  if (hudLoginForm) {
    hudLoginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = (inputHudLoginEmail ? inputHudLoginEmail.value : '').trim().toLowerCase();
      const password = inputHudLoginPassword ? inputHudLoginPassword.value : '';

      if (!email || !password) {
        showLoginFeedback('Preencha seu e-mail e senha.');
        return;
      }

      if (btnHudLoginSubmit) btnHudLoginSubmit.disabled = true;
      if (btnHudLoginLabel) btnHudLoginLabel.innerText = 'Autenticando...';
      showLoginFeedback('');

      try {
        const { apiBaseUrl } = await getState();
        const baseUrl = apiBaseUrl || 'https://innflu-studio.pages.dev';
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          showLoginFeedback(data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
          if (btnHudLoginSubmit) btnHudLoginSubmit.disabled = false;
          if (btnHudLoginLabel) btnHudLoginLabel.innerText = '⚡ Entrar na Conta';
          return;
        }

        await chrome.storage.local.set({
          authToken: data.token,
          authUser: data.user,
          apiToken: data.user.api_token || data.token,
          apiBaseUrl: baseUrl
        });

        showLoginFeedback('Login realizado com sucesso!', 'success');
        updateUserUI(data.user);

        setTimeout(() => {
          showLoginGate(false);
          if (btnHudLoginSubmit) btnHudLoginSubmit.disabled = false;
          if (btnHudLoginLabel) btnHudLoginLabel.innerText = '⚡ Entrar na Conta';
          if (inputHudLoginPassword) inputHudLoginPassword.value = '';
          showToast({ type: 'success', title: 'Conectado!', message: `Bem-vindo(a), ${data.user.full_name || data.user.email}!` });
          flushPendingLeadsBuffer();
          syncKnownCRMUsers();
          loadLeadsFromApiAndRender();
        }, 400);

      } catch (err) {
        showLoginFeedback('Erro de conexão ao servidor Innflu Studio.');
        if (btnHudLoginSubmit) btnHudLoginSubmit.disabled = false;
        if (btnHudLoginLabel) btnHudLoginLabel.innerText = '⚡ Entrar na Conta';
      }
    };
  }

  if (btnHudLogout) {
    btnHudLogout.onclick = async () => {
      const { authToken, apiBaseUrl } = await getState();
      const baseUrl = apiBaseUrl || 'https://innflu-studio.pages.dev';
      if (authToken) {
        fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        }).catch(() => {});
      }
      await chrome.storage.local.set({ authToken: null, authUser: null, apiToken: null });
      showLoginGate(true, 'Você saiu da conta.');
      showToast({ type: 'info', title: 'Sessão Encerrada', message: 'Você foi desconectado com sucesso.' });
    };
  }

  if (btnRefreshSubStatus) {
    btnRefreshSubStatus.onclick = async () => {
      btnRefreshSubStatus.innerText = 'Verificando assinatura...';
      const ok = await checkAndApplyAuth();
      if (ok) {
        showToast({ type: 'success', title: 'Assinatura Ativa!', message: 'Seu acesso foi validado com sucesso.' });
      } else {
        btnRefreshSubStatus.innerText = 'Já assinei? Atualizar status ↻';
      }
    };
  }

  // Ouvinte reativo para login/logout em outras abas (popup ou dashboard web)
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes.authToken || changes.authUser)) {
        checkAndApplyAuth();
      }
    });
  }

  // ==========================================
  // NAVEGAÇÃO ENTRE ABAS (3 ABAS: AUTOMAÇÃO, MINERAÇÃO E CAPTAÇÃO)
  // ==========================================
  const tabs = {
    auto: [$('tabBtnAuto'), $('viewAuto')],
    mine: [$('tabBtnMine'), $('viewMine')],
    sender: [$('tabBtnSender'), $('viewSender')]
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
    if (target === 'auto') {
      setTimeout(() => autoExpandTextarea(hudAutoTemplateContent), 50);
    } else if (target === 'sender') {
      setTimeout(() => autoExpandTextarea(hudTemplateContent), 50);
    } else if (target === 'mine') {
      renderLeadsTable();
      loadLeadsFromApiAndRender();
    }
  }

  $('tabBtnAuto').onclick = () => switchTab('auto');
  $('tabBtnMine').onclick = () => switchTab('mine');
  $('tabBtnSender').onclick = () => switchTab('sender');

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
  let savedHudHeightBeforeMinimize = null;
  let savedHudWidthBeforeMinimize = null;
  const btnMinimize = $('btnMinimize');
  if (btnMinimize) {
    btnMinimize.addEventListener('click', () => {
      const isMin = hud.classList.toggle('minimized');
      if (isMin) {
        savedHudHeightBeforeMinimize = hud.style.height || `${hud.offsetHeight}px`;
        savedHudWidthBeforeMinimize = hud.style.width || `${hud.offsetWidth}px`;
        hud.style.setProperty('height', '38px', 'important');
        hud.style.setProperty('min-height', '38px', 'important');
        hud.style.setProperty('max-height', '38px', 'important');
        hud.style.setProperty('width', '220px', 'important');
        btnMinimize.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>';
        btnMinimize.title = 'Restaurar Painel';
      } else {
        hud.style.removeProperty('height');
        hud.style.removeProperty('min-height');
        hud.style.removeProperty('max-height');
        hud.style.removeProperty('width');
        if (savedHudHeightBeforeMinimize) {
          hud.style.height = savedHudHeightBeforeMinimize;
          const parsed = parseInt(savedHudHeightBeforeMinimize, 10);
          const bodyEl = hud.querySelector('.innflu-hud-body');
          if (bodyEl && parsed) bodyEl.style.maxHeight = `${parsed - 85}px`;
        }
        if (savedHudWidthBeforeMinimize) {
          hud.style.width = savedHudWidthBeforeMinimize;
        }
        btnMinimize.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>';
        btnMinimize.title = 'Minimizar';
      }
    });
  }

  // Abrir Dashboard Web
  $('btnOpenDashboard').onclick = () => {
    window.open('https://innflu-studio.pages.dev/dashboard/', '_blank');
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
    try {
      await innfluApiFetch('/api/templates', {
        method: 'POST',
        body: JSON.stringify({ title: 'Template Ativo', content: hudTemplateContent.value })
      });
    } catch (e) {}
    showToast({ type: 'success', title: 'Template Salvo', message: 'Atualizado no armazenamento e Cloudflare D1.' });
  };

  if (btnAutoTestSpintax) {
    btnAutoTestSpintax.onclick = () => {
      const tpl = (hudAutoTemplateContent ? hudAutoTemplateContent.value : '') || '{Olá|Oi|Oie} {nome}! Adorei seu perfil!';
      const text = window.InnfluSpintax.interpolate(tpl, { nome: 'Larissa', username: 'larifashion' });
      showToast({ type: 'info', title: 'Variação Teste (Automação)', message: text, duration: 6000 });
    };
  }

  if (btnAutoSaveTemplate) {
    btnAutoSaveTemplate.onclick = async () => {
      const tpl = (hudAutoTemplateContent ? hudAutoTemplateContent.value : '').trim();
      await chrome.storage.local.set({ activeTemplate: tpl });
      if (hudTemplateContent) hudTemplateContent.value = tpl;
      try {
        await innfluApiFetch('/api/templates', {
          method: 'POST',
          body: JSON.stringify({ title: 'Template Automação', content: tpl })
        });
      } catch (e) {}
      showToast({ type: 'success', title: 'Mensagem Salva!', message: 'Template de automação atualizado com sucesso.' });
    };
  }

  // Acordeão de Filtros de Qualificação Compactos
  const btnToggleAutoFilters = $('btnToggleAutoFilters');
  const boxAutoFilters = $('boxAutoFilters');
  const barAutoFiltersSummary = $('barAutoFiltersSummary');
  const lblToggleAutoFilters = $('lblToggleAutoFilters');
  const txtAutoFiltersSummary = $('txtAutoFiltersSummary');

  function updateAutoFiltersSummary() {
    if (!txtAutoFiltersSummary) return;
    const minF = $('selAutoMinFollowers')?.value || '10000';
    const minStr = minF === '0' ? 'Sem mín.' : `${parseInt(minF, 10) >= 1000 ? parseInt(minF, 10) / 1000 + 'k+' : minF} seg`;
    const stVal = $('selAutoStories')?.value === 'true' ? 'Apenas c/ Stories' : 'Todos perfis';
    const genVal = $('selAutoGender')?.value === 'female' ? 'Feminino' : 'Geral';
    txtAutoFiltersSummary.innerText = `${minStr} • ${stVal} • ${genVal}`;
  }

  if (btnToggleAutoFilters && boxAutoFilters) {
    const toggleF = () => {
      const isHidden = boxAutoFilters.style.display === 'none';
      boxAutoFilters.style.display = isHidden ? 'block' : 'none';
      if (barAutoFiltersSummary) barAutoFiltersSummary.style.display = isHidden ? 'none' : 'flex';
      if (lblToggleAutoFilters) lblToggleAutoFilters.innerText = isHidden ? 'Fechar ▲' : '⚙️ Configurar ▾';
      updateAutoFiltersSummary();
    };
    btnToggleAutoFilters.onclick = toggleF;
    if (barAutoFiltersSummary) barAutoFiltersSummary.onclick = toggleF;
    ['selAutoMinFollowers', 'selAutoStories', 'selAutoContact', 'selAutoGender'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('change', updateAutoFiltersSummary);
    });
    updateAutoFiltersSummary();
  }

  // Auto-expansão do campo de mensagem para exibir TODO o texto completo sem cortes nem rolagem interna
  function autoExpandTextarea(ta) {
    if (!ta) return;
    ta.style.height = 'auto';
    const computedH = Math.max(90, ta.scrollHeight + 6);
    ta.style.height = computedH + 'px';
  }

  if (hudAutoTemplateContent) {
    hudAutoTemplateContent.addEventListener('input', () => autoExpandTextarea(hudAutoTemplateContent));
    hudAutoTemplateContent.addEventListener('change', () => autoExpandTextarea(hudAutoTemplateContent));
  }
  if (hudTemplateContent) {
    hudTemplateContent.addEventListener('input', () => autoExpandTextarea(hudTemplateContent));
  }

  // ==========================================
  // REDIMENSIONAMENTO VERTICAL E LIVRE DO HUD (CIMA, BAIXO E CANTO)
  // ==========================================
  const hudResizeHandleTop = $('hudResizeHandleTop');
  const hudResizeHandleBottom = $('hudResizeHandleBottom');
  const hudResizeHandleCorner = $('hudResizeHandleCorner');
  const hudElement = $('innfluHud');
  const hudBodyElement = hudElement ? hudElement.querySelector('.innflu-hud-body') : null;

  if (hudElement) {
    // Restaura dimensões salvas previamente
    chrome.storage.local.get(['hudHeight', 'hudWidth'], (data) => {
      if (data) {
        if (data.hudHeight) {
          const savedH = parseInt(data.hudHeight, 10);
          if (savedH >= 160 && savedH <= window.innerHeight - 20) {
            hudElement.style.height = `${savedH}px`;
            if (hudBodyElement) hudBodyElement.style.maxHeight = `${savedH - 85}px`;
          }
        }
        if (data.hudWidth) {
          const savedW = parseInt(data.hudWidth, 10);
          if (savedW >= 280 && savedW <= 600) {
            hudElement.style.width = `${savedW}px`;
          }
        }
      }
    });

    // 1. Alça Superior (Top) - Aumenta puxando pra cima, diminui puxando pra baixo
    if (hudResizeHandleTop) {
      let isResizingTop = false;
      let startY = 0;
      let startHeight = 0;

      hudResizeHandleTop.addEventListener('mousedown', (e) => {
        if (hudElement.classList.contains('minimized')) return;
        isResizingTop = true;
        startY = e.clientY;
        startHeight = hudElement.offsetHeight;
        hudResizeHandleTop.classList.add('active');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
        e.stopPropagation();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizingTop) return;
        const deltaY = startY - e.clientY;
        const minHeight = 160;
        const maxHeight = Math.min(window.innerHeight - 24, 980);
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

        hudElement.style.height = `${newHeight}px`;
        if (hudBodyElement) hudBodyElement.style.maxHeight = `${newHeight - 85}px`;
      });

      window.addEventListener('mouseup', () => {
        if (!isResizingTop) return;
        isResizingTop = false;
        hudResizeHandleTop.classList.remove('active');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        chrome.storage.local.set({ hudHeight: hudElement.offsetHeight });
      });
    }

    // 2. Alça Inferior (Bottom) - Aumenta puxando pra baixo, diminui puxando pra cima
    if (hudResizeHandleBottom) {
      let isResizingBottom = false;
      let startY = 0;
      let startHeight = 0;

      hudResizeHandleBottom.addEventListener('mousedown', (e) => {
        if (hudElement.classList.contains('minimized')) return;
        isResizingBottom = true;
        startY = e.clientY;
        startHeight = hudElement.offsetHeight;
        hudResizeHandleBottom.classList.add('active');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
        e.stopPropagation();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizingBottom) return;
        const deltaY = e.clientY - startY; // Descer mouse = aumenta; subir mouse = diminui
        const minHeight = 160;
        const maxHeight = Math.min(window.innerHeight - 24, 980);
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

        hudElement.style.height = `${newHeight}px`;
        if (hudBodyElement) hudBodyElement.style.maxHeight = `${newHeight - 85}px`;
      });

      window.addEventListener('mouseup', () => {
        if (!isResizingBottom) return;
        isResizingBottom = false;
        hudResizeHandleBottom.classList.remove('active');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        chrome.storage.local.set({ hudHeight: hudElement.offsetHeight });
      });
    }

    // 3. Alça do Canto (Corner) - Redimensiona altura e largura simultaneamente
    if (hudResizeHandleCorner) {
      let isResizingCorner = false;
      let startY = 0;
      let startX = 0;
      let startHeight = 0;
      let startWidth = 0;

      hudResizeHandleCorner.addEventListener('mousedown', (e) => {
        if (hudElement.classList.contains('minimized')) return;
        isResizingCorner = true;
        startY = e.clientY;
        startX = e.clientX;
        startHeight = hudElement.offsetHeight;
        startWidth = hudElement.offsetWidth;
        hudResizeHandleCorner.classList.add('active');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'nwse-resize';
        e.preventDefault();
        e.stopPropagation();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizingCorner) return;
        const deltaY = e.clientY - startY;
        const deltaX = e.clientX - startX;
        const minHeight = 160;
        const maxHeight = Math.min(window.innerHeight - 24, 980);
        const minWidth = 280;
        const maxWidth = 550;

        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));

        hudElement.style.height = `${newHeight}px`;
        hudElement.style.width = `${newWidth}px`;
        if (hudBodyElement) hudBodyElement.style.maxHeight = `${newHeight - 85}px`;
      });

      window.addEventListener('mouseup', () => {
        if (!isResizingCorner) return;
        isResizingCorner = false;
        hudResizeHandleCorner.classList.remove('active');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        chrome.storage.local.set({
          hudHeight: hudElement.offsetHeight,
          hudWidth: hudElement.offsetWidth
        });
      });
    }
  }

  // ==========================================
  // MINIMIZAR / EXPANDIR MENSAGEM DOS STORIES
  // ==========================================
  const btnToggleMsgSection = $('btnToggleMsgSection');
  const lblToggleMsgSection = $('lblToggleMsgSection');
  const boxMsgSection = $('boxMsgSection');
  const barMsgSummary = $('barMsgSummary');
  const txtMsgSummary = $('txtMsgSummary');

  function updateMsgSummaryText() {
    if (txtMsgSummary && hudAutoTemplateContent) {
      const val = (hudAutoTemplateContent.value || '').trim().replace(/\s+/g, ' ');
      txtMsgSummary.innerText = val ? (val.substring(0, 34) + '...') : 'Sem mensagem configurada';
    }
  }

  function toggleMsgSection(collapse) {
    if (!boxMsgSection) return;
    const isCurrentlyHidden = boxMsgSection.style.display === 'none';
    const shouldHide = collapse !== undefined ? collapse : !isCurrentlyHidden;

    boxMsgSection.style.display = shouldHide ? 'none' : 'block';
    if (barMsgSummary) barMsgSummary.style.display = shouldHide ? 'flex' : 'none';
    if (lblToggleMsgSection) lblToggleMsgSection.innerText = shouldHide ? 'Expandir ▾' : 'Recolher ▴';
    updateMsgSummaryText();
    chrome.storage.local.set({ isMsgSectionCollapsed: shouldHide });
  }

  if (btnToggleMsgSection) {
    btnToggleMsgSection.onclick = () => toggleMsgSection();
  }
  if (barMsgSummary) {
    barMsgSummary.onclick = () => toggleMsgSection(false);
  }

  // Restaura estado salvo de minimização da mensagem
  chrome.storage.local.get(['isMsgSectionCollapsed'], (data) => {
    if (data && data.isMsgSectionCollapsed) {
      toggleMsgSection(true);
    } else {
      updateMsgSummaryText();
    }
  });

  // ==========================================
  // TELEMETRIA & BUFFER DE LOGS DE DIAGNÓSTICO (BUG REPORT 🐛)
  // ==========================================
  window.InnfluDiagnosticLogs = window.InnfluDiagnosticLogs || [];
  window.InnfluUncaughtErrors = window.InnfluUncaughtErrors || [];
  window.InnfluLastCandidateEvaluation = window.InnfluLastCandidateEvaluation || null;

  // Captura erros globais de runtime
  window.addEventListener('error', (event) => {
    const errInfo = {
      time: new Date().toLocaleTimeString('pt-BR'),
      message: event.message || 'Erro de execução desconhecido',
      filename: event.filename || '',
      lineno: event.lineno,
      colno: event.colno
    };
    window.InnfluUncaughtErrors.push(errInfo);
    if (window.InnfluUncaughtErrors.length > 50) window.InnfluUncaughtErrors.shift();
    addDiagLog('error', `[Erro JS] ${errInfo.message} (${errInfo.filename}:${errInfo.lineno})`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason ? (event.reason.message || String(event.reason)) : 'Promise Rejection';
    const errInfo = {
      time: new Date().toLocaleTimeString('pt-BR'),
      message: `UnhandledRejection: ${reasonMsg}`
    };
    window.InnfluUncaughtErrors.push(errInfo);
    if (window.InnfluUncaughtErrors.length > 50) window.InnfluUncaughtErrors.shift();
    addDiagLog('error', `[Promise Rejection] ${reasonMsg}`);
  });

  // Alias usado pelos módulos de login/assinatura/sincronização
  function logDiagnostics(type, message, details = '') {
    try { addDiagLog(type, message, details); } catch (e) { console.log('[Innflu]', type, message); }
  }

  function addDiagLog(type, message, details = '') {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const logItem = { time, type: type || 'info', message: String(message), details };
    window.InnfluDiagnosticLogs.push(logItem);
    if (window.InnfluDiagnosticLogs.length > 300) {
      window.InnfluDiagnosticLogs.shift();
    }
    renderDiagLogs();
  }

  function renderDiagLogs() {
    const container = $('hudDiagLogsContainer');
    const countBadge = $('diagMetricLogCount');
    if (!container) return;

    if (countBadge) {
      countBadge.innerText = `${window.InnfluDiagnosticLogs.length} eventos`;
    }

    if (window.InnfluDiagnosticLogs.length === 0) {
      container.innerHTML = '<div class="innflu-diag-log-row info">Nenhum evento registrado ainda.</div>';
      return;
    }

    const html = window.InnfluDiagnosticLogs.slice(-100).map(l => {
      const safeMsg = (l.message || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="innflu-diag-log-row ${l.type}"><span class="innflu-diag-log-time">[${l.time}]</span> ${safeMsg}</div>`;
    }).join('');

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  // Intercepta logs com prefixo [Innflu]
  const _origLog = console.log;
  const _origWarn = console.warn;
  const _origErr = console.error;

  console.log = function(...args) {
    _origLog.apply(console, args);
    const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    if (text.includes('[Innflu]')) {
      addDiagLog('info', text.replace('[Innflu]', '').trim());
    }
  };

  console.warn = function(...args) {
    _origWarn.apply(console, args);
    const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    if (text.includes('[Innflu]')) {
      addDiagLog('warn', text.replace('[Innflu]', '').trim());
    }
  };

  console.error = function(...args) {
    _origErr.apply(console, args);
    const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    if (text.includes('[Innflu]')) {
      addDiagLog('error', text.replace('[Innflu]', '').trim());
    }
  };

  // Controles do Modal de Diagnóstico
  const btnHeaderBugReport = $('btnHeaderBugReport');
  const hudDiagnosticsModal = $('hudDiagnosticsModal');
  const btnCloseDiagnostics = $('btnCloseDiagnostics');
  const btnCopyDiagnostics = $('btnCopyDiagnostics');

  function updateDiagModalMetrics() {
    const pageType = window.InnfluCrawler.detectCurrentPage();
    const curUser = window.InnfluCrawler.getCurrentProfileUsername() || 'Nenhum';
    const diagMetricVersion = $('diagMetricVersion');
    const diagMetricPage = $('diagMetricPage');
    const diagMetricStatus = $('diagMetricStatus');
    const diagMetricTarget = $('diagMetricTarget');
    const diagMetricQueue = $('diagMetricQueue');
    const diagMetricVisited = $('diagMetricVisited');

    if (diagMetricVersion) diagMetricVersion.innerText = 'v1.4.4';
    if (diagMetricPage) diagMetricPage.innerText = `${pageType}${curUser !== 'Nenhum' ? ' (@' + curUser + ')' : ''}`;
    if (diagMetricStatus) diagMetricStatus.innerText = localBotCache?.isRunning ? (localBotCache.isPaused ? 'Pausado' : 'Rodando') : 'Parado';
    if (diagMetricTarget) diagMetricTarget.innerText = `${localBotCache?.miningSource || 'alvo'}: "${localBotCache?.miningTarget || 'geral'}"`;
    if (diagMetricQueue) diagMetricQueue.innerText = (localBotCache?.queue || []).length;
    if (diagMetricVisited) diagMetricVisited.innerText = (localBotCache?.visited || []).length;
    renderDiagLogs();
  }

  if (btnHeaderBugReport && hudDiagnosticsModal) {
    btnHeaderBugReport.onclick = () => {
      hudDiagnosticsModal.style.display = 'flex';
      updateDiagModalMetrics();
    };
  }

  if (btnCloseDiagnostics && hudDiagnosticsModal) {
    btnCloseDiagnostics.onclick = () => {
      hudDiagnosticsModal.style.display = 'none';
    };
  }

  function generateDiagnosticsReport() {
    const pageType = window.InnfluCrawler ? window.InnfluCrawler.detectCurrentPage() : 'desconhecida';
    const curUser = window.InnfluCrawler ? (window.InnfluCrawler.getCurrentProfileUsername() || 'Nenhum') : 'Nenhum';
    const dialogs = document.querySelectorAll('div[role="dialog"], div[aria-modal="true"]');
    const postLinks = document.querySelectorAll('a[href^="/p/"], a[href^="/reel/"]');
    const storiesRing = window.InnfluInspector ? window.InnfluInspector.hasActiveStories() : false;
    const dmInputs = document.querySelectorAll('textarea, input[placeholder*="Mensagem" i], div[role="textbox"]');

    const lines = [
      `================================================================================`,
      `📋 RELATÓRIO FORENSE DE DIAGNÓSTICO DO INNFLU STUDIO (BUG REPORT COMPLETO)`,
      `================================================================================`,
      `[METADADOS DO SISTEMA]`,
      `- Data/Hora: ${new Date().toLocaleString('pt-BR')} (Timestamp: ${Date.now()})`,
      `- Versão do Script: v1.4.4`,
      `- URL Atual: ${window.location.href}`,
      `- Título da Página: ${document.title}`,
      `- Página Detectada: ${pageType}`,
      `- Perfil Aberto: @${curUser}`,
      `- Resolução da Tela: ${window.innerWidth}x${window.innerHeight} (DevicePixelRatio: ${window.devicePixelRatio || 1})`,
      `- User-Agent: ${navigator.userAgent}`,
      ``,
      `[SESSÃO & AUTENTICAÇÃO]`,
      `- Usuário Logado: ${currentUserEmail || 'Não autenticado'}`,
      `- Plano: ${currentUserPlan || 'FREE'}`,
      `- Token Presente: ${currentBearerToken ? 'SIM (token ativo)' : 'NÃO'}`,
      `- Status Sincronização Cloudflare D1: ${cachedLeads.length} leads em cache local`,
      ``,
      `[ESTADO DO MOTOR DE AUTOMAÇÃO]`,
      `- isRunning: ${localBotCache?.isRunning ? 'TRUE' : 'FALSE'}`,
      `- isPaused: ${localBotCache?.isPaused ? 'TRUE' : 'FALSE'}`,
      `- activeMode: ${localBotCache?.activeMode || 'Nenhum'}`,
      `- miningSource: ${localBotCache?.miningSource || 'N/A'}`,
      `- miningTarget: "${localBotCache?.miningTarget || 'N/A'}"`,
      `- currentAction: "${hudCurrentAction ? hudCurrentAction.innerText : 'N/A'}"`,
      `- Disparos Hoje: ${localBotCache?.sentCount || 0} / ${localBotCache?.dailyLimit || 40}`,
      `- Mineradas Salvas: ${localBotCache?.minedCount || 0}`,
      `- searchStallCount: ${localBotCache?.searchStallCount || 0}`,
      `- Intervalo Anti-Ban Configurado: ${localBotCache?.minDelaySec || 60}s a ${localBotCache?.maxDelaySec || 120}s`,
      `- Próxima Ação Agendada (nextActionAt): ${localBotCache?.nextActionAt ? new Date(localBotCache.nextActionAt).toLocaleTimeString('pt-BR') : 'Nenhuma'}`,
      ``,
      `[FILTROS & CRITÉRIOS DE AVALIAÇÃO ATIVOS]`,
      `- Mínimo de Seguidores: ${localBotCache?.minFollowers || 10000}`,
      `- Máximo de Seguidores: ${localBotCache?.maxFollowers || 10000000}`,
      `- Exige Stories Ativos (24h): ${localBotCache?.requireStories !== false ? 'SIM' : 'NÃO'}`,
      `- Gênero Alvo: ${localBotCache?.targetGender || 'female'}`,
      `- Exigência de Contato: ${localBotCache?.requireContact || 'all'}`,
      ``,
      `[FILAS & MEMÓRIA ANTI-REPETIÇÃO]`,
      `- Fila Atual (${(localBotCache?.queue || []).length} criadoras): ${(localBotCache?.queue || []).slice(0, 30).map(u => '@' + u).join(', ') || 'Vazia'}`,
      `- Total de Visitadas (${(localBotCache?.visited || []).length} criadoras): ${(localBotCache?.visited || []).slice(-20).map(u => '@' + u).join(', ') || 'Nenhuma'}`,
      `- Posts Inspecionados (${(localBotCache?.visitedPosts || []).length} posts): ${(localBotCache?.visitedPosts || []).slice(-15).join(', ') || 'Nenhum'}`,
      `- CRM Cache Size: ${knownCRMUsersCache ? knownCRMUsersCache.size : 0} usuárias conhecidas`,
      ``,
      `[SNAPSHOT DO DOM DO INSTAGRAM]`,
      `- Modais de Diálogo Abertos (div[role="dialog"]): ${dialogs.length}`,
      ...Array.from(dialogs).map((d, i) => `  * Dialog #${i+1}: aria-label="${d.getAttribute('aria-label') || ''}", linksCount=${d.querySelectorAll('a').length}, textSnippet="${(d.innerText || '').substring(0, 100).replace(/\n/g, ' ')}"`),
      `- Publicações / Reels Visíveis na Grade: ${postLinks.length}`,
      `- Header de Perfil Presente: ${!!document.querySelector('header') ? 'SIM' : 'NÃO'}`,
      `- Stories Ativos Detectados na Página Atual: ${storiesRing ? 'SIM' : 'NÃO'}`,
      `- Campos de Input / DM na Página: ${dmInputs.length}`,
      ``,
      `[ÚLTIMA AVALIAÇÃO DE CANDIDATA REALIZADA]`,
      window.InnfluLastCandidateEvaluation ? JSON.stringify(window.InnfluLastCandidateEvaluation, null, 2) : 'Nenhuma candidata avaliada nesta sessão.',
      ``,
      `[ERROS & EXCEÇÕES DE RUNTIME CAPTURADAS (${window.InnfluUncaughtErrors ? window.InnfluUncaughtErrors.length : 0})]`,
      ...(window.InnfluUncaughtErrors && window.InnfluUncaughtErrors.length > 0
        ? window.InnfluUncaughtErrors.map(e => `* [${e.time}] ${e.message} (${e.filename || 'local'}:${e.lineno || '0'})`)
        : ['Nenhum erro de runtime capturado até o momento.']),
      ``,
      `================================================================================`,
      `[HISTÓRICO COMPLETO DE EVENTOS INTERNOS (${(window.InnfluDiagnosticLogs || []).length} LOGS)]`,
      `================================================================================`,
      ...(window.InnfluDiagnosticLogs || []).slice(-200).map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`),
      `================================================================================`,
      `[FIM DO RELATÓRIO]`
    ];
    return lines.join('\n');
  }

  if (btnCopyDiagnostics) {
    btnCopyDiagnostics.onclick = async () => {
      const reportText = generateDiagnosticsReport();
      try {
        await navigator.clipboard.writeText(reportText);
        showToast({ type: 'success', title: 'Relatório Copiado!', message: 'Envie o texto copiado no chat para resolvermos qualquer erro imediatamente.' });
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = reportText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast({ type: 'success', title: 'Relatório Copiado!', message: 'Envie o texto copiado no chat para resolvermos qualquer erro imediatamente.' });
      }
    };
  }

  // ==========================================
  // SINCRONIZAÇÃO DA MEMÓRIA DO CRM (ANTI-REPETIÇÃO INSTANTÂNEA)
  // ==========================================
  async function syncKnownCRMUsers(apiBaseUrl) {
    const { bot, savedLeads } = await getState();
    const set = new Set();

    // 2. Cache local de leads
    (savedLeads || []).forEach(l => {
      if (l.username) set.add(l.username.toLowerCase());
    });

    // 3. Busca lista remota do Cloudflare D1 (/api/leads)
    try {
      const res = await innfluApiFetch('/api/leads');
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
    console.log(`[Innflu] ⚡ Memória do CRM carregada: ${set.size} influenciadoras registradas (se reaparecerem, a conversa é conferida antes de decidir).`);
    return set;
  }

  // ==========================================
  // CONTROLE CENTRAL DE PARADA LIMPA & GRACEFUL STOP
  // ==========================================
  window.__innfluNextScheduleTimer = null;

  async function stopAutomationGracefully(reason, message) {
    if (window.__innfluNextScheduleTimer) {
      clearTimeout(window.__innfluNextScheduleTimer);
      window.__innfluNextScheduleTimer = null;
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    const { bot } = await getState();
    const updated = {
      ...bot,
      isRunning: false,
      isPaused: false,
      activeMode: null,
      nextActionAt: 0,
      searchStallCount: 0
    };
    await saveBot(updated);
    syncUI(updated);

    if (hudCurrentAction) {
      hudCurrentAction.innerText = message || `Operação parada (${reason}).`;
    }
    addDiagLog('info', `Operação finalizada: ${reason} - ${message || ''}`);

    const isError = reason === 'error' || reason === 'blocked';
    const isSuccess = reason === 'daily_limit' || reason === 'completed';
    showToast({
      type: isError ? 'error' : (isSuccess ? 'success' : 'info'),
      title: isSuccess ? 'Operação Concluída!' : 'Operação Parada',
      message: message || `Finalizada (${reason})`
    });
  }

  // ==========================================
  // BOTÕES PRINCIPAIS DE EXECUÇÃO
  // ==========================================
  btnToggleMining.onclick = async () => {
    const isAuth = await checkAndApplyAuth();
    if (!isAuth) {
      showLoginGate(true, 'Faça login na sua conta para iniciar a mineração.');
      return;
    }

    const { bot, apiBaseUrl } = await getState();
    if (bot.isRunning && bot.activeMode === 'miner') {
      await stopAutomationGracefully('manual', 'Mineração interrompida pelo usuário.');
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
      visited: [],
      openCounts: {},
      pivotsUsed: [],
      emptyExtractCount: 0,
      visitedPosts: [],
      nextActionAt: 0
    });

    const updated = await getState();
    syncUI(updated.bot);
    showToast({
      type: 'success',
      title: 'Mineração Iniciada',
      message: `Minerando via ${currentSource}: "${targetClean}" e enviando a mensagem de captação`
    });
    runLoop();
  };

  btnToggleAuto.onclick = async () => {
    const isAuth = await checkAndApplyAuth();
    if (!isAuth) {
      showLoginGate(true, 'Faça login na sua conta para iniciar a automação.');
      return;
    }

    const { bot, apiBaseUrl } = await getState();
    if (bot.isRunning && bot.activeMode === 'auto') {
      await stopAutomationGracefully('manual', 'Automação interrompida pelo usuário.');
      return;
    }

    const rawInput = (inputAutoTarget.value || '').trim();
    let currentSource = autoSelectedSource || 'keyword';
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

    const minFollowersVal = parseInt(selAutoMinFollowers.value, 10) || 0;
    const requireStoriesVal = selAutoStories.value === 'true';
    const requireContactVal = selAutoContact ? selAutoContact.value : 'all';
    const targetGenderVal = selAutoGender ? selAutoGender.value : 'female';

    const minDelayVal = Math.max(5, parseInt(inputAutoMinDelay ? inputAutoMinDelay.value : 60, 10) || 60);
    const maxDelayVal = Math.max(minDelayVal, parseInt(inputAutoMaxDelay ? inputAutoMaxDelay.value : 120, 10) || 120);

    const autoTpl = (hudAutoTemplateContent ? hudAutoTemplateContent.value : '').trim();
    if (autoTpl) {
      await chrome.storage.local.set({ activeTemplate: autoTpl });
      if (hudTemplateContent) hudTemplateContent.value = autoTpl;
    }

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
      requireContact: requireContactVal,
      targetGender: targetGenderVal,
      minDelaySec: minDelayVal,
      maxDelaySec: maxDelayVal,
      queue: [],
      visited: [],
      openCounts: {},
      pivotsUsed: [],
      emptyExtractCount: 0,
      visitedPosts: [],
      nextActionAt: 0,
      searchStallCount: 0
    });

    const updated = await getState();
    syncUI(updated.bot);
    showToast({
      type: 'success',
      title: '⚡ Automação Iniciada!',
      message: `Minerando "${targetClean}" e disparando DMs em loop contínuo.`
    });

    const curPage = window.InnfluCrawler.detectCurrentPage();
    if ((currentSource === 'keyword' || currentSource === 'hashtag') && curPage !== 'search') {
      hudCurrentAction.innerText = `Navegando para busca de "${targetClean}"...`;
      addDiagLog('info', `Iniciando automação. Redirecionando para busca: "${targetClean}"`);
      await window.InnfluCrawler.sleep(800);
      window.InnfluCrawler.navigateToSource(currentSource, targetClean);
      return;
    }

    runLoop();
  };

  btnToggleSender.onclick = async () => {
    const isAuth = await checkAndApplyAuth();
    if (!isAuth) {
      showLoginGate(true, 'Faça login na sua conta para iniciar o disparo.');
      return;
    }

    const { bot, savedLeads } = await getState();
    if (bot.isRunning && bot.activeMode === 'sender') {
      await stopAutomationGracefully('manual', 'Captação interrompida pelo usuário.');
      return;
    }

    // Puxa automaticamente da barra de leads minerados todos que ainda não receberam mensagem
    const allLeads = savedLeads || cachedLeads || [];
    const visitedSet = new Set((bot.visited || []).map(u => (u || '').toLowerCase()));
    const uncontacted = allLeads
      .filter(l => {
        const u = (l.username || '').toLowerCase();
        const s = (l.status || '').toLowerCase();
        const isPending = s === 'minerada' || s === 'pendente' || s === 'qualificada' || (!s.includes('contatad') && !s.includes('enviad') && !s.includes('skip'));
        return u && isPending && !visitedSet.has(u);
      })
      .map(l => l.username.toLowerCase());

    const initialQueue = uncontacted.length > 0 ? uncontacted : (bot.queue || []);

    if (initialQueue.length === 0) {
      showToast({
        type: 'warning',
        title: 'Nenhum Lead Pendente',
        message: 'Todos os leads minerados da lista já foram contatados ou a barra está vazia. Minere novos perfis na aba "Mineração"!'
      });
      return;
    }

    await saveBot({
      isRunning: true,
      isPaused: false,
      activeMode: 'sender',
      queue: initialQueue,
      nextActionAt: 0
    });

    const updated = await getState();
    syncUI(updated.bot);
    hudQueueCount.innerText = initialQueue.length;

    showToast({
      type: 'success',
      title: 'Captação Iniciada ✉️',
      message: `${initialQueue.length} criadoras mineradas carregadas automaticamente da lista para envio!`
    });
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
      if (window.__innfluNextScheduleTimer) {
        clearTimeout(window.__innfluNextScheduleTimer);
        window.__innfluNextScheduleTimer = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      showToast({ type: 'warning', title: 'Operação Pausada', message: 'Fila e histórico preservados. Clique em Retomar quando desejar.' });
      hudCurrentAction.innerText = 'Operação pausada pelo usuário.';
      addDiagLog('info', 'Operação pausada pelo usuário.');
    } else {
      showToast({ type: 'success', title: 'Operação Retomada', message: 'Continuando de onde parou!' });
      addDiagLog('info', 'Operação retomada.');
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
    if (window.InnfluIsSendingDM) {
      console.log('[Innflu] Envio de DM em andamento, ignorando ciclo concorrente.');
      return;
    }
    const { bot, apiBaseUrl, activeTemplate } = await getState();
    if (!bot.isRunning) return;
    // Perfis rejeitados (fora das métricas, já responderam, loop) nunca são reabertos
    if (rejectedCache.size) bot.visited = Array.from(new Set([...(bot.visited || []), ...rejectedCache]));

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

    // Mineração (qualquer fonte) e Automação usam o MESMO pipeline: minera -> filtra -> envia a captação.
    if (bot.activeMode === 'auto' || bot.activeMode === 'miner') {
      await stepAutomation(bot, apiBaseUrl, activeTemplate, pageType);
    } else if (bot.activeMode === 'sender') {
      await stepSender(bot, apiBaseUrl, activeTemplate, pageType);
    }
  }

  // ==========================================
  // PIPELINE DE AUTOMAÇÃO CONTÍNUA (MINERA -> DM -> CONTINUA)
  // ==========================================
  async function stepAutomation(bot, apiBaseUrl, activeTemplate, pageType) {
    if ((bot.sentCount || 0) >= (bot.dailyLimit || 40)) {
      await stopAutomationGracefully('daily_limit', 'Meta diária de abordagens alcançada por hoje!');
      return;
    }

    if (pageType === 'direct') {
      if (window.InnfluIsSendingDM) {
        return; // Não interrompe o fluxo de envio ativo
      }
      hudCurrentAction.innerText = '[⚡ Automação] Retornando ao fluxo de prospecção...';
      window.history.back();
      await window.InnfluCrawler.sleep(1500);
      return;
    }

    const currentProfileUser = (pageType === 'profile' ? (window.InnfluCrawler.getCurrentProfileUsername() || '') : '').toLowerCase();
    const visitedSet = new Set(bot.visited || []);

    // CENÁRIO 0: Perfil de REFERÊNCIA (fontes "semelhantes" / "seguindo"): não é alvo de captação,
    // apenas serve para extrair a lista de candidatas. Marca como visitado e deixa o minerador extrair.
    const refSource = bot.miningSource === 'similar' || bot.miningSource === 'following' || bot.miningSource === 'followers';
    const refTarget = (bot.miningTarget || '').replace(/^[@#]/, '').trim().toLowerCase();
    if (refSource && pageType === 'profile' && currentProfileUser && currentProfileUser === refTarget) {
      if (!visitedSet.has(currentProfileUser)) {
        visitedSet.add(currentProfileUser);
        bot.visited = Array.from(visitedSet).slice(-1000);
        await saveBot({ visited: bot.visited });
      }
      const hasPending = (bot.queue || []).some(u => u && !visitedSet.has(u.toLowerCase()));
      if (!hasPending) {
        await stepMiner(bot, apiBaseUrl, pageType);
        return;
      }
    }

    // CENÁRIO A: Estamos diretamente no perfil de uma influenciadora inédita
    if (pageType === 'profile' && currentProfileUser && !visitedSet.has(currentProfileUser)) {
      await processCandidateInAutomation(currentProfileUser, bot, apiBaseUrl, activeTemplate);
      return;
    }

    // CENÁRIO B: Temos criadoras na fila pronta para abordagem
    const pendingQueue = (bot.queue || []).filter(u => u && !visitedSet.has(u.toLowerCase()));
    if (pendingQueue.length > 0) {
      const nextUser = pendingQueue[0].toLowerCase();

      // Estamos no perfil dela?
      if (pageType === 'profile' && currentProfileUser === nextUser) {
        await processCandidateInAutomation(nextUser, bot, apiBaseUrl, activeTemplate);
        return;
      } else {
        // Navega até o perfil da criadora
        hudCurrentAction.innerText = `[⚡ Automação] Abrindo @${nextUser}...`;
        openProfileSafe(nextUser);
        return;
      }
    }

    // CENÁRIO C: Fila vazia -> Primeiro verifica se há criadoras salvas na barra de Leads pendentes de envio
    const allLeads = cachedLeads || [];
    // Só puxa pendentes do MESMO nicho/alvo da rodada atual (mudar o nicho não reabre perfis de outro nicho)
    const rawTargetNow = (bot.miningTarget || '').trim().replace(/^[@#]/, '').toLowerCase();
    const pendingFromBar = allLeads.filter(l => {
      const ln = (l.niche || '').toLowerCase().replace(/^[@#]/, '').trim();
      if (!rawTargetNow || ln !== rawTargetNow) return false;
      const u = (l.username || '').toLowerCase();
      const s = (l.status || '').toLowerCase();
      const isPending = s === 'minerada' || s === 'pendente' || s === 'qualificada' || (!s.includes('contatad') && !s.includes('enviad') && !s.includes('skip') && !s.includes('respond'));
      return u && isPending && !visitedSet.has(u);
    });

    if (pendingFromBar.length > 0) {
      const nextFromBar = pendingFromBar[0].username.toLowerCase();
      hudCurrentAction.innerText = `[⚡ Automação] Puxando da barra de leads: @${nextFromBar}...`;
      openProfileSafe(nextFromBar);
      return;
    }

    // Se a barra de leads também não tiver pendentes -> mineração contínua
    hudCurrentAction.innerText = `[⚡ Automação] Fila vazia. Minerando novos perfis...`;
    await stepMiner(bot, apiBaseUrl, pageType);
  }

  /**
   * Avalia os filtros da influenciadora, salva lead e dispara DM com delay humano seguro
   */
  async function processCandidateInAutomation(cleanUser, bot, apiBaseUrl, activeTemplate) {
    hudCurrentAction.innerText = `[⚡ Automação] Carregando perfil de @${cleanUser}...`;
    addDiagLog('info', `Iniciando análise do perfil @${cleanUser}...`);

    const rawTarget = (bot.miningTarget || 'Geral').trim();
    const currentNiche = bot.miningSource === 'hashtag' ? ('#' + rawTarget.replace(/^#/, '')) : rawTarget;

    // Aguarda o header e dados do perfil renderizarem no DOM do React (até 3600ms)
    let profile = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      profile = window.InnfluInspector.extractCurrentProfileData(currentNiche);
      if (profile && (profile.followersCount > 0 || profile.fullName || profile.bio || profile.isPrivate)) {
        break;
      }
      await window.InnfluCrawler.sleep(300);
    }

    // Estado mais recente (evita sobrescrever com cópia antiga)
    const { bot: liveBot } = await getState();
    const remainingQueue = ((liveBot && liveBot.queue) || bot.queue || []).filter(u => u && u.toLowerCase() !== cleanUser);
    const visitedSet = new Set((liveBot && liveBot.visited) || bot.visited || []);
    visitedSet.add(cleanUser);
    const wasKnown = knownCRMUsersCache.has(cleanUser);
    knownCRMUsersCache.add(cleanUser);

    if (!profile) {
      hudCurrentAction.innerText = `[⚡ Automação] Falha ao carregar @${cleanUser}. Avançando...`;
      addDiagLog('error', `Falha ao carregar DOM do perfil @${cleanUser}`);
      await saveBot({ queue: remainingQueue, visited: Array.from(visitedSet).slice(-1000) });
      scheduleNext(1200);
      return;
    }

    // Validação estrita de critérios (Filtros configurados)
    const campaignCriteria = {
      minFollowers: bot.minFollowers !== undefined ? bot.minFollowers : 10000,
      maxFollowers: bot.maxFollowers || 10000000,
      requireActiveStories: bot.requireStories !== false,
      targetGender: bot.targetGender || 'female',
      requireContact: bot.requireContact || 'all'
    };
    const evalResult = window.InnfluInspector.evaluateCandidate(profile, campaignCriteria);

    // Registra na telemetria forense para o relatório de diagnóstico do bug report
    window.InnfluLastCandidateEvaluation = {
      username: cleanUser,
      profile,
      criteria: campaignCriteria,
      result: evalResult,
      evaluatedAt: new Date().toISOString()
    };

    addDiagLog('info', `Avaliação de @${cleanUser}: Seg=${profile.followersCount}, Stories=${profile.hasActiveStories}, Gênero=${profile.isFemale ? 'F' : 'M/Marca'}, Aprovada=${evalResult.approved}`);

    if (!evalResult.approved) {
      const rejectReason = evalResult.reasons.join(', ');
      hudCurrentAction.innerText = `[⚡ Automação] @${cleanUser} pulada: ${rejectReason}`;
      addDiagLog('warn', `@${cleanUser} pulada: ${rejectReason}`);
      await logActivity({ username: cleanUser, status: `Pulada (${rejectReason})` });
      await addRejected(cleanUser, rejectReason);
      await saveBot({ queue: remainingQueue, visited: Array.from(visitedSet).slice(-1000) });
      if (remainingQueue.length > 0) {
        hudCurrentAction.innerText = `[⚡ Automação] Pulada (${rejectReason}). Abrindo @${remainingQueue[0]}...`;
        await window.InnfluCrawler.sleep(1200);
        openProfileSafe(remainingQueue[0]);
        return;
      } else {
        hudCurrentAction.innerText = `[⚡ Automação] Pulada (${rejectReason}). Retornando à busca...`;
        await window.InnfluCrawler.sleep(1200);
        window.InnfluCrawler.navigateToSource(bot.miningSource || 'hashtag', bot.miningTarget || 'provador');
        return;
      }
    }

    // Regra dos 7 dias / blacklist: nunca abordar quem já recebeu captação recentemente
    const check7d = await check7DayRule(apiBaseUrl, cleanUser);
    if (check7d && check7d.eligible === false) {
      hudCurrentAction.innerText = `[⚡ Automação] @${cleanUser} já contatada recentemente. Pulando...`;
      addDiagLog('info', `@${cleanUser} pulada: regra dos 7 dias / blacklist.`);
      await logActivity({ username: cleanUser, status: 'Pulada (7d)' });
      await window.InnfluCrawler.sleep(1000);
      if (remainingQueue.length > 0) {
        openProfileSafe(remainingQueue[0]);
      } else {
        window.InnfluCrawler.navigateToSource(bot.miningSource || 'hashtag', bot.miningTarget || 'provador');
      }
      return;
    }

    // Já está no banco? Confere a conversa: se ela respondeu, descarta; se não respondeu, envia nova mensagem
    if (wasKnown) {
      hudCurrentAction.innerText = `[⚡ Automação] @${cleanUser} já está no banco. Conferindo a conversa...`;
      let thread = null;
      try {
        window.InnfluIsSendingDM = true;
        thread = await window.InnfluSender.inspectThread(cleanUser);
      } catch (e) {
        thread = null;
      } finally {
        window.InnfluIsSendingDM = false;
      }

      if (thread && thread.opened && thread.hasIncoming) {
        addDiagLog('info', `@${cleanUser} já respondeu à captação. Descartada.`);
        hudCurrentAction.innerText = `[⚡ Automação] @${cleanUser} já respondeu. Descartando...`;
        await logActivity({ username: cleanUser, status: 'Descartada (já respondeu 💬)' });
        await addRejected(cleanUser, 'respondeu');
        await updateLocalLeadStatus(cleanUser, 'respondeu');
        try {
          await innfluApiFetch('/api/leads', { method: 'POST', body: JSON.stringify({ username: cleanUser, status: 'respondeu' }) });
        } catch (e) {}
        await saveBot({ queue: remainingQueue, visited: Array.from(visitedSet).slice(-1000) });
        await window.InnfluCrawler.sleep(800);
        if (remainingQueue.length > 0) {
          openProfileSafe(remainingQueue[0]);
        } else {
          window.InnfluCrawler.navigateToSource(bot.miningSource || 'hashtag', bot.miningTarget || 'provador');
        }
        return;
      }

      if (thread && thread.opened && thread.hasOutgoing) {
        addDiagLog('info', `@${cleanUser} já recebeu mensagem e não respondeu. Enviando nova mensagem.`);
      }
    }

    // Perfil 100% qualificado: Salva no D1 e no CRM local
    await saveLead(apiBaseUrl, profile, 'minerada', currentNiche);
    await cacheLocalLead(profile, 'minerada', currentNiche);

    const newMined = (bot.minedCount || 0) + 1;
    await saveBot({
      minedCount: newMined,
      queue: remainingQueue,
      visited: Array.from(visitedSet).slice(-1000)
    });
    hudMinedCount.innerText = newMined;

    // Disparo de Mensagem no Story com Spintax
    try {
      window.InnfluIsSendingDM = true;
      const fallbackTpl = '{Olá|Oi|Oie} {nome}! {Tudo bem com você?|Como você está?|Tudo certinho?} {Adorei seu perfil|Achei seu conteúdo incrível}! Gostaria de te convidar para uma publicidade nos stories de um infoproduto digital. {Podemos conversar a respeito?|Topa saber mais detalhes?}';
      const tplMessageTab = hudTemplateContent ? hudTemplateContent.value : '';
      const tplAutoTab = hudAutoTemplateContent ? hudAutoTemplateContent.value : '';
      // Mineração usa a mensagem de referência da aba "Mensagem"; Automação usa a da própria aba
      const chosenTemplate = ((bot.activeMode === 'miner'
        ? (tplMessageTab || activeTemplate || tplAutoTab)
        : (tplAutoTab || activeTemplate || tplMessageTab)) || fallbackTpl).trim();
      const msg = window.InnfluSpintax.interpolate(chosenTemplate, { 
        username: cleanUser, 
        nome: profile.fullName || cleanUser,
        fullName: profile.fullName 
      });

      hudCurrentAction.innerText = `[Automação] Digitando mensagem nos stories de @${cleanUser}...`;
      const sendRes = await window.InnfluSender.sendDirectMessage(msg);
      window.InnfluIsSendingDM = false;

      // SÓ ENTRA AQUI SE FOI 100% CONFIRMADO O ENVIO DA MENSAGEM NO STORY
      const newSent = (bot.sentCount || 0) + 1;
      await saveBot({ sentCount: newSent });
      hudSentTodayCount.innerText = `${newSent} / ${bot.dailyLimit || 40}`;
      const tagStatus = sendRes && sendRes.viaStory ? 'Story Respondido ⚡' : 'DM Enviada ✓';
      await logActivity({ username: cleanUser, status: tagStatus });
      await updateLocalLeadStatus(cleanUser, 'contatada');
      const viaLabel = sendRes && sendRes.viaStory ? 'Story' : 'DM';
      showToast({ type: 'success', title: `Captação Enviada! @${cleanUser}`, message: sendRes && sendRes.viaStory ? 'Story respondido com a mensagem de captação.' : 'Mensagem enviada por DM (Story indisponível).' });
      addDiagLog('success', `Captação enviada para @${cleanUser} via ${viaLabel}!${sendRes && sendRes.verified === false ? ' (⚠ não foi possível conferir na conversa)' : sendRes && sendRes.verified ? ' (conferida na conversa ✓)' : ''}${sendRes && sendRes.storyError ? ' (Story falhou: ' + sendRes.storyError + ')' : ''}`);

      // Registra no Cloudflare D1
      try {
        await innfluApiFetch('/api/log-sent', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUser, message_text: msg, status: 'success' })
        });
        await innfluApiFetch('/api/dm/increment', { method: 'POST' });
      } catch (e) {}

      // Se bateu a meta diária após este envio, para imediatamente
      if (newSent >= (bot.dailyLimit || 40)) {
        await stopAutomationGracefully('daily_limit', 'Meta diária de envios alcançada com sucesso!');
        return;
      }

      // ENTRA NO DESCANSO ANTI-BAN SOMENTE APÓS CONFIRMAÇÃO DO ENVIO
      const minS = Math.max(5, parseInt(bot.minDelaySec, 10) || 60);
      const maxS = Math.max(minS, parseInt(bot.maxDelaySec, 10) || 120);
      const delaySec = Math.floor(Math.random() * (maxS - minS + 1)) + minS;
      const nextAt = Date.now() + delaySec * 1000;
      await saveBot({ nextActionAt: nextAt });
      hudCurrentAction.innerText = `[Automação] Descanso anti-ban (${delaySec}s) antes da próxima...`;
      startCountdown(nextAt, () => {
        if (remainingQueue.length > 0) {
          openProfileSafe(remainingQueue[0]);
        } else {
          window.InnfluCrawler.navigateToSource(bot.miningSource || 'hashtag', bot.miningTarget || 'provador');
        }
      }, delaySec * 1000);
      return;
    } catch (err) {
      window.InnfluIsSendingDM = false;
      const isBlocked = err.message && (err.message.includes('bloque') || err.message.includes('blocked') || err.message.includes('checkpoint'));
      if (isBlocked) {
        showSafetyBanner('Bloqueio Detectado', err.message);
        addDiagLog('error', `Bloqueio detectado no Instagram: ${err.message}`);
        await stopAutomationGracefully('blocked', 'Ação bloqueada temporariamente pelo Instagram.');
        return;
      }

      // NÃO FOI ENVIADA! Não entra no descanso anti-ban longo!
      console.warn('[Innflu] Falha ao enviar Story para @' + cleanUser + ':', err.message);
      await logActivity({ username: cleanUser, status: `Não Enviada (${err.message.substring(0, 24)})` });
      showToast({ type: 'warning', title: `Story Não Respondido (@${cleanUser})`, message: err.message });
      
      const retryDelay = 4;
      const nextAt = Date.now() + retryDelay * 1000;
      await saveBot({ nextActionAt: nextAt });
      hudCurrentAction.innerText = `[Automação] Pulando @${cleanUser}...`;
      startCountdown(nextAt, () => {
        if (remainingQueue.length > 0) {
          openProfileSafe(remainingQueue[0]);
        } else {
          window.InnfluCrawler.navigateToSource(bot.miningSource || 'hashtag', bot.miningTarget || 'provador');
        }
      }, retryDelay * 1000);
      return;
    } finally {
      window.InnfluIsSendingDM = false;
    }
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
        saveBot({ nextActionAt: null }).then(() => {
          callback();
        });
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
            await handleNoNewCandidates(currentProfileUser);
            return;
          }
        }

        // Se ainda temos semelhantes na fila, abre o próximo!
        const currentQueue = (bot.queue || []).filter(u => u !== currentProfileUser);
        if (currentQueue.length > 0) {
          const nextTarget = currentQueue[0];
          hudCurrentAction.innerText = `Abrindo próxima semelhante: @${nextTarget}...`;
          openProfileSafe(nextTarget);
          return;
        }

        // Fila esgotada
        if (bot.activeMode === 'auto' || bot.activeMode === 'miner') {
          // No modo de automação contínua, ramifica minerando semelhantes da última influenciadora visitada
          const visitedList = (bot.visited || []).filter(u => u && u.toLowerCase() !== targetClean);
          if (visitedList.length > 0) {
            const nextPivot = visitedList[visitedList.length - 1].toLowerCase();
            hudCurrentAction.innerText = `[⚡ Automação] Ramificando busca: extraindo semelhantes a @${nextPivot}...`;
            showToast({ type: 'info', title: 'Ramificação Contínua', message: `Buscando novas semelhantes a partir de @${nextPivot}...` });
            await saveBot({ miningTarget: nextPivot, queue: [] });
            openProfileSafe(nextPivot);
            return;
          }
        }

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
            await handleNoNewCandidates(currentProfileUser);
            return;
          }
        }

        const currentQueue = (bot.queue || []).filter(u => u !== currentProfileUser);
        if (currentQueue.length > 0) {
          const nextTarget = currentQueue[0];
          hudCurrentAction.innerText = `Abrindo influenciadora que ela segue: @${nextTarget}...`;
          openProfileSafe(nextTarget);
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
        openProfileSafe(nextTarget);
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
      openProfileSafe(nextUser);
      return;
    }

    // ========================================================
    // 3. FONTE: ✨ Semelhantes ou 👥 Seguindo -> se não está no perfil alvo, navega até ele
    // ========================================================
    if ((source === 'similar' || source === 'following' || source === 'followers') && targetClean) {
      if (currentProfileUser !== targetClean) {
        hudCurrentAction.innerText = `Navegando até o perfil de referência @${targetClean}...`;
        openProfileSafe(targetClean);
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
        const currentQueue = bot.queue || [];
        const cleanAuthor = author.toLowerCase();
        const updatedQueue = [cleanAuthor, ...currentQueue.filter(u => u.toLowerCase() !== cleanAuthor)];
        await saveBot({ queue: updatedQueue });
        await window.InnfluCrawler.sleep(1200);
        openProfileSafe(author);
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

      const visitedUsers = new Set([...(bot.visited || []), ...Array.from(rejectedCache)]);
      const visitedPosts = new Set((bot.visitedPosts || []).map(h => window.InnfluCrawler.normalizePostHref(h)));

      // ABERTURA PRECISA POST A POST (ZERO ADIVINHAÇÃO):
      // Abre cada publicação diretamente para extrair o @username oficial e exato da criadora
      const nextPost = window.InnfluCrawler.getNextUnvisitedPost(Array.from(visitedPosts));

      if (!nextPost) {
        const stallCount = (bot.searchStallCount || 0) + 1;
        await saveBot({ searchStallCount: stallCount });

        // Se houver alguém na fila pendente, atende a fila imediatamente antes de rolar mais
        const currentQueue = bot.queue || [];
        if (currentQueue.length > 0) {
          const nextTarget = currentQueue[0];
          hudCurrentAction.innerText = `Processando próxima criadora da fila: @${nextTarget}...`;
          addDiagLog('info', `Fila ativa (${currentQueue.length} alvos). Abrindo @${nextTarget}...`);
          await window.InnfluCrawler.sleep(800);
          window.InnfluCrawler.openProfile(nextTarget);
          return;
        }

        // PROSPECÇÃO CONTÍNUA (NUNCA PARA DO NADA):
        // Se ainda não encontrou post inédito na tela, rola vigorosamente para carregar novas publicações
        if (stallCount <= 5) {
          hudCurrentAction.innerText = `Rolando feed para carregar mais publicações de "${target}" (${stallCount})...`;
          await window.InnfluCrawler.scrollDown(1.2);
          await window.InnfluCrawler.sleep(1800);
        } else if (stallCount <= 9) {
          // Destrava virtualizer do Instagram fazendo rolagem dinâmica
          hudCurrentAction.innerText = `Destravando feed para puxar novas criadoras (${stallCount})...`;
          await window.InnfluCrawler.kickFeedScroll();
          await window.InnfluCrawler.scrollDown(1.5);
          await window.InnfluCrawler.sleep(2000);
        } else {
          // Se após 10 rolagens o Instagram não renderizou nós novos, recarrega suavemente a busca para trazer posts recentes
          hudCurrentAction.innerText = `Atualizando busca para trazer novas publicações de "${target}"...`;
          addDiagLog('info', `Feed de "${target}" atualizado para buscar novas publicações.`);
          await saveBot({ searchStallCount: 0 });
          await window.InnfluCrawler.sleep(1000);
          window.location.reload();
          return;
        }

        const retryPost = window.InnfluCrawler.getNextUnvisitedPost(Array.from(visitedPosts));
        if (!retryPost) {
          scheduleNext(2000);
          return;
        }
        await saveBot({ searchStallCount: 0 });
        return handleInspectPostElement(retryPost, visitedPosts, visitedUsers, source, target, apiBaseUrl);
      }

      await saveBot({ searchStallCount: 0 });
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
    addDiagLog('info', `Inspecionando publicação: ${href}`);

    // VERIFICAÇÃO RÁPIDA: A publicação já traz @username no alt da imagem?
    let author = null;
    const innerImg = element.querySelector('img[alt]');
    if (innerImg) {
      const altText = innerImg.getAttribute('alt') || '';
      const atMatch = altText.match(/@([a-zA-Z0-9._]{3,30})/);
      if (atMatch && window.InnfluCrawler.isValidUsername(atMatch[1])) {
        author = atMatch[1].toLowerCase();
        addDiagLog('info', `Autor extraído diretamente do alt-text: @${author}`);
      }
    }

    let curPath = window.location.pathname.toLowerCase();

    // Se não encontrou no alt text, abre a publicação para inspecionar
    if (!author) {
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
      await window.InnfluCrawler.sleep(300);

      // Clica UMA VEZ no elemento do post
      if (window.InnfluSender && typeof window.InnfluSender.simulateClick === 'function') {
        window.InnfluSender.simulateClick(element);
      } else {
        element.click();
      }

      // Aguarda o modal ou página do post carregar no DOM (até 4000ms)
      for (let t = 0; t < 16; t++) {
        await window.InnfluCrawler.sleep(250);
        curPath = window.location.pathname.toLowerCase();
        if (curPath.startsWith('/p/') || curPath.startsWith('/reel/')) {
          const directNorm = window.InnfluCrawler.normalizePostHref(curPath);
          visitedPostsSet.add(directNorm);
        }
        author = window.InnfluCrawler.extractPostAuthor();
        if (author) break;

        // Se após 1.5s o modal ainda não abriu, tenta fallback no link <a> direto
        if (t === 6 && !document.querySelector('div[role="dialog"]') && !curPath.startsWith('/p/') && !curPath.startsWith('/reel/')) {
          const anchor = element.tagName === 'A' ? element : element.closest('a') || element.querySelector('a');
          if (anchor) {
            addDiagLog('info', 'Tentando clique direto no link do post como fallback...');
            anchor.click();
          }
        }
      }
    }

    if (author) {
      const authorLower = author.toLowerCase();
      addDiagLog('success', `Autor do post identificado: @${author}`);

      // Checagem imediata de empresa corporativa / lojas comerciais (C&A, Renner, Magalu, etc.)
      const isBrand = window.InnfluGenderDetector && typeof window.InnfluGenderDetector.isCorporateBrand === 'function' && window.InnfluGenderDetector.isCorporateBrand(authorLower);
      if (isBrand) {
        hudCurrentAction.innerText = `@${author} é empresa/marca comercial. Descartando...`;
        addDiagLog('warn', `@${author} descartada por ser marca/empresa comercial.`);
        await logActivity({ username: author, status: 'Descartada (Empresa/Loja)' });
        visitedUsersSet.add(authorLower);
        await saveBot({ visited: Array.from(visitedUsersSet).slice(-1000) });
      } else {
        // VERIFICAÇÃO INSTANTÂNEA: Está no CRM ou já foi visitada?
        const isAlreadyInCRM = visitedUsersSet.has(authorLower) || rejectedCache.has(authorLower);

        if (isAlreadyInCRM) {
          hudCurrentAction.innerText = `@${author} já está no CRM / visitada. Descartando na hora! ⚡`;
          addDiagLog('info', `@${author} já consta no CRM ou histórico de visitadas.`);
          await logActivity({ username: author, status: 'Descartada (Já no CRM ⚡)' });
        } else {
          // Checagem de elegibilidade da regra dos 7 dias antes de abrir perfil
          const check7d = await check7DayRule(apiBaseUrl, authorLower);
          if (!check7d.eligible) {
            hudCurrentAction.innerText = `@${author} contatada nos últimos 7 dias. Descartando na hora! ⚡`;
            addDiagLog('info', `@${author} contatada nos últimos 7 dias.`);
            visitedUsersSet.add(authorLower);
            knownCRMUsersCache.add(authorLower);
            await saveBot({ visited: Array.from(visitedUsersSet).slice(-1000) });
            await logActivity({ username: author, status: 'Descartada (Regra 7d ⚡)' });
          } else {
            // ELEGÍVEL E INÉDITA! Adiciona na fila e abre o perfil para auditar e contatar!
            hudCurrentAction.innerText = `Criadora confirmada: @${author}! Abrindo perfil...`;
            addDiagLog('success', `Nova criadora elegível: @${author}! Abrindo perfil...`);
            const { bot: latestBot } = await getState();
            const currentQueue = (latestBot && latestBot.queue) || [];
            const updatedQueue = [authorLower, ...currentQueue.filter(u => u.toLowerCase() !== authorLower)];
            await saveBot({ queue: updatedQueue });
            await window.InnfluCrawler.sleep(400);
            openProfileSafe(author);
            return;
          }
        }
      }
    } else {
      hudCurrentAction.innerText = 'Não foi possível ler o autor deste post. Próximo...';
      addDiagLog('warn', `Autor não identificado no post (${href}). Avançando para próximo post.`);
    }

    // Fecha modal ou volta se navegou
    if (curPath.startsWith('/p/') || curPath.startsWith('/reel/')) {
      window.history.back();
      await window.InnfluCrawler.sleep(1200);
    } else if (document.querySelector('div[role="dialog"]')) {
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
    const visitedSet = new Set((bot.visited || []).map(u => (u || '').toLowerCase()));

    // 1. Tenta buscar da API remota Cloudflare D1
    try {
      const res = await innfluApiFetch('/api/leads?status=minerada');
      if (res.ok) {
        const data = await res.json();
        if (data.leads && Array.isArray(data.leads)) {
          const eligibleRemote = data.leads.find(l => l && l.username && !visitedSet.has(l.username.toLowerCase()));
          if (eligibleRemote) target = eligibleRemote;
        }
      }
    } catch (e) {}

    // 2. Se a API remota não tiver ou falhar, busca AUTOMATICAMENTE dos Leads Minerados salvos na barra local
    if (!target) {
      const { savedLeads } = await getState();
      const localLeads = savedLeads || cachedLeads || [];
      const pendingLead = localLeads.find(l => {
        const u = (l.username || '').toLowerCase();
        const s = (l.status || '').toLowerCase();
        const isPending = s === 'minerada' || s === 'pendente' || s === 'qualificada' || (!s.includes('contatad') && !s.includes('enviad') && !s.includes('skip'));
        return u && isPending && !visitedSet.has(u);
      });

      if (pendingLead) {
        target = pendingLead;
      }
    }

    // 3. Fallback: se houver criadoras na fila do bot que ainda não foram visitadas
    if (!target && bot.queue && bot.queue.length > 0) {
      const nextUser = bot.queue.find(u => u && !visitedSet.has(u.toLowerCase()));
      if (nextUser) {
        target = { username: nextUser };
      }
    }

    if (!target || !target.username) {
      showToast({ type: 'info', title: 'Fila de Envio Vazia', message: 'Nenhuma influenciadora pendente encontrada na lista de leads. Minere novas criadoras primeiro!' });
      await saveBot({ isRunning: false, activeMode: null });
      syncUI({ ...bot, isRunning: false, activeMode: null });
      return;
    }

    // Regra dos 7 dias
    const check = await check7DayRule(apiBaseUrl, target.username);
    if (!check.eligible) {
      hudCurrentAction.innerText = `@${target.username} contatada recentemente. Pulando...`;
      await logActivity({ username: target.username, status: 'Pulada (7d)' });
      try {
        await innfluApiFetch('/api/leads', {
          method: 'POST',
          body: JSON.stringify({ username: target.username, status: 'skipped' })
        });
      } catch (e) {}
      scheduleNext(3000);
      return;
    }

    if (pageType !== 'profile' || window.InnfluCrawler.getCurrentProfileUsername() !== target.username) {
      hudCurrentAction.innerText = `Navegando até @${target.username}...`;
      openProfileSafe(target.username);
      return;
    }

    // No perfil: dispara DM
    await dispatchDM(target.username, apiBaseUrl, activeTemplate);
  }

  async function dispatchDM(username, apiBaseUrl, template) {
    try {
      window.InnfluIsSendingDM = true;
      let chosenTemplate = template;
      try {
        const tmplRes = await innfluApiFetch('/api/templates');
        if (tmplRes.ok) {
          const tmplData = await tmplRes.json();
          if (tmplData.templates && tmplData.templates.length > 0) {
            const { bot } = await getState();
            const idx = (bot.sentCount || 0) % tmplData.templates.length;
            chosenTemplate = tmplData.templates[idx].content || template;
          }
        }
      } catch (e) {}

      // Busca nome real do perfil se disponível para interpolação
      let influencerName = username;
      try {
        if (window.InnfluCrawler && typeof window.InnfluCrawler.getCurrentProfileFullName === 'function') {
          const profileName = window.InnfluCrawler.getCurrentProfileFullName();
          if (profileName) influencerName = profileName;
        }
      } catch (e) {}

      const msg = window.InnfluSpintax.interpolate(chosenTemplate, { username, nome: influencerName, fullName: influencerName });
      hudCurrentAction.innerText = `Digitando mensagem para @${username}...`;
      const sendRes = await window.InnfluSender.sendDirectMessage(msg);
      window.InnfluIsSendingDM = false;

      const cleanUser = username.toLowerCase();
      const { bot } = await getState();
      const newSent = (bot.sentCount || 0) + 1;
      const visitedList = [...(bot.visited || []), cleanUser];
      const remainingQueue = (bot.queue || []).filter(u => u && u.toLowerCase() !== cleanUser);

      await saveBot({
        sentCount: newSent,
        visited: Array.from(new Set(visitedList)).slice(-1000),
        queue: remainingQueue
      });

      hudSentTodayCount.innerText = `${newSent} / ${bot.dailyLimit || 40}`;
      hudQueueCount.innerText = remainingQueue.length;
      const tagStatus = sendRes && sendRes.viaStory ? 'Story Respondido ⚡' : 'DM Enviada ✉️';
      await logActivity({ username: cleanUser, status: tagStatus });
      await updateLocalLeadStatus(cleanUser, 'contatada');
      showToast({ type: 'success', title: `Captação Enviada! @${cleanUser}`, message: sendRes && sendRes.viaStory ? 'Story respondido com sucesso.' : 'Digitação humana concluída.' });

      try {
        await innfluApiFetch('/api/leads', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUser, status: 'contatada' })
        });
        await innfluApiFetch('/api/log-sent', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUser, message_text: msg, status: 'success' })
        });
        await innfluApiFetch('/api/dm/increment', { method: 'POST' });
      } catch (e) {}

      // Delay seguro anti-ban (respeitando configuração do usuário)
      const minS = Math.max(5, parseInt(bot.minDelaySec, 10) || 60);
      const maxS = Math.max(minS, parseInt(bot.maxDelaySec, 10) || 120);
      const delaySec = Math.floor(Math.random() * (maxS - minS + 1)) + minS;
      const nextAt = Date.now() + delaySec * 1000;
      await saveBot({ nextActionAt: nextAt });
      hudCurrentAction.innerText = `Pausa anti-ban (${delaySec}s)...`;
      startCountdown(nextAt, runLoop, delaySec * 1000);
    } catch (err) {
      window.InnfluIsSendingDM = false;
      console.warn('[Innflu] Falha ao enviar DM na Captação:', err.message);
      await logActivity({ username, status: `Não Enviada (${err.message.substring(0, 24)})` });
      showToast({ type: 'warning', title: 'Falha no Envio', message: err.message });
      const nextAt = Date.now() + 6000;
      await saveBot({ nextActionAt: nextAt });
      startCountdown(nextAt, runLoop, 6000);
    } finally {
      window.InnfluIsSendingDM = false;
    }
  }

  function scheduleNext(ms) {
    if (window.__innfluNextScheduleTimer) {
      clearTimeout(window.__innfluNextScheduleTimer);
      window.__innfluNextScheduleTimer = null;
    }
    window.__innfluNextScheduleTimer = setTimeout(() => {
      window.__innfluNextScheduleTimer = null;
      runLoop();
    }, ms);
  }

  // ==========================================
  // GERENCIAMENTO DA LISTA DE LEADS
  // ==========================================
  async function updateLocalLeadStatus(username, newStatus) {
    try {
      const cleanUser = (username || '').toLowerCase();
      const { savedLeads } = await getState();
      const leads = savedLeads || cachedLeads || [];
      const idx = leads.findIndex(l => (l.username || '').toLowerCase() === cleanUser);
      if (idx >= 0) {
        leads[idx].status = newStatus;
        leads[idx].last_contacted_at = new Date().toISOString();
        cachedLeads = [...leads];
        await chrome.storage.local.set({ savedLeadsCache: cachedLeads });
        updateLeadsCountHeader(cachedLeads);
        renderLeadsTable();
      }
    } catch (e) {}
  }

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
        const res = await innfluApiFetch('/api/leads');
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

      const isContacted = l.status === 'contatada' || l.status === 'enviada';
      const statusBadge = isContacted 
        ? `<span class="innflu-lead-followers" style="background:rgba(16,185,129,0.18);color:#34d399;border:1px solid rgba(16,185,129,0.3);font-size:9px;">✉️ Contatada</span>`
        : `<span class="innflu-lead-followers" style="background:rgba(245,158,11,0.18);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);font-size:9px;">⚡ Na Fila</span>`;

      return `
        <div class="innflu-lead-card">
          <div class="innflu-lead-top">
            <a href="https://www.instagram.com/${l.username}/" target="_blank" class="innflu-lead-user">
              @${l.username} ↗
            </a>
            <div style="display:flex;align-items:center;gap:4px;">
              ${statusBadge}
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

        const res = await innfluApiFetch('/api/leads/import', {
          method: 'POST',
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

  if ($('btnSendDMsToLeads')) {
    $('btnSendDMsToLeads').onclick = () => {
      switchTab('sender');
      if (btnToggleSender) {
        btnToggleSender.click();
      }
    };
  }

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
  // HELPERS DE REDE & API (SINCRONIZAÇÃO CLOUDFLARE D1)
  // ==========================================
  async function check7DayRule(arg1, arg2) {
    const username = (typeof arg2 === 'string' ? arg2 : arg1 || '').replace('@', '').trim().toLowerCase();
    if (!username) return { eligible: true };
    try {
      const res = await innfluApiFetch('/api/check-lead', {
        method: 'POST',
        body: JSON.stringify({ username })
      });
      return await res.json();
    } catch (e) { return { eligible: true }; }
  }

  async function saveLead(arg1, arg2, arg3, arg4) {
    const profile = (typeof arg1 === 'object' && arg1 !== null) ? arg1 : arg2;
    const status = (typeof arg1 === 'object' && arg1 !== null) ? arg2 : arg3;
    const niche = (typeof arg1 === 'object' && arg1 !== null) ? arg3 : arg4;
    if (!profile || !profile.username) return;

    try {
      const leadPayload = {
        username: profile.username.replace('@', '').trim().toLowerCase(),
        full_name: profile.fullName || profile.full_name || '',
        followers_count: profile.followersCount || profile.followers_count || 0,
        has_active_stories: (profile.hasActiveStories || profile.has_active_stories) ? 1 : 0,
        detected_gender: profile.isFemale ? 'female' : (profile.detected_gender || 'unknown'),
        whatsapp: profile.whatsapp || null,
        email: profile.email || null,
        bio: profile.bio || '',
        niche: niche || profile.niche || 'Geral',
        status: status || 'minerada'
      };

      const res = await innfluApiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(leadPayload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      logDiagnostics('info', `Lead @${profile.username} salvo no Cloudflare D1.`);
    } catch (e) {
      logDiagnostics('warn', `Buffer offline para @${profile.username}: ${e.message}`);
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
  async function flushPendingLeadsBuffer() {
    try {
      const stored = await chrome.storage.local.get('pendingLeadsBuffer');
      const buf = stored.pendingLeadsBuffer || [];
      if (buf.length === 0) return;

      const res = await innfluApiFetch('/api/leads/import', {
        method: 'POST',
        body: JSON.stringify({ leads: buf })
      });

      if (res.ok) {
        await chrome.storage.local.set({ pendingLeadsBuffer: [] });
        logDiagnostics('info', `Sincronizados ${buf.length} leads pendentes no Cloudflare D1.`);
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
  getState().then(async ({ bot, apiBaseUrl, activeTemplate, savedLeads }) => {
    await loadRejected();
    // 1. Checa e aplica autenticação obrigatória (bloqueia o robô até login ativo)
    const isAuth = await checkAndApplyAuth();

    const DEFAULT_UNIVERSAL_TEMPLATE = 
      '{Olá|Oi|Oie} {nome}! {Tudo bem com você?|Como você está?|Tudo certinho?}\n\n' +
      '{Adorei seu perfil|Achei seu conteúdo incrível|Vi seu perfil e amei seu trabalho}!\n\n' +
      'Gostaria de saber se você faz publicidade nos stories. Temos uma proposta de publicidade nos stories de um infoproduto digital.\n\n' +
      '{Podemos conversar a respeito?|Topa saber mais detalhes?|Você tem disponibilidade?}';

    if (!activeTemplate || 
        activeTemplate.toLowerCase().includes('maternidade') || 
        activeTemplate.toLowerCase().includes('produtos') || 
        activeTemplate.toLowerCase().includes('produto') || 
        activeTemplate.toLowerCase().includes('sem nenhum custo')) {
      activeTemplate = DEFAULT_UNIVERSAL_TEMPLATE;
      try { chrome.storage.local.set({ activeTemplate }); } catch (e) {}
    }

    if (hudTemplateContent) {
      hudTemplateContent.value = activeTemplate;
      hudTemplateContent.scrollTop = 0;
      autoExpandTextarea(hudTemplateContent);
    }
    if (hudAutoTemplateContent) {
      hudAutoTemplateContent.value = activeTemplate;
      hudAutoTemplateContent.scrollTop = 0;
      autoExpandTextarea(hudAutoTemplateContent);
    }
    if (bot.minDelaySec && inputAutoMinDelay) inputAutoMinDelay.value = bot.minDelaySec.toString();
    if (bot.maxDelaySec && inputAutoMaxDelay) inputAutoMaxDelay.value = bot.maxDelaySec.toString();
    if (savedLeads && savedLeads.length > 0) {
      cachedLeads = savedLeads;
      updateLeadsCountHeader(savedLeads);
    }
    syncUI(bot);
    
    if (isAuth) {
      flushPendingLeadsBuffer();
      syncKnownCRMUsers();
    }

    if (isAuth && bot.isRunning) {
      console.log('[Innflu] Retomando operação automática após recarregamento...');
      setTimeout(runLoop, 2500);
    }
  });

  // Observador de navegação SPA do Instagram (re-engaja o loop em transições internas sem recarregar)
  let lastObservedUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastObservedUrl) {
      lastObservedUrl = window.location.href;
      if (window.InnfluIsSendingDM) {
        // Envio ativo no momento, não interfere com o loop
        return;
      }
      if (localBotCache && localBotCache.isRunning && !localBotCache.isPaused) {
        if (!localBotCache.nextActionAt || localBotCache.nextActionAt <= Date.now()) {
          setTimeout(runLoop, 1800);
        }
      }
    }
  }, 1000);

})();
