/**
 * Crawler & Minerador do Instagram — v3 (Extração Precisa)
 * 
 * CORREÇÕES v3:
 * 1. Validação rigorosa com blacklist de ~200 palavras comuns
 * 2. Extração primária via alt-text (mais confiável no Instagram)
 * 3. Links de perfil SÓ aceitos com contexto visual (avatar, article, header)
 * 4. Click-into-posts para descobrir autores (fallback robusto)
 * 5. Busca sem hashtag por padrão (resultados mais amplos, encontra contas)
 * 6. Console.log para debug
 */
window.InnfluCrawler = {

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // ==========================================
  // VALIDAÇÃO DE USERNAME (RIGOROSA)
  // ==========================================

  /** Palavras que NUNCA são usernames reais */
  _blacklist: new Set([
    // Instagram system paths
    'explore', 'direct', 'stories', 'reels', 'accounts', 'reel',
    'about', 'developer', 'legal', 'privacy', 'terms', 'api', 'help',
    'nametag', 'settings', 'session', 'emails', 'challenge', 'locations',
    'directory', 'lite', 'search', 'tags', 'keyword', 'hashtag',
    'login', 'signup', 'create', 'share', 'save', 'like', 'comment',
    'follow', 'following', 'followers', 'activity', 'notifications',
    'home', 'feed', 'profile', 'edit', 'archive', 'saved', 'close',
    'instagram', 'meta', 'facebook', 'threads', 'messenger',
    'static', 'assets', 'images', 'media', 'content', 'data',
    'embed', 'oauth', 'graphql', 'ajax', 'web', 'app', 'download',
    // Português — palavras comuns
    'ser', 'ver', 'ter', 'por', 'para', 'com', 'sem', 'que', 'mais',
    'como', 'isso', 'esta', 'este', 'esse', 'essa', 'aqui', 'ali',
    'bem', 'bom', 'boa', 'mal', 'pra', 'pro', 'nos', 'nao', 'sim',
    'novo', 'nova', 'real', 'link', 'foto', 'video', 'post', 'page',
    'user', 'name', 'info', 'news', 'blog', 'shop', 'loja', 'site',
    'voce', 'meu', 'minha', 'seu', 'sua', 'nosso', 'nossos', 'tudo',
    'onde', 'quando', 'quem', 'qual', 'cada', 'todo', 'toda', 'todos',
    'dia', 'ano', 'mes', 'hoje', 'agora', 'depois', 'antes', 'vida',
    'muito', 'pouco', 'nada', 'algo', 'outra', 'outro', 'outras',
    'apenas', 'ainda', 'sobre', 'entre', 'desde', 'entre', 'fazer',
    'pode', 'deve', 'quer', 'sabe', 'tipo', 'forma', 'modo', 'caso',
    'parte', 'pois', 'porque', 'conta', 'mundo', 'casa', 'coisa',
    'gente', 'tempo', 'amor', 'deus', 'arte', 'moda', 'saude',
    'beleza', 'viagem', 'festa', 'musica', 'comida', 'roupa',
    'brasil', 'rio', 'paulo', 'bahia', 'minas', 'norte', 'sul',
    // Inglês — palavras comuns curtas
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
    'had', 'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how',
    'its', 'let', 'may', 'new', 'now', 'old', 'see', 'way', 'who',
    'did', 'get', 'got', 'him', 'use', 'ago', 'run', 'set', 'try',
    'top', 'add', 'also', 'back', 'been', 'call', 'come', 'each',
    'from', 'have', 'here', 'high', 'just', 'know', 'last', 'long',
    'look', 'make', 'many', 'most', 'much', 'must', 'next', 'only',
    'over', 'some', 'such', 'take', 'than', 'them', 'then', 'this',
    'time', 'very', 'want', 'well', 'what', 'when', 'will', 'with',
    'work', 'year', 'your', 'more', 'open', 'read', 'send', 'sent',
    'text', 'view', 'show', 'hide', 'true', 'false', 'null', 'click',
    'menu', 'list', 'item', 'icon', 'logo', 'photo', 'image', 'file',
    // Termos de UI do Instagram
    'enviar', 'mensagem', 'seguir', 'seguidores', 'seguindo',
    'publicar', 'curtir', 'comentar', 'compartilhar', 'salvar',
    'pesquisar', 'cancelar', 'confirmar', 'excluir', 'editar',
    'voltar', 'proximo', 'anterior', 'inicio', 'fechar', 'abrir',
    'entrar', 'sair', 'logout', 'config', 'ajuda', 'denunciar',
    'bloquear', 'silenciar', 'restringir', 'desativar', 'ativar',
    // Outras
    'undefined', 'error', 'loading', 'please', 'wait', 'retry'
  ]),

  /**
   * Valida se uma string é um username Instagram real e plausível
   */
  isValidUsername(str) {
    if (!str || typeof str !== 'string') return false;
    const u = str.toLowerCase().trim();
    
    // Regras do Instagram: 1-30 chars, letras, dígitos, pontos, underscores
    if (u.length < 3 || u.length > 30) return false;
    if (!/^[a-z0-9._]+$/.test(u)) return false;
    
    // Deve ter pelo menos uma letra
    if (!/[a-z]/.test(u)) return false;
    
    // Não pode começar/terminar com ponto
    if (u.startsWith('.') || u.endsWith('.')) return false;
    
    // Não pode ter pontos consecutivos
    if (u.includes('..')) return false;
    
    // Blacklist
    if (this._blacklist.has(u)) return false;
    
    // Muito curto sem caracteres especiais = provavelmente lixo
    if (u.length < 4 && !u.includes('.') && !u.includes('_')) return false;
    
    return true;
  },

  // ==========================================
  // DETECÇÃO DE PÁGINA ATUAL
  // ==========================================

  detectCurrentPage() {
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    // Páginas de busca / explore / hashtag (todos os formatos que o Instagram usa)
    if (url.includes('/explore/search/') || url.includes('/explore/tags/') || url.includes('q=%23') || path.startsWith('/explore')) {
      return 'search';
    }

    // Post individual ou Reel
    if (path.match(/^\/p\//) || path.match(/^\/reel\//)) {
      return 'post';
    }

    // Direct / DMs
    if (path.startsWith('/direct/')) {
      return 'direct';
    }

    // Perfil de usuário
    const segments = path.split('/').filter(Boolean);
    const systemPaths = [
      'explore', 'direct', 'stories', 'reels', 'accounts', 'p', 'reel',
      'about', 'developer', 'legal', 'privacy', 'terms', 'api', 'help',
      'nametag', 'settings', 'session', 'emails', 'challenge'
    ];

    if (segments.length >= 1 && segments.length <= 2 && !systemPaths.includes(segments[0])) {
      return 'profile';
    }

    return 'feed';
  },

  getCurrentProfileUsername() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length >= 1) {
      return segments[0].toLowerCase();
    }
    return null;
  },

  // ==========================================
  // NAVEGAÇÃO SEGURA & MULTI-FONTE
  // ==========================================

  /**
   * Navega para a fonte escolhida pelo usuário
   * @param {'keyword' | 'hashtag' | 'reels' | 'followers' | 'following' | 'similar'} source 
   * @param {string} target 
   */
  navigateToSource(source, target) {
    const clean = (target || '').trim();
    if (!clean) return false;

    let targetUrl = '';
    const currentUrl = window.location.href.toLowerCase();

    if (source === 'hashtag' || clean.startsWith('#')) {
      const cleanTag = clean.replace(/^#/, '').toLowerCase();
      targetUrl = `https://www.instagram.com/explore/search/keyword/?q=%23${encodeURIComponent(cleanTag)}`;
      if (currentUrl.includes(cleanTag) && (currentUrl.includes('q=%23') || currentUrl.includes('/explore/tags/'))) {
        console.log('[Innflu] Já estamos na página da hashtag');
        return false;
      }
    } else if (source === 'following' || (source === 'similar' && clean.startsWith('@')) || source === 'followers') {
      const cleanUser = clean.replace(/^@/, '').toLowerCase();
      targetUrl = `https://www.instagram.com/${encodeURIComponent(cleanUser)}/`;
      if (this.getCurrentProfileUsername() === cleanUser) {
        console.log('[Innflu] Já estamos no perfil do alvo');
        return false;
      }
    } else {
      // 'keyword' (busca geral / nicho de influenciadoras)
      const cleanKw = clean.replace(/^[@#]/, '').toLowerCase();
      targetUrl = `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(cleanKw)}`;
      if (currentUrl.includes(encodeURIComponent(cleanKw)) && (currentUrl.includes('/explore/search/') || currentUrl.includes('/explore/tags/'))) {
        console.log('[Innflu] Já estamos na página de busca da palavra-chave');
        return false;
      }
    }

    console.log(`[Innflu] Navegando (${source}): ${targetUrl}`);
    window.location.href = targetUrl;
    return true;
  },

  /**
   * Navega para busca de keyword SEM hashtag (retrocompatibilidade)
   */
  navigateToSearch(keyword) {
    return this.navigateToSource('keyword', keyword);
  },

  openProfile(username) {
    const clean = username.replace('@', '').replace(/[^a-z0-9._]/gi, '').trim().toLowerCase();
    if (!clean) return false;

    if (this.getCurrentProfileUsername() === clean) {
      return false;
    }

    console.log(`[Innflu] Abrindo perfil: @${clean}`);
    window.location.href = `https://www.instagram.com/${clean}/`;
    return true;
  },

  /**
   * Abre o modal de QUEM O PERFIL ESTÁ SEGUINDO (Following) e extrai influenciadoras
   */
  async extractFollowingFromModal(maxScrolls = 5) {
    const currentUsername = this.getCurrentProfileUsername();
    console.log(`[Innflu] Abrindo lista de quem @${currentUsername} está seguindo...`);

    // 1. Procura botão ou link de "Seguindo" / "following" no cabeçalho
    const followingBtn = document.querySelector('header a[href*="/following"], header a[href*="/following/"]') ||
                         Array.from(document.querySelectorAll('header a')).find(a => {
                           const t = (a.innerText || '').toLowerCase();
                           return t.includes('seguindo') || t.includes('following');
                         });
    
    if (followingBtn) {
      console.log('[Innflu] Clicando no link "Seguindo" do perfil...');
      followingBtn.click();
      await this.sleep(this.randomDelay(2200, 3500));
    }

    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
      console.log('[Innflu] Modal de "Seguindo" não abriu ou perfil é privado');
      return [];
    }

    const usernames = new Set();
    const scrollContainer = dialog.querySelector('div[style*="overflow"]') || dialog.querySelector('ul') || dialog;

    for (let i = 0; i < maxScrolls; i++) {
      const dialogLinks = dialog.querySelectorAll('a[href^="/"]');
      for (const a of dialogLinks) {
        const href = a.getAttribute('href') || '';
        const parts = href.split('/').filter(Boolean);
        if (parts.length === 1) {
          const u = parts[0].toLowerCase();
          if (u !== currentUsername && this.isValidUsername(u)) {
            usernames.add(u);
          }
        }
      }

      if (scrollContainer && scrollContainer.scrollBy) {
        scrollContainer.scrollBy({ top: 450, behavior: 'smooth' });
        await this.sleep(1200);
      }
    }

    await this._closeModal();
    const result = Array.from(usernames);
    console.log(`[Innflu] Extraídas ${result.length} contas que @${currentUsername} está seguindo:`, result);
    return result;
  },

  /**
   * Abre o modal de seguidores do perfil (fallback)
   */
  async extractFollowersFromModal(maxScrolls = 4) {
    return this.extractFollowingFromModal(maxScrolls);
  },

  /**
   * Extrai contas semelhantes recomendadas pelo Instagram no perfil atual
   * Clica no botão de sugestões se necessário e raspa o carrossel de recomendados
   */
  async extractSimilarAccounts() {
    const currentUsername = this.getCurrentProfileUsername();
    console.log(`[Innflu] Buscando perfis semelhantes a @${currentUsername}...`);
    const usernames = new Set();

    const collectFromDOM = () => {
      // 1. Procura em containers que contenham títulos de sugestão
      const allElements = Array.from(document.querySelectorAll('span, div, h2, h3, h4'));
      const triggerHeadings = allElements.filter(el => {
        const t = (el.innerText || '').toLowerCase().trim();
        return t === 'sugeridos para você' || t === 'contas semelhantes' || t === 'sugestões para você' ||
               t === 'suggested for you' || t.includes('semelhante') || t.includes('sugerid');
      });

      for (const h of triggerHeadings) {
        let parent = h.closest('div[style*="overflow"]') || h.parentElement?.parentElement || h.closest('section') || h.closest('main');
        if (parent) {
          const links = parent.querySelectorAll('a[href^="/"]');
          for (const a of links) {
            const href = a.getAttribute('href') || '';
            const parts = href.split('/').filter(Boolean);
            if (parts.length === 1) {
              const u = parts[0].toLowerCase();
              if (u !== currentUsername && this.isValidUsername(u)) {
                usernames.add(u);
              }
            }
          }
        }
      }

      // 2. Procura em qualquer item de lista/carrossel que tenha botão "Seguir"
      const listItems = document.querySelectorAll('li, div[role="listitem"]');
      for (const item of listItems) {
        const hasFollow = Array.from(item.querySelectorAll('button')).some(b => {
          const t = (b.innerText || '').toLowerCase();
          return t === 'seguir' || t === 'follow' || t === 'seguir de volta';
        });
        if (hasFollow) {
          const a = item.querySelector('a[href^="/"]');
          if (a) {
            const parts = (a.getAttribute('href') || '').split('/').filter(Boolean);
            if (parts.length === 1) {
              const u = parts[0].toLowerCase();
              if (u !== currentUsername && this.isValidUsername(u)) {
                usernames.add(u);
              }
            }
          }
        }
      }
    };

    collectFromDOM();

    // Se ainda tem poucas sugestões, clica no botão de sugestões do header
    if (usernames.size < 3) {
      const header = document.querySelector('header');
      if (header) {
        // Busca botão por aria-labels
        let suggestBtn = header.querySelector([
          'button[aria-label*="semelhante" i]',
          'button[aria-label*="sugerid" i]',
          'button[aria-label*="suggest" i]',
          'button[aria-label*="similar" i]',
          'button[aria-label*="descobrir pessoas" i]',
          '[aria-label*="semelhante" i]',
          '[aria-label*="sugerid" i]'
        ].join(','));
        
        // Se não achou pelo label, procura botão no header que contenha ícone (SVG de user+plus ou seta)
        // e que não seja Seguir, Mensagem, Opções (...), etc.
        if (!suggestBtn) {
          const allButtons = Array.from(header.querySelectorAll('button, div[role="button"]'));
          suggestBtn = allButtons.find(b => {
            const text = (b.innerText || '').toLowerCase();
            if (text.includes('seguir') || text.includes('seguindo') || text.includes('mensagem') ||
                text.includes('message') || text.includes('editar') || text.includes('edit')) {
              return false;
            }
            // Não deve ser o botão de opções (três pontinhos)
            const ariaLabel = (b.getAttribute('aria-label') || '').toLowerCase();
            if (ariaLabel.includes('opções') || ariaLabel.includes('options') || ariaLabel.includes('menu')) {
              return false;
            }
            // Tem SVG dentro
            return !!b.querySelector('svg');
          });
        }

        if (suggestBtn) {
          console.log('[Innflu] Clicando no botão de sugestões/semelhantes do perfil...');
          suggestBtn.click();
          await this.sleep(this.randomDelay(2200, 3200));
          collectFromDOM();
        }
      }
    }

    // Rola o carrossel de sugestões se existir para carregar mais
    const carousels = document.querySelectorAll('div[style*="overflow"], ul[style*="overflow"], div[role="region"]');
    for (const c of carousels) {
      if ((c.innerText || '').toLowerCase().includes('seguir') || (c.innerText || '').toLowerCase().includes('sugerid')) {
        if (c.scrollBy) {
          c.scrollBy({ left: 500, behavior: 'smooth' });
          await this.sleep(1000);
          collectFromDOM();
        }
      }
    }

    // Se houver botão "Ver tudo" / "See all" nas sugestões, clica para abrir mais
    const seeAllBtn = Array.from(document.querySelectorAll('a, button, span[role="button"]')).find(el => {
      const t = (el.innerText || '').toLowerCase().trim();
      return (t === 'ver tudo' || t === 'see all' || t === 'ver todos' || t === 'mostrar tudo') && !el.closest('header');
    });

    if (seeAllBtn) {
      console.log('[Innflu] Clicando em "Ver tudo" das contas semelhantes...');
      seeAllBtn.click();
      await this.sleep(this.randomDelay(2500, 3500));
      collectFromDOM();

      const dialog = document.querySelector('div[role="dialog"]');
      if (dialog) {
        // Rola dialog para carregar mais
        const dialogScroll = dialog.querySelector('div[style*="overflow"]') || dialog;
        for (let i = 0; i < 3; i++) {
          const dLinks = dialog.querySelectorAll('a[href^="/"]');
          for (const a of dLinks) {
            const parts = (a.getAttribute('href') || '').split('/').filter(Boolean);
            if (parts.length === 1) {
              const u = parts[0].toLowerCase();
              if (u !== currentUsername && this.isValidUsername(u)) {
                usernames.add(u);
              }
            }
          }
          if (dialogScroll.scrollBy) {
            dialogScroll.scrollBy({ top: 400, behavior: 'smooth' });
            await this.sleep(1000);
          }
        }
        await this._closeModal();
      }
    }

    const result = Array.from(usernames);
    console.log(`[Innflu] Extraídos ${result.length} perfis semelhantes de @${currentUsername}:`, result);
    return result;
  },

  // ==========================================
  // EXTRAÇÃO DE USERNAMES — ESTRATÉGIAS PRECISAS
  // ==========================================

  /**
   * ESTRATÉGIA 1 (PRIMÁRIA): Alt-text das imagens
   * No Instagram, fotos/reels têm alt como:
   *   "Foto de @username" / "Photo by @username on Instagram"
   *   "Foto publicada por USERNAME"
   *   "@username compartilhou uma foto"
   */
  _extractFromAltText() {
    const usernames = new Set();
    const allImages = document.querySelectorAll('img[alt]');
    
    for (const img of allImages) {
      const alt = img.getAttribute('alt') || '';
      if (alt.length < 5) continue;
      
      // Padrão 1: "@username" explícito (mais confiável)
      const atMentions = alt.match(/@([a-zA-Z0-9._]{3,30})/g);
      if (atMentions) {
        for (const mention of atMentions) {
          const u = mention.replace('@', '').toLowerCase();
          if (this.isValidUsername(u)) {
            usernames.add(u);
          }
        }
      }
      
      // Padrão 2: "Foto de USERNAME" / "Photo by USERNAME" / "publicada por USERNAME"
      const byPatterns = [
        /(?:foto\s+(?:de|por)|photo\s+(?:by|shared\s+by))\s+([a-zA-Z0-9._]{3,30})/gi,
        /(?:publicad[oa]\s+por|posted\s+by)\s+([a-zA-Z0-9._]{3,30})/gi,
        /(?:v[íi]deo\s+(?:de|por))\s+([a-zA-Z0-9._]{3,30})/gi
      ];
      
      for (const pattern of byPatterns) {
        pattern.lastIndex = 0; // Reset regex state
        let match;
        while ((match = pattern.exec(alt)) !== null) {
          const u = match[1].toLowerCase();
          if (this.isValidUsername(u)) {
            usernames.add(u);
          }
        }
      }
    }
    
    console.log(`[Innflu] Alt-text → ${usernames.size} usernames:`, Array.from(usernames));
    return usernames;
  },

  /**
   * ESTRATÉGIA 2: Links de perfil COM contexto visual obrigatório
   * Só aceita link /username/ se tiver:
   *   - Avatar (img) como descendente, OU
   *   - Estar dentro de article/header (= autor de post), OU
   *   - Texto do link = username (menção direta)
   */
  _extractFromContextualLinks() {
    const usernames = new Set();
    const links = document.querySelectorAll('a[href^="/"]');
    
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const parts = href.split('/').filter(Boolean);
      
      // Deve ser link de perfil: exatamente 1 segmento de path
      if (parts.length !== 1) continue;
      
      const u = parts[0].toLowerCase();
      if (!this.isValidUsername(u)) continue;
      
      // OBRIGATÓRIO: deve ter contexto que confirma que é um perfil
      const hasAvatar = a.querySelector('img');
      const inArticle = !!a.closest('article');
      const inHeader = !!a.closest('header');
      const textMatch = a.textContent.trim().toLowerCase().replace('@', '') === u;
      
      if (hasAvatar || inArticle || inHeader || textMatch) {
        usernames.add(u);
      }
    }
    
    console.log(`[Innflu] Contextual links → ${usernames.size} usernames:`, Array.from(usernames));
    return usernames;
  },

  /**
   * MASTER: combina estratégias com validação
   * Retorna apenas usernames que passaram por validação rigorosa
   */
  extractUsernamesFromPage() {
    const combined = new Set();
    
    // Estratégia 1: Alt text (mais confiável em páginas de busca/explore)
    this._extractFromAltText().forEach(u => combined.add(u));
    
    // Estratégia 2: Links com contexto visual
    this._extractFromContextualLinks().forEach(u => combined.add(u));
    
    const result = Array.from(combined);
    console.log(`[Innflu] ✅ Total extraído: ${result.length} usernames válidos:`, result);
    return result;
  },

  // ==========================================
  // CLICK-INTO-POSTS (MÉTODO PRECISO & SEGURO)
  // ==========================================

  /**
   * Extrai contas sugeridas diretamente do painel/dropdown de busca do Instagram
   */
  extractFromSearchDropdown() {
    const usernames = new Set();
    const links = document.querySelectorAll('div[role="dialog"] a[href^="/"], div[aria-label*="Pesquisa" i] a[href^="/"], nav a[href^="/"]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const parts = href.split('/').filter(Boolean);
      if (parts.length === 1 && this.isValidUsername(parts[0])) {
        if (a.querySelector('img') || a.innerText.toLowerCase().includes(parts[0])) {
          usernames.add(parts[0].toLowerCase());
        }
      }
    }
    return Array.from(usernames);
  },

  /**
   * Normaliza links de posts/reels para evitar inconsistências com parâmetros ou barras
   * Exemplo: /reel/C12345/?utm_source=... -> /reel/C12345/
   */
  normalizePostHref(href) {
    if (!href) return '';
    try {
      const clean = href.split('?')[0].split('#')[0].trim().replace(/\/+$/, '');
      return clean ? clean + '/' : '';
    } catch (e) {
      return href;
    }
  },

  /**
   * Extrai criadores diretamente da grade visível (alt-text de Reels/Posts)
   * Sem precisar clicar ou abrir modais!
   * @param {string[]} visitedUsers Lista de usernames já visitados
   * @returns {{ creators: string[], postHrefs: string[] }}
   */
  extractCreatorsFromVisibleGrid(visitedUsers = []) {
    const visitedSet = new Set((visitedUsers || []).map(u => u.toLowerCase()));
    const discovered = [];
    const discoveredPosts = [];

    const postLinks = document.querySelectorAll('a[href^="/p/"], a[href^="/reel/"]');
    for (const a of postLinks) {
      const rawHref = a.getAttribute('href');
      const href = this.normalizePostHref(rawHref);
      const img = a.querySelector('img[alt]');
      if (!img) continue;

      const alt = img.getAttribute('alt') || '';
      let author = null;

      // Padrão 1: @username
      const atMatch = alt.match(/@([a-zA-Z0-9._]{3,30})/);
      if (atMatch && this.isValidUsername(atMatch[1])) {
        author = atMatch[1].toLowerCase();
      } else {
        // Padrão 2: "Reel de Fulana (@fulana)" ou "Foto de/por Fulana"
        const byMatch = alt.match(/(?:foto\s+(?:de|por)|photo\s+(?:by|shared\s+by)|v[íi]deo\s+(?:de|por)|reel\s+(?:de|por))\s+([a-zA-Z0-9._]{3,30})/i);
        if (byMatch && this.isValidUsername(byMatch[1])) {
          author = byMatch[1].toLowerCase();
        }
      }

      if (author && !visitedSet.has(author)) {
        if (!discovered.includes(author)) {
          discovered.push(author);
        }
        if (href && !discoveredPosts.includes(href)) {
          discoveredPosts.push(href);
        }
      }
    }

    console.log(`[Innflu] Grade visível → ${discovered.length} criadoras novas descobertas:`, discovered);
    return { creators: discovered, postHrefs: discoveredPosts };
  },

  /**
   * Encontra a PRÓXIMA publicação ainda não inspecionada na página
   * @param {string[]} visitedPosts Lista de hrefs já inspecionados
   * @returns {{ element: HTMLElement, href: string, rawHref: string } | null}
   */
  getNextUnvisitedPost(visitedPosts = []) {
    const visitedSet = new Set((visitedPosts || []).map(h => this.normalizePostHref(h)));
    const postLinks = Array.from(document.querySelectorAll('a[href^="/p/"], a[href^="/reel/"]'));

    for (const a of postLinks) {
      const rawHref = a.getAttribute('href');
      const normHref = this.normalizePostHref(rawHref);
      if (normHref && !visitedSet.has(normHref)) {
        return { element: a, href: normHref, rawHref };
      }
    }
    return null;
  },

  /**
   * Extrai o autor do post/reel atual (no modal ou na página direta /p/ ou /reel/)
   * @returns {string | null}
   */
  extractPostAuthor() {
    const authorSelectors = [
      'div[role="dialog"] header a[href^="/"]',
      'div[role="dialog"] a[role="link"][href^="/"]',
      'article header a[href^="/"]',
      'article a[role="link"][href^="/"]',
      'header a[href^="/"]',
      'main header a[href^="/"]',
      'h2 a[href^="/"]'
    ];

    for (const sel of authorSelectors) {
      const links = document.querySelectorAll(sel);
      for (const a of links) {
        const hrefAttr = a.getAttribute('href') || '';
        const parts = hrefAttr.split('/').filter(Boolean);
        if (parts.length === 1) {
          const u = parts[0].toLowerCase();
          if (this.isValidUsername(u)) {
            return u;
          }
        }
      }
    }

    // Fallback: alt-text no modal/página
    const altUsers = Array.from(this._extractFromAltText());
    if (altUsers.length > 0) {
      return altUsers[0];
    }

    return null;
  },

  /**
   * Clica em posts NÃO INSPECIONADOS na grid (retrocompatibilidade robusta)
   * @param {number} maxPosts
   * @param {string[]} alreadyVisitedPosts
   */
  async clickPostsAndExtractAuthors(maxPosts = 5, alreadyVisitedPosts = []) {
    const visitedSet = new Set((alreadyVisitedPosts || []).map(h => this.normalizePostHref(h)));
    const postLinks = Array.from(
      document.querySelectorAll('a[href^="/p/"], a[href^="/reel/"]')
    );
    
    const uninspected = postLinks.filter(a => {
      const norm = this.normalizePostHref(a.getAttribute('href'));
      return norm && !visitedSet.has(norm);
    });

    if (uninspected.length === 0) {
      return { authors: [], inspectedHrefs: [] };
    }

    const usernames = new Set();
    const newlyInspectedHrefs = [];
    const count = Math.min(uninspected.length, maxPosts);

    for (let idx = 0; idx < count; idx++) {
      try {
        const postEl = uninspected[idx];
        if (!postEl) continue;

        const normHref = this.normalizePostHref(postEl.getAttribute('href'));
        if (normHref) {
          visitedSet.add(normHref);
          newlyInspectedHrefs.push(normHref);
        }

        // Tenta extrair antes de clicar via alt text
        let fastAuthor = null;
        const innerImg = postEl.querySelector('img[alt]');
        if (innerImg) {
          const alt = innerImg.getAttribute('alt') || '';
          const atMatch = alt.match(/@([a-zA-Z0-9._]{3,30})/);
          if (atMatch && this.isValidUsername(atMatch[1])) {
            fastAuthor = atMatch[1].toLowerCase();
          }
        }

        if (fastAuthor) {
          usernames.add(fastAuthor);
          continue;
        }

        // Clica no post
        postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.sleep(400);
        postEl.click();
        await this.sleep(this.randomDelay(2000, 3000));

        const author = this.extractPostAuthor();
        if (author) usernames.add(author);

        const curPath = window.location.pathname.toLowerCase();
        if (curPath.startsWith('/p/') || curPath.startsWith('/reel/')) {
          window.history.back();
          await this.sleep(1800);
        } else {
          await this._closeModal();
          await this.sleep(this.randomDelay(600, 1000));
        }

      } catch (err) {
        await this._closeModal();
      }
    }
    
    return { authors: Array.from(usernames), inspectedHrefs: newlyInspectedHrefs };
  },

  /**
   * Fecha modal aberto (post, stories, etc)
   */
  async _closeModal() {
    const closeSelectors = [
      'svg[aria-label="Fechar"]', 'svg[aria-label="Close"]',
      '[aria-label="Fechar"]', '[aria-label="Close"]',
      'button svg[aria-label*="close" i]', 'button svg[aria-label*="fechar" i]',
      'div[role="dialog"] button'
    ];
    
    for (const sel of closeSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const btn = el.closest('button') || el.closest('[role="button"]') || el;
        btn.click();
        await this.sleep(500);
        return;
      }
    }
    
    // Fallback: Escape
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', keyCode: 27, bubbles: true
    }));
    await this.sleep(500);
  },

  /**
   * Rola o feed para carregar mais conteúdo
   */
  async scrollDown() {
    window.scrollBy({
      top: 600 + Math.random() * 400,
      behavior: 'smooth'
    });
    await this.sleep(this.randomDelay(1500, 2500));
  }
};
