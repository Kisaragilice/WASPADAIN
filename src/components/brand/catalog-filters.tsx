"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { value: "", label: "Semua kanal" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
];

const CATEGORIES = [
  { value: "", label: "Semua pola" },
  { value: "Format Jebakan", label: "Format Jebakan" },
  { value: "Umpan Link", label: "Umpan Link" },
  { value: "Identitas Palsu", label: "Identitas Palsu" },
];

const DIFFICULTIES = [
  { value: "", label: "Semua level" },
  { value: "MUDAH", label: "Mudah" },
  { value: "SEDANG", label: "Sedang" },
  { value: "SULIT", label: "Sulit" },
];

export function CatalogFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/simulasi/katalog?${next.toString()}`);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setParam("q", query.trim());
  };

  const hasFilters = ["kanal", "kategori", "sulit", "q"].some((key) => params.get(key));

  return (
    <div className="rounded-3xl border border-white bg-white p-3.5 shadow-card sm:p-4">
      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari skenario, modus, atau kanal..."
            className="pl-10"
            aria-label="Cari skenario"
          />
        </div>
        <Button type="submit" variant="dark" className="shrink-0">
          Cari
        </Button>
      </form>

      <div className="mt-3 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CHANNELS.map((item) => (
            <FilterChip
              key={item.value}
              active={(params.get("kanal") ?? "") === item.value}
              onClick={() => setParam("kanal", item.value)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((item) => (
            <FilterChip
              key={item.value}
              active={(params.get("kategori") ?? "") === item.value}
              onClick={() => setParam("kategori", item.value)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {DIFFICULTIES.map((item) => (
            <FilterChip
              key={item.value}
              active={(params.get("sulit") ?? "") === item.value}
              onClick={() => setParam("sulit", item.value)}
            >
              {item.label}
            </FilterChip>
          ))}
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                router.push("/simulasi/katalog");
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-[#B91C2D] hover:bg-brand-blush"
            >
              <X className="h-3 w-3" /> Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[32px] shrink-0 rounded-full border px-3 py-1 text-[10.5px] font-semibold transition",
        active
          ? "border-brand-ink bg-brand-ink text-white"
          : "border-brand-ink/10 bg-white text-brand-ink/55 hover:border-brand-ink/20 hover:text-brand-ink",
      )}
    >
      {children}
    </button>
  );
}
