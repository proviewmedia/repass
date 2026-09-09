import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, verifyState } from "@/lib/crypto";
import { createWebhookSubscription, exchangeCodeForToken, listLocationIds } from "@/lib/square";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const settingsUrl = new URL("/dashboard/settings/connections", appUrl);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    settingsUrl.searchParams.set("error", "Square declined the connection request.");
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state) {
    settingsUrl.searchParams.set("error", "Missing code or state from Square.");
    return NextResponse.redirect(settingsUrl);
  }

  const verified = verifyState(state);
  if (!verified) {
    settingsUrl.searchParams.set("error", "This connection link expired or is invalid — try connecting again.");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const { accessToken, refreshToken, merchantId, expiresAt } = await exchangeCodeForToken(code);
    const locationIds = await listLocationIds(accessToken);
    const { signatureKey } = await createWebhookSubscription(accessToken, `${appUrl}/api/webhooks/square`);

    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from("pos_connections")
      .upsert(
        {
          business_id: verified.businessId,
          provider: "square",
          external_merchant_id: merchantId,
          location_ids: locationIds,
          access_token: encrypt(accessToken),
          refresh_token: encrypt(refreshToken),
          token_expires_at: expiresAt,
          webhook_signature_key: encrypt(signatureKey),
          connected_at: new Date().toISOString(),
          disconnected_at: null,
        },
        { onConflict: "business_id,provider" },
      );

    if (upsertError) throw new Error(upsertError.message);
  } catch (err) {
    console.error("Square OAuth callback failed", err);
    settingsUrl.searchParams.set("error", "Couldn't finish connecting to Square. Please try again.");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connected", "square");
  return NextResponse.redirect(settingsUrl);
}
