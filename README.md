# Repass

A digital loyalty card platform for small businesses. A business signs up, sets a simple
points rule, and its customers get a branded loyalty card issued straight to Apple Wallet
or Google Wallet — no app to download. Points are status only (no cash value); redemption
is always a discount or item the business grants.

Repass is a subscription SaaS ($49/month per business) built on top of the
[WalletWallet](https://www.walletwallet.dev/docs/) API, which handles all Apple/Google
Wallet certs, signing, and push delivery — Repass owns the business dashboard, the
points/rules logic, the customer database, and billing.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind) — app + marketing site
- **Supabase** — Postgres database + Auth for business owners (RLS-scoped per business)
- **Stripe** — subscription billing for business owners
- **Resend** — transactional email
- **WalletWallet** — Apple/Google Wallet pass issuance and live updates

## MVP flow

1. A business signs up (`/signup`), sets a points rule (`/onboarding`: points per visit,
   points needed for a reward, what the reward is), and subscribes via Stripe Checkout.
2. Their public join page (`/join/[slug]`) lets a customer sign up with just their name;
   this issues a WalletWallet pass and shows an Add to Wallet button.
3. The business dashboard (`/dashboard`) lists customers with an **Add a point** button.
   Clicking it updates the customer's balance in Supabase and pushes a live update to
   their installed Wallet pass — including a special lock-screen banner the moment they
   cross the reward threshold.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the blanks:
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Project Settings → API. Used
     server-side only (public customer signup bypasses RLS via this key) — never expose
     it to the browser.
   - `STRIPE_SECRET_KEY` — Stripe dashboard → Developers → API keys. Use a **test-mode**
     key for local development so you're not exercising real Checkout with real money;
     `STRIPE_PRICE_ID` in `.env.example` points at the **live** $49/mo price, so for test
     mode create a matching test-mode price and swap the ID locally.
   - `STRIPE_WEBHOOK_SECRET` — run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
     locally, or create a webhook endpoint in the dashboard pointed at your deployed URL.
   - `WALLETWALLET_API_KEY` — from your WalletWallet account. New accounts get Pro-tier
     features (custom logo/color) for a 30-day trial, then revert to Free — since a
     custom logo per business is core to the pitch, plan to be on Pro or better before
     real launch.
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — from your Resend account; the from
     address needs a verified sending domain before it can reach real customers.
3. `npm run dev` and open http://localhost:3000

## Notes on what's stubbed vs. real

- The Supabase project, schema, and RLS policies are already provisioned (see
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.example`).
- The live Stripe product/price ($49/month) is already created on the connected account.
  A webhook endpoint still needs to be created against wherever this is deployed.
- `lib/wallet.ts` is built directly against WalletWallet's documented API contract (see
  `docs/walletwallet.md`), but hasn't been exercised against a live pass end-to-end from
  this environment — verify a full create → update → revoke cycle once deployed somewhere
  with outbound access to `api.walletwallet.dev`.
