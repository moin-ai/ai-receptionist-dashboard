import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="divide-y divide-border/60 overflow-hidden py-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-4 w-40 md:block" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </Card>
  );
}
