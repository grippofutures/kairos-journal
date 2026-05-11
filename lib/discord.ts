/**
 * Server-side Discord API helpers used by the auth callback.
 * Only called from server contexts; never exposes the OAuth provider token to the client.
 */

import { DISCORD_GUILD_ID } from "./config/discord";

const DISCORD_API_BASE = "https://discord.com/api/v10";

export type DiscordMemberCheck =
  | {
      ok: true;
      roleIds: string[];
      username: string;
      discordId: string;
    }
  | {
      ok: false;
      reason: "no_token" | "not_in_guild" | "discord_error";
      detail?: string;
    };

/**
 * Verify the user is in the Kairos guild and return their role IDs.
 * Requires the OAuth scope `guilds.members.read` (configured in Supabase Discord provider).
 */
export async function fetchDiscordMember(
  providerToken: string | null | undefined,
): Promise<DiscordMemberCheck> {
  if (!providerToken) return { ok: false, reason: "no_token" };

  // 1. Identify the user
  const meRes = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${providerToken}` },
    cache: "no-store",
  });
  if (!meRes.ok) {
    return {
      ok: false,
      reason: "discord_error",
      detail: `users/@me ${meRes.status}`,
    };
  }
  const me = (await meRes.json()) as { id: string; username: string };

  // 2. Look up member info in the Kairos guild
  const memberRes = await fetch(
    `${DISCORD_API_BASE}/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
    {
      headers: { Authorization: `Bearer ${providerToken}` },
      cache: "no-store",
    },
  );

  if (memberRes.status === 404) {
    return { ok: false, reason: "not_in_guild" };
  }
  if (!memberRes.ok) {
    return {
      ok: false,
      reason: "discord_error",
      detail: `members ${memberRes.status}`,
    };
  }

  const member = (await memberRes.json()) as { roles: string[] };

  return {
    ok: true,
    roleIds: member.roles ?? [],
    username: me.username,
    discordId: me.id,
  };
}
