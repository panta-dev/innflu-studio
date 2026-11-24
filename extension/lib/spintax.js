/**
 * Innflu Spintax & Name Interpolation Engine
 * Processamento robusto de variações Spintax {A|B|C},
 * sanitização inteligente de primeiro nome e suporte a templates universais.
 */
window.InnfluSpintax = {

  /**
   * Resolve spintax recursivamente suportando qualquer profundidade de aninhamento
   * Exemplo: "{Olá|Oi|Oie} {Tudo bem?|Como vai?}"
   * @param {string} text 
   * @returns {string}
   */
  resolve(text) {
    if (!text) return '';
    const spintaxRegex = /\{([^{}]+)\}/g;
    let result = text;
    let safetyCounter = 0;

    while (spintaxRegex.test(result) && safetyCounter < 20) {
      result = result.replace(spintaxRegex, (match, choices) => {
        const parts = choices.split('|');
        const randomIndex = Math.floor(Math.random() * parts.length);
        return parts[randomIndex];
      });
      safetyCounter++;
    }

    return result;
  },

  /**
   * Extrai e sanitiza com precisão o primeiro nome da influenciadora,
   * removendo emojis, títulos profissionais (Dra., Nutri.), separadores de nicho (| Moda, - Provador)
   * e pontuações, formatando sempre com inicial maiúscula.
   * @param {string} rawName 
   * @param {string} username 
   * @returns {string}
   */
  cleanFirstName(rawName, username = '') {
    let name = (rawName || '').trim();

    // 1. Remove qualquer emoji ou símbolo decorativo unicode
    name = name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}✨🌸💖💎👑🔥⭐⚡💫🕊️🌹🌻🌷🎀]/gu, ' ').trim();

    // 2. Remove tags de nicho ou subtítulos após pipes, traços, barras ou pontos
    // Ex: "Mariana | Moda", "Julia - Provador", "Beatriz / Make", "Ana • Look"
    name = name.split(/[|\-–—\/•·~]/)[0].trim();

    // 3. Remove prefixos e abreviações de títulos comuns
    name = name.replace(/^(?:dra?\.?|dr\.?|profª?\.?|prof\.?|nutri\.?|arq\.?|adv\.?|psico\.?|enfa?\.?|engª?\.?)\s+/i, '').trim();

    // 4. Busca o primeiro token alfabético válido
    const tokens = name.split(/\s+/).filter(t => t.length > 0);
    let firstName = '';

    for (const token of tokens) {
      const cleanToken = token.replace(/[^a-zA-ZÀ-ÿ]/g, '').trim();
      // Deve ter pelo menos 2 letras e não ser uma sigla genérica
      if (cleanToken.length >= 2 && !['oficial', 'official', 'blog', 'moda', 'vip'].includes(cleanToken.toLowerCase())) {
        firstName = cleanToken;
        break;
      }
    }

    // 5. Se não encontrou no nome de exibição, tenta extrair de forma inteligente do username
    // Ex: "mariah_souza" -> "Maria", "ju.santoss" -> "Ju", "dra.camila" -> "Camila"
    if (!firstName && username) {
      const cleanUser = username.replace(/^@/, '').toLowerCase();
      const parts = cleanUser.split(/[._-]/).filter(p => p.length >= 2);
      const ignoreParts = [
        'oficial', 'official', 'blog', 'moda', 'vip', 'contato', 'assessoria', 
        'page', 'store', 'loja', 'br', 'studio', 'dra', 'dr', 'nutri', 'adv', 
        'arq', 'looks', 'closet', 'wear', 'beauty', 'hair', 'makeup'
      ];
      for (const part of parts) {
        if (!ignoreParts.includes(part) && /^[a-zà-ÿ]+$/i.test(part)) {
          firstName = part;
          break;
        }
      }
    }

    if (firstName) {
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }

    return '';
  },

  /**
   * Substitui variáveis dinâmicas ({nome}, {user}, {username}, {nicho})
   * E EM SEGUIDA resolve o spintax {Olá|Oi|Oie}, garantindo variações reais.
   * @param {string} text 
   * @param {object} params { nome, username, nicho }
   * @returns {string}
   */
  interpolate(text, params = {}) {
    if (!text) return '';

    let template = text;

    // 1. Extração e higienização do primeiro nome
    const rawName = params.nome || params.name || params.fullName || '';
    const rawUser = params.username || params.user || '';
    const cleanNome = this.cleanFirstName(rawName, rawUser);
    const cleanUser = rawUser ? (rawUser.startsWith('@') ? rawUser : `@${rawUser}`) : '';
    const cleanNiche = params.nicho || params.niche || 'conteúdo';

    // Se não encontrou o primeiro nome, usa uma saudação natural amigável sem ficar vazio
    const nomeVal = cleanNome || cleanUser;

    // 2. CRUCIAL: Substitui variáveis ANTES do Spintax
    // Dessa forma {nome} não é consumido pelo regex de spintax como se fosse uma opção única
    template = template.replace(/@\{(username|user)\}/gi, '{$1}');
    template = template.replace(/\{nome\}/gi, nomeVal);
    template = template.replace(/\{username\}/gi, cleanUser);
    template = template.replace(/\{user\}/gi, cleanUser);
    template = template.replace(/\{nicho\}/gi, cleanNiche);

    // 3. Resolve todas as variações de Spintax
    let output = this.resolve(template);

    // 4. Limpeza de espaçamentos extras, @@ duplicados e pontuação órfã
    output = output.replace(/@{2,}([a-z0-9_.-]+)/gi, '@$1');
    output = output.replace(/\s+([.,!?:;])/g, '$1');
    output = output.replace(/[ \t]{2,}/g, ' ').trim();

    return output;
  }
};
