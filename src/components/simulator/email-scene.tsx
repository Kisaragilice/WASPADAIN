"use client";

import {
  ArrowLeft,
  Archive,
  ChevronDown,
  CornerUpLeft,
  Mail,
  MoreVertical,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { StatusBar } from "./status-bar";
import { HighlightedText } from "./highlighted-text";
import type { EmailScene } from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

export function EmailThread({
  scene,
  highlights = [],
  compact = false,
}: {
  scene: EmailScene;
  highlights?: string[];
  compact?: boolean;
}) {
  return (
    <div className="min-h-[600px] bg-white">
      <div className="border-b border-brand-ink/[0.06] bg-[#F7F9FC]">
        <StatusBar />
        <div className="flex items-center justify-between px-3 pb-2 text-brand-ink/55">
          <div className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5" />
            <Archive className="h-4 w-4" />
            <Trash2 className="h-4 w-4" />
            <Mail className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div
        className={`overflow-y-auto px-4 pb-5 pt-3 ${
          compact ? "max-h-[430px]" : "max-h-[560px]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-bold leading-snug text-brand-ink">
            {scene.subject}
          </h2>
          <Star className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink/30" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-[#EEF3FB] px-2 py-0.5 text-[9px] font-semibold text-brand-ink/55">
            Kotak Masuk
          </span>
          <span className="rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[9px] font-bold text-[#D2153B]">
            ! Penting
          </span>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8C1D2F] text-sm font-black text-white">
            D
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[12px] font-extrabold text-brand-ink">{scene.fromName}</p>
              {scene.senderFlag ? (
                <span className="rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[8.5px] font-bold text-[#D2153B]">
                  {scene.senderFlag}
                </span>
              ) : null}
              <span className="ml-auto text-[9px] text-brand-ink/40">{scene.time}</span>
            </div>
            <p className="mt-0.5 break-all text-[10px] text-brand-ink/55">
              <HighlightedText
                text={scene.fromAddress}
                terms={highlights}
                markClassName="highlight-flag"
              />
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[9.5px] text-brand-ink/40">
              kepada {scene.to} <ChevronDown className="h-3 w-3" />
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t border-brand-ink/[0.07] pt-4 text-[11.5px] leading-relaxed text-brand-ink/80">
          {scene.blocks.map((block, index) => {
            if (block.type === "alert") {
              return (
                <div key={index} className="rounded-xl bg-[#FFF0F1] p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#D2153B]">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {block.title}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed">
                    <HighlightedText text={block.text} terms={highlights} />
                  </p>
                </div>
              );
            }
            if (block.type === "cta") {
              return (
                <div
                  key={index}
                  className="rounded-md bg-[#0F7E70] px-4 py-3 text-center text-[11.5px] font-bold text-white shadow-sm"
                >
                  {block.text} →
                </div>
              );
            }
            if (block.type === "signature") {
              return (
                <p key={index} className="whitespace-pre-line pt-2 text-[10.5px] leading-relaxed text-brand-ink/55">
                  {block.text}
                </p>
              );
            }
            return (
              <p key={index}>
                <HighlightedText text={block.text} terms={highlights} />
              </p>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-brand-ink/[0.07] pt-3 text-[10px] text-brand-ink/45">
          <CornerUpLeft className="h-3.5 w-3.5" /> Balas
          <span className="ml-auto">waspadain.id/simulasi-email</span>
        </div>
      </div>

      <div className={cn("flex items-center justify-center gap-2 bg-[#101B2D] px-3 py-2 text-[9px] text-white/55")}>
        <ShieldAlert className="h-3 w-3 text-amber-300" />
        Ruang simulasi · email dan alamat bersifat sintetis
      </div>
    </div>
  );
}
