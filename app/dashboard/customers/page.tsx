import { getCurrentBusiness } from "@/lib/current-business";
import { Alert } from "@/components/ui/alert";
import CustomersTable from "./CustomersTable";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { updated?: string; removed?: string; added?: string; error?: string };
}) {
  const { supabase, business } = await getCurrentBusiness();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, points_balance, created_at")
    .eq("business_id", business.id)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>Customers</h1>
            <p className="auth-sub">Everyone enrolled in {business.name}&apos;s program.</p>
          </div>
        </div>

        {searchParams.error && <Alert variant="destructive">{searchParams.error}</Alert>}
        {searchParams.added === "1" && <Alert>Customer added — their wallet card is on the way.</Alert>}
        {searchParams.updated === "1" && <Alert>Customer updated.</Alert>}
        {searchParams.removed === "1" && <Alert>Customer removed.</Alert>}

        <CustomersTable customers={customers || []} />
      </div>
    </main>
  );
}
