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

function NavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-accent/10 px-3 py-2.5 text-[15px] font-medium text-accent"
          : "rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}

function NavList({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} active={pathname === item.href} onClick={onNavigate} />
      ))}
      <a
        href="/api/stripe/portal"
        className="rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      >
        Billing
      </a>
      {isAdmin && (
        <a
          href="/admin"
          className="rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          Admin
        </a>
      )}
    </nav>
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
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border px-4 pb-4 pt-6 sm:flex">
        <div className="px-3 pb-6 text-[15px] font-bold tracking-tight">{businessName}</div>
        <NavList isAdmin={isAdmin} />
        <form action={signOut} className="mt-auto pt-6">
          <button type="submit" className="rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
            Log out
          </button>
        </form>
      </aside>

      {/* Mobile top bar */}
      <div className="relative w-full self-start sm:hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[15px] font-bold tracking-tight">{businessName}</span>
          <button type="button" onClick={() => setOpen((v) => !v)} className="p-1.5 text-foreground" aria-label="Toggle navigation">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b border-border bg-card px-4 py-3">
            <NavList isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
            <form action={signOut} className="pt-2">
              <button type="submit" className="rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                Log out
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
