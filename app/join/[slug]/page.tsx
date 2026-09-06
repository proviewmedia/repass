import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { joinProgram } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, program_name, reward_threshold, reward_description, subscription_status")
    .eq("slug", params.slug)
    .single();

  if (!business) {
    notFound();
  }

  const closed = business!.subscription_status !== "active";

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <Card className="w-full max-w-[420px]">
          <CardHeader>
            <CardTitle className="text-2xl">{business!.program_name || business!.name}</CardTitle>
            <CardDescription>
              Earn a point every visit — {business!.reward_threshold} points gets you {business!.reward_description}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {closed ? (
              <Alert>This program isn&apos;t accepting new members right now.</Alert>
            ) : (
              <form action={joinProgram.bind(null, params.slug)} className="flex flex-col gap-4">
                {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" type="text" name="firstName" required autoComplete="given-name" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" type="text" name="lastName" required autoComplete="family-name" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" name="email" required autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" name="phone" required autoComplete="tel" />
                </div>
                <Button type="submit">Get my card</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
