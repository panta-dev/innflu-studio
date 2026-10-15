/**
 * Extrator Avançado de Contatos (WhatsApp e E-mail) do Instagram — v2
 * Analisa bio, botões de ação nativos (mailto/tel), links externos decodificados (wa.me, Linktree, etc.)
 */
window.InnfluContactExtractor = {

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
   * Extrai e-mail válido da bio e elementos do perfil
   */
  extractEmail(text, domContext = document) {
    // 1. Prioridade máxima: Links nativos mailto: (gerados por botões "Email" do Instagram)
    const mailtoLinks = domContext.querySelectorAll('a[href^="mailto:"]');
    for (const a of mailtoLinks) {
      const href = a.getAttribute('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      if (this._isValidEmail(email)) {
        return email;
      }
    }

    // 2. Procura e-mails no texto (bio, header, etc.)
    if (!text) return null;
    const emailRegex = /([a-zA-Z0-9._%+-]+(?:\s*@\s*|\s*\[at\]\s*|\s*\(at\)\s*)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const matches = text.match(emailRegex);
    if (matches) {
      for (let email of matches) {
        email = email.replace(/\s*\[at\]\s*|\s*\(at\)\s*/gi, '@').replace(/\s+/g, '').toLowerCase();
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
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return false;
    if (lower.includes('instagram.com') || lower.includes('facebook.com') || lower.includes('meta.com')) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(lower);
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

    // 2. Checa todos os links externos (wa.me, api.whatsapp.com, etc.)
    const urlsToCheck = Array.isArray(externalUrls) ? externalUrls : [externalUrls];
    for (let u of urlsToCheck) {
      if (!u) continue;
      const decoded = this.decodeInstagramRedirect(u);

      // wa.me/5511999999999 ou api.whatsapp.com/send?phone=5511999999999
      const waLinkMatch = decoded.match(/(?:wa\.me\/(?:message\/)?|api\.whatsapp\.com\/send\?phone=|\/whatsapp\/)(\+?\d+)/i);
      if (waLinkMatch && waLinkMatch[1]) {
        const formatted = this.formatPhone(waLinkMatch[1]);
        if (formatted) return formatted;
      }

      // Se o link tiver telefone na query string (ex: phone=5511...)
      const queryPhoneMatch = decoded.match(/[?&]phone=(\+?\d+)/i);
      if (queryPhoneMatch && queryPhoneMatch[1]) {
        const formatted = this.formatPhone(queryPhoneMatch[1]);
        if (formatted) return formatted;
      }
    }

    if (!text) return null;

    // 3. Procura após termos indicadores: "Contato:", "Whats:", "Assessoria:", "Comercial:"
    const labeledMatch = text.match(/(?:contato|whats|whatsapp|comercial|assessoria|orcamento|orçamento|parcerias|fale comigo|agenda)[:\s]*([+\d\s().-]{8,22})/i);
    if (labeledMatch && labeledMatch[1]) {
      const digits = labeledMatch[1].replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) {
        const formatted = this.formatPhone(digits);
        if (formatted) return formatted;
      }
    }

    // 4. Procura padrão genérico de celular brasileiro: (DD) 9XXXX-XXXX ou DD 9XXXXXXXX
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
   * Formata os dígitos em um padrão legível: +55 (DD) 9XXXX-XXXX
   */
  formatPhone(rawDigits) {
    if (!rawDigits) return null;
    let digits = rawDigits.replace(/\D/g, '');
    
    // Remove código do país duplicado
    if (digits.startsWith('55') && digits.length >= 12) {
      digits = digits.substring(2);
    }

    // Celular brasileiro com DDD (11 dígitos)
    if (digits.length === 11) {
      const ddd = parseInt(digits.substring(0, 2), 10);
      if (ddd >= 11 && ddd <= 99) {
        const part1 = digits.substring(2, 7);
        const part2 = digits.substring(7);
        return `+55 (${ddd}) ${part1}-${part2}`;
      }
    }

    // Fixo ou celular antigo com DDD (10 dígitos)
    if (digits.length === 10) {
      const ddd = parseInt(digits.substring(0, 2), 10);
      if (ddd >= 11 && ddd <= 99) {
        const part1 = digits.substring(2, 6);
        const part2 = digits.substring(6);
        return `+55 (${ddd}) ${part1}-${part2}`;
      }
    }

    // Número internacional ou outro formato com 11-13 dígitos
    if (digits.length >= 10 && digits.length <= 14) {
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

    // Coleta todos os links externos do cabeçalho / bio
    const externalLinks = [];
    const linkElements = document.querySelectorAll('header a[href], main a[href]');
    for (const el of linkElements) {
      const href = el.getAttribute('href') || '';
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.includes('wa.me') ||
        href.includes('whatsapp') ||
        href.includes('l.instagram.com') ||
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
