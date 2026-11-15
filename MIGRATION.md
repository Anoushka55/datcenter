# EAiQ Migration Guide: Vite → Next.js + RAG

## What changed & why

| Problem | Old (Vite) | New (Next.js) |
|---------|-----------|---------------|
| API key exposed in browser | `import.meta.env.ANTHROPIC_API_KEY` in client bundle | Server-only in `.env.local`, never in browser |
| Vite dev server blocked on company laptop | Vite on random ports | Next.js on port 3000 (usually open) |
| No RAG / live data | Claude answers from training data only | Every call fetches Tavily search results first |
| Vercel env var error | Needed `VITE_` prefix | Plain variable names, server-side only |

---

## Setup (takes ~5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env.local` (copy from example)
```bash
cp .env.local.example .env.local
```
Then edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-api03-...your-real-key...
TAVILY_API_KEY=tvly-...your-key...   # Free at https://tavily.com
```

### 3. Run locally
```bash
npm run dev
# Opens at http://localhost:3000
```

### 4. Deploy to Vercel
```bash
# In Vercel dashboard → Settings → Environment Variables, add:
# ANTHROPIC_API_KEY  → your key
# TAVILY_API_KEY     → your key
# Then push to git — Vercel auto-deploys
```

---

## New file structure

```
dc-cd-active/
├── app/
│   ├── layout.jsx              ← Root layout (replaces index.html + main.jsx)
│   ├── page.jsx                ← "/" route
│   ├── globals.css             ← Renamed from index.css
│   ├── dashboard/page.jsx      ← "/dashboard" route
│   ├── stage/
│   │   ├── 01/page.jsx         ← "/stage/01" route
│   │   └── ... 02-06
│   └── api/
│       └── chat/route.js       ← 🔑 All Claude+Tavily calls go here (server-side)
│
├── components/
│   ├── layout/Navbar.jsx       ← useNavigate → useRouter (next/navigation)
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── GlobalDashboard.jsx
│   │   ├── MapHook.jsx         ← NEW: Leaflet hooks isolated (SSR-safe)
│   │   └── Stage01–06.jsx
│   ├── stage-pages/
│   │   ├── StageLayout.jsx
│   │   └── FormComponents.jsx
│   ├── ai-chat/AIChatPanel.jsx
│   ├── lifecycle-wheel/LifecycleWheel.jsx
│   └── shared/                 ← Badge, Button, Card, LoadingDots (unchanged)
│
├── lib/
│   ├── claude-api.js           ← Client wrapper → hits /api/chat, never Anthropic directly
│   └── datacenter-data.js      ← Unchanged data helpers
│
├── store/appStore.js           ← Zustand store (unchanged)
└── utils/helpers.js            ← Unchanged helpers
```

---

## How RAG works

Every `callClaude()` call now accepts an optional `ragQuery`:

```js
// Before (Vite — direct, no RAG, key exposed):
const result = await callClaude({ prompt, maxTokens: 2500 });

// After (Next.js — RAG-grounded, key server-side):
const result = await callClaude({ prompt, maxTokens: 2500, ragQuery: 'datacenter market India 2025' });
```

**What happens server-side in `/api/chat/route.js`:**
1. Tavily searches the web for `ragQuery`
2. Top 4-5 results get formatted into a context block
3. That context is injected into Claude's system prompt
4. Claude answers with live market intelligence
5. Response streams back to browser

RAG is gracefully degraded — if Tavily is unavailable or `ragQuery` is omitted, Claude still answers normally.

---

## Key things NOT to do
- Never add `NEXT_PUBLIC_` prefix to API keys — that exposes them to the browser
- Never call `https://api.anthropic.com` directly from client components
- Never import `claude-api.js` in a server component — it uses `fetch` with relative URLs

---

## React Router → Next.js navigation cheat sheet

| Old (react-router-dom) | New (next/navigation + next/link) |
|------------------------|-----------------------------------|
| `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from 'next/navigation'` |
| `const navigate = useNavigate()` | `const router = useRouter()` |
| `navigate('/dashboard')` | `router.push('/dashboard')` |
| `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| `<Link to="/stage/01">` | `<Link href="/stage/01">` |
| `useLocation().pathname` | `usePathname()` from `next/navigation` |
