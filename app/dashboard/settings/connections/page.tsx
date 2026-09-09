import { CheckCircle2, PlugZap } from "lucide-react";
import { getCurrentBusiness } from "@/lib/current-business";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { disconnectSquare } from "./actions";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: { connected?: string; disconnected?: string; error?: string };
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
      <div className="wrap flex flex-col gap-5 sm:gap-6">
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

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Square</CardTitle>
                <CardDescription>
                  Match a customer by the phone or email attached to their sale and award them a point.
                </CardDescription>
              </div>
              {connection ? (
                <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Connected
                </span>
              ) : null}
            </CardHeader>
            <CardContent>
              {connection ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild variant="ghost" size="sm">
                    <a href="/api/square/connect">
                      <PlugZap className="h-4 w-4" />
                      Reconnect (needed for reward redemption)
                    </a>
                  </Button>
                  <form action={disconnectSquare}>
                    <Button type="submit" variant="ghost" size="sm">
                      Disconnect
                    </Button>
                  </form>
                </div>
              ) : (
                <Button asChild size="sm">
                  <a href="/api/square/connect">
                    <PlugZap className="h-4 w-4" />
                    Connect Square
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Toast</CardTitle>
              <CardDescription>Coming soon — pending Toast partner approval.</CardDescription>
            </CardHeader>
          </Card>
      </div>
    </main>
  );
}
