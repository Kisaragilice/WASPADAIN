"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Pencil,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { Channel, Difficulty } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_META } from "@/components/brand/icons";
import { DIFFICULTY_LABEL } from "@/lib/scenario/types";

export interface AdminScenario {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  channel: Channel;
  difficulty: Difficulty;
  level: number;
  estimatedMinutes: number;
  variantCount: number;
  isPublished: boolean;
  attemptCount: number;
}

const DIFFICULTIES: Difficulty[] = ["MUDAH", "SEDANG", "SULIT"];

export function AdminScenarioManager({ initialScenarios }: { initialScenarios: AdminScenario[] }) {
  const router = useRouter();
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [editing, setEditing] = useState<AdminScenario | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    difficulty: "MUDAH" as Difficulty,
    level: 1,
    estimatedMinutes: 5,
    isPublished: true,
  });

  const patch = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/scenarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Gagal menyimpan perubahan.");
    return data.scenario;
  };

  const togglePublish = async (scenario: AdminScenario, nextValue: boolean) => {
    setPendingId(scenario.id);
    setScenarios((current) =>
      current.map((item) => (item.id === scenario.id ? { ...item, isPublished: nextValue } : item)),
    );
    try {
      await patch(scenario.id, { isPublished: nextValue });
      toast.success(nextValue ? "Skenario dipublikasikan." : "Skenario disembunyikan dari katalog.");
      router.refresh();
    } catch (error) {
      setScenarios((current) =>
        current.map((item) =>
          item.id === scenario.id ? { ...item, isPublished: scenario.isPublished } : item,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Gagal mengubah publikasi.");
    } finally {
      setPendingId(null);
    }
  };

  const openEditor = (scenario: AdminScenario) => {
    setEditing(scenario);
    setDraft({
      title: scenario.title,
      description: scenario.description,
      difficulty: scenario.difficulty,
      level: scenario.level,
      estimatedMinutes: scenario.estimatedMinutes,
      isPublished: scenario.isPublished,
    });
  };

  const save = async () => {
    if (!editing) return;
    if (draft.title.trim().length < 4) {
      toast.error("Judul minimal 4 karakter.");
      return;
    }
    if (draft.description.trim().length < 10) {
      toast.error("Deskripsi minimal 10 karakter.");
      return;
    }
    setSaving(true);
    try {
      const updated = await patch(editing.id, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        difficulty: draft.difficulty,
        level: draft.level,
        estimatedMinutes: draft.estimatedMinutes,
        isPublished: draft.isPublished,
      });
      setScenarios((current) =>
        current.map((item) => (item.id === editing.id ? { ...item, ...updated } : item)),
      );
      toast.success("Skenario diperbarui.");
      setEditing(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan skenario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {scenarios.map((scenario) => {
          const channel = CHANNEL_META[scenario.channel];
          const Icon = channel.icon;
          const pending = pendingId === scenario.id;
          return (
            <div
              key={scenario.id}
              className={`rounded-3xl border bg-white p-3.5 shadow-card transition sm:p-4 ${
                scenario.isPublished ? "border-white" : "border-dashed border-brand-ink/15 opacity-80"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${channel.bg} ${channel.fg}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{channel.label}</Badge>
                    <Badge variant={scenario.difficulty === "SULIT" ? "danger" : "warning"}>
                      {DIFFICULTY_LABEL[scenario.difficulty]}
                    </Badge>
                    <Badge variant={scenario.isPublished ? "safe" : "outline"}>
                      {scenario.isPublished ? "Publik" : "Draf"}
                    </Badge>
                    <span className="text-[9px] font-semibold text-brand-ink/30">{scenario.slug}</span>
                  </div>
                  <h3 className="mt-1.5 text-[14px] font-extrabold leading-snug">{scenario.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-relaxed text-brand-ink/60">
                    {scenario.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] font-semibold text-brand-ink/55">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Level {scenario.level}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" /> {scenario.estimatedMinutes} menit
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> {scenario.variantCount} variasi
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {scenario.attemptCount} percobaan
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-ink/55" />
                    ) : scenario.isPublished ? (
                      <Eye className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-brand-ink/30" />
                    )}
                    <Switch
                      checked={scenario.isPublished}
                      disabled={pending}
                      onCheckedChange={(value) => togglePublish(scenario, value)}
                      aria-label={`${scenario.isPublished ? "Sembunyikan" : "Publikasikan"} ${scenario.title}`}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditor(scenario)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit skenario</DialogTitle>
            <DialogDescription>
              Perubahan berlaku pada katalog dan halaman simulasi. Konfigurasi percakapan
              tidak diubah dari panel ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-title">Judul</Label>
              <Input
                id="admin-title"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-description">Deskripsi</Label>
              <Textarea
                id="admin-description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                maxLength={500}
                rows={4}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-difficulty">Kesulitan</Label>
                <select
                  id="admin-difficulty"
                  value={draft.difficulty}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      difficulty: event.target.value as Difficulty,
                    }))
                  }
                  className="flex h-11 w-full rounded-2xl border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {DIFFICULTY_LABEL[difficulty]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-level">Level</Label>
                <Input
                  id="admin-level"
                  type="number"
                  min={1}
                  max={10}
                  value={draft.level}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      level: Number(event.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-minutes">Menit</Label>
                <Input
                  id="admin-minutes"
                  type="number"
                  min={1}
                  max={60}
                  value={draft.estimatedMinutes}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      estimatedMinutes: Number(event.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-cream/70 px-3.5 py-3">
              <div>
                <p className="text-[11.5px] font-bold">Tampilkan di katalog</p>
                <p className="text-[9.5px] text-brand-ink/55">
                  Jika dimatikan, skenario menjadi draf dan tidak bisa dimainkan.
                </p>
              </div>
              <Switch
                checked={draft.isPublished}
                onCheckedChange={(value) =>
                  setDraft((current) => ({ ...current, isPublished: value }))
                }
                aria-label="Publikasikan skenario"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
