import type { GiftProfile, Product, Recommendation } from "@/types";

const MAX_LENGTH = 130;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shorten(value: string, max = MAX_LENGTH): string {
  const text = value.trim();
  if (text.length <= max) return text;
  const words = text.slice(0, max - 3).trimEnd().split(/\s+/);
  words.pop();
  return `${words.join(" ")}...`;
}

function productText(product: Product): string {
  return normalize([
    product.name,
    product.description,
    product.category,
    ...(product.categories ?? []),
    ...product.tags,
    ...product.occasions,
    ...product.profiles,
  ].join(" "));
}

function matchesTerm(product: Product, term: string): boolean {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  const text = productText(product);
  return text.includes(normalizedTerm);
}

function cleanTerm(value: string): string {
  return value
    .trim()
    .replace(/^interesse por\s+/i, "")
    .replace(/^interesse em\s+/i, "")
    .replace(/^gosta de\s+/i, "");
}

function getInterest(product: Product, profile: GiftProfile): string | null {
  const candidates = [
    ...(profile.structuredProfile?.interests ?? []),
    ...(profile.structuredProfile?.giftPreferences ?? []),
    ...(profile.quickContext?.terms ?? []),
  ]
    .map(cleanTerm)
    .filter(Boolean);

  return candidates.find((term) => matchesTerm(product, term)) ?? null;
}

function getProductNoun(product: Product): string {
  const category = (product.categories?.[0] || product.category || "").trim();
  if (category) return category.toLowerCase();
  return product.name.trim();
}

function getContextName(profile: GiftProfile): string {
  return profile.recipient.trim() || profile.occasion.trim();
}

function buildSpecificFallback(product: Product, profile: GiftProfile): string {
  const noun = getProductNoun(product);
  const context = getContextName(profile);

  if (profile.occasion.trim()) {
    return `Uma opção de ${noun} que combina com a ocasião de ${profile.occasion.trim().toLowerCase()}.`;
  }

  if (profile.recipient.trim()) {
    return `Uma ideia de ${noun} para presentear ${profile.recipient.trim().toLowerCase()}.`;
  }

  const detail = product.description.split(/[.!?]/)[0].trim();
  if (detail) return shorten(`Uma opção de ${noun} que ${detail.charAt(0).toLowerCase() + detail.slice(1)}.`);

  return `Uma opção de ${noun} para essa busca.`;
}

export function buildProductExplanation(
  rec: Recommendation,
  profile: GiftProfile,
): string {
  const product = rec.product;
  const interest = getInterest(product, profile);
  const occasion = profile.occasion.trim();
  const recipient = profile.recipient.trim();

  let text = "";

  if (interest) {
    text = `Uma escolha que combina com o interesse por ${interest.toLowerCase()} e com o tipo de produto buscado.`;
  } else if (occasion && matchesTerm(product, occasion)) {
    text = `Uma opção de ${getProductNoun(product)} que combina com a ocasião de ${occasion.toLowerCase()}.`;
  } else if (recipient && matchesTerm(product, recipient)) {
    text = `Uma ideia de ${getProductNoun(product)} relacionada ao perfil de ${recipient.toLowerCase()}.`;
  } else {
    text = buildSpecificFallback(product, profile);
  }

  return shorten(text);
}
