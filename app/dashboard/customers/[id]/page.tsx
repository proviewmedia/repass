import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer, removeCustomer, resendWalletLink, restoreCustomer } from "./actions";
import { CopyButton } from "@/components/copy-button";
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
  searchParams: { error?: string; sent?: string; restored?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/customers/${params.id}`);
  }

  // Removed customers are loaded here too, so the page can offer to restore
  // them instead of 404ing on a customer who still exists.
  const { data } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone, points_balance, share_url, removed_at, businesses!inner(owner_user_id)")
    .eq("id", params.id)
    .single();

  const customer = data as unknown as {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    points_balance: number;
    share_url: string | null;
    removed_at: string | null;
    businesses: { owner_user_id: string };
  } | null;

  if (!customer || customer.businesses.owner_user_id !== user!.id) {
    notFound();
  }

  const fullName = `${customer!.first_name} ${customer!.last_name || ""}`.trim();

  // A removed customer gets a restore screen instead of the editor. Their row
  // and point history are intact; only the wallet pass was revoked.
  if (customer!.removed_at) {
    return (
      <main className="dash-content">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="dash-head">
            <div>
              <h1>{fullName}</h1>
              <p className="auth-sub">This customer was removed on {new Date(customer!.removed_at).toLocaleDateString()}.</p>
            </div>
          </div>

          <div className="w-full max-w-[720px]">
            <Card>
              <CardHeader>
                <CardTitle>Restore this customer</CardTitle>
                <CardDescription>
                  Their {customer!.points_balance} point{customer!.points_balance === 1 ? "" : "s"} and full history were
                  kept. Restoring issues a new wallet pass, because the old one was revoked when they were removed, and
                  carries their balance over.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
                <form action={restoreCustomer.bind(null, customer!.id)}>
                  <Button type="submit">Restore customer</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Edit customer</h1>
            <p className="auth-sub">Update their info or points balance. Changes don&apos;t push a wallet notification.</p>
          </div>
        </div>

        {/* Editing their details is the primary task, so it takes the wider
            column; the wallet link and removal sit alongside it. */}
        <div className="dash-split">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Customer info</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={updateCustomer.bind(null, customer!.id)} className="flex flex-col gap-4">
                  {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          <div>
          <Card>
            <CardHeader>
              <CardTitle>Wallet card</CardTitle>
              <CardDescription>
                Send this link again if they lost their card or got a new phone. It&apos;s the same card, not a new one,
                so their points carry over.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {searchParams.sent && <Alert>Wallet link sent to {customer!.email}.</Alert>}
              {searchParams.restored && <Alert>Customer restored and a new wallet pass issued.</Alert>}

              {customer!.share_url ? (
                <>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={customer!.share_url} aria-label="Wallet card link" />
                    <CopyButton value={customer!.share_url} />
                  </div>
                  <form action={resendWalletLink.bind(null, customer!.id)}>
                    <Button type="submit" variant="ghost" disabled={!customer!.email}>
                      Email it to them
                    </Button>
                  </form>
                  {!customer!.email && (
                    <p className="auth-sub">Add an email address below to send it by email.</p>
                  )}
                </>
              ) : (
                <p className="auth-sub">
                  This customer has no wallet pass yet, so there&apos;s no link to share.
                </p>
              )}
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
      </div>
    </main>
  );
}
