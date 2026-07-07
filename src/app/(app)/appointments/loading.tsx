import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/skeletons";

export default function AppointmentsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="glass space-y-4 rounded-2xl p-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="min-h-16 rounded-lg" />)}
          </div>
        </div>
        <div className="glass space-y-3 rounded-2xl p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
