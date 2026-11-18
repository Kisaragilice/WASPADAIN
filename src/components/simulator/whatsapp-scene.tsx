"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Download,
  FileWarning,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  ShieldAlert,
  Smile,
  Video,
} from "lucide-react";
import { StatusBar } from "./status-bar";
import { HighlightedText } from "./highlighted-text";
import type { ChatMessage, WhatsAppScene } from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

function SimpleAndroidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 9h10v7a2 2 0 0 1-2 2h-1v2h-1.8v-2h-.4v2H10v-2H9a2 2 0 0 1-2-2V9Z"
        fill="currentColor"
        opacity=".9"
      />
      <path d="m8.2 6.4-.9-1.5M15.8 6.4l.9-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9.2" cy="7.3" r=".7" fill="currentColor" />
      <circle cx="14.8" cy="7.3" r=".7" fill="currentColor" />
      <rect x="7" y="6.2" width="10" height="2.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

function MessageBubble({
  message,
  highlights,
}: {
  message: ChatMessage;
  highlights: string[];
}) {
  if (message.kind === "date") {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-md bg-white/75 px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-brand-ink/55 shadow-sm">
          {message.label}
        </span>
      </div>
    );
  }

  if (message.kind === "warning") {
    return (
      <div className="my-2 flex items-start gap-2 rounded-2xl border border-[#F4D35E]/60 bg-[#FFF7CE] px-3 py-2.5 text-[11px] leading-relaxed text-[#6C5200] shadow-sm">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message.text}</span>
      </div>
    );
  }

  if (message.kind === "file") {
    return (
      <div className="my-2 max-w-[92%] rounded-2xl bg-white p-2.5 shadow-sm">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2",
            message.danger ? "bg-[#FFF1F2]" : "bg-[#F1F6F3]",
          )}
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DDF4EE] text-[#0F7E70]">
            <SimpleAndroidIcon className="h-6 w-6" />
            <span className="absolute -bottom-1 rounded bg-[#E11D48] px-1 py-0.5 text-[6px] font-black uppercase text-white">
              {message.fileType}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] font-bold text-brand-ink">
              {message.fileName}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] font-medium text-brand-ink/60">
              {message.fileSize}
              {message.danger ? (
                <span className="font-bold uppercase text-[#D2153B]">· Aplikasi berbahaya</span>
              ) : null}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDF4EE] text-[#0F7E70]">
            <Download className="h-3.5 w-3.5" />
          </span>
        </div>
        {message.note ? (
          <p className="px-1 pt-2 text-[11px] leading-relaxed text-brand-ink/80">
            <HighlightedText text={message.note} terms={highlights} />
          </p>
        ) : null}
        <p className="mt-1 text-right text-[8px] text-brand-ink/50">{message.time}</p>
      </div>
    );
  }

  if (message.kind === "image") {
    return (
      <div className="my-2 max-w-[82%] rounded-2xl bg-white p-2 shadow-sm">
        <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-[#F4E8D5] to-[#E7D5B9]">
          <div className="grid h-20 w-20 grid-cols-4 gap-1 rounded bg-white p-2 shadow-inner">
            {Array.from({ length: 16 }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  "rounded-[1px]",
                  [0, 1, 2, 4, 6, 8, 9, 10, 11, 13, 15].includes(index)
                    ? "bg-brand-ink"
                    : "bg-white",
                )}
              />
            ))}
          </div>
        </div>
        <p className="px-1 pt-1.5 text-[10px] font-medium text-brand-ink/65">{message.caption}</p>
      </div>
    );
  }

  const outgoing = message.kind === "outgoing";
  return (
    <div className={cn("my-1.5 flex", outgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] break-words whitespace-pre-line rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed shadow-sm",
          outgoing
            ? "rounded-br-md bg-[#DDF4EE] text-brand-ink"
            : "rounded-bl-md bg-white text-brand-ink",
        )}
      >
        <HighlightedText text={message.text} terms={highlights} />
        <div className="mt-1 flex items-center justify-end gap-1 text-[8px] text-brand-ink/50">
          {message.time}
          {outgoing ? <span className="text-[#53BDEB]">✓✓</span> : null}
        </div>
      </div>
    </div>
  );
}

export function WhatsAppThread({
  scene,
  highlights = [],
  compact = false,
}: {
  scene: WhatsAppScene;
  highlights?: string[];
  compact?: boolean;
}) {
  return (
    <div className="flex min-h-[560px] flex-col bg-[#EFE7DA]">
      <div className="bg-white">
        <StatusBar />
        <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-1">
          <ArrowLeft className="h-5 w-5 shrink-0 text-brand-ink/70" />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A66] text-white">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/80" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-[12.5px] font-extrabold text-brand-ink">
              {scene.contact.name}
            </p>
            <p className="truncate text-[9.5px] text-brand-ink/60">{scene.contact.subtitle}</p>
          </div>
          <Video className="h-5 w-5 text-[#0F7E70]" />
          <Phone className="h-4 w-4 text-[#0F7E70]" />
          <MoreVertical className="h-4 w-4 text-[#0F7E70]" />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-y-auto px-3 pb-3",
          compact ? "max-h-[390px]" : "max-h-[420px]",
        )}
        style={{
          backgroundImage:
            "radial-gradient(rgba(16,27,45,.055) 1px, transparent 0), linear-gradient(#EFE7DA,#F3ECE1)",
          backgroundSize: "18px 18px, auto",
        }}
      >
        {scene.encryptionNote ? (
          <div className="mx-auto my-2 w-fit rounded-lg bg-white/75 px-3 py-1.5 text-center text-[9px] text-brand-ink/60 shadow-sm">
            {scene.encryptionNote}
          </div>
        ) : null}
        <div className="my-2 flex gap-2 rounded-xl bg-white/75 px-3 py-2.5 text-[10px] text-brand-ink/65 shadow-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-lavender">
            <AlertTriangle className="h-3.5 w-3.5 text-[#4C56A3]" />
          </span>
          <div>
            <p className="font-bold text-brand-ink/75">Nomor tidak dikenal · Indonesia</p>
            <p className="text-[9px]">Bukan kontak · Tidak ada grup bersama</p>
          </div>
        </div>
        {scene.messages.map((message, index) => (
          <MessageBubble key={index} message={message} highlights={highlights} />
        ))}
      </div>

      <div className="flex items-center gap-1.5 bg-[#F7F3EC] px-2 py-2">
        <span className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] text-brand-ink/55 shadow-sm">
          <Smile className="h-4 w-4" />
          <span className="truncate">{scene.composer ?? "Ketik pesan..."}</span>
          <Paperclip className="ml-auto h-4 w-4" />
          <Camera className="h-4 w-4" />
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F7E70] text-white">
          <Mic className="h-4 w-4" />
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 bg-[#101B2D] px-3 py-2 text-[9px] text-white/70">
        <ShieldAlert className="h-3 w-3 text-amber-300" />
        Ini ruang simulasi aman. Jangan masukkan data asli.
      </div>
    </div>
  );
}

export function FileTrapBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1F2] px-2 py-1 text-[9px] font-bold text-[#D2153B]">
      <FileWarning className="h-3 w-3" /> JEBAKAN FILE
    </span>
  );
}
