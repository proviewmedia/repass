import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/points";
import { fetchPaymentContact } from "@/lib/stripe-connect";

// Separate from app/api/webhooks/stripe/route.ts, which handles Repass's own
// subscription billing. Connect events come from *connected* accounts, arrive
// at their own endpoint with their own signing secret, and carry the account
// id in `event.account`.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const accountId = event.account;
  if (!accountId) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  if (event.type === "account.application.deauthorized") {
    // The merchant revoked access from Stripe's side — reflect it here so the
    // Connections page doesn't keep claiming they're connected.
    await admin
      .from("pos_connections")
      .update({ disconnected_at: new Date().toISOString() })
      .eq("provider", "stripe")
      .eq("external_merchant_id", accountId)
      .is("disconnected_at", null);

    return NextResponse.json({ received: true });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const { data: connection } = await admin
    .from("pos_connections")
    .select("id, business_id, external_merchant_id")
    .eq("provider", "stripe")
    .eq("external_merchant_id", accountId)
    .is("disconnected_at", null)
    .single<{ id: string; business_id: string; external_merchant_id: string }>();

  // No connection (or a disconnected one) for this account — nothing to do.
  // Not an error: Stripe may still deliver events from before a disconnect.
  if (!connection) {
    return NextResponse.json({ received: true });
  }

  const paymentIntentId = (event.data.object as Stripe.PaymentIntent).id;

  try {
    const contact = await fetchPaymentContact(accountId, paymentIntentId);
    if (!contact.email && !contact.phone) {
      return NextResponse.json({ received: true });
    }

    const baseQuery = () =>
      admin
        .from("customers")
        .select("id, points_balance")
        .eq("business_id", connection.business_id)
        .is("removed_at", null);

    // Email first here (unlike Square/Clover, which lead with phone) — a
    // Stripe payment almost always carries an email and often no phone.
    let customer = contact.email ? (await baseQuery().eq("email", contact.email).maybeSingle()).data : null;
    if (!customer && contact.phone) {
      customer = (await baseQuery().eq("phone", contact.phone).maybeSingle()).data;
    }

    if (!customer) {
      return NextResponse.json({ received: true });
    }

    await awardPoints({
      supabase: admin,
      customerId: customer.id,
      businessId: connection.business_id,
      source: "stripe",
      externalEventId: paymentIntentId,
    });
  } catch (err) {
    console.error(`Stripe Connect webhook processing failed for payment ${paymentIntentId}`, err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
