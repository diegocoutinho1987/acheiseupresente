import type { GiftProfile, Recommendation } from "@/types";

const MAX_LENGTH = 130;

function shorten(value: string): string {
  const text = value.trim();
  if (text.length <= MAX_LENGTH) return text;
  const words = text.slice(0, MAX_LENGTH - 3).trimEnd().split(/\s+/);
  words.pop();
  return `${words.join(" ")}...`;
}

function fallback(rec: Recommendation, profile: GiftProfile): string {
  const { product } = rec;
  const description = product.description?.trim().split(/[.!?]/)[0]?.trim();
  const occasion = profile.occasion?.trim();
  const recipient = profile.recipient?.trim();

  if (occasion && description) {
    return shorten(`Eu consideraria este presente para ${occasion.toLowerCase()} porque ${description.toLowerCase()}.`);
  }
  if (recipient && description) {
    return shorten(`Eu consideraria este presente para ${recipient.toLowerCase()} porque ${description.toLowerCase()}.`);
  }
  if (description) return shorten(`Eu consideraria este presente porque ${description.toLowerCase()}.`);
  return "Eu consideraria este presente pelo que ele oferece no contexto desta busca.";
}

export function buildProductExplanation(rec: Recommendation, profile: GiftProfile): string {
  const value = rec.explanation?.trim();
  if (value && value.length <= MAX_LENGTH) return value;
  return fallback(rec, profile);
}