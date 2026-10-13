import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Keeps the Supabase project out of the Free plan's inactivity pause.
//
// Supabase pauses a Free project that sees too little database activity over
// any 7-day window, and their docs put the bar at "a few user requests to the
// database each day over the previous week". A paused project means a
// merchant's loyalty program silently stops: no points awarded, no card
// updates, check-in page down, with no warning to them.
//
// This is a stopgap, not the fix. The actual fix is the Pro plan, which is
// never paused. See docs/compliance.md's launch notes.
//
// Three separate round trips rather than one, because the threshold is
// expressed in requests per day and a single daily query sits right at the
// edge of "too little".
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel sends this header on scheduled invocations when CRON_SECRET is set.
  // Without the check the endpoint is an open invitation to burn the database
  // quota this exists to protect.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    const [businesses, customers, events] = await Promise.all([
      admin.from("businesses").select("id", { count: "exact", head: true }),
      admin.from("customers").select("id", { count: "exact", head: true }),
      admin.from("point_events").select("id", { count: "exact", head: true }),
    ]);

    const firstError = businesses.error || customers.error || events.error;
    if (firstError) {
      // Logged loudly: a failing keep-alive is invisible otherwise, and the
      // symptom only shows up a week later as a paused project.
      console.error("[keep-alive] database query failed", firstError);
      return NextResponse.json({ ok: false, error: firstError.message }, { status: 500 });
    }

    console.info(
      `[keep-alive] ok businesses=${businesses.count ?? 0} customers=${customers.count ?? 0} events=${events.count ?? 0}`,
    );

    return NextResponse.json({
      ok: true,
      at: new Date().toISOString(),
      counts: {
        businesses: businesses.count ?? 0,
        customers: customers.count ?? 0,
        pointEvents: events.count ?? 0,
      },
    });
  } catch (err) {
    console.error("[keep-alive] failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
