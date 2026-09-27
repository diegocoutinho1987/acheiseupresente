import { supabase } from "@/integrations/supabase/client";

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
  | "recommendation_refined"
  | "refinement_completed"
  | "feedback_submitted"
  | "quick_suggestion_viewed"
  | "quick_suggestion_clicked"
  | "quick_recommendation_generated";

export type ClickSource = "recommendation" | "refinement";

const SESSION_KEY = "gift-session-id";
let sessionReady: Promise<string | null> | null = null;

export function getRecommendationSessionId(): string | null {
  return getSessionId();
}

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const current = window.sessionStorage.getItem(SESSION_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

async function ensureSession(): Promise<string | null> {
  if (sessionReady) return sessionReady;
  sessionReady = (async () => {
    const id = getSessionId();
    if (!id) return null;
    const { error } = await supabase.from("sessions").insert({ id });
    if (error && error.code !== "23505") return null;
    return id;
  })();
  return sessionReady;
}

export function track(event: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  void ensureSession().then((sessionId) => supabase.from("events").insert({
    event_name: event,
    payload: JSON.parse(JSON.stringify(payload)),
    session_id: sessionId,
  })).catch(() => undefined);
}

export async function registerProductClick(productId: string, source: ClickSource): Promise<void> {
  const sessionId = await ensureSession();
  await Promise.allSettled([
    supabase.from("product_clicks").insert({ product_id: productId, source, session_id: sessionId }),
    supabase.from("events").insert({ event_name: "product_clicked", payload: { productId, source }, session_id: sessionId }),
  ]);
}

export type ClickMetrics = {
  total: number;
  last7Days: number;
  byProduct: Record<string, number>;
};

export async function getClickMetrics(): Promise<ClickMetrics> {
  const { data, error } = await supabase.from("product_clicks").select("product_id, created_at");
  if (error) throw error;
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const byProduct: Record<string, number> = {};
  let last7Days = 0;
  for (const click of data) {
    byProduct[click.product_id] = (byProduct[click.product_id] ?? 0) + 1;
    if (new Date(click.created_at).getTime() >= since) last7Days += 1;
  }
  return { total: data.length, last7Days, byProduct };
}
