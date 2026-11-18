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
        'div[contenteditable="true"], textarea, div[role="textbox"][contenteditable="true"]'
      ));

      for (const el of candidates) {
        if (el.closest('#innflu-hud-root')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 15) {
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
          const role = (el.getAttribute('role') || '').toLowerCase();

          if (
            window.location.pathname.toLowerCase().includes('/direct/') ||
            aria.includes('mensag') || aria.includes('messag') || aria.includes('convite') || aria.includes('invite') ||
            placeholder.includes('mensag') || placeholder.includes('messag') ||
            role === 'textbox' ||
            el.getAttribute('data-lexical-editor') === 'true'
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
   * Digita a mensagem no editor do Instagram com suporte nativo ao Lexical
   */
  async typeMessageIntoReact(inputEl, text) {
    inputEl.focus();
    await this.sleep(this.randomDelay(200, 350));

    // 1. Colapsa seleção dentro do input
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEl);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}

    // 2. Método primordial para Lexical/DraftJS: document.execCommand('insertText')
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, text);
    } catch (e) {
      inserted = false;
    }

    // 3. Fallback estruturado para Lexical se execCommand falhar
    if (!inserted || !(inputEl.innerText || '').trim()) {
      console.log('[Innflu] Fallback para inserção estruturada no Lexical...');
      try {
        const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        inputEl.innerHTML = `<p class="xat24cr xdj266r xdpxx8g" dir="ltr"><span data-lexical-text="true">${safeText}</span></p>`;
      } catch (e) {
        inputEl.innerText = text;
      }

      try {
        inputEl.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));
        inputEl.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));
      } catch (e) {}
    }

    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(this.randomDelay(400, 600));

    if (!(inputEl.innerText || '').trim()) {
      throw new Error('Falha ao inserir texto no campo de mensagem');
    }
  },

  /**
   * Clica no botão "Enviar" ou "Enviar convite" e despacha tecla Enter
   */
  async submitMessage(inputEl) {
    await this.sleep(this.randomDelay(300, 600));

    // 1. Procura o botão Enviar / Send / Enviar convite
    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    let sendBtn = allButtons.find(b => {
      if (b.closest('#innflu-hud-root')) return false;
      const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
      const rect = b.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const isSendText = t === 'enviar' || t === 'send' || t === 'enviar mensagem' || t === 'enviar convite' || t === 'send invite';
      return isSendText && isVisible;
    });

    if (!sendBtn && inputEl) {
      const container = inputEl.closest('form') || inputEl.closest('div[role="region"]') || inputEl.parentElement?.parentElement?.parentElement;
      if (container) {
        const buttonsInside = Array.from(container.querySelectorAll('button, div[role="button"]')).filter(b => {
          if (b.closest('#innflu-hud-root') || b === inputEl || b.contains(inputEl)) return false;
          const rect = b.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (buttonsInside.length > 0) {
          sendBtn = buttonsInside[buttonsInside.length - 1];
        }
      }
    }

    if (sendBtn) {
      console.log('[Innflu] Clicando no botão de envio:', sendBtn.innerText || sendBtn.getAttribute('aria-label') || 'Botão');
      this.simulateClick(sendBtn);
      await this.sleep(500);
    }

    // 2. Dispara tecla Enter como garantia com sequência completa de eventos
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
   */
  findStoryAvatar() {
    const header = document.querySelector('main header') || document.querySelector('header') || document.querySelector('main');
    if (!header) return null;

    // 1. Link explícito com rota /stories/
    const anchor = header.querySelector('a[href*="/stories/"]');
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return anchor;
    }

    // 2. Canvas do anel de stories (anel gradiente característico)
    const canvas = header.querySelector('canvas');
    if (canvas) {
      const btn = canvas.closest('div[role="button"]') || canvas.closest('div[tabindex="0"]') || canvas.parentElement || canvas;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return btn;
    }

    // 3. Div de botão com aria-label de stories
    const storyBtn = header.querySelector([
      'div[role="button"][aria-label*="story" i]',
      'div[role="button"][aria-label*="stories" i]',
      'div[role="button"][aria-label*="história" i]',
      'div[role="button"][aria-label*="histórias" i]',
      '[aria-label*="story" i]',
      '[aria-label*="stories" i]'
    ].join(','));
    if (storyBtn) {
      const rect = storyBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return storyBtn;
    }

    // 4. Imagem do avatar no cabeçalho
    const avatarImg = header.querySelector('img[alt*="foto" i], img[alt*="profile" i], img');
    if (avatarImg) {
      const btn = avatarImg.closest('div[role="button"]') || avatarImg.closest('a') || avatarImg;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return btn;
    }

    return null;
  },

  /**
   * Aguarda o campo de resposta de Story aparecer
   */
  async waitForStoryReplyInput(timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const candidates = Array.from(document.querySelectorAll([
        'textarea[placeholder*="Responder" i]',
        'textarea[placeholder*="Reply" i]',
        'textarea[placeholder*="Enviar mensagem" i]',
        'textarea[placeholder*="Send message" i]',
        'input[placeholder*="Responder" i]',
        'input[placeholder*="Reply" i]',
        'textarea[aria-label*="Responder" i]',
        'textarea[aria-label*="Reply" i]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea',
        'section input[type="text"]'
      ].join(',')));

      for (const el of candidates) {
        if (el.closest('#innflu-hud-root')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 40 && rect.height > 15) {
          return el;
        }
      }

      await this.sleep(300);
    }
    return null;
  },

  /**
   * Insere o texto da mensagem no campo de resposta do Story
   */
  async typeMessageIntoStoryInput(inputEl, text) {
    inputEl.focus();
    await this.sleep(250);

    const isTextarea = inputEl.tagName === 'TEXTAREA';
    const isInput = inputEl.tagName === 'INPUT';

    if (isTextarea || isInput) {
      const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) {
        setter.call(inputEl, text);
      } else {
        inputEl.value = text;
      }

      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));

      try {
        inputEl.select();
        document.execCommand('insertText', false, text);
      } catch (e) {}
    } else {
      await this.typeMessageIntoReact(inputEl, text);
    }

    await this.sleep(350);
  },

  /**
   * Submete a resposta do Story com Enter e clique no Enviar
   */
  async submitStoryReply(inputEl) {
    inputEl.focus();
    await this.sleep(250);

    // 1. Procura botão Enviar próximo ao input do Story
    const sendBtn = Array.from(document.querySelectorAll('button, div[role="button"]')).find(b => {
      if (b.closest('#innflu-hud-root')) return false;
      const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
      const rect = b.getBoundingClientRect();
      return (t === 'enviar' || t === 'send') && rect.width > 0 && rect.height > 0;
    });

    if (sendBtn) {
      console.log('[Innflu] Clicando no botão Enviar do Story...');
      this.simulateClick(sendBtn);
      await this.sleep(400);
    }

    // 2. Dispara tecla Enter
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
    await this.sleep(800);
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
      'button[aria-label="Close"]'
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
   * Abre o Story ativo da criadora e responde diretamente com a mensagem de captação
   */
  async replyToActiveStory(messageText) {
    const avatarBtn = this.findStoryAvatar();
    if (!avatarBtn) {
      throw new Error('Avatar de Stories não encontrado no perfil');
    }

    console.log('[Innflu] Clicando no anel de Stories da influenciadora...');
    this.simulateClick(avatarBtn);

    // Aguarda o visualizador de stories abrir (rota /stories/ ou modal)
    await this.sleep(1500);

    const inputEl = await this.waitForStoryReplyInput(7000);
    if (!inputEl) {
      throw new Error('Campo de resposta de Story não disponível (respostas desativadas ou indisponíveis neste slide)');
    }

    console.log('[Innflu] Digitando mensagem de captação na resposta do Story...');
    await this.typeMessageIntoStoryInput(inputEl, messageText);

    console.log('[Innflu] Enviando resposta do Story...');
    await this.submitStoryReply(inputEl);

    // Confirma se o texto foi enviado (campo esvaziado)
    await this.sleep(1200);

    console.log('[Innflu] Resposta do Story despachada! Fechando visualizador de Stories...');
    this.closeStoryViewer();
    await this.sleep(1000);

    return true;
  },

  /**
   * Executa o fluxo completo de envio de DM para o perfil atual com confirmação estrita
   */
  async sendDirectMessage(messageText) {
    const preCheck = this.checkActionBlock();
    if (preCheck.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${preCheck.message}`);
    }

    // PRIORIDADE MÁXIMA: Se a criadora possui Stories ativos, abre e responde o Story!
    const hasStories = window.InnfluInspector ? window.InnfluInspector.hasActiveStories() : false;
    if (hasStories) {
      try {
        console.log('[Innflu] Perfil possui Stories ativos! Disparando captação via resposta de Story...');
        const ok = await this.replyToActiveStory(messageText);
        if (ok) {
          return { success: true, viaStory: true };
        }
      } catch (storyErr) {
        console.warn('[Innflu] Não foi possível responder via Story (' + storyErr.message + '). Tentando Direct comum...');
        this.closeStoryViewer();
        await this.sleep(1200);
      }
    }

    const curPath = window.location.pathname.toLowerCase();
    let inputEl = null;

    if (curPath.startsWith('/direct/')) {
      inputEl = await this.waitForMessageInput(5000);
    }

    // Se estamos no perfil, clica no botão "Enviar mensagem"
    if (!inputEl) {
      let messageBtn = this.findMessageButton();
      if (!messageBtn) {
        window.scrollBy({ top: 120, behavior: 'auto' });
        await this.sleep(600);
        window.scrollBy({ top: -120, behavior: 'auto' });
        await this.sleep(400);
        messageBtn = this.findMessageButton();
      }

      if (!messageBtn) {
        throw new Error('Botão "Enviar mensagem" não encontrado no perfil');
      }

      console.log('[Innflu] Clicando no botão Enviar mensagem do perfil...');
      await this.openDirectChat(messageBtn);

      // Aguarda abertura do chat e montagem da caixa de texto
      inputEl = await this.waitForMessageInput(15000);
    }

    if (!inputEl) {
      throw new Error('O chat do Direct não abriu a tempo (caixa de texto não encontrada)');
    }

    // Digita a mensagem
    console.log('[Innflu] Digitando mensagem via React...');
    await this.typeMessageIntoReact(inputEl, messageText);

    // Envia a mensagem
    console.log('[Innflu] Despachando envio...');
    await this.submitMessage(inputEl);

    // VERIFICAÇÃO MANDATÓRIA: Confirma se foi realmente enviada
    console.log('[Innflu] Aguardando confirmação do envio...');
    const result = await this.waitForSendConfirmation(inputEl, messageText, 9000);

    if (!result.confirmed) {
      if (result.blocked) {
        throw new Error(`Ação bloqueada pelo Instagram: ${result.message}`);
      }
      throw new Error(result.message || 'Falha ao confirmar envio da mensagem no Direct');
    }

    // Se estiver na tela do direct, volta ao perfil
    if (window.location.pathname.toLowerCase().startsWith('/direct/')) {
      console.log('[Innflu] DM confirmada com sucesso! Retornando...');
      window.history.back();
      await this.sleep(1200);
    }

    return { success: true, viaStory: false };
  }
};
