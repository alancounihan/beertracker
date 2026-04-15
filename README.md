# 🍺 BeerTracker

A mobile-first beer tracking app. Log your drinks, monitor units against Irish HSE guidelines, compete on the leaderboard, and get AI-powered summaries of your drinking habits.

**Stack:** React + Vite · Tailwind CSS · Supabase (Auth + Postgres) · Vercel Serverless · Anthropic Claude

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/alancounihan/beertracker.git
cd beertracker
npm install
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Go to **Authentication → Providers** and enable **Google**
   - Add your Vercel deployment URL to the redirect URLs
4. Go to **Storage** and create a bucket called `avatars` (set to Public)
5. Copy your **Project URL** and **anon key** from **Project Settings → API**

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** The AI summary (`/api/summarise`) requires Vercel's serverless runtime. To test locally, use `vercel dev` instead of `npm run dev`.

---

## Deploy to Vercel

### Option A: GitHub Integration (Recommended)

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Initial BeerTracker"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Add environment variables in Vercel dashboard:
   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |
4. Deploy — Vercel will auto-deploy on every push to `main`

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

---

## Supabase Auth: Google OAuth Setup

1. In Supabase dashboard → **Authentication → Providers → Google**
2. Enable Google provider
3. Supabase handles the OAuth flow — you'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
   - Create an OAuth 2.0 Client ID (Web application)
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Paste Client ID and Client Secret into Supabase

---

## Project Structure

```
beertracker/
├── api/
│   └── summarise.js          # Vercel serverless — Claude AI summary
├── src/
│   ├── components/
│   │   ├── AISummary.jsx     # AI summary card component
│   │   ├── BottomNav.jsx     # Mobile bottom navigation
│   │   └── Layout.jsx        # App shell with header + nav
│   ├── hooks/
│   │   ├── useAuth.js        # Auth context + Supabase auth helpers
│   │   └── useBeerLog.js     # Beer CRUD operations
│   ├── lib/
│   │   ├── supabase.js       # Supabase client
│   │   └── units.js          # Unit calculation helpers
│   ├── pages/
│   │   ├── DashboardPage.jsx # Home — stats, chart, AI summary
│   │   ├── LeaderboardPage.jsx
│   │   ├── LogPage.jsx       # Add beer form
│   │   ├── LoginPage.jsx     # Google sign-in
│   │   ├── ProfilePage.jsx   # Edit profile + sign out
│   │   └── ProfileSetupPage.jsx  # First-time setup
│   ├── App.jsx               # Router + auth guards
│   ├── index.css             # Tailwind + custom classes
│   └── main.jsx              # Entry point
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
└── vercel.json
```

---

## Features

- **Google Sign-In** via Supabase Auth
- **Profile setup** with photo upload to Supabase Storage
- **Beer logging** — name, volume (330/440/500/568ml or custom), ABV, timestamp
- **Unit calculation** — `(ml × ABV%) / 1000` per Irish standard
- **Dashboard** — today's stats, weekly bar chart, beer log with delete
- **Leaderboard** — Week/Month/Year toggle, ranked by beers with units shown
- **AI Summary** — Claude analyses your drinking patterns, compares to HSE guidelines
- **Mobile-first** — dark theme, amber accents, designed for one-hand pub use

---

## HSE Guidelines Referenced

Irish Health Service Executive weekly alcohol limits:
- **Men:** 17 standard units/week
- **Women:** 11 standard units/week

One standard Irish unit = 10ml (8g) pure alcohol.
The app uses the UK/Irish definition: `(ml × ABV%) / 1000`

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | Server-side | Anthropic API key (not VITE_ prefix — server only) |

---

*Drink responsibly. Know your limits. 🍺*
