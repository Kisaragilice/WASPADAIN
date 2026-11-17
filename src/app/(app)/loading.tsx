export default function AppLoading() {
  return (
    <div className="page-shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman...</span>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-full bg-brand-ink/10" />
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded-full bg-brand-ink/10" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-brand-ink/[0.07]" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
        <div className="space-y-3">
          <div className="h-36 animate-pulse rounded-3xl bg-white/70" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-white/60"
              />
            ))}
          </div>
          <div className="h-24 animate-pulse rounded-3xl bg-white/70" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/60" />
        </div>
        <div className="hidden space-y-3 lg:block">
          <div className="h-56 animate-pulse rounded-3xl bg-brand-ink/10" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/60" />
        </div>
      </div>
    </div>
  );
}
