import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun WASPADAIN dan mulai latihan literasi digital.",
};

function safeNext(value: string | undefined) {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const query = await searchParams;
  const next = safeNext(query.next);

  if (user) redirect(next ?? "/simulasi");

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
        Mulai gratis
      </p>
      <h1 className="mt-1.5 text-2xl font-extrabold leading-tight sm:text-[28px]">
        Buat akun WASPADAIN
      </h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-brand-ink/50">
        Setelah mendaftar, kamu akan mengisi pre-test singkat sebagai garis dasar.
      </p>
      <div className="mt-5">
        <AuthForm mode="register" next={next} />
      </div>
    </div>
  );
}
