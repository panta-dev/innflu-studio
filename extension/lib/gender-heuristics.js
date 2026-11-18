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

  // Grandes Redes Corporativas e Marcas Famosas (Pular sempre: C&A, Renner, Magalu, Avon, Boticário, etc.)
  knownCorporateBrands: new Set([
    'cea', 'cea_brasil', 'ceabrasil', 'lojasrenner', 'renner', 'magalu', 'magazineluiza',
    'avon', 'avonbrasil', 'oboticario', 'boticario', 'natura', 'naturabroficial', 'naturabrasil',
    'zara', 'zarabrasil', 'shein', 'sheinbrasil', 'sheinbrasil_', 'sheinofficial', 'shein_official',
    'shopee', 'shopee_br', 'shopeebrasil', 'lojasriachuelo', 'riachuelo', 'marisa', 'voudemarisa',
    'pernambucanas', 'casasbahia', 'pontofrio', 'extra', 'carrefourbrasil', 'carrefour', 'americanas',
    'sephora', 'sephorabrasil', 'eudora', 'quemdisseberenice', 'marykaybrasil', 'marykay',
    'maccosmetics', 'maccosmeticsbrasil', 'amaro', 'adorofarm', 'farmrio', 'animalebrasil',
    'animale', 'arezzo', 'schutzoficial', 'schutz', 'anacapri', 'anacaprioficial', 'melissaoficial',
    'melissa', 'havaianas', 'vivaraonline', 'vivara', 'pandorabrasil', 'pandora', 'aliexpressbr',
    'mercadolivre', 'dafiti', 'netshoes', 'centauroesporte', 'colccioficial', 'colcci',
    'hering_oficial', 'hering', 'dudalina', 'lelisblanc', 'johnjohndenim', 'shoulderoficial',
    'cantao', 'osklen', 'forumoficial', 'ellusjeansdeluxe', 'ellus', 'tramontina', 'tokstok',
    'mobly', 'camicado', 'polishop', 'fastshop', 'kalunga', 'kalungacom', 'submarino',
    'shoptime', 'panvel', 'drogasil', 'droga_raia', 'drogaraia', 'paguemenos'
  ]),

  // Tokens no Username indicativos de Lojas, Empresas e Perfis Comerciais
  brandUsernameTokens: [
    'lojas', 'loja', 'store', 'shop', 'shopping', 'boutique', 'varejo', 'atacado',
    'atacadista', 'outlet', 'multimarcas', 'confeccoes', 'calcados', 'semijoias',
    'joalheria', 'bijuterias', 'cosmeticos', 'perfumaria', 'distribuidora', 'otica',
    'modaintima', 'modapraia', 'biquinis', 'lingerie', 'moveis', 'eletro', 'farmacia', 'drogaria'
  ],

  // Termos na Bio indicativos de Lojas e E-commerces comerciais
  brandBioKeywords: [
    'compre no site', 'compre pelo site', 'compre no nosso site', 'compre online', 'compre agora',
    'clique no link para comprar', 'link de compras', 'link da loja', 'loja online', 'loja virtual',
    'loja oficial', 'loja física', 'lojas físicas', 'nossas lojas', 'baixe o app', 'baixe nosso app',
    'nosso app', 'site oficial', 'e-commerce', 'ecommerce', 'varejo', 'atacado e varejo',
    'somente atacado', 'vendas no atacado', 'atacadista', 'revenda autorizada', 'produtos importados',
    'catálogo disponível', 'catalogo disponivel', 'cardápio no link', 'cardapio no link',
    'enviamos para todo', 'enviamos p/ todo', 'entregamos para todo', 'entregamos em todo',
    'frete grátis', 'frete gratis', 'frete fixo', 'parcelamos em até', 'parcelamento em até',
    'sem juros', 'trocas e devoluções', 'trocas e devolucoes', 'peças limitadas',
    'pronta entrega', 'pedidos pelo direct', 'vendas pelo direct', 'vendas pelo whatsapp',
    'faça seu pedido', 'faca seu pedido', 'encomendas pelo direct',
    'cnpj:', 'sac:', 'razão social', 'razao social', 'marca registrada', 'marca autoral',
    'marca brasileira', 'marca de moda', 'marca de cosméticos', 'marca de roupas',
    'coleção disponível', 'colecao disponivel', 'nova coleção', 'nova colecao',
    'endereço da loja', 'rua:', 'av:', 'shopping center', 'loja de departamentos'
  ],

  // Categorias do Instagram indicativas de Empresa / Negócio Comercial
  corporateCategories: [
    'loja de departamento', 'loja de departamentos', 'loja de roupas', 'loja de cosméticos',
    'loja de calçados', 'loja de conveniência', 'loja de móveis', 'loja de artigos',
    'loja virtual', 'loja online', 'loja de varejo', 'comércio', 'comercio', 'comércio varejista',
    'varejo', 'marca', 'marca de cosméticos', 'marca de roupas', 'marca de calçados',
    'empresa', 'empresa de varejo', 'shopping e varejo', 'serviço de comércio eletrônico',
    'supermercado', 'restaurante', 'lanchonete', 'joalheria', 'acessórios', 'produto/serviço',
    'produtos/serviços', 'atacadista', 'distribuidora'
  ],

  /**
   * Verifica se o perfil é uma empresa, marca corporativa ou loja comercial
   */
  isCorporateBrand(username = '', fullName = '', bio = '') {
    const u = (username || '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const fn = (fullName || '').toLowerCase().trim();
    const b = (bio || '').toLowerCase();

    // 1. Checa marcas corporativas conhecidas diretamente no username ou nome
    if (this.knownCorporateBrands.has(u)) return true;
    for (const brand of this.knownCorporateBrands) {
      if (u === brand || u.startsWith(brand + '_') || u.endsWith('_' + brand) || u.startsWith(brand + '.') || u.endsWith('.' + brand)) {
        return true;
      }
      if (fn.includes(brand)) return true;
    }

    // 2. Tokens comerciais no username
    for (const token of this.brandUsernameTokens) {
      if (
        u.startsWith(token + '_') || u.endsWith('_' + token) ||
        u.startsWith(token + '.') || u.endsWith('.' + token) ||
        u === token || u.startsWith(token + 's_') ||
        (token.length >= 6 && u.includes(token))
      ) {
        return true;
      }
    }

    // 3. Nome de exibição com marcas ou termos de loja
    const commercialNameTokens = [
      'c&a', 'renner', 'magalu', 'magazine luiza', 'avon', 'boticário', 'boticario',
      'natura', 'zara', 'shein', 'shopee', 'riachuelo', 'marisa', 'casas bahia',
      'sephora', 'eudora', 'quem disse berenice', 'mary kay', 'arezzo', 'schutz',
      'melissa', 'vivara', 'pandora', 'loja ', 'lojas ', 'store', 'boutique ',
      'outlet ', 'atacado', 'multimarcas', 'confeccoes', 'calcados', 'semijoias'
    ];
    if (commercialNameTokens.some(t => fn.includes(t))) {
      return true;
    }

    // 4. Bio ou categoria com termos de e-commerce e varejo
    const extraBrandKeywords = window.__innfluDynamicRules?.blacklistBioKeywords || [];
    const allKeywords = [...this.brandBioKeywords, ...this.corporateCategories, ...extraBrandKeywords];
    if (allKeywords.some(kw => kw && (b.includes(kw) || fn.includes(kw)))) {
      return true;
    }

    return false;
  },

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

    // 1. Checar se é empresa corporativa, grande marca ou loja comercial (Elimina C&A, Renner, Magalu, Avon, Boticário...)
    if (this.isCorporateBrand(username, fullName, bio)) {
      return { isFemale: false, isBrand: true, reason: 'Identificado como empresa / loja comercial (não é influenciador)' };
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
