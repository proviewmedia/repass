import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, stripe_customer_id")
    .eq("owner_user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // No Stripe customer yet — this business hasn't subscribed. Send them to
  // checkout to pay instead of a billing portal, which only manages an
  // existing subscription.
  if (!business.stripe_customer_id) {
    return NextResponse.redirect(new URL(`/api/stripe/checkout?businessId=${business.id}`, request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const session = await getStripe().billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
