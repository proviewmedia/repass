// Read-only diagnostic for the Clover award path. Reports what each step of
// the webhook's chain actually returns for the signed-in owner's own merchant,
// so a payment that awarded no point can be traced to the step that broke
// instead of guessed at. Owner-scoped: it can only ever read the Clover
// connection belonging to the caller's own business.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { diagnose, type PosConnectionRow } from "@/lib/clover";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Service role only to read the encrypted token columns, which RLS hides
  // from the owner's own client. Still filtered to that owner's business id.
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("pos_connections")
    .select("id, business_id, external_merchant_id, access_token, refresh_token, token_expires_at")
    .eq("provider", "clover")
    .eq("business_id", business.id)
    .is("disconnected_at", null)
    .single<PosConnectionRow>();

  if (!connection) {
    return NextResponse.json({ error: "No active Clover connection for this business" }, { status: 404 });
  }

  try {
    const result = await diagnose(connection);

    // The matching half of the answer: which of these contacts, if any,
    // corresponds to a customer actually enrolled in the loyalty program.
    const { data: enrolled } = await admin
      .from("customers")
      .select("id, email, phone")
      .eq("business_id", business.id)
      .is("removed_at", null);

    const matches = result.payments.map((p) => {
      const byEmail = enrolled?.find((c) => c.email && c.email === p.orderCustomerEmail);
      const byPhone = enrolled?.find((c) => c.phone && c.phone === p.orderCustomerPhone);
      const normalize = (v: string | null) => (v || "").replace(/\D/g, "").slice(-10) || null;
      const byPhoneNormalized = enrolled?.find(
        (c) => normalize(c.phone) && normalize(c.phone) === normalize(p.orderCustomerPhone),
      );
      return {
        paymentId: p.id,
        wouldAward: Boolean(byEmail || byPhone),
        matchedBy: byPhone ? "phone (exact)" : byEmail ? "email" : null,
        wouldAwardIfPhoneNormalized: Boolean(byEmail || byPhoneNormalized),
      };
    });

    return NextResponse.json({ ...result, enrolledCount: enrolled?.length ?? 0, matches });
  } catch (err) {
    return NextResponse.json(
      { error: "Clover API call failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
