# Repass compliance reference

Prepared: September 28, 2026. Operator: CV Management Solutions, LLC (`cuadventuresllc@gmail.com`).

This document is the working reference behind the public-facing `/terms` and
`/privacy` pages. It covers what the public pages summarize, at the level of
detail an engineer, auditor, or business-development counterpart would need.

## 1. Data & AI vendor inventory

Every third-party processor Repass's code actually calls, as of this date:

| Vendor | What it touches | Standard agreement |
|---|---|---|
| **Stripe** (Repass's own account) | Subscription billing, payment method (Repass never stores card numbers) | Stripe Services Agreement + Stripe DPA (published at stripe.com/legal/dpa) |
| **Stripe Connect** (a merchant's own account) | (If connected) Read-only access to payment status and payer contact info — see §2 | Stripe Connected Account Agreement, accepted by the merchant during OAuth |
| **Supabase** | Primary database (customers, businesses, reward tiers, point events), authentication | Supabase DPA (published at supabase.com/legal/dpa) |
| **WalletWallet** | Wallet pass generation/hosting (business branding, customer point balance, a customer-id barcode value) | WalletWallet's published Terms/Privacy (walletwallet.dev) |
| **Square** | (If connected) OAuth-scoped read of payment completion status and sale contact info, plus creation of one reward discount in the merchant's catalog (`ITEMS_WRITE`) — see §2 | Square Developer Terms of Service |
| **Clover** | (If connected) Read of payment result and the linked customer's phone/email. Read-only: no write scope is requested — see §2 | Clover Platform Agreement |
| **Resend** | Transactional email delivery (wallet-link emails) | Resend DPA (published at resend.com/legal/dpa) |
| **Vercel** | Application hosting, environment/secret storage | Vercel DPA (published at vercel.com/legal/dpa) |
| **Anthropic (Claude / Claude Code)** | AI coding assistant used to build and maintain the Repass codebase — no standing access to production customer data | Anthropic Commercial Terms + DPA (published at anthropic.com/legal) |

**Action item, not yet done:** formally countersigning/attaching each
provider's DPA under CV Management Solutions, LLC's account (most are self-serve/
click-through and already in effect by virtue of using the service; Stripe,
Supabase, and Vercel's are active by default on a paid plan). No provider
here requires a custom-negotiated agreement to be compliant at Repass's
current scale.

## 2. Point-of-sale integration data-access scope

This is the direct, code-verified answer to "are we liable for anything
through Square/Clover/Stripe": **no, because Repass never receives payment
data from any of them.**

Verified against the actual implementation:

- `lib/square.ts` — `fetchPayment()` requests a payment's `status` and
  `orderId` only. `fetchCustomerContact()` requests a customer's
  `phoneNumber`/`emailAddress` only. `fetchOrderDiscountIds()` requests
  which catalog discount IDs were applied to an order — used only to match
  a redemption to a reward tier, never to read prices or line items. Square
  is the one integration with a write scope: `ITEMS_WRITE` exists solely so
  Repass can create the reward discount a merchant redeems against, and the
  merchant sees that permission listed on Square's own consent screen when
  they connect. Nothing else in the catalog is created, modified, or deleted.
- `lib/clover.ts` — `fetchPayment()` requests a payment's `result` and
  associated `order.id` only. `fetchOrderCustomerContact()` requests an
  order's linked customer's phone/email only.
- Neither integration's code path ever requests, parses, stores, or logs a
  card number, CVV, expiration date, bank account number, or full order
  line-item contents. The OAuth scopes requested at connect time
  (`lib/square.ts`'s `buildAuthorizeUrl`: `MERCHANT_PROFILE_READ
  CUSTOMERS_READ PAYMENTS_READ ORDERS_READ ITEMS_READ ITEMS_WRITE`) do not
  include payment-instrument data.
- `lib/stripe-connect.ts` — a merchant's *own* Stripe account, connected
  read-only (`scope=read_only`). `fetchPaymentContact()` retrieves a
  PaymentIntent solely to read the payer's email/phone;
  `listCustomers()` reads the customer directory. No card data is
  retrievable under this scope, and Repass stores no Stripe credentials at
  all — only the connected account id (`acct_...`), with calls authenticated
  by the platform key plus a `Stripe-Account` header.
- Toast is **not integrated and will not be** — Toast declined the
  integration request (October 2026). No data access ever existed there.

This is why Repass's own PCI-DSS scope is effectively nil: it never
touches cardholder data, so the usual card-data compliance burden stays
entirely with the merchant's point-of-sale provider, not with Repass.

## 3. Copyright / trademark review

**Trademark self-check performed September 28, 2026:** searched public
trademark databases (Justia Trademarks, Trademarkia) and general web search
for "Repass" in software, SaaS, and loyalty-program contexts. No existing
trademark registration, application, or common usage was found under that
name in a conflicting class.

**Honest limit of this check:** this was a public-search self-check, not a
formal USPTO TESS structured search or an attorney-run clearance search.
Public search engines and free trademark-aggregator sites do not fully
index USPTO's database or state/common-law marks. Before relying on
"Repass" as a cleared mark for registration purposes, run an actual TESS
search (uspto.gov/trademarks) or have a trademark attorney run one.

**Asset licensing pass:** the codebase's only third-party creative/code
asset dependency is `lucide-react` (icon set), which is MIT-licensed —
free for commercial use, no attribution required beyond the license file.
No stock photography, purchased fonts, or other licensed creative assets
are currently used in the Repass codebase (the app uses Google Fonts'
Poppins, which is licensed under the SIL Open Font License, free for
commercial use).

## 4. Security practices

- **Encryption at rest**: Square and Clover OAuth access/refresh tokens are
  encrypted with AES-256-GCM before being stored (`lib/crypto.ts`), keyed
  by `POS_TOKEN_ENCRYPTION_KEY`, never stored in plaintext.
- **Row-level security**: every business-scoped table's Supabase RLS
  policy restricts access to rows where `business_id` belongs to the
  authenticated `owner_user_id` — a business owner's Supabase session can
  never read another business's data.
- **Two-tier database access**: `lib/supabase/server.ts` creates an
  RLS-scoped client for anything acting on behalf of a signed-in owner;
  `lib/supabase/admin.ts` creates a service-role client that bypasses RLS,
  used only in server-only contexts with no user session (the public
  `/join/[slug]` signup route, webhook handlers) — never imported into
  client-side code.
  - **Webhook authenticity checks**: Square webhooks are verified via a
  computed HMAC-SHA256 signature (`lib/square.ts`'s
  `verifyWebhookSignature`, using the Square SDK's `WebhooksHelper`).
  Clover webhooks are verified via a constant-time comparison against a
  static per-app Auth Code (`lib/clover.ts`'s `verifyWebhookAuth`,
  `timingSafeEqual`) — both reject any request that doesn't carry the
  expected credential before any event is processed.
- **Secrets management**: all API keys, OAuth secrets, and encryption keys
  live only in Vercel's encrypted environment-variable store, scoped per
  environment (production/preview/development); none are committed to the
  repository.
- **Transport security**: all traffic to Repass (the dashboard, the public
  sign-up/check-in pages, and every API route) is served over HTTPS via
  Vercel.
- **OAuth state integrity**: the connect flow for both Square and Clover
  signs a short-lived, HMAC-signed `state` parameter (`lib/crypto.ts`'s
  `signState`/`verifyState`) to prevent cross-site request forgery during
  the OAuth handshake.
