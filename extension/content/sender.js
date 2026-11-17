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
    const candidates = Array.from(document.querySelectorAll('header button, header div[role="button"], header a[role="button"], header a[href*="/direct/"], button, div[role="button"], a[role="button"], a[href*="/direct/"]'));

    const targetKeywords = [
      'enviar mensagem',
      'mensagem',
      'message',
      'send message',
      'enviar convite',
      'send invite'
    ];

    for (const btn of candidates) {
      if (btn.closest('#innflu-hud-root')) continue;

      const text = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase().trim();
      const isMatch = targetKeywords.some(kw => text === kw || text.startsWith(kw));
      if (isMatch) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Se for filho de um <a> com link de direct, prefere o <a>
          const parentAnchor = btn.closest('a[href*="/direct/"]');
          return parentAnchor || btn;
        }
      }
    }

    // Links diretos para chat
    const directLinks = Array.from(document.querySelectorAll('a[href*="/direct/t/"], a[href*="/direct/new"]'));
    for (const link of directLinks) {
      if (link.closest('#innflu-hud-root')) continue;
      const rect = link.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return link;
      }
    }

    return null;
  },

  /**
   * Clica e abre o chat do Direct
   */
  async openDirectChat(element) {
    if (!element) return;

    try {
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
    } catch (e) {}
    await this.sleep(this.randomDelay(150, 300));

    // Se possui href com direct, navega ou clica na âncora
    const anchor = element.closest('a') || (element.tagName === 'A' ? element : null) || element.querySelector('a');
    if (anchor && anchor.href && anchor.href.includes('/direct/')) {
      console.log('[Innflu] Abrindo Direct via link:', anchor.href);
      try { anchor.click(); } catch (e) {}
      await this.sleep(1500);
      if (window.location.pathname.startsWith('/direct/')) {
        return;
      }
      // Se não navegou via click, força navegação
      window.location.href = anchor.href;
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const evtOpts = { clientX: x, clientY: y, bubbles: true, cancelable: true, view: window };

    element.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
    element.dispatchEvent(new MouseEvent('mousedown', evtOpts));
    element.focus();
    await this.sleep(this.randomDelay(80, 160));
    element.dispatchEvent(new PointerEvent('pointerup', evtOpts));
    element.dispatchEvent(new MouseEvent('mouseup', evtOpts));
    element.dispatchEvent(new MouseEvent('click', evtOpts));

    if (typeof element.click === 'function') {
      try { element.click(); } catch (e) {}
    }
  },

  /**
   * Aguarda a caixa de texto legítima do Direct aparecer no DOM
   */
  async waitForMessageInput(timeoutMs = 12000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const candidates = Array.from(document.querySelectorAll(
        'div[contenteditable="true"][role="textbox"], ' +
        'div[contenteditable="true"][aria-label*="Mensagem" i], ' +
        'div[contenteditable="true"][aria-label*="Message" i], ' +
        'div[contenteditable="true"][aria-label*="convite" i], ' +
        'div[contenteditable="true"][aria-label*="invite" i], ' +
        'div[contenteditable="true"][data-lexical-editor="true"], ' +
        'textarea[placeholder*="Mensagem" i], ' +
        'textarea[placeholder*="Message" i]'
      ));

      for (const el of candidates) {
        if (el.closest('#innflu-hud-root')) continue;
        if (el.offsetParent !== null) {
          return el;
        }
      }

      await this.sleep(300);
    }
    return null;
  },

  /**
   * Digita a mensagem no editor do Instagram
   */
  async typeMessageIntoReact(inputEl, text) {
    await this.openDirectChat(inputEl);
    inputEl.focus();
    await this.sleep(this.randomDelay(250, 400));

    // Limpa texto prévio se houver
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEl);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}

    // Injeta via execCommand insertText
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, text);
    } catch (e) {
      inserted = false;
    }

    if (!inserted || !inputEl.innerText.trim()) {
      try {
        const inputEvt = new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        });
        inputEl.dispatchEvent(inputEvt);
        inputEl.innerText = text;
        inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      } catch (e) {
        inputEl.innerText = text;
      }
    }

    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(this.randomDelay(500, 800));

    if (!inputEl.innerText.trim()) {
      throw new Error('Falha ao inserir texto no campo de mensagem');
    }
  },

  /**
   * Clica no botão "Enviar" ou "Enviar convite" e despacha tecla Enter
   */
  async submitMessage(inputEl) {
    await this.sleep(this.randomDelay(250, 500));

    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    let sendBtn = allButtons.find(b => {
      if (b.closest('#innflu-hud-root')) return false;
      const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
      const isSendText = t === 'enviar' || t === 'send' || t === 'enviar mensagem' || t === 'enviar convite' || t === 'send invite';
      return isSendText && b.offsetParent !== null;
    });

    if (!sendBtn && inputEl) {
      const container = inputEl.closest('form') || inputEl.closest('div[role="region"]') || inputEl.parentElement?.parentElement;
      if (container) {
        const buttonsInside = Array.from(container.querySelectorAll('button, div[role="button"]')).filter(b => b !== inputEl && !b.contains(inputEl));
        if (buttonsInside.length > 0) {
          sendBtn = buttonsInside[buttonsInside.length - 1];
        }
      }
    }

    if (sendBtn) {
      console.log('[Innflu] Clicando no botão de envio:', sendBtn.innerText || sendBtn.getAttribute('aria-label') || 'Botão');
      await this.openDirectChat(sendBtn);
      await this.sleep(500);
    }

    // Despacha tecla Enter como garantia
    inputEl.focus();
    const enterProps = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, bubbles: true, cancelable: true };
    inputEl.dispatchEvent(new KeyboardEvent('keydown', enterProps));
    inputEl.dispatchEvent(new KeyboardEvent('keypress', enterProps));
    inputEl.dispatchEvent(new KeyboardEvent('keyup', enterProps));
    await this.sleep(800);
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
  async sendDirectMessage(messageText) {
    const preCheck = this.checkActionBlock();
    if (preCheck.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${preCheck.message}`);
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
      inputEl = await this.waitForMessageInput(12000);
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
    const result = await this.waitForSendConfirmation(inputEl, messageText, 8000);

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

    return { success: true };
  }
};
