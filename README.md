# Knightora

Knightora is a chess opening recommendation product focused on curation over overload.

This workspace now contains two versions:

- `Static prototype`: open `/Users/jakegoldin/Documents/Knightora/index.html` directly in a browser
- `Next.js app scaffold`: real app structure in `/Users/jakegoldin/Documents/Knightora/app`, `/Users/jakegoldin/Documents/Knightora/components`, `/Users/jakegoldin/Documents/Knightora/lib`, and `/Users/jakegoldin/Documents/Knightora/data`

## What is included

- A landing page for the Knightora concept
- A 6-step onboarding quiz
- Optional Chess.com username input
- A recommendation engine that returns:
  - 1 opening with White
  - 1 opening with Black versus `1.e4`
  - 1 opening with Black versus `1.d4`
- Shared recommendation logic separated from the UI in the Next.js version

## Running the Next.js app

```bash
cd /Users/jakegoldin/Documents/Knightora
npm install
npm run dev
```

Then visit `http://localhost:3000` (or the fallback port shown in the terminal if 3000 is in use).

### Clerk sign-in (recommended)

1. Create an application in the [Clerk Dashboard](https://dashboard.clerk.com).
2. Copy **Publishable key** and **Secret key** into `.env.local` (see `.env.example`):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. In Clerk → **Domains**, add:
   - `http://localhost:3000` for local dev
   - `https://knightora.vercel.app` (and your custom domain when you use one) for production
4. Sign-in and sign-up routes are `/sign-in` and `/sign-up`.

On Vercel, add the same two Clerk variables in **Project → Settings → Environment Variables**, then redeploy.

### Optional admin unlock

If you want to enable admin test mode from the UI, set an admin code:

```bash
export KNIGHTORA_ADMIN_CODE="your-secret-code"
npm run dev
```

Then sign in and use the "Admin access code" field in the account panel.

### Real Stripe billing setup

1. Copy env template and fill Stripe values:

```bash
cp .env.example .env.local
```

2. Create three recurring Stripe prices and set:
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_CLUB`
   - `STRIPE_PRICE_PRO`

3. Start dev server:

```bash
npm run dev
```

4. In a second terminal, forward Stripe webhooks:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

5. Copy the webhook secret from Stripe CLI into `STRIPE_WEBHOOK_SECRET`.

When a checkout completes, Knightora updates the user plan from webhook events.

## Deploying beyond localhost (Knightora.ai)

Recommended: deploy with Vercel + connect `Knightora.ai`.

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add all environment variables from `.env.example` in Vercel project settings.
4. Add production Stripe webhook endpoint:
   - `https://your-domain/api/billing/webhook`
5. In your domain registrar DNS for `Knightora.ai`, point nameservers/records to Vercel.
6. In Vercel Domains, attach `Knightora.ai` and `www.knightora.ai`.

### Verify build quality

```bash
npm run build
npm run lint
```

## Static prototype (optional)

The original static prototype is still included:

- Open `/Users/jakegoldin/Documents/Knightora/index.html` in a browser

Or serve it locally:

```bash
cd /Users/jakegoldin/Documents/Knightora
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Known limitations / incomplete areas

1. Persistence is file-based (`data/app-db.json`), so there is no production database yet.
2. Sign-in uses **Clerk**; legacy email/password APIs may still exist for older accounts. No production database yet—see persistence note above.
3. Subscription switching is UI + local state only; no real billing provider is connected.
4. Chess.com analysis relies on public APIs and recent archives; rate limits and external outages are not fully handled.
5. Test coverage is missing (no automated unit/integration tests are configured yet).
