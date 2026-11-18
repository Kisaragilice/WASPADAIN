import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { ForcePasswordChangeForm } from "@/components/auth/force-password-change-form";

export const metadata = { title: "Ganti kata sandi awal" };

export default async function ChangeInitialPasswordPage() {
  const user = await requireUser();
  if (!user.mustChangePassword) {
    redirect(user.role === "ADMIN" ? "/admin" : "/simulasi");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-brand-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blush text-[#B91C2D]">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-brand-ink">
          Ganti kata sandi awal
        </h1>
        <p className="mt-1 text-[12px] leading-relaxed text-brand-ink/65">
          Akun ini memakai kata sandi sementara dari proses bootstrap. Demi keamanan,
          ganti sekarang sebelum melanjutkan. Kata sandi Anda tidak pernah ditampilkan
          atau disimpan dalam bentuk teks asli.
        </p>
        <div className="mt-6">
          <ForcePasswordChangeForm
            redirectTo={user.role === "ADMIN" ? "/admin" : "/simulasi"}
          />
        </div>
      </div>
    </main>
  );
}
