import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/points";
import { fetchCustomerContact, fetchPayment, verifyWebhookSignature, type PosConnectionRow } from "@/lib/square";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signatureHeader = request.headers.get("x-square-hmacsha256-signature");

  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const valid = await verifyWebhookSignature({
    requestBody: body,
    signatureHeader,
    notificationUrl: `${appUrl}/api/webhooks/square`,
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: { merchant_id?: string; type?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const merchantId = payload.merchant_id;
  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchant_id" }, { status: 400 });
  }

  if (payload.type !== "payment.updated" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("pos_connections")
    .select("id, business_id, external_merchant_id, access_token, refresh_token, token_expires_at")
    .eq("provider", "square")
    .eq("external_merchant_id", merchantId)
    .is("disconnected_at", null)
    .single<PosConnectionRow>();

  // No connection (or a disconnected one) for this merchant — nothing to do.
  // Not an error: Square may still be delivering events from before a disconnect.
  if (!connection) {
    return NextResponse.json({ received: true });
  }

  const paymentId = payload.data.id;

  try {
    const payment = await fetchPayment(connection, paymentId);
    if (payment.status !== "COMPLETED" || !payment.customerId) {
      return NextResponse.json({ received: true });
    }

    const contact = await fetchCustomerContact(connection, payment.customerId);
    if (!contact.phone && !contact.email) {
      return NextResponse.json({ received: true });
    }

    const baseQuery = () =>
      admin.from("customers").select("id").eq("business_id", connection.business_id).is("removed_at", null);

    let customer = contact.phone ? (await baseQuery().eq("phone", contact.phone).maybeSingle()).data : null;
    if (!customer && contact.email) {
      customer = (await baseQuery().eq("email", contact.email).maybeSingle()).data;
    }

    if (!customer) {
      return NextResponse.json({ received: true });
    }

    await awardPoints({
      supabase: admin,
      customerId: customer.id,
      businessId: connection.business_id,
      source: "square",
      externalEventId: paymentId,
    });
  } catch (err) {
    console.error("Square webhook processing failed", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
