import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import type { GiftProfile, Recommendation, StructuredGiftProfile } from "@/types";
import { normalizeStructuredGiftProfile } from "@/services/giftProfileAi";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server.ts";

const MODEL = "openai/gpt-6-astra";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

const profileSchema = z.object({
  interests: z.array(z.string()),
  traits: z.array(z.string()),
  lifestyle: z.array(z.string()),
  giftPreferences: z.array(z.string()),
  avoid: z.array(z.string()),
});

const taxonomySchema = z.object({ profileId: z.string().nullable(), occasionId: z.string().nullable() });

const explanationsSchema = z.object({
  explanations: z.array(z.object({
    productId: z.string(),
    explanation: z.string(),
  })),
});

function createProvider(apiKey: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });
  return provider.responses(MODEL);
}

const providerOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low" as const,
    reasoningSummary: "auto" as const,
    store: false,
    include: ["reasoning.encrypted_content"],
  },
};

function parseGeneratedObject(error: unknown): unknown {
  if (!NoObjectGeneratedError.isInstance(error) || !error.text) return null;
  try {
    return JSON.parse(error.text);
  } catch {
    return null;
  }
}

export async function interpretGiftTextWithAi(
  apiKey: string,
  input: Pick<GiftProfile, "recipient" | "description" | "avoid">,
): Promise<StructuredGiftProfile> {
  const result = streamText({
    model: createProvider(apiKey),
    output: Output.object({ schema: profileSchema }),
    providerOptions,
    maxRetries: 0,
    instructions: [
      "Interprete um perfil de presente em português do Brasil.",
      "Extraia somente características explícitas ou razoavelmente implícitas no texto.",
      "Não escolha produtos, não crie links e não acrescente fatos.",
      "Use termos curtos e úteis para comparar com tags de catálogo.",
      "Retorne listas concisas; use lista vazia quando não houver evidência.",
      "O campo avoid deve conter apenas itens que a pessoa afirmou querer evitar ou já possuir.",
    ].join(" "),
    prompt: JSON.stringify({
      recipient: input.recipient,
      description: input.description,
      avoidText: input.avoid === "__none__" ? "" : input.avoid,
    }),
  });

  try {
    return normalizeStructuredGiftProfile(await result.output);
  } catch (error) {
    const parsed = parseGeneratedObject(error);
    if (parsed) return normalizeStructuredGiftProfile(parsed);
    throw error;
  }
}

export async function personalizeExplanationsWithAi(
  apiKey: string,
  profile: GiftProfile,
  recommendations: Recommendation[],
): Promise<Record<string, string>> {
  if (!recommendations.length) return {};
  const result = streamText({
    model: createProvider(apiKey),
    output: Output.object({ schema: explanationsSchema }),
    providerOptions,
    maxRetries: 0,
    instructions: [
      "Escreva uma justificativa curta e natural em português do Brasil para cada recomendação.",
      "O texto deve ter no máximo 130 caracteres.",
      "Escreva como uma sugestão entre amigos, simples, informal e humanizada.",
      "Fale diretamente sobre a pessoa e o presente, transmitindo a ideia de que ela pode gostar daquilo.",
      "Use exclusivamente os dados reais recebidos e não invente atributos, benefícios, preços, links ou preferências.",
      "Não explique o processo de seleção e não use linguagem técnica ou corporativa.",
      "Nunca use: orçamento, foi associado, foi associada, foi associado(a), sem ligação direta com os interesses informados, perfil, com base no perfil, de acordo com o perfil, seu perfil, interesses informados, correspondência, corresponde, algoritmo, analisamos ou identificamos.",
      "Mantenha exatamente cada productId recebido e retorne uma frase por produto.",
    ].join(" "),
    prompt: JSON.stringify({
      profile: {
        recipient: profile.recipient,
        occasion: profile.occasion,
        budget: profile.budget,
        description: profile.description,
        structured: profile.structuredProfile,
      },
      recommendations: recommendations.map(({ product, reasons }) => ({
        productId: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        categories: product.categories,
        tags: product.tags,
        occasions: product.occasions,
        profiles: product.profiles,
        reasons,
      })),
    }),
  });

  let output: z.infer<typeof explanationsSchema>;
  try {
    output = await result.output;
  } catch (error) {
    const parsed = parseGeneratedObject(error);
    const validated = explanationsSchema.safeParse(parsed);
    if (!validated.success) throw error;
    output = validated.data;
  }

  const validIds = new Set(recommendations.map((item) => item.product.id));
  return Object.fromEntries(output.explanations
    .filter((item) => validIds.has(item.productId) && item.explanation.trim())
    .map((item) => [item.productId, item.explanation.trim()]));
}

export async function resolveGiftTaxonomiesWithAi(apiKey: string, input: { recipient: string; occasion: string; profiles: { id: string; name: string }[]; occasions: { id: string; name: string }[] }): Promise<{ profileId: string | null; occasionId: string | null }> {
  const result = streamText({ model: createProvider(apiKey), output: Output.object({ schema: taxonomySchema }), providerOptions, maxRetries: 0,
    instructions: ["Associe as respostas exclusivamente aos registros fornecidos.", "Não crie, altere ou invente perfis ou ocasiões.", "Retorne somente IDs existentes nas listas.", "Se não houver correspondência clara, retorne null."].join(" "), prompt: JSON.stringify(input) });
  try { return await result.output; } catch (error) { const parsed = parseGeneratedObject(error); const validated = taxonomySchema.safeParse(parsed); if (validated.success) return validated.data; throw error; }
}
