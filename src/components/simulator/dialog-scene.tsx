"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { DialogScene } from "@/lib/scenario/types";
import { StatusBar } from "./status-bar";

export function DialogSceneView({
  scene,
  onChoose,
  pending,
}: {
  scene: DialogScene;
  onChoose: (choiceId: string) => void;
  pending: boolean;
}) {
  const choices = [...(scene.decision?.choices ?? [])].sort((a, b) =>
    a.tone === "safe" ? -1 : b.tone === "safe" ? 1 : 0,
  );

  return (
    <div className="relative flex min-h-[560px] flex-col overflow-hidden bg-[#101B2D]">
      <div aria-hidden className="absolute inset-0 opacity-45 blur-[2px]">
        <StatusBar dark />
        <div className="mx-4 mt-6 rounded-2xl bg-white/15 p-4">
          <div className="h-3 w-24 rounded bg-white/25" />
          <div className="mt-3 h-2 w-full rounded bg-white/15" />
          <div className="mt-2 h-2 w-4/5 rounded bg-white/15" />
        </div>
        <div className="mx-4 mt-4 h-36 rounded-2xl bg-white/10" />
        <div className="mx-4 mt-4 h-24 rounded-2xl bg-white/10" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-4 pt-10">
        <div className="rounded-2xl bg-white p-5 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-mint text-primary">
              <ShieldAlert className="h-5 w-5" />
              <span className="absolute -bottom-1 rounded bg-[#E11D48] px-1 text-[6px] font-black text-white">
                APK
              </span>
            </span>
            <p className="text-[13px] font-extrabold text-brand-ink">{scene.appName}</p>
          </div>
          <h2 className="mt-3 text-[17px] font-extrabold leading-snug text-brand-ink">
            {scene.permissionTitle}
          </h2>
          <p className="mt-2 text-[11.5px] leading-relaxed text-brand-ink/65">
            {scene.permissionBody}
          </p>

          <div className="mt-5 flex items-center justify-end gap-1">
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                disabled={pending}
                onClick={() => onChoose(choice.id)}
                className="min-h-[42px] rounded-lg px-4 text-[11px] font-extrabold uppercase tracking-wide text-[#0F7E70] transition hover:bg-brand-mint/40 disabled:opacity-50"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto mb-5 mt-8 rounded-3xl border border-white/15 bg-white/95 p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDE2E4] px-2.5 py-1 text-[9px] font-extrabold text-[#B91C2D]">
              ✋ Tahan dulu!
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#B91C2D]">
              <AlertTriangle className="h-3 w-3" /> Zona bahaya
            </span>
          </div>
          <h3 className="mt-2 text-[16px] font-extrabold leading-tight text-brand-ink">
            Awas jebakan pencuri saldo!
          </h3>
          <p className="mt-1.5 text-[11px] leading-relaxed text-brand-ink/65">
            Di dunia nyata, menekan <strong className="text-[#B91C2D]">Izinkan</strong> membuat
            berkas .APK ini menyadap SMS dan mencuri kode OTP m-banking Anda secara otomatis.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-primary">
            <ShieldAlert className="h-3 w-3" />
            Simulasi keamanan siber Waspadain · bebas risiko
          </p>
        </div>
      </div>
    </div>
  );
}
