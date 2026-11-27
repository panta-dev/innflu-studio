/**
 * Banco de mensagens de captação: várias versões, ativas/inativas, sorteio sem repetição seguida.
 * Funções puras (sem DOM) para facilitar testes. Cada mensagem é sempre enviada inteira.
 */
window.InnfluMessageBank = {
  newId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  normalize(bank) {
    if (!Array.isArray(bank)) return [];
    const seen = new Set();
    const out = [];
    for (const m of bank) {
      if (!m || typeof m.text !== 'string') continue;
      const id = m.id && !seen.has(m.id) ? String(m.id) : this.newId();
      seen.add(id);
      out.push({ id, text: m.text, active: m.active !== false });
    }
    return out;
  },

  activeList(bank) {
    return this.normalize(bank).filter(m => m.active && m.text.trim().length > 0);
  },

  add(bank, text = '', active = true) {
    const list = this.normalize(bank);
    list.push({ id: this.newId(), text: String(text), active: !!active });
    return list;
  },

  update(bank, id, patch) {
    return this.normalize(bank).map(m => (m.id === id ? { ...m, ...patch } : m));
  },

  remove(bank, id) {
    return this.normalize(bank).filter(m => m.id !== id);
  },

  /**
   * Sorteia a próxima mensagem entre as ATIVAS usando um "saco" embaralhado:
   * todas são usadas antes de qualquer repetição, e a mesma não repete em sequência.
   * @returns {{status:'empty'|'none_active'|'ok', message?:object, bag:string[]}}
   */
  pickNext(bank, bag, rand = Math.random, lastId = null) {
    const all = this.normalize(bank);
    if (all.length === 0) return { status: 'empty', bag: [] };
    const active = all.filter(m => m.active && m.text.trim().length > 0);
    if (active.length === 0) return { status: 'none_active', bag: [] };
    const activeIds = new Set(active.map(m => m.id));
    let pool = (Array.isArray(bag) ? bag : []).filter(id => activeIds.has(id));
    if (pool.length === 0) {
      pool = active.map(m => m.id);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      if (pool.length > 1 && lastId && pool[0] === lastId) {
        [pool[0], pool[1]] = [pool[1], pool[0]];
      }
    }
    const id = pool[0];
    const message = active.find(m => m.id === id);
    return { status: 'ok', message, bag: pool.slice(1) };
  }
};
