"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileText,
  ImagePlus,
  KeyRound,
  Landmark,
  Lock,
  MoreVertical,
  RefreshCw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { HighlightedText } from "./highlighted-text";
import type { BrowserScene } from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

function parseDuration(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function formatDuration(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function useCountdown(value?: string) {
  const initial = value ? parseDuration(value) : null;
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    setSeconds(value ? parseDuration(value) : null);
  }, [value]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((current) =>
        current === null || current === 0 ? current : current - 1,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return seconds === null ? value : formatDuration(seconds);
}

export function BrowserSite({
  scene,
  highlights = [],
  compact = false,
}: {
  scene: BrowserScene;
  highlights?: string[];
  compact?: boolean;
}) {
  const timer = useCountdown(scene.timer?.value);

  return (
    <div className="min-h-[600px] bg-[#F6F8FC]">
      <div className="bg-[#EEF2F8] px-2.5 pb-2 pt-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-[10px] text-brand-ink/50">‹</span>
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
            <Lock className="h-3 w-3 shrink-0 text-emerald-600" />
            <span className="truncate text-[9px] font-medium text-brand-ink/60">
              <HighlightedText text={scene.url} terms={highlights} markClassName="highlight-flag" />
            </span>
            <RefreshCw className="ml-auto h-3 w-3 shrink-0 text-brand-ink/35" />
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-ink/55 shadow-sm">
            2
          </span>
          <MoreVertical className="h-4 w-4 text-brand-ink/40" />
        </div>
      </div>

      <div
        className={`overflow-y-auto bg-white ${compact ? "max-h-[480px]" : "max-h-[620px]"}`}
      >
        {scene.warning ? (
          <div className="flex items-start gap-2 border-b border-[#F5B8BF] bg-[#FDE8EA] px-3 py-2 text-[#B91C2D]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="text-[9.5px] font-extrabold uppercase tracking-wide">
                {scene.warning.title}
              </p>
              <p className="mt-0.5 text-[9.5px] leading-relaxed">{scene.warning.body}</p>
            </div>
          </div>
        ) : null}

        <div className="relative flex items-center gap-2.5 bg-[#EEF3FB] px-4 py-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F7E70] text-white">
            <Landmark className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-black uppercase leading-tight tracking-wide text-brand-ink">
              {scene.brand.name}
            </p>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-brand-ink/45">
              {scene.brand.tagline}
            </p>
          </div>
          {scene.brand.badge ? (
            <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold text-brand-ink/55">
              {scene.brand.badge}
            </span>
          ) : null}
          <span className="absolute -right-1 top-1 rotate-12 rounded bg-[#E11D48] px-2 py-0.5 text-[7px] font-black uppercase text-white">
            Simulasi
          </span>
        </div>

        <div className="px-4 py-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF4EE] px-2 py-1 text-[8.5px] font-bold text-[#0F7E70]">
            <CheckCircle2 className="h-3 w-3" /> Program resmi nasabah terpilih
          </span>
          <h2 className="mt-2.5 text-[20px] font-extrabold leading-tight text-brand-ink">
            {scene.pageTitle}
          </h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-brand-ink/60">{scene.intro}</p>

          {scene.timer ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#FCF3C8] px-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60">
                <AlertTriangle className="h-4 w-4 text-[#9A6B00]" />
              </span>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wide text-[#7C5A00]">
                  {scene.timer.label}
                </p>
                <p className="text-[12px] font-extrabold text-brand-ink">
                  {scene.timer.note ? `${scene.timer.note} ` : ""}
                  <span className="text-[#D2153B]">{timer}</span>
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {scene.fields.map((field, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-brand-ink/75">
                    <HighlightedText text={field.label} terms={highlights} markClassName="highlight-flag" />
                  </p>
                  {field.status ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold",
                        field.danger
                          ? "bg-[#FDE2E4] text-[#B91C2D]"
                          : "bg-[#DDF4EE] text-[#0B6C61]",
                      )}
                    >
                      {field.status}
                    </span>
                  ) : null}
                </div>
                {field.kind === "file" ? (
                  <div
                    className={cn(
                      "mt-1.5 flex items-center gap-2.5 rounded-xl border-2 border-dashed px-3 py-3",
                      field.danger
                        ? "border-[#F5B8BF] bg-[#FFF5F6]"
                        : "border-brand-ink/10 bg-[#F7F9FC]",
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCE7F7] text-[#1D4E89]">
                      <ImagePlus className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold text-brand-ink/80">
                        {field.value}
                      </p>
                      <p className="text-[8px] text-brand-ink/40">Ukuran maksimal 10MB</p>
                    </div>
                    <Upload className="ml-auto h-3.5 w-3.5 text-brand-ink/35" />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "mt-1.5 flex min-h-[38px] items-center gap-2 rounded-lg px-3 text-[10.5px]",
                      field.danger
                        ? "border border-[#F5B8BF] bg-[#FFF5F6]"
                        : "bg-[#F1F4F9]",
                    )}
                  >
                    {field.kind === "password" ? (
                      <KeyRound className="h-3.5 w-3.5 shrink-0 text-brand-ink/35" />
                    ) : field.kind === "qr" ? (
                      <FileText className="h-3.5 w-3.5 shrink-0 text-brand-ink/35" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 shrink-0 text-brand-ink/30" />
                    )}
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        field.value.includes("Masukkan")
                          ? "text-brand-ink/35"
                          : "font-medium text-brand-ink/75",
                      )}
                    >
                      <HighlightedText text={field.value} terms={highlights} />
                    </span>
                  </div>
                )}
                {field.hint ? (
                  <p className="mt-1 text-[8.5px] leading-relaxed text-brand-ink/40">
                    {field.hint}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-full bg-[#0F7E70] px-4 py-3 text-center text-[11.5px] font-bold text-white shadow-md">
            {scene.primaryCta} →
          </div>
          {scene.footnote ? (
            <p className="mt-2.5 text-center text-[8px] text-brand-ink/35">{scene.footnote}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 bg-[#101B2D] px-3 py-2 text-[9px] text-white/55">
        <ShieldAlert className="h-3 w-3 text-amber-300" />
        {scene.simLabel ?? "Ini di dalam ruang simulasi"}
      </div>
    </div>
  );
}
