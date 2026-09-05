import Stripe from "stripe";

let cached: Stripe | null = null;

// Lazily constructed so importing this module doesn't require
// STRIPE_SECRET_KEY at build time — only when a Stripe call actually runs.
// No apiVersion pinned — defaults to whatever this installed SDK ships as
// its own default, so it never drifts out of sync with the SDK.
export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return cached;
}
