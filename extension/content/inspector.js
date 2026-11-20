/**
 * Inspector do Instagram (DOM Scraper & Filtros)
 * Extração de alta precisão para seguidores (incluindo "4,8 mi", "12,4 mil", "1.2M"),
 * detecção de stories ativos, nome de exibição, bio, contatos (WhatsApp & Email) e validação.
 */
window.InnfluInspector = {

  /**
   * Converte texto de seguidores para número inteiro com suporte ampliado
   */
  parseFollowerCount(text) {
    if (!text) return 0;
    const raw = text.trim().toLowerCase();

    // 1. Milhões: "4,8 mi", "4.8m", "4 mi", "4,8 milhões", "4.8m followers", "4.8M"
    const millionMatch = raw.match(/([\d.,]+)\s*(?:mi|m|milh[oõ]es|milhao)\b/i);
    if (millionMatch) {
      let numStr = millionMatch[1].replace(/\./g, '').replace(',', '.');
      // Caso tenha apenas vírgula ou ponto decimal
      if (!numStr.includes('.') && millionMatch[1].includes('.')) {
        numStr = millionMatch[1];
      }
      const val = parseFloat(numStr);
      if (!isNaN(val)) return Math.round(val * 1000000);
    }

    // 2. Milhares: "15,4 mil", "15.4k", "15k", "15 mil seguidores", "15.4K"
    const thousandMatch = raw.match(/([\d.,]+)\s*(?:mil|k)\b/i);
    if (thousandMatch) {
      let numStr = thousandMatch[1].replace(/\./g, '').replace(',', '.');
      if (!numStr.includes('.') && thousandMatch[1].includes('.')) {
        numStr = thousandMatch[1];
      }
      const val = parseFloat(numStr);
      if (!isNaN(val)) return Math.round(val * 1000);
    }

    // 3. Bilhões
    const billionMatch = raw.match(/([\d.,]+)\s*(?:bi|b|bilh[oõ]es)\b/i);
    if (billionMatch) {
      let numStr = billionMatch[1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val)) return Math.round(val * 1000000000);
    }

    // 4. Número puro com pontuação pt-BR ou en-US (ex: 15.420 ou 15,420)
    const cleanNumbersOnly = raw.replace(/[^\d]/g, '');
    const directNum = parseInt(cleanNumbersOnly, 10);
    return isNaN(directNum) ? 0 : directNum;
  },

  /**
   * Extrai o número de seguidores do perfil atual usando estratégia em cascata multi-camada
   */
  getFollowersCount() {
    // Camada 1. Meta tags (a fonte mais confiável e imune a alterações de classes dinâmicas)
    const metaDesc = document.querySelector('meta[name="description"]')?.content ||
                     document.querySelector('meta[property="og:description"]')?.content || '';
    if (metaDesc) {
      const metaMatch = metaDesc.match(/([\d.,]+\s*(?:mi|mil|k|m|milh[oõ]es|b)?)\s*(?:seguidores|followers)/i);
      if (metaMatch && metaMatch[1]) {
        const parsed = this.parseFollowerCount(metaMatch[1]);
        if (parsed > 0) return parsed;
      }
    }

    // Camada 2. Links específicos de seguidores (/followers/ ou /seguidores/)
    const followerLinks = Array.from(document.querySelectorAll('a[href*="/followers"], a[href*="/seguidores"]'));
    for (const link of followerLinks) {
      // Atributo title frequentemente contém a contagem exata (ex: "14.285")
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

    // Camada 3. Header e seções estatísticas com spans/números
    const header = document.querySelector('header') || document.querySelector('main section');
    if (header) {
      const titledElements = header.querySelectorAll('[title]');
      for (const el of titledElements) {
        const titleVal = el.getAttribute('title');
        const parentText = (el.closest('li, div, a')?.innerText || '').toLowerCase();
        if (parentText.includes('seguidor') || parentText.includes('follower')) {
          const parsed = this.parseFollowerCount(titleVal);
          if (parsed > 0) return parsed;
        }
      }

      const headerText = header.innerText;
      const match = headerText.match(/([\d.,]+\s*(?:mi|mil|k|m|milh[oõ]es|b)?)\s*(?:seguidores|followers)/i);
      if (match && match[1]) {
        const parsed = this.parseFollowerCount(match[1]);
        if (parsed > 0) return parsed;
      }
    }

    // Camada 4. Varredura recursiva de elementos textuais próximos
    const allSpans = Array.from(document.querySelectorAll('span, a, div, li'));
    for (const el of allSpans) {
      const txt = (el.innerText || '').toLowerCase();
      if ((txt.includes('seguidor') || txt.includes('follower')) && !txt.includes('\n')) {
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
   * Detecta se o perfil possui Stories ativos nas últimas 24h com validação resiliente
   * REGRA CRÍTICA: Ignora estritamente DESTAQUES (highlights) que ficam salvos abaixo da bio.
   * Apenas avalia o Avatar Principal do topo do perfil.
   */
  hasActiveStories(username = null) {
    const cleanUser = (username || window.location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase().replace('@', '');

    // 1. O avatar principal do perfil SEMPRE fica no header superior
    const header = document.querySelector('main header') || document.querySelector('header') || document.querySelector('main > div > header');
    if (!header) return false;

    // 2. Link explícito de Stories de 24h do perfil (Ex: /stories/username/)
    // NUNCA aceita links de destaques (/stories/highlights/...)
    const validStoryLinks = Array.from(header.querySelectorAll('a[href*="/stories/"]')).filter(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href.includes('/highlights/')) return false; // Destaque excluído!
      return cleanUser ? href.includes(cleanUser) : true;
    });

    if (validStoryLinks.length > 0) {
      for (const link of validStoryLinks) {
        // Garante que não é um item de lista de destaques
        if (!link.closest('ul') && !link.closest('div[role="menu"]')) {
          return true;
        }
      }
    }

    // 3. Procura o Avatar Principal (a imagem grande de perfil no cabeçalho)
    const mainAvatarImg = header.querySelector('img[alt*="foto" i], img[alt*="profile" i], img');
    if (!mainAvatarImg) return false;

    // Se a imagem estiver dentro de um destaque, ignora
    if (mainAvatarImg.closest('a[href*="/stories/highlights/"]')) return false;

    // 4. Canvas do anel de story ativo de 24h (renderizado pelo Instagram sobre o avatar principal)
    const canvases = Array.from(header.querySelectorAll('canvas')).filter(cv => {
      if (cv.closest('a[href*="/stories/highlights/"]')) return false;
      const rect = cv.getBoundingClientRect();
      return rect.width >= 55 && rect.height >= 55;
    });
    if (canvases.length > 0) return true;

    // 5. Botões de Story no Avatar Principal (sem ser destaque)
    const storyButtons = Array.from(header.querySelectorAll([
      'div[role="button"][aria-label*="story" i]',
      'div[role="button"][aria-label*="stories" i]',
      'div[role="button"][aria-label*="história" i]',
      'div[role="button"][aria-label*="histórias" i]',
      'button[aria-label*="story" i]',
      'button[aria-label*="stories" i]'
    ].join(','))).filter(b => {
      const aria = (b.getAttribute('aria-label') || '').toLowerCase();
      if (aria.includes('destaque') || aria.includes('highlight')) return false;
      if (b.closest('a[href*="/stories/highlights/"]')) return false;
      const rect = b.getBoundingClientRect();
      return rect.width >= 55 && rect.height >= 55;
    });
    if (storyButtons.length > 0) return true;

    // 6. SVG com gradiente (arco colorido característico do anel ativo de 24h)
    const svgs = header.querySelectorAll('svg');
    for (const svg of svgs) {
      if (svg.closest('a[href*="/stories/highlights/"]')) continue;
      if (svg.querySelector('linearGradient, radialGradient, conicGradient')) {
        const rect = svg.getBoundingClientRect();
        if (rect.width >= 55 && rect.height >= 55) return true;
      }
      const aria = (svg.getAttribute('aria-label') || '').toLowerCase();
      if ((aria.includes('story') || aria.includes('stories') || aria.includes('história')) && !aria.includes('destaque') && !aria.includes('highlight')) {
        return true;
      }
    }

    // 7. Detecção por gradiente CSS diretamente nos pais do Avatar Principal
    let current = mainAvatarImg.parentElement;
    for (let i = 0; i < 5 && current && current !== header; i++) {
      if (current.closest('a[href*="/stories/highlights/"]')) return false;
      const ariaLabel = (current.getAttribute('aria-label') || '').toLowerCase();
      if (ariaLabel.includes('destaque') || ariaLabel.includes('highlight')) return false;

      if (ariaLabel.includes('story') || ariaLabel.includes('stories') || ariaLabel.includes('história')) {
        return true;
      }

      const className = (current.className || '').toString().toLowerCase();
      const style = (current.getAttribute('style') || '').toLowerCase();

      if (
        className.includes('gradient') ||
        style.includes('conic-gradient') ||
        style.includes('linear-gradient')
      ) {
        if (!style.includes('rgba(0, 0, 0, 0.15)') && !style.includes('#dbdbdb')) {
          return true;
        }
      }

      current = current.parentElement;
    }

    return false;
  },

  /**
   * Detecta se a conta atual é privada (com cadeado / "Esta conta é privada")
   */
  isPrivateAccount() {
    // 1. Mensagens textuais explícitas de conta privada no perfil
    const pageText = (document.querySelector('main')?.innerText || document.body.innerText).toLowerCase();
    if (
      pageText.includes('esta conta é privada') ||
      pageText.includes('this account is private') ||
      pageText.includes('siga para ver as fotos e os vídeos') ||
      pageText.includes('follow to see their photos and videos')
    ) {
      return true;
    }

    // 2. Ícone de cadeado no perfil
    const lockIcon = document.querySelector('svg[aria-label*="privada" i], svg[aria-label*="private" i]');
    if (lockIcon) return true;

    return false;
  },

  /**
   * Detecta se a conta possui selo de verificação azul (Meta Verified / Verificado)
   */
  isVerifiedAccount() {
    const header = document.querySelector('header');
    if (!header) return false;

    const verifiedBadge = header.querySelector([
      'svg[aria-label*="Verificado" i]',
      'svg[aria-label*="Verified" i]',
      '[aria-label*="Verificado" i]',
      '[aria-label*="Verified" i]'
    ].join(','));

    return !!verifiedBadge;
  },

  /**
   * Extrai a contagem de publicações (posts) do perfil
   */
  getPostsCount() {
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    if (metaDesc) {
      const match = metaDesc.match(/([\d.,]+)\s*(?:publicações|publicacoes|posts)/i);
      if (match && match[1]) {
        const clean = match[1].replace(/\./g, '').replace(',', '.');
        const num = parseInt(clean, 10);
        if (!isNaN(num)) return num;
      }
    }

    const header = document.querySelector('header');
    if (header) {
      const match = header.innerText.match(/([\d.,]+)\s*(?:publicações|publicacoes|posts)/i);
      if (match && match[1]) {
        const clean = match[1].replace(/\./g, '').replace(',', '.');
        const num = parseInt(clean, 10);
        if (!isNaN(num)) return num;
      }
    }

    return 0;
  },

  /**
   * Avalia a aderência semântica do perfil ao nicho da campanha
   */
  calculateNicheRelevance(bioText, fullName, targetNiche = '') {
    if (!targetNiche || targetNiche.toLowerCase() === 'geral') {
      return { relevant: true, score: 1, matchedTerms: ['geral'] };
    }

    const combined = `${fullName || ''} ${bioText || ''}`.toLowerCase();
    const cleanNiche = targetNiche.toLowerCase().replace(/^[#@]/, '').trim();

    // Dicionário de termos correlacionados por nichos populares
    const nicheThesaurus = {
      maternidade: ['mãe', 'mae', 'mamãe', 'mamae', 'materno', 'maternidade', 'filhos', 'filho', 'filha', 'gestante', 'grávida', 'gravida', 'gravidinha', 'puerpério', 'puerperio', 'parto', 'baby', 'mãe de'],
      moda: ['moda', 'fashion', 'look', 'looks', 'estilo', 'outfit', 'consultoria de imagem', 'beleza', 'provador'],
      beleza: ['beleza', 'skincare', 'maquiagem', 'makeup', 'estética', 'estetica', 'dermatologia', 'dermato', 'pele', 'cabelos', 'hair'],
      fitness: ['fitness', 'treino', 'nutrição', 'nutricionista', 'saúde', 'saude', 'musculação', 'dieta', 'atleta', 'personal'],
      gastronomia: ['receitas', 'culinária', 'culinaria', 'gastronomia', 'chef', 'cozinha', 'comida', 'confeitaria']
    };

    const targetList = nicheThesaurus[cleanNiche] || [cleanNiche];
    const matched = [];

    for (const term of targetList) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(combined)) {
        matched.push(term);
      }
    }

    // Se o termo direto da busca aparecer na bio
    if (combined.includes(cleanNiche) && !matched.includes(cleanNiche)) {
      matched.push(cleanNiche);
    }

    return {
      relevant: matched.length > 0,
      score: matched.length,
      matchedTerms: matched
    };
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
  extractCurrentProfileData(targetNiche = '') {
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

    // 4. Stories Ativos (Exclusivo 24h, ignora destaques)
    const activeStories = this.hasActiveStories(username);

    // 5. Conta Privada
    const isPrivate = this.isPrivateAccount();

    // 6. Conta Verificada (Selo Azul)
    const isVerified = this.isVerifiedAccount();

    // 7. Número de Publicações
    const postsCount = this.getPostsCount();

    // 8. Relevância de Nicho
    const nicheEval = this.calculateNicheRelevance(bio, fullName, targetNiche);

    // 9. Gênero via Heurística
    const genderEval = window.InnfluGenderDetector ? 
      window.InnfluGenderDetector.classify(fullName, bio, username) : 
      { isFemale: true, isBrand: false, reason: 'Padrão' };

    // 10. Contatos (WhatsApp & Email)
    const contacts = window.InnfluContactExtractor ? 
      window.InnfluContactExtractor.extractAllContactsFromPage() : 
      { email: null, whatsapp: null };

    return {
      username,
      fullName,
      followersCount,
      hasActiveStories: activeStories,
      isPrivate,
      isVerified,
      postsCount,
      bio,
      isFemale: genderEval.isFemale,
      isBrand: genderEval.isBrand,
      genderReason: genderEval.reason,
      whatsapp: contacts.whatsapp,
      email: contacts.email,
      nicheRelevance: nicheEval
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
    const requireContact = campaignCriteria.requireContact || 'all';

    const reasons = [];

    // Checagem de conta privada (descarte imediato)
    if (profileData.isPrivate) {
      reasons.push('Conta privada (não acessível para captação)');
    }

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

    // Checagem de contatos requeridos
    if (requireContact === 'wa_only' && !profileData.whatsapp) {
      reasons.push('Sem WhatsApp disponível');
    } else if (requireContact === 'email_only' && !profileData.email) {
      reasons.push('Sem E-mail disponível');
    } else if (requireContact === 'any_contact' && !profileData.whatsapp && !profileData.email) {
      reasons.push('Sem WhatsApp nem E-mail');
    }

    // Checagem de marca / empresa corporativa
    if (profileData.isBrand) {
      reasons.push(profileData.genderReason || 'Empresa / Loja comercial (não é influenciador)');
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
