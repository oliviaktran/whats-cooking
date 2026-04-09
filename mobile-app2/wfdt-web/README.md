# Forkcast

Portfolio-ready **React + TypeScript + Vite** app: pick ingredients and constraints, then get **three AI-generated recipes** with nutrition, steps, and clipboard export. **Anthropic Claude** is called only from **serverless routes** so your API key never ships to the browser.

## Local development

```bash
cd wfdt-web
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server wires `POST /api/generate` and `POST /api/swap` through `vite-plugin-wfdt-api.ts` using the same logic as production.

## Deploy on Vercel

1. Create a project with **root directory** set to `wfdt-web` (or deploy this folder as the repo root).
2. Set the environment variable **`ANTHROPIC_API_KEY`** in the Vercel dashboard.
3. Build command: `npm run build`, output directory: `dist` (defaults for Vite).

`vercel.json` rewrites client-side routes to `index.html` while leaving `/api/*` to serverless functions.

## Stack

- Vite, React 19, React Router 7
- `api/generate.ts` and `api/swap.ts` — Vercel Node handlers (`@vercel/node`)
- Shared prompt + Anthropic client in `lib-server/`
