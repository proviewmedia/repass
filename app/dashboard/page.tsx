import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { addPoint, signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, subscription_status, reward_threshold, reward_description, points_per_action")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, points_balance, created_at")
    .eq("business_id", business!.id)
    .order("created_at", { ascending: false });

  const headersList = headers();
  const host = headersList.get("host");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "");
  const joinUrl = `${appUrl}/join/${business!.slug}`;
  const checkinUrl = `${appUrl}/checkin/${business!.slug}`;
  const [joinQr, checkinQr] = await Promise.all([
    QRCode.toDataURL(joinUrl, { margin: 1, width: 220 }),
    QRCode.toDataURL(checkinUrl, { margin: 1, width: 220 }),
  ]);
  const active = business!.subscription_status === "active";

  return (
    <main className="dash">
      <div className="wrap">
        <div className="dash-head">
          <div>
            <h1>{business!.name}</h1>
            <p className="auth-sub">
              {business!.points_per_action} pt/visit · {business!.reward_threshold} pts = {business!.reward_description}
            </p>
          </div>
          <div className="dash-head-actions">
            <a href="/dashboard/settings" className="btn ghost sm">
              Settings
            </a>
            <a href="/api/stripe/portal" className="btn ghost sm">
              Manage billing
            </a>
            <form action={signOut}>
              <button type="submit" className="btn ghost sm">
                Log out
              </button>
            </form>
          </div>
        </div>

        {!active && (
          <div className="dash-banner">
            <span>Your subscription isn&apos;t active yet, so your join page is closed to new customers.</span>
            <a href={`/api/stripe/checkout?businessId=${business!.id}`} className="btn sm">
              Subscribe — $49/mo
            </a>
          </div>
        )}

        <div className="dash-qr-row">
          <div className="dash-checkin">
            <div>
              <span className="auth-sub">Share this — customers scan it to sign up and add their card to Apple or Google Wallet:</span>
              <code>{joinUrl}</code>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={joinQr} alt="Join QR code" width={140} height={140} className="checkin-qr" />
          </div>

          <div className="dash-checkin">
            <div>
              <span className="auth-sub">
                Print this at the counter — customers scan it themselves to earn a point, no dashboard needed:
              </span>
              <code>{checkinUrl}</code>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={checkinQr} alt="Check-in QR code" width={140} height={140} className="checkin-qr" />
          </div>
        </div>

        <div className="dash-table">
          <div className="dash-row dash-row--head">
            <span>Customer</span>
            <span>Points</span>
            <span />
          </div>
          {customers && customers.length > 0 ? (
            customers.map((customer) => (
              <div className="dash-row" key={customer.id}>
                <span>
                  <div className="dash-name">{customer.name}</div>
                  {customer.email && <div className="dash-email">{customer.email}</div>}
                </span>
                <span className="dash-points">{customer.points_balance}</span>
                <span className="dash-row-actions">
                  <a href={`/dashboard/customers/${customer.id}`} className="btn ghost sm">
                    Edit
                  </a>
                  <form action={addPoint.bind(null, customer.id)}>
                    <button type="submit" className="btn sm">
                      Add a point
                    </button>
                  </form>
                </span>
              </div>
            ))
          ) : (
            <p className="dash-empty">No customers yet — share your join link above to get your first one.</p>
          )}
        </div>
      </div>
    </main>
  );
}
