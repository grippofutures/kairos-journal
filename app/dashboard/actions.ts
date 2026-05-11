"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTrade(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => {
    const v = get(k);
    return v === "" ? null : Number(v);
  };
  const bool = (k: string) => formData.get(k) === "on";

  const traded_at = get("traded_at");
  const instrument = get("instrument").toUpperCase();
  const direction = get("direction") as "long" | "short";
  const contracts = num("contracts");
  const pnl = num("pnl");
  const r_multiple = num("r_multiple");
  const setup_tag = get("setup_tag") || null;
  const outcome = get("outcome") as "win" | "loss" | "breakeven";
  const notes = get("notes") || null;
  const emotion_tag = get("emotion_tag") || null;
  const screenshot_path = get("screenshot_path") || null;
  const thesis = get("thesis");
  const followed_model = bool("followed_model");

  if (
    !traded_at || !instrument || !direction ||
    contracts == null || pnl == null || !outcome
  ) {
    throw new Error("Missing required fields");
  }
  if (!thesis || thesis.length < 20) {
    throw new Error("Trade thesis is required (min 20 characters).");
  }

  const { error } = await supabase.from("trades").insert({
    user_id: user.id,
    traded_at: new Date(traded_at).toISOString(),
    instrument,
    direction,
    contracts,
    pnl,
    r_multiple,
    setup_tag,
    outcome,
    notes,
    emotion_tag,
    screenshot_path,
    thesis,
    followed_model,
    // Mirror followed_model onto the four legacy criteria booleans so any
    // existing analytics that read criteria_* still get coherent values.
    criteria_profile: followed_model,
    criteria_signature: followed_model,
    criteria_trigger: followed_model,
    criteria_targets: followed_model,
  });

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteTrade(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: trade } = await supabase
    .from("trades")
    .select("screenshot_path")
    .eq("id", id)
    .single();

  if (trade?.screenshot_path) {
    await supabase.storage.from("screenshots").remove([trade.screenshot_path]);
  }
  await supabase.from("trades").delete().eq("id", id);
  revalidatePath("/dashboard");
}
