import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer, removeCustomer } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/customers/${params.id}`);
  }

  const { data } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone, points_balance, businesses!inner(owner_user_id)")
    .eq("id", params.id)
    .is("removed_at", null)
    .single();

  const customer = data as unknown as {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    points_balance: number;
    businesses: { owner_user_id: string };
  } | null;

  if (!customer || customer.businesses.owner_user_id !== user!.id) {
    notFound();
  }

  const fullName = `${customer!.first_name} ${customer!.last_name || ""}`.trim();

  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="flex w-full max-w-[520px] flex-col gap-5 sm:gap-6">
          <div>
            <Link href="/dashboard" className="auth-sub" style={{ display: "inline-block", marginBottom: 8 }}>
              ← Back to dashboard
            </Link>
            <h1 className="text-[26px] font-bold tracking-tight">Edit customer</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer info</CardTitle>
              <CardDescription>Changes here don&apos;t push a wallet notification.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateCustomer.bind(null, customer!.id)} className="flex flex-col gap-4">
                {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" type="text" name="firstName" required defaultValue={customer!.first_name} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" type="text" name="lastName" required defaultValue={customer!.last_name || ""} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" name="email" required defaultValue={customer!.email || ""} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" name="phone" required defaultValue={customer!.phone || ""} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pointsBalance">Points balance</Label>
                  <Input
                    id="pointsBalance"
                    type="number"
                    name="pointsBalance"
                    min={0}
                    required
                    defaultValue={customer!.points_balance}
                  />
                </div>

                <Button type="submit" className="self-start">
                  Save
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Removes their wallet pass and takes them off your active customer list. Their point history is kept.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={removeCustomer.bind(null, customer!.id)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmName">Type &ldquo;{fullName}&rdquo; to confirm</Label>
                  <Input id="confirmName" type="text" name="confirmName" required autoComplete="off" />
                </div>
                <Button type="submit" variant="destructive" className="self-start">
                  Remove customer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
