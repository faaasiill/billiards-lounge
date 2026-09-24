type SkeletonProps = { className?: string };

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div aria-hidden="true" className={`animate-pulse rounded-md bg-neutral-200/80 ${className}`} />
);

export const BookingCardSkeleton = () => (
  <li className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
    </div>
    <div className="mt-4 flex gap-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 flex-1" />
    </div>
  </li>
);

export const CustomerRowSkeleton = () => (
  <li className="flex items-center gap-3 p-4">
    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="hidden h-4 w-16 sm:block" />
  </li>
);

export const CustomerDetailsSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-6 w-20" />
        </div>
      ))}
    </div>
    <ul className="flex flex-col gap-3">
      <BookingCardSkeleton />
      <BookingCardSkeleton />
    </ul>
  </div>
);