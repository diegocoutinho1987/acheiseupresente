import { describe, expect, it } from "vitest";
import type { GiftProfile, Product, Refinement } from "@/types";
import { matchesAvoidTerms, rankProducts } from "./recommendationEngine";

const product = (overrides: Partial<Product> & Pick<Product, "id" | "name">): Product => ({
  description: "Produto para presente",
  price: 150,
  store: "Loja Teste",
  image: "https://example.com/image.jpg",
  url: "https://example.com/product",
  category: "casa",
  tags: [],
  occasions: [],
  profiles: [],
  active: true,
  ...overrides,
});

const profile = (overrides: Partial<GiftProfile> = {}): GiftProfile => ({
  recipient: "Irmão(ã)",
  occasion: "Aniversário",
  budget: "R$100 a R$200",
  description: "Ele gosta de tecnologia, programação e café.",
  avoid: "",
  refinement: "",
  feedback: [],
  ...overrides,
});

const catalog: Product[] = [
  product({ id: "tech", name: "Caneca tech", category: "tecnologia", tags: ["tecnologia", "programação", "café", "útil"], occasions: ["aniversário"], profiles: ["irmão"], price: 160 }),
  product({ id: "home", name: "Item de cozinha", category: "cozinha", tags: ["casa", "cozinha", "prático"], occasions: ["dia das mães"], profiles: ["mãe"], price: 80 }),
  product({ id: "shirt", name: "Camiseta", category: "moda", tags: ["roupas"], price: 120 }),
  product({ id: "creative", name: "Oficina", category: "experiência", tags: ["criativo", "original", "experiência"], price: 180 }),
  product({ id: "cheap", name: "Lembrança", category: "personalizado", tags: ["pessoal"], price: 30 }),
  product({ id: "inactive", name: "Produto inativo", category: "tecnologia", tags: ["tecnologia", "café"], active: false, price: 150 }),
];

describe("motor determinístico de recomendações", () => {
  it("prioriza tecnologia e café para irmão no aniversário", () => {
    expect(rankProducts(catalog, profile())[0]?.product.id).toBe("tech");
  });

  it("prioriza casa e cozinha para mãe no Dia das Mães", () => {
    const result = rankProducts(catalog, profile({ recipient: "Mãe", occasion: "Dia das Mães", budget: "R$50 a R$100", description: "Ela gosta de casa e cozinha." }));
    expect(result[0]?.product.id).toBe("home");
  });

  it("exclui termos informados e produtos inativos", () => {
    expect(matchesAvoidTerms(catalog[2]!, "Não quero roupas.")).toBe(true);
    const ids = rankProducts(catalog, profile({ avoid: "Não quero roupas." })).map((item) => item.product.id);
    expect(ids).not.toContain("shirt");
    expect(ids).not.toContain("inactive");
  });

  it("retorna menos de cinco e pode retornar vazio sem inventar produtos", () => {
    expect(rankProducts([catalog[0]!, catalog[1]!], profile())).toHaveLength(2);
    expect(rankProducts(catalog, profile({ budget: "Até R$50", avoid: "roupas lembrança" }))).toHaveLength(0);
  });

  it.each([
    ["Mais barato", "cheap"],
    ["Mais criativo", "creative"],
    ["Mais útil", "tech"],
    ["Mais pessoal", "creative"],
  ] as const)("faz o refinamento %s influenciar o topo", (refinement: Refinement, expected: string) => {
    expect(rankProducts(catalog, profile({ budget: "R$200 a R$500", description: "Pessoa de gostos variados.", refinement }))[0]?.product.id).toBe(expected);
  });

  it("evita repetir imediatamente no pedido por outras opções", () => {
    const first = [rankProducts(catalog, profile())[0]?.product.id ?? ""];
    const next = rankProducts(catalog, profile({ refinement: "Quero outras opções" }), first);
    expect(next[0]?.product.id).not.toBe(first[0]);
  });

  it("diversifica categorias e explica apenas motivos computados", () => {
    const result = rankProducts(catalog, profile());
    expect(new Set(result.map((item) => item.product.category)).size).toBeGreaterThan(1);
    expect(result[0]?.explanation).toContain("orçamento");
    expect(result[0]?.score).toBeGreaterThan(0);
  });
});