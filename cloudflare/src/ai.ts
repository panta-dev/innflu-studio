export interface BioAnalysisResult {
  isFemale: boolean;
  isBrand: boolean;
  niche: string;
  confidence: number;
  reason: string;
}

export async function analyzeProfileWithAI(
  aiBinding: any,
  fullName: string,
  bio: string,
  targetNiche: string
): Promise<BioAnalysisResult> {
  // Se o binding da AI do Cloudflare não estiver disponível, usamos heurística rápida
  if (!aiBinding) {
    return analyzeProfileWithHeuristics(fullName, bio, targetNiche);
  }

  try {
    const prompt = `Você é um classificador especializado em perfis do Instagram no Brasil para marketing de influência.
Analise os dados do perfil abaixo e retorne ESTRITAMENTE um JSON com as chaves:
- "isFemale": boolean (true se for perfil pessoal de mulher/mãe, false caso seja homem ou empresa/loja)
- "isBrand": boolean (true se for loja, e-commerce, clínica ou marca comercial; false se for pessoa física/criadora de conteúdo)
- "niche": string (o nicho principal identificado, ex: "maternidade", "moda", "fitness", "beleza", "outro")
- "confidence": number (de 0.0 a 1.0)
- "reason": string (resumo em 1 frase curta)

Perfil a analisar:
Nome de Exibição: "${fullName}"
Biografia: "${bio}"
Nicho Alvo Esperado: "${targetNiche}"

Responda APENAS com o JSON, sem markdown ou explicações externas.`;

    const response = await aiBinding.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'Você responde apenas objetos JSON válidos.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 256
    });

    const text = response?.response || '';
    // Tentar extrair o JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isFemale: Boolean(parsed.isFemale),
        isBrand: Boolean(parsed.isBrand),
        niche: String(parsed.niche || 'desconhecido'),
        confidence: Number(parsed.confidence || 0.8),
        reason: String(parsed.reason || 'Classificado via Workers AI')
      };
    }
  } catch (err) {
    console.error('Falha ao rodar Workers AI, recorrendo à heurística:', err);
  }

  return analyzeProfileWithHeuristics(fullName, bio, targetNiche);
}

export function analyzeProfileWithHeuristics(
  fullName: string,
  bio: string,
  targetNiche: string
): BioAnalysisResult {
  const bioLower = (bio || '').toLowerCase();
  const nameLower = (fullName || '').toLowerCase();

  // Padrões de marca ou clínica comercial
  const brandKeywords = [
    'loja', 'marca', 'comercial', 'contato@', 'vendas', 'encomendas', 
    'frete grátis', 'compre aqui', 'clínica', 'assessoria', 'agência', 'oficial'
  ];
  const isBrand = brandKeywords.some(kw => bioLower.includes(kw) || nameLower.includes(kw));

  // Padrões femininos e maternos
  const femaleKeywords = [
    'mãe', 'mae', 'mamãe', 'mamae', 'materno', 'maternidade', 'ela/dela', 
    'gestante', 'gravidinha', 'nutricionista', 'advogada', 'psicóloga', 
    'criadora', 'fotógrafa', 'influencer', 'esposa', 'filha'
  ];
  const femaleMatches = femaleKeywords.filter(kw => bioLower.includes(kw)).length;

  const isFemale = femaleMatches > 0 || !isBrand;

  return {
    isFemale,
    isBrand,
    niche: targetNiche || 'geral',
    confidence: isBrand ? 0.9 : 0.75,
    reason: isBrand 
      ? 'Detectado vocabulário de loja/marca' 
      : `Classificado por termos na bio (${femaleMatches} termos encontrados)`
  };
}
