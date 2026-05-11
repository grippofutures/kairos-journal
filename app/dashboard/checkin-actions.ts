"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MOODS = [
  "calm",
  "confident",
  "hesitant",
  "rushed",
  "revenge",
  "fomo",
  "blank",
] as const;

function pickMood(v: string): string | null {
  if (!v) return null;
  return (MOODS as readonly string[]).includes(v) ? v : null;
}

/**
 * Upsert today's check-in. The form posts a `stage` field — "pre" or "post" —
 * to scope which subset of fields it's writing. We only patch those fields,
 * preserving anything already saved.
 */
export async function upsertCheckIn(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => {
    const v = get(k);
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const today = new Date().toISOString().slice(0, 10);
  const stage = get("stage");

  // Build the update payload. Only the relevant fields for the stage are set.
  type CheckInPatch = {
    user_id: string;
    check_in_date: string;
    pre_market_mood?: string | null;
    energy_level?: number | null;
    sleep_hours?: number | null;
    pre_market_note?: string | null;
    post_market_mood?: string | null;
    reflection?: string | null;
  };

  const payload: CheckInPatch = {
    user_id: user.id,
    check_in_date: today,
  };

  if (stage === "pre") {
    payload.pre_market_mood = pickMood(get("pre_market_mood"));
    payload.energy_level = num("energy_level");
    payload.sleep_hours = num("sleep_hours");
    payload.pre_market_note = get("pre_market_note") || null;
  } else if (stage === "post") {
    payload.post_market_mood = pickMood(get("post_market_mood"));
    payload.reflection = get("reflection") || null;
  } else {
    throw new Error("Missing or invalid stage");
  }

  const { error } = await supabase
    .from("daily_checkins")
    .upsert(payload, { onConflict: "user_id,check_in_date" });

  if (error) throw error;
  revalidatePath("/dashboard");
}
