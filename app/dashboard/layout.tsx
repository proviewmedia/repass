import { getCurrentBusiness } from "@/lib/current-business";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, isAdmin } = await getCurrentBusiness();

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <DashboardSidebar businessName={business.name} isAdmin={isAdmin} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
