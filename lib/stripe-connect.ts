import { getStripe } from "@/lib/stripe";
import { decrypt } from "@/lib/crypto";

export interface StripeConnectionRow {
  id: string;
  business_id: string;
  stripe_account_id: string;
  access_token: string;
}

export function buildAuthorizeUrl(state: string): string {
  return getStripe().oauth.authorizeUrl({
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
    scope: "read_only",
    state,
  });
}

export async function exchangeCodeForToken(code: string) {
  const result = await getStripe().oauth.token({
    grant_type: "authorization_code",
    code,
  });
  if (!result.access_token || !result.stripe_user_id || !result.scope) {
    throw new Error("Stripe OAuth token exchange returned an incomplete response");
  }
  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token ?? null,
    stripeAccountId: result.stripe_user_id,
    scope: result.scope,
  };
}

export async function disconnectStripeAccount(stripeAccountId: string): Promise<void> {
  await getStripe().oauth.deauthorize({
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
    stripe_user_id: stripeAccountId,
  });
}

export interface StripeImportCustomer {
  email: string | null;
  name: string | null;
  phone: string | null;
}

// Pages through every customer on the connected account. Stripe caps list
// responses at 100 per page, so businesses with larger rosters need the
// has_more/starting_after loop, not just the first page.
export async function listStripeCustomers(connection: StripeConnectionRow): Promise<StripeImportCustomer[]> {
  const stripe = getStripe();
  const accessToken = decrypt(connection.access_token);
  const out: StripeImportCustomer[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.customers.list({ limit: 100, starting_after: startingAfter }, { apiKey: accessToken });
    for (const c of page.data) {
      out.push({ email: c.email ?? null, name: c.name ?? null, phone: c.phone ?? null });
    }
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1].id;
  }

  return out;
}
