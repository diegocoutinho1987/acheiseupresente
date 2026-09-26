import { supabase } from "@/integrations/supabase/client";

const KEY = "gift_session_id";

export async function getSessionId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const { error } = await supabase.from("sessions").insert({ id });
  if (error) return null;
  window.localStorage.setItem(KEY, id);
  return id;
}

export async function trackEvent(event_name: string, payload: Record<string, unknown> = {}) {
  try {
    const session_id = await getSessionId();
    await supabase.from("events").insert({ session_id, event_name, payload: payload as never });
  } catch {
    // tracking must never break the UX
  }
}
