import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/leads";

const styles: Record<LeadStatus, string> = {
  won: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  lost: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="secondary" className={cn("capitalize font-medium", styles[status])}>
      {status}
    </Badge>
  );
}
