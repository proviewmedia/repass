import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkinCookieName, CHECKIN_COOLDOWN_MS } from "@/lib/checkin";
import { checkIn, linkByPhone } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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

  let customer: { id: string; first_name: string; points_balance: number; last_checkin_at: string | null } | null =
    null;
  if (customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id, first_name, points_balance, last_checkin_at")
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
        <Card className="w-full max-w-[420px] text-center">
          <CardHeader>
            <CardTitle className="text-2xl">{business!.program_name || business!.name}</CardTitle>
            <CardDescription>
              Earn a point every visit — {business!.reward_threshold} points gets you {business!.reward_description}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}

            {closed ? (
              <Alert>This program isn&apos;t accepting check-ins right now.</Alert>
            ) : searchParams.success === "1" ? (
              <Alert>
                You earned a point! You&apos;re now at {searchParams.points} points. Check your wallet pass for the
                update.
              </Alert>
            ) : onCooldown ? (
              <Alert>
                You&apos;re already checked in for today{customer ? ` — ${customer.points_balance} points` : ""}.
                Come back on your next visit.
              </Alert>
            ) : customer ? (
              <form action={checkIn.bind(null, params.slug, customer.id)} className="flex flex-col gap-4">
                <p className="auth-sub">
                  Welcome back, {customer.first_name}. You have {customer.points_balance} points.
                </p>
                <Button type="submit" className="w-full justify-center">
                  Check in &amp; earn a point
                </Button>
              </form>
            ) : (
              <form action={linkByPhone.bind(null, params.slug)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <Label htmlFor="phone">Phone number you signed up with</Label>
                  <Input id="phone" type="tel" name="phone" required autoComplete="tel" />
                </div>
                <Button type="submit" className="w-full justify-center">
                  Find my card
                </Button>
                <p className="auth-alt">
                  Not signed up yet? <a href={`/join/${params.slug}`}>Join the program</a>.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
