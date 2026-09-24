// Client for the Clover REST API (https://docs.clover.com/dev/) — mirrors
// lib/square.ts's shape, but Clover's OAuth and object model differ in a few
// real ways documented inline below (grounded against docs.clover.com, not
// guessed). US only for now, matching Repass's current single-market scope.

import { timingSafeEqual } from "crypto";
import { decrypt, encrypt } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function cloverEnvironment(): "sandbox" | "production" {
  return process.env.CLOVER_ENVIRONMENT === "production" ? "production" : "sandbox";
}

function authorizeBaseUrl(): string {
  return cloverEnvironment() === "production" ? "https://www.clover.com" : "https://sandbox.dev.clover.com";
}

function apiBaseUrl(): string {
  return cloverEnvironment() === "production" ? "https://api.clover.com" : "https://apisandbox.dev.clover.com";
}

// Unlike Square (redirect URI is fixed in the app's dashboard config), Clover's
// authorize URL takes redirect_uri explicitly. Whether this self-service,
// merchant-picks-their-account-after-clicking flow is reachable for a Private
// app (vs. requiring the merchant to start from inside their own Clover
// Dashboard) is unconfirmed by Clover's public docs — this is the first real
// test once CLOVER_APP_ID/SECRET are live.
export function buildAuthorizeUrl(state: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const params = new URLSearchParams({
    client_id: process.env.CLOVER_APP_ID!,
    redirect_uri: `${appUrl}/api/clover/callback`,
    state,
  });
  return `${authorizeBaseUrl()}/oauth/v2/authorize?${params.toString()}`;
}

export interface PosConnectionRow {
  id: string;
  business_id: string;
  external_merchant_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch(`${apiBaseUrl()}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.CLOVER_APP_ID,
      client_secret: process.env.CLOVER_APP_SECRET,
      code,
    }),
  });
  if (!res.ok) {
    throw new Error(`Clover token exchange failed: ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.access_token || !data.refresh_token || !data.access_token_expiration) {
    throw new Error("Clover token exchange returned an incomplete response");
  }
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    // Clover returns Unix seconds, not a duration like Square's expiresAt —
    // convert to the same ISO-string shape token_expires_at already stores.
    expiresAt: new Date(data.access_token_expiration * 1000).toISOString(),
  };
}

async function refreshConnection(connection: PosConnectionRow): Promise<string> {
  const admin = createAdminClient();
  const res = await fetch(`${apiBaseUrl()}/oauth/v2/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.CLOVER_APP_ID,
      refresh_token: decrypt(connection.refresh_token),
    }),
  });
  if (!res.ok) {
    throw new Error(`Clover token refresh failed: ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.access_token || !data.refresh_token || !data.access_token_expiration) {
    throw new Error("Clover token refresh returned an incomplete response");
  }
  const expiresAt = new Date(data.access_token_expiration * 1000).toISOString();
  await admin
    .from("pos_connections")
    .update({
      access_token: encrypt(data.access_token),
      refresh_token: encrypt(data.refresh_token),
      token_expires_at: expiresAt,
    })
    .eq("id", connection.id);
  return data.access_token as string;
}

// Clover access tokens live ~30 minutes (vs. Square's 30 days) — a small
// buffer is enough here; Square's multi-day proactive margin would refresh
// on nearly every call if reused as-is.
const REFRESH_MARGIN_MS = 60 * 1000;

export async function getValidAccessToken(connection: PosConnectionRow): Promise<string> {
  const expiresInMs = new Date(connection.token_expires_at).getTime() - Date.now();
  if (expiresInMs > REFRESH_MARGIN_MS) {
    return decrypt(connection.access_token);
  }
  return refreshConnection(connection);
}

async function apiFetch(connection: PosConnectionRow, path: string): Promise<unknown> {
  const run = async (accessToken: string) => {
    const res = await fetch(`${apiBaseUrl()}/v3/merchants/${connection.external_merchant_id}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { res, accessToken };
  };

  let { res } = await run(await getValidAccessToken(connection));
  if (res.status === 401) {
    ({ res } = await run(await refreshConnection(connection)));
  }
  if (!res.ok) {
    throw new Error(`Clover API request failed (${res.status}): ${path}`);
  }
  return res.json();
}

export interface CloverPaymentDetails {
  /** Documented value seen for a successful sale: "SUCCESS". */
  result: string;
  orderId: string | null;
}

export async function fetchPayment(connection: PosConnectionRow, paymentId: string): Promise<CloverPaymentDetails> {
  const data = (await apiFetch(connection, `/payments/${paymentId}`)) as { result?: string; order?: { id?: string } };
  return { result: data.result || "", orderId: data.order?.id || null };
}

export interface CloverCustomerContact {
  phone: string | null;
  email: string | null;
}

// A Clover payment only references an order, not a customer, directly — the
// (optional) customer link lives on the order itself. NEEDS CONFIRMING against
// a real Sandbox order+customer response: the exact expand param, and whether
// phone/email sit directly on the customer object or nested in
// phoneNumbers[]/emailAddresses[] arrays (Clover's usual shape elsewhere) —
// this reads both defensively until verified live.
export async function fetchOrderCustomerContact(
  connection: PosConnectionRow,
  orderId: string,
): Promise<CloverCustomerContact | null> {
  const data = (await apiFetch(connection, `/orders/${orderId}?expand=customers`)) as {
    customers?: { elements?: Array<Record<string, unknown>> };
  };
  const customer = data.customers?.elements?.[0];
  if (!customer) return null;

  const phones = customer.phoneNumbers as { elements?: Array<{ phoneNumber?: string }> } | undefined;
  const emails = customer.emailAddresses as { elements?: Array<{ emailAddress?: string }> } | undefined;

  return {
    phone: phones?.elements?.[0]?.phoneNumber || (customer.phoneNumber as string) || null,
    email: emails?.elements?.[0]?.emailAddress || (customer.emailAddress as string) || null,
  };
}

export interface CloverCustomer {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

// Lists every customer in the merchant's Clover Customer Directory, for
// importing them into a business's loyalty program in one action — same
// purpose as lib/square.ts's listCustomers.
export async function listCustomers(connection: PosConnectionRow): Promise<CloverCustomer[]> {
  const out: CloverCustomer[] = [];
  const limit = 100;
  let offset = 0;

  for (;;) {
    const data = (await apiFetch(
      connection,
      `/customers?expand=phoneNumbers,emailAddresses&limit=${limit}&offset=${offset}`,
    )) as { elements?: Array<Record<string, unknown>> };
    const elements = data.elements || [];

    for (const c of elements) {
      const phones = c.phoneNumbers as { elements?: Array<{ phoneNumber?: string }> } | undefined;
      const emails = c.emailAddresses as { elements?: Array<{ emailAddress?: string }> } | undefined;
      out.push({
        firstName: (c.firstName as string) ?? null,
        lastName: (c.lastName as string) ?? null,
        email: emails?.elements?.[0]?.emailAddress ?? null,
        phone: phones?.elements?.[0]?.phoneNumber ?? null,
      });
    }

    if (elements.length < limit) break;
    offset += limit;
  }

  return out;
}

// Unlike Square's computed HMAC signature, Clover's webhook auth is a static
// per-app "Auth Code" (from App Settings > Webhooks, after the one-time
// verificationCode handshake) sent as-is in every delivery — verified with a
// direct constant-time comparison, not a signature computation.
export function verifyWebhookAuth(header: string | null): boolean {
  const expected = process.env.CLOVER_WEBHOOK_AUTH_CODE;
  if (!header || !expected) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
