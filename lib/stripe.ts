import Stripe from "stripe";

// No apiVersion pinned here — defaults to whatever this installed SDK version
// ships as its own default, so it never drifts out of sync with the SDK.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
