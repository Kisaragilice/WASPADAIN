import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
    >
      <path
        d="M5 11.5C5 8.46 7.46 6 10.5 6h23C36.54 6 39 8.46 39 11.5v15c0 3.04-2.46 5.5-5.5 5.5H22.8l-8.55 6.1c-1.03.74-2.45.01-2.45-1.25V32.9C8.4 32.27 5 29.31 5 24.8V11.5Z"
        fill="#1E3A66"
      />
      <circle cx="22" cy="18" r="9.3" fill="#DDF4EE" />
      <path
        d="M22 12.7v6.5"
        stroke="#0F7E70"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <circle cx="22" cy="24.2" r="1.55" fill="#0F7E70" />
      <path
        d="M8 35.4c5.1-2.3 10.6-2.6 16-1.3"
        stroke="#1E3A66"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity=".35"
      />
    </svg>
  );
}

export function BrandWordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className={markClassName} />
      <span className="text-[1.32rem] font-extrabold tracking-[-0.03em] text-brand-ink">
        Waspadain
      </span>
    </span>
  );
}
