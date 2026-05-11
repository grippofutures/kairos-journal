import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchDiscordMember } from "@/lib/discord";
import { resolveAppRole } from "@/lib/config/discord";

/**
 * OAuth callback. Three jobs in order:
 *   1. Exchange the Supabase code for a session.
 *   2. Use the Discord provider token to verify Kairos guild membership + role.
 *   3. Persist the resolved role + Discord identity onto profiles.
 *
 * Any failure → sign out + redirect to /login with a human-readable error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const failTo = (msg: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);

  if (!code) {
    return failTo("Missing auth code.");
  }

  const supabase = await createClient();

  // 1. Exchange the code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return failTo(`Sign-in failed: ${exchangeError.message}`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || !session.provider_token) {
    await supabase.auth.signOut();
    return failTo("No Discord token returned. Sign in again.");
  }

  // 2. Verify guild + role membership
  const check = await fetchDiscordMember(session.provider_token);
  if (!check.ok) {
    await supabase.auth.signOut();
    if (check.reason === "not_in_guild") {
      return failTo("You are not in the Kairos Discord server.");
    }
    if (check.reason === "no_token") {
      return failTo("No Discord token returned. Sign in again.");
    }
    return failTo("Discord verification failed. Try again.");
  }

  const appRole = resolveAppRole(check.roleIds);
  if (!appRole) {
    await supabase.auth.signOut();
    return failTo(
      "Your Discord account has no mentorship role. Contact Garrett to be added.",
    );
  }

  // 3. Persist role + Discord identity
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role: appRole,
      discord_id: check.discordId,
      discord_username: check.username,
    })
    .eq("id", session.user.id);

  if (updateError) {
    // Don't block sign-in for a transient profile update failure;
    // role check passed and the trigger has already created a 'student' profile row.
    console.error("[auth/callback] profile update failed:", updateError);
  }

  return NextResponse.redirect(`${origin}/`);
}
