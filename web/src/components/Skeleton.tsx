const Skeleton = ({ className = "" }: { className?: string }) => <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;

const PageSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-56" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-28" />
      ))}
    </div>
    <Skeleton className="h-72" />
  </div>
);

export { PageSkeleton, Skeleton };
