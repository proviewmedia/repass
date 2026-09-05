import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBusinessWelcomeEmail } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const businessId = session.metadata?.businessId;
      if (businessId && session.subscription) {
        await supabase
          .from("businesses")
          .update({
            stripe_subscription_id: String(session.subscription),
            subscription_status: "active",
          })
          .eq("id", businessId);

        const { data: business } = await supabase
          .from("businesses")
          .select("name, owner_user_id")
          .eq("id", businessId)
          .single();

        if (business) {
          const { data: owner } = await supabase.auth.admin.getUserById(business.owner_user_id);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL;
          if (owner.user?.email && appUrl) {
            await sendBusinessWelcomeEmail(owner.user.email, business.name, `${appUrl}/dashboard`).catch((err) =>
              console.error("Failed to send business welcome email", err),
            );
          }
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("businesses")
        .update({ subscription_status: subscription.status })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
