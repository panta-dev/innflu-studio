/**
 * Innflu Background Service Worker (Manifest V3)
 * Gerencia a fila de disparos, alarmes seguros (60s a 180s) e sincronização com o Cloudflare D1
 */

// Configurações padrão
const DEFAULT_CONFIG = {
  apiBaseUrl: 'https://innflu-studio.pages.dev',
  apiToken: 'innflu_secret_token_12345',
  dailyCount: 0,
  dailyLimit: 40,
  minDelaySec: 60,
  maxDelaySec: 180,
  activeCampaignKeyword: 'provador',
  lastResetDate: new Date().toISOString().split('T')[0]
};

// Inicialização de armazenamento e checagem de atualizações OTA
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  let effectiveBaseUrl = current.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
  if (!effectiveBaseUrl || effectiveBaseUrl.includes('127.0.0.1') || effectiveBaseUrl.includes('localhost')) {
    effectiveBaseUrl = 'https://innflu-studio.pages.dev';
  }
  await chrome.storage.local.set({ ...DEFAULT_CONFIG, ...current, apiBaseUrl: effectiveBaseUrl });
  console.log('[Innflu] Service Worker instalado e configurado.');

  // Cria alarme para verificar atualizações OTA a cada 15 minutos
  chrome.alarms.create('innflu_ota_update_check', { periodInMinutes: 15 });
  checkForRemoteUpdates();
});

// Checa atualizações OTA silenciosamente ao abrir ou navegar no Instagram
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('instagram.com')) {
    chrome.storage.local.get(['lastUpdateCheck'], (data) => {
      const now = Date.now();
      const last = data.lastUpdateCheck || 0;
      if (now - last > 10 * 60 * 1000) { // a cada 10 min de navegação
        checkForRemoteUpdates();
      }
    });
  }
});

// Fila de execução em memória
let executionQueue = [];
let isCycleActive = false;

// Ouvinte de mensagens do Content Script / Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_AUTONOMOUS_CYCLE') {
    handleStartCycle(sendResponse);
    return true; // resposta assíncrona
  }

  if (request.action === 'STOP_AUTONOMOUS_CYCLE') {
    isCycleActive = false;
    chrome.alarms.clear('innflu_next_send');
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'GET_STATUS') {
    chrome.storage.local.get(null, (data) => {
      sendResponse({ ...data, isCycleActive });
    });
    return true;
  }

  // Recarregar extensão em 1 clique (para desenvolvedores e usuários unpacked)
  if (request.action === 'RELOAD_EXTENSION') {
    console.log('[Innflu OTA] 🔄 Recarregando extensão...');
    sendResponse({ success: true });
    setTimeout(() => {
      chrome.runtime.reload();
    }, 200);
    return true;
  }

  // Forçar checagem imediata de atualizações OTA
  if (request.action === 'CHECK_UPDATES_NOW') {
    checkForRemoteUpdates().then(info => {
      sendResponse({ success: true, info });
    });
    return true;
  }
});

/**
 * Inicia ciclo de prospecção
 */
async function handleStartCycle(sendResponse) {
  const config = await chrome.storage.local.get(null);

  // 0. Trava de autenticação obrigatória
  if (!config.authToken && !config.apiToken) {
    sendResponse({ error: 'Login obrigatório. Faça login com sua conta do Innflu Studio para iniciar o robô.' });
    return;
  }

  // 1. Reseta contagem se mudou o dia
  const today = new Date().toISOString().split('T')[0];
  if (config.lastResetDate !== today) {
    config.dailyCount = 0;
    config.lastResetDate = today;
    await chrome.storage.local.set({ dailyCount: 0, lastResetDate: today });
  }

  // 2. Trava de segurança diária
  if (config.dailyCount >= (config.dailyLimit || 40)) {
    sendResponse({ error: `Meta diária de segurança atingida (${config.dailyCount}/${config.dailyLimit} DMs). Evite novos envios hoje para proteger sua conta!` });
    return;
  }

  isCycleActive = true;
  sendResponse({ success: true, message: 'Ciclo iniciado!' });

  // Dispara o próximo passo
  processNextStep();
}

/**
 * Processa a próxima ação (1 a 1 com atrasos humanos)
 */
async function processNextStep() {
  if (!isCycleActive) return;

  const config = await chrome.storage.local.get(null);

  // Verifica novamente limite diário
  if (config.dailyCount >= (config.dailyLimit || 40)) {
    isCycleActive = false;
    notifyTabs({
      status: 'Meta diária atingida! Automação concluída com segurança.',
      currentUser: 'Fim do expediente de hoje'
    });
    return;
  }

  // Encontra aba ativa do Instagram
  const tabs = await chrome.tabs.query({ url: '*://www.instagram.com/*' });
  if (!tabs || tabs.length === 0) {
    notifyTabs({ status: 'Abra o Instagram Web para continuar' });
    isCycleActive = false;
    return;
  }

  const activeTab = tabs[0];

  // Gera delay seguro randômico entre minDelaySec e maxDelaySec (60s a 180s)
  const minDelay = config.minDelaySec || 60;
  const maxDelay = config.maxDelaySec || 180;
  const chosenDelaySeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  notifyTabs({
    status: `Aguardando delay humano seguro...`,
    countdownSeconds: chosenDelaySeconds,
    dailyCount: config.dailyCount,
    dailyLimit: config.dailyLimit
  });

  // Agenda alarme para o próximo envio
  chrome.alarms.create('innflu_next_send', { delayInMinutes: chosenDelaySeconds / 60 });
}

// Ouvinte de alarmes
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'innflu_next_send' && isCycleActive) {
    await executeSendingStep();
  }
  if (alarm.name === 'innflu_ota_update_check') {
    await checkForRemoteUpdates();
  }
});

/**
 * Executa a tentativa de envio na aba do Instagram
 */
async function executeSendingStep() {
  const tabs = await chrome.tabs.query({ url: '*://www.instagram.com/*' });
  if (!tabs || tabs.length === 0) return;

  const targetTab = tabs[0];
  const config = await chrome.storage.local.get(null);

  try {
    // 1. Mensagem para o content script avaliar e enviar
    const response = await chrome.tabs.sendMessage(targetTab.id, { action: 'EXECUTE_CURRENT_PROFILE_DM' });

    if (response && response.blocked) {
      // Bloqueio detectado pelo Instagram: desativa imediatamente o ciclo para proteger a conta
      isCycleActive = false;
      chrome.alarms.clear('innflu_next_send');
      notifyTabs({
        status: `🛑 PAUSA DE SEGURANÇA: Aviso do Instagram detectado (${response.message || 'Ação bloqueada'}). Automação pausada preventivamente!`,
        actionBlocked: true
      });
      return;
    }

    if (response && response.success) {
      // Incrementa contador diário
      const newDaily = (config.dailyCount || 0) + 1;
      await chrome.storage.local.set({ dailyCount: newDaily });

      notifyTabs({
        status: `DM enviada com sucesso!`,
        dailyCount: newDaily,
        dailyLimit: config.dailyLimit
      });

      // Sincroniza com Cloudflare D1
      syncSentWithCloudflare(config.apiBaseUrl, config.apiToken, response.username, response.messageText);
    }
  } catch (err) {
    console.warn('[Innflu] Falha temporária no passo:', err);
  }

  // Continua o loop para o próximo
  if (isCycleActive) {
    processNextStep();
  }
}

/**
 * Sincroniza registro de disparo no banco Cloudflare D1 com autenticação e retry
 */
async function syncSentWithCloudflare(baseUrl, apiToken, username, messageText) {
  try {
    const stored = await chrome.storage.local.get(['authToken', 'apiToken']);
    const effectiveToken = stored.authToken || stored.apiToken || apiToken;
    const headers = { 'Content-Type': 'application/json' };
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
      headers['X-API-Key'] = effectiveToken;
    }

    await fetch(`${baseUrl}/api/log-sent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username,
        message_text: messageText,
        status: 'success'
      })
    });
  } catch (err) {
    console.error('[Innflu] Erro de sincronização D1 (armazenando local):', err);
    // Armazena no buffer de sincronização para reenvio
    try {
      const data = await chrome.storage.local.get('pendingSentLogs');
      const queue = data.pendingSentLogs || [];
      queue.push({ username, message_text: messageText, status: 'success', timestamp: Date.now() });
      await chrome.storage.local.set({ pendingSentLogs: queue.slice(-100) });
    } catch (e) {}
  }
}

/**
 * Notifica os content scripts para atualizar o HUD
 */
function notifyTabs(data) {
  chrome.tabs.query({ url: '*://www.instagram.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_HUD', data }).catch(() => {});
    });
  });
}

/**
 * Compara duas versões semânticas (ex: "1.2.0" vs "1.1.0")
 */
function compareVersions(v1, v2) {
  const p1 = (v1 || '0').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = (v2 || '0').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Consulta a API Cloudflare e sincroniza regras dinâmicas e checagem de versão
 */
async function checkForRemoteUpdates() {
  try {
    const stored = await chrome.storage.local.get(['apiBaseUrl']);
    const baseUrl = (stored.apiBaseUrl || 'https://innflu-studio.pages.dev').replace(/\/$/, '');
    
    const res = await fetch(`${baseUrl}/api/extension/version?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const remoteData = await res.json();

    // 1. Aplica e armazena regras dinâmicas OTA (seletores, delays e blacklist em tempo real)
    if (remoteData.dynamicRules) {
      await chrome.storage.local.set({
        dynamicRules: remoteData.dynamicRules,
        lastRulesSync: Date.now()
      });
      console.log('[Innflu OTA] ⚡ Regras dinâmicas do Instagram atualizadas com sucesso.');
    }

    // 2. Compara versão instalada com versão do servidor
    const manifest = chrome.runtime.getManifest();
    const localVersion = manifest.version;
    const hasNewerVersion = compareVersions(remoteData.version, localVersion) > 0;

    const updateInfo = {
      remoteUpdateAvailable: hasNewerVersion,
      remoteVersion: remoteData.version,
      localVersion,
      releaseNotes: remoteData.releaseNotes || '',
      downloadUrl: remoteData.downloadUrl || `${baseUrl}/innflu-extensao.zip`,
      lastUpdateCheck: Date.now()
    };

    await chrome.storage.local.set(updateInfo);

    if (hasNewerVersion) {
      console.log(`[Innflu OTA] 🚀 Nova versão ${remoteData.version} disponível (atual: ${localVersion})`);
      notifyTabs({ type: 'OTA_UPDATE_AVAILABLE', ...updateInfo });

      // Se o Chrome tiver suporte nativo a update_url (.crx), solicita atualização imediata
      if (typeof chrome.runtime.requestUpdateCheck === 'function') {
        chrome.runtime.requestUpdateCheck((status, details) => {
          console.log('[Innflu OTA] chrome.runtime.requestUpdateCheck:', status, details);
          if (status === 'update_available') {
            chrome.runtime.reload();
          }
        });
      }
    }

    return updateInfo;
  } catch (err) {
    console.warn('[Innflu OTA] Checagem de atualizações não pôde ser completada:', err.message);
    return null;
  }
}
