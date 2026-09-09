import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/points";
import {
  fetchCustomerContact,
  fetchOrderDiscountIds,
  fetchPayment,
  verifyWebhookSignature,
  type PosConnectionRow,
} from "@/lib/square";

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
      admin
        .from("customers")
        .select("id, points_balance")
        .eq("business_id", connection.business_id)
        .is("removed_at", null);

    let customer = contact.phone ? (await baseQuery().eq("phone", contact.phone).maybeSingle()).data : null;
    if (!customer && contact.email) {
      customer = (await baseQuery().eq("email", contact.email).maybeSingle()).data;
    }

    if (!customer) {
      return NextResponse.json({ received: true });
    }

    // A reward-discount applied to this order means "redemption attempt" —
    // resolved before deciding whether to earn, so the two are never both
    // applied for the same sale.
    const { data: linkedTiers } = await admin
      .from("reward_tiers")
      .select("id, points_cost, label, square_discount_id")
      .eq("business_id", connection.business_id)
      .is("archived_at", null)
      .not("square_discount_id", "is", null);

    let matchedTier: { points_cost: number; label: string } | null = null;
    if (linkedTiers && linkedTiers.length > 0 && payment.orderId) {
      const orderDiscountIds = await fetchOrderDiscountIds(connection, payment.orderId);
      matchedTier =
        linkedTiers.find((t) => t.square_discount_id && orderDiscountIds.includes(t.square_discount_id)) || null;
    }

    if (matchedTier) {
      if (customer.points_balance >= matchedTier.points_cost) {
        await awardPoints({
          supabase: admin,
          customerId: customer.id,
          businessId: connection.business_id,
          source: "square",
          delta: -matchedTier.points_cost,
          externalEventId: paymentId,
        });
      } else {
        console.info(
          `Skipped redemption for customer ${customer.id}: balance ${customer.points_balance} below tier cost ${matchedTier.points_cost}`,
        );
      }
    } else {
      await awardPoints({
        supabase: admin,
        customerId: customer.id,
        businessId: connection.business_id,
        source: "square",
        externalEventId: paymentId,
      });
    }
  } catch (err) {
    console.error("Square webhook processing failed", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
