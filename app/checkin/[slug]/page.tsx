import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkinCookieName, CHECKIN_COOLDOWN_MS } from "@/lib/checkin";
import { checkIn, linkByPhone } from "./actions";

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; success?: string; points?: string; alreadyCheckedIn?: string };
}) {
  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, program_name, reward_threshold, reward_description, subscription_status")
    .eq("slug", params.slug)
    .single();

  if (!business) {
    notFound();
  }

  const closed = business!.subscription_status !== "active";

  const cookieStore = await cookies();
  const customerId = cookieStore.get(checkinCookieName(business!.id))?.value;

  let customer: { id: string; name: string; points_balance: number; last_checkin_at: string | null } | null = null;
  if (customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id, name, points_balance, last_checkin_at")
      .eq("id", customerId)
      .eq("business_id", business!.id)
      .single();
    customer = data;
  }

  const onCooldown =
    searchParams.alreadyCheckedIn === "1" ||
    (customer?.last_checkin_at &&
      Date.now() - new Date(customer.last_checkin_at).getTime() < CHECKIN_COOLDOWN_MS);

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1>{business!.program_name || business!.name}</h1>
          <p className="auth-sub">
            Earn a point every visit — {business!.reward_threshold} points gets you {business!.reward_description}.
          </p>

          {searchParams.error && <p className="auth-error" style={{ marginTop: 20 }}>{searchParams.error}</p>}

          {closed ? (
            <p className="auth-note">This program isn&apos;t accepting check-ins right now.</p>
          ) : searchParams.success === "1" ? (
            <p className="auth-note">
              You earned a point! You&apos;re now at {searchParams.points} points. Check your wallet pass for the
              update.
            </p>
          ) : onCooldown ? (
            <p className="auth-note">
              You&apos;re already checked in for today{customer ? ` — ${customer.points_balance} points` : ""}.
              Come back on your next visit.
            </p>
          ) : customer ? (
            <form action={checkIn.bind(null, params.slug, customer.id)} className="auth-form">
              <p className="auth-sub" style={{ marginTop: 0 }}>
                Welcome back, {customer.name}. You have {customer.points_balance} points.
              </p>
              <button type="submit" className="btn">
                Check in &amp; earn a point
              </button>
            </form>
          ) : (
            <form action={linkByPhone.bind(null, params.slug)} className="auth-form">
              <label>
                Phone number you signed up with
                <input type="tel" name="phone" required autoComplete="tel" />
              </label>
              <button type="submit" className="btn">
                Find my card
              </button>
              <p className="auth-alt">
                Not signed up yet? <a href={`/join/${params.slug}`}>Join the program</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
