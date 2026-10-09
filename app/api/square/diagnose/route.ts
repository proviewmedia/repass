// Read-only diagnostic for the Square award path, mirroring
// app/api/clover/diagnose/route.ts. Owner-scoped: it can only read the Square
// connection belonging to the caller's own business.
//
// It cannot verify the webhook signature key, which only a real delivered
// webhook exercises. Everything up to that point it can check.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { diagnose, type PosConnectionRow } from "@/lib/square";
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

  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("pos_connections")
    .select("id, business_id, external_merchant_id, access_token, refresh_token, token_expires_at")
    .eq("provider", "square")
    .eq("business_id", business.id)
    .is("disconnected_at", null)
    .single<PosConnectionRow>();

  if (!connection) {
    return NextResponse.json({ error: "No active Square connection for this business" }, { status: 404 });
  }

  try {
    const result = await diagnose(connection);

    // Same matcher the webhook uses, so the diagnostic cannot report an
    // outcome the real path wouldn't produce.
    const matches = [];
    for (const p of result.payments) {
      const match = await findEnrolledCustomer(admin, business.id, {
        email: p.customerEmail,
        phone: p.customerPhone,
      });
      matches.push({
        paymentId: p.id,
        // The webhook only acts on COMPLETED payments carrying a customer.
        wouldAward: p.status === "COMPLETED" && match.customer !== null,
        blockedBy:
          p.status !== "COMPLETED"
            ? `payment status is ${p.status}`
            : !p.customerId
              ? "no customer attached to the payment"
              : match.customer === null
                ? "customer is not enrolled in the loyalty program"
                : null,
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

    return NextResponse.json({
      ...result,
      enrolledCount: enrolledCount ?? 0,
      matches,
      note: "The webhook signature key cannot be checked here; only a real delivered webhook exercises it.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Square API call failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
