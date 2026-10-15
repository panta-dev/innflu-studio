document.addEventListener('DOMContentLoaded', async () => {
  const popDailyCount = document.getElementById('popDailyCount');
  const popDailyLimit = document.getElementById('popDailyLimit');
  const apiBaseUrlInput = document.getElementById('apiBaseUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const campaignKeywordInput = document.getElementById('campaignKeyword');
  const btnSaveConfig = document.getElementById('btnSaveConfig');
  const saveFeedback = document.getElementById('saveFeedback');

  // Carregar dados salvos
  const data = await chrome.storage.local.get([
    'apiBaseUrl',
    'apiToken',
    'campaignKeyword',
    'dailyCount',
    'dailyLimit'
  ]);

  if (data.apiBaseUrl) apiBaseUrlInput.value = data.apiBaseUrl;
  if (data.apiToken) apiTokenInput.value = data.apiToken;
  if (data.campaignKeyword) campaignKeywordInput.value = data.campaignKeyword;
  popDailyCount.innerText = data.dailyCount || 0;
  popDailyLimit.innerText = data.dailyLimit || 40;

  // Salvar alterações
  btnSaveConfig.addEventListener('click', async () => {
    await chrome.storage.local.set({
      apiBaseUrl: apiBaseUrlInput.value.trim(),
      apiToken: apiTokenInput.value.trim(),
      campaignKeyword: campaignKeywordInput.value.trim()
    });

    saveFeedback.innerText = 'Configurações salvas!';
    setTimeout(() => {
      saveFeedback.innerText = '';
    }, 2500);
  });
});
