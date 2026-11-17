import { z } from "zod";
import { KAB_QUESTIONS } from "@/lib/kab";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter.")
    .max(72, "Kata sandi maksimal 72 karakter."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter."),
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

const kabIds = KAB_QUESTIONS.map((question) => question.id);

export const assessmentSchema = z.object({
  type: z.enum(["PRE", "POST"]),
  answers: z
    .record(z.union([z.number().int().min(1).max(5), z.boolean()]))
    .refine(
      (answers) => kabIds.every((id) => answers[id] !== undefined),
      "Semua pertanyaan KAB wajib dijawab.",
    ),
});

export const attemptCreateSchema = z.object({
  scenarioSlug: z.string().min(1),
  restart: z.boolean().optional(),
});

export const attemptStepSchema = z.object({
  sceneId: z.string().min(1),
  actionId: z.string().min(1),
});

export const reflexSchema = z.object({
  questionId: z.string().min(1),
  choiceId: z.string().min(1),
});

export const adminScenarioSchema = z.object({
  title: z.string().trim().min(4).max(120).optional(),
  description: z.string().trim().min(10).max(500).optional(),
  difficulty: z.enum(["MUDAH", "SEDANG", "SULIT"]).optional(),
  level: z.number().int().min(1).max(10).optional(),
  estimatedMinutes: z.number().int().min(1).max(60).optional(),
  isPublished: z.boolean().optional(),
});
