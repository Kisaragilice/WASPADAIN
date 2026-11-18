"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand/brand-mark";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is safe to log; the full message may contain server details.
    console.error("Application error", { digest: error.digest });
  }, [error.digest]);

  return (
    <div className="gradient-cream flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-4xl border border-white bg-white/80 p-6 text-center shadow-card sm:p-8">
        <div className="flex justify-center">
          <BrandWordmark />
        </div>
        <span className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blush text-[#B91C2D]">
          <TriangleAlert className="h-7 w-7" />
        </span>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#B91C2D]">
          Terjadi kendala
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold leading-tight">
          Halaman ini gagal dimuat
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-brand-ink/60">
          Coba muat ulang. Jika masih gagal, kembali ke dasbor dan lanjutkan dari
          latihan terakhir. Tidak ada data yang hilang.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Coba lagi
          </Button>
          <Button asChild variant="outline">
            <Link href="/simulasi">
              <ArrowLeft className="h-4 w-4" /> Dasbor
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
