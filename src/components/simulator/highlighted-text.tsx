import { cn } from "@/lib/utils";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({
  text,
  terms,
  className,
  markClassName = "highlight-flag",
}: {
  text: string;
  terms: string[];
  className?: string;
  markClassName?: string;
}) {
  const cleaned = terms.filter((term) => term && text.includes(term));
  if (cleaned.length === 0) {
    return <span className={className}>{text}</span>;
  }
  const pattern = new RegExp(
    `(${cleaned.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|")})`,
    "g",
  );
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        cleaned.includes(part) ? (
          <mark key={index} className={cn("bg-transparent", markClassName)}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}
