import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import DashboardSidebar from "@/app/dashboard/DashboardSidebar";

// Separate from app/dashboard/layout.tsx (and its getCurrentBusiness() helper)
// because an admin account isn't guaranteed to own a business — this only
// requires admin status, and falls back to a generic label if there's no
// business to name the sidebar after.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("owner_user_id", user!.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col sm:h-screen sm:flex-row sm:overflow-hidden">
      <DashboardSidebar businessName={business?.name || "Admin"} isAdmin={true} />
      <main className="min-w-0 flex-1 sm:h-screen sm:overflow-y-auto">{children}</main>
    </div>
  );
}
