# Deploy to Vercel — Step by Step

Total time: ~20 minutes if you've never used GitHub or Vercel before.

You'll need:
- A web browser
- Command Prompt or PowerShell (Windows search → `cmd` or `powershell`)
- A free GitHub account (you'll sign up below if you don't have one)
- A free Vercel account (you'll sign up below)

By the end, your trade journal will be live at a real URL (something like `https://kairos-journal.vercel.app`) — Sam and your students can use it from anywhere.

---

# Part 1 — Initialize a git repo for the app

Git tracks every change so Vercel can deploy your code. You're putting the git repo INSIDE the `trade-journal` folder (not the parent folder) — that keeps your curriculum, slides, and other private files out of the deploy.

1. Open Command Prompt
2. Run these one at a time:
   ```
   cd "C:\Users\HP\Downloads\Grippo Mentorship PDFs\CLAUDE CODE\trade-journal"
   ```
   ```
   git init
   ```
   ```
   git add .
   ```
   ```
   git commit -m "Initial commit"
   ```

3. You should see output like `[master (root-commit) abc123] Initial commit` with a list of files.

✅ Done. Your code is now version-controlled locally.

🚨 **Important check:** confirm `.env.local` was NOT committed. Run:
```
git ls-files | findstr .env.local
```
You should get nothing back. If you see `.env.local` in that list, **stop and ping me** — your secrets would leak to GitHub.

---

# Part 2 — Push the code to GitHub

GitHub stores your code online. Vercel reads from GitHub to deploy.

### 2a — Make a GitHub account (skip if you have one)

1. Go to [github.com](https://github.com)
2. Click **Sign up** (top-right)
3. Pick a username, email, password
4. Verify email if prompted

### 2b — Create a repository

1. Top-right corner click the **+** → **New repository**
2. **Repository name** → `kairos-journal`
3. **Private** ← select this. Your code stays yours.
4. ⚠️ **Don't** initialize with README, .gitignore, or license — you already have those locally
5. Click **Create repository**

### 2c — Push your local code to GitHub

After creating the repo, GitHub shows a page titled "Quick setup". You want the section labeled **"…or push an existing repository from the command line"**. It shows 2-3 commands.

Back in Command Prompt (still in the `trade-journal` folder), run:

```
git branch -M main
```
```
git remote add origin https://github.com/YOUR-USERNAME/kairos-journal.git
```
Replace `YOUR-USERNAME` with your actual GitHub username.

```
git push -u origin main
```

GitHub will ask you to authenticate:
- A browser window opens → sign in to GitHub → click **Authorize**
- Or if it asks for a password in the terminal: paste a Personal Access Token (Settings → Developer settings → Personal access tokens). The browser flow is easier.

✅ When done: refresh your GitHub repo page in browser. You should see your code listed.

---

# Part 3 — Sign up for Vercel and import the project

### 3a — Sign up

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** (top-right)
3. Choose **Continue with GitHub** (easiest — uses your GitHub account)
4. Authorize Vercel to access your GitHub repositories

### 3b — Import the repo

1. After signup, you land on the Vercel dashboard
2. Click **Add New…** → **Project**
3. You'll see your GitHub repos listed
4. If you don't see `kairos-journal` → click **Adjust GitHub App Permissions** → grant access to the repo
5. Click **Import** next to `kairos-journal`

### 3c — Configure the build

You'll see a "Configure Project" page. Most defaults are fine. Just confirm:

- **Framework Preset:** Next.js (should auto-detect)
- **Root Directory:** `./` (leave as default — the git repo IS the trade-journal folder)
- **Build Command:** leave default (`next build`)
- **Output Directory:** leave default
- **Install Command:** leave default

### 3d — Environment Variables (CRITICAL — do this before clicking Deploy)

Expand the **Environment Variables** section. Add these three exactly:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ikmzewqhrcjrkghwbwvh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (copy from your local `.env.local` file — the `sb_publishable_…` value) |
| `NEXT_PUBLIC_SITE_URL` | leave blank for now (you'll add this in Part 5) |

🚨 To find your anon key:
1. Open File Explorer → navigate to `trade-journal\.env.local`
2. Right-click → Open with → Notepad
3. Copy the value after `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
4. Paste into the Vercel env var

For each variable, click **Add** before moving to the next.

### 3e — Deploy

Click the big **Deploy** button at the bottom.

⏳ Wait 1-3 minutes. You'll see build logs scrolling. When it's done, you'll see "🎉 Congratulations!" with confetti.

---

# Part 4 — Copy your Vercel URL

1. Click **Continue to Dashboard** (or **Visit**)
2. At the top of your project page in Vercel, you'll see a URL like:
   ```
   kairos-journal-xyz123.vercel.app
   ```
3. **Copy this URL.** You'll paste it in two places next.

---

# Part 5 — Set `NEXT_PUBLIC_SITE_URL` and redeploy

1. In Vercel → your project → **Settings** (top nav)
2. Left sidebar → **Environment Variables**
3. Find `NEXT_PUBLIC_SITE_URL` (it should be empty)
4. Click the row → edit → set value to: `https://your-vercel-url.vercel.app` (paste the full URL with `https://`)
5. Save
6. Top nav → **Deployments**
7. Find the latest deployment → click the **…** menu → **Redeploy**
8. Wait for it to finish

---

# Part 6 — Update Supabase to accept your Vercel URL

Supabase needs to know your Vercel URL is allowed to redirect users after login.

1. Open Supabase dashboard → your project
2. Left sidebar → **Authentication** → **URL Configuration**
3. **Site URL** → change from `http://localhost:3000` to `https://your-vercel-url.vercel.app`
4. **Redirect URLs** → click **Add URL** → paste `https://your-vercel-url.vercel.app/auth/callback`
   - Keep the localhost URL too (so you can still develop locally)
5. Click **Save**

🚨 **You do NOT need to change anything in the Discord Developer Portal.** Discord's redirect URL still points to Supabase (`https://ikmzewqhrcjrkghwbwvh.supabase.co/auth/v1/callback`), which doesn't change between dev and prod.

---

# Part 7 — Test it

1. Open your Vercel URL in a new browser tab
2. You should be redirected to `/login`
3. Click **Sign in with Discord** → authorize → you should land on `/mentor` (since you have OWNER role)

✅ **If you see your mentor dashboard, you're live.**

Now share the Vercel URL with Sam. He'll sign in with Discord too — his `Instructor` role will map to `mentor` automatically. Have one student do the same (their `MENTORSHIP` or `Kairos - Group` role will map to `student`).

---

# Future updates — how to ship code changes

Anytime you (or I) modify the code:

1. In Command Prompt, in the `trade-journal` folder:
   ```
   git add .
   git commit -m "Brief description of what changed"
   git push
   ```
2. Vercel sees the push and auto-deploys (1-3 min)
3. Refresh your Vercel URL — the change is live

That's it. No more manual deploys. Every `git push` = a new deploy.

---

# Troubleshooting

| Symptom | Fix |
|---|---|
| `git push` asks for password and your password doesn't work | GitHub requires a Personal Access Token now. Easier: use the GitHub Desktop app, or use the browser auth flow when prompted. |
| Vercel build fails | Open the build logs in Vercel. Copy the error and paste to me. Most builds succeed if it built locally. |
| You see a blank page or "Supabase URL is undefined" | Environment variables weren't saved or weren't applied to the latest deploy. Verify they're set under Settings → Environment Variables, then redeploy. |
| "Sign in with Discord" works but you land on `/login` with a Discord error | Supabase Redirect URLs didn't get the new Vercel URL added. Re-do Part 6. |
| "Redirect URI mismatch" error from Discord | This means the Supabase callback URL isn't registered in the Discord Developer Portal. **You shouldn't need to fix this** — the Supabase callback URL is the same in dev and prod. If you somehow hit it, the URL should be `https://ikmzewqhrcjrkghwbwvh.supabase.co/auth/v1/callback`. |

---

# When you're live

Reply **"Deployed"** and I'll line up Phase 7. Suggested next moves now that real users can touch it:

- **Pre-trade checklist** (Kairos 9-item ritual before trade form unlocks)
- **Discord webhook** (streak milestones auto-post to a channel)
- **CSV export** (trader-portable data)
- **Onboarding session-1 email template** (welcome new students)
