/**
 * Extrator Avançado de Contatos (WhatsApp e E-mail) do Instagram — v3 Pro
 * Analisa bio, botões de ação nativos (mailto/tel), links externos decodificados (wa.me, Linktree, etc.),
 * prioriza números e emails comerciais/assessoria e limpa falsos positivos com validação rigorosa.
 */
window.InnfluContactExtractor = {

  // DDDs válidos no Brasil (11 a 99)
  validBrazilianDDDs: new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24,                         // RJ
    27, 28,                             // ES
    31, 32, 33, 34, 35, 37, 38,         // MG
    41, 42, 43, 44, 45, 46,             // PR
    47, 48, 49,                         // SC
    51, 53, 54, 55,                     // RS
    61, 62, 64,                         // DF / GO
    63,                                 // TO
    65, 66,                             // MT
    67,                                 // MS
    68, 69,                             // AC / RO
    71, 73, 74, 75, 77,                 // BA
    79,                                 // SE
    81, 87,                             // PE
    82,                                 // AL
    83,                                 // PB
    84,                                 // RN
    85, 88,                             // CE
    86, 89,                             // PI
    91, 93, 94,                         // PA
    92, 97,                             // AM
    95,                                 // RR
    96,                                 // AP
    98, 99                              // MA
  ]),

  /**
   * Decodifica URLs do redirecionador do Instagram (l.instagram.com/?u=...)
   */
  decodeInstagramRedirect(url) {
    if (!url) return '';
    try {
      if (url.includes('l.instagram.com') && url.includes('u=')) {
        const parsed = new URL(url);
        const target = parsed.searchParams.get('u');
        if (target) return decodeURIComponent(target);
      }
    } catch (e) {}
    return url;
  },

  /**
   * Extrai e-mail válido da bio e elementos do perfil com suporte a desofuscação
   */
  extractEmail(text, domContext = document) {
    // 1. Prioridade máxima: Links nativos mailto: (gerados por botões de contato do Instagram)
    const mailtoLinks = domContext.querySelectorAll('a[href^="mailto:"]');
    for (const a of mailtoLinks) {
      const href = a.getAttribute('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      if (this._isValidEmail(email)) {
        return email;
      }
    }

    if (!text) return null;

    // 2. Normaliza ofuscações comuns na bio: [at], (at), [@], [arroba], " arroba "
    let normalizedText = text
      .replace(/\[\s*(?:at|@|arroba)\s*\]/gi, '@')
      .replace(/\(\s*(?:at|@|arroba)\s*\)/gi, '@')
      .replace(/\s+(?:arroba|\[at\]|\(at\))\s+/gi, '@')
      .replace(/\[\s*(?:dot|ponto)\s*\]/gi, '.')
      .replace(/\(\s*(?:dot|ponto)\s*\)/gi, '.');

    // 3. Procura e-mails no texto com regex abrangente
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const matches = normalizedText.match(emailRegex);
    if (matches && matches.length > 0) {
      // Prioriza emails com palavras-chave comerciais
      const commercialCandidates = matches.filter(e => {
        const lower = e.toLowerCase();
        return lower.includes('contato') || lower.includes('comercial') || lower.includes('assessoria') || lower.includes('parceria');
      });

      if (commercialCandidates.length > 0 && this._isValidEmail(commercialCandidates[0])) {
        return commercialCandidates[0].toLowerCase();
      }

      for (let email of matches) {
        email = email.trim().toLowerCase();
        if (this._isValidEmail(email)) {
          return email;
        }
      }
    }

    return null;
  },

  _isValidEmail(email) {
    if (!email || email.length < 5 || email.length > 80) return false;
    const lower = email.toLowerCase();
    
    // Extensões de arquivos de imagem e lixo
    if (/\.(png|jpg|jpeg|webp|gif|svg|bmp|mp4|mov)$/i.test(lower)) return false;
    
    // Domínios de infraestrutura interna do Meta/Instagram
    if (lower.includes('instagram.com') || lower.includes('facebook.com') || lower.includes('meta.com') || lower.includes('sentry.io')) {
      return false;
    }

    // Domínio com pelo menos uma extensão válida
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(lower);
  },

  /**
   * Extrai e formata número de WhatsApp / telefone brasileiro
   */
  extractWhatsapp(text, externalUrls = [], domContext = document) {
    // 1. Checa links nativos tel:
    const telLinks = domContext.querySelectorAll('a[href^="tel:"]');
    for (const a of telLinks) {
      const href = a.getAttribute('href') || '';
      const raw = href.replace(/^tel:/i, '').trim();
      const formatted = this.formatPhone(raw);
      if (formatted) return formatted;
    }

    // 2. Checa todos os links externos (wa.me, api.whatsapp.com, wa.link, etc.)
    const urlsToCheck = Array.isArray(externalUrls) ? externalUrls : [externalUrls];
    for (let u of urlsToCheck) {
      if (!u) continue;
      const decoded = this.decodeInstagramRedirect(u);

      // wa.me/5511999999999 ou api.whatsapp.com/send?phone=5511999999999 ou /whatsapp/
      const waLinkMatch = decoded.match(/(?:wa\.me\/(?:message\/)?|api\.whatsapp\.com\/send\/?\?(?:.*&)?phone=|\/whatsapp\/|wa\.link\/)(\+?\d+)/i);
      if (waLinkMatch && waLinkMatch[1]) {
        const formatted = this.formatPhone(waLinkMatch[1]);
        if (formatted) return formatted;
      }

      // Parâmetros de query string phone= ou tel=
      const queryPhoneMatch = decoded.match(/[?&](?:phone|tel|whatsapp)=(\+?\d+)/i);
      if (queryPhoneMatch && queryPhoneMatch[1]) {
        const formatted = this.formatPhone(queryPhoneMatch[1]);
        if (formatted) return formatted;
      }
    }

    if (!text) return null;

    // 3. Procura precedido por termos comerciais ou emojis indicadores: 📲, 📱, 💬, "Whats:", "Assessoria:", etc.
    const labeledRegex = /(?:📲|📱|💬|contato|whats|whatsapp|comercial|assessoria|orcamento|orçamento|parcerias|fale comigo|agenda|agendamento|atendimento)[:\s]*([+\d\s().-]{8,24})/gi;
    let labelMatch;
    while ((labelMatch = labeledRegex.exec(text)) !== null) {
      if (labelMatch[1]) {
        const digits = labelMatch[1].replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 13) {
          const formatted = this.formatPhone(digits);
          if (formatted) return formatted;
        }
      }
    }

    // 4. Procura padrão estruturado de celular brasileiro com DDD:
    // Ex: (11) 98765-4321, 11 98765-4321, +55 11 98765-4321, 11987654321
    const phoneRegex = /(?:\+?55\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:(9\s?[0-9]{4})[\s.-]?([0-9]{4}))/g;
    const matches = Array.from(text.matchAll(phoneRegex));
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const fullDigits = m[0].replace(/\D/g, '');
        if (fullDigits.length >= 10 && fullDigits.length <= 13) {
          const formatted = this.formatPhone(fullDigits);
          if (formatted) return formatted;
        }
      }
    }

    return null;
  },

  /**
   * Formata os dígitos em padrão canônico brasileiro: +55 (DD) 9XXXX-XXXX
   * Valida estritamente se o DDD existe e se o nono dígito é válido para celulares.
   */
  formatPhone(rawDigits) {
    if (!rawDigits) return null;
    let digits = rawDigits.replace(/\D/g, '');

    // Descarte números óbvios de suporte ou muito curtos/longos
    if (digits.length < 10 || digits.length > 14) return null;

    // Se começa com 55 e tem tamanho de número brasileiro completo (12 ou 13 dígitos)
    if (digits.startsWith('55') && digits.length >= 12) {
      digits = digits.substring(2);
    }

    // Celular brasileiro com DDD (11 dígitos, ex: 11987654321)
    if (digits.length === 11) {
      const ddd = parseInt(digits.substring(0, 2), 10);
      const ninthDigit = digits.charAt(2);

      // Celulares móveis no Brasil OBRIGATORIAMENTE começam com o dígito 9 após o DDD
      if (this.validBrazilianDDDs.has(ddd) && ninthDigit === '9') {
        const part1 = digits.substring(2, 7);
        const part2 = digits.substring(7);
        return `+55 (${ddd}) ${part1}-${part2}`;
      }
    }

    // Telefone fixo ou formato anterior com DDD (10 dígitos, ex: 1133334444)
    if (digits.length === 10) {
      const ddd = parseInt(digits.substring(0, 2), 10);
      if (this.validBrazilianDDDs.has(ddd)) {
        const part1 = digits.substring(2, 6);
        const part2 = digits.substring(6);
        return `+55 (${ddd}) ${part1}-${part2}`;
      }
    }

    // Formato internacional plausível (E.164)
    if (digits.length >= 11 && digits.length <= 14) {
      return `+${digits}`;
    }

    return null;
  },

  /**
   * Extrai todos os contatos do DOM da página atual
   */
  extractAllContactsFromPage() {
    const header = document.querySelector('header') || document.querySelector('main') || document.body;
    const headerText = header ? header.innerText : '';

    // Coleta todos os links externos do cabeçalho / bio (incluindo links múltiplos e modais de link)
    const externalLinks = [];
    const linkElements = document.querySelectorAll('header a[href], main header a[href], section a[href]');
    for (const el of linkElements) {
      const href = el.getAttribute('href') || '';
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.includes('wa.me') ||
        href.includes('whatsapp') ||
        href.includes('wa.link') ||
        href.includes('l.instagram.com') ||
        href.includes('linktr.ee') ||
        href.includes('beacons.ai') ||
        el.getAttribute('target') === '_blank'
      ) {
        externalLinks.push(href);
      }
    }

    const email = this.extractEmail(headerText, document);
    const whatsapp = this.extractWhatsapp(headerText, externalLinks, document);

    return { email, whatsapp };
  }
};
