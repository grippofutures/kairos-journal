# Setup — Discord Sign-In, From Zero

Total time: ~20 minutes if you've never touched Supabase. We'll do it together step by step.

You will need:
- A web browser
- Discord (already signed in)
- A text editor (Notepad is fine on Windows)
- Command Prompt or PowerShell (Windows search → "cmd" or "powershell")

By the end, you'll be able to sign into the journal app with Discord, and only people with the right Kairos roles will get in.

---

# Part 1 — Make a Supabase account

Supabase = the database + login system the app uses. It's free for what we need.

1. Open a browser, go to **[supabase.com](https://supabase.com)**
2. Top-right corner: click **Start your project**
3. Sign up. The fastest way is **Continue with GitHub** if you have a GitHub account. Otherwise click **Continue with Email** and follow the steps.
4. Verify your email if Supabase sends a verification link.

✅ When done: you should land on a page that says "Welcome to Supabase" or shows an empty list of projects.

---

# Part 2 — Make a Supabase project

1. Click the green **New project** button
2. **Name** → type: `kairos-journal`
3. **Database Password** → click the **Generate a password** button. A long random password appears.
   - 🚨 **Copy this password and paste it into Notepad and SAVE IT.** You won't need it for the app, but Supabase will ask for it later if you ever need to reset things.
4. **Region** → pick the one closest to you. (For most US users: **East US (North Virginia)**.)
5. **Pricing Plan** → leave on **Free** (no credit card needed)
6. Click **Create new project**
7. ⏳ Wait 2–3 minutes. You'll see a spinning loader. Don't close the tab.

✅ When done: the page reloads and shows your new project's dashboard with a sidebar on the left.

---

# Part 3 — Copy your project credentials

These are the values that connect your local app to your Supabase database.

1. In the left sidebar, click **Project Settings** (gear icon ⚙️ near the bottom)
2. In the new sidebar that appears, click **API**
3. You'll see two sections you care about:
   - **Project URL** — looks like `https://abcdefghijklmn.supabase.co`
   - **Project API keys** — has a row labeled **anon public** with a long key
4. Open Notepad and write down:
   ```
   URL: <paste your Project URL here>
   ANON KEY: <click "Copy" next to "anon public" and paste here>
   ```
5. Save the Notepad file somewhere you'll find it again (Desktop is fine for now).

🚨 The **anon public** key is safe to use in your app. Don't worry about it being "public" — that's how it's designed.

---

# Part 4 — Set up the `.env.local` file in your project

This is the file that tells your local app where Supabase lives.

1. Open File Explorer
2. Navigate to: `C:\Users\HP\Downloads\Grippo Mentorship PDFs\CLAUDE CODE\trade-journal`
3. Look for a file called `.env.local.example`
   - 🚨 If you don't see files starting with a dot: View menu → check **Hidden items**
4. Right-click `.env.local.example` → **Copy**
5. Right-click in empty space → **Paste**. You now have `.env.local.example - Copy`
6. Right-click that copy → **Rename** → change it to exactly `.env.local`
   - The file name should be just `.env.local`. No `.example`. No `.txt`. No anything else.
7. Right-click `.env.local` → **Open with** → **Notepad**
8. You'll see three lines like this:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
9. Replace the values:
   - After `NEXT_PUBLIC_SUPABASE_URL=` → paste your Project URL from Part 3
   - After `NEXT_PUBLIC_SUPABASE_ANON_KEY=` → paste your anon public key from Part 3
   - Leave `NEXT_PUBLIC_SITE_URL=http://localhost:3000` exactly as-is
10. **No spaces around the `=` sign.** No quotes. Like this:
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi....very-long-string....
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    ```
11. **File → Save** in Notepad. Close Notepad.

✅ Done. Your local app now knows where Supabase is.

---

# Part 5 — Build the database

You'll run three SQL files in Supabase. Each one builds part of the database.

1. Go back to your Supabase project tab in the browser
2. Left sidebar → click **SQL Editor**
3. Click **+ New query** (top-right)

### Run file 1 of 3 — `schema.sql`

4. In your file explorer, open: `trade-journal/supabase/schema.sql`
5. Open it with Notepad
6. **Edit menu → Select All** (or `Ctrl+A`), then **Edit menu → Copy** (or `Ctrl+C`)
7. Switch back to the Supabase tab
8. Click in the big empty SQL editor area
9. Paste (`Ctrl+V`)
10. Bottom-right of the editor: click **Run** (or press `Ctrl+Enter`)
11. ⏳ Wait a few seconds. You should see a green message: **"Success. No rows returned"**

### Run file 2 of 3 — `migration_001_framework_fields.sql`

12. Click **+ New query** again to open a fresh editor
13. Open `trade-journal/supabase/migration_001_framework_fields.sql` in Notepad
14. Select all → copy → paste into Supabase → click **Run**
15. Wait for green success message

### Run file 3 of 3 — `migration_002_discord_auth.sql`

16. Click **+ New query**
17. Open `trade-journal/supabase/migration_002_discord_auth.sql` in Notepad
18. Select all → copy → paste into Supabase → click **Run**
19. Wait for green success message

✅ Done. Your database has all the tables.

🚨 If any of those gave a red error message, **stop and tell me the error**. Don't continue.

---

# Part 6 — Get your Discord Client Secret

1. Open new browser tab: [discord.com/developers/applications/1503133937558491146](https://discord.com/developers/applications/1503133937558491146)
2. Sign into Discord if it asks
3. Left sidebar of your app's settings: click **OAuth2**
4. Look for the **Client Information** section (near the top)
5. You'll see **Client Secret**:
   - If you see a **Reset Secret** button: click it, confirm. A new secret appears. Click **Copy**.
   - If you see a **Copy** button (already revealed): click **Copy**.
6. Paste the secret into your Notepad file from Part 3, label it `DISCORD CLIENT SECRET:`
7. **Save the Notepad file.**

🚨 **Never share this secret. Never paste it in chat. Never commit it to git.** It goes one place: Supabase, in the next step.

---

# Part 7 — Connect Discord and Supabase

This is the part with the most clicking. Take your time.

### 7a — Get the Supabase callback URL

1. Go back to your Supabase tab
2. Left sidebar → **Authentication**
3. Sub-menu (left): click **Providers**
4. Scroll down the list until you find **Discord** — click on the row to expand it
5. Above the toggle, you'll see a box labeled **Callback URL (for OAuth)** with a URL like:
   ```
   https://abcdefghij.supabase.co/auth/v1/callback
   ```
6. **Copy this URL.** Paste it into your Notepad file.

### 7b — Add that URL to Discord

7. Open new tab: [discord.com/developers/applications/1503133937558491146/oauth2](https://discord.com/developers/applications/1503133937558491146/oauth2)
8. Scroll down to **Redirects**
9. Click **Add Redirect**
10. Paste the Supabase callback URL you copied
11. Scroll to the bottom of the Discord page → click **Save Changes**
12. Wait for the "Saved!" confirmation

### 7c — Configure Discord provider in Supabase

13. Go back to the Supabase tab (Discord provider should still be expanded)
14. Toggle **Enable Sign in with Discord** to **ON**
15. **Client ID** → type or paste: `1503133937558491146`
16. **Client Secret** → paste the secret from Part 6
17. **Additional Scopes** → type exactly: `identify guilds.members.read`
    - 🚨 This part is critical. Without `guilds.members.read`, the app can't see who's in your Discord and everyone gets locked out.
18. Click **Save** at the bottom of the Discord section

✅ Done. Discord and Supabase now talk to each other.

---

# Part 8 — Set Site URLs in Supabase

1. Still in the Supabase **Authentication** section
2. Left sub-menu: click **URL Configuration**
3. **Site URL** → type: `http://localhost:3000`
4. **Redirect URLs** section → click **Add URL** → paste: `http://localhost:3000/auth/callback`
5. Click **Save**

✅ Done. Supabase now knows where to send users after they sign in.

---

# Part 9 — Run the app

1. Open Command Prompt (Windows search → type `cmd` → Enter)
2. Type this exact command and press Enter:
   ```
   cd "C:\Users\HP\Downloads\Grippo Mentorship PDFs\CLAUDE CODE\trade-journal"
   ```
3. Type and press Enter:
   ```
   npm install
   ```
   ⏳ Wait. Could take 1–3 minutes the first time. Lots of text scrolling = normal.
4. When it finishes, type and press Enter:
   ```
   npm run dev
   ```
5. After a few seconds you'll see something like:
   ```
   ▲ Next.js 15.0.3
   - Local: http://localhost:3000
   ```
6. **Leave this Command Prompt window open.** Don't close it. Don't press Ctrl+C. The app runs while this window is open.

---

# Part 10 — Sign in for the first time

1. Open a browser tab → go to **[http://localhost:3000](http://localhost:3000)**
2. You'll be redirected to `/login`
3. You should see:
   - The Kairos hourglass logo
   - "Welcome back."
   - A single button: **Sign in with Discord**
4. Click the button
5. Discord will show an authorization screen — it asks to access your Discord identity and your member info in your servers
6. Click **Authorize**
7. You'll be redirected back to the app
8. Since you have the **OWNER** role in Kairos, you should land on the mentor dashboard at `/mentor`

🎉 **If you see the mentor dashboard, you're done.** Phase 1 works.

---

# What to do if something breaks

| What you see | What's wrong | Fix |
|---|---|---|
| Red error after running an SQL file | Something didn't paste right, or Supabase has a quirk | Stop. Tell me the exact red error message. |
| Stuck on Discord authorization screen | Wrong Client ID or Secret in Supabase | Re-do Part 7c. The Client ID is `1503133937558491146`. |
| Land on /login with "You are not in the Kairos Discord server" | The OAuth scope `guilds.members.read` is missing | Supabase → Authentication → Providers → Discord → "Additional Scopes" must include `guilds.members.read`. Save again. |
| Land on /login with "Your Discord account has no mentorship role" | The role IDs in code don't match the role IDs in your Discord | Tell me, I'll fix the code. |
| Browser shows "This site can't be reached" at localhost:3000 | The dev server isn't running | Go back to Command Prompt and check it still says "Local: http://localhost:3000". If not, run `npm run dev` again. |
| You see the dashboard but as a student instead of mentor | Your OWNER role ID doesn't match what's in code | Tell me, I'll re-check it. |

---

# When you're done

Tell me **"Phase 1 works"** and I'll start Phase 2 (rules-followed streak + daily emotions check-in).

If anything breaks at any step, paste the exact error message or describe what you see. Don't push past errors — they compound.
