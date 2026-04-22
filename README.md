# 🎰 AI Casinos Review – Automated Website

Auto-publishing casino review site powered by Groq AI, GitHub Actions, Cloudflare Workers, and FTP deploy.

---

## 📋 Architecture

```
Discord Slash Command
        ↓
Cloudflare Worker (free, runs 24/7, no server needed)
        ↓
GitHub Actions API (triggers workflow)
        ↓
Groq AI → generates English casino review
        ↓
Saves HTML + updates index
        ↓
FTP Deploy → zlatev.elegance.bg/ai-casinos-discord
```

---

## 🚀 SETUP GUIDE (Step by Step)

### STEP 1 – Create GitHub Repository

1. Go to https://github.com and log in
2. Click **New repository**
3. Name it: `ai-casinos-discord`
4. Set to **Public** (required for free GitHub Actions)
5. Click **Create repository**
6. Upload all these project files (drag & drop or git push)

---

### STEP 2 – Get a Groq API Key (FREE)

1. Go to https://console.groq.com
2. Sign up / Log in
3. Click **API Keys** → **Create API Key**
4. Copy the key – looks like: `gsk_xxxxxxxxxxxx`

---

### STEP 3 – Create Discord Application & Bot

1. Go to https://discord.com/developers/applications
2. Click **New Application** → Name it `AI Casinos Bot` → Create
3. **Copy the Application ID** (you'll need this later)
4. Go to **Bot** tab in left menu
5. Click **Reset Token** → Copy the Bot Token
6. Go to **General Information** tab
7. **Copy the Public Key** (long hex string)
8. In **Bot** tab, scroll to **Privileged Gateway Intents** – leave all OFF (not needed)

**Invite bot to your server:**
1. Go to **OAuth2** → **URL Generator**
2. Check: `applications.commands`
3. Copy the generated URL, open in browser, add to your Discord server

---

### STEP 4 – Set Up Cloudflare Worker (FREE)

> Cloudflare Workers is a serverless platform. Your Discord bot runs here for free,
> 24/7, without any server. It only runs when Discord sends a command – so no costs.

**4a – Create Cloudflare Account**
1. Go to https://cloudflare.com → Sign up (free)
2. No credit card needed for Workers free tier

**4b – Create the Worker**
1. Log into Cloudflare Dashboard
2. In the left sidebar click **Workers & Pages**
3. Click **Create** → **Create Worker**
4. Give it a name: `ai-casinos-bot`
5. Click **Deploy** (ignore the default code for now)

**4c – Paste the Worker code**
1. In your new Worker, click **Edit code**
2. Delete ALL the existing code
3. Open `cloudflare-worker/discord-bot.js` from this project
4. Copy ALL its contents and paste into the editor
5. Click **Deploy**

**4d – Add Environment Variables**
1. Go to your Worker → **Settings** tab → **Variables**
2. Click **Add variable** for each of these:

| Variable Name        | Value                              |
|---------------------|------------------------------------|
| `DISCORD_PUBLIC_KEY` | Public Key from Discord Dev Portal |
| `GITHUB_TOKEN`       | Your GitHub Personal Access Token (see Step 5) |
| `GITHUB_REPO`        | `your-github-username/ai-casinos-discord` |
| `DISCORD_BOT_TOKEN`  | Bot Token from Discord Dev Portal  |

3. Click **Save and deploy**

**4e – Get your Worker URL**
- It looks like: `https://ai-casinos-bot.YOUR-NAME.workers.dev`
- Copy this URL – you need it in the next step

---

### STEP 5 – Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `ai-casinos-actions`
4. Expiration: **No expiration** (or 1 year)
5. Check these scopes:
   - ✅ `repo` (all)
   - ✅ `workflow`
6. Click **Generate token**
7. **Copy the token immediately** (shown only once!) – looks like `ghp_xxxxxxxxxxxx`

---

### STEP 6 – Add GitHub Secrets

1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

| Secret Name      | Value                                      |
|-----------------|--------------------------------------------|
| `GROQ_API_KEY`   | From Step 2                               |
| `GITHUB_TOKEN`   | Automatic (already exists)                |
| `FTP_HOST`       | `zlatev.elegance.bg`                      |
| `FTP_USERNAME`   | Your FTP username                         |
| `FTP_PASSWORD`   | Your FTP password                         |

---

### STEP 7 – Connect Discord to Cloudflare Worker

1. Go to https://discord.com/developers/applications
2. Select your application
3. Click **General Information**
4. Find **Interactions Endpoint URL**
5. Paste your Cloudflare Worker URL from Step 4e
6. Click **Save Changes**
   - Discord will send a test ping to verify it works ✅
   - If it fails, double-check your `DISCORD_PUBLIC_KEY` variable in Cloudflare

---

### STEP 8 – Register Discord Slash Commands

Run this once on your computer (requires Node.js 18+):

```bash
DISCORD_BOT_TOKEN=your_bot_token DISCORD_APP_ID=your_app_id node cloudflare-worker/register-commands.js
```

This registers: `/review`, `/schedule`, `/list`, `/status`, `/help`

---

### STEP 9 – Test Everything

In your Discord server:
```
/status
```
Should reply with bot status and site URL.

```
/review Bet365
```
Should trigger GitHub Actions → generate review → deploy to FTP in ~2 minutes.

Check: https://github.com/YOUR_USERNAME/ai-casinos-discord/actions

---

## 📁 File Structure

```
ai-casinos-discord/
├── .github/workflows/
│   ├── daily-review.yml       ← Cron: runs daily at 09:00 UTC
│   └── manual-review.yml      ← Triggered by Discord bot
├── data/
│   ├── casinos.json           ← List of casinos to review
│   ├── published.json         ← Track published reviews
│   └── *.meta.json            ← Per-casino metadata (auto-generated)
├── src/
│   ├── generate-review.js     ← Groq AI review generator
│   └── build-site.js          ← Rebuilds index.html + sitemap
├── site/
│   ├── index.html             ← Auto-generated homepage
│   ├── sitemap.xml            ← Auto-generated sitemap
│   ├── reviews/               ← Auto-generated review pages
│   └── assets/
│       └── style.css          ← Purple light theme
├── cloudflare-worker/
│   ├── discord-bot.js         ← Paste into Cloudflare Worker
│   └── register-commands.js   ← Run once to register commands
└── package.json
```

---

## ➕ Adding New Casinos

Edit `data/casinos.json` and add an entry:

```json
{
  "name": "New Casino Name",
  "slug": "new-casino-name",
  "url": "https://newcasino.com",
  "founded": 2015,
  "rating": 4.2,
  "bonus": "200% up to $500",
  "bonus_code": "NEW200",
  "min_deposit": 20,
  "wagering": 35,
  "payment_methods": ["Visa", "Mastercard", "PayPal"],
  "withdrawal_time": "1-3 business days",
  "languages": ["English", "German"],
  "mobile": true,
  "live_casino": true,
  "sports": false,
  "slots": true,
  "table_games": true,
  "live_games": true,
  "pros": ["Great bonus", "Fast withdrawals"],
  "cons": ["No sports betting"],
  "tags": ["slots", "live casino", "mobile"]
}
```

The next daily run will automatically pick it up.

---

## 🎮 Discord Commands

| Command | Description |
|---------|-------------|
| `/review` | Generate next casino in queue |
| `/review Bet365` | Generate specific casino review |
| `/schedule Bet365 2025-02-14` | Schedule review for date |
| `/list` | Show pending/published reviews |
| `/status` | Bot & site status |
| `/help` | All commands |

---

## 🆓 Free Tier Limits

| Service | Free Limit | Our Usage |
|---------|-----------|-----------|
| Cloudflare Workers | 100,000 req/day | ~10-20/day ✅ |
| GitHub Actions | 2,000 min/month (public repo: unlimited) | ~5 min/day ✅ |
| Groq API | 14,400 req/day, 500k tokens/min | ~1 req/day ✅ |
| FTP Hosting | Your existing hosting | Files only ✅ |

---

## ❓ Troubleshooting

**Discord says "This interaction failed"**
→ Check Cloudflare Worker logs: Dashboard → Workers & Pages → your worker → **Logs**

**GitHub Action fails with 401**
→ Re-generate `GITHUB_TOKEN` (Step 5) and update in Cloudflare environment variables

**FTP deploy fails**
→ Verify FTP credentials in GitHub Secrets. Try connecting manually with an FTP client first.

**Reviews not generating**
→ Check `GROQ_API_KEY` is correct and not expired. Test at console.groq.com

---

*18+ | Gamble Responsibly | BeGambleAware.org*
