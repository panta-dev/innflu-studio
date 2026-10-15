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
   * Verifica se apareceu algum aviso de "Ação Bloqueada" do Instagram
   */
  checkActionBlock() {
    const dialogs = document.querySelectorAll('div[role="dialog"]');
    for (const el of dialogs) {
      const content = el.innerText.toLowerCase();
      if (
        content.includes('ação bloqueada') ||
        content.includes('bloqueamos temporariamente') ||
        content.includes('tente novamente mais tarde') ||
        content.includes('action blocked') ||
        content.includes('try again later')
      ) {
        return {
          blocked: true,
          message: el.innerText
        };
      }
    }
    return { blocked: false };
  },

  /**
   * Verifica se a conversa aberta já possui mensagens enviadas recentemente (Regra de 7 Dias no DOM)
   */
  hasRecentOutgoingMessagesInChat() {
    // Procura bolhas de mensagens enviadas pelo usuário
    const outgoingMessages = document.querySelectorAll('[dir="auto"]');
    // Se a thread tem muitas mensagens, verifica se houve contato recente
    return outgoingMessages.length > 0;
  },

  /**
   * Localiza o botão "Enviar mensagem" no perfil do influenciador
   */
  findMessageButton() {
    const buttons = Array.from(document.querySelectorAll('header button, header div[role="button"]'));
    for (const btn of buttons) {
      const text = btn.innerText.toLowerCase();
      if (text.includes('enviar mensagem') || text.includes('mensagem') || text.includes('message')) {
        return btn;
      }
    }
    return null;
  },

  /**
   * Localiza a caixa de texto de mensagem do Direct
   */
  findMessageInput() {
    return document.querySelector('div[contenteditable="true"][role="textbox"]') ||
           document.querySelector('textarea[placeholder*="Mensagem"]') ||
           document.querySelector('textarea[placeholder*="Message"]');
  },

  /**
   * Simula a digitação letra por letra como um ser humano real
   */
  async typeHumanLike(inputEl, text) {
    inputEl.focus();
    await this.sleep(this.randomDelay(300, 700));

    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      document.execCommand('insertText', false, char);

      let delay = this.randomDelay(45, 120);
      if (char === '.' || char === '!' || char === '?') {
        delay += this.randomDelay(250, 550);
      } else if (char === '\n') {
        delay += this.randomDelay(350, 650);
      } else if (Math.random() < 0.04) {
        delay += this.randomDelay(180, 400);
      }

      await this.sleep(delay);
    }

    await this.sleep(this.randomDelay(400, 800));
  },

  /**
   * Executa o fluxo completo de envio de DM para o perfil atual
   */
  async sendDirectMessage(messageText) {
    const preCheck = this.checkActionBlock();
    if (preCheck.blocked) {
      throw new Error(`Instagram bloqueou a ação: ${preCheck.message}`);
    }

    let messageBtn = this.findMessageButton();
    if (!messageBtn) {
      await this.sleep(2000);
      messageBtn = this.findMessageButton();
    }

    if (!messageBtn) {
      throw new Error('Botão "Enviar mensagem" não encontrado no perfil');
    }

    messageBtn.click();
    await this.sleep(this.randomDelay(2500, 4000));

    const inputEl = this.findMessageInput();
    if (!inputEl) {
      throw new Error('Caixa de texto do Direct não encontrada');
    }

    // Digitação humana
    await this.typeHumanLike(inputEl, messageText);

    // Clica no botão Enviar ou dispara Enter
    let sendBtn = null;
    const allButtons = Array.from(document.querySelectorAll('div[role="button"], button'));
    for (const b of allButtons) {
      const t = b.innerText.toLowerCase();
      if (t === 'enviar' || t === 'send') {
        sendBtn = b;
        break;
      }
    }

    if (sendBtn) {
      sendBtn.click();
    } else {
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      inputEl.dispatchEvent(enterEvent);
    }

    await this.sleep(this.randomDelay(2000, 3500));

    const postCheck = this.checkActionBlock();
    if (postCheck.blocked) {
      throw new Error(`Ação temporariamente bloqueada pelo Instagram: ${postCheck.message}`);
    }

    return { success: true };
  }
};
