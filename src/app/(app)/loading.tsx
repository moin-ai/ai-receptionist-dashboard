import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/skeletons";

export default function OverviewLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader>
            <CardContent><Skeleton className="h-9 w-14" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-44" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
