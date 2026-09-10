import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, verifyState } from "@/lib/crypto";
import { exchangeCodeForToken } from "@/lib/stripe-connect";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const settingsUrl = new URL("/dashboard/settings/connections", appUrl);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    settingsUrl.searchParams.set("error", "Stripe declined the connection request.");
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state) {
    settingsUrl.searchParams.set("error", "Missing code or state from Stripe.");
    return NextResponse.redirect(settingsUrl);
  }

  const verified = verifyState(state);
  if (!verified) {
    settingsUrl.searchParams.set("error", "This connection link expired or is invalid — try connecting again.");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const { accessToken, refreshToken, stripeAccountId, scope } = await exchangeCodeForToken(code);

    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from("stripe_connections")
      .upsert(
        {
          business_id: verified.businessId,
          stripe_account_id: stripeAccountId,
          access_token: encrypt(accessToken),
          refresh_token: refreshToken ? encrypt(refreshToken) : null,
          scope,
          connected_at: new Date().toISOString(),
          disconnected_at: null,
        },
        { onConflict: "business_id" },
      );

    if (upsertError) throw new Error(upsertError.message);
  } catch (err) {
    console.error("Stripe Connect OAuth callback failed", err);
    settingsUrl.searchParams.set("error", "Couldn't finish connecting to Stripe. Please try again.");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connected", "stripe");
  return NextResponse.redirect(settingsUrl);
}
