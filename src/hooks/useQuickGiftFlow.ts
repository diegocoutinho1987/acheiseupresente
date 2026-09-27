import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GiftProfile, Recommendation, Refinement } from "@/types";
import { track } from "@/services/analytics";
import { getQuickSuggestion, type QuickSuggestionKey } from "@/data/quickSuggestions";
import {
  createQuickSuggestionContext,
  getQuickSuggestions,
  type QuickSuggestionContext,
} from "@/services/quickSuggestionService";

const EMPTY_STRUCTURED_PROFILE = { interests: [], traits: [], lifestyle: [], giftPreferences: [], avoid: [] };

function buildProfile(context: QuickSuggestionContext): GiftProfile {
  return {
    recipient: context.type === "profile" ? context.profileName : context.type === "generic" ? context.label : "",
    recipientText: "",
    recipientId: context.type === "profile" ? null : null,
    occasion: context.type === "occasion" ? context.occasionName : "",
    occasionText: "",
    occasionId: null,
    budget: "Qualquer valor",
    description: context.label,
    avoid: "",
    refinement: "" as Refinement,
    feedback: [],
    structuredProfile: EMPTY_STRUCTURED_PROFILE,
    quickContext: { key: context.key, label: context.label, terms: [] },
  };
}

export function useQuickGiftFlow(key: QuickSuggestionKey | undefined) {
  const suggestion = useMemo(() => (key ? getQuickSuggestion(key) : null), [key]);
  const [phase, setPhase] = useState<"idle" | "loading" | "results" | "error">("idle");
  const [profile, setProfile] = useState<GiftProfile | null>(null);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState<"load" | "empty" | null>(null);
  const [context, setContext] = useState<QuickSuggestionContext | null>(null);
  const started = useRef(false);
  const currentKey = useRef<QuickSuggestionKey | undefined>(key);

  useEffect(() => {
    if (currentKey.current === key) return;
    currentKey.current = key;
    started.current = false;
    setPhase("idle");
    setProfile(null);
    setResults([]);
    setContext(null);
    setError(null);
  }, [key]);

  const run = useCallback(async (nextContext: QuickSuggestionContext, nextProfile: GiftProfile) => {
    setPhase("loading");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const recommendations = await getQuickSuggestions(nextContext);

      if (recommendations.length === 0) {
        setContext(nextContext);
        setProfile(nextProfile);
        setResults([]);
        setPhase("error");
        setError("empty");
        return;
      }

      setContext(nextContext);
      setProfile(nextProfile);
      setResults(recommendations);
      setPhase("results");

      track("quick_recommendation_generated", {
        key: nextContext.key,
        label: nextContext.label,
        count: recommendations.length,
        productIds: recommendations.map((item) => item.product.id),
        stage: nextProfile.feedback.length ? "feedback" : "initial",
      });
    } catch (error) {
      console.error("[quick-suggestions] Falha ao carregar sugestões rápidas", error);
      setPhase("error");
      setError("load");
    } finally {
      setPhase((currentPhase) => (currentPhase === "loading" ? "error" : currentPhase));
    }
  }, []);

  const start = useCallback(async () => {
    if (!suggestion || started.current) return;

    started.current = true;
    track("quick_suggestion_clicked", { key: suggestion.key, label: suggestion.label });
    setPhase("loading");
    setError(null);

    try {
      const nextContext = createQuickSuggestionContext(suggestion);
      const nextProfile = buildProfile(nextContext);
      setContext(nextContext);
      setProfile(nextProfile);
      await run(nextContext, nextProfile);
    } catch (error) {
      console.error("[quick-suggestions] Falha ao iniciar sugestão rápida", error);
      setPhase("error");
      setError("load");
    } finally {
      setPhase((currentPhase) => (currentPhase === "loading" ? "error" : currentPhase));
    }
  }, [run, suggestion]);

  const retry = useCallback(() => {
    if (!suggestion) return;
    started.current = false;
    void start();
  }, [start, suggestion]);

  const addFeedback = useCallback(async (items: string[]) => {
    if (!profile || !context || feedbackLoading || items.length === 0) return;

    setFeedbackLoading(true);
    const presentedIds = results.map((item) => item.product.id);
    const nextProfile = { ...profile, feedback: [...profile.feedback, ...items], refinement: "" as Refinement };
    const nextContext: QuickSuggestionContext = { ...context, excludeIds: presentedIds };

    track("feedback_submitted", {
      feedback: items,
      productIds: presentedIds,
      recommendationIds: presentedIds,
      source: "quick_suggestion",
      quickSuggestion: context.key,
    });

    try {
      await run(nextContext, nextProfile);
    } finally {
      setFeedbackLoading(false);
    }
  }, [context, feedbackLoading, profile, results, run]);

  return { suggestion, phase, profile, results, feedbackLoading, error, start, retry, addFeedback };
}
