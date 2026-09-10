import { getCurrentBusiness } from "@/lib/current-business";
import { addPoint } from "../actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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
      <div className="flex flex-col gap-5 sm:gap-6">
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
            <Badge>{totalCustomers}</Badge>
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
                      </TableCell>
                      <TableCell className="text-[18px] font-bold">{customer.points_balance}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <a href={`/dashboard/customers/${customer.id}`}>Edit</a>
                          </Button>
                          <form action={addPoint.bind(null, customer.id)}>
                            <Button type="submit" size="sm">
                              Add a point
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="dash-empty border-t border-border">
              No customers yet — share your join link from the Dashboard to get your first one.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
