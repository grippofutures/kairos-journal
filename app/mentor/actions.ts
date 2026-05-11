"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireMentor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "mentor") redirect("/dashboard");
  return { supabase, user };
}

function safeRevalidate(returnTo: string) {
  // Whitelist: only allow paths under /mentor and /dashboard.
  if (
    typeof returnTo === "string" &&
    (returnTo.startsWith("/mentor") || returnTo.startsWith("/dashboard"))
  ) {
    revalidatePath(returnTo);
  }
}

export async function postComment(formData: FormData) {
  const { supabase, user } = await requireMentor();
  const tradeId = String(formData.get("trade_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "");

  if (!tradeId) throw new Error("Missing trade id");
  if (!body) throw new Error("Comment is empty");
  if (body.length > 2000) throw new Error("Comment too long (max 2000 chars)");

  const { error } = await supabase.from("trade_comments").insert({
    trade_id: tradeId,
    author_id: user.id,
    body,
  });
  if (error) throw error;

  safeRevalidate(returnTo);
}

export async function deleteComment(formData: FormData) {
  const { supabase } = await requireMentor();
  const id = String(formData.get("comment_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "");

  if (!id) return;
  await supabase.from("trade_comments").delete().eq("id", id);

  safeRevalidate(returnTo);
}

export async function markReviewed(formData: FormData) {
  const { supabase, user } = await requireMentor();
  const tradeId = String(formData.get("trade_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "");

  if (!tradeId) return;
  const { error } = await supabase
    .from("trades")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", tradeId);
  if (error) throw error;

  safeRevalidate(returnTo);
}

export async function unmarkReviewed(formData: FormData) {
  const { supabase } = await requireMentor();
  const tradeId = String(formData.get("trade_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "");

  if (!tradeId) return;
  const { error } = await supabase
    .from("trades")
    .update({ reviewed_at: null, reviewed_by: null })
    .eq("id", tradeId);
  if (error) throw error;

  safeRevalidate(returnTo);
}

/**
 * Permanently remove a student and all their journal data.
 *
 * Validates:
 *   - Caller is a mentor
 *   - Target is a student (cannot remove other mentors via this action)
 *   - The typed email matches the student's actual email (two-step confirm)
 *
 * Deletes:
 *   - All screenshot files from storage
 *   - Daily check-ins
 *   - Trades (cascade-deletes trade_comments via FK)
 *   - Profile row
 *
 * Does NOT delete:
 *   - auth.users row (requires service-role key, which the app doesn't have).
 *     The student can re-sign-in via Discord if still in the Kairos guild.
 *     To prevent that, remove them from Discord first.
 */
export async function removeStudent(formData: FormData) {
  const { supabase } = await requireMentor();

  const userId = String(formData.get("user_id") ?? "");
  const typedEmail = String(formData.get("typed_email") ?? "").trim();

  if (!userId) throw new Error("Missing student id.");
  if (!typedEmail) throw new Error("Type the student's email to confirm.");

  // Verify the target exists and is a student
  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", userId)
    .single();

  if (targetErr || !target) throw new Error("Student not found.");
  if (target.role !== "student") {
    throw new Error("Can only remove accounts with the 'student' role.");
  }
  if (typedEmail.toLowerCase() !== target.email.toLowerCase()) {
    throw new Error("Email confirmation does not match. Try again.");
  }

  // 1. Collect screenshot paths and delete them from storage
  const { data: screenshotTrades } = await supabase
    .from("trades")
    .select("screenshot_path")
    .eq("user_id", userId)
    .not("screenshot_path", "is", null);

  const paths = (screenshotTrades ?? [])
    .map((t) => t.screenshot_path as string | null)
    .filter((p): p is string => !!p);

  if (paths.length > 0) {
    await supabase.storage.from("screenshots").remove(paths);
  }

  // 2. Delete daily check-ins
  const { error: checkinsErr } = await supabase
    .from("daily_checkins")
    .delete()
    .eq("user_id", userId);
  if (checkinsErr) throw new Error(`check-ins delete: ${checkinsErr.message}`);

  // 3. Delete trades (trade_comments cascade via FK)
  const { error: tradesErr } = await supabase
    .from("trades")
    .delete()
    .eq("user_id", userId);
  if (tradesErr) throw new Error(`trades delete: ${tradesErr.message}`);

  // 4. Delete profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profileErr) throw new Error(`profile delete: ${profileErr.message}`);

  // Redirect to the cohort page — student is gone
  redirect("/mentor");
}
