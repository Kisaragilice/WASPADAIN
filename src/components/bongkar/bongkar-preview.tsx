import { AlertTriangle, Download, Flag, Landmark, Lock, Mail, ShieldAlert } from "lucide-react";
import type {
  BrowserScene,
  ChatMessage,
  EmailScene,
  SmsScene,
  WhatsAppScene,
} from "@/lib/scenario/types";
import { HighlightedText } from "@/components/simulator/highlighted-text";
import { cn } from "@/lib/utils";

function termsMatch(value: string, terms: string[]) {
  return terms.some((term) => term && value.includes(term));
}

function FlagChip({ labels }: { labels: string[] }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#E11D48] px-2.5 py-1 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">
      <Flag className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate">{labels[0] ?? "RED FLAG"}</span>
    </span>
  );
}

export function BongkarPreview({
  scene,
  highlights,
  flagLabels,
  className,
}: {
  scene: WhatsAppScene | SmsScene | EmailScene | BrowserScene;
  highlights: string[];
  flagLabels: string[];
  className?: string;
}) {
  if (scene.type === "whatsapp") {
    const messages = scene.messages.filter((message) => {
      if (message.kind === "date" || message.kind === "warning") return false;
      if (message.kind === "file") return true;
      if (message.kind === "incoming") return termsMatch(message.text, highlights);
      return false;
    });
    return (
      <div className={cn("overflow-hidden rounded-3xl border border-brand-ink/[0.06] bg-white p-3 shadow-sm", className)}>
        <div className="flex items-center gap-2 rounded-2xl bg-[#F4F7FB] px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-lavender text-[#4C56A3]">
            <Landmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-extrabold">{scene.contact.name}</p>
            <p className="truncate text-[8.5px] text-brand-ink/45">{scene.contact.subtitle}</p>
          </div>
          <FlagChip labels={flagLabels} />
        </div>
        <div className="mt-2 space-y-2">
          {(messages.length ? messages : scene.messages.filter((m) => m.kind === "incoming")).map(
            (message, index) => (
              <ChatPreviewBubble key={index} message={message} highlights={highlights} />
            ),
          )}
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[8px] text-brand-ink/35">
          <Lock className="h-2.5 w-2.5" /> Layar yang baru saja kamu lihat
        </p>
      </div>
    );
  }

  if (scene.type === "sms") {
    return (
      <div className={cn("overflow-hidden rounded-3xl border border-brand-ink/[0.06] bg-white p-3 shadow-sm", className)}>
        <div className="flex items-center gap-2 border-b border-brand-ink/[0.06] pb-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCE7F7] text-[#1D4E89]">
            <Landmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold">{scene.sender.name}</p>
            <p className="text-[8.5px] text-brand-ink/45">{scene.sender.subtitle} · {scene.timeLabel}</p>
          </div>
          <FlagChip labels={flagLabels} />
        </div>
        <div className="mt-2 rounded-2xl bg-[#EEF3FB] p-2.5">
          {scene.messages
            .filter((message) => message.kind === "incoming")
            .map((message, index) =>
              message.kind === "incoming" ? (
                <p key={index} className="whitespace-pre-line break-words text-[10.5px] leading-relaxed text-brand-ink/80">
                  <HighlightedText text={message.text} terms={highlights} />
                </p>
              ) : null,
            )}
        </div>
        <p className="mt-1.5 text-[8px] text-brand-ink/35">Pesan SMS sintetis · bukan pesan asli</p>
      </div>
    );
  }

  if (scene.type === "email") {
    return (
      <div className={cn("overflow-hidden rounded-3xl border border-brand-ink/[0.06] bg-white p-3 shadow-sm", className)}>
        <div className="flex items-center justify-between gap-2 border-b border-brand-ink/[0.06] pb-2">
          <p className="flex items-center gap-1.5 text-[9px] font-bold text-brand-ink/50">
            <Mail className="h-3 w-3" /> Kotak masuk · {scene.time}
          </p>
          <FlagChip labels={flagLabels} />
        </div>
        <h4 className="mt-2 text-[12px] font-extrabold leading-snug">{scene.subject}</h4>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#FFF5F6] p-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8C1D2F] text-[10px] font-black text-white">
            D
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold">{scene.fromName}</p>
            <p className="break-all text-[9px] text-[#B91C2D]">
              <HighlightedText text={scene.fromAddress} terms={highlights} />
            </p>
          </div>
        </div>
        <div className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-brand-ink/70">
          {scene.blocks
            .filter(
              (block) =>
                termsMatch(block.text, highlights) ||
                termsMatch(block.title ?? "", highlights) ||
                block.type === "alert",
            )
            .slice(0, 3)
            .map((block, index) => (
              <p
                key={index}
                className={cn(
                  block.type === "alert" && "rounded-lg bg-[#FFF0F1] p-2 text-[9.5px]",
                )}
              >
                {block.title ? (
                  <span className="mb-0.5 block text-[8px] font-black uppercase text-[#B91C2D]">
                    <HighlightedText text={block.title} terms={highlights} />
                  </span>
                ) : null}
                <HighlightedText text={block.text} terms={highlights} />
              </p>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-brand-ink/[0.06] bg-white shadow-sm", className)}>
      <div className="flex items-center gap-1.5 bg-[#EEF2F8] px-2.5 py-2">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] text-brand-ink/40">‹</span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-white px-2 py-1 text-[8px] text-brand-ink/55">
          <HighlightedText text={scene.url} terms={highlights} />
        </span>
        {flagLabels[0] ? (
          <span className="shrink-0 rounded-full bg-[#E11D48] px-2 py-0.5 text-[7px] font-black uppercase text-white">
            🚩 flag
          </span>
        ) : null}
      </div>
      {scene.warning ? (
        <div className="flex items-start gap-1.5 bg-[#FDE8EA] px-2.5 py-1.5 text-[8px] leading-snug text-[#B91C2D]">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{scene.warning.body}</span>
        </div>
      ) : null}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-mint text-primary">
            <Landmark className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[9px] font-black uppercase">{scene.brand.name}</p>
            <p className="truncate text-[7px] uppercase tracking-wide text-brand-ink/40">
              {scene.brand.tagline}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] font-extrabold leading-snug">
          {scene.pageTitle}
        </p>
        <div className="mt-2 space-y-1.5">
          {scene.fields
            .filter((field) => termsMatch(field.label, highlights) || field.danger)
            .slice(0, 3)
            .map((field, index) => (
              <div key={index} className="rounded-lg bg-[#FFF5F6] px-2 py-1.5">
                <p className="text-[7.5px] font-bold text-brand-ink/55">
                  <HighlightedText text={field.label} terms={highlights} />
                </p>
                <p className="truncate text-[8.5px] text-brand-ink/70">
                  <HighlightedText text={field.value} terms={highlights} />
                </p>
              </div>
            ))}
        </div>
        <div className="mt-2 rounded-full bg-[#0F7E70] px-3 py-1.5 text-center text-[8px] font-bold text-white">
          {scene.primaryCta}
        </div>
      </div>
      <div className="flex items-center gap-1 bg-[#101B2D] px-2.5 py-1.5 text-[7px] text-white/50">
        <ShieldAlert className="h-2.5 w-2.5 text-amber-300" /> Layar simulasi Waspadain
      </div>
    </div>
  );
}

function ChatPreviewBubble({
  message,
  highlights,
}: {
  message: ChatMessage;
  highlights: string[];
}) {
  if (message.kind === "file") {
    return (
      <div className="rounded-xl bg-[#FFF5F6] p-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FCE3E5] text-[#B91C2D]">
            <Download className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[9.5px] font-bold">
              <HighlightedText text={message.fileName} terms={highlights} />
            </p>
            <p className="text-[7.5px] font-bold uppercase text-[#B91C2D]">
              {message.fileType} · aplikasi berbahaya
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (message.kind === "incoming") {
    return (
      <div className="rounded-xl bg-[#F4F7FB] p-2.5">
        <p className="whitespace-pre-line break-words text-[10px] leading-relaxed text-brand-ink/80">
          <HighlightedText text={message.text} terms={highlights} />
        </p>
      </div>
    );
  }
  return null;
}
