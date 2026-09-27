import type { GiftProfile, Product, Recommendation, Refinement } from "@/types";
import { BUDGETS } from "@/data/options";
import { structuredProfileTerms } from "@/services/giftProfileAi";

export interface UserGiftProfile {
  recipient: string;
  recipientId: string | null;
  occasion: string;
  occasionId: string | null;
  budgetMin: number;
  budgetMax: number;
  description: string;
  avoid: string;
  refinement: Refinement;
  feedback: string[];
  interpretedTerms: string[];
  interpretedAvoid: string[];
  quickTerms: string[];
}

interface ScoredProduct {
  product: Product;
  score: number;
  reasons: string[];
}

const KEYWORDS: Record<string, string[]> = {
  tecnologia: ["tecnologia", "tech", "gadget", "eletronico", "computador"],
  programação: ["programacao", "programador", "programa", "desenvolvedor", "dev", "codigo", "ti"],
  videogame: ["videogame", "video game", "games", "game", "jogar"],
  café: ["cafe", "cafezinho", "espresso"],
  cozinha: ["cozinha", "cozinhar", "receita", "culinaria", "churrasco"],
  livros: ["livros", "livro", "leitura", "ler"],
  leitura: ["leitura", "leitor", "livro", "ler"],
  viagem: ["viagem", "viajar", "passeio", "turismo"],
  fitness: ["fitness", "academia", "treino", "malhar"],
  academia: ["academia", "treino", "malhar", "fitness"],
  esporte: ["esporte", "corrida", "correr", "bike", "pedal", "futebol"],
  música: ["musica", "banda", "podcast", "ouvir"],
  fotografia: ["fotografia", "fotografo", "foto"],
  carro: ["carro", "automovel", "dirigir"],
  organização: ["organizacao", "organizar", "organizado"],
  casa: ["casa", "lar", "caseiro", "sofa"],
  beleza: ["beleza", "maquiagem", "cosmetico"],
  filmes: ["filme", "cinema"],
  séries: ["serie", "netflix", "streaming"],
  arte: ["arte", "pintura", "desenho", "artesanato"],
  plantas: ["planta", "jardim", "jardinagem", "horta"],
  relaxar: ["relaxar", "relaxamento", "descansar", "calma"],
  prático: ["pratico", "funcional", "util"],
  trabalho: ["trabalho", "escritorio", "home office"],
  romântico: ["romantico", "carinho", "casal"],
};

const REFINEMENT_TAGS: Partial<Record<Refinement, string[]>> = {
  "Mais criativo": ["criativo", "diferente", "original", "personalizado", "divertido"],
  "Mais útil": ["pratico", "utilidade", "util", "casa", "organizacao", "trabalho", "tecnologia"],
  "Mais pessoal": ["personalizado", "presente", "romantico", "memoria", "memorias", "experiencia", "pessoal"],
};

const STOP_WORDS = new Set([
  "nao", "quero", "evitar", "nada", "algo", "com", "sem", "uma", "uns", "umas", "para", "por", "que", "ele", "ela", "tem", "muito", "muita", "muitos", "muitas", "dar", "gosta", "gostam", "presente",
]);

export function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function stem(word: string): string {
  if (word.length > 5 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function words(value: string): string[] {
  return normalize(value).split(/\s+/).filter((word) => word.length >= 3 && !STOP_WORDS.has(word)).map(stem);
}

function sameConcept(left: string, right: string): boolean {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const aWords = words(a);
  const bWords = words(b);
  return aWords.some((word) => bWords.includes(word));
}

export function extractInterests(text: string): string[] {
  const normalized = ` ${normalize(text)} `;
  return Object.entries(KEYWORDS)
    .filter(([, aliases]) => aliases.some((alias) => normalized.includes(` ${normalize(alias)} `) || normalized.includes(normalize(alias))))
    .map(([interest]) => interest);
}

export function toUserGiftProfile(profile: GiftProfile): UserGiftProfile {
  const budget = BUDGETS.find((item) => item.label === profile.budget) ?? BUDGETS[2];
  return {
    recipient: profile.recipient,
    recipientId: profile.recipientId,
    occasion: profile.occasion,
    occasionId: profile.occasionId,
    budgetMin: budget?.min ?? 100,
    budgetMax: budget?.max ?? 200,
    description: profile.description,
    avoid: profile.avoid === "__none__" ? "" : profile.avoid,
    refinement: profile.refinement,
    feedback: profile.feedback,
    interpretedTerms: structuredProfileTerms(profile.structuredProfile),
    interpretedAvoid: profile.structuredProfile?.avoid ?? [],
    quickTerms: profile.quickContext?.terms ?? [],
  };
}

export function matchesAvoidTerms(product: Product, avoidText: string): boolean {
  if (!avoidText.trim()) return false;
  const avoidInterests = extractInterests(avoidText);
  const searchable = [product.name, product.description, ...(product.categories ?? [product.category]), ...product.tags].map(normalize);
  if (avoidInterests.some((term) => searchable.some((value) => sameConcept(term, value)))) return true;
  const avoidWords = words(avoidText);
  return avoidWords.some((term) => searchable.some((value) => words(value).includes(term)));
}

function matchesProfile(recipient: string, profiles: string[]): boolean {
  const recipientWords = words(recipient.replace(/\(a\)|\(ã\)/gi, ""));
  return profiles.some((profile) => {
    const profileWords = words(profile);
    return profileWords.some((word) => recipientWords.includes(word));
  });
}

function priceScore(price: number, min: number, max: number): { points: number; reason: string } {
  if (price >= min && price <= max) return { points: 25, reason: "Está dentro do orçamento informado." };
  const lowerThreshold = min * 0.85;
  if (price < min && price >= lowerThreshold) return { points: 15, reason: "Fica um pouco abaixo do orçamento, mantendo boa compatibilidade de preço." };
  return { points: 5, reason: "É uma alternativa econômica em relação ao orçamento informado." };
}

function isOverBudget(price: number, max: number): boolean {
  return Number.isFinite(max) && price > max;
}

function previousSimilarity(product: Product, previousProducts: Product[]): number {
  const tags = new Set(product.tags.map(normalize));
  return previousProducts.reduce((highest, previous) => {
    const overlap = previous.tags.filter((tag) => tags.has(normalize(tag))).length;
    const sharedCategory = (product.categories ?? [product.category]).some((category) => (previous.categories ?? [previous.category]).some((previousCategory) => sameConcept(category, previousCategory)));
    return Math.max(highest, overlap + (sharedCategory ? 2 : 0));
  }, 0);
}

export function calculateProductScore(product: Product, profile: UserGiftProfile, previousProducts: Product[] = []): ScoredProduct | null {
  const avoidText = [profile.avoid, ...profile.interpretedAvoid].filter(Boolean).join(" ");
  if (matchesAvoidTerms(product, avoidText) || isOverBudget(product.price, profile.budgetMax)) return null;

  let score = 0;
  const reasons: string[] = [];
  const extractedInterests = extractInterests(profile.description);
  const interests = [...new Set([...extractedInterests, ...profile.interpretedTerms])];
  const normalizedTags = product.tags.map(normalize);
  const matchedInterests = interests.filter((interest) => normalizedTags.some((tag) => sameConcept(interest, tag)));
  if (matchedInterests.length) {
    score += matchedInterests.length * 10;
    reasons.push(`Combina com ${matchedInterests.slice(0, 3).join(", ")}, características identificadas no perfil.`);
  }

  if ((profile.occasionId && product.occasionIds?.includes(profile.occasionId)) || (!profile.occasionId && product.occasions.some((occasion) => sameConcept(occasion, profile.occasion)))) {
    score += 25;
    reasons.push(`Foi associado à ocasião ${profile.occasion.toLowerCase()}.`);
  }
  if ((profile.recipientId && product.profileIds?.includes(profile.recipientId)) || (!profile.recipientId && matchesProfile(profile.recipient, product.profiles))) {
    score += 20;
    reasons.push(`Foi cadastrado para o perfil ${profile.recipient.toLowerCase()}.`);
  }
  const quickTerms = profile.quickTerms.map(normalize).filter(Boolean);
  const quickMatches = quickTerms.filter((term) => [product.name, product.description, ...(product.categories ?? [product.category]), ...product.tags].some((value) => normalize(value).includes(term)));
  if (quickMatches.length) {
    score += quickMatches.length * 15;
    reasons.push("Tem características que combinam com essa busca.");
  }

  const matchedCategory = (product.categories ?? [product.category]).find((category) => interests.some((interest) => sameConcept(interest, category)));
  if (matchedCategory) {
    score += 10;
    reasons.push(`A categoria ${matchedCategory} corresponde ao perfil descrito.`);
  }

  const price = priceScore(product.price, profile.budgetMin, profile.budgetMax);
  score += price.points;
  reasons.push(price.reason);

  const refinementTags = REFINEMENT_TAGS[profile.refinement] ?? [];
  const refinementMatches = refinementTags.filter((tag) => normalizedTags.some((productTag) => sameConcept(tag, productTag)));
  if (refinementMatches.length) {
    score += refinementMatches.length * 60;
    reasons.push(`Atende ao pedido por uma opção ${profile.refinement.toLowerCase().replace("mais ", "mais ")}.`);
  }

  if (profile.refinement === "Mais barato" || profile.feedback.includes("Muito caro")) {
    const upper = Number.isFinite(profile.budgetMax) ? profile.budgetMax : Math.max(profile.budgetMin * 2, product.price);
    score += Math.max(0, 300 * (1 - product.price / Math.max(upper, 1)));
    reasons.push("Prioriza um valor menor dentro das opções compatíveis.");
  }

  if (previousProducts.length && (profile.feedback.includes("Não combina com a pessoa") || profile.feedback.includes("Já tem algo parecido") || profile.feedback.includes("Quero algo diferente") || profile.feedback.includes("Muito comum"))) {
    score -= previousSimilarity(product, previousProducts) * 8;
  }

  return { product, score, reasons };
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function variationBonus(productId: string, seed: string): number {
  return (hashSeed(`${seed}:${productId}`) % 251) / 100;
}

function productCategories(product: Product): string[] {
  return [...new Set((product.categories?.length ? product.categories : [product.category]).map(normalize).filter(Boolean))];
}

function productTags(product: Product): string[] {
  return [...new Set(product.tags.map(normalize).filter(Boolean))];
}

function productWords(product: Product): string[] {
  return [...new Set(words(`${product.name} ${product.description}`))];
}

function similarityPenalty(product: Product, selected: ScoredProduct): number {
  const sharedCategories = productCategories(product).filter((category) => productCategories(selected.product).some((other) => sameConcept(category, other))).length;
  const sharedTags = productTags(product).filter((tag) => productTags(selected.product).some((other) => sameConcept(tag, other))).length;
  const sharedWords = productWords(product).filter((word) => productWords(selected.product).includes(word)).length;

  return Math.min(24, sharedCategories * 12 + Math.min(sharedTags, 3) * 3 + Math.min(sharedWords, 4));
}

function diversify(items: ScoredProduct[], stronger: boolean, limit: number, seed: string): ScoredProduct[] {
  if (items.length <= limit) return [...items].sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "pt-BR"));

  const ranked = [...items].sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "pt-BR"));
  const topScore = ranked[0]?.score ?? 0;
  const poolSize = Math.min(items.length, Math.max(limit * 2, Math.ceil(items.length * 0.6)));
  const scoreFloor = topScore - Math.max(12, Math.abs(topScore) * 0.12);
  const pool = ranked.filter((item) => item.score >= scoreFloor).slice(0, poolSize);
  const candidates = pool.length >= limit ? pool : ranked.slice(0, poolSize);

  const selected: ScoredProduct[] = [];
  const categoryCounts = new Map<string, number>();
  const similarityStrength = stronger ? 1.25 : 1;

  while (candidates.length && selected.length < limit) {
    let bestIndex = 0;
    let bestAdjusted = Number.NEGATIVE_INFINITY;

    candidates.forEach((candidate, index) => {
      const repeatedCategories = Math.max(0, ...productCategories(candidate.product).map((category) => categoryCounts.get(category) ?? 0));
      const categoryPenalty = repeatedCategories * (stronger ? 14 : 10);
      const similarToSelected = selected.reduce((highest, previous) => Math.max(highest, similarityPenalty(candidate.product, previous)), 0);
      const adjusted = candidate.score
        - categoryPenalty
        - similarToSelected * similarityStrength
        + variationBonus(candidate.product.id, seed);

      if (
        adjusted > bestAdjusted ||
        (adjusted === bestAdjusted && candidate.score > candidates[bestIndex].score) ||
        (adjusted === bestAdjusted && candidate.product.id < candidates[bestIndex].product.id)
      ) {
        bestAdjusted = adjusted;
        bestIndex = index;
      }
    });

    const [next] = candidates.splice(bestIndex, 1);
    selected.push(next);
    productCategories(next.product).forEach((category) => categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1));
  }

  return selected;
}
function explanation(reasons: string[]): string {
  return reasons.join(" ");
}

export function rankProducts(
  products: Product[],
  giftProfile: GiftProfile,
  previousIds: string[] = [],
  limit = 3,
  sessionId: string | null = null,
): Recommendation[] {
  const profile = toUserGiftProfile(giftProfile);
  const previous = new Set(previousIds);
  const previousProducts = products.filter((product) => previous.has(product.id));
  const scored = products
    .filter((product) => product.active)
    .map((product) => calculateProductScore(product, profile, previousProducts))
    .filter((item): item is ScoredProduct => item !== null);

  const unseen = scored.filter((item) => !previous.has(item.product.id));
  const candidates = unseen.length >= limit
    ? unseen
    : scored.map((item) => ({ ...item, score: item.score - (previous.has(item.product.id) ? 3 : 0) }));
  const strongerDiversity = profile.feedback.includes("Muito comum") || profile.feedback.includes("Quero algo diferente");
  const contextSeed = [
    sessionId ?? "no-session",
    profile.recipient,
    profile.recipientId ?? "",
    profile.occasion,
    profile.occasionId ?? "",
    profile.budgetMin,
    profile.budgetMax,
    profile.description,
    profile.avoid,
    profile.refinement,
    ...profile.feedback,
    ...profile.interpretedTerms,
    ...profile.quickTerms,
  ].join("|");

  return diversify(candidates, strongerDiversity, limit, contextSeed).map((item) => ({
    product: item.product,
    score: item.score,
    reasons: item.reasons,
    explanation: explanation(item.reasons),
  }));
}