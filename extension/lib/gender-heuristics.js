/**
 * Classificador de gênero e tipo de perfil (Pessoa vs Marca) — v4 Ultra Resiliente
 * Base maciça de nomes femininos brasileiros, apelidos, identificação por sufixos linguísticos,
 * e proteção rigorosa contra falsos-positivos em perfis de provador/moda.
 */
window.InnfluGenderDetector = {
  // Lista abrangente de nomes femininos brasileiros e apelidos comuns no Instagram
  femaleFirstNames: new Set([
    'maria', 'ana', 'francisca', 'antonia', 'antônia', 'adriana', 'juliana', 'marcia', 'márcia', 'fernanda', 
    'patricia', 'patrícia', 'aline', 'camila', 'bruna', 'jessica', 'jessyca', 'leticia', 'letícia',
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
    'virginia', 'virgínia', 'tata', 'tatá', 'viih', 'vih', 'isa', 'nati', 'nath', 'bea', 'bia',
    'jade', 'iza', 'cleo', 'pocah', 'gkay', 'maiara', 'maraisa', 'simone', 'simaria',
    'lore', 'roberta', 'giselle', 'gisele', 'luciana', 'giulia', 'alessandra', 'grazi',
    'gleici', 'flay', 'juliette', 'sarah', 'anitta', 'melissa', 'agatha', 'ágatha', 'clarissa',
    'mafe', 'juju', 'cacau', 'bella', 'clara', 'isadora', 'joelma', 'ivete', 'nayara', 'naiara',
    'rayane', 'ray', 'rayssa', 'raissa', 'suellen', 'suelen', 'thaeme', 'kemilly', 'evelin',
    'dudinha', 'gabizinha', 'lari', 'larissinha', 'bruninha', 'carolzinha', 'rafinha', 'manuzinha',
    'luaninha', 'danizinha', 'marizinha', 'bellinha', 'clarinha', 'sofi', 'mimi', 'mah', 'gi',
    'ariane', 'ariany', 'catherine', 'caroline', 'cristiane', 'cristina', 'emanuelle', 'ester',
    'graziele', 'helen', 'iara', 'izabel', 'izabella', 'jacqueline', 'janaína', 'janaina',
    'jaqueline', 'jordana', 'josi', 'josiane', 'karen', 'karina', 'karine', 'katia', 'kátia',
    'keila', 'lais', 'laís', 'layla', 'lilian', 'lumena', 'madalena', 'magda', 'marilia',
    'marília', 'marta', 'mayara', 'michele', 'michelle', 'nadia', 'nádia', 'pamela', 'pâmela',
    'rosana', 'samira', 'sandra', 'shirley', 'silvia', 'sílvia', 'stefani', 'thalita', 'thayna',
    'thaynara', 'valeria', 'valéria', 'vera', 'veronica', 'verônica', 'vilma'
  ]),

  // Nomes masculinos comuns no Brasil para descarte imediato
  maleFirstNames: new Set([
    'joao', 'joão', 'pedro', 'lucas', 'gabriel', 'mateus', 'matheus', 'rafael', 'guilherme', 
    'felipe', 'gustavo', 'rodrigo', 'tiago', 'thiago', 'marcos', 'andre', 'andré', 'bruno', 
    'leonardo', 'diego', 'eduardo', 'caio', 'vinicius', 'vinícius', 'alexandre', 
    'henrique', 'fernando', 'marcelo', 'ricardo', 'danilo', 'daniel', 'vitor', 'victor', 
    'igor', 'arthur', 'artur', 'bernardo', 'heitor', 'davi', 'david', 'samuel', 'renan', 
    'leandro', 'carlos', 'antonio', 'antônio', 'francisco', 'paulo', 'sergio', 'sérgio',
    'fabio', 'fábio', 'marcio', 'márcio', 'roberto', 'ronaldo', 'claudio', 'cláudio',
    'julio', 'júlio', 'cesar', 'césar', 'otavio', 'otávio', 'murilo', 'breno', 'cauã', 'caua'
  ]),

  // Termos na bio característicos de criadoras femininas / mães / influenciadoras / provador
  femaleBioKeywords: [
    'mãe', 'mae', 'mamãe', 'mamae', 'materno', 'maternidade', 'ela/dela', 'she/her',
    'gestante', 'gravidinha', 'nutricionista', 'advogada', 'psicóloga', 'psicologa', 'criadora', 
    'fotógrafa', 'fotografa', 'influencer', 'esposa', 'filha', 'lifestyle', 'dona de casa', 
    'tentante', 'parto', 'puerpério', 'puerperio', 'maternando', 'mãe de', 'maratonista',
    'atleta', 'figura pública', 'criadora de conteúdo', 'arquiteta', 'médica', 'medica',
    'empresária', 'empresaria', 'atriz', 'modelo', 'blogueira', 'maquiadora', 'esteticista',
    'consultora de imagem', 'educadora', 'professora', 'provador', 'provador fashion',
    'dicas de moda', 'look do dia', 'dicas de look', 'moda feminina', 'parcerias de moda',
    'parcerias via direct', 'assessoria de estilo', 'consultoria de moda'
  ],

  // Termos indicativos EXCLUSIVAMENTE de marcas ou lojas comerciais reais (sem falsos-positivos em provador)
  brandBioKeywords: [
    'loja oficial', 'compre no nosso site', 'compre no site:', 'sac:', 'cnpj:',
    'catálogo disponível', 'produtos importados', 'revenda autorizada',
    'enviamos para todo brasil', 'entregamos para todo brasil', 'frete grátis para todo brasil'
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
    const userClean = (username || '').toLowerCase().replace(/[^a-z0-9_.]/g, '');

    // 1. Checar marcas comerciais estritas (inclui regras dinâmicas OTA em tempo real)
    const extraBrandKeywords = window.__innfluDynamicRules?.blacklistBioKeywords || [];
    const allBrandKeywords = [...this.brandBioKeywords, ...extraBrandKeywords];
    const isBrand = allBrandKeywords.some(kw => kw && bioClean.includes(kw.toLowerCase()));
    if (isBrand) {
      return { isFemale: false, isBrand: true, reason: 'Identificado padrão de loja ou marca comercial' };
    }

    // 2. Checar se o primeiro nome é explicitamente MASCULINO
    const nameWords = nameClean.split(/\s+/).map(w => w.replace(/[^a-zà-ú]/gi, '')).filter(Boolean);
    const firstName = nameWords[0] || '';
    if (firstName && this.maleFirstNames.has(firstName)) {
      return { isFemale: false, isBrand: false, reason: `Nome masculino identificado (${firstName})` };
    }

    // 3. Checar palavras do nome de exibição para nome feminino
    for (const word of nameWords) {
      if (this.femaleFirstNames.has(word)) {
        return { isFemale: true, isBrand: false, reason: `Nome feminino identificado (${word})` };
      }
    }

    // 4. Checar prefixo ou conteúdo do @username
    for (const femaleName of this.femaleFirstNames) {
      if (femaleName.length >= 3 && userClean.includes(femaleName)) {
        return { isFemale: true, isBrand: false, reason: `Username contém nome feminino (${femaleName})` };
      }
    }

    // 5. Checar termos femininos e de maternidade/moda na bio
    const femaleMatch = this.femaleBioKeywords.find(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(bioClean);
    });
    if (femaleMatch) {
      return { isFemale: true, isBrand: false, reason: `Termo feminino na bio (${femaleMatch})` };
    }

    // 6. Sufixo gramatical em língua portuguesa: primeiro nome terminando em 'a' (ex: Nayara, Larissa, Alana)
    if (firstName.length >= 4 && firstName.endsWith('a') && !this.maleFirstNames.has(firstName)) {
      return { isFemale: true, isBrand: false, reason: `Desinência nominal feminina (${firstName})` };
    }

    // 7. Soft-approval inteligente: se não é loja e não tem indicativo masculino, aprova para não perder criadoras válidas
    return {
      isFemale: true,
      isBrand: false,
      reason: 'Perfil individual qualificado (sem indicativo masculino ou comercial)'
    };
  }
};
