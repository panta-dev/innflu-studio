/**
 * Innflu Studio — Popup Controller (v1.3.6)
 * Gerencia autenticação obrigatória, sincronização de sessão com Cloudflare D1 e métricas em tempo real.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Elementos do DOM
  const viewLoggedOut = document.getElementById('viewLoggedOut');
  const viewLoggedIn = document.getElementById('viewLoggedIn');

  // Form Login
  const formLogin = document.getElementById('formLogin');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const btnLoginText = document.getElementById('btnLoginText');
  const loginFeedback = document.getElementById('loginFeedback');

  // View Logado
  const popUserAvatar = document.getElementById('popUserAvatar');
  const popUserName = document.getElementById('popUserName');
  const popUserEmail = document.getElementById('popUserEmail');
  const popUserPlan = document.getElementById('popUserPlan');
  const popDailyCount = document.getElementById('popDailyCount');
  const popTotalLeads = document.getElementById('popTotalLeads');
  const popWaCount = document.getElementById('popWaCount');

  // Botões
  const btnOpenDashboard = document.getElementById('btnOpenDashboard');
  const btnOpenInstagram = document.getElementById('btnOpenInstagram');
  const btnLogout = document.getElementById('btnLogout');

  const DEFAULT_API_BASE = 'https://innflu-studio.pages.dev';

  async function getApiBase() {
    const data = await chrome.storage.local.get('apiBaseUrl');
    let url = data.apiBaseUrl || DEFAULT_API_BASE;
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
      url = DEFAULT_API_BASE;
      await chrome.storage.local.set({ apiBaseUrl: url });
    }
    return url;
  }

  function showFeedback(text, type = 'error') {
    if (!text) {
      loginFeedback.style.display = 'none';
      loginFeedback.innerText = '';
      return;
    }
    loginFeedback.className = `feedback-msg ${type}`;
    loginFeedback.innerText = text;
    loginFeedback.style.display = 'block';
  }

  function renderLoggedOutView() {
    viewLoggedIn.style.display = 'none';
    viewLoggedOut.style.display = 'flex';
    loginPassword.value = '';
    showFeedback('');
  }

  function renderLoggedInView(user, stats = null) {
    viewLoggedOut.style.display = 'none';
    viewLoggedIn.style.display = 'flex';

    const displayName = user.full_name || user.email.split('@')[0];
    popUserName.innerText = displayName;
    popUserEmail.innerText = user.email;
    popUserPlan.innerText = (user.plan || 'PRO').toUpperCase();

    const initial = (user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)).toUpperCase();
    popUserAvatar.innerText = initial;

    if (stats) {
      popDailyCount.innerText = stats.sentToday || 0;
      popTotalLeads.innerText = stats.totalLeads || 0;
      popWaCount.innerText = stats.withWhatsapp || 0;
    }
  }

  /**
   * Valida a sessão atual com o Cloudflare D1
   */
  async function checkSession() {
    const apiBase = await getApiBase();
    const stored = await chrome.storage.local.get(['authToken', 'authUser']);

    if (!stored.authToken) {
      renderLoggedOutView();
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${stored.authToken}`,
          'X-API-Key': stored.authToken
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          // Atualiza dados no storage
          await chrome.storage.local.set({ authUser: data.user });
          
          // Busca métricas do usuário
          let stats = null;
          try {
            const statsRes = await fetch(`${apiBase}/api/stats`, {
              headers: { 'Authorization': `Bearer ${stored.authToken}` }
            });
            if (statsRes.ok) stats = await statsRes.json();
          } catch (e) {}

          renderLoggedInView(data.user, stats);
          return;
        }
      }
    } catch (e) {
      // Se houver erro de rede mas houver usuário em cache, exibe com dados salvos
      if (stored.authUser) {
        renderLoggedInView(stored.authUser);
        return;
      }
    }

    // Sessão inválida ou expirada
    await chrome.storage.local.set({ authToken: null, authUser: null });
    renderLoggedOutView();
  }

  // Submissão do Formulário de Login
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    if (!email || !password) {
      showFeedback('Informe seu e-mail e senha.');
      return;
    }

    btnLoginSubmit.disabled = true;
    btnLoginText.innerText = 'Autenticando...';
    showFeedback('');

    try {
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback(data.error || 'Credenciais inválidas. Verifique e tente novamente.');
        btnLoginSubmit.disabled = false;
        btnLoginText.innerText = '⚡ Entrar na Conta';
        return;
      }

      // Salva sessão localmente
      await chrome.storage.local.set({
        authToken: data.token,
        authUser: data.user,
        apiToken: data.user.api_token || data.token,
        apiBaseUrl: apiBase
      });

      showFeedback('Login realizado com sucesso!', 'success');

      // Busca estatísticas imediatas
      let stats = null;
      try {
        const statsRes = await fetch(`${apiBase}/api/stats`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (statsRes.ok) stats = await statsRes.json();
      } catch (err) {}

      setTimeout(() => {
        btnLoginSubmit.disabled = false;
        btnLoginText.innerText = '⚡ Entrar na Conta';
        renderLoggedInView(data.user, stats);
      }, 500);

    } catch (err) {
      showFeedback('Erro de conexão ao servidor. Tente novamente.');
      btnLoginSubmit.disabled = false;
      btnLoginText.innerText = '⚡ Entrar na Conta';
    }
  });

  // Ações
  btnOpenDashboard.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://innflu-studio.pages.dev/dashboard/' });
  });

  btnOpenInstagram.addEventListener('click', () => {
    chrome.tabs.query({ url: '*://*.instagram.com/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        chrome.tabs.create({ url: 'https://www.instagram.com' });
      }
    });
  });

  btnLogout.addEventListener('click', async () => {
    const apiBase = await getApiBase();
    const stored = await chrome.storage.local.get('authToken');
    if (stored.authToken) {
      fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stored.authToken}` }
      }).catch(() => {});
    }

    await chrome.storage.local.set({ authToken: null, authUser: null, apiToken: null });
    renderLoggedOutView();
  });

  // Inicialização
  await checkSession();
});
