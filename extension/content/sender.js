/**
 * Innflu Sender — Módulo de Envio de DM com Simulação Humana,
 * Validação Estrita de Envio, Suporte a React 18 e Tratamento de Convites
 */
window.InnfluSender = {

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  randomDelay(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  },

  /**
   * Verifica se apareceu algum aviso de "Ação Bloqueada" ou checkpoint do Instagram
   */
  checkActionBlock() {
    const dialogs = document.querySelectorAll('div[role="dialog"], div[role="alertdialog"], .x1n2onr6');
    for (const el of dialogs) {
      if (el.closest('#innflu-hud-root')) continue;
      const content = (el.innerText || '').toLowerCase();
      if (
        content.includes('ação bloqueada') ||
        content.includes('bloqueamos temporariamente') ||
        content.includes('tente novamente mais tarde') ||
        content.includes('action blocked') ||
        content.includes('try again later') ||
        content.includes('restringimos determinadas atividades') ||
        content.includes('we restrict certain activity') ||
        content.includes('confirm that you own this account') ||
        content.includes('confirme que esta conta é sua') ||
        content.includes('não foi possível enviar a mensagem') ||
        content.includes('failed to send')
      ) {
        return { blocked: true, message: el.innerText.trim() };
      }
    }

    const toasts = document.querySelectorAll('div[role="status"], div[aria-live="polite"], div[aria-live="assertive"]');
    for (const toast of toasts) {
      if (toast.closest('#innflu-hud-root')) continue;
      const txt = (toast.innerText || '').toLowerCase();
      if (
        txt.includes('bloque') ||
        txt.includes('action blocked') ||
        txt.includes('tente mais tarde') ||
        txt.includes('não foi possível') ||
        txt.includes('couldn\'t send')
      ) {
        return { blocked: true, message: toast.innerText.trim() };
      }
    }

    return { blocked: false };
  },

  /**
   * Localiza o botão "Enviar mensagem" no perfil do Instagram
   */
  findMessageButton() {
    // 1. Foca prioritariamente no cabeçalho do perfil (<header>) dentro de <main>
    const header = document.querySelector('main header') || document.querySelector('header') || document.querySelector('main');
    if (!header) return null;

    // 2. Coleta todos os botões e links clicáveis DENTRO do cabeçalho
    const candidates = Array.from(header.querySelectorAll('button, div[role="button"], a[role="button"], a'));

    const targetKeywords = [
      'enviar mensagem',
      'mensagem',
      'message',
      'send message',
      'enviar convite',
      'send invite',
      'enviar solicitação',
      'send request'
    ];

    for (const btn of candidates) {
      if (btn.closest('#innflu-hud-root') || btn.closest('nav') || btn.closest('aside')) continue;
      // Ignora links genéricos de caixa de entrada
      if (btn.tagName === 'A' && btn.href && btn.href.includes('/direct/inbox')) continue;

      const rawText = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
      const text = rawText.replace(/\s+/g, ' ').trim();

      // Não confunda com o link geral da barra lateral ("mensagens")
      if (text === 'mensagens' || text === 'messages') continue;

      const isMatch = targetKeywords.some(kw => text === kw || text.startsWith(kw) || text.includes(kw));
      if (isMatch) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const parentAnchor = btn.closest('a[href*="/direct/"]');
          return parentAnchor || btn;
        }
      }
    }

    // 3. Estratégia de Proximidade: Procura o botão adjacente ao botão de Seguir/Seguindo
    const followButtons = Array.from(header.querySelectorAll('button, div[role="button"]')).filter(b => {
      const t = (b.innerText || '').toLowerCase().trim();
      return t === 'seguir' || t === 'seguindo' || t === 'follow' || t === 'following';
    });

    for (const fBtn of followButtons) {
      const parent = fBtn.parentElement?.parentElement || fBtn.parentElement;
      if (parent) {
        const siblingButtons = Array.from(parent.querySelectorAll('button, div[role="button"]')).filter(b => b !== fBtn && !b.contains(fBtn) && !fBtn.contains(b));
        for (const sBtn of siblingButtons) {
          if (sBtn.closest('#innflu-hud-root')) continue;
          const txt = (sBtn.innerText || sBtn.getAttribute('aria-label') || '').toLowerCase().trim();
          if (txt === 'mensagens' || txt === 'messages') continue;
          if (txt.includes('mensag') || txt.includes('messag') || txt.includes('convite') || txt.includes('invite')) {
            const rect = sBtn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return sBtn;
          }
        }
      }
    }

    return null;
  },

  /**
   * Dispara sequência de cliques e eventos compatível com React 18
   */
  simulateClick(element) {
    if (!element) return;
    try {
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
    } catch (e) {}

    const rect = element.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    const commonProps = {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: window.screenX + clientX,
      screenY: window.screenY + clientY,
      clientX: clientX,
      clientY: clientY,
      button: 0,
      buttons: 1,
      which: 1
    };

    element.focus();
    element.dispatchEvent(new PointerEvent('pointerover', commonProps));
    element.dispatchEvent(new PointerEvent('pointerenter', commonProps));
    element.dispatchEvent(new PointerEvent('pointerdown', commonProps));
    element.dispatchEvent(new MouseEvent('mouseover', commonProps));
    element.dispatchEvent(new MouseEvent('mousedown', commonProps));

    element.dispatchEvent(new PointerEvent('pointerup', { ...commonProps, buttons: 0 }));
    element.dispatchEvent(new MouseEvent('mouseup', { ...commonProps, buttons: 0 }));
    element.dispatchEvent(new MouseEvent('click', { ...commonProps, buttons: 0 }));

    if (typeof element.click === 'function') {
      try { element.click(); } catch (e) {}
    }

    // Se o elemento contiver um filho clicável interno do React, despacha também
    const innerClickable = element.querySelector('div, span, button');
    if (innerClickable && innerClickable !== element) {
      try {
        innerClickable.dispatchEvent(new MouseEvent('click', { ...commonProps, buttons: 0 }));
      } catch (e) {}
    }
  },

  /**
   * Clica e abre o chat do Direct
   */
  async openDirectChat(element) {
    if (!element) return;

    // Se possui href com direct, navega ou clica na âncora
    const anchor = element.closest('a') || (element.tagName === 'A' ? element : null) || element.querySelector('a');
    if (anchor && anchor.href && anchor.href.includes('/direct/') && !anchor.href.includes('/direct/inbox')) {
      console.log('[Innflu] Abrindo Direct via link:', anchor.href);
      try { anchor.click(); } catch (e) {}
      await this.sleep(1500);
      if (window.location.pathname.startsWith('/direct/')) {
        return;
      }
      window.location.href = anchor.href;
      return;
    }

    this.simulateClick(element);
    await this.sleep(this.randomDelay(200, 400));
  },

  /**
   * Aguarda a caixa de texto legítima do Direct aparecer no DOM
   */
  async waitForMessageInput(timeoutMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const candidates = Array.from(document.querySelectorAll(
        'div[contenteditable="true"][data-lexical-editor="true"], div[role="textbox"][contenteditable="true"], div[contenteditable="true"], textarea'
      ));

      for (const el of candidates) {
        if (el.closest('#innflu-hud-root')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 60 && rect.height > 15 && rect.bottom > window.innerHeight * 0.4) {
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
          const role = (el.getAttribute('role') || '').toLowerCase();

          // Nunca selecionar barra de pesquisa / busca
          if (aria.includes('pesquis') || aria.includes('search') || placeholder.includes('pesquis') || placeholder.includes('search')) {
            continue;
          }

          if (
            aria.includes('mensag') || aria.includes('messag') || aria.includes('convite') || aria.includes('invite') ||
            placeholder.includes('mensag') || placeholder.includes('messag') ||
            el.getAttribute('data-lexical-editor') === 'true' ||
            role === 'textbox'
          ) {
            return el;
          }
        }
      }

      await this.sleep(300);
    }
    return null;
  },

  /**
   * Limpa rigorosamente qualquer rascunho ou texto residual antes de digitar
   */
  async clearInput(inputEl) {
    if (!inputEl) return;
    try {
      inputEl.focus();
      if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }

      // Para editor contenteditable (Lexical / DraftJS)
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEl);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('delete', false, null);

      if ((inputEl.innerText || '').trim().length > 0) {
        inputEl.innerHTML = '<p class="xat24cr xdj266r xdpxx8g" dir="ltr"><br></p>';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (e) {
      console.warn('[Innflu] Erro ao limpar campo:', e);
    }
    await this.sleep(150);
  },

  /**
   * Digita a mensagem no editor do Instagram com suporte nativo ao Lexical
   * Usa document.execCommand('insertText') linha a linha (tratado nativamente pelo browser no Lexical).
   */
  async typeMessageIntoReact(inputEl, text) {
    if (!inputEl) return;
    inputEl.focus();
    await this.sleep(this.randomDelay(200, 350));

    // 1. Limpa completamente qualquer texto anterior para NUNCA duplicar rascunhos
    await this.clearInput(inputEl);
    inputEl.focus();
    await this.sleep(120);

    // 2. Insere via document.execCommand('insertText') linha por linha (browser dispara beforeinput confiável para o Lexical)
    let inserted = false;
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEl);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      const lines = String(text || '').split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
          const ok = document.execCommand('insertText', false, lines[i]);
          if (ok) inserted = true;
        }
        if (i < lines.length - 1) {
          document.execCommand('insertLineBreak', false, null);
        }
      }
    } catch (e) {
      inserted = false;
    }

    let textNow = (inputEl.innerText || '').trim();

    // 3. Fallback: ClipboardEvent('paste') caso execCommand não tenha preenchido
    if (!inserted || textNow.length === 0) {
      try {
        inputEl.focus();
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const pasteEv = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        inputEl.dispatchEvent(pasteEv);
        await this.sleep(250);
        textNow = (inputEl.innerText || '').trim();
      } catch (e) {}
    }

    // 4. Último recurso: beforeinput
    if (textNow.length === 0) {
      try {
        inputEl.focus();
        inputEl.dispatchEvent(new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: text,
          bubbles: true,
          cancelable: true
        }));
        await this.sleep(200);
        textNow = (inputEl.innerText || '').trim();
      } catch (e) {}
    }

    if (textNow.length === 0) {
      throw new Error('Falha ao inserir texto no editor do Direct (Lexical não aceitou entrada).');
    }

    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    await this.sleep(this.randomDelay(300, 500));

    // Fecha eventual popup de menção (@) aberto pelo Lexical sem apagar o texto
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
    await this.sleep(150);

    console.log(`[Innflu] Mensagem única inserida no Lexical (${textNow.length} caracteres).`);
  },

  /**
   * Clica no botão "Enviar" / ícone SVG de envio ou "Enviar convite" e despacha tecla Enter
   */
  async submitMessage(inputEl) {
    await this.sleep(this.randomDelay(350, 650));

    const findSendBtn = () => {
      const container = inputEl
        ? (inputEl.closest('form') || inputEl.closest('div[role="region"]') || inputEl.parentElement?.parentElement?.parentElement?.parentElement || document)
        : document;

      const localButtons = Array.from(container.querySelectorAll('button, div[role="button"]'));
      let btn = localButtons.find(b => {
        if (b.closest('#innflu-hud-root') || b === inputEl || b.contains(inputEl)) return false;
        const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
        const rect = b.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || rect.bottom < window.innerHeight * 0.4) return false;
        const isSendText = t === 'enviar' || t === 'send' || t === 'enviar mensagem' || t === 'enviar convite' || t === 'send invite';
        const hasSendSvg = !!b.querySelector('svg[aria-label*="Enviar" i], svg[aria-label*="Send" i]');
        return isSendText || hasSendSvg;
      });

      if (!btn) {
        const allButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        btn = allButtons.find(b => {
          if (b.closest('#innflu-hud-root') || b === inputEl || b.contains(inputEl)) return false;
          const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
          const rect = b.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0 || rect.bottom < window.innerHeight * 0.4) return false;
          const isSendText = t === 'enviar' || t === 'send' || t === 'enviar mensagem' || t === 'enviar convite' || t === 'send invite';
          const hasSendSvg = !!b.querySelector('svg[aria-label*="Enviar" i], svg[aria-label*="Send" i]');
          return isSendText || hasSendSvg;
        });
      }
      return btn;
    };

    // Aguarda até 1.5s pelo botão Enviar renderizar após o texto ser inserido
    let sendBtn = null;
    for (let i = 0; i < 6 && !sendBtn; i++) {
      sendBtn = findSendBtn();
      if (!sendBtn) await this.sleep(250);
    }

    if (sendBtn) {
      console.log('[Innflu] Clicando no botão de envio:', sendBtn.innerText || sendBtn.getAttribute('aria-label') || 'Botão/SVG');
      this.simulateClick(sendBtn);
      await this.sleep(700);
    }

    // 2. Se o campo ainda tem texto, dispara tecla Enter como garantia
    if (inputEl && inputEl.isConnected && (inputEl.innerText || inputEl.value || '').trim().length > 0) {
      inputEl.focus();
      const enterProps = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        charCode: 13,
        bubbles: true,
        cancelable: true,
        view: window
      };
      inputEl.dispatchEvent(new KeyboardEvent('keydown', enterProps));
      inputEl.dispatchEvent(new KeyboardEvent('keypress', enterProps));
      inputEl.dispatchEvent(new KeyboardEvent('keyup', enterProps));
      await this.sleep(700);
    }
  },

  /**
   * VERIFICAÇÃO CRUCIAL: Confirma se a mensagem foi REALMENTE enviada
   * (Não prossegue para o descanso anti-ban sem confirmação positiva)
   */
  async waitForSendConfirmation(inputEl, sentText, timeoutMs = 8000) {
    const start = Date.now();
    const prefix = (sentText || '').substring(0, 20).toLowerCase().trim();

    while (Date.now() - start < timeoutMs) {
      // 1. Checa se houve bloqueio pós-clique
      const blockCheck = this.checkActionBlock();
      if (blockCheck.blocked) {
        return { confirmed: false, blocked: true, message: blockCheck.message };
      }

      // 2. Critério 1: O campo de texto foi limpo pelo React (indica que a mensagem foi despachada)
      const inputRemaining = (inputEl.innerText || '').trim();
      const inputCleared = inputRemaining.length === 0 || inputRemaining === '\n';

      // 3. Critério 2: A mensagem apareceu na lista de mensagens do chat
      const chatMessages = Array.from(document.querySelectorAll('div[role="row"], div[dir="auto"], span.x193iq5w'));
      const textFoundInThread = chatMessages.some(el => {
        if (el.closest('#innflu-hud-root') || el === inputEl || el.contains(inputEl)) return false;
        const msgContent = (el.innerText || '').toLowerCase();
        return prefix && msgContent.includes(prefix);
      });

      // 4. Critério 3: Aviso de convite enviado na tela
      const pageText = document.body.innerText.toLowerCase();
      const inviteSent = (
        pageText.includes('convite enviado') ||
        pageText.includes('invite sent') ||
        pageText.includes('você enviou um convite') ||
        pageText.includes('you sent an invite') ||
        pageText.includes('solicitação de mensagem enviada')
      );

      if (inputCleared || textFoundInThread || inviteSent) {
        console.log('[Innflu] Confirmação de envio validada:', { inputCleared, textFoundInThread, inviteSent });
        return { confirmed: true };
      }

      // Retry intermediário no meio do tempo (se o botão Enviar ainda estiver visível)
      if (Date.now() - start > 4000 && Date.now() - start < 4500) {
        console.log('[Innflu] Tentando reenviar com Enter...');
        inputEl.focus();
        const enterProps = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, bubbles: true, cancelable: true };
        inputEl.dispatchEvent(new KeyboardEvent('keydown', enterProps));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', enterProps));
      }

      await this.sleep(400);
    }

    return { confirmed: false, message: 'A mensagem não foi confirmada pelo Instagram como enviada (o texto permaneceu no editor).' };
  },

  /**
   * Executa o fluxo completo de envio de DM para o perfil atual com confirmação estrita
   */
  /**
   * Localiza o avatar / anel de Stories da influenciadora no perfil
   * REGRA CRÍTICA: Ignora terminantemente DESTAQUES (highlights) que ficam abaixo da bio.
   * Apenas seleciona o Avatar Principal do topo.
   */
  _isInsideHighlights(el) {
    if (!el) return false;
    if (el.closest('a[href*="/stories/highlights/"]')) return true;
    if (el.closest('ul, [role="list"]')) return true;
    let cur = el;
    for (let i = 0; i < 6 && cur; i++) {
      const aria = (cur.getAttribute && cur.getAttribute('aria-label') || '').toLowerCase();
      if (aria.includes('destaque') || aria.includes('highlight')) return true;
      cur = cur.parentElement;
    }
    return false;
  },

  findStoryAvatar(username = null) {
    const cleanUser = (username || window.location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase().replace('@', '');
    const header = document.querySelector('main header') || document.querySelector('header') || document.querySelector('main > div > header');
    if (!header) return null;

    // 1. Link direto para Stories de 24h (Ex: /stories/username/ — e NUNCA /stories/highlights/...)
    const validStoryLinks = Array.from(header.querySelectorAll('a[href*="/stories/"]')).filter(a => {
      const h = (a.getAttribute('href') || '').toLowerCase();
      if (h.includes('/highlights/')) return false; // Destaque excluído!
      if (this._isInsideHighlights(a)) return false;
      return cleanUser ? h.includes(cleanUser) : true;
    });

    for (const a of validStoryLinks) {
      if (!a.closest('div[role="menu"]')) {
        const rect = a.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return a;
      }
    }

    // 2. Elemento clicável que contém o canvas do anel de stories (sobre o avatar grande)
    const canvases = Array.from(header.querySelectorAll('canvas')).filter(cv => {
      if (this._isInsideHighlights(cv)) return false;
      const rect = cv.getBoundingClientRect();
      return rect.width >= 55 && rect.height >= 55;
    });

    if (canvases.length > 0) {
      const cv = canvases[0];
      const btn = cv.closest('div[role="button"]') || cv.closest('div[tabindex="0"]') || cv.closest('a') || cv.parentElement;
      if (btn && !this._isInsideHighlights(btn)) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return btn;
      }
      return cv;
    }

    // 3. Div de botão com aria-label de stories (excluindo destaques)
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
      if (this._isInsideHighlights(b)) return false;
      const rect = b.getBoundingClientRect();
      return rect.width >= 55 && rect.height >= 55;
    });

    if (storyButtons.length > 0) return storyButtons[0];

    return null;
  },

  /**
   * Abre o Story garantindo que o visualizador de Stories de 24h seja carregado
   * REGRA CRÍTICA: NUNCA abre Destaques (Highlights).
   */
  async openStoryViewer(username) {
    const cleanUser = (username || window.location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase().replace('@', '');
    if (window.InnfluInspector && typeof window.InnfluInspector.hasActiveStories === 'function') {
      if (!window.InnfluInspector.hasActiveStories(cleanUser)) {
        console.log(`[Innflu] @${cleanUser} sem Stories ativos de 24h. Ignorando para evitar Destaques.`);
        return false;
      }
    }
    const header = document.querySelector('main header') || document.querySelector('header') || document.querySelector('main > div > header');

    console.log(`[Innflu] Tentando abrir Stories de 24h de @${cleanUser}...`);

    // 1. Procura link explícito e limpo para /stories/username/ (sem highlights)
    if (header) {
      const validLinks = Array.from(header.querySelectorAll('a[href*="/stories/"]')).filter(a => {
        const h = (a.getAttribute('href') || '').toLowerCase();
        return !h.includes('/highlights/') && !this._isInsideHighlights(a) && (cleanUser ? h.includes(cleanUser) : true);
      });

      if (validLinks.length > 0) {
        this.simulateClick(validLinks[0]);
        await this.sleep(1500);
        if (this.isStoryViewerOpen()) return true;
      }
    }

    // 2. Procura avatar / anel de stories e clica
    const avatarBtn = this.findStoryAvatar(cleanUser);
    if (avatarBtn) {
      this.simulateClick(avatarBtn);
      await this.sleep(1500);
      if (this.isStoryViewerOpen()) return true;
    }

    // 3. Se houver canvas no avatar do header, clica nele diretamente
    const canvases = header ? Array.from(header.querySelectorAll('canvas')).filter(cv => !this._isInsideHighlights(cv)) : [];
    if (canvases.length > 0) {
      const canvas = canvases[0];
      this.simulateClick(canvas);
      if (canvas.parentElement) this.simulateClick(canvas.parentElement);
      await this.sleep(1500);
      if (this.isStoryViewerOpen()) return true;
    }

    // Aguarda até mais 1500ms para confirmação de abertura assíncrona do modal de stories
    for (let t = 0; t < 5; t++) {
      if (this.isStoryViewerOpen()) return true;
      await this.sleep(300);
    }

    // Se por acidente caiu em /stories/highlights/, fecha imediatamente!
    if (window.location.pathname.toLowerCase().includes('/stories/highlights/')) {
      console.warn('[Innflu] Destaque aberto por engano ao tentar abrir stories. Fechando imediatamente...');
      this.closeStoryViewer();
      return false;
    }

    return this.isStoryViewerOpen();
  },

  /**
   * Verifica se o visualizador de Stories de 24h está atualmente aberto na tela
   * REGRA: Retorna FALSE se for Destaque (Highlights).
   */
  isStoryViewerOpen() {
    const path = window.location.pathname.toLowerCase();
    // Se a rota for de destaques, NÃO É story ativo de 24h!
    if (path.includes('/stories/highlights/')) {
      return false;
    }

    if (path.includes('/stories/')) return true;

    // Detecta elementos exclusivos do visualizador de Stories do Instagram Web
    const storyProgress = document.querySelector('div[role="progressbar"], div[style*="animation"]');
    const storyDialog = document.querySelector('section._ac7v, div[role="dialog"] section, section[role="region"]');
    const storyInput = document.querySelector('textarea[placeholder*="Responder" i], textarea[placeholder*="Reply" i], input[placeholder*="Responder" i]');
    
    // Se a tela tiver elementos de Destaques salvos, rejeita
    if (document.querySelector('a[href*="/stories/highlights/"]') && !path.includes('/stories/')) {
      return false;
    }

    return !!(storyProgress && (storyDialog || storyInput));
  },

  /**
   * Aguarda o campo de resposta de Story aparecer e o ativa
   */
  async waitForStoryReplyInput(timeoutMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // 1. Clica em placeholders/botões do tipo "Responder a..." para ativar o textarea
      const clickables = Array.from(document.querySelectorAll([
        'div[role="button"][aria-label*="Responder" i]',
        'div[role="button"][aria-label*="Reply" i]',
        'div[role="button"][aria-label*="Enviar mensagem" i]',
        'div[role="button"][aria-label*="Send message" i]',
        'div[tabindex="0"][aria-label*="Responder" i]',
        'div[tabindex="0"][aria-label*="Reply" i]'
      ].join(',')));

      for (const btn of clickables) {
        if (btn.closest('#innflu-hud-root')) continue;
        const rect = btn.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 15 && rect.bottom > window.innerHeight * 0.3) {
          this.simulateClick(btn);
          await this.sleep(300);
          break;
        }
      }

      // 2. Procura textarea ou input ativo no Story
      const candidates = Array.from(document.querySelectorAll([
        'textarea[placeholder*="Responder" i]',
        'textarea[placeholder*="Reply" i]',
        'textarea[placeholder*="Enviar" i]',
        'textarea[placeholder*="Send" i]',
        'textarea[aria-label*="Responder" i]',
        'textarea[aria-label*="Reply" i]',
        'input[placeholder*="Responder" i]',
        'input[placeholder*="Reply" i]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea'
      ].join(',')));

      for (const el of candidates) {
        if (el.closest('#innflu-hud-root')) continue;
        const rect = el.getBoundingClientRect();
        // Ignora campos de busca / comentário que não são a resposta do Story
        const hint = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('placeholder') || '')).toLowerCase();
        if (hint.includes('pesquis') || hint.includes('search') || hint.includes('comentá') || hint.includes('comment')) continue;
        // O input do story fica na metade inferior da tela
        if (rect.width > 40 && rect.height > 15 && rect.bottom > window.innerHeight * 0.3) {
          return el;
        }
      }

      await this.sleep(300);
    }
    return null;
  },

  /**
   * Insere o texto da mensagem no campo de resposta do Story de forma limpa (sem duplicar!)
   */
  async typeMessageIntoStoryInput(inputEl, text) {
    if (!inputEl) return;
    inputEl.focus();
    await this.sleep(200);

    const isTextarea = inputEl.tagName === 'TEXTAREA';
    const isInput = inputEl.tagName === 'INPUT';

    if (isTextarea || isInput) {
      // Resposta de Story é de linha única: junta as quebras de linha
      text = (text || '').replace(/\s*\n+\s*/g, ' ').trim();

      // Setter nativo + reset do _valueTracker do React 18 para o estado interno reconhecer 100%
      const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

      if (setter) {
        setter.call(inputEl, '');
      } else {
        inputEl.value = '';
      }
      if (inputEl._valueTracker) {
        inputEl._valueTracker.setValue('');
      }

      inputEl.focus();
      if (setter) {
        setter.call(inputEl, text);
      } else {
        inputEl.value = text;
      }

      inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      await this.typeMessageIntoReact(inputEl, text);
    }

    await this.sleep(400);
  },

  /**
   * Submete a resposta do Story com botão Enviar (dentro do container do input) e tecla Enter
   */
  async submitStoryReply(inputEl) {
    inputEl.focus();
    await this.sleep(250);

    // 1. Procura botão Enviar / Send exclusivamente próximo ao input do Story (nunca no perfil de fundo)
    const container = inputEl.closest('form') || inputEl.parentElement?.parentElement?.parentElement || document;
    const sendBtn = Array.from(container.querySelectorAll('button, div[role="button"]')).find(b => {
      if (b.closest('#innflu-hud-root') || b === inputEl || b.contains(inputEl)) return false;
      const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
      const rect = b.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && rect.bottom > window.innerHeight * 0.3;
      const isSendText = t === 'enviar' || t === 'send';
      return isSendText && isVisible;
    });

    if (sendBtn) {
      console.log('[Innflu] Clicando no botão Enviar do Story...');
      this.simulateClick(sendBtn);
      await this.sleep(500);
    }

    // 2. Dispara tecla Enter como garantia com sequência completa de eventos
    if (inputEl && inputEl.isConnected && ((inputEl.value !== undefined ? inputEl.value : inputEl.innerText) || '').trim().length > 0) {
      const enterProps = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        charCode: 13,
        bubbles: true,
        cancelable: true,
        view: window
      };
      inputEl.dispatchEvent(new KeyboardEvent('keydown', enterProps));
      inputEl.dispatchEvent(new KeyboardEvent('keypress', enterProps));
      inputEl.dispatchEvent(new KeyboardEvent('keyup', enterProps));
    }
    await this.sleep(1200);
  },

  /**
   * Fecha o visualizador de Stories do Instagram e volta ao perfil
   */
  closeStoryViewer() {
    // 1. Botão Fechar (ícone de X ou SVG com aria-label Fechar / Close)
    const closeBtn = document.querySelector([
      'div[role="button"] svg[aria-label="Fechar"]',
      'div[role="button"] svg[aria-label="Close"]',
      'svg[aria-label="Fechar"]',
      'svg[aria-label="Close"]',
      'button[aria-label="Fechar"]',
      'button[aria-label="Close"]',
      'div[role="button"][aria-label="Fechar"]',
      'div[role="button"][aria-label="Close"]'
    ].join(','));

    if (closeBtn) {
      const btn = closeBtn.closest('div[role="button"]') || closeBtn.closest('button') || closeBtn;
      this.simulateClick(btn);
    }

    // 2. Tecla Escape
    const escProps = { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true, view: window };
    document.dispatchEvent(new KeyboardEvent('keydown', escProps));
    document.dispatchEvent(new KeyboardEvent('keyup', escProps));

    // 3. Fallback de histórico
    setTimeout(() => {
      if (window.location.pathname.toLowerCase().includes('/stories/')) {
        window.history.back();
      }
    }, 400);
  },

  /**
   * Procura avisos de erro do Instagram (ex.: "Ocorreu um erro. Tente novamente.") fora do HUD.
   */
  findSendErrorToast() {
    const re = /ocorreu um erro|tente novamente|algo deu errado|n[ãa]o foi poss[ií]vel enviar|something went wrong|an error occurred|couldn.t send|failed to send|try again/i;
    const nodes = document.querySelectorAll('div, span');
    for (const el of nodes) {
      if (el.closest('#innflu-hud-root')) continue;
      if (el.children.length > 2) continue;
      const t = (el.innerText || '').trim();
      if (t && t.length < 90 && re.test(t)) return t;
    }
    return '';
  },

  /**
   * Confere via API interna do Instagram se a mensagem chegou ao Direct (inbox e solicitações).
   * Retorna true (achou), false (API ok mas não achou) ou null (API indisponível).
   */
  async verifySentViaApi(messageText, username, sinceMs) {
    const needle = this.normalizeNeedle(messageText);
    const user = (username || '').toLowerCase();
    const csrf = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';
    let claim = '0';
    try { claim = sessionStorage.getItem('www-claim-v2') || '0'; } catch (e) { /* ignora */ }
    const headers = { 'x-ig-app-id': '936619743392459', 'x-csrftoken': csrf, 'x-requested-with': 'XMLHttpRequest', 'x-asbd-id': '129477', 'x-ig-www-claim': claim, 'accept': '*/*' };
    let apiWorked = false;
    let got404 = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await this.sleep(2000);
      for (const path of ['inbox/?limit=20', 'pending_inbox/?limit=20']) {
        try {
          const r = await fetch(`/api/v1/direct_v2/${path}`, { credentials: 'include', headers });
          if (r.status === 404) {
            console.warn(`[Innflu] API ${path} respondeu 404 (endpoint indisponível). Saindo sem esperar.`);
            got404 = true;
            break;
          }
          if (!r.ok) { console.warn(`[Innflu] API ${path} respondeu ${r.status}`); continue; }
          const j = await r.json();
          const threads = (j.inbox && j.inbox.threads) || [];
          apiWorked = true;
          for (const t of threads) {
            const users = (t.users || []).map(u => (u.username || '').toLowerCase());
            if (user && !users.includes(user)) continue;
            for (const it of (t.items || [])) {
              const txt = (it.text || (it.reel_share && it.reel_share.text) || (it.story_share && it.story_share.text) || (it.link && it.link.text) || '');
              const ts = Math.floor((parseInt(it.timestamp, 10) || 0) / 1000);
              const textOk = needle && txt.toLowerCase().replace(/\s+/g, '').includes(needle);
              if (textOk && it.is_sent_by_viewer === true && ts >= sinceMs) return true;
            }
          }
        } catch (e) { /* tenta o próximo */ }
      }
      if (got404) break;
    }
    return apiWorked ? false : null;
  },

  /**
   * Abre o Story ativo da criadora e responde diretamente com a mensagem de captação
   */
  async replyToActiveStory(messageText, username, baseline = 0) {
    const cleanUser = (username || window.location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase().replace('@', '');

    console.log(`[Innflu] Abrindo Stories de @${cleanUser} para envio de mensagem...`);
    const opened = await this.openStoryViewer(cleanUser);

    // Proteção estrita: se abriu destaque (highlight), fecha e recusa
    if (window.location.pathname.toLowerCase().includes('/stories/highlights/')) {
      this.closeStoryViewer();
      throw new Error(`@${cleanUser} possui apenas Destaques salvos e nenhum Story ativo nas últimas 24h.`);
    }

    if (!opened && !this.isStoryViewerOpen()) {
      throw new Error(`Não foi possível abrir os Stories de @${cleanUser} (sem stories ativos ou privados)`);
    }

    await this.sleep(1200);

    const inputEl = await this.waitForStoryReplyInput(6000);
    if (!inputEl) {
      throw new Error(`Campo de resposta de Story não disponível para @${cleanUser} (respostas desativadas neste story)`);
    }

    console.log(`[Innflu] Digitando mensagem de captação no Story de @${cleanUser}...`);
    await this.typeMessageIntoStoryInput(inputEl, messageText);

    const typedNow = ((inputEl.value !== undefined ? inputEl.value : inputEl.innerText) || '').trim();
    if (!typedNow) {
      console.warn('[Innflu] Campo do Story parece vazio após digitar; seguindo mesmo assim e conferindo depois.');
    }
    const sentAfterMs = Date.now() - 60000;

    console.log(`[Innflu] Enviando resposta do Story para @${cleanUser}...`);
    await this.submitStoryReply(inputEl);

    // Confirma envio de verdade (antes assumia sucesso sem checar)
    const confirm = await this.waitForStoryConfirmation(inputEl, 6000);
    if (confirm.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${confirm.message}`);
    }
    if (!confirm.confirmed) {
      throw new Error(confirm.message);
    }

    // Aviso de erro do Instagram logo após enviar = não enviou
    for (let i = 0; i < 6; i++) {
      const errToast = this.findSendErrorToast();
      if (errToast) {
        this.closeStoryViewer();
        await this.sleep(800);
        throw new Error(`Instagram recusou a resposta do Story: ${errToast}`);
      }
      await this.sleep(500);
    }

    // Campo esvaziado NÃO prova envio. Confere pela API do Instagram (sem sair do perfil).
    const api = await this.verifySentViaApi(messageText, cleanUser, sentAfterMs);
    console.log(`[Innflu] Conferência via API: ${api}`);
    const lateErr = this.findSendErrorToast();
    if (lateErr) {
      this.closeStoryViewer();
      await this.sleep(800);
      throw new Error(`Instagram recusou a resposta do Story: ${lateErr}`);
    }
    if (api === false) {
      // A API respondeu e NÃO há mensagem sua recente nessa conversa: não foi entregue.
      this.closeStoryViewer();
      await this.sleep(800);
      throw new Error('o Instagram não entregou a resposta do Story (não aparece no seu Direct)');
    }
    if (api === null) {
      // Não foi possível consultar a API: confere abrindo a conversa
      console.log('[Innflu] API indisponível; conferindo na conversa...');
      this.closeStoryViewer();
      await this.sleep(1200);
      const check = await this.verifyStoryReplyInThread(messageText, cleanUser, baseline);
      if (check.verified !== true) {
        throw new Error('não foi possível confirmar o envio do Story (não contado como enviado)');
      }
      await this.leaveThread();
      return { ok: true, confirmed: true };
    }
    console.log(`[Innflu] Resposta do Story confirmada. Fechando visualizador...`);
    this.closeStoryViewer();
    for (let i = 0; i < 5; i++) {
      await this.sleep(600);
      const closeErr = this.findSendErrorToast();
      if (closeErr) throw new Error(`Instagram recusou a resposta do Story: ${closeErr}`);
    }
    return { ok: true, confirmed: true };
  },

  /**
   * Executa o fluxo completo de envio de DM para o perfil atual com confirmação estrita
   */
  async sendDirectMessage(messageText, opts = {}) {
    const preCheck = this.checkActionBlock();
    if (preCheck.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${preCheck.message}`);
    }

    const curPath = window.location.pathname.toLowerCase();
    const cleanUser = curPath.split('/').filter(Boolean)[0] || '';

    const baseline = 0;

    // 1ª tentativa: responder ao Story ativo da influenciadora
    console.log(`[Innflu] Tentando responder ao Story de @${cleanUser}...`);
    let storyErrMsg = '';
    let openInput = null;
    try {
      const info = await this.replyToActiveStory(messageText, cleanUser, baseline);
      if (info && info.ok) {
        return { success: true, viaStory: true };
      } else {
        storyErrMsg = 'Stories não disponíveis para envio';
      }
    } catch (storyErr) {
      storyErrMsg = storyErr.message || 'erro desconhecido no Story';
      console.warn(`[Innflu] Falha ao enviar via Story: ${storyErrMsg}`);
      this.closeStoryViewer();
      await this.sleep(1200);
      // Bloqueio do Instagram: nunca insistir por outro caminho
      if (/bloque|blocked|checkpoint/i.test(storyErrMsg)) {
        throw new Error(storyErrMsg);
      }
    }

    // 2ª tentativa (fallback): enviar DM pela conversa do Direct
    console.log(`[Innflu] Story não confirmado (${storyErrMsg}). Enviando por DM direto para @${cleanUser}...`);
    try {
      const res = await this.sendViaDirect(messageText, cleanUser, openInput, baseline);
      return { success: true, viaStory: false, verified: true, storyError: storyErrMsg };
    } catch (dmErr) {
      if (/bloque|blocked|checkpoint/i.test(dmErr.message || '')) {
        throw dmErr;
      }
      throw new Error(`Story: ${storyErrMsg} | DM: ${dmErr.message}`);
    }
  },

  /**
   * Fallback: abre o chat do Direct pelo botão do perfil, digita e confirma o envio
   */
  async sendViaDirect(messageText, cleanUser, existingInput = null, baseline = 0) {
    let inputEl = existingInput && existingInput.isConnected ? existingInput : null;

    if (!inputEl) {
      // Garante que estamos no perfil (fecha viewer de Stories se ainda estiver aberto)
      if (this.isStoryViewerOpen()) {
        this.closeStoryViewer();
        await this.sleep(1200);
      }

      if (window.location.pathname.toLowerCase().startsWith('/direct/')) {
        inputEl = await this.waitForMessageInput(5000);
      }

      if (!inputEl) {
        // Aguarda o botão de mensagem aparecer (até ~6s)
        let msgBtn = null;
        for (let i = 0; i < 20 && !msgBtn; i++) {
          msgBtn = this.findMessageButton();
          if (!msgBtn) await this.sleep(300);
        }
        if (!msgBtn) {
          throw new Error('botão "Enviar mensagem" não disponível no perfil');
        }

        await this.openDirectChat(msgBtn);
        inputEl = await this.waitForMessageInput(15000);
        if (!inputEl) {
          throw new Error('campo de mensagem do Direct não abriu');
        }
        await this.sleep(1500);
      }
    }

    // Conta as cópias que já existem; o envio só vale se aparecer UMA A MAIS
    const before = this.countTextOnPage(messageText);

    await this.typeMessageIntoReact(inputEl, messageText);
    await this.submitMessage(inputEl);

    const result = await this.confirmSentInThread(inputEl, messageText, before, 10000);
    if (result.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${result.message}`);
    }
    if (!result.confirmed) {
      throw new Error(result.message || 'envio no Direct não confirmado');
    }

    await this.sleep(800);
    await this.leaveThread();
    return 'sent';
  },

  /**
   * Normaliza texto para comparação (sem espaços, minúsculo, só o começo da mensagem)
   */
  normalizeNeedle(text) {
    return (text || '').toLowerCase().replace(/\s+/g, '').slice(0, 28);
  },

  /**
   * Conta quantas vezes o início da mensagem aparece como TEXTO VISÍVEL na página
   * (ignora o HUD do Innflu, campos de digitação e scripts). É a prova real de que
   * a mensagem apareceu na conversa.
   */
  countTextOnPage(text) {
    const needle = this.normalizeNeedle(text);
    if (!needle) return 0;
    let acc = '';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const p = node.parentElement;
      if (!p) continue;
      if (p.closest('#innflu-hud-root') || p.closest('textarea') || p.closest('[contenteditable="true"]') || p.closest('script,style,noscript')) continue;
      const t = node.nodeValue;
      if (t && t.trim()) acc += t;
    }
    acc = acc.toLowerCase().replace(/\s+/g, '');
    let count = 0, idx = 0;
    while ((idx = acc.indexOf(needle, idx)) !== -1) { count++; idx += needle.length; }
    return count;
  },

  /**
   * Confirma envio no Direct: só vale se o TEXTO aparecer na conversa
   * (campo esvaziado sozinho NÃO é prova de envio)
   */
  async confirmSentInThread(inputEl, text, countBefore = 0, timeoutMs = 10000) {
    const start = Date.now();
    let retried = false;
    while (Date.now() - start < timeoutMs) {
      const blockCheck = this.checkActionBlock();
      if (blockCheck.blocked) {
        return { confirmed: false, blocked: true, message: blockCheck.message };
      }
      const errToast = this.findSendErrorToast();
      if (errToast) {
        return { confirmed: false, message: `Instagram recusou a DM: ${errToast}` };
      }
      const editorEmpty = !inputEl || !inputEl.isConnected || (inputEl.innerText || inputEl.value || '').trim().length === 0;
      if (editorEmpty && this.countTextOnPage(text) > countBefore) {
        return { confirmed: true };
      }
      if (!retried && Date.now() - start > 4500 && inputEl && inputEl.isConnected && (inputEl.innerText || inputEl.value || '').trim()) {
        retried = true;
        await this.submitMessage(inputEl);
      }
      await this.sleep(500);
    }
    return { confirmed: false, message: 'a mensagem não apareceu na conversa do Direct (não foi enviada)' };
  },

  /**
   * Abre a conversa, conta quantas cópias (início) da mensagem já existem e volta ao perfil.
   */
  async measureBaseline(messageText) {
    try {
      let msgBtn = null;
      for (let i = 0; i < 17 && !msgBtn; i++) {
        msgBtn = this.findMessageButton();
        if (!msgBtn) await this.sleep(300);
      }
      if (!msgBtn) return 0;
      await this.openDirectChat(msgBtn);
      const inputEl = await this.waitForMessageInput(12000);
      if (!inputEl) { await this.leaveThread(); return 0; }
      await this.sleep(2500);
      const n = this.countTextOnPage(messageText);
      await this.leaveThread();
      await this.sleep(800);
      return n;
    } catch (e) {
      return 0;
    }
  },

  /**
   * Analisa as mensagens da conversa aberta: separa as que NÓS enviamos (lado direito)
   * das que ELA enviou (lado esquerdo).
   */
  analyzeThreadMessages(inputEl) {
    const inputRect = inputEl.getBoundingClientRect();
    const centerX = inputRect.left + inputRect.width / 2;
    let incoming = 0, outgoing = 0;
    const rows = Array.from(document.querySelectorAll('div[role="row"]'));
    for (const row of rows) {
      if (row.closest('#innflu-hud-root') || row.contains(inputEl)) continue;
      const texts = Array.from(row.querySelectorAll('div[dir="auto"], span[dir="auto"]')).filter(el => {
        const t = (el.innerText || '').trim();
        if (!t) return false;
        // só o elemento mais interno (evita contar o mesmo balão várias vezes)
        return !el.querySelector('div[dir="auto"], span[dir="auto"]');
      });
      for (const el of texts) {
        const r = el.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) continue;
        const cx = r.left + r.width / 2;
        if (cx < centerX - 40) incoming++;
        else if (cx > centerX + 40) outgoing++;
      }
    }
    return { hasIncoming: incoming > 0, hasOutgoing: outgoing > 0, incoming, outgoing };
  },

  /**
   * Abre a conversa com a influenciadora, lê quem escreveu o quê e volta ao perfil.
   * Retorna { opened, hasIncoming, hasOutgoing }
   */
  async inspectThread(cleanUser) {
    let msgBtn = null;
    for (let i = 0; i < 17 && !msgBtn; i++) {
      msgBtn = this.findMessageButton();
      if (!msgBtn) await this.sleep(300);
    }
    if (!msgBtn) return { opened: false };

    await this.openDirectChat(msgBtn);
    const inputEl = await this.waitForMessageInput(12000);
    if (!inputEl) {
      await this.leaveThread();
      return { opened: false };
    }

    // Dá tempo do histórico carregar
    await this.sleep(2800);
    const res = this.analyzeThreadMessages(inputEl);
    console.log(`[Innflu] Conversa com @${cleanUser}: ela=${res.incoming} msgs, nós=${res.outgoing} msgs`);
    await this.leaveThread();
    return { opened: true, ...res };
  },

  /**
   * Sai da conversa do Direct (ou fecha janelinha flutuante de chat) e volta ao perfil
   */
  async leaveThread() {
    if (window.location.pathname.toLowerCase().startsWith('/direct/')) {
      window.history.back();
      await this.sleep(1500);
      return;
    }
    // Se estiver na janelinha flutuante no canto inferior direito, fecha pelo botão X
    const closeBtns = Array.from(document.querySelectorAll('div[role="button"], button')).filter(b => {
      if (b.closest('#innflu-hud-root')) return false;
      const aria = (b.getAttribute('aria-label') || '').toLowerCase();
      const svgAria = (b.querySelector('svg')?.getAttribute('aria-label') || '').toLowerCase();
      const isClose = aria.includes('fechar') || aria.includes('close') || svgAria.includes('fechar') || svgAria.includes('close');
      if (!isClose) return false;
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.right > window.innerWidth * 0.5 && r.top > window.innerHeight * 0.35;
    });
    if (closeBtns.length > 0) {
      this.simulateClick(closeBtns[0]);
      await this.sleep(400);
    }
  },

  /**
   * Depois de responder ao Story, abre a conversa e CONFERE se a mensagem está lá.
   * Retorna { verified: true | false | null, inputEl }  (null = não foi possível verificar)
   */
  async verifyStoryReplyInThread(messageText, cleanUser, baseline = 0) {
    // Garante que estamos de volta ao perfil
    for (let i = 0; i < 10 && window.location.pathname.toLowerCase().startsWith('/stories/'); i++) {
      if (i === 4) { window.history.back(); }
      await this.sleep(400);
    }
    if (this.isStoryViewerOpen()) {
      this.closeStoryViewer();
      await this.sleep(1200);
    }

    let msgBtn = null;
    for (let i = 0; i < 17 && !msgBtn; i++) {
      msgBtn = this.findMessageButton();
      if (!msgBtn) await this.sleep(300);
    }
    if (!msgBtn) return { verified: null };

    await this.openDirectChat(msgBtn);
    const inputEl = await this.waitForMessageInput(12000);
    if (!inputEl) return { verified: null };

    // Dá tempo da conversa carregar e procura o texto enviado
    const start = Date.now();
    while (Date.now() - start < 6500) {
      // Só vale se apareceu uma cópia A MAIS do que havia antes (mensagens antigas iguais não contam)
      if (this.countTextOnPage(messageText) > baseline) return { verified: true, inputEl };
      await this.sleep(500);
    }
    return { verified: false, inputEl };
  },

  /**
   * Confirma que a resposta do Story foi realmente enviada
   */
  async waitForStoryConfirmation(inputEl, timeoutMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const blockCheck = this.checkActionBlock();
      if (blockCheck.blocked) {
        return { confirmed: false, blocked: true, message: blockCheck.message };
      }

      // Se o campo foi removido do DOM sem confirmação prévia, o Story pode ter fechado/mudado de slide
      if (!inputEl.isConnected) {
        await this.sleep(600);
        if (!this.isStoryViewerOpen()) {
          return { confirmed: false, message: 'O Story fechou antes de confirmar o envio.' };
        }
        return { confirmed: true };
      }
      const remaining = ((inputEl.value !== undefined ? inputEl.value : inputEl.innerText) || '').trim();
      if (remaining.length === 0) return { confirmed: true };

      // Retry com Enter no meio do tempo
      if (Date.now() - start > 3000 && Date.now() - start < 3500) {
        inputEl.focus();
        const enterProps = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, bubbles: true, cancelable: true };
        inputEl.dispatchEvent(new KeyboardEvent('keydown', enterProps));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', enterProps));
      }
      await this.sleep(400);
    }
    return { confirmed: false, message: 'resposta do Story não confirmada (texto permaneceu no campo)' };
  }
};
