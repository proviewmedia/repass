// Stripe Connect (read-only): a business links their *own* Stripe account so a
// completed payment can award a loyalty point. Distinct from lib/stripe.ts,
// which is Repass's own account billing businesses their subscription.
//
// Deliberately thinner than lib/square.ts and lib/clover.ts: Stripe's OAuth
// token exchange now returns only the connected account's id — access_token
// and refresh_token are deprecated in favour of calling the API with our
// platform secret key plus a Stripe-Account header (the `stripeAccount`
// request option used throughout below). So there are no tokens to encrypt,
// refresh, or expire, and pos_connections rows for Stripe carry null in all
// three token columns.

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// Takes the origin from the caller (which has the request) rather than relying
// on NEXT_PUBLIC_APP_URL alone: an unset value would silently produce a
// relative redirect_uri and a connect flow that never returns.
function redirectUri(origin: string): string {
  return `${origin}/api/stripe-connect/callback`;
}

// read_only is everything Repass needs (read payments, read customers). It
// also keeps the merchant's consent screen honest, and avoids Stripe's
// restriction barring read_write from connecting to Standard accounts that
// are already controlled by another platform.
export function buildAuthorizeUrl(state: string, origin: string): string {
  return getStripe().oauth.authorizeUrl({
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID,
    response_type: "code",
    scope: "read_only",
    redirect_uri: redirectUri(origin),
    state,
  });
}

export async function exchangeCodeForAccountId(code: string): Promise<string> {
  const response = await getStripe().oauth.token({ grant_type: "authorization_code", code });
  if (!response.stripe_user_id) {
    throw new Error("Stripe token exchange returned no account id");
  }
  return response.stripe_user_id;
}

// Revokes on Stripe's side too, so disconnecting in Repass actually ends the
// grant rather than just marking our row.
export async function deauthorize(accountId: string): Promise<void> {
  await getStripe().oauth.deauthorize({
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID,
    stripe_user_id: accountId,
  });
}

// Stripe stores a single `name`; Repass stores first/last separately.
function splitName(name: string | null): { firstName: string | null; lastName: string | null } {
  const trimmed = (name || "").trim();
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

export interface StripeConnectCustomer {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

// Every customer in the connected account's directory, for the one-click
// import — same shape listCustomers returns in lib/square.ts and lib/clover.ts.
export async function listCustomers(accountId: string): Promise<StripeConnectCustomer[]> {
  const out: StripeConnectCustomer[] = [];

  for await (const customer of getStripe().customers.list({ limit: 100 }, { stripeAccount: accountId })) {
    const { firstName, lastName } = splitName(customer.name ?? null);
    out.push({ firstName, lastName, email: customer.email ?? null, phone: customer.phone ?? null });
  }

  return out;
}

export interface StripeConnectContact {
  email: string | null;
  phone: string | null;
}

// Resolves who paid, so the webhook can match them to an enrolled customer.
// Which field is actually populated depends on how the merchant collects
// payment (Checkout, Payment Links, Terminal, a custom form), so this reads
// the three plausible sources in order rather than assuming one — worth
// confirming against a real test payment once a live account is connected.
export async function fetchPaymentContact(
  accountId: string,
  paymentIntentId: string,
): Promise<StripeConnectContact> {
  const intent = await getStripe().paymentIntents.retrieve(
    paymentIntentId,
    { expand: ["latest_charge", "customer"] },
    { stripeAccount: accountId },
  );

  const charge = intent.latest_charge as Stripe.Charge | null;
  const customer = intent.customer as Stripe.Customer | Stripe.DeletedCustomer | null;
  const liveCustomer = customer && !customer.deleted ? (customer as Stripe.Customer) : null;

  return {
    email: intent.receipt_email || charge?.billing_details?.email || liveCustomer?.email || null,
    phone: charge?.billing_details?.phone || liveCustomer?.phone || null,
  };
}
