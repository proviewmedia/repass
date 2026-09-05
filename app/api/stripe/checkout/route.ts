import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?redirectTo=/onboarding", request.url));
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, name, stripe_customer_id, owner_user_id")
    .eq("id", businessId)
    .single();

  if (error || !business || business.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  let customerId = business.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: business.name,
      metadata: { businessId: business.id },
    });
    customerId = customer.id;
    await supabase.from("businesses").update({ stripe_customer_id: customerId }).eq("id", business.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/onboarding?checkout=cancelled`,
    metadata: { businessId: business.id },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
