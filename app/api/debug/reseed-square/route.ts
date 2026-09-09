import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";

// TEMPORARY debug route — reactivates the existing Sandbox pos_connections row
// with a known-good access token, bypassing Square's broken authorize page.
// Delete this file after use.
export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();
  if (!accessToken) {
    return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
  }

  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await admin
    .from("pos_connections")
    .update({
      access_token: encrypt(accessToken),
      refresh_token: encrypt("sandbox-placeholder-refresh-token"),
      token_expires_at: expiresAt,
      disconnected_at: null,
      connected_at: new Date().toISOString(),
    })
    .eq("provider", "square");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expiresAt });
}
