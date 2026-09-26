import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { GiftProfile, Recommendation } from "@/types";

const interpretInput = z.object({
  recipient: z.string(),
  description: z.string(),
  avoid: z.string(),
});

const explanationsInput = z.object({
  profile: z.custom<GiftProfile>(),
  recommendations: z.custom<Recommendation[]>(),
});

export const interpretGiftProfile = createServerFn({ method: "POST" })
  .validator((data) => interpretInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env['LOVABLE_API_KEY']!;
    if (!apiKey) throw new Error("A interpretação inteligente não está configurada.");
    const { interpretGiftTextWithAi } = await import("@/lib/ai/gift-ai.server");
    return interpretGiftTextWithAi(apiKey, data);
  });

export const personalizeRecommendationExplanations = createServerFn({ method: "POST" })
  .validator((data) => explanationsInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env['LOVABLE_API_KEY']!;
    if (!apiKey) throw new Error("As explicações inteligentes não estão configuradas.");
    const { personalizeExplanationsWithAi } = await import("@/lib/ai/gift-ai.server");
    return personalizeExplanationsWithAi(apiKey, data.profile, data.recommendations);
  });