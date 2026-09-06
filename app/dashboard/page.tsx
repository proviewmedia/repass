import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Settings, CreditCard, LogOut, Users, Sparkles, Gift, UserPlus, ScanLine, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addPoint, signOut } from "./actions";
import CopyLinkButton from "./CopyLinkButton";
import CopyQrButton from "./CopyQrButton";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-row items-center gap-3 p-4 sm:p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold leading-none tracking-tight">{value.toLocaleString()}</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QRCard({
  icon,
  iconClass,
  title,
  description,
  url,
  qrSrc,
  qrAlt,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  url: string;
  qrSrc: string;
  qrAlt: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>{icon}</div>
          <div>
            <h3 className="font-bold leading-tight tracking-tight">{title}</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
          <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-foreground-soft">{url}</code>
          <CopyLinkButton value={url} />
        </div>
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt={qrAlt} width={140} height={140} className="rounded-lg border border-border" />
          <CopyQrButton dataUrl={qrSrc} />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { updated?: string; removed?: string };
}) {
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
    .select("id, first_name, last_name, email, points_balance, created_at")
    .eq("business_id", business!.id)
    .is("removed_at", null)
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

  const totalCustomers = customers?.length ?? 0;
  const totalPoints = (customers ?? []).reduce((sum, c) => sum + c.points_balance, 0);
  const totalRewards = (customers ?? []).reduce(
    (sum, c) => sum + Math.floor(c.points_balance / business!.reward_threshold),
    0,
  );

  return (
    <main className="dash">
      <div className="wrap flex flex-col gap-5 sm:gap-6">
        <div className="dash-head">
          <div>
            <h1>{business!.name}</h1>
            <p className="auth-sub">
              {business!.points_per_action} pt/visit · {business!.reward_threshold} pts = {business!.reward_description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="/api/stripe/portal">
                <CreditCard className="h-4 w-4" />
                Billing
              </a>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </form>
          </div>
        </div>

        {searchParams.updated === "1" && <Alert>Customer updated.</Alert>}
        {searchParams.removed === "1" && <Alert>Customer removed.</Alert>}

        {!active && (
          <Alert variant="warning">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Your subscription isn&apos;t active yet, so your join page is closed to new customers.</span>
              </div>
              <Button asChild size="sm">
                <a href={`/api/stripe/checkout?businessId=${business!.id}`}>Subscribe — $49/mo</a>
              </Button>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Customers" value={totalCustomers} />
          <StatCard icon={<Sparkles className="h-5 w-5" />} label="Points given out" value={totalPoints} />
          <StatCard icon={<Gift className="h-5 w-5" />} label="Rewards earned" value={totalRewards} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <QRCard
            icon={<UserPlus className="h-5 w-5" />}
            iconClass="bg-indigo-100 text-indigo-600"
            title="New customer sign-up"
            description="Customers scan to join and add their card to Apple or Google Wallet."
            url={joinUrl}
            qrSrc={joinQr}
            qrAlt="Sign-up QR code"
          />
          <QRCard
            icon={<ScanLine className="h-5 w-5" />}
            iconClass="bg-emerald-100 text-emerald-600"
            title="Self check-in"
            description="Customers scan at the counter to earn a point themselves — no dashboard needed."
            url={checkinUrl}
            qrSrc={checkinQr}
            qrAlt="Check-in QR code"
          />
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Customers</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">{totalCustomers}</span>
          </CardHeader>
          <div className="border-t border-border">
            <div className="dash-row dash-row--head">
              <span>Customer</span>
              <span>Points</span>
              <span />
            </div>
            {customers && customers.length > 0 ? (
              customers.map((customer) => (
                <div className="dash-row" key={customer.id}>
                  <span>
                    <div className="dash-name">{customer.first_name} {customer.last_name}</div>
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
        </Card>
      </div>
    </main>
  );
}
