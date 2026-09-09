import { getCurrentBusiness } from "@/lib/current-business";
import { addPoint } from "../actions";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { updated?: string; removed?: string };
}) {
  const { supabase, business } = await getCurrentBusiness();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, points_balance, created_at")
    .eq("business_id", business.id)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  const totalCustomers = customers?.length ?? 0;

  return (
    <main className="dash-content">
      <div className="wrap flex flex-col gap-5 sm:gap-6">
        <div className="dash-head">
          <div>
            <h1>Customers</h1>
            <p className="auth-sub">Everyone enrolled in {business.name}&apos;s program.</p>
          </div>
        </div>

        {searchParams.updated === "1" && <Alert>Customer updated.</Alert>}
        {searchParams.removed === "1" && <Alert>Customer removed.</Alert>}

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Customers</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">{totalCustomers}</span>
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
                  </span>
                  <span className="dash-points">{customer.points_balance}</span>
                  <span className="dash-row-actions">
                    <a href={`/dashboard/customers/${customer.id}`} className="btn ghost sm">
                      Edit
                    </a>
                    <form action={addPoint.bind(null, customer.id)}>
                      <button type="submit" className="btn sm">
                        Add a point
                      </button>
                    </form>
                  </span>
                </div>
              ))
            ) : (
              <p className="dash-empty">No customers yet — share your join link from the Dashboard to get your first one.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
