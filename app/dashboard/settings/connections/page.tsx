import { CheckCircle2, CreditCard, UtensilsCrossed, PlugZap, Users } from "lucide-react";
import { getCurrentBusiness } from "@/lib/current-business";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { disconnectSquare, importSquareCustomers } from "./actions";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: { connected?: string; disconnected?: string; error?: string; imported?: string; skipped?: string };
}) {
  const { supabase, business } = await getCurrentBusiness();

  const { data: connection } = await supabase
    .from("pos_connections")
    .select("provider, connected_at")
    .eq("business_id", business!.id)
    .eq("provider", "square")
    .is("disconnected_at", null)
    .maybeSingle();

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Connections</h1>
            <p className="auth-sub">
              Connect your point-of-sale system so a completed sale awards a point automatically — no QR scan needed.
            </p>
          </div>
        </div>

        {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
        {searchParams.connected === "square" && <Alert>Square connected — new sales will start earning points.</Alert>}
        {searchParams.disconnected === "square" && <Alert>Square disconnected.</Alert>}
        {searchParams.imported !== undefined && (
          <Alert>
            Imported {searchParams.imported} new customer{searchParams.imported === "1" ? "" : "s"}
            {Number(searchParams.skipped) > 0 ? ` — ${searchParams.skipped} already existed or had no email.` : "."}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="tile-accent relative flex h-[120px] items-center justify-center rounded-2xl">
              {connection && (
                <Badge variant="success" className="absolute right-3 top-3">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                </Badge>
              )}
              <CreditCard className="h-11 w-11 text-indigo-600" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[15.5px] font-bold">Square</h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Match a customer by the phone or email attached to their sale and award them a point.
              </p>
            </div>
            {connection ? (
              <div className="flex flex-wrap items-center gap-2">
                <form action={importSquareCustomers}>
                  <Button type="submit" size="sm" className="rounded-full">
                    <Users className="h-4 w-4" />
                    Import customers
                  </Button>
                </form>
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <a href="/api/square/connect">
                    <PlugZap className="h-4 w-4" />
                    Reconnect
                  </a>
                </Button>
                <form action={disconnectSquare}>
                  <Button type="submit" variant="ghost" size="sm" className="rounded-full">
                    Disconnect
                  </Button>
                </form>
              </div>
            ) : (
              <Button asChild size="sm" className="w-fit rounded-full">
                <a href="/api/square/connect">
                  <PlugZap className="h-4 w-4" />
                  Connect Square
                </a>
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 opacity-50">
            <div className="flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-secondary">
              <UtensilsCrossed className="h-11 w-11 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[15.5px] font-bold text-muted-foreground">Toast</h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Coming soon — pending Toast partner approval.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
