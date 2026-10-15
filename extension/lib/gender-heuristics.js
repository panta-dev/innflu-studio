/**
 * Classificador de gênero e tipo de perfil (Pessoa vs Marca)
 * Base expandida de nomes femininos brasileiros, prefixos de username e termos de bio
 */
window.InnfluGenderDetector = {
  // Lista abrangente de nomes femininos comuns no Brasil
  femaleFirstNames: new Set([
    'maria', 'ana', 'francisca', 'antonia', 'adriana', 'juliana', 'marcia', 'fernanda', 
    'patricia', 'aline', 'camila', 'bruna', 'jessica', 'leticia', 'amanda', 'sabrina', 
    'beatriz', 'larissa', 'vanessa', 'mariana', 'gabriela', 'rafaela', 'carolina', 
    'carla', 'bianca', 'daniela', 'debora', 'paula', 'renata', 'luana', 'claudia', 
    'thais', 'talita', 'lorena', 'milena', 'isabela', 'isabella', 'helena', 'alice', 
    'laura', 'manuela', 'valentina', 'sophia', 'livia', 'giovanna', 'heloisa', 
    'yasmin', 'nathalia', 'natalia', 'tatiane', 'tatiana', 'elaine', 'priscila', 
    'raquel', 'andreia', 'monica', 'flavia', 'monique', 'marina', 'clarice',
    'paloma', 'tais', 'samara', 'tamires', 'carol', 'ju', 'gabi', 'dani', 'lu', 'manu',
    'andressa', 'brenda', 'barbara', 'cecilia', 'cintia', 'elisa', 'emily',
    'evelyn', 'fatima', 'geovana', 'ingrid', 'joana', 'kelly', 'lara', 'luiza', 'luisa',
    'maira', 'marcela', 'maya', 'mirella', 'nicole', 'olivia', 'poliana', 'rebeca',
    'stella', 'suzana', 'victoria', 'vitoria', 'vivian', 'viviane',
    'virginia', 'tata', 'viih', 'mari', 'duda', 'isa', 'nati', 'nath', 'bea', 'bia',
    'jade', 'iza', 'cleo', 'pocah', 'gkay', 'maiara', 'maraisa', 'simone', 'simaria',
    'lore', 'roberta', 'giselle', 'gisele', 'luciana', 'giulia', 'alessandra', 'grazi',
    'tais', 'taís', 'gleici', 'flay', 'juliette', 'sarah', 'pocahontas', 'anitta', 'ludmilla'
  ]),

  // Termos na bio característicos de criadoras femininas / mamães
  femaleBioKeywords: [
    'mãe', 'mae', 'mamãe', 'mamae', 'materno', 'maternidade', 'ela/dela', 'she/her',
    'gestante', 'gravidinha', 'nutricionista', 'advogada', 'psicóloga', 'criadora', 
    'fotógrafa', 'influencer', 'esposa', 'filha', 'lifestyle', 'dona de casa', 
    'tentante', 'parto', 'puerpério', 'maternando', 'mãe de', 'maratonista',
    'atleta', 'figura pública', 'criadora de conteúdo', 'arquiteta', 'médica',
    'empresária', 'atriz', 'modelo', 'blogueira', 'apaixonada por'
  ],

  // Termos indicativos de marcas comerciais puras
  brandBioKeywords: [
    'loja oficial', 'compre no site', 'encomendas via direct', 'frete grátis para todo', 
    'e-commerce', 'clínica veterinária', 'sac:', 'cnpj:', 'catálogo disponível'
  ],

  /**
   * Avalia se um perfil é feminino / criadora de conteúdo
   * @param {string} fullName 
   * @param {string} bio 
   * @param {string} username
   * @returns {{ isFemale: boolean, isBrand: boolean, reason: string }}
   */
  classify(fullName, bio, username = '') {
    const nameClean = (fullName || '').trim().toLowerCase();
    const bioClean = (bio || '').toLowerCase();
    const userClean = (username || '').toLowerCase().replace(/[^a-z]/g, '');

    // 1. Checar marcas comerciais estritas
    const isBrand = this.brandBioKeywords.some(kw => bioClean.includes(kw));
    if (isBrand) {
      return { isFemale: false, isBrand: true, reason: 'Identificado padrão de loja ou marca' };
    }

    // 2. Checar palavras do nome de exibição
    const nameWords = nameClean.split(/\s+/).map(w => w.replace(/[^a-zà-ú]/gi, ''));
    for (const word of nameWords) {
      if (this.femaleFirstNames.has(word)) {
        return { isFemale: true, isBrand: false, reason: `Nome feminino identificado (${word})` };
      }
    }

    // 3. Checar prefixo do @username (ex: "marinaferrarig" começa com "marina")
    for (const femaleName of this.femaleFirstNames) {
      if (femaleName.length >= 3 && userClean.startsWith(femaleName)) {
        return { isFemale: true, isBrand: false, reason: `Username começa com nome feminino (${femaleName})` };
      }
    }

    // 4. Checar termos femininos na bio
    const femaleMatch = this.femaleBioKeywords.find(kw => bioClean.includes(kw));
    if (femaleMatch) {
      return { isFemale: true, isBrand: false, reason: `Termo feminino na bio (${femaleMatch})` };
    }

    return {
      isFemale: false,
      isBrand: false,
      reason: 'Gênero não detectado com certeza'
    };
  }
};
