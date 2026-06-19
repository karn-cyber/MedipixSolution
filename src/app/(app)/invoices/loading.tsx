import { Skeleton, ListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-2/3" />
      <ListSkeleton rows={6} />
    </div>
  );
}
