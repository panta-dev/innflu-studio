/**
 * Innflu Background Service Worker (Manifest V3)
 * Gerencia a fila de disparos, alarmes seguros (60s a 180s) e sincronização com o Cloudflare D1
 */

// Configurações padrão
const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://127.0.0.1:8787',
  apiToken: 'innflu_secret_token_12345',
  dailyCount: 0,
  dailyLimit: 40,
  minDelaySec: 60,
  maxDelaySec: 180,
  activeCampaignKeyword: 'maternidade',
  lastResetDate: new Date().toISOString().split('T')[0]
};

// Inicialização de armazenamento
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  await chrome.storage.local.set({ ...DEFAULT_CONFIG, ...current });
  console.log('[Innflu] Service Worker instalado e configurado.');
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
});

/**
 * Inicia ciclo de prospecção
 */
async function handleStartCycle(sendResponse) {
  const config = await chrome.storage.local.get(null);

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
    const headers = { 'Content-Type': 'application/json' };
    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
      headers['X-API-Key'] = apiToken;
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
