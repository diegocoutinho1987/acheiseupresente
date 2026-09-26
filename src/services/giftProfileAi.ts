import type { StructuredGiftProfile } from "@/types";

export const emptyStructuredGiftProfile = (): StructuredGiftProfile => ({
  interests: [],
  traits: [],
  lifestyle: [],
  giftPreferences: [],
  avoid: [],
});

const cleanList = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return [...new Set(values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean))].slice(0, 12);
};

export function normalizeStructuredGiftProfile(value: unknown): StructuredGiftProfile {
  if (!value || typeof value !== "object") return emptyStructuredGiftProfile();
  const record = value as Record<string, unknown>;
  return {
    interests: cleanList(record.interests),
    traits: cleanList(record.traits),
    lifestyle: cleanList(record.lifestyle),
    giftPreferences: cleanList(record.giftPreferences),
    avoid: cleanList(record.avoid),
  };
}

export function structuredProfileTerms(profile: StructuredGiftProfile | null | undefined): string[] {
  if (!profile) return [];
  return [...new Set([
    ...profile.interests,
    ...profile.traits,
    ...profile.lifestyle,
    ...profile.giftPreferences,
  ])];
}