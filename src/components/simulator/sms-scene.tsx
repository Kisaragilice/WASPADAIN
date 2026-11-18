"use client";

import {
  ArrowLeft,
  Camera,
  Landmark,
  MessageSquare,
  MoreVertical,
  Search,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { StatusBar } from "./status-bar";
import { HighlightedText } from "./highlighted-text";
import type { ChatMessage, SmsScene } from "@/lib/scenario/types";

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <span className="whitespace-pre-line break-words">
      {parts.map((part, index) =>
        part.startsWith("http") ? (
          <span
            key={index}
            className="break-all font-semibold text-[#0F7E70] underline decoration-primary/30 underline-offset-2"
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

export function SmsThread({
  scene,
  highlights = [],
  compact = false,
}: {
  scene: SmsScene;
  highlights?: string[];
  compact?: boolean;
}) {
  return (
    <div className="flex min-h-[560px] flex-col bg-[#EDF2FA]">
      <div className="bg-[#EEF3FB]">
        <StatusBar />
        <div className="flex items-center gap-2.5 bg-white px-3 pb-2.5 pt-1">
          <ArrowLeft className="h-5 w-5 shrink-0 text-brand-ink/65" />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCE7F7] text-[#1D4E89]">
            <Landmark className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-[13px] font-extrabold">
              {scene.sender.name}
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-brand-ink/30 text-[7px] font-bold text-brand-ink/60">
                i
              </span>
            </p>
            <p className="truncate text-[9.5px] text-brand-ink/60">{scene.sender.subtitle}</p>
          </div>
          <Search className="h-4 w-4 text-brand-ink/65" />
          <MoreVertical className="h-4 w-4 text-brand-ink/65" />
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto px-3 pb-3 ${
          compact ? "max-h-[390px]" : "max-h-[420px]"
        }`}
      >
        <div className="my-2 flex items-start gap-2 rounded-xl bg-[#EEF3FB] px-3 py-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
            <MessageSquare className="h-3.5 w-3.5 text-[#1D4E89]" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-brand-ink/75">
              {scene.sender.note ?? "Pengirim tidak tersimpan dalam kontak Anda."}
            </p>
            <p className="text-[9px] leading-relaxed text-brand-ink/55">
              Berhati-hatilah terhadap permintaan data pribadi.
            </p>
          </div>
        </div>

        <div className="my-2 flex justify-center">
          <span className="rounded-full bg-[#DCE7F7] px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-brand-ink/55">
            {scene.timeLabel}
          </span>
        </div>

        {scene.messages.map((message, index) => (
          <SmsBubble key={index} message={message} highlights={highlights} />
        ))}
      </div>

      <div className="flex items-center gap-2 bg-[#E3EBF6] px-3 py-2">
        <span className="rounded-full bg-[#D6E4F5] px-2.5 py-1.5 text-[9px] font-bold text-[#1D4E89]">
          SIM 1
        </span>
        <span className="flex flex-1 items-center rounded-full bg-white px-3 py-2 text-[10px] text-brand-ink/55">
          {scene.composer ?? "Ketik pesan SMS..."}
        </span>
        <Smartphone className="h-4 w-4 text-brand-ink/50" />
        <Camera className="h-4 w-4 text-brand-ink/50" />
      </div>

      <div className="flex items-center justify-center gap-2 bg-[#101B2D] px-3 py-2 text-[9px] text-white/70">
        <ShieldAlert className="h-3 w-3 text-amber-300" />
        Ruang simulasi · pengirim dan nomor bersifat sintetis
      </div>
    </div>
  );
}

function SmsBubble({
  message,
  highlights,
}: {
  message: ChatMessage;
  highlights: string[];
}) {
  if (message.kind === "date" || message.kind === "warning") return null;
  if (message.kind === "file") {
    return (
      <div className="my-2 rounded-2xl bg-white p-3 text-[11px] shadow-sm">
        <p className="font-bold">{message.fileName}</p>
        <p className="text-[9px] text-brand-ink/55">
          {message.fileType} · {message.fileSize}
        </p>
      </div>
    );
  }
  if (message.kind === "image") {
    return <div className="my-2 rounded-xl bg-white p-3 text-[11px]">{message.caption}</div>;
  }

  return (
    <div className="my-1.5 flex justify-start">
      <div className="max-w-[94%] rounded-2xl bg-white px-3.5 py-2.5 text-[11.5px] leading-relaxed text-brand-ink shadow-sm">
        {highlights.length > 0 ? (
          <HighlightedText text={message.text} terms={highlights} />
        ) : (
          <Linkified text={message.text} />
        )}
        <p className="mt-1.5 text-right text-[8px] text-brand-ink/50">{message.time}</p>
      </div>
    </div>
  );
}
