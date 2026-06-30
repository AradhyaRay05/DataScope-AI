"use client";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  const radius = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-white/[0.04] ${radius} ${className}`}
    />
  );
}

export function DatasetCardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-6 w-10" rounded="full" />
      </div>
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14" rounded="sm" />
        <Skeleton className="h-5 w-16" rounded="sm" />
        <Skeleton className="h-5 w-12" rounded="sm" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="border-t border-white/5 pt-3 flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-5" rounded="full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="flex gap-1 border-b border-white/5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[250px] w-full" rounded="lg" />
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[250px] w-full" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
