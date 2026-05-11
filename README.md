# Kairos — Journal

> *Wait. Then act.*

The trade journal product for the Kairos mentorship. Students log every trade with a thesis. Each thesis is graded against the candle-profiling framework. Tilt and bad-habit patterns surface to the mentor automatically.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth + Storage)
- Cormorant Garamond + Inter via `next/font/google`
- Deploys to Vercel for free

---

## The brand, in code

Two colors. Restraint is the third.

| Token | Value | Use |
|---|---|---|
| Canvas | `#080808` | page background — warm near-black, never `#000` |
| Surface | `#0F0F0F` | cards, panels |
| Bone | `#F0EDE8` | primary text — never pure white |
| Gold | `#C6AB5C` | the only accent. Reserved for the moment that matters |

**No red. No green. No status hues.** Win/loss outcomes are conveyed through typography (italic Cormorant for the outcome word, the signed P&L number) — not through stoplight color. Gold is reserved for the moment that demands attention: a textbook framework score, a critical alert, the brand mark itself.

**Two fonts.** Cormorant Garamond for headlines, italics, and the price tag. Inter for eyebrows, body, and buttons. Italics carry the keystone idea of every sentence.

**The voice.** Diagnose, then prescribe. Never sell. Short sentences. Then a long one. Second person, declarative. No emoji, no exclamations, no superlatives.

Brand primitives live in [components/Brand.tsx](components/Brand.tsx) — `Mark`, `Wordmark`, `Eyebrow`, `PageHeader`, `TopBar`, `Footer`. Tokens are in [app/globals.css](app/globals.css) and Tailwind extensions are in [tailwind.config.ts](tailwind.config.ts).

---

## What's in the app

**Students see:**
- A 6-card stats bar — trades, win rate, avg R, net P&L, current loss streak, framework avg. Loss streaks ≥3 and framework avgs ≥9 turn gold; everything else stays neutral.
- A 5-section guided trade form:
  1. **The trade** — instrument, prices, P&L
  2. **The framework** — candle type (Expansion / Reversal-Into-Expansion / Reversal / Other) with the rubric inline; pillar checkboxes (Profile, Signature, Trigger, Targets); a 1–10 self-score with live label feedback
  3. **The thesis** — required textarea (min 20 chars). "Walk through your read."
  4. **The context** — setup tag, emotion (calm/confident/hesitant/rushed/revenge/fomo), notes
  5. **The chart** — required screenshot
- Their last 50 trades, each showing the outcome (italic), candle type, criteria pills with gold checkmarks, the thesis (with a gold left-border quote treatment), and the screenshot.

**You (mentor) see:**
- **Cohort numbers** at the top: net, total trades, cohort win rate, active alert count
- **Alerts**, sorted critical-first, each clickable to drill into a student
- **Students table** sorted by alert severity → loss streak, with a framework avg column and flag count
- Click any student → **per-student page** with stats bar, equity curve (single gold line), active flags, bad-habit analysis, and the last 20 trades

### Tilt detection (real-time)

Heuristic flags surfaced as alerts, with copy in the Kairos voice:

| Trigger | Voice |
|---|---|
| Loss streak ≥3 (warning) / ≥5 (critical) | *"Five losses in sequence. The window is closed for today."* |
| Trade < 15 min after a loss with size up | *"A revenge trade. The market did not require the bet."* |
| ≥5 trades in 24h | *"Five trades in twenty-four hours. Frequency is rarely the answer. Quality is."* |
| Avg framework score < 5 over last 5 | *"Forcing trades. Re-anchor on Profile, Signature, Trigger, Targets."* |
| ≥3 of last 10 tagged revenge/fomo/rushed | *"The room is loud."* |
| Contracts ≥ 2× median after loss | *"Size doubled after a loss. The classic tilt signal."* |

Tunable in [lib/detect.ts](lib/detect.ts) → `THRESHOLDS`.

### Bad-habit analysis (≥10 trades)

| Pattern | Voice |
|---|---|
| Bad day-of-week | *"Mondays are not your day."* |
| Most-missed pillar | *"Targets is the missed pillar. The framework breaks when one pillar leaves."* |
| Losing setup | *"NY-AM expansion is not pulling its weight. Drop it from the playbook."* |
| Direction bias | *"Shorts read worse than the other side. There is a reason — find it."* |
| Emotion when losing | *"Losses come tagged rushed."* |
| Score-vs-outcome correlation | *"The framework is paid. Low-score trades lose 78% of the time. High-score trades, 23%."* |

Privacy: students see only their own data. The screenshots bucket is private; signed URLs are issued on read with a 1-hour expiry.

---

## Setup — first time (~30 min)

You need three free accounts: GitHub, Supabase, Vercel.

### 1. Install Node.js 20+

From https://nodejs.org

### 2. Install dependencies

```bash
npm install
```

### 3. Create the Supabase project

1. https://supabase.com → New project
2. Pick a name, region, strong password (save it)
3. Wait ~1 min for it to provision
4. **Project Settings → API** — copy the Project URL and the `anon public` key

### 4. Set environment variables

```bash
cp .env.local.example .env.local
```

Paste the two values into `.env.local`. Leave `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for now.

### 5. Run the SQL schema

Supabase → **SQL Editor → New query**. Open `supabase/schema.sql`, paste the entire file, click **Run**.

If you previously ran v1, run `supabase/migration_001_framework_fields.sql` instead.

### 6. Configure auth

Supabase → **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

### 7. Run it

```bash
npm run dev
```

Open http://localhost:3000. Enter your email. Click the link from the inbox.

To make yourself the mentor: Supabase → **Table editor → profiles** → change your `role` to `mentor` → save → refresh the app.

### 8. Add students

Each student goes to the app URL, enters their email, clicks the magic link. Their profile is auto-created as a student.

---

## Deploy to Vercel

1. Push to GitHub
2. https://vercel.com → Import the repo
3. Add the three env vars; update `NEXT_PUBLIC_SITE_URL` to your Vercel URL
4. Add the Vercel URL to Supabase **Authentication → URL Configuration** (Site URL + `/auth/callback` redirect)
5. Trigger a redeploy

---

## Tuning

- **Brand colors / fonts** → [tailwind.config.ts](tailwind.config.ts), [app/globals.css](app/globals.css)
- **The mark + chrome** → [components/Brand.tsx](components/Brand.tsx)
- **Framework rubric / wording** → [lib/framework.ts](lib/framework.ts)
- **Tilt + habit thresholds and copy** → [lib/detect.ts](lib/detect.ts)
- **What stats to compute** → [lib/stats.ts](lib/stats.ts)

---

## Roadmap

Schema-supported, not yet built:

- **AI thesis grading** — send screenshot + thesis + pillar checklist to Claude; compare objective score to self-rating; flag delusion
- **Sunday-night per-student review** — cron + Claude → emailed week summary in Kairos voice
- **Edit-existing-trade** — currently create + delete only
- **Mentor comments per trade** — coaching channel attached to specific entries
- **CSV export** — for the spreadsheet contingent

---

## Local file map

```
app/
  page.tsx                  # routes auth'd users to /dashboard or /mentor
  login/                    # magic link sign-in (brand header)
  auth/callback/            # Supabase OAuth callback
  dashboard/                # student view
  mentor/
    page.tsx                # cohort overview + alerts + students table
    [userId]/page.tsx       # per-student detail
  globals.css               # brand tokens, base typography
  layout.tsx                # next/font (Cormorant + Inter), metadata

components/
  Brand.tsx                 # Mark, Wordmark, PageHeader, TopBar, Footer
  TradeForm.tsx             # 5-section guided form, gold submit button
  TradeList.tsx             # trade cards — italic outcomes, gold criteria pills
  StatsBar.tsx              # 6 stat cards (Cormorant numerals)
  TiltAlerts.tsx            # gold-bordered alert cards
  HabitsList.tsx            # left-rule habit cards
  EquityCurve.tsx           # SVG line chart, gold monochrome

lib/
  framework.ts              # rubric — candle types, pillars, score guide
  detect.ts                 # tilt + habits engines, Kairos-voice copy
  stats.ts                  # computeStats, fmtMoney, fmtMoneySigned
  supabase/                 # browser/server clients + middleware

supabase/
  schema.sql                # full schema for fresh installs
  migration_001_framework_fields.sql  # if you already ran v1
```

---

*The right trade at the wrong time is still the wrong trade.*
