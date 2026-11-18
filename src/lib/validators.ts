import { z } from "zod";
import { KAB_QUESTIONS } from "@/lib/kab";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email terlalu panjang.")
  .email("Format email tidak valid.");

export const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(72, "Kata sandi maksimal 72 karakter.");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi.")
    .max(72, "Kata sandi maksimal 72 karakter."),
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
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi.").max(72),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi wajib diisi.").max(72),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini.",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(32, "Token reset tidak valid.")
      .max(256, "Token reset tidak valid.")
      .regex(/^[a-f0-9]+$/i, "Token reset tidak valid."),
    password: passwordSchema,
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi wajib diisi.").max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
    )
    .refine(
      (answers) =>
        Object.keys(answers).every((key) => kabIds.includes(key)),
      "Jawaban memuat pertanyaan yang tidak dikenal.",
    ),
});

export const attemptCreateSchema = z.object({
  scenarioSlug: z.string().min(1).max(120),
  restart: z.boolean().optional(),
});

export const attemptStepSchema = z.object({
  sceneId: z.string().min(1).max(120),
  actionId: z.string().min(1).max(120),
});

export const reflexSchema = z.object({
  questionId: z.string().min(1).max(120),
  choiceId: z.string().min(1).max(120),
});

export const adminScenarioSchema = z.object({
  title: z.string().trim().min(4).max(120).optional(),
  description: z.string().trim().min(10).max(500).optional(),
  difficulty: z.enum(["MUDAH", "SEDANG", "SULIT"]).optional(),
  level: z.number().int().min(1).max(10).optional(),
  estimatedMinutes: z.number().int().min(1).max(60).optional(),
  isPublished: z.boolean().optional(),
});

export const idSchema = z.string().min(10).max(64);
