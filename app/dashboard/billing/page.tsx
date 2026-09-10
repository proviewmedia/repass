import { getCurrentBusiness } from "@/lib/current-business";
import { getStripe } from "@/lib/stripe";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export default async function BillingPage() {
  const { supabase, business } = await getCurrentBusiness();

  const { data: billingRow } = await supabase
    .from("businesses")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", business.id)
    .single();

  const stripeCustomerId = billingRow?.stripe_customer_id as string | null;
  const stripeSubscriptionId = billingRow?.stripe_subscription_id as string | null;

  let planAmount: string | null = null;
  let planInterval: string | null = null;
  let nextBillingDate: string | null = null;
  let invoices: { id: string; date: string; amount: string; status: string; url: string | null }[] = [];
  let stripeError: string | null = null;

  if (stripeCustomerId) {
    try {
      const stripe = getStripe();

      if (stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const item = subscription.items.data[0];
        if (item) {
          planAmount = formatMoney(item.price.unit_amount || 0, item.price.currency);
          planInterval = item.price.recurring?.interval || "month";
          nextBillingDate = new Date(item.current_period_end * 1000).toLocaleDateString();
        }
      }

      const invoiceList = await stripe.invoices.list({ customer: stripeCustomerId, limit: 12 });
      invoices = invoiceList.data.map((inv) => ({
        id: inv.id!,
        date: new Date(inv.created * 1000).toLocaleDateString(),
        amount: formatMoney(inv.amount_paid, inv.currency),
        status: inv.status || "unknown",
        url: inv.hosted_invoice_url || null,
      }));
    } catch (err) {
      stripeError = `Couldn't load billing details from Stripe: ${(err as Error).message}`;
    }
  }

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-5 sm:gap-6">
        <div className="dash-head">
          <div>
            <h1>Billing</h1>
            <p className="auth-sub">What you&apos;re paying, when you&apos;re charged, and your payment history.</p>
          </div>
        </div>

        {stripeError && <Alert variant="destructive">{stripeError}</Alert>}

        {!stripeCustomerId ? (
          <Card>
            <CardHeader>
              <CardTitle>No subscription yet</CardTitle>
              <CardDescription>Subscribe to activate your program and start issuing wallet cards.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <a href={`/api/stripe/checkout?businessId=${business.id}`}>Subscribe — $49/mo</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Current plan</CardTitle>
                <CardDescription>
                  {planAmount ? `${planAmount} / ${planInterval}` : "Repass Subscription"}
                  {nextBillingDate ? ` · next charge ${nextBillingDate}` : ""}
                </CardDescription>
              </div>
              <Badge variant={business.subscription_status === "active" ? "success" : "warning"}>
                {business.subscription_status}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" size="sm">
                <a href="/api/stripe/portal">Manage payment method or cancel</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {invoices.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="font-semibold">{inv.date}</div>
                        <div className="mt-0.5 text-[13px] text-muted-foreground">{inv.status}</div>
                      </TableCell>
                      <TableCell className="text-right text-[18px] font-bold tabular-nums">{inv.amount}</TableCell>
                      <TableCell>
                        {inv.url && (
                          <div className="flex justify-end">
                            <Button asChild variant="ghost" size="sm">
                              <a href={inv.url} target="_blank" rel="noreferrer">
                                Receipt
                              </a>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
