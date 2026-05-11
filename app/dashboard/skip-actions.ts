"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggle today's "skipped" state — explicit "I'm sitting out today."
 * Form posts `skip` = "true" | "false".
 *
 * Streak treats this as neutral (same as no trades). Mentor sees the flag as
 * an intentional discipline action.
 */
export async function toggleSkipDay(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const skip = String(formData.get("skip") ?? "") === "true";

  const { error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: user.id,
        check_in_date: today,
        skipped_day: skip,
      },
      { onConflict: "user_id,check_in_date" },
    );

  if (error) throw error;
  revalidatePath("/dashboard");
}
