import { getCurrentBusiness } from "@/lib/current-business";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, isAdmin } = await getCurrentBusiness();

  return (
    <div className="flex min-h-screen flex-col bg-background sm:h-screen sm:flex-row sm:gap-3 sm:overflow-hidden sm:bg-foreground sm:p-3">
      <DashboardSidebar businessName={business.name} isAdmin={isAdmin} />
      <main className="min-w-0 flex-1 overflow-hidden sm:rounded-3xl sm:bg-background sm:shadow-xl sm:shadow-black/20">
        <div className="h-full sm:overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
