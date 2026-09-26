import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const InputSchema = z.object({
  recipient: z.string().min(1),
  occasion: z.string().min(1),
  budget_range: z.string().min(1),
  profile_text: z.string().min(20),
  avoid_text: z.string().optional().default(""),
  refinement_preference: z.string().optional(),
});

type Recommendation = {
  id: string;
  name: string;
  price: number;
  store: string;
  image_url: string | null;
  affiliate_url: string;
  justification: string;
};

type Parsed = {
  interests: string[];
  personality: string[];
  avoid: string[];
  budget_min: number;
  budget_max: number;
};

const BUDGET_RANGES: Record<string, [number, number]> = {
  "Até R$50": [0, 50],
  "R$50–100": [50, 100],
  "R$100–200": [100, 200],
  "R$200–500": [200, 500],
  "Mais de R$500": [500, 1000000],
};

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

async function deepseek(messages: Array<{ role: string; content: string }>, jsonMode = true) {
  const apiKey = process.env["DEEPSEEK_API_KEY"];
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY não configurada.");

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

function safeJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

const norm = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const processRecommendation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ products: Recommendation[] }> => {
    const [rangeMin, rangeMax] = BUDGET_RANGES[data.budget_range] ?? [0, 1000000];

    // 1. Parse the free-text profile with DeepSeek
    const parseRaw = await deepseek([
      {
        role: "system",
        content:
          "Você extrai um perfil estruturado de presenteado a partir de um texto livre em português. Responda APENAS com JSON válido no formato: {\"interests\":[],\"personality\":[],\"avoid\":[],\"budget_min\":0,\"budget_max\":0}. Use palavras simples em português minúsculo nos arrays.",
      },
      {
        role: "user",
        content: `Presenteado: ${data.recipient}\nOcasião: ${data.occasion}\nFaixa de preço: ${data.budget_range} (min ${rangeMin}, max ${rangeMax})\nSobre a pessoa: ${data.profile_text}\nEvitar: ${data.avoid_text || "nada informado"}${
          data.refinement_preference ? `\nPreferência de refinamento: ${data.refinement_preference}` : ""
        }`,
      },
    ]);

    const parsed = safeJson<Parsed>(parseRaw) ?? {
      interests: [],
      personality: [],
      avoid: [],
      budget_min: rangeMin,
      budget_max: rangeMax,
    };

    const budgetMin = Number.isFinite(parsed.budget_min) ? Math.min(parsed.budget_min ?? rangeMin, rangeMin) : rangeMin;
    const budgetMax = Number.isFinite(parsed.budget_max) ? Math.max(parsed.budget_max ?? rangeMax, rangeMax) : rangeMax;

    // 2. Read active products and score them
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: products, error } = await supabase
      .from("products")
      .select("id,name,description,price,store,image_url,affiliate_url,tags,occasions")
      .eq("active", true);

    if (error) throw new Error(error.message);

    const interests = (parsed.interests ?? []).map(norm);
    const personality = (parsed.personality ?? []).map(norm);
    const avoid = [...(parsed.avoid ?? []), ...(data.avoid_text ? data.avoid_text.split(/[,;\n]/) : [])]
      .map(norm)
      .filter((v) => v.length > 2);
    const occasion = norm(data.occasion);

    const scored = (products ?? [])
      .map((p) => {
        const price = Number(p.price);
        if (price < rangeMin || price > rangeMax) return null;

        const tags = (p.tags ?? []).map(norm);
        const occasions = (p.occasions ?? []).map(norm);
        const description = norm(p.description ?? "");
        let score = 0;

        for (const i of interests) if (tags.some((t) => t.includes(i) || i.includes(t))) score += 3;
        for (const t of personality) if (tags.some((tag) => tag.includes(t) || t.includes(tag))) score += 2;
        if (occasions.some((o) => o === occasion)) score += 2;
        if (price >= budgetMin && price <= budgetMax) score += 5;
        for (const a of avoid) {
          if (tags.some((t) => t.includes(a)) || description.includes(a)) score -= 10;
        }

        return { ...p, price, score };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (scored.length === 0) {
      return { products: [] };
    }

    // 3. Generate justifications with DeepSeek
    const justifyRaw = await deepseek([
      {
        role: "system",
        content:
          "Você escreve justificativas curtas (1 a 2 frases) em português do Brasil explicando por que cada produto combina com a pessoa descrita. Cite detalhes concretos do texto original. Nunca invente produtos, preços ou lojas. Responda APENAS com JSON: {\"justifications\":[{\"id\":\"...\",\"justification\":\"...\"}]}",
      },
      {
        role: "user",
        content: `Texto original sobre a pessoa: "${data.profile_text}"\nPresenteado: ${data.recipient} | Ocasião: ${data.occasion} | Orçamento: ${data.budget_range}\nEvitar: ${data.avoid_text || "nada"}\n\nProdutos:\n${scored
          .map((p) => `- id: ${p.id} | ${p.name} | ${p.description}`)
          .join("\n")}`,
      },
    ]);

    const justifications =
      safeJson<{ justifications: Array<{ id: string; justification: string }> }>(justifyRaw)?.justifications ?? [];

    return {
      products: scored.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        store: p.store,
        image_url: p.image_url,
        affiliate_url: p.affiliate_url,
        justification:
          justifications.find((j) => j.id === p.id)?.justification ??
          `Combina com o que você contou sobre ${data.recipient.toLowerCase()} e cabe no orçamento escolhido.`,
      })),
    };
  });
