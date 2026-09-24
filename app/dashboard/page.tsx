import { headers } from "next/headers";
import QRCode from "qrcode";
import { Users, Sparkles, Gift, UserPlus, ScanLine, AlertTriangle } from "lucide-react";
import { getCurrentBusiness } from "@/lib/current-business";
import CopyLinkButton from "./CopyLinkButton";
import CopyQrButton from "./CopyQrButton";
import SetupStatusChips from "./SetupStatusChips";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function StatCard({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delta?: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-foreground">{icon}</div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold leading-none tracking-tight tabular-nums">{value.toLocaleString()}</span>
          {!!delta && <span className="text-[12px] font-semibold text-emerald-600">+{delta} this week</span>}
        </div>
        <div className="mt-1 text-[13px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function SignageRow({
  icon,
  iconClass,
  title,
  url,
  qrSrc,
  qrAlt,
  filename,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  url: string;
  qrSrc: string;
  qrAlt: string;
  filename: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{title}</div>
        <code className="block truncate font-mono text-[12.5px] text-muted-foreground">{url}</code>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrSrc} alt={qrAlt} width={64} height={64} className="shrink-0 rounded-lg border border-border" />
      <div className="flex shrink-0 items-center gap-1">
        <CopyLinkButton value={url} />
        <CopyQrButton dataUrl={qrSrc} filename={filename} />
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: { error?: string } }) {
  const { supabase, business } = await getCurrentBusiness();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .is("removed_at", null);

  const { count: newCustomersThisWeek } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .is("removed_at", null)
    .gte("created_at", sevenDaysAgo);

  const { data: customers } = await supabase
    .from("customers")
    .select("points_balance")
    .eq("business_id", business.id)
    .is("removed_at", null);

  const { data: recentPositiveEvents } = await supabase
    .from("point_events")
    .select("delta")
    .eq("business_id", business.id)
    .gt("delta", 0)
    .gte("created_at", sevenDaysAgo);

  const { count: activeTierCount } = await supabase
    .from("reward_tiers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .is("archived_at", null);

  const { count: totalRewards } = await supabase
    .from("point_events")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .lt("delta", 0);

  const { count: rewardsThisWeek } = await supabase
    .from("point_events")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .lt("delta", 0)
    .gte("created_at", sevenDaysAgo);

  const { data: branding } = await supabase.from("businesses").select("logo_url").eq("id", business.id).single();

  const { data: posConnection } = await supabase
    .from("pos_connections")
    .select("provider")
    .eq("business_id", business.id)
    .eq("provider", "square")
    .is("disconnected_at", null)
    .maybeSingle();

  const headersList = headers();
  const host = headersList.get("host");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `https://${host}` : "");
  const joinUrl = `${appUrl}/join/${business.slug}`;
  const checkinUrl = `${appUrl}/checkin/${business.slug}`;
  const [joinQr, checkinQr] = await Promise.all([
    QRCode.toDataURL(joinUrl, { margin: 1, width: 220 }),
    QRCode.toDataURL(checkinUrl, { margin: 1, width: 220 }),
  ]);
  const active = business.subscription_status === "active";

  const totalPoints = (customers ?? []).reduce((sum, c) => sum + c.points_balance, 0);
  const pointsThisWeek = (recentPositiveEvents ?? []).reduce((sum, e) => sum + e.delta, 0);

  const setupItems = [
    { label: "Card designed", done: !!branding?.logo_url, href: "/dashboard/settings" },
    { label: "Reward added", done: (activeTierCount ?? 0) > 0, href: "/dashboard/settings/rewards" },
    { label: "POS connected", done: !!posConnection, href: "/dashboard/settings/connections" },
    { label: "Subscription active", done: active, href: "/dashboard/billing" },
  ];

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Dashboard</h1>
            <p className="auth-sub">
              {business.name} · {business.points_per_action} pt/visit · {activeTierCount ?? 0} reward
              {(activeTierCount ?? 0) === 1 ? "" : "s"} available
            </p>
          </div>
        </div>

        {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}

        {!active && (
          <Alert variant="warning">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Your subscription isn&apos;t active yet, so your join page is closed to new customers.</span>
              </div>
              <Button asChild size="sm">
                <a href={`/api/stripe/checkout?businessId=${business.id}`}>Subscribe — $49/mo</a>
              </Button>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Customers" value={totalCustomers ?? 0} delta={newCustomersThisWeek ?? 0} />
          <StatCard icon={<Sparkles className="h-5 w-5" />} label="Points given out" value={totalPoints} delta={pointsThisWeek} />
          <StatCard icon={<Gift className="h-5 w-5" />} label="Rewards earned" value={totalRewards ?? 0} delta={rewardsThisWeek ?? 0} />
        </div>

        <SetupStatusChips items={setupItems} />

        {active && (totalCustomers ?? 0) === 0 && (
          <Alert>No customers yet — share your sign-up link below to get your first one.</Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Signage</CardTitle>
            <CardDescription>Print these or post them at your counter — customers scan to join or check themselves in.</CardDescription>
          </CardHeader>
          <CardContent className="gap-0 divide-y divide-border">
            <SignageRow
              icon={<UserPlus className="h-4 w-4" />}
              iconClass="bg-indigo-100 text-indigo-600"
              title="New customer sign-up"
              url={joinUrl}
              qrSrc={joinQr}
              qrAlt="Sign-up QR code"
              filename="sign-up-qr.png"
            />
            <SignageRow
              icon={<ScanLine className="h-4 w-4" />}
              iconClass="bg-emerald-100 text-emerald-600"
              title="Self check-in"
              url={checkinUrl}
              qrSrc={checkinQr}
              qrAlt="Check-in QR code"
              filename="check-in-qr.png"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
