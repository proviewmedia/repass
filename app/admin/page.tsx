import { redirect, notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  if (!(await isCurrentUserAdmin())) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: businesses } = await admin
    .from("businesses")
    .select("id, name, slug, subscription_status, created_at")
    .order("created_at", { ascending: false });

  const { data: customerCounts } = await admin.from("customers").select("business_id").is("removed_at", null);

  const countByBusiness = new Map<string, number>();
  for (const row of customerCounts || []) {
    countByBusiness.set(row.business_id, (countByBusiness.get(row.business_id) || 0) + 1);
  }

  return (
    <main className="dash-content">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="dash-head">
          <div>
            <h1>All businesses</h1>
            <p className="auth-sub">Every business on Repass and their active customer count.</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Businesses</CardTitle>
            <Badge>{businesses?.length ?? 0}</Badge>
          </CardHeader>
          {businesses && businesses.length > 0 ? (
            <div className="overflow-x-auto border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <a href={`/admin/businesses/${b.id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>
                            {b.name}
                            <span className="ml-2 font-mono text-[13px] font-normal text-muted-foreground">/{b.slug}</span>
                          </span>
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.subscription_status === "active" ? "success" : "warning"}>
                          {b.subscription_status || "none"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{countByBusiness.get(b.id) || 0}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="dash-empty border-t border-border">No businesses have signed up yet.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
