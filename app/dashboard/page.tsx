import { headers } from "next/headers";
import QRCode from "qrcode";
import { Users, Sparkles, Gift, UserPlus, ScanLine, AlertTriangle } from "lucide-react";
import { getCurrentBusiness } from "@/lib/current-business";
import CopyLinkButton from "./CopyLinkButton";
import CopyQrButton from "./CopyQrButton";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-row items-center gap-3 p-4 sm:p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold leading-none tracking-tight tabular-nums">{value.toLocaleString()}</div>
          <div className="mt-1 text-[13px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// The one number a business owner actually opens this page to check —
// sized and colored to stand out from the supporting stats beside it,
// instead of all three competing at equal weight.
function HeroStatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="h-full border-[var(--border-strong)]">
      <CardContent className="flex h-full flex-col justify-center gap-2 p-5 sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <div>
          <div className="text-[44px] font-bold leading-none tracking-tight tabular-nums">
            {value.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
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
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>{icon}</div>
          <div>
            <h3 className="font-bold leading-tight tracking-tight">{title}</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
          <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground-soft">{url}</code>
          <CopyLinkButton value={url} />
        </div>
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt={qrAlt} width={140} height={140} className="rounded-lg border border-border" />
          <CopyQrButton dataUrl={qrSrc} filename={`${qrAlt.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`} />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: { error?: string } }) {
  const { supabase, business } = await getCurrentBusiness();

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .is("removed_at", null);

  const { data: customers } = await supabase
    .from("customers")
    .select("points_balance")
    .eq("business_id", business.id)
    .is("removed_at", null);

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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.7fr_1fr] sm:gap-4">
          <HeroStatCard icon={<Users className="h-5 w-5" />} label="Customers" value={totalCustomers ?? 0} />
          <div className="flex flex-col gap-3 sm:gap-4">
            <StatCard icon={<Sparkles className="h-5 w-5" />} label="Points given out" value={totalPoints} />
            <StatCard icon={<Gift className="h-5 w-5" />} label="Rewards earned" value={totalRewards ?? 0} />
          </div>
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
      </div>
    </main>
  );
}
