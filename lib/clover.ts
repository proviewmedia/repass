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
// authorize URL takes redirect_uri explicitly.
//
// Confirmed by testing 2026-10-08: a Private app does NOT complete the
// self-service flow where a merchant picks their account after clicking. Clover
// uses install-then-launch instead — the merchant installs the app, opens it
// from their Clover dashboard, and Clover sends them to the Alternate Launch
// Path with ?merchant_id=...&client_id=... . We then start OAuth carrying that
// merchant_id, which is what Clover's authorize endpoint documents as required.
// Calling this without a merchantId redirects to Clover but never comes back.
// `origin` is passed in by the caller (which has the request) rather than read
// from NEXT_PUBLIC_APP_URL here. If that variable were ever unset or empty the
// redirect_uri would silently become a relative path, Clover would never return,
// and there'd be no error to find — exactly the failure that is hardest to debug.
export function buildAuthorizeUrl(state: string, origin: string, merchantId?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.CLOVER_APP_ID!,
    redirect_uri: `${origin}/api/clover/callback`,
    state,
  });
  if (merchantId) {
    params.set("merchant_id", merchantId);
  }
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

// Clover nests contact details in phoneNumbers[]/emailAddresses[] rather than
// putting them on the customer, but only when those fields are expanded. The
// flat fallbacks cover the shape some endpoints return directly.
function extractContact(customer: Record<string, unknown>): CloverCustomerContact {
  const phones = customer.phoneNumbers as { elements?: Array<{ phoneNumber?: string }> } | undefined;
  const emails = customer.emailAddresses as { elements?: Array<{ emailAddress?: string }> } | undefined;

  return {
    phone: phones?.elements?.[0]?.phoneNumber || (customer.phoneNumber as string) || null,
    email: emails?.elements?.[0]?.emailAddress || (customer.emailAddress as string) || null,
  };
}

// A Clover payment only references an order, not a customer, directly — the
// (optional) customer link lives on the order itself.
//
// This needs two hops, confirmed against a live Sandbox order 2026-10-08:
// expanding `customers` on an order returns a SHALLOW customer (identity
// fields only), so phone and email both come back null even when the customer
// genuinely has them. Clover caps expansion depth, so `customers.phoneNumbers`
// is not reachable from the order — the customer has to be re-fetched by id
// with its contact arrays expanded. Collapsing this back into one call is the
// bug that made a successful test payment award nothing.
export async function fetchOrderCustomerContact(
  connection: PosConnectionRow,
  orderId: string,
): Promise<CloverCustomerContact | null> {
  const data = (await apiFetch(connection, `/orders/${orderId}?expand=customers`)) as {
    customers?: { elements?: Array<Record<string, unknown>> };
  };
  const shallow = data.customers?.elements?.[0];
  if (!shallow) return null;

  // If the order response happened to carry contact details, use them rather
  // than spending a second request.
  const fromOrder = extractContact(shallow);
  if (fromOrder.phone || fromOrder.email) return fromOrder;

  const customerId = shallow.id as string | undefined;
  if (!customerId) return fromOrder;

  const full = (await apiFetch(
    connection,
    `/customers/${customerId}?expand=phoneNumbers,emailAddresses`,
  )) as Record<string, unknown>;

  return extractContact(full);
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

export interface CloverDiagnosis {
  merchantId: string;
  tokenRefreshed: boolean;
  payments: Array<{
    id: string;
    result: string;
    voided: boolean;
    amount: number | null;
    createdTime: string | null;
    orderId: string | null;
    orderHasCustomer: boolean;
    orderCustomerPhone: string | null;
    orderCustomerEmail: string | null;
  }>;
  directoryCustomerCount: number;
  directoryContacts: Array<{ email: string | null; phone: string | null }>;
}

// Walks the exact chain the webhook walks, for a merchant's most recent
// payments, and reports what each step actually returned. Exists because
// Clover does not document whether the Virtual Terminal's customer fields
// create a real Customer associated with the order, or are only receipt
// metadata on the payment — and the whole award path depends on which it is.
// Reading it from a live connection is the only way to know.
export async function diagnose(connection: PosConnectionRow): Promise<CloverDiagnosis> {
  const tokenRefreshed = new Date(connection.token_expires_at).getTime() - Date.now() <= REFRESH_MARGIN_MS;

  const paymentsData = (await apiFetch(connection, `/payments?expand=order&limit=5`)) as {
    elements?: Array<Record<string, unknown>>;
  };

  const payments: CloverDiagnosis["payments"] = [];
  for (const p of paymentsData.elements || []) {
    const order = p.order as { id?: string } | undefined;
    const orderId = order?.id || null;

    let orderHasCustomer = false;
    let orderCustomerPhone: string | null = null;
    let orderCustomerEmail: string | null = null;

    if (orderId) {
      const contact = await fetchOrderCustomerContact(connection, orderId);
      orderHasCustomer = contact !== null;
      orderCustomerPhone = contact?.phone ?? null;
      orderCustomerEmail = contact?.email ?? null;
    }

    payments.push({
      id: (p.id as string) || "",
      result: (p.result as string) || "",
      voided: Boolean(p.voided),
      amount: typeof p.amount === "number" ? p.amount : null,
      createdTime: typeof p.createdTime === "number" ? new Date(p.createdTime).toISOString() : null,
      orderId,
      orderHasCustomer,
      orderCustomerPhone,
      orderCustomerEmail,
    });
  }

  // Whether the payment created a Customer *record* is the other half of the
  // question: a new row here with the typed email means the VT does create
  // customers, even if it never links them to the order.
  const directory = await listCustomers(connection);

  return {
    merchantId: connection.external_merchant_id,
    tokenRefreshed,
    payments,
    directoryCustomerCount: directory.length,
    directoryContacts: directory.slice(0, 10).map((c) => ({ email: c.email, phone: c.phone })),
  };
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
