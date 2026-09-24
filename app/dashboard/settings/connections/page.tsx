import { CheckCircle2, CreditCard, Store, UtensilsCrossed, PlugZap, Users } from "lucide-react";
import { getCurrentBusiness } from "@/lib/current-business";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { disconnectSquare, importSquareCustomers, disconnectClover, importCloverCustomers } from "./actions";

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

  const { data: cloverConnection } = await supabase
    .from("pos_connections")
    .select("provider, connected_at")
    .eq("business_id", business!.id)
    .eq("provider", "clover")
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
        {searchParams.connected === "clover" && <Alert>Clover connected — new sales will start earning points.</Alert>}
        {searchParams.disconnected === "clover" && <Alert>Clover disconnected.</Alert>}
        {searchParams.imported !== undefined && (
          <Alert>
            Imported {searchParams.imported} new customer{searchParams.imported === "1" ? "" : "s"}
            {Number(searchParams.skipped) > 0 ? ` — ${searchParams.skipped} already existed or had no email.` : "."}
          </Alert>
        )}

        <div className="flex flex-col gap-4 sm:gap-5">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="tile-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                  <CreditCard className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle>Square</CardTitle>
                  <CardDescription className="mt-0.5">
                    Match a customer by the phone or email attached to their sale and award them a point.
                  </CardDescription>
                </div>
              </div>
              <Badge variant={connection ? "success" : "warning"} className="shrink-0">
                {connection ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </>
                ) : (
                  "Not connected"
                )}
              </Badge>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="tile-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                  <Store className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle>Clover</CardTitle>
                  <CardDescription className="mt-0.5">
                    Match a customer by the phone or email attached to their sale and award them a point.
                  </CardDescription>
                </div>
              </div>
              <Badge variant={cloverConnection ? "success" : "warning"} className="shrink-0">
                {cloverConnection ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </>
                ) : (
                  "Not connected"
                )}
              </Badge>
            </CardHeader>
            <CardContent>
              {cloverConnection ? (
                <div className="flex flex-wrap items-center gap-2">
                  <form action={importCloverCustomers}>
                    <Button type="submit" size="sm" className="rounded-full">
                      <Users className="h-4 w-4" />
                      Import customers
                    </Button>
                  </form>
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <a href="/api/clover/connect">
                      <PlugZap className="h-4 w-4" />
                      Reconnect
                    </a>
                  </Button>
                  <form action={disconnectClover}>
                    <Button type="submit" variant="ghost" size="sm" className="rounded-full">
                      Disconnect
                    </Button>
                  </form>
                </div>
              ) : (
                <Button asChild size="sm" className="w-fit rounded-full">
                  <a href="/api/clover/connect">
                    <PlugZap className="h-4 w-4" />
                    Connect Clover
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <UtensilsCrossed className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-muted-foreground">Toast</CardTitle>
                  <CardDescription className="mt-0.5">
                    Sync sales from Toast POS and award points automatically.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="neutral" className="shrink-0">
                Coming soon
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] text-muted-foreground">
                Pending Toast partner approval — we&apos;ll turn this on here as soon as it&apos;s available.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
