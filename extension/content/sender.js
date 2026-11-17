/**
 * Módulo de Envio de DM com Simulação de Digitação Humana,
 * Detecção Anti-Ban, Suporte Robusto ao React 18 e Tratamento de Convites
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
    // 1. Diálogos modais de alerta / bloqueio
    const dialogs = document.querySelectorAll('div[role="dialog"], div[role="alertdialog"], .x1n2onr6');
    for (const el of dialogs) {
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
        return {
          blocked: true,
          message: el.innerText.trim()
        };
      }
    }

    // 2. Notificações toast / popups flutuantes na tela
    const toasts = document.querySelectorAll('div[role="status"], div[aria-live="polite"], div[aria-live="assertive"]');
    for (const toast of toasts) {
      const txt = (toast.innerText || '').toLowerCase();
      if (
        txt.includes('bloque') ||
        txt.includes('bloquead') ||
        txt.includes('action blocked') ||
        txt.includes('tente mais tarde') ||
        txt.includes('não foi possível') ||
        txt.includes('couldn\'t send')
      ) {
        return {
          blocked: true,
          message: toast.innerText.trim()
        };
      }
    }

    return { blocked: false };
  },

  /**
   * Localiza o botão "Enviar mensagem" no perfil com seletores universais e resilientes
   */
  findMessageButton() {
    // 1. Procura em todo o cabeçalho e corpo da página
    const candidates = Array.from(document.querySelectorAll('header button, header div[role="button"], header a[role="button"], header a[href*="/direct/"], button, div[role="button"], a[role="button"]'));

    const targetKeywords = [
      'enviar mensagem',
      'mensagem',
      'message',
      'send message',
      'enviar convite',
      'send invite'
    ];

    for (const btn of candidates) {
      const text = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase().trim();
      const isMatch = targetKeywords.some(kw => text === kw || text.startsWith(kw));
      if (isMatch) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return btn;
        }
      }
    }

    // 2. Links específicos de chat (/direct/t/...)
    const directLinks = Array.from(document.querySelectorAll('a[href*="/direct/t/"], a[href*="/direct/new"]'));
    for (const link of directLinks) {
      const rect = link.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return link;
      }
    }

    // 3. Botão adjacente ao botão de Seguir / Seguindo
    const followButtons = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(b => {
      const t = (b.innerText || '').toLowerCase().trim();
      return t === 'seguir' || t === 'seguindo' || t === 'follow' || t === 'following';
    });
    for (const fBtn of followButtons) {
      const parent = fBtn.parentElement?.parentElement;
      if (parent) {
        const siblingButtons = Array.from(parent.querySelectorAll('button, div[role="button"]')).filter(b => b !== fBtn);
        for (const sBtn of siblingButtons) {
          const txt = (sBtn.innerText || '').toLowerCase().trim();
          if (txt.includes('mensagem') || txt.includes('message') || txt.length < 15) {
            return sBtn;
          }
        }
      }
    }

    return null;
  },

  /**
   * Aguarda a caixa de texto do Direct aparecer no DOM com polling resiliente
   */
  async waitForMessageInput(timeoutMs = 9000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                 document.querySelector('div[contenteditable="true"][aria-label*="Mensagem" i]') ||
                 document.querySelector('div[contenteditable="true"][aria-label*="Message" i]') ||
                 document.querySelector('div[contenteditable="true"][aria-label*="convite" i]') ||
                 document.querySelector('div[contenteditable="true"][aria-label*="invite" i]') ||
                 document.querySelector('textarea[placeholder*="Mensagem" i]') ||
                 document.querySelector('textarea[placeholder*="Message" i]') ||
                 document.querySelector('div[contenteditable="true"]');
      if (el && el.offsetParent !== null) {
        return el;
      }
      await this.sleep(300);
    }
    return null;
  },

  /**
   * Simula clique humano e interativo
   */
  async clickElement(element) {
    if (!element) return;
    try {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {}
    await this.sleep(this.randomDelay(120, 250));

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    element.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
    element.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true }));
    element.focus();
    await this.sleep(this.randomDelay(60, 140));
    element.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }));
    element.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));

    // Clique nativo explícito (obrigatório para links e React)
    if (typeof element.click === 'function') {
      try { element.click(); } catch (e) {}
    }
  },

  /**
   * Digita a mensagem no editor do Instagram acionando o estado interno do React
   */
  async typeMessageIntoReact(inputEl, text) {
    await this.clickElement(inputEl);
    inputEl.focus();
    await this.sleep(this.randomDelay(250, 450));

    // Seleciona o conteúdo prévio se houver e limpa
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEl);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}

    // Injeta via execCommand insertText (aciona nativamente o Slate/Draft.js do React 18)
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, text);
    } catch (e) {
      inserted = false;
    }

    if (!inserted || !inputEl.innerText.trim()) {
      // Fallback 1: InputEvent com data completa
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

    // Notifica os manipuladores de evento do React
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(this.randomDelay(400, 700));
  },

  /**
   * Localiza e clica no botão "Enviar" / "Enviar convite"
   */
  async submitMessage(inputEl) {
    await this.sleep(this.randomDelay(300, 600));

    // 1. Procura por botão com texto "Enviar", "Send", "Enviar convite" ou "Send invite"
    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    let sendBtn = allButtons.find(b => {
      const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
      const isSendText = t === 'enviar' || t === 'send' || t === 'enviar mensagem' || t === 'enviar convite' || t === 'send invite';
      return isSendText && b.offsetParent !== null;
    });

    // 2. Se não achou por texto, procura no container da caixa de mensagem
    if (!sendBtn && inputEl) {
      const container = inputEl.closest('form') || inputEl.closest('div[role="region"]') || inputEl.parentElement?.parentElement;
      if (container) {
        const buttonsInside = Array.from(container.querySelectorAll('button, div[role="button"]')).filter(b => b !== inputEl && !b.contains(inputEl));
        // O botão de envio geralmente é o último botão do container
        if (buttonsInside.length > 0) {
          sendBtn = buttonsInside[buttonsInside.length - 1];
        }
      }
    }

    // 3. Clica no botão Enviar se encontrado
    if (sendBtn) {
      console.log('[Innflu] Clicando no botão de envio:', sendBtn.innerText || sendBtn.getAttribute('aria-label') || 'Botão SVG');
      await this.clickElement(sendBtn);
      await this.sleep(1200);
      return true;
    }

    // 4. Fallback: despacha tecla Enter completa
    console.log('[Innflu] Botão não encontrado visualmente, despachando tecla Enter...');
    inputEl.focus();
    const enterProps = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, bubbles: true, cancelable: true };
    inputEl.dispatchEvent(new KeyboardEvent('keydown', enterProps));
    inputEl.dispatchEvent(new KeyboardEvent('keypress', enterProps));
    inputEl.dispatchEvent(new KeyboardEvent('keyup', enterProps));
    await this.sleep(1200);
    return true;
  },

  /**
   * Executa o fluxo completo de envio de DM para o perfil atual com salvaguardas anti-ban
   */
  async sendDirectMessage(messageText) {
    const preCheck = this.checkActionBlock();
    if (preCheck.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${preCheck.message}`);
    }

    const curPath = window.location.pathname.toLowerCase();
    let inputEl = null;

    // Se já estamos dentro de uma tela de direct (/direct/t/...), pula o clique e busca o input
    if (curPath.startsWith('/direct/')) {
      inputEl = await this.waitForMessageInput(5000);
    }

    // Se não achou ou estamos no perfil, clica no botão "Enviar mensagem"
    if (!inputEl) {
      let messageBtn = this.findMessageButton();
      if (!messageBtn) {
        // Rola levemente a página para acionar lazy-loading do cabeçalho
        window.scrollBy({ top: 100, behavior: 'smooth' });
        await this.sleep(1200);
        window.scrollBy({ top: -100, behavior: 'smooth' });
        await this.sleep(600);
        messageBtn = this.findMessageButton();
      }

      if (!messageBtn) {
        throw new Error('Botão "Enviar mensagem" não encontrado no perfil');
      }

      console.log('[Innflu] Abrindo conversa de direct...');
      await this.clickElement(messageBtn);

      // Aguarda o chat abrir e a caixa de digitação ser montada
      inputEl = await this.waitForMessageInput(9000);
    }

    if (!inputEl) {
      throw new Error('Caixa de texto do Direct não encontrada (o chat não abriu a tempo)');
    }

    // Digitação e envio da mensagem
    console.log('[Innflu] Inserindo mensagem formatada no editor do Instagram...');
    await this.typeMessageIntoReact(inputEl, messageText);
    await this.submitMessage(inputEl);

    // Aguarda confirmação visual
    await this.sleep(this.randomDelay(2000, 3200));

    // Checagem pós-envio de bloqueios
    const postCheck = this.checkActionBlock();
    if (postCheck.blocked) {
      throw new Error(`Ação temporariamente bloqueada pelo Instagram: ${postCheck.message}`);
    }

    // Se a página navegou para a URL do Direct (/direct/t/...), volta automaticamente para o perfil
    if (window.location.pathname.toLowerCase().startsWith('/direct/')) {
      console.log('[Innflu] DM disparada com sucesso. Retornando ao perfil...');
      window.history.back();
      await this.sleep(1500);
    }

    return { success: true };
  }
};
