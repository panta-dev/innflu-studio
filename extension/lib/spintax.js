/**
 * Utilitário de processamento Spintax e interpolação de variáveis
 * Exemplo: "{Olá|Oi} {nome}! {Tudo bem?|Como você está?}"
 */
window.InnfluSpintax = {
  /**
   * Resolve todas as tags spintax recursivamente
   * @param {string} text 
   * @returns {string}
   */
  resolve(text) {
    if (!text) return '';
    const spintaxRegex = /\{([^{}]+)\}/g;
    let result = text;
    let safetyCounter = 0;

    while (spintaxRegex.test(result) && safetyCounter < 10) {
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
   * Substitui placeholders dinâmicos
   * @param {string} text 
   * @param {object} params { nome, username, nicho }
   * @returns {string}
   */
  interpolate(text, params = {}) {
    let output = this.resolve(text);
    const nome = params.nome || params.username || 'amiga';
    const username = params.username ? `@${params.username.replace('@', '')}` : '';
    const nicho = params.nicho || 'seu nicho';

    output = output.replace(/\{nome\}/gi, nome);
    output = output.replace(/\{user\}/gi, username);
    output = output.replace(/\{username\}/gi, username);
    output = output.replace(/\{nicho\}/gi, nicho);

    return output;
  }
};
