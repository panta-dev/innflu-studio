/**
 * Inspector do Instagram (DOM Scraper & Filtros)
 * Extração de alta precisão para seguidores (incluindo "4,8 mi", "12,4 mil", "1.2M"),
 * detecção de stories ativos, nome de exibição, bio, contatos (WhatsApp & Email) e validação.
 */
window.InnfluInspector = {

  /**
   * Converte texto de seguidores para número inteiro
   */
  parseFollowerCount(text) {
    if (!text) return 0;
    const raw = text.trim().toLowerCase();

    // 1. Milhões: "4,8 mi", "4.8m", "4 mi", "4,8 milhões", "4.8m followers"
    const millionMatch = raw.match(/([\d.,]+)\s*(?:mi|m|milh[oõ]es|milhao)\b/i);
    if (millionMatch) {
      let numStr = millionMatch[1].replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val)) return Math.round(val * 1000000);
    }

    // 2. Milhares: "15,4 mil", "15.4k", "15k", "15 mil seguidores"
    const thousandMatch = raw.match(/([\d.,]+)\s*(?:mil|k)\b/i);
    if (thousandMatch) {
      let numStr = thousandMatch[1].replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val)) return Math.round(val * 1000);
    }

    // 3. Bilhões
    const billionMatch = raw.match(/([\d.,]+)\s*(?:bi|b|bilh[oõ]es)\b/i);
    if (billionMatch) {
      let numStr = billionMatch[1].replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val)) return Math.round(val * 1000000000);
    }

    // 4. Número puro com separadores de milhar
    const cleanNumbersOnly = raw.replace(/[^\d]/g, '');
    const directNum = parseInt(cleanNumbersOnly, 10);
    return isNaN(directNum) ? 0 : directNum;
  },

  /**
   * Extrai o número de seguidores do perfil atual
   */
  getFollowersCount() {
    // 1. Meta tags (ultra-estável no Instagram Web independente de versão de DOM)
    const metaDesc = document.querySelector('meta[name="description"]')?.content ||
                     document.querySelector('meta[property="og:description"]')?.content || '';
    if (metaDesc) {
      const metaMatch = metaDesc.match(/([\d.,]+\s*(?:mi|mil|k|m|milh[oõ]es|b)?)\s*(?:seguidores|followers)/i);
      if (metaMatch && metaMatch[1]) {
        const parsed = this.parseFollowerCount(metaMatch[1]);
        if (parsed > 0) return parsed;
      }
    }

    // 2. Links de seguidores diretos no DOM
    const followerLinks = Array.from(document.querySelectorAll('a[href*="/followers"], a[href*="/seguidores"]'));
    for (const link of followerLinks) {
      const titleAttr = link.getAttribute('title') || link.querySelector('[title]')?.getAttribute('title');
      if (titleAttr) {
        const parsedTitle = this.parseFollowerCount(titleAttr);
        if (parsedTitle > 0) return parsedTitle;
      }
      const textVal = link.innerText;
      if (textVal) {
        const parsed = this.parseFollowerCount(textVal);
        if (parsed > 0) return parsed;
      }
    }

    // 3. Header e listas estatísticas
    const header = document.querySelector('header');
    if (header) {
      const headerText = header.innerText;
      const match = headerText.match(/([\d.,]+\s*(?:mi|mil|k|m|milh[oõ]es|b)?)\s*(?:seguidores|followers)/i);
      if (match && match[1]) {
        const parsed = this.parseFollowerCount(match[1]);
        if (parsed > 0) return parsed;
      }

      const titledElements = header.querySelectorAll('[title]');
      for (const el of titledElements) {
        const titleVal = el.getAttribute('title');
        const parentText = el.closest('li, div, a')?.innerText?.toLowerCase() || '';
        if (parentText.includes('seguidor') || parentText.includes('follower')) {
          const parsed = this.parseFollowerCount(titleVal);
          if (parsed > 0) return parsed;
        }
      }
    }

    // 4. Varredura de elementos com texto "seguidores" / "followers"
    const allSpans = Array.from(document.querySelectorAll('span, a, div, li'));
    for (const el of allSpans) {
      const txt = (el.innerText || '').toLowerCase();
      if (txt.includes('seguidor') || txt.includes('follower')) {
        const match = txt.match(/([\d.,]+\s*(?:mi|mil|k|m|milh[oõ]es|b)?)\s*(?:seguidores|followers)/i);
        if (match && match[1]) {
          const parsed = this.parseFollowerCount(match[1]);
          if (parsed > 0) return parsed;
        }
      }
    }

    return 0;
  },

  /**
   * Detecta se o perfil possui Stories ativos nas últimas 24h
   */
  hasActiveStories() {
    const header = document.querySelector('header');
    if (!header) return false;

    // 1. Aria-label explícito de stories no header ou botão do avatar
    const storyAria = header.querySelector([
      '[aria-label*="story" i]',
      '[aria-label*="stories" i]',
      '[aria-label*="história" i]',
      '[aria-label*="histórias" i]',
      'a[href*="/stories/"]'
    ].join(','));
    if (storyAria) return true;

    // 2. Canvas do anel de story (Instagram Web desenha o anel colorido em <canvas>)
    const canvasRing = header.querySelector('canvas');
    if (canvasRing) return true;

    // 3. SVG com gradiente (arco do Instagram stories)
    const svgs = header.querySelectorAll('svg');
    for (const svg of svgs) {
      if (svg.querySelector('linearGradient, radialGradient')) return true;
      const aria = (svg.getAttribute('aria-label') || '').toLowerCase();
      if (aria.includes('story') || aria.includes('stories') || aria.includes('história')) return true;
    }

    // 4. Elementos ao redor do avatar com classes/estilos de gradiente
    const avatarImg = header.querySelector('img[alt*="foto" i], img[alt*="profile" i], img');
    if (avatarImg) {
      let current = avatarImg.parentElement;
      for (let i = 0; i < 5 && current; i++) {
        const className = (current.className || '').toString().toLowerCase();
        const style = (current.getAttribute('style') || '').toLowerCase();
        const ariaLabel = (current.getAttribute('aria-label') || '').toLowerCase();

        if (ariaLabel.includes('story') || ariaLabel.includes('stories') || ariaLabel.includes('história')) {
          return true;
        }

        if (className.includes('gradient') || className.includes('story') || 
            style.includes('gradient') || style.includes('conic-gradient') || style.includes('linear-gradient')) {
          return true;
        }

        if (current.tagName === 'A' && (current.getAttribute('href') || '').includes('/stories/')) {
          return true;
        }

        current = current.parentElement;
      }
    }

    return false;
  },

  /**
   * Extrai o nome de exibição real do perfil
   */
  getDisplayName(username) {
    const header = document.querySelector('header');
    if (!header) return username;

    const candidateElements = Array.from(header.querySelectorAll('h1, h2, span, div'));
    for (const el of candidateElements) {
      if (el.children.length > 2) continue;
      const txt = el.innerText.trim();
      if (
        txt && 
        txt.toLowerCase() !== username.toLowerCase() && 
        !txt.includes('\n') && 
        txt.length >= 2 && 
        txt.length <= 50 &&
        !txt.toLowerCase().includes('posts') &&
        !txt.toLowerCase().includes('seguidores') &&
        !txt.toLowerCase().includes('seguindo')
      ) {
        if (/[a-zA-ZÀ-ÿ]/.test(txt)) {
          return txt;
        }
      }
    }

    return username;
  },

  /**
   * Extrai a biografia do perfil
   */
  getBioText() {
    const header = document.querySelector('header');
    if (!header) return '';

    const textNodes = [];
    const elements = Array.from(header.querySelectorAll('div, span, section'));
    for (const el of elements) {
      if (el.children.length === 0 && el.innerText.trim()) {
        const t = el.innerText.trim();
        if (
          !t.includes('posts') && 
          !t.includes('seguidores') && 
          !t.includes('seguindo') &&
          !t.includes('Enviar mensagem') &&
          !t.includes('Seguir')
        ) {
          textNodes.push(t);
        }
      }
    }

    return textNodes.join(' ');
  },

  /**
   * Extrai dados completos do perfil atual no DOM do Instagram
   */
  extractCurrentProfileData() {
    const urlParts = window.location.pathname.split('/').filter(Boolean);
    const username = urlParts[0];

    const systemPaths = ['direct', 'explore', 'stories', 'reels', 'accounts', 'api', 'p'];
    if (!username || systemPaths.includes(username)) {
      return null;
    }

    // 1. Seguidores
    const followersCount = this.getFollowersCount();

    // 2. Nome de Exibição
    const fullName = this.getDisplayName(username);

    // 3. Biografia
    const bio = this.getBioText();

    // 4. Stories Ativos
    const activeStories = this.hasActiveStories();

    // 5. Gênero via Heurística
    const genderEval = window.InnfluGenderDetector ? 
      window.InnfluGenderDetector.classify(fullName, bio, username) : 
      { isFemale: true, isBrand: false, reason: 'Padrão' };

    // 6. Contatos (WhatsApp & Email)
    const contacts = window.InnfluContactExtractor ? 
      window.InnfluContactExtractor.extractAllContactsFromPage() : 
      { email: null, whatsapp: null };

    return {
      username,
      fullName,
      followersCount,
      hasActiveStories: activeStories,
      bio,
      isFemale: genderEval.isFemale,
      isBrand: genderEval.isBrand,
      genderReason: genderEval.reason,
      whatsapp: contacts.whatsapp,
      email: contacts.email
    };
  },

  /**
   * Avalia se o perfil atende aos critérios da campanha
   */
  evaluateCandidate(profileData, campaignCriteria = {}) {
    const minFollowers = campaignCriteria.minFollowers !== undefined ? campaignCriteria.minFollowers : 10000;
    const maxFollowers = campaignCriteria.maxFollowers !== undefined ? campaignCriteria.maxFollowers : 10000000;
    const requireStories = campaignCriteria.requireActiveStories !== false;
    const targetGender = campaignCriteria.targetGender || 'female';

    const reasons = [];

    // Checagem de seguidores
    if (profileData.followersCount < minFollowers) {
      reasons.push(`Abaixo do mínimo de seguidores (${profileData.followersCount.toLocaleString('pt-BR')} < ${minFollowers.toLocaleString('pt-BR')})`);
    }
    if (profileData.followersCount > maxFollowers) {
      reasons.push(`Acima do máximo de seguidores (${profileData.followersCount.toLocaleString('pt-BR')} > ${maxFollowers.toLocaleString('pt-BR')})`);
    }

    // Checagem de stories
    if (requireStories && !profileData.hasActiveStories) {
      reasons.push('Não possui Stories ativos nas últimas 24h');
    }

    // Checagem de marca
    if (profileData.isBrand) {
      reasons.push('Identificado como loja / marca comercial');
    }

    // Checagem de gênero
    if (targetGender === 'female' && !profileData.isFemale) {
      reasons.push('Perfil não identificado como feminino');
    }

    return {
      approved: reasons.length === 0,
      reasons
    };
  }
};
