# Pure Turf AI

Internal marketing intelligence tool for Pure Turf LLC.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Deploy to Netlify

### 1. Set your Anthropic API key

In Netlify dashboard → Site settings → Environment variables:

```
ANTHROPIC_API_KEY = sk-ant-xxxxx
```

### 2. Deploy

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login
netlify login

# Create site + deploy
netlify init
netlify deploy --prod
```

### 3. Custom domain (optional)

Point `ai.pureturfllc.com` CNAME to your Netlify site URL in Cloudflare.

## Auth

Team credentials are in `src/App.jsx` → `TEAM` array. Change PINs before sharing.

For production, replace with a real auth backend (Supabase, Auth0, etc).

## PWA

When users visit on mobile and tap "Add to Home Screen", the app installs as a standalone PWA with the Pure Turf icon and navy status bar.
