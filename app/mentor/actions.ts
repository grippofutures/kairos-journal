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
