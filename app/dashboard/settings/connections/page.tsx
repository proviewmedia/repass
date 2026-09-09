import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, PlugZap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { disconnectSquare } from "./actions";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: { connected?: string; disconnected?: string; error?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings/connections");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user!.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  const { data: connection } = await supabase
    .from("pos_connections")
    .select("provider, connected_at")
    .eq("business_id", business!.id)
    .eq("provider", "square")
    .is("disconnected_at", null)
    .maybeSingle();

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="flex w-full max-w-[900px] flex-col gap-5 sm:gap-6">
          <div>
            <Link href="/dashboard/settings" className="auth-sub" style={{ display: "inline-block", marginBottom: 8 }}>
              ← Back to settings
            </Link>
            <h1 className="text-[26px] font-bold tracking-tight">Connections</h1>
            <p className="auth-sub">
              Connect your point-of-sale system so a completed sale awards a point automatically — no QR scan needed.
            </p>
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
                <form action={disconnectSquare}>
                  <Button type="submit" variant="ghost" size="sm">
                    Disconnect
                  </Button>
                </form>
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
      </div>
    </main>
  );
}
