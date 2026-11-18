import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { sanitizeNextPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke WASPADAIN untuk melanjutkan latihan anti-modus.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const query = await searchParams;
  const next = sanitizeNextPath(query.next);

  if (user) redirect(next ?? (user.role === "ADMIN" ? "/admin" : "/simulasi"));

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
        Selamat datang kembali
      </p>
      <h1 className="mt-1.5 text-2xl font-extrabold leading-tight sm:text-[28px]">
        Masuk dan lanjutkan latihanmu
      </h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-brand-ink/60">
        Progres, lencana, dan riwayat KAB tersimpan di akunmu.
      </p>
      <div className="mt-5">
        <AuthForm mode="login" next={next} />
      </div>
    </div>
  );
}
