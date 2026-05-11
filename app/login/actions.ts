"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Start the Discord OAuth flow via Supabase.
 * Supabase orchestrates the OAuth dance with Discord, then redirects to /auth/callback,
 * where we verify Kairos guild membership and map roles.
 */
export async function signInWithDiscord() {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      // The default Discord provider in Supabase requests `identify email`.
      // We additionally need `guilds.members.read` to verify Kairos membership.
      scopes: "identify guilds.members.read",
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
  redirect("/login?error=Discord%20OAuth%20failed%20to%20initialize");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
