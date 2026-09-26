import { useCallback, useRef, useState } from "react";
import { emptyProfile, type GiftProfile, type Recommendation, type Refinement } from "@/types";
import { getRecommendations } from "@/services/recommendationService";
import { track } from "@/services/analytics";

export type Phase = "questions" | "loading" | "results" | "error";
export type GiftFlowError = "empty" | "load" | null;
export const TOTAL_STEPS = 5;
const MIN_LOADING_MS = 4200;

export function useGiftFlow() {
  const [profile, setProfile] = useState<GiftProfile>(emptyProfile);
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<Phase>("questions");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [error, setError] = useState<GiftFlowError>(null);
  const seen = useRef<string[]>([]);

  const update = useCallback((patch: Partial<GiftProfile>) => setProfile((p) => ({ ...p, ...patch })), []);

  const run = useCallback(async (p: GiftProfile, isRefinement: boolean) => {
    setPhase("loading");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const minWait = new Promise((r) => setTimeout(r, isRefinement ? 2200 : MIN_LOADING_MS));
    try {
      const [recs] = await Promise.all([getRecommendations(p, seen.current), minWait]);
      if (recs.length === 0) { setError("empty"); setPhase("error"); return; }
      seen.current = [...seen.current, ...recs.map((r) => r.product.id)];
      setResults(recs);
      setPhase("results");
      track(isRefinement ? "refinement_completed" : "recommendation_generated", { refinement: p.refinement, ids: recs.map((r) => r.product.id) });
    } catch {
      await minWait;
      setError("load");
      setPhase("error");
    }
  }, []);

  const submit = useCallback(() => {
    track("profile_submitted", { recipient: profile.recipient, occasion: profile.occasion, budget: profile.budget });
    seen.current = [];
    const p = { ...profile, refinement: "" as Refinement };
    setProfile(p);
    run(p, false);
  }, [profile, run]);

  const refine = useCallback((r: Refinement) => {
    track("refinement_clicked", { refinement: r });
    const p = { ...profile, refinement: r };
    setProfile(p);
    run(p, true);
  }, [profile, run]);

  const addFeedback = useCallback((items: string[]) => {
    setProfile((p) => ({ ...p, feedback: [...p.feedback, ...items] }));
    track("feedback_submitted", { feedback: items });
  }, []);

  const retry = useCallback(() => run(profile, profile.refinement !== ""), [profile, run]);
  const editAnswers = useCallback(() => { setStep(1); setPhase("questions"); }, []);

  return { profile, update, step, setStep, phase, error, results, submit, refine, addFeedback, retry, editAnswers };
}
