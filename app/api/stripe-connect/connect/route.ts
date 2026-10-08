import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signState } from "@/lib/crypto";
import { buildAuthorizeUrl } from "@/lib/stripe-connect";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?redirectTo=/dashboard/settings/connections", request.url));
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (error || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const state = signState(business.id);
  return NextResponse.redirect(buildAuthorizeUrl(state));
}
