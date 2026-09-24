import { Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusItem {
  label: string;
  done: boolean;
  href: string;
}

export default function SetupStatusChips({ items }: { items: StatusItem[] }) {
  const allDone = items.every((item) => item.done);

  if (allDone) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
        Your program is fully set up
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <a key={item.label} href={item.href}>
          <Badge variant={item.done ? "success" : "warning"} className="cursor-pointer hover:opacity-80">
            {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {item.label}
          </Badge>
        </a>
      ))}
    </div>
  );
}
