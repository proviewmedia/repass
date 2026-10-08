// Read-only diagnostic for the Clover award path. Reports what each step of
// the webhook's chain actually returns for the signed-in owner's own merchant,
// so a payment that awarded no point can be traced to the step that broke
// instead of guessed at. Owner-scoped: it can only ever read the Clover
// connection belonging to the caller's own business.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { diagnose, type PosConnectionRow } from "@/lib/clover";
import { findEnrolledCustomer } from "@/lib/pos-matching";

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

    // Calls the same matcher the webhooks call rather than reimplementing it,
    // so the diagnostic can never report an outcome the real path wouldn't
    // produce — the whole value of this endpoint rests on them agreeing.
    const matches = [];
    for (const p of result.payments) {
      const match = await findEnrolledCustomer(admin, business.id, {
        email: p.orderCustomerEmail,
        phone: p.orderCustomerPhone,
      });
      matches.push({
        paymentId: p.id,
        wouldAward: match.customer !== null,
        matchedBy: match.basis,
        ambiguous: match.ambiguous,
        customerId: match.customer?.id ?? null,
      });
    }

    const { count: enrolledCount } = await admin
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .is("removed_at", null);

    return NextResponse.json({ ...result, enrolledCount: enrolledCount ?? 0, matches });
  } catch (err) {
    return NextResponse.json(
      { error: "Clover API call failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
