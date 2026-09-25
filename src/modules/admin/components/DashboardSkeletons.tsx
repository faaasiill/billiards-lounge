import { Skeleton } from "./Skeleton";

export const StatCardSkeleton = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-7 rounded-lg" />
    </div>
    <Skeleton className="mt-3 h-7 w-16" />
    <Skeleton className="mt-2 h-3 w-24" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6" role="status" aria-label="Loading dashboard">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 lg:col-span-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <Skeleton className="h-4 w-28" />
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 flex flex-col gap-2.5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 flex flex-col gap-2.5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="flex flex-col gap-6" role="status" aria-label="Loading analytics">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-48 rounded-lg" />
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-52 w-full" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 flex flex-col gap-2.5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 flex flex-col gap-2.5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  </div>
);