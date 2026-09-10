import { randomUUID } from "crypto";
import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";
import { decrypt, encrypt } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function squareEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
}

function oauthBaseUrl(): string {
  return squareEnvironment() === SquareEnvironment.Production
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SQUARE_APPLICATION_ID!,
    scope: "MERCHANT_PROFILE_READ CUSTOMERS_READ PAYMENTS_READ ORDERS_READ ITEMS_READ ITEMS_WRITE",
    session: "false",
    state,
  });
  return `${oauthBaseUrl()}/oauth2/authorize?${params.toString()}`;
}

export interface PosConnectionRow {
  id: string;
  business_id: string;
  external_merchant_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

function client(accessToken: string): SquareClient {
  return new SquareClient({ token: accessToken, environment: squareEnvironment() });
}

export async function exchangeCodeForToken(code: string) {
  const oauthClient = new SquareClient({ environment: squareEnvironment() });
  const result = await oauthClient.oAuth.obtainToken({
    clientId: process.env.SQUARE_APPLICATION_ID!,
    clientSecret: process.env.SQUARE_APPLICATION_SECRET!,
    code,
    grantType: "authorization_code",
  });
  if (!result.accessToken || !result.refreshToken || !result.merchantId || !result.expiresAt) {
    throw new Error("Square token exchange returned an incomplete response");
  }
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    merchantId: result.merchantId,
    expiresAt: result.expiresAt,
  };
}

export async function listLocationIds(accessToken: string): Promise<string[]> {
  const result = await client(accessToken).locations.list();
  return (result.locations || []).map((l) => l.id!).filter(Boolean);
}

// Access tokens expire in 30 days. Proactively refresh with a few days of
// headroom so a slow-to-arrive webhook doesn't race an about-to-expire token.
const REFRESH_MARGIN_MS = 3 * 24 * 60 * 60 * 1000;

async function refreshConnection(connection: PosConnectionRow) {
  const admin = createAdminClient();
  const oauthClient = new SquareClient({ environment: squareEnvironment() });
  const result = await oauthClient.oAuth.obtainToken({
    clientId: process.env.SQUARE_APPLICATION_ID!,
    clientSecret: process.env.SQUARE_APPLICATION_SECRET!,
    refreshToken: decrypt(connection.refresh_token),
    grantType: "refresh_token",
  });
  if (!result.accessToken || !result.refreshToken || !result.expiresAt) {
    throw new Error("Square token refresh returned an incomplete response");
  }
  await admin
    .from("pos_connections")
    .update({
      access_token: encrypt(result.accessToken),
      refresh_token: encrypt(result.refreshToken),
      token_expires_at: result.expiresAt,
    })
    .eq("id", connection.id);
  return result.accessToken;
}

export async function getValidAccessToken(connection: PosConnectionRow): Promise<string> {
  const expiresInMs = new Date(connection.token_expires_at).getTime() - Date.now();
  if (expiresInMs > REFRESH_MARGIN_MS) {
    return decrypt(connection.access_token);
  }
  return refreshConnection(connection);
}

export interface SquarePaymentDetails {
  status: string;
  customerId: string | null;
  orderId: string | null;
}

// Wraps a single Payments API call with a reactive refresh-on-401 fallback, in
// case the proactive refresh above was skipped or the token was invalidated early.
export async function fetchPayment(connection: PosConnectionRow, paymentId: string): Promise<SquarePaymentDetails> {
  const run = async (accessToken: string) => client(accessToken).payments.get({ paymentId });

  const toDetails = (result: Awaited<ReturnType<typeof run>>): SquarePaymentDetails => ({
    status: result.payment?.status || "",
    customerId: result.payment?.customerId || null,
    orderId: result.payment?.orderId || null,
  });

  let accessToken = await getValidAccessToken(connection);
  try {
    return toDetails(await run(accessToken));
  } catch (err) {
    const isUnauthorized = err instanceof Error && "statusCode" in err && (err as { statusCode?: number }).statusCode === 401;
    if (!isUnauthorized) throw err;
    accessToken = await refreshConnection(connection);
    return toDetails(await run(accessToken));
  }
}

export interface SquareCustomerContact {
  phone: string | null;
  email: string | null;
}

export async function fetchCustomerContact(
  connection: PosConnectionRow,
  customerId: string,
): Promise<SquareCustomerContact> {
  const accessToken = await getValidAccessToken(connection);
  const result = await client(accessToken).customers.get({ customerId });
  return {
    phone: result.customer?.phoneNumber || null,
    email: result.customer?.emailAddress || null,
  };
}

export interface SquareDiscount {
  id: string;
  name: string;
}

// Lists the merchant's existing Catalog discounts, for the "pick an existing
// discount" step of linking a reward tier to Square.
export async function listDiscounts(connection: PosConnectionRow): Promise<SquareDiscount[]> {
  const accessToken = await getValidAccessToken(connection);
  const pager = await client(accessToken).catalog.list({ types: "DISCOUNT" });
  const out: SquareDiscount[] = [];
  for await (const obj of pager) {
    if (obj.type !== "DISCOUNT" || !obj.id) continue;
    out.push({ id: obj.id, name: obj.discountData?.name || "Untitled discount" });
  }
  return out;
}

export interface SquareCustomer {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

// Lists every customer in the merchant's Square Customer Directory, for
// importing them into a business's loyalty program in one action.
export async function listCustomers(connection: PosConnectionRow): Promise<SquareCustomer[]> {
  const accessToken = await getValidAccessToken(connection);
  const pager = await client(accessToken).customers.list();
  const out: SquareCustomer[] = [];
  for await (const c of pager) {
    out.push({
      firstName: c.givenName ?? null,
      lastName: c.familyName ?? null,
      email: c.emailAddress ?? null,
      phone: c.phoneNumber ?? null,
    });
  }
  return out;
}

export interface CreateDiscountParams {
  name: string;
  kind: "fixed_amount" | "fixed_percentage";
  /** Whole-cent integer. Required when kind is "fixed_amount". */
  amountCents?: number;
  /** Decimal string, e.g. "100" for 100% off. Required when kind is "fixed_percentage". */
  percentage?: string;
}

// Creates a new Catalog discount via batchUpsert, so a business never has to
// leave Repass to set up a reward's Square side. Square has no "free item"
// discount type — a free-item reward should use a fixed amount matching the
// item's price, or a 100% fixed percentage.
export async function createDiscount(connection: PosConnectionRow, params: CreateDiscountParams): Promise<SquareDiscount> {
  const accessToken = await getValidAccessToken(connection);
  const result = await client(accessToken).catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [
      {
        objects: [
          {
            type: "DISCOUNT",
            id: "#repass-reward-discount",
            discountData: {
              name: params.name,
              discountType: params.kind === "fixed_amount" ? "FIXED_AMOUNT" : "FIXED_PERCENTAGE",
              ...(params.kind === "fixed_amount"
                ? { amountMoney: { amount: BigInt(params.amountCents ?? 0), currency: "USD" } }
                : { percentage: params.percentage ?? "100" }),
            },
          },
        ],
      },
    ],
  });

  const created = result.objects?.[0];
  if (!created?.id) {
    throw new Error("Square did not return the created discount");
  }
  return { id: created.id, name: params.name };
}

// Fetches an order's applied Catalog discount ids, to check against a
// business's reward-tier links.
export async function fetchOrderDiscountIds(connection: PosConnectionRow, orderId: string): Promise<string[]> {
  const accessToken = await getValidAccessToken(connection);
  const result = await client(accessToken).orders.get({ orderId });
  return (result.order?.discounts || [])
    .map((d) => d.catalogObjectId)
    .filter((id): id is string => Boolean(id));
}

// Webhook subscriptions belong to the application, not to individual connected
// merchants (Square rejects subscription-management calls made with a merchant's
// OAuth token). So there is exactly one subscription for all of Repass, created
// once in the Square Developer Dashboard, with one signature key for the whole app.
export async function verifyWebhookSignature(params: {
  requestBody: string;
  signatureHeader: string;
  notificationUrl: string;
}): Promise<boolean> {
  return WebhooksHelper.verifySignature({
    ...params,
    signatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!,
  });
}
