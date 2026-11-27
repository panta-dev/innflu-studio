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
    'julio', 'júlio', 'cesar', 'césar', 'otavio', 'otávio', 'murilo', 'breno', 'cauã', 'caua',
    'luan', 'kaique', 'wesley', 'alan', 'allan', 'alex', 'alisson', 'anderson', 'bryan', 'cristiano',
    'denis', 'douglas', 'edson', 'elias', 'emerson', 'enzo', 'erick', 'fabricio', 'fabrício', 'flavio',
    'flávio', 'geraldo', 'gilberto', 'hugo', 'ian', 'isaac', 'jean', 'jefferson', 'jonas', 'jorge',
    'jose', 'josé', 'juan', 'kevin', 'leo', 'lorenzo', 'luciano', 'luiz', 'luis', 'manoel', 'mario',
    'mário', 'mauricio', 'maurício', 'miguel', 'nathan', 'nicolas', 'nelson', 'pablo', 'patrick',
    'raul', 'renato', 'rubens', 'ruan', 'sandro', 'silvio', 'tales', 'theo', 'teo', 'wagner',
    'walter', 'wilson', 'yago', 'yuri', 'jeferson', 'junior', 'júnior', 'neto', 'wellington'
  ]),

  // Termos na bio característicos de homens (evidência de gênero masculino)
  maleBioKeywords: [
    'pai', 'papai', 'paizão', 'pai de', 'ele/dele', 'he/him', 'marido', 'empresário', 'empresario',
    'advogado', 'médico', 'medico', 'psicólogo', 'psicologo', 'fotógrafo', 'fotografo', 'arquiteto',
    'ator', 'blogueiro', 'maquiador', 'professor', 'treinador', 'barbeiro', 'jogador', 'cantor'
  ],

  // Evidências fortes de gênero feminino na bio (flexão feminina explícita)
  femaleStrongBioKeywords: [
    'mãe', 'mae', 'mamãe', 'mamae', 'mãe de', 'gestante', 'gravidinha', 'tentante', 'ela/dela', 'she/her',
    'esposa', 'advogada', 'psicóloga', 'psicologa', 'fotógrafa', 'fotografa', 'arquiteta', 'médica',
    'medica', 'empresária', 'empresaria', 'atriz', 'blogueira', 'maquiadora', 'professora', 'criadora',
    'nutricionista e mãe', 'dona de casa', 'puerpério', 'puerperio', 'maternando', 'mamãe de'
  ],

  // Categorias do Instagram que indicam criador / pessoa (evidência a favor de ser influenciador)
  creatorCategories: [
    'criador de conteúdo digital', 'criadora de conteúdo digital', 'criador(a) de conteúdo digital',
    'blogueiro', 'blogueira', 'blogueiro(a)', 'figura pública', 'pessoa pública', 'influenciador',
    'influenciadora', 'influenciador digital', 'jornalista', 'artista digital', 'criador de conteúdo'
  ],

  // Termos de achadinhos / afiliados / vitrines de produtos (nome de usuário)
  commerceUsernameTokens: [
    'achadinho', 'achadinhos', 'achados', 'achadosdodia', 'ofertas', 'oferta', 'promo', 'promocao',
    'promocoes', 'cupom', 'cupons', 'descontos', 'desconto', 'catalogo', 'revenda', 'importados',
    'brecho', 'bazar', 'garimpo', 'garimpos', 'vitrine', 'dicasdecompras', 'comprinhas', 'compras'
  ],

  // Termos de achadinhos / afiliados / vitrines na bio (fortes)
  commerceBioStrong: [
    'achadinhos', 'achadinho', 'achados da shopee', 'achados shopee', 'ofertas do dia', 'melhores ofertas',
    'cupom de desconto', 'cupons de desconto', 'todos os links', 'link dos produtos', 'links dos produtos',
    'produtos que indico', 'compre pelo link', 'compre pelo nosso link', 'catálogo', 'catalogo',
    'grupo de ofertas', 'grupo de promoções', 'grupo de promocoes', 'canal de ofertas', 'garimpando ofertas',
    'garimpo de ofertas', 'vitrine', 'preço baixo', 'preços baixos', 'revendedora', 'revendedor'
  ],

  // Termos fracos (sozinhos não bastam)
  commerceBioWeak: [
    'cupom', 'cupons', 'desconto', 'descontos', 'oferta', 'ofertas', 'promoção', 'promoções', 'promocao',
    'promocoes', 'shopee', 'amazon', 'mercado livre', 'mercadolivre', 'aliexpress', 'temu', 'magalu', 'shein'
  ],

  // Termos femininos fracos / contextuais (sozinhos não definem gênero)
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

  // ===== Utilitários =====
  _norm(str) {
    return (str || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  },

  _normSet(name, list) {
    if (!this._sets) this._sets = {};
    if (!this._sets[name]) this._sets[name] = new Set(list.map(x => this._norm(x)));
    return this._sets[name];
  },

  _hasTerm(textNorm, term) {
    const t = this._norm(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9])' + t + '([^a-z0-9]|$)', 'i').test(textNorm);
  },

  /**
   * Análise combinada (usuário + nome + bio + categoria) de perfil comercial.
   * level: 'brand' (loja/achadinhos/catálogo), 'uncertain' (dúvida: não enviar) ou 'ok'.
   */
  commercialAnalysis(username = '', fullName = '', bio = '', category = '') {
    const u = this._norm(username).replace(/[^a-z0-9_.]/g, '');
    const fn = this._norm(fullName).trim();
    const b = this._norm(bio);
    const cat = this._norm(category);
    const reasons = [];
    let score = 0;
    const add = (pts, why) => { score += pts; reasons.push(why); };

    // 1. Marcas conhecidas
    for (const brand of this.knownCorporateBrands) {
      if (u === brand || u.startsWith(brand + '_') || u.endsWith('_' + brand) || u.startsWith(brand + '.') || u.endsWith('.' + brand) || (fn.length > 3 && fn === brand)) {
        add(5, `marca conhecida (${brand})`);
        break;
      }
    }

    // 2. Tokens comerciais no @username
    const userTokens = [...this.brandUsernameTokens, ...this.commerceUsernameTokens];
    for (const token of userTokens) {
      if (
        u === token || u.startsWith(token + '_') || u.endsWith('_' + token) ||
        u.startsWith(token + '.') || u.endsWith('.' + token) || u.startsWith(token + 's_') ||
        (token.length >= 6 && u.includes(token))
      ) {
        add(3, `@usuário comercial (${token})`);
        break;
      }
    }

    // 3. Nome de exibição com termos de loja
    const commercialNameTokens = ['loja', 'lojas', 'store', 'boutique', 'outlet', 'atacado', 'multimarcas',
      'confeccoes', 'calcados', 'semijoias', 'achadinhos', 'achados', 'ofertas', 'promo', 'cupons', 'catalogo', 'brecho', 'bazar'];
    const nameHit = commercialNameTokens.find(t => this._hasTerm(fn, t));
    if (nameHit) add(2, `nome com termo comercial (${nameHit})`);
    const brandInName = ['c&a', 'renner', 'magalu', 'magazine luiza', 'avon', 'boticario', 'natura', 'zara', 'shein', 'shopee',
      'riachuelo', 'casas bahia', 'sephora', 'eudora', 'mary kay'].find(t => fn.includes(t));
    if (brandInName) add(3, `nome de marca (${brandInName})`);

    // 4. Categoria do Instagram
    const catHit = this.corporateCategories.find(c => cat && cat.includes(this._norm(c)));
    if (catHit) add(3, `categoria comercial (${catHit})`);

    // 5. Bio: e-commerce / achadinhos (fortes) e fracos
    const extra = (window.__innfluDynamicRules && window.__innfluDynamicRules.blacklistBioKeywords) || [];
    const strongTerms = [...this.brandBioKeywords, ...this.commerceBioStrong, ...extra].filter(Boolean);
    const strongHits = strongTerms.filter(kw => b.includes(this._norm(kw)));
    if (strongHits.length) add(Math.min(6, strongHits.length * 2), `bio comercial (${strongHits.slice(0, 3).join(', ')})`);
    const weakHits = this.commerceBioWeak.filter(kw => this._hasTerm(b, kw));
    if (weakHits.length) add(Math.min(2, weakHits.length), `bio com termos de oferta (${weakHits.slice(0, 3).join(', ')})`);

    // 6. Evidência a favor de criador de conteúdo reduz a suspeita (nunca anula marca conhecida)
    const creatorHit = this.creatorCategories.find(c => (cat + ' ' + b).includes(this._norm(c)));
    if (creatorHit && score > 0 && score < 5) {
      score = Math.max(0, score - 1);
      reasons.push(`categoria de criador (${creatorHit})`);
    }

    const level = score >= 3 ? 'brand' : (score === 2 ? 'uncertain' : 'ok');
    return { score, level, reasons };
  },

  /**
   * Verifica se o perfil é uma empresa, loja, achadinhos ou catálogo.
   */
  isCorporateBrand(username = '', fullName = '', bio = '', category = '') {
    return this.commercialAnalysis(username, fullName, bio, category).level === 'brand';
  },

  /**
   * Gênero com evidência suficiente: 'female' | 'male' | 'unknown'.
   * Nunca assume gênero por padrão.
   */
  detectGender(fullName = '', bio = '', username = '') {
    const femSet = this._normSet('fem', Array.from(this.femaleFirstNames));
    const maleSet = this._normSet('male', Array.from(this.maleFirstNames));
    const bioN = this._norm(bio);
    const userN = this._norm(username).replace(/[^a-z0-9_.]/g, '');
    const titles = new Set(['dra', 'dr', 'prof', 'profa', 'mc', 'dj', 'sra', 'sr']);
    const words = this._norm(fullName).split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).filter(w => w && !titles.has(w));
    const first = words[0] || '';
    let f = 0, m = 0;
    const evid = [];

    if (first) {
      if (femSet.has(first) && !maleSet.has(first)) { f += 3; evid.push(`nome ${first}`); }
      else if (maleSet.has(first) && !femSet.has(first)) { m += 3; evid.push(`nome ${first}`); }
      else if (first.length >= 4 && first.endsWith('a') && !maleSet.has(first)) { f += 1; evid.push(`final -a em ${first}`); }
    }

    const tokens = userN.split(/[_.]+/).filter(Boolean);
    const userHit = (set) => Array.from(set).find(n => n.length >= 4 && (tokens.includes(n) || userN.startsWith(n)));
    const uf = userHit(femSet); if (uf && f < 3) { f += 1; evid.push(`@ com ${uf}`); }
    const um = userHit(maleSet); if (um && m < 3) { m += 1; evid.push(`@ com ${um}`); }

    const strongF = this.femaleStrongBioKeywords.filter(k => this._hasTerm(bioN, k));
    if (strongF.length) { f += Math.min(4, strongF.length * 2); evid.push(`bio (${strongF.slice(0, 2).join(', ')})`); }
    const weakF = this.femaleBioKeywords.filter(k => !this.femaleStrongBioKeywords.includes(k) && this._hasTerm(bioN, k));
    if (weakF.length) f += 1;
    const maleB = this.maleBioKeywords.filter(k => this._hasTerm(bioN, k));
    if (maleB.length) { m += Math.min(4, maleB.length * 2); evid.push(`bio (${maleB.slice(0, 2).join(', ')})`); }

    let gender = 'unknown';
    if (f >= 3 && f >= m + 2) gender = 'female';
    else if (m >= 3 && m >= f + 2) gender = 'male';
    return { gender, femaleScore: f, maleScore: m, evidence: evid };
  },

  /**
   * Classificação completa de um perfil.
   * @returns {{ gender, isFemale, isMale, isBrand, isUncertain, brandLevel, reason }}
   */
  classify(fullName, bio, username = '', category = '') {
    const com = this.commercialAnalysis(username, fullName, bio, category);
    if (com.level === 'brand') {
      return { gender: 'unknown', isFemale: false, isMale: false, isBrand: true, isUncertain: false, brandLevel: 'brand', reason: `Loja/comercial/achadinhos: ${com.reasons.join('; ')}` };
    }
    if (com.level === 'uncertain') {
      return { gender: 'unknown', isFemale: false, isMale: false, isBrand: false, isUncertain: true, brandLevel: 'uncertain', reason: `Perfil não validado (indício comercial): ${com.reasons.join('; ')}` };
    }
    const g = this.detectGender(fullName, bio, username);
    const label = g.gender === 'female' ? 'feminino' : g.gender === 'male' ? 'masculino' : 'não identificado';
    return {
      gender: g.gender,
      isFemale: g.gender === 'female',
      isMale: g.gender === 'male',
      isBrand: false,
      isUncertain: false,
      brandLevel: 'ok',
      reason: `Gênero ${label}${g.evidence.length ? ' (' + g.evidence.join('; ') + ')' : ' (sem evidência suficiente)'}`
    };
  }
};
