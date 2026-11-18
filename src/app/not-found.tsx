import Link from "next/link";
import { ArrowLeft, Compass, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand/brand-mark";

export default function NotFound() {
  return (
    <div className="gradient-cream flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-4xl border border-white bg-white/80 p-6 text-center shadow-card sm:p-8">
        <div className="flex justify-center">
          <BrandWordmark />
        </div>
        <span className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-butter text-[#8A6200]">
          <ShieldQuestion className="h-7 w-7" />
        </span>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
          Halaman tidak ditemukan
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold leading-tight">
          Sepertinya tautan ini tidak ada
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-brand-ink/60">
          Halaman mungkin sudah dipindahkan, atau tautan yang kamu buka tidak
          lengkap. Progres belajarmu tetap aman.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/simulasi">
              <Compass className="h-4 w-4" /> Ke dasbor simulasi
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
