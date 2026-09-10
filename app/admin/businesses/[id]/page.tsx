import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function AdminBusinessPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/admin/businesses/${params.id}`);
  }

  if (!(await isCurrentUserAdmin())) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, name, slug, subscription_status, points_per_action, created_at")
    .eq("id", params.id)
    .single();

  if (!business) {
    notFound();
  }

  const { data: customers } = await admin
    .from("customers")
    .select("id, first_name, last_name, email, phone, points_balance, created_at")
    .eq("business_id", business.id)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  const { data: tiers } = await admin
    .from("reward_tiers")
    .select("points_cost, label")
    .eq("business_id", business.id)
    .is("archived_at", null)
    .order("points_cost", { ascending: true });

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-5 sm:gap-6">
        <div>
          <a href="/admin" className="auth-sub inline-flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> All businesses
          </a>
        </div>

        <div className="dash-head">
          <div>
            <h1>{business.name}</h1>
            <p className="auth-sub">
              /{business.slug} · {business.points_per_action} pt/visit ·{" "}
              {tiers && tiers.length > 0
                ? tiers.map((t) => `${t.points_cost} pts = ${t.label}`).join(", ")
                : "no rewards configured"}{" "}
              · {business.subscription_status || "no subscription"}
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Customers</CardTitle>
            <Badge>{customers?.length ?? 0}</Badge>
          </CardHeader>
          {customers && customers.length > 0 ? (
            <div className="overflow-x-auto border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="font-semibold">
                          {customer.first_name} {customer.last_name}
                        </div>
                        {customer.email && <div className="mt-0.5 text-[13px] text-muted-foreground">{customer.email}</div>}
                        {customer.phone && <div className="mt-0.5 text-[13px] text-muted-foreground">{customer.phone}</div>}
                      </TableCell>
                      <TableCell className="text-[18px] font-bold">{customer.points_balance}</TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="dash-empty border-t border-border">This business has no customers yet.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
