export type AnalyticsEvent =
  | "home_view"
  | "generator_started"
  | "recipient_selected"
  | "occasion_selected"
  | "budget_selected"
  | "profile_submitted"
  | "recommendation_generated"
  | "product_clicked"
  | "refinement_clicked"
  | "refinement_completed"
  | "feedback_submitted";

/** Mock: substituir por envio ao backend futuramente. */
export function track(event: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.info("[analytics]", event, payload);
}
