import { redirect, notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="dash">
      <div className="wrap flex flex-col gap-5 sm:gap-6">
        <div className="dash-head">
          <div>
            <h1>All businesses</h1>
            <p className="auth-sub">Every business on Repass and their active customer count.</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Businesses</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">{businesses?.length ?? 0}</span>
          </CardHeader>
          <div className="border-t border-border">
            {businesses && businesses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Business</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Customers</th>
                      <th className="px-5 py-3 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => (
                      <tr key={b.id} className="border-b border-border last:border-b-0">
                        <td className="px-5 py-4">
                          <a href={`/admin/businesses/${b.id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>
                              {b.name}
                              <span className="ml-2 font-mono text-[12.5px] font-normal text-muted-foreground">/{b.slug}</span>
                            </span>
                          </a>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={
                              b.subscription_status === "active"
                                ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[12.5px] font-medium text-emerald-700"
                                : "rounded-full bg-amber-100 px-2.5 py-1 text-[12.5px] font-medium text-amber-700"
                            }
                          >
                            {b.subscription_status || "none"}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium">{countByBusiness.get(b.id) || 0}</td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dash-empty">No businesses have signed up yet.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
