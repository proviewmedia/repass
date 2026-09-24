"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, LayoutDashboard, Users, Gift, PlugZap, Palette, CreditCard, Shield, type LucideIcon } from "lucide-react";
import { signOut } from "./actions";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/settings/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/settings/connections", label: "Connections", icon: PlugZap },
  { href: "/dashboard/settings", label: "Card Design", icon: Palette },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const ITEM_CLASS =
  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary hover:text-foreground";
const ACTIVE_ITEM_CLASS = "flex items-center gap-2.5 rounded-lg bg-indigo-50 px-3 py-2.5 text-[15px] font-semibold text-indigo-600";
const DARK_ITEM_CLASS =
  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] text-white/60 hover:bg-white/5 hover:text-white";
const DARK_ACTIVE_ITEM_CLASS =
  "flex items-center gap-2.5 rounded-r-lg border-l-2 border-accent bg-white/10 py-2.5 pl-2.5 pr-3 text-[15px] font-semibold text-white";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  dark,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  dark?: boolean;
  onClick?: () => void;
}) {
  const className = dark ? (active ? DARK_ACTIVE_ITEM_CLASS : DARK_ITEM_CLASS) : active ? ACTIVE_ITEM_CLASS : ITEM_CLASS;
  return (
    <Link href={href} onClick={onClick} className={className}>
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function NavList({ isAdmin, dark, onNavigate }: { isAdmin: boolean; dark?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div role="navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname === item.href}
          dark={dark}
          onClick={onNavigate}
        />
      ))}
      {isAdmin && (
        <NavLink
          href="/admin"
          label="Admin"
          icon={Shield}
          active={pathname === "/admin" || pathname.startsWith("/admin/")}
          dark={dark}
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
      {/* Desktop sidebar — its own floating dark panel, never scrolls with page content */}
      <aside className="hidden w-60 shrink-0 flex-col rounded-3xl bg-foreground px-4 pb-4 pt-6 shadow-xl shadow-black/30 ring-1 ring-white/10 sm:flex sm:h-full sm:overflow-y-auto">
        <div className="px-3 pb-5 text-[19px] font-bold tracking-[-0.02em] text-white">{businessName}</div>
        <NavList isAdmin={isAdmin} dark />
        <form action={signOut} className="mt-auto pt-6">
          <button type="submit" className={DARK_ITEM_CLASS}>
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
