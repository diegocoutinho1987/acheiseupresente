import type { GiftProfile, Product, Recommendation } from "@/types";
import { getCatalog } from "@/services/catalogService";
import { BUDGETS } from "@/data/options";

/**
 * Camada de serviço. Hoje usa dados mockados e regras simples.
 * Futuro: substituir por chamada HTTP ao backend Java/Spring Boot, ex.:
 *   fetch(`${API_URL}/recommendations`, { method: "POST", body: JSON.stringify(profile) })
 */

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Sinônimos simples para mapear o texto livre às tags do catálogo.
const KEYWORDS: Record<string, string[]> = {
  café: ["cafe", "cafezinho", "espresso"],
  tecnologia: ["tecnologia", "tech", "gadget", "eletronico"],
  programação: ["programa", "desenvolvedor", "dev", "codigo", "ti"],
  videogame: ["videogame", "game", "jogo", "jogar"],
  leitura: ["ler", "leitura", "livro", "leitor"],
  música: ["musica", "ouvir", "banda", "podcast"],
  viagem: ["viaj", "viagem", "passeio"],
  trilha: ["trilha", "montanha", "acampar"],
  esporte: ["esporte", "corr", "bike", "pedal", "futebol"],
  academia: ["academia", "treino", "malhar"],
  yoga: ["yoga", "medita", "pilates"],
  cozinha: ["cozinh", "receita", "culinari"],
  plantas: ["planta", "jardim", "horta"],
  arte: ["arte", "pint", "desenh", "artesanato"],
  fotografia: ["foto"],
  moda: ["moda", "estilo", "vaidos", "elegante"],
  caseiro: ["caseir", "em casa", "netflix", "serie", "filme", "sofa"],
  prático: ["pratic", "funcional", "objetiv"],
  relaxar: ["relax", "estress", "descans", "calma"],
  chá: ["cha "],
  família: ["familia", "neto", "filhos"],
  romântico: ["romant", "carinh"],
  trabalho: ["trabalh", "escritorio", "home office"],
};

export function extractInterests(text: string): string[] {
  const t = ` ${norm(text)} `;
  return Object.entries(KEYWORDS)
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([tag]) => tag);
}

function avoidMatch(p: Product, avoid: string) {
  if (!avoid.trim()) return false;
  const a = norm(avoid);
  const fromText = extractInterests(avoid);
  if (fromText.some((t) => p.tags.includes(t))) return true;
  if (/roupa/.test(a) && p.category === "moda") return true;
  if (/acessorio.*computador|computador/.test(a) && p.category === "tecnologia") return true;
  return norm(p.name).split(" ").some((w) => w.length > 4 && a.includes(w));
}

const REFINE_TAGS: Record<string, string[]> = {
  "Mais criativo": ["criativo", "experiência", "arte", "hobby", "jogos"],
  "Mais útil": ["útil", "prático"],
  "Mais pessoal": ["pessoal", "memórias", "romântico", "família"],
};

function score(p: Product, profile: GiftProfile, interests: string[], min: number, max: number, previous: Set<string>) {
  let s = 0;
  const matched = p.tags.filter((t) => interests.includes(t));
  s += matched.length * 3;
  if (p.price >= min && p.price <= max) s += 5;
  else s -= p.price > max ? 8 : 3;
  const refineTags = REFINE_TAGS[profile.refinement];
  if (refineTags) s += p.tags.filter((t) => refineTags.includes(t)).length * 4;
  if (profile.refinement === "Mais barato") s += Math.max(0, 6 - p.price / 40);
  if (profile.refinement === "Quero outras opções" && previous.has(p.id)) s -= 20;
  if (profile.refinement && profile.refinement !== "Quero outras opções" && previous.has(p.id)) s -= 3;
  if (/mae|pai|namorad|espos/.test(norm(profile.recipient)) && p.tags.includes("pessoal")) s += 1;
  if (/namorad/.test(norm(profile.occasion)) && p.tags.includes("romântico")) s += 2;
  return { s, matched };
}

const who = (r: string) => {
  const m: Record<string, string> = {
    "Mãe": "sua mãe", "Pai": "seu pai", "Esposo(a)": "seu par", "Namorado(a)": "seu par",
    "Filho(a)": "seu filho(a)", "Irmão(ã)": "seu irmão(ã)", "Amigo(a)": "seu amigo(a)", "Colega": "seu colega",
  };
  return m[r] ?? "essa pessoa";
};

const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} e ${a[a.length - 1]}`);

function buildReason(p: Product, profile: GiftProfile, matched: string[], inBudget: boolean, i: number) {
  const person = who(profile.recipient);
  const parts: string[] = [];
  if (matched.length >= 2) {
    const openers = [
      `Você contou que ${person} gosta de ${list(matched.slice(0, 3))} — este presente junta esses interesses em uma coisa só.`,
      `Pelo que você descreveu, ${list(matched.slice(0, 2))} fazem parte do dia a dia de ${person}, e é exatamente aí que este item entra.`,
    ];
    parts.push(openers[i % 2] ?? openers[0]!);
  } else if (matched.length === 1) {
    const openers = [
      `O interesse por ${matched[0]} que você mencionou foi o ponto de partida desta escolha.`,
      `Como ${person} curte ${matched[0]}, esta opção tem tudo para ser usada de verdade.`,
      `Escolhemos pensando no gosto por ${matched[0]} que aparece na sua descrição.`,
    ];
    parts.push(openers[i % 3] ?? openers[0]!);
  } else {
    parts.push(`${p.description.split(".")[0]} — uma escolha versátil para ${person}${profile.occasion && !/sem ocasiao|outra/.test(norm(profile.occasion)) ? ` neste ${profile.occasion.toLowerCase().startsWith("dia") ? profile.occasion : profile.occasion.toLowerCase()}` : ""}.`);
  }
  const extras: string[] = [];
  if (profile.refinement === "Mais criativo" && p.tags.includes("criativo")) extras.push("Foge do óbvio, como você pediu.");
  if (profile.refinement === "Mais útil" && p.tags.some((t) => t === "útil" || t === "prático")) extras.push("É algo para usar no dia a dia.");
  if (profile.refinement === "Mais pessoal" && p.tags.includes("pessoal")) extras.push("Tem um toque mais afetivo e pessoal.");
  if (profile.refinement === "Mais barato") extras.push("Mais em conta, sem perder o cuidado na escolha.");
  if (inBudget && extras.length === 0) extras.push(i % 2 ? "E cabe no orçamento que você informou." : "Está dentro do valor que você pretende gastar.");
  if (profile.avoid.trim() && i === 0) extras.push("Também levamos em conta o que você pediu para evitar.");
  return [...parts, ...extras].join(" ");
}

export async function getRecommendations(input: GiftProfile, previousIds: string[] = []): Promise<Recommendation[]> {
  const profile = { ...input, avoid: input.avoid === "__none__" ? "" : input.avoid };
  const catalog = await getCatalog();
  const budget = BUDGETS.find((b) => b.label === profile.budget) ?? BUDGETS[2]!;
  let { min, max } = budget;
  if (profile.refinement === "Mais barato") { max = Math.max(50, max === Infinity ? min : max * 0.7); min = 0; }
  const interests = extractInterests(`${profile.description} `);
  const previous = new Set(previousIds);

  const ranked = catalog.filter((p) => !avoidMatch(p, profile.avoid))
    .filter((p) => p.price <= (max === Infinity ? Infinity : max * 1.25))
    .map((p) => ({ p, ...score(p, profile, interests, min, max, previous) }))
    .sort((a, b) => b.s - a.s);

  if (ranked.length < 5) return [];
  return ranked.slice(0, 5).map(({ p, s, matched }, i) => ({
    product: p,
    matchScore: s,
    reason: buildReason(p, profile, matched, p.price >= min && p.price <= max, i),
  }));
}
