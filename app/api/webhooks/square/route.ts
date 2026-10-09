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
import { findEnrolledCustomer } from "@/lib/pos-matching";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signatureHeader = request.headers.get("x-square-hmacsha256-signature");

  if (!signatureHeader) {
    console.info("[square-webhook] rejected: no x-square-hmacsha256-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const notificationUrl = `${appUrl}/api/webhooks/square`;
  const valid = await verifyWebhookSignature({
    requestBody: body,
    signatureHeader,
    notificationUrl,
  });

  if (!valid) {
    // Square signs over the notification URL as well as the body, so this
    // fails for two different reasons that look identical from outside: the
    // signature key here belongs to a different subscription, or the URL
    // registered in Square is not character-for-character this one. Logging
    // the URL we verified against is what tells those apart.
    console.warn(`[square-webhook] rejected: signature did not verify against ${notificationUrl}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: { merchant_id?: string; type?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    console.warn("[square-webhook] rejected: body was not valid JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const merchantId = payload.merchant_id;
  if (!merchantId) {
    console.warn(`[square-webhook] rejected: no merchant_id; type=${payload.type || "(none)"}`);
    return NextResponse.json({ error: "Missing merchant_id" }, { status: 400 });
  }

  if (payload.type !== "payment.updated" || !payload.data?.id) {
    console.info(`[square-webhook] ignored: type=${payload.type || "(none)"} merchant=${merchantId}`);
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
    console.info(`[square-webhook] no active connection for merchant=${merchantId}`);
    return NextResponse.json({ received: true });
  }

  const paymentId = payload.data.id;

  try {
    const payment = await fetchPayment(connection, paymentId);
    if (payment.status !== "COMPLETED" || !payment.customerId) {
      console.info(
        `[square-webhook] payment=${paymentId} not awardable; status=${payment.status || "(empty)"} customerId=${payment.customerId || "none"}`,
      );
      return NextResponse.json({ received: true });
    }

    const contact = await fetchCustomerContact(connection, payment.customerId);
    if (!contact.phone && !contact.email) {
      console.info(`[square-webhook] payment=${paymentId} customer ${payment.customerId} has no phone or email`);
      return NextResponse.json({ received: true });
    }

    const { customer, basis, ambiguous } = await findEnrolledCustomer(admin, connection.business_id, contact);

    if (ambiguous) {
      console.warn(
        `[square-webhook] payment=${paymentId} multiple enrolled customers share the matched ${basis}; awarded to the longest-enrolled`,
      );
    }

    if (!customer) {
      console.info(`[square-webhook] payment=${paymentId} no enrolled customer matched for business=${connection.business_id}`);
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
