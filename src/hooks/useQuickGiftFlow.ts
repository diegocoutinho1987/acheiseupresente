import { useCallback, useRef, useState } from "react";
import type { GiftProfile, Recommendation, Refinement } from "@/types";
import { getRecommendations } from "@/services/recommendationService";
import { getActiveTaxonomyOptions } from "@/services/taxonomyService";
import { track } from "@/services/analytics";
import { getQuickSuggestion, type QuickSuggestionKey } from "@/data/quickSuggestions";

const QUICK_LIMIT = 6;

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const EMPTY_STRUCTURED_PROFILE = {
  interests: [],
  traits: [],
  lifestyle: [],
  giftPreferences: [],
  avoid: [],
};

export function useQuickGiftFlow(key: QuickSuggestionKey | undefined) {
  const suggestion = key ? getQuickSuggestion(key) : null;
  const [phase, setPhase] = useState<"idle" | "loading" | "results" | "error">("idle");
  const [profile, setProfile] = useState<GiftProfile | null>(null);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState(false);
  const seen = useRef<string[]>([]);
  const started = useRef(false);

  const buildProfile = useCallback(async (): Promise<GiftProfile> => {
    if (!suggestion) throw new Error("Busca rápida inválida");
    const [profiles, occasions] = await Promise.all([
      getActiveTaxonomyOptions("profiles"),
      getActiveTaxonomyOptions("occasions"),
    ]);
    const profileOption = suggestion.profileName
      ? profiles.find((item) => normalize(item.name) === normalize(suggestion.profileName))
      : undefined;
    const occasionOption = suggestion.occasionName
      ? occasions.find((item) => normalize(item.name) === normalize(suggestion.occasionName))
      : undefined;

    return {
      recipient: profileOption?.name ?? "",
      recipientText: "",
      recipientId: profileOption?.id ?? null,
      occasion: occasionOption?.name ?? suggestion.occasionName ?? "",
      occasionText: "",
      occasionId: occasionOption?.id ?? null,
      budget: "Qualquer valor",
      description: suggestion.label,
      avoid: "",
      refinement: "" as Refinement,
      feedback: [],
      structuredProfile: EMPTY_STRUCTURED_PROFILE,
      quickContext: { key: suggestion.key, label: suggestion.label, terms: suggestion.terms },
    };
  }, [suggestion]);

  const run = useCallback(async (nextProfile: GiftProfile, isRefinement: boolean) => {
    setPhase("loading");
    setError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const result = await getRecommendations(nextProfile, seen.current, QUICK_LIMIT);
      if (!result.recommendations.length) {
        setError(true);
        setPhase("error");
        return;
      }
      setProfile(result.profile);
      setResults(result.recommendations);
      seen.current = [...seen.current, ...result.recommendations.map((item) => item.product.id)];
      setPhase("results");
      track("quick_recommendation_generated", {
        key: nextProfile.quickContext?.key,
        label: nextProfile.quickContext?.label,
        count: result.recommendations.length,
        productIds: result.recommendations.map((item) => item.product.id),
        refinement: nextProfile.refinement,
        feedback: nextProfile.feedback,
        stage: isRefinement ? "refinement" : "initial",
      });
    } catch {
      setError(true);
      setPhase("error");
    }
  }, []);

  const start = useCallback(async () => {
    if (!suggestion || started.current) return;
    started.current = true;
    track("quick_suggestion_clicked", { key: suggestion.key, label: suggestion.label });
    seen.current = [];
    setPhase("loading");
    try {
      const nextProfile = await buildProfile();
      setProfile(nextProfile);
      await run(nextProfile, false);
    } catch {
      setError(true);
      setPhase("error");
    }
  }, [buildProfile, run, suggestion]);

  const refine = useCallback((refinement: Refinement) => {
    if (!profile || feedbackLoading) return;
    track("refinement_clicked", { refinement, source: "quick_suggestion", key: profile.quickContext?.key });
    const nextProfile = { ...profile, refinement };
    setProfile(nextProfile);
    void run(nextProfile, true);
  }, [feedbackLoading, profile, run]);

  const addFeedback = useCallback(async (items: string[]) => {
    if (!profile || feedbackLoading || items.length === 0) return;
    setFeedbackLoading(true);
    const presentedIds = results.map((item) => item.product.id);
    const nextProfile = { ...profile, feedback: [...profile.feedback, ...items], refinement: "" as Refinement };
    setProfile(nextProfile);
    track("feedback_submitted", {
      feedback: items,
      productIds: presentedIds,
      recommendationIds: presentedIds,
      source: "quick_suggestion",
      quickSuggestion: profile.quickContext?.key,
    });
    try {
      await run(nextProfile, true);
    } finally {
      setFeedbackLoading(false);
    }
  }, [feedbackLoading, profile, results, run]);

  return {
    suggestion,
    phase,
    profile,
    results,
    feedbackLoading,
    error,
    start,
    refine,
    addFeedback,
  };
}
