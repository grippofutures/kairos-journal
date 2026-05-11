# Phase 1 Test Plan — Discord OAuth

Run every test before declaring Phase 1 done. Realistically takes 10 minutes if you have a second test Discord account; longer if you have to ask a student to help.

## Preconditions

- [ ] Followed `SETUP-DISCORD-AUTH.md` end to end with no errors
- [ ] `npm run dev` is running on port 3000
- [ ] You have access to: your real Discord (with OWNER role), Sam's account or a student's, and ideally a Discord account that's NOT in your server

---

## Tests

### 1. Mentor sign-in (you)

- [ ] Visit [http://localhost:3000](http://localhost:3000)
- [ ] You're redirected to `/login`
- [ ] The login page shows a single "Sign in with Discord" button (no email field)
- [ ] Click "Sign in with Discord"
- [ ] Discord OAuth screen appears — it lists scopes including "Read your member info in selected servers"
- [ ] Click **Authorize**
- [ ] You're redirected back and land on **`/mentor`**
- [ ] Open Supabase → Table Editor → `profiles` → find your row. Verify:
  - [ ] `role = mentor`
  - [ ] `discord_id` is populated (a long numeric string)
  - [ ] `discord_username` is your Discord username

### 2. Student sign-in (have a real student do this)

- [ ] Sign yourself out
- [ ] Have a student with `MENTORSHIP` or `Kairos - Group` role visit `/login` and sign in
- [ ] They land on **`/dashboard`** (the student journal page, not the mentor one)
- [ ] Their `profiles` row shows `role = student`

### 3. Negative path — not in the Kairos server

Use a Discord account that's not in your server (a personal alt, a friend's, etc.).

- [ ] Sign out
- [ ] Sign in with the outside account
- [ ] You land on `/login` with the message: **"You are not in the Kairos Discord server."**
- [ ] You cannot navigate past `/login` while signed out

### 4. Negative path — in server, no approved role

- [ ] Find or create a Discord account that's in your server but has *none* of the four approved roles
- [ ] Sign in with that account
- [ ] You land on `/login` with: **"Your Discord account has no mentorship role. Contact Garrett to be added."**

### 5. Magic link is gone

- [ ] On `/login`, confirm there is no email input field
- [ ] No "Send the link" button anywhere
- [ ] Only the Discord button

### 6. Session persistence

- [ ] After a successful sign-in, refresh the page → still signed in
- [ ] Close the browser, reopen, visit `/` → still signed in (Supabase cookie session)
- [ ] Wait a few minutes, click around → still signed in

### 7. Sign out

- [ ] Trigger sign-out (the existing `signOut()` action — wherever the app exposes it)
- [ ] You land on `/login`
- [ ] Visiting `/` redirects you back to `/login`

### 8. Existing data preserved

If you had any students from the magic-link era:

- [ ] Their `trades` rows are still intact in Supabase
- [ ] When they sign in via Discord with the same email, they're matched to their existing profile (Supabase merges by email)
- [ ] Their existing trades show up on `/dashboard`

---

## Common issues + fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| "Invalid OAuth scopes" or instant redirect to login with no message | Missing `guilds.members.read` scope | Supabase → Auth → Providers → Discord → "Additional Scopes" must contain `identify guilds.members.read` |
| "Redirect URI mismatch" | Discord redirect ≠ Supabase callback URL | Discord Developer Portal → OAuth2 → Redirects must contain exactly `https://<your-ref>.supabase.co/auth/v1/callback` |
| Stuck on Discord auth screen | Wrong Client ID/Secret in Supabase | Supabase → Auth → Providers → Discord — re-paste both. The Client ID is `1503133937558491146` |
| Sign-in works but role is null | Profile update failed silently | Check browser Network tab for `/auth/callback` errors. Check Supabase logs. Most often: typo in role IDs in `lib/config/discord.ts` |
| Real student gets "no mentorship role" error | Their Discord role isn't one of the four in `lib/config/discord.ts`, or role IDs in code are stale | Verify the student actually has `MENTORSHIP` or `Kairos - Group` in your Discord server. If yes, re-copy role IDs and update `lib/config/discord.ts` |
| Get bounced to login immediately after a successful Discord auth | RLS denying profile read | The `profiles_self_read` policy should already exist. Re-run `supabase/schema.sql` if profiles RLS is off |

---

## When all tests pass

You're ready for Phase 2 (streak + daily emotions). Tell me and I'll start.
