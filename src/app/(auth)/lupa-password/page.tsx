import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = {
  title: "Lupa kata sandi",
  description: "Minta tautan atur ulang kata sandi akun WASPADAIN.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
        Pemulihan akun
      </p>
      <h1 className="mt-1.5 text-2xl font-extrabold leading-tight sm:text-[28px]">
        Lupa kata sandi?
      </h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-brand-ink/60">
        Masukkan email akunmu. Kami akan mengirim tautan aman untuk membuat kata
        sandi baru.
      </p>
      <div className="mt-5">
        <ForgotPasswordForm />
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-brand-ink/55 hover:text-brand-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke beranda
      </Link>
    </div>
  );
}
