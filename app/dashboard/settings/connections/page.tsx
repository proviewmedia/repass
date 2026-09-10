import { CheckCircle2, PlugZap, Users } from "lucide-react";
import { getCurrentBusiness } from "@/lib/current-business";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { disconnectSquare, disconnectStripe, importStripeCustomers } from "./actions";

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

  const { data: stripeConnection } = await supabase
    .from("stripe_connections")
    .select("connected_at")
    .eq("business_id", business!.id)
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
          {searchParams.connected === "stripe" && <Alert>Stripe connected — import your customers below.</Alert>}
          {searchParams.disconnected === "stripe" && <Alert>Stripe disconnected.</Alert>}
          {searchParams.imported !== undefined && (
            <Alert>
              Imported {searchParams.imported} new customer{searchParams.imported === "1" ? "" : "s"}
              {Number(searchParams.skipped) > 0 ? ` — ${searchParams.skipped} already existed or had no email.` : "."}
            </Alert>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Square</CardTitle>
                <CardDescription>
                  Match a customer by the phone or email attached to their sale and award them a point.
                </CardDescription>
              </div>
              {connection ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                </Badge>
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
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Stripe</CardTitle>
                <CardDescription>Import the customers you already have in your own Stripe account.</CardDescription>
              </div>
              {stripeConnection ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {stripeConnection ? (
                <div className="flex flex-wrap items-center gap-3">
                  <form action={importStripeCustomers}>
                    <Button type="submit" size="sm">
                      <Users className="h-4 w-4" />
                      Import customers
                    </Button>
                  </form>
                  <form action={disconnectStripe}>
                    <Button type="submit" variant="ghost" size="sm">
                      Disconnect
                    </Button>
                  </form>
                </div>
              ) : (
                <Button asChild size="sm">
                  <a href="/api/stripe-connect/connect">
                    <PlugZap className="h-4 w-4" />
                    Connect Stripe
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed opacity-60">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Toast</CardTitle>
              <CardDescription>Coming soon — pending Toast partner approval.</CardDescription>
            </CardHeader>
          </Card>
      </div>
    </main>
  );
}
