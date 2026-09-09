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
    scope: "MERCHANT_PROFILE_READ CUSTOMERS_READ PAYMENTS_READ",
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
  webhook_signature_key: string;
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

// Square's dashboard-created webhook subscriptions can be scoped app-wide, but
// connections made through OAuth need their own subscription so each business
// gets its own signature key for verifying inbound events.
export async function createWebhookSubscription(accessToken: string, notificationUrl: string) {
  const result = await client(accessToken).webhooks.subscriptions.create({
    idempotencyKey: randomUUID(),
    subscription: {
      name: `repass-${Date.now()}`,
      eventTypes: ["payment.updated"],
      notificationUrl,
    },
  });
  if (!result.subscription?.id || !result.subscription?.signatureKey) {
    throw new Error("Square webhook subscription creation returned an incomplete response");
  }
  return { subscriptionId: result.subscription.id, signatureKey: result.subscription.signatureKey };
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
}

// Wraps a single Payments API call with a reactive refresh-on-401 fallback, in
// case the proactive refresh above was skipped or the token was invalidated early.
export async function fetchPayment(connection: PosConnectionRow, paymentId: string): Promise<SquarePaymentDetails> {
  const run = async (accessToken: string) => client(accessToken).payments.get({ paymentId });

  let accessToken = await getValidAccessToken(connection);
  try {
    const result = await run(accessToken);
    return { status: result.payment?.status || "", customerId: result.payment?.customerId || null };
  } catch (err) {
    const isUnauthorized = err instanceof Error && "statusCode" in err && (err as { statusCode?: number }).statusCode === 401;
    if (!isUnauthorized) throw err;
    accessToken = await refreshConnection(connection);
    const result = await run(accessToken);
    return { status: result.payment?.status || "", customerId: result.payment?.customerId || null };
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

export async function verifyWebhookSignature(params: {
  requestBody: string;
  signatureHeader: string;
  signatureKey: string;
  notificationUrl: string;
}): Promise<boolean> {
  return WebhooksHelper.verifySignature(params);
}
