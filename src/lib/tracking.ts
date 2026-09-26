import { supabase } from "@/integrations/supabase/client";

const KEY = "gift_session_id";

export async function getSessionId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;

  const { data, error } = await supabase.from("sessions").insert({}).select("id").single();
  if (error || !data) return null;
  window.localStorage.setItem(KEY, data.id);
  return data.id;
}

export async function trackEvent(event_name: string, payload: Record<string, unknown> = {}) {
  try {
    const session_id = await getSessionId();
    await supabase.from("events").insert({ session_id, event_name, payload: payload as never });
  } catch {
    // tracking must never break the UX
  }
}
