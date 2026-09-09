import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="wrap flex flex-col gap-5 sm:gap-6">
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
            <span className="text-sm font-medium text-muted-foreground">{customers?.length ?? 0}</span>
          </CardHeader>
          <div className="border-t border-border">
            <div className="dash-row dash-row--head">
              <span>Customer</span>
              <span>Points</span>
              <span />
            </div>
            {customers && customers.length > 0 ? (
              customers.map((customer) => (
                <div className="dash-row" key={customer.id}>
                  <span>
                    <div className="dash-name">
                      {customer.first_name} {customer.last_name}
                    </div>
                    {customer.email && <div className="dash-email">{customer.email}</div>}
                    {customer.phone && <div className="dash-email">{customer.phone}</div>}
                  </span>
                  <span className="dash-points">{customer.points_balance}</span>
                  <span />
                </div>
              ))
            ) : (
              <p className="dash-empty">This business has no customers yet.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
