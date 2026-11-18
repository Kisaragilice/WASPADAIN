import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = {
  title: "Atur ulang kata sandi",
  description: "Buat kata sandi baru untuk akun WASPADAIN.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawToken = Array.isArray(query.token) ? query.token[0] : query.token;
  const token = rawToken?.trim() ?? "";
  const validShape = /^[a-f0-9]{32,256}$/i.test(token);

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
        Pemulihan akun
      </p>
      <h1 className="mt-1.5 text-2xl font-extrabold leading-tight sm:text-[28px]">
        Buat kata sandi baru
      </h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-brand-ink/60">
        Tautan ini hanya berlaku sekali. Setelah disimpan, semua sesi lama otomatis
        dikeluarkan.
      </p>
      <div className="mt-5">
        {validShape ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4">
            <div
              role="alert"
              className="rounded-2xl border border-[#F3CDD2] bg-brand-blush p-4 text-[12px] leading-relaxed text-[#B91C2D]"
            >
              <p className="flex items-center gap-2 font-bold">
                <ShieldAlert className="h-4 w-4" /> Tautan tidak valid
              </p>
              <p className="mt-1.5">
                Tautan reset tidak lengkap, sudah dipakai, atau sudah kedaluwarsa.
                Minta tautan baru untuk melanjutkan.
              </p>
            </div>
            <Link
              href="/lupa-password"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Minta tautan baru
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
