"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const TABS = [
  { href: "/dashboard/settings/connections", label: "Connections" },
  { href: "/dashboard/settings/billing", label: "Billing" },
  { href: "/dashboard/settings/legal", label: "Legal" },
];

const TAB_CLASS = "border-b-2 border-transparent px-1 pb-3 text-[14.5px] font-medium text-muted-foreground hover:text-foreground";
const ACTIVE_TAB_CLASS = "border-b-2 border-accent px-1 pb-3 text-[14.5px] font-semibold text-foreground";

export default function SettingsTabs({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS.slice(0, 2), { href: "/admin", label: "Admin" }, TABS[2]] : TABS;

  return (
    <div role="tablist" className="flex items-center gap-6 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.href === "/admin" ? pathname.startsWith("/admin") : pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} className={active ? ACTIVE_TAB_CLASS : TAB_CLASS}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
