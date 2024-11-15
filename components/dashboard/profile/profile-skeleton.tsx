import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <Skeleton className="h-16 w-full" />

      <div className="flex justify-between">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}
