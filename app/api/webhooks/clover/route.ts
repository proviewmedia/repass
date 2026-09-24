import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/points";
import { fetchOrderCustomerContact, fetchPayment, verifyWebhookAuth, type PosConnectionRow } from "@/lib/clover";

// Clover's payload groups events per merchant: { appId, merchants: { "<merchantId>": [{ objectId: "P:<id>", type, ts }] } }.
// This only says *something* changed — actual payment state needs a separate fetch, same "webhook is a nudge" pattern
// app/api/webhooks/square/route.ts already follows.
interface CloverWebhookPayload {
  appId?: string;
  merchants?: Record<string, Array<{ objectId?: string; type?: string }>>;
  verificationCode?: string;
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  let payload: CloverWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // One-time activation handshake: Clover POSTs a verificationCode when the
  // callback URL is first configured — log it so it can be pasted into
  // Clover's dashboard to activate the webhook. Not authenticated yet at this
  // point, since the Auth Code doesn't exist until activation completes.
  if (payload.verificationCode) {
    console.info(`Clover webhook verification code: ${payload.verificationCode}`);
    return NextResponse.json({ received: true });
  }

  const authHeader = request.headers.get("x-clover-auth");
  if (!verifyWebhookAuth(authHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  for (const [merchantId, events] of Object.entries(payload.merchants || {})) {
    const paymentIds = (events || [])
      .map((e) => e.objectId)
      .filter((id): id is string => Boolean(id?.startsWith("P:")))
      .map((id) => id.slice(2));

    if (paymentIds.length === 0) continue;

    const { data: connection } = await admin
      .from("pos_connections")
      .select("id, business_id, external_merchant_id, access_token, refresh_token, token_expires_at")
      .eq("provider", "clover")
      .eq("external_merchant_id", merchantId)
      .is("disconnected_at", null)
      .single<PosConnectionRow>();

    // No connection (or a disconnected one) for this merchant — nothing to do.
    // Not an error: Clover may still deliver events from before a disconnect.
    if (!connection) continue;

    for (const paymentId of paymentIds) {
      try {
        await processPayment(admin, connection, paymentId);
      } catch (err) {
        console.error(`Clover webhook processing failed for payment ${paymentId}`, err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function processPayment(
  admin: ReturnType<typeof createAdminClient>,
  connection: PosConnectionRow,
  paymentId: string,
) {
  const payment = await fetchPayment(connection, paymentId);
  if (payment.result !== "SUCCESS" || !payment.orderId) return;

  const contact = await fetchOrderCustomerContact(connection, payment.orderId);
  if (!contact || (!contact.phone && !contact.email)) return;

  const baseQuery = () =>
    admin
      .from("customers")
      .select("id, points_balance")
      .eq("business_id", connection.business_id)
      .is("removed_at", null);

  let customer = contact.phone ? (await baseQuery().eq("phone", contact.phone).maybeSingle()).data : null;
  if (!customer && contact.email) {
    customer = (await baseQuery().eq("email", contact.email).maybeSingle()).data;
  }

  if (!customer) return;

  await awardPoints({
    supabase: admin,
    customerId: customer.id,
    businessId: connection.business_id,
    source: "clover",
    externalEventId: paymentId,
  });
}
