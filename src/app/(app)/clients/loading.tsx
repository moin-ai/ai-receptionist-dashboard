import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function ClientsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
