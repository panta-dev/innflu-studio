/**
 * Classificador de gênero e tipo de perfil (Pessoa vs Marca) — v3 Pro
 * Base expandida com mais de 150 nomes femininos comuns, lista de nomes masculinos para exclusão direta,
 * detecção de marcas/lojas e termos contextuais da bio.
 */
window.InnfluGenderDetector = {
  // Lista abrangente de nomes femininos brasileiros e apelidos comuns no Instagram
  femaleFirstNames: new Set([
    'maria', 'ana', 'francisca', 'antonia', 'antônia', 'adriana', 'juliana', 'marcia', 'márcia', 'fernanda', 
    'patricia', 'patrícia', 'aline', 'camila', 'bruna', 'jessica', 'jessica', 'jessyca', 'leticia', 'letícia',
    'amanda', 'sabrina', 'beatriz', 'larissa', 'vanessa', 'mariana', 'gabriela', 'rafaela', 'carolina', 
    'carla', 'bianca', 'daniela', 'debora', 'débora', 'paula', 'renata', 'luana', 'claudia', 'cláudia',
    'thais', 'thaís', 'tais', 'taís', 'talita', 'lorena', 'milena', 'isabela', 'isabella', 'helena', 'alice', 
    'laura', 'manuela', 'valentina', 'sophia', 'sofia', 'livia', 'lívia', 'giovanna', 'geovana', 'heloisa', 'heloísa',
    'yasmin', 'nathalia', 'natalia', 'natália', 'tatiane', 'tatiana', 'elaine', 'priscila', 
    'raquel', 'andreia', 'andréia', 'monica', 'mônica', 'flavia', 'flávia', 'monique', 'marina', 'clarice',
    'paloma', 'samara', 'tamires', 'carol', 'ju', 'gabi', 'dani', 'lu', 'manu', 'lala', 'mari', 'duda',
    'andressa', 'brenda', 'barbara', 'bárbara', 'cecilia', 'cecília', 'cintia', 'cíntia', 'elisa', 'emily',
    'evelyn', 'fatima', 'fátima', 'ingrid', 'joana', 'kelly', 'lara', 'luiza', 'luisa', 'ludmilla',
    'maira', 'maíra', 'marcela', 'maya', 'mirella', 'nicole', 'olivia', 'olívia', 'poliana', 'rebeca',
    'stella', 'estela', 'suzana', 'victoria', 'victória', 'vitoria', 'vitória', 'vivian', 'viviane',
    'virginia', 'virgínia', 'tata', 'tatá', 'viih', 'isa', 'nati', 'nath', 'bea', 'bia',
    'jade', 'iza', 'cleo', 'pocah', 'gkay', 'maiara', 'maraisa', 'simone', 'simaria',
    'lore', 'roberta', 'giselle', 'gisele', 'luciana', 'giulia', 'alessandra', 'grazi',
    'gleici', 'flay', 'juliette', 'sarah', 'anitta', 'melissa', 'agatha', 'ágatha', 'clarissa',
    'tais', 'mafe', 'juju', 'cacau', 'bella', 'clara', 'isadora', 'joelma', 'ivete'
  ]),

  // Nomes masculinos comuns no Brasil para descarte imediato
  maleFirstNames: new Set([
    'joao', 'joão', 'pedro', 'lucas', 'gabriel', 'mateus', 'matheus', 'rafael', 'guilherme', 
    'felipe', 'gustavo', 'rodrigo', 'tiago', 'thiago', 'marcos', 'andre', 'andré', 'bruno', 
    'leonardo', 'felipe', 'diego', 'eduardo', 'caio', 'vinicius', 'vinícius', 'alexandre', 
    'henrique', 'fernando', 'marcelo', 'ricardo', 'danilo', 'daniel', 'vitor', 'victor', 
    'igor', 'arthur', 'artur', 'bernardo', 'heitor', 'davi', 'david', 'samuel', 'renan', 
    'leandro', 'carlos', 'antonio', 'antônio', 'francisco', 'paulo', 'sergio', 'sérgio'
  ]),

  // Termos na bio característicos de criadoras femininas / mães / influenciadoras
  femaleBioKeywords: [
    'mãe', 'mae', 'mamãe', 'mamae', 'materno', 'maternidade', 'ela/dela', 'she/her',
    'gestante', 'gravidinha', 'nutricionista', 'advogada', 'psicóloga', 'psicologa', 'criadora', 
    'fotógrafa', 'fotografa', 'influencer', 'esposa', 'filha', 'lifestyle', 'dona de casa', 
    'tentante', 'parto', 'puerpério', 'puerperio', 'maternando', 'mãe de', 'maratonista',
    'atleta', 'figura pública', 'criadora de conteúdo', 'arquiteta', 'médica', 'medica',
    'empresária', 'empresaria', 'atriz', 'modelo', 'blogueira', 'maquiadora', 'esteticista',
    'consultora de imagem', 'educadora', 'professora'
  ],

  // Termos indicativos de marcas, lojas ou páginas puramente comerciais
  brandBioKeywords: [
    'loja oficial', 'compre no site', 'encomendas via direct', 'frete grátis para todo', 
    'frete gratis', 'e-commerce', 'ecommerce', 'clínica veterinária', 'sac:', 'cnpj:', 
    'catálogo disponível', 'atacado e varejo', 'varejo', 'atacado', 'envio para todo brasil', 
    'entregamos em todo', 'compre aqui:', 'marca oficial', 'loja virtual', 'produtos importados',
    'revenda autorizada', 'semijoias', 'boutique'
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
      return { isFemale: false, isBrand: true, reason: 'Identificado padrão de loja ou marca comercial' };
    }

    // 2. Checar se o primeiro nome é explicitamente MASCULINO
    const nameWords = nameClean.split(/\s+/).map(w => w.replace(/[^a-zà-ú]/gi, ''));
    if (nameWords.length > 0 && this.maleFirstNames.has(nameWords[0])) {
      return { isFemale: false, isBrand: false, reason: `Nome masculino identificado (${nameWords[0]})` };
    }

    // 3. Checar palavras do nome de exibição para nome feminino
    for (const word of nameWords) {
      if (this.femaleFirstNames.has(word)) {
        return { isFemale: true, isBrand: false, reason: `Nome feminino identificado (${word})` };
      }
    }

    // 4. Checar prefixo do @username (ex: "marinaferrarig" -> "marina")
    for (const femaleName of this.femaleFirstNames) {
      if (femaleName.length >= 3 && userClean.startsWith(femaleName)) {
        return { isFemale: true, isBrand: false, reason: `Username começa com nome feminino (${femaleName})` };
      }
    }

    // 5. Checar termos femininos e de maternidade na bio
    const femaleMatch = this.femaleBioKeywords.find(kw => {
      // Garante correspondência de palavra inteira ou termo específico
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(bioClean);
    });
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
