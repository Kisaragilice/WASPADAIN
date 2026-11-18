"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@")) {
      toast.error("Masukkan alamat email yang valid.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error ?? "Permintaan gagal. Coba lagi.");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Koneksi bermasalah. Periksa jaringan lalu coba lagi.");
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="rounded-2xl border border-primary/15 bg-brand-mint/60 p-4 text-[12px] leading-relaxed text-[#0B5E54]"
        >
          <p className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-4 w-4" /> Permintaan diterima
          </p>
          <p className="mt-1.5">
            Jika <span className="font-semibold">{email.trim()}</span> terdaftar,
            instruksi atur ulang akan dikirim ke alamat itu. Tautan berlaku 30 menit
            dan hanya bisa dipakai satu kali.
          </p>
        </div>
        <p className="text-[11px] leading-relaxed text-brand-ink/60">
          Tidak menerima email? Periksa folder spam, atau tunggu beberapa menit lalu
          coba lagi. Pengiriman email bisa dinonaktifkan pada instalasi tertentu.
        </p>
        <Link
          href="/masuk"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email akun</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <Input
            id="forgot-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@contoh.id"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pl-10"
            maxLength={254}
            required
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
          </>
        ) : (
          <>
            Kirim tautan reset <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-brand-ink/60">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Demi keamanan, kami tidak memberi tahu apakah sebuah email terdaftar atau
        tidak.
      </p>

      <div className="text-center text-[11.5px] text-brand-ink/60">
        Ingat kata sandi?{" "}
        <Link href="/masuk" className="font-bold text-primary hover:underline">
          Masuk di sini
        </Link>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Tautan reset tidak valid atau sudah kedaluwarsa.");
        return;
      }
      setDone(true);
      toast.success("Kata sandi diperbarui.");
    } catch {
      setError("Koneksi bermasalah. Periksa jaringan lalu coba lagi.");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="rounded-2xl border border-primary/15 bg-brand-mint/60 p-4 text-[12px] leading-relaxed text-[#0B5E54]"
        >
          <p className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-4 w-4" /> Kata sandi berhasil diperbarui
          </p>
          <p className="mt-1.5">
            Semua sesi lama sudah dikeluarkan. Masuk kembali dengan kata sandi baru.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/masuk">
            Masuk sekarang <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="reset-password">Kata sandi baru</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <Input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="px-10"
            minLength={8}
            maxLength={72}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand-ink/55 transition hover:bg-brand-ink/5 hover:text-brand-ink"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reset-password-confirm">Ulangi kata sandi baru</Label>
        <Input
          id="reset-password-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          required
        />
      </div>

      <p className="text-[10px] leading-relaxed text-brand-ink/60">
        Minimal 8 karakter. Setelah disimpan, semua perangkat lain otomatis keluar.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-brand-blush px-3 py-2.5 text-[11.5px] font-medium leading-relaxed text-[#B91C2D]"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
          </>
        ) : (
          <>
            Simpan kata sandi <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <div className="text-center text-[11.5px] text-brand-ink/60">
        Tautan tidak berlaku?{" "}
        <Link
          href="/lupa-password"
          className="font-bold text-primary hover:underline"
        >
          Minta tautan baru
        </Link>
      </div>
    </form>
  );
}
