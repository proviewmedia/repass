"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { signOut } from "./actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/settings/rewards", label: "Rewards" },
  { href: "/dashboard/settings/connections", label: "Connections" },
  { href: "/dashboard/settings", label: "Card Design" },
];

const ITEM_CLASS = "rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary hover:text-foreground";
const ACTIVE_ITEM_CLASS = "rounded-lg bg-indigo-50 px-3 py-2.5 text-[15px] font-semibold text-indigo-600";

function NavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className={active ? ACTIVE_ITEM_CLASS : ITEM_CLASS}>
      {label}
    </Link>
  );
}

function NavList({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div role="navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} active={pathname === item.href} onClick={onNavigate} />
      ))}
      <NavLink href="/dashboard/billing" label="Billing" active={pathname === "/dashboard/billing"} onClick={onNavigate} />
      {isAdmin && (
        <NavLink
          href="/admin"
          label="Admin"
          active={pathname === "/admin" || pathname.startsWith("/admin/")}
          onClick={onNavigate}
        />
      )}
    </div>
  );
}

export default function DashboardSidebar({ businessName, isAdmin }: { businessName: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar — fixed to the viewport, never scrolls with page content */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border px-4 pb-4 pt-8 sm:flex sm:h-screen sm:overflow-y-auto">
        <div className="px-3 pb-6 text-[20px] font-bold tracking-[-0.02em]">{businessName}</div>
        <NavList isAdmin={isAdmin} />
        <form action={signOut} className="mt-auto pt-6">
          <button type="submit" className={ITEM_CLASS}>
            Log out
          </button>
        </form>
      </aside>

      {/* Mobile top bar */}
      <div className="relative sm:hidden">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <span className="text-[20px] font-bold tracking-[-0.02em]">{businessName}</span>
          <button type="button" onClick={() => setOpen((v) => !v)} className="p-1.5 text-foreground" aria-label="Toggle navigation">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b border-border bg-card px-4 py-3">
            <NavList isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
            <form action={signOut} className="pt-2">
              <button type="submit" className={ITEM_CLASS}>
                Log out
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
