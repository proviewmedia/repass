# WalletWallet API reference (as used by `lib/wallet.ts`)

Captured from https://www.walletwallet.dev/docs/. Base URL: `https://api.walletwallet.dev`.
Auth: `Authorization: Bearer ww_live_...` (or a test-mode key) on every request.

## `POST /api/passes` — create

Body fields we send: `barcodeValue`, `barcodeFormat` (`QR`), `logoText`, `organizationName`,
`colorPreset` (`dark`/`blue`/`green`/`red`/`purple`/`orange`, or Pro-only `logoURL`/`color`),
`primaryFields`/`secondaryFields`/`backFields` (each `{ label?, value, changeMessage? }`).

Response: `{ serialNumber, googleSaveUrl, applePass (base64 .pkpass), shareUrl }`.
`shareUrl` is a hosted, device-aware "Add to Wallet" page — hand that straight to customers,
no need to touch the raw `.pkpass` bytes.

## `PUT /api/passes/<serial>` — update

**Resend the full pass spec every time**, not a diff. The server diffs internally:
byte-identical body → `{ unchanged: true }`, no push, no quota cost. A field's `changeMessage`
(containing `%@`) fires a lock-screen banner only when *that field's* value actually changed
between calls.

`backFields` order is positional — reordering it re-keys the "Notifications" anchor field and
silently breaks custom banners. `lib/wallet.ts#buildPassBody` is the single place that
constructs this body, precisely so field order can never drift between calls.

## `DELETE /api/passes/<serial>` — revoke

Invalidates the pass on both wallets. Idempotent (`alreadyDeleted: true` on repeat).

## Custom notifications: seed-then-bump

To fire an arbitrary lock-screen banner (e.g. "🎉 Reward unlocked: Free coffee!"), seed a
`backFields` entry at creation: `{ label: "Notifications", value: " ", changeMessage: "%@" }`.
Later, PUT with that field's `value` set to the message text (`changeMessage` stays `"%@"`).

Two rules make this fiddly, both handled in `lib/wallet.ts` + the `customers.last_notification`
column:

1. The banner only fires when the field's *value* changes call-to-call — so every update must
   resend whatever the anchor's last value was, or an unrelated banner fires (or an intended one
   is suppressed).
2. Sending the same message twice in a row is a no-op (no value change → no banner) — vary the
   text to repeat a notification.

## Rate limits

| Plan | Passes/mo | Custom color/logo | Price |
|---|---|---|---|
| Free | 1,000 | No | $0 |
| Pro | 100,000 | Yes | $39/mo |
| Business | 1,000,000 (soft) | Yes | $99/mo |

New accounts get a 30-day trial with Pro-tier features, then revert to Free unless subscribed.
Since branded logos are core to Repass's pitch, the WalletWallet account needs Pro or better
before real launch — `businesses.logo_url` will silently stop applying (API still accepts the
field but Free-plan behavior for it is unconfirmed; treat it as Pro-only per the docs) once the
trial lapses without a paid plan.

POST always counts against quota. PUT only counts when the body actually changes.
