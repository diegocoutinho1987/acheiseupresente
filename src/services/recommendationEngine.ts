import type { GiftProfile, Product, Recommendation, Refinement } from "@/types";
import { BUDGETS } from "@/data/options";

export interface UserGiftProfile {
  recipient: string;
  occasion: string;
  budgetMin: number;
  budgetMax: number;
  description: string;
  avoid: string;
  refinement: Refinement;
  feedback: string[];
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
    occasion: profile.occasion,
    budgetMin: budget?.min ?? 100,
    budgetMax: budget?.max ?? 200,
    description: profile.description,
    avoid: profile.avoid === "__none__" ? "" : profile.avoid,
    refinement: profile.refinement,
    feedback: profile.feedback,
  };
}

export function matchesAvoidTerms(product: Product, avoidText: string): boolean {
  if (!avoidText.trim()) return false;
  const avoidInterests = extractInterests(avoidText);
  const searchable = [product.name, product.description, product.category, ...product.tags].map(normalize);
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
    return Math.max(highest, overlap + (normalize(previous.category) === normalize(product.category) ? 2 : 0));
  }, 0);
}

export function calculateProductScore(product: Product, profile: UserGiftProfile, previousProducts: Product[] = []): ScoredProduct | null {
  if (matchesAvoidTerms(product, profile.avoid) || isOverBudget(product.price, profile.budgetMax)) return null;

  let score = 0;
  const reasons: string[] = [];
  const interests = extractInterests(profile.description);
  const normalizedTags = product.tags.map(normalize);
  const matchedInterests = interests.filter((interest) => normalizedTags.some((tag) => sameConcept(interest, tag)));
  if (matchedInterests.length) {
    score += matchedInterests.length * 10;
    reasons.push(`Combina com ${matchedInterests.slice(0, 3).join(", ")}, interesses mencionados na descrição.`);
  }

  if (product.occasions.some((occasion) => sameConcept(occasion, profile.occasion))) {
    score += 25;
    reasons.push(`Foi associado à ocasião ${profile.occasion.toLowerCase()}.`);
  }
  if (matchesProfile(profile.recipient, product.profiles)) {
    score += 20;
    reasons.push(`Foi cadastrado para o perfil ${profile.recipient.toLowerCase()}.`);
  }
  if (interests.some((interest) => sameConcept(interest, product.category))) {
    score += 10;
    reasons.push(`A categoria ${product.category} corresponde ao perfil descrito.`);
  }

  const price = priceScore(product.price, profile.budgetMin, profile.budgetMax);
  score += price.points;
  reasons.push(price.reason);

  const refinementTags = REFINEMENT_TAGS[profile.refinement] ?? [];
  const refinementMatches = refinementTags.filter((tag) => normalizedTags.some((productTag) => sameConcept(tag, productTag)));
  if (refinementMatches.length) {
    score += refinementMatches.length * 12;
    reasons.push(`Atende ao pedido por uma opção ${profile.refinement.toLowerCase().replace("mais ", "mais ")}.`);
  }

  if (profile.refinement === "Mais barato" || profile.feedback.includes("Muito caro")) {
    const upper = Number.isFinite(profile.budgetMax) ? profile.budgetMax : Math.max(profile.budgetMin * 2, product.price);
    score += Math.max(0, 20 * (1 - product.price / Math.max(upper, 1)));
    reasons.push("Prioriza um valor menor dentro das opções compatíveis.");
  }

  if (previousProducts.length && (profile.feedback.includes("Não combina com a pessoa") || profile.feedback.includes("Já tem algo parecido"))) {
    score -= previousSimilarity(product, previousProducts) * 8;
  }

  return { product, score, reasons };
}

function diversify(items: ScoredProduct[], stronger: boolean): ScoredProduct[] {
  const remaining = [...items];
  const selected: ScoredProduct[] = [];
  const categoryCounts = new Map<string, number>();
  const penalty = stronger ? 18 : 8;
  while (remaining.length && selected.length < 5) {
    remaining.sort((a, b) => {
      const adjustedA = a.score - (categoryCounts.get(normalize(a.product.category)) ?? 0) * penalty;
      const adjustedB = b.score - (categoryCounts.get(normalize(b.product.category)) ?? 0) * penalty;
      return adjustedB - adjustedA || b.score - a.score || a.product.name.localeCompare(b.product.name, "pt-BR");
    });
    const next = remaining.shift();
    if (!next) break;
    selected.push(next);
    const category = normalize(next.product.category);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  return selected;
}

function explanation(reasons: string[]): string {
  return reasons.slice(0, 3).join(" ");
}

export function rankProducts(products: Product[], giftProfile: GiftProfile, previousIds: string[] = []): Recommendation[] {
  const profile = toUserGiftProfile(giftProfile);
  const previous = new Set(previousIds);
  const previousProducts = products.filter((product) => previous.has(product.id));
  const scored = products
    .map((product) => calculateProductScore(product, profile, previousProducts))
    .filter((item): item is ScoredProduct => item !== null);

  const unseen = scored.filter((item) => !previous.has(item.product.id));
  const candidates = profile.refinement === "Quero outras opções" && unseen.length > 0
    ? [...unseen, ...scored.filter((item) => previous.has(item.product.id)).map((item) => ({ ...item, score: item.score - 50 }))]
    : scored.map((item) => ({ ...item, score: item.score - (previous.has(item.product.id) ? 3 : 0) }));
  const strongerDiversity = profile.feedback.includes("Muito comum") || profile.feedback.includes("Quero algo diferente");

  return diversify(candidates, strongerDiversity).map((item) => ({
    product: item.product,
    score: item.score,
    reasons: item.reasons,
    explanation: explanation(item.reasons),
  }));
}