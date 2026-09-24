import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

/**
 * Base shimmer block. Tinted with ivory/felt so it reads correctly in both
 * the dark and light themes.
 */
export const Skeleton = ({ className = "", style }: SkeletonProps) => (
  <div
    aria-hidden="true"
    style={style}
    className={`relative overflow-hidden bg-ivory/10 light:bg-felt-dark/10 ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-[skeleton-shimmer_1.6s_ease-in-out_infinite] bg-linear-to-r from-transparent via-ivory/10 to-transparent light:via-felt-dark/10" />
  </div>
);

/** Mirrors ActivityList's card: image, name/tagline, arrow, price row. */
export const ActivityCardSkeleton = ({ delayMs = 0 }: { delayMs?: number }) => (
  <div
    role="presentation"
    className="animate-[fade-slide-up_420ms_ease-out] overflow-hidden rounded-4xl bg-ivory/5 light:bg-felt-dark/5"
    style={{ animationDelay: `${delayMs}ms`, animationFillMode: "backwards" }}
  >
    <div className="mx-[3px] mt-[3px] overflow-hidden rounded-[calc(theme(borderRadius.4xl)-3px)]">
      <Skeleton className="h-90 w-full" />
    </div>

    <div className="px-5 pb-5 pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-3 w-48 rounded-full" />
        </div>
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
    </div>
  </div>
);

export const ActivityListSkeleton = ({ count = 2 }: { count?: number }) => (
  <div role="status" aria-label="Loading activities" className="flex flex-col gap-5 px-6 pb-6">
    {Array.from({ length: count }, (_, i) => (
      <ActivityCardSkeleton key={i} delayMs={i * 70} />
    ))}
  </div>
);

/** Matches DateStrip's 4-up compact row. */
export const DateStripSkeleton = () => (
  <div role="status" aria-label="Loading dates" className="flex items-center pb-2.5">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex w-1/4 flex-col items-center gap-1.5 px-1.5 py-1">
        <Skeleton className="h-2.5 w-8 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    ))}
  </div>
);

/** Matches SlotGrid's compact 3-up row. */
export const SlotGridSkeleton = ({ rows = 1 }: { rows?: number }) => (
  <div role="status" aria-label="Checking availability" className="grid grid-cols-3 gap-2 pb-2.5">
    {Array.from({ length: rows * 3 }, (_, i) => (
      <Skeleton key={i} className="h-[58px] rounded-full" />
    ))}
  </div>
);

/** Matches MyBookings' BookingCard collapsed row. */
export const BookingCardSkeleton = ({ delayMs = 0 }: { delayMs?: number }) => (
  <div
    className="mb-5 animate-[fade-slide-up_420ms_ease-out] overflow-hidden rounded-4xl border border-ivory/10 bg-ivory/5 p-3.5 light:border-felt-dark/10 light:bg-felt-dark/5"
    style={{ animationDelay: `${delayMs}ms`, animationFillMode: "backwards" }}
  >
    <div className="flex items-center gap-3.5">
      <Skeleton className="h-16 w-16 shrink-0 rounded-[20px]" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-3 w-44 rounded-full" />
      </div>
      <Skeleton className="h-4 w-10 rounded-full" />
    </div>
  </div>
);