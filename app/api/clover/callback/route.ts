import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, verifyState } from "@/lib/crypto";
import { exchangeCodeForToken } from "@/lib/clover";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const settingsUrl = new URL("/dashboard/settings/connections", appUrl);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const merchantId = request.nextUrl.searchParams.get("merchant_id");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    settingsUrl.searchParams.set("error", "Clover declined the connection request.");
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state || !merchantId) {
    settingsUrl.searchParams.set("error", "Missing code, state, or merchant_id from Clover.");
    return NextResponse.redirect(settingsUrl);
  }

  const verified = verifyState(state);
  if (!verified) {
    settingsUrl.searchParams.set("error", "This connection link expired or is invalid — try connecting again.");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForToken(code);

    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from("pos_connections")
      .upsert(
        {
          business_id: verified.businessId,
          provider: "clover",
          external_merchant_id: merchantId,
          location_ids: [],
          access_token: encrypt(accessToken),
          refresh_token: encrypt(refreshToken),
          token_expires_at: expiresAt,
          connected_at: new Date().toISOString(),
          disconnected_at: null,
        },
        { onConflict: "business_id,provider" },
      );

    if (upsertError) throw new Error(upsertError.message);
  } catch (err) {
    console.error("Clover OAuth callback failed", err);
    settingsUrl.searchParams.set("error", "Couldn't finish connecting to Clover. Please try again.");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connected", "clover");
  return NextResponse.redirect(settingsUrl);
}
