# Knightneo

Knightneo is a chess opening recommendation product focused on curation over overload.

This workspace now contains two versions:

- `Static prototype`: open `./index.html` directly in a browser
- `Next.js app scaffold`: real app structure in `./app`, `./components`, `./lib`, and `./data`

## What is included

- A landing page for the Knightneo concept
- A 6-step onboarding quiz
- Optional Chess.com username input
- A recommendation engine that returns:
  - 1 opening with White
  - 1 opening with Black versus `1.e4`
  - 1 opening with Black versus `1.d4`
- Shared recommendation logic separated from the UI in the Next.js version
- **Opening training**: board drills include **full-line lessons** (multi-move sequences generated with `chess.js` from real SAN). The **free** plan includes the main line plus the rest of the core lesson pack for each repertoire track; **Starter / Club / Pro** unlock extra branch lines and deeper theory (see `data/opening-line-sequences.ts` and `filterLessonsForPlan` in `data/training.ts`).

## Running the Next.js app

```bash
cd <repo-root>
npm install
npm run dev
```

Then visit `http://localhost:3000` (or the fallback port shown in the terminal if 3000 is in use).

Board drills use **chess.js** for the multi-move lines: each position is stored as a **FEN** before the next half-move, and taps must be **legal destinations** for the piece that should move (with optional highlighted legal squares). Single-move board puzzles build a FEN from the diagram when possible so the same rules apply.

### Clerk sign-in (recommended)

1. Create an application in the [Clerk Dashboard](https://dashboard.clerk.com).
2. Copy **Publishable key** and **Secret key** into `.env.local` (see `.env.example`):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. In Clerk → **Domains**, add:
   - `http://localhost:3000` for local dev
   - `https://<your-project>.vercel.app` (and your custom domain when you use one) for production
4. Sign-in and sign-up routes are `/sign-in` and `/sign-up`.

On Vercel, add the same two Clerk variables in **Project → Settings → Environment Variables**, then redeploy.

### Optional admin unlock

If you want to enable admin test mode from the UI, set an admin code:

```bash
export KNIGHTNEO_ADMIN_CODE="your-secret-code"
npm run dev
```

Then sign in and use the "Admin access code" field in the account panel.

### Real Stripe billing setup

The app uses **Stripe Checkout** (subscription mode) with a single **paid** tier and **two** recurring prices (monthly and yearly). Code: [`lib/billing.ts`](lib/billing.ts), [`app/api/billing/checkout/route.ts`](app/api/billing/checkout/route.ts), [`app/api/billing/webhook/route.ts`](app/api/billing/webhook/route.ts).

1. Copy env template and fill values:

```bash
cp .env.example .env.local
```

2. In [Stripe Dashboard](https://dashboard.stripe.com) (**Test mode** for local dev):

   - **Products** → create a product (e.g. “Knightneo”).
   - Add **two recurring prices** (e.g. monthly and yearly; amounts should match your marketing copy in [`lib/pricing-plans.ts`](lib/pricing-plans.ts)).
   - Copy each **Price ID** (`price_...`) into `.env.local`:
     - `STRIPE_PRICE_PAID_MONTHLY`
     - `STRIPE_PRICE_PAID_YEARLY`  
     (Optional legacy names: `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_YEARLY` are still read by `lib/billing.ts` if the `PAID_*` vars are unset.)
   - **Developers → API keys** → copy the **Secret key** into `STRIPE_SECRET_KEY`.

3. Start the dev server:

```bash
npm run dev
```

4. In a second terminal, forward webhooks (requires [Stripe CLI](https://stripe.com/docs/stripe-cli)):

```bash
npm run stripe:listen
```

5. Copy the **`whsec_...`** secret printed by the CLI into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

6. End-to-end check: sign in (Clerk), use the **Subscribe** buttons on `/quiz` (upgrade strip if you are on the free tier), pay with a [test card](https://docs.stripe.com/testing). After redirect to `/quiz`, refresh—your plan should show **paid**. The webhook writes **`subscriptionPlan`** to **Clerk `publicMetadata`** (see [`lib/clerk-subscription-sync.ts`](lib/clerk-subscription-sync.ts)) so entitlements work on **Vercel** even when `data/app-db.json` cannot be updated reliably. Cancel the subscription in the Stripe Dashboard to confirm downgrade to **free**.

**Production (e.g. Vercel):** add the same variables in project settings. Create a **Webhook endpoint** URL `https://<your-domain>/api/billing/webhook` and subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Paste that endpoint’s **signing secret** into `STRIPE_WEBHOOK_SECRET` for production (separate from the CLI secret used locally).

### If billing still fails

1. **Vercel env:** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PAID_MONTHLY`, `STRIPE_PRICE_PAID_YEARLY`, and **`STRIPE_WEBHOOK_SECRET` must all be set** on the project. Redeploy after changing env vars.
2. **Webhook URL:** Must be exactly `https://<your-production-domain>/api/billing/webhook` (same domain users use). The signing secret must come from **that** endpoint in the Stripe Dashboard—not from `stripe listen` (that `whsec_` is only for localhost).
3. **Test vs live:** Stripe **Test mode** keys and **Live mode** keys must match the mode of the prices you created (`price_...`). Mixing test secret with live prices (or the reverse) breaks checkout.
4. **Clerk:** `CLERK_SECRET_KEY` on the server must be valid so the webhook can set `publicMetadata.subscriptionPlan`. In Clerk Dashboard, ensure your app allows updating user metadata from the Backend API (default setups work).
5. **Stripe Dashboard → Developers → Webhooks → your endpoint → recent deliveries:** open a failed delivery to read the response body (e.g. missing secret, 500 from Clerk).

## Deploying beyond localhost (Knightneo.ai)

Recommended: deploy with Vercel + connect `Knightneo.ai`.

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add all environment variables from `.env.example` in Vercel project settings.
4. Add production Stripe webhook endpoint `https://your-domain/api/billing/webhook` with the four events listed under **Real Stripe billing setup** above; set `STRIPE_WEBHOOK_SECRET` to that endpoint’s signing secret.
5. In your domain registrar DNS for `Knightneo.ai`, point nameservers/records to Vercel.
6. In Vercel Domains, attach `Knightneo.ai` and `www.knightneo.ai`.

### Verify build quality

```bash
npm run build
npm run lint
```

## Static prototype (optional)

The original static prototype is still included:

- Open `./index.html` in a browser

Or serve it locally:

```bash
cd <repo-root>
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Known limitations / incomplete areas

1. Persistence is file-based (`data/app-db.json`), so there is no production database yet.
2. Sign-in uses **Clerk**; legacy email/password APIs may still exist for older accounts. No production database yet—see persistence note above.
3. Subscription switching is UI + local state only; no real billing provider is connected.
4. Chess.com analysis relies on public APIs and recent archives; rate limits and external outages are not fully handled.
5. Test coverage is missing (no automated unit/integration tests are configured yet).
