"use client";

import { create } from "zustand";
import { toast } from "sonner";

export interface SimulationResult {
  outcome: "SAFE" | "VULNERABLE";
  score: number;
  xpEarned: number;
  feedback: string;
  newBadges: string[];
}

interface SimulatorState {
  attemptId: string;
  slug: string;
  startSceneId: string;
  sceneId: string | null;
  pending: boolean;
  feedback: string | null;
  completed: boolean;
  result: SimulationResult | null;
  init: (payload: {
    attemptId: string;
    slug: string;
    startSceneId: string;
    currentSceneId: string | null;
  }) => void;
  submit: (sceneId: string, actionId: string) => Promise<void>;
  dismissFeedback: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  attemptId: "",
  slug: "",
  startSceneId: "",
  sceneId: null,
  pending: false,
  feedback: null,
  completed: false,
  result: null,

  init: ({ attemptId, slug, startSceneId, currentSceneId }) => {
    set({
      attemptId,
      slug,
      startSceneId,
      sceneId: currentSceneId ?? startSceneId,
      pending: false,
      feedback: null,
      completed: false,
      result: null,
    });
  },

  submit: async (sceneId, actionId) => {
    const { attemptId, pending } = get();
    if (pending || !attemptId) return;
    set({ pending: true });

    try {
      const response = await fetch(`/api/attempts/${attemptId}/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId, actionId }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Gagal memproses pilihan.");
        set({ pending: false });
        return;
      }

      if (data.completed) {
        set({
          pending: false,
          completed: true,
          result: {
            outcome: data.outcome,
            score: data.score,
            xpEarned: data.xpEarned,
            feedback: data.feedback,
            newBadges: data.newBadges ?? [],
          },
          sceneId: null,
        });
        if (data.outcome === "SAFE") {
          toast.success(`Aman! +${data.xpEarned} XP`);
        } else {
          toast.info("Tidak apa-apa — saatnya membongkar polanya.");
        }
        return;
      }

      set({
        pending: false,
        sceneId: data.nextSceneId,
        feedback: data.feedback ?? null,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      set({ pending: false });
      toast.error("Koneksi bermasalah. Coba lagi.");
    }
  },

  dismissFeedback: () => set({ feedback: null }),
}));
