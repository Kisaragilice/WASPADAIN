"use client";

import { RADAR_CATEGORIES, type RadarCategory } from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

export interface RadarDatum {
  key: RadarCategory;
  value: number;
  measured: boolean;
  vulnerable: number;
  exposures: number;
}

export function RadarChart({
  data,
  size = 320,
  className,
}: {
  data: RadarDatum[];
  size?: number;
  className?: string;
}) {
  const center = size / 2;
  const radius = size * 0.33;
  const count = data.length;
  const angleFor = (index: number) => (Math.PI * 2 * index) / count - Math.PI / 2;

  const point = (value: number, index: number) => {
    const angle = angleFor(index);
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r] as const;
  };

  const rings = [20, 40, 60, 80, 100];
  const polygon = data.map((item, index) => point(item.value, index).join(",")).join(" ");

  return (
    <div className={cn("relative mx-auto w-full max-w-[360px]", className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Grafik radar kerentanan: ${data
          .map((item) => `${item.key} ${item.value}`)
          .join(", ")}`}
        className="h-auto w-full overflow-visible"
      >
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={data
              .map((_, index) => {
                const angle = angleFor(index);
                const r = (ring / 100) * radius;
                return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
              })
              .join(" ")}
            fill={ring === 100 ? "rgba(255,255,255,.65)" : "none"}
            stroke="rgba(16,27,45,.1)"
            strokeWidth="1"
          />
        ))}
        {data.map((_, index) => {
          const [x, y] = point(100, index);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(16,27,45,.09)"
              strokeWidth="1"
            />
          );
        })}
        <polygon
          points={polygon}
          fill="rgba(15,126,112,.22)"
          stroke="#0F7E70"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {data.map((item, index) => {
          const [x, y] = point(item.value, index);
          return (
            <g key={item.key}>
              <circle
                cx={x}
                cy={y}
                r={item.measured ? 4.5 : 3}
                fill={item.measured ? "#0F7E70" : "#fff"}
                stroke="#0F7E70"
                strokeWidth="2"
              />
            </g>
          );
        })}
        {RADAR_CATEGORIES.map((category, index) => {
          const [x, y] = point(122, index);
          const anchor =
            x < center - 8 ? "end" : x > center + 8 ? "start" : "middle";
          return (
            <g key={category.key}>
              <text
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-brand-ink text-[11px] font-bold"
                style={{ fontSize: 11 }}
              >
                {category.short}
              </text>
              <text
                x={x}
                y={y + 14}
                textAnchor={anchor}
                className="fill-brand-ink/50"
                style={{ fontSize: 9 }}
              >
                {data[index]?.measured ? `${data[index].value}%` : "netral"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
