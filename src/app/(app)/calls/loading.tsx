import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function CallsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
