/**
 * Discord OAuth + role gate configuration.
 *
 * These IDs come from the Kairos Discord server. To rotate them:
 * Server Settings → Roles → right-click → Copy Role ID.
 *
 * Mentor takes precedence over student if a user has both.
 */

export const DISCORD_GUILD_ID = "1498086178409418762"; // Kairos server

const STUDENT_ROLE_IDS = [
  "1498086647731060866", // MENTORSHIP
  "1503129417528901752", // Kairos - Group
] as const;

const MENTOR_ROLE_IDS = [
  "1498086643092033632", // OWNER
  "1498089920882020423", // Instructor
] as const;

export type AppRole = "student" | "mentor";

/**
 * Map a user's Discord role IDs → app role.
 * Returns null when the user has no approved roles (access denied).
 */
export function resolveAppRole(discordRoleIds: readonly string[]): AppRole | null {
  const ids = new Set(discordRoleIds);
  if (MENTOR_ROLE_IDS.some((r) => ids.has(r))) return "mentor";
  if (STUDENT_ROLE_IDS.some((r) => ids.has(r))) return "student";
  return null;
}
