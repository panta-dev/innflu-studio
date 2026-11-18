/**
 * Innflu Studio — Content Script de Sincronização de Sessão
 * Roda exclusivamente em https://innflu-studio.pages.dev/*
 * Sincroniza transparentemente o token e usuário do localStorage do Painel Web com o chrome.storage.local da Extensão.
 */
(function() {
  function syncDashboardSessionWithExtension() {
    try {
      const token = localStorage.getItem('innflu_token');
      const userStr = localStorage.getItem('innflu_user');
      let user = null;
      try {
        if (userStr) user = JSON.parse(userStr);
      } catch (e) {}

      if (token) {
        chrome.storage.local.get(['authToken'], (res) => {
          if (chrome.runtime?.lastError) return;
          if (res.authToken !== token) {
            chrome.storage.local.set({
              authToken: token,
              authUser: user,
              apiToken: user?.api_token || token,
              apiBaseUrl: 'https://innflu-studio.pages.dev'
            }, () => {
              console.log('[Innflu Extensão] ✅ Sessão sincronizada com sucesso do Painel Web!');
            });
          }
        });
      }
    } catch (err) {
      // Falha silenciosa
    }
  }

  // Executa imediatamente na inicialização da página
  syncDashboardSessionWithExtension();

  // Escuta alterações no localStorage (ex: login/logout em outra aba)
  window.addEventListener('storage', (e) => {
    if (e.key === 'innflu_token' || e.key === 'innflu_user') {
      syncDashboardSessionWithExtension();
    }
  });

  // Checagem periódica suave (a cada 3s) para capturar login por SPA sem reload
  setInterval(syncDashboardSessionWithExtension, 3000);
})();
