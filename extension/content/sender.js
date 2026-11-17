/**
 * Módulo de Envio de DM com Simulação de Digitação Humana,
 * Detecção Anti-Ban e Validação da Regra de 7 Dias
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
   * Verifica se a conversa aberta já possui mensagens enviadas recentemente (Regra de 7 Dias no DOM)
   */
  hasRecentOutgoingMessagesInChat() {
    // Procura bolhas de mensagens e timestamps de envio no chat
    const messageRows = document.querySelectorAll('div[role="row"], div[role="listitem"], div[class*="message"]');
    for (const row of messageRows) {
      // Verifica se a mensagem partiu do remetente (lado direito / bolha de saída)
      const isOutgoing = row.querySelector('[data-testid*="outgoing"], [class*="outgoing"], [class*="x1n2onr6"]') ||
                         row.style.alignSelf === 'flex-end' ||
                         row.classList.contains('_outgoing');
      if (isOutgoing) return true;
    }

    // Fallback: busca por bolhas com alinhamento à direita no container de conversa
    const bubbles = Array.from(document.querySelectorAll('div[dir="auto"]'));
    return bubbles.length > 2;
  },

  /**
   * Localiza o botão "Enviar mensagem" no perfil do influenciador com seletores multi-camadas
   */
  findMessageButton() {
    // 1. Botões no cabeçalho (header ou section do topo do perfil)
    const scope = document.querySelector('header') || document.querySelector('main section') || document.body;
    const candidates = Array.from(scope.querySelectorAll('button, div[role="button"], a[role="button"], a[href*="/direct/t/"]'));

    const dynamicLabels = window.__innfluDynamicRules?.selectors?.messageButtons || [
      'enviar mensagem',
      'mensagem',
      'message',
      'send message'
    ];

    for (const btn of candidates) {
      const text = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase().trim();
      const isMatch = dynamicLabels.some(l => text === l || text.startsWith(l));
      if (isMatch) {
        // Garante que o botão está visível na tela
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return btn;
        }
      }
    }

    // 2. Link direto para o chat (/direct/t/...)
    const directLink = document.querySelector('a[href*="/direct/t/"]');
    if (directLink) return directLink;

    return null;
  },

  /**
   * Localiza a caixa de texto de mensagem do Direct (adaptável ao layout atual do Instagram)
   */
  findMessageInput() {
    return document.querySelector('div[contenteditable="true"][role="textbox"]') ||
           document.querySelector('div[contenteditable="true"][aria-label*="Mensagem" i]') ||
           document.querySelector('div[contenteditable="true"][aria-label*="Message" i]') ||
           document.querySelector('textarea[placeholder*="Mensagem" i]') ||
           document.querySelector('textarea[placeholder*="Message" i]') ||
           document.querySelector('div[contenteditable="true"]');
  },

  /**
   * Simula a movimentação do mouse e foco natural antes de interagir
   */
  async naturalInteract(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() * 8 - 4);
    const y = rect.top + rect.height / 2 + (Math.random() * 8 - 4);

    element.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
    await this.sleep(this.randomDelay(80, 220));
    element.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true }));
    await this.sleep(this.randomDelay(50, 150));
    element.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }));
    element.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
  },

  /**
   * Simula a digitação letra por letra como um ser humano real com micro-pausas,
   * hesitações e suporte seguro a input events modernos (sem depender puramente de execCommand legado)
   */
  async typeHumanLike(inputEl, text) {
    await this.naturalInteract(inputEl);
    inputEl.focus();
    await this.sleep(this.randomDelay(350, 750));

    // Limpa conteúdo prévio se houver
    inputEl.innerText = '';
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    await this.sleep(this.randomDelay(150, 300));

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Dispara InputEvent moderno com fallback para execCommand
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, char);
      } catch (e) {
        inserted = false;
      }

      if (!inserted) {
        inputEl.innerText += char;
        inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, data: char, inputType: 'insertText' }));
      }

      // Ritmo de digitação com cadência humana
      let delay = this.randomDelay(50, 125);
      if (char === '.' || char === '!' || char === '?') {
        delay += this.randomDelay(300, 600); // Pausa ao final de frases
      } else if (char === ',' || char === ';') {
        delay += this.randomDelay(150, 300); // Respiração na pontuação
      } else if (char === '\n') {
        delay += this.randomDelay(400, 750); // Nova linha
      } else if (Math.random() < 0.05) {
        // Hesitação/pausa pensativa (5% de chance)
        delay += this.randomDelay(250, 500);
      }

      await this.sleep(delay);
    }

    await this.sleep(this.randomDelay(500, 1000));
  },

  /**
   * Executa o fluxo completo de envio de DM para o perfil atual com salvaguardas anti-ban
   */
  async sendDirectMessage(messageText) {
    const preCheck = this.checkActionBlock();
    if (preCheck.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${preCheck.message}`);
    }

    let messageBtn = this.findMessageButton();
    if (!messageBtn) {
      // Aguarda 1.5s e rola ligeiramente para renderizar botões se o cabeçalho estiver sticky
      window.scrollBy({ top: 120, behavior: 'smooth' });
      await this.sleep(1500);
      window.scrollBy({ top: -120, behavior: 'smooth' });
      await this.sleep(800);
      messageBtn = this.findMessageButton();
    }

    if (!messageBtn) {
      throw new Error('Botão "Enviar mensagem" não encontrado no perfil');
    }

    await this.naturalInteract(messageBtn);
    await this.sleep(this.randomDelay(2800, 4200));

    const inputEl = this.findMessageInput();
    if (!inputEl) {
      throw new Error('Caixa de texto do Direct não encontrada');
    }

    // Digitação humana natural
    await this.typeHumanLike(inputEl, messageText);

    // Clica no botão Enviar ou despacha tecla Enter com simulação completa de eventos
    let sendBtn = null;
    const allButtons = Array.from(document.querySelectorAll('div[role="button"], button'));
    for (const b of allButtons) {
      const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
      if (t === 'enviar' || t === 'send') {
        sendBtn = b;
        break;
      }
    }

    if (sendBtn) {
      await this.naturalInteract(sendBtn);
    } else {
      const enterDown = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      const enterUp = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      inputEl.dispatchEvent(enterDown);
      inputEl.dispatchEvent(enterUp);
    }

    await this.sleep(this.randomDelay(2500, 4000));

    const postCheck = this.checkActionBlock();
    if (postCheck.blocked) {
      throw new Error(`Ação temporariamente bloqueada pelo Instagram: ${postCheck.message}`);
    }

    return { success: true };
  }
};
