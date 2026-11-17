"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "register";

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isRegister && name.trim().length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    if (!email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < (isRegister ? 8 : 1)) {
      setError(isRegister ? "Kata sandi minimal 8 karakter." : "Kata sandi wajib diisi.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { name: name.trim(), email: email.trim(), password }
            : { email: email.trim(), password },
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
        return;
      }

      toast.success(
        isRegister ? "Akun dibuat. Selamat datang!" : `Selamat datang kembali, ${data.user?.name ?? "Warga"}.`,
      );
      const target =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : (data.redirectTo ?? "/simulasi");
      router.push(target);
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Periksa jaringan lalu coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {isRegister ? (
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama panggilan</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Mis. Raka"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="pl-10"
              maxLength={80}
              required
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@contoh.id"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Kata sandi</Label>
          {isRegister ? (
            <span className="text-[10px] font-medium text-brand-ink/40">Minimal 8 karakter</span>
          ) : null}
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="px-10"
            minLength={isRegister ? 8 : 1}
            maxLength={72}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand-ink/40 transition hover:bg-brand-ink/5 hover:text-brand-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

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
            <Loader2 className="h-4 w-4 animate-spin" />
            {isRegister ? "Membuat akun..." : "Masuk..."}
          </>
        ) : (
          <>
            {isRegister ? "Buat akun" : "Masuk"}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <div className="text-center text-[11.5px] text-brand-ink/50">
        {isRegister ? (
          <>
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-bold text-primary hover:underline">
              Masuk di sini
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-bold text-primary hover:underline">
              Daftar gratis
            </Link>
          </>
        )}
      </div>

      {!isRegister ? (
        <div className="rounded-2xl bg-brand-cream/70 p-3 text-[10px] leading-relaxed text-brand-ink/45">
          <p className="flex items-center gap-1.5 font-bold text-brand-ink/60">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Akun demo
          </p>
          <p className="mt-1">
            Warga: <span className="font-semibold">warga@waspadain.id</span> · Admin:{" "}
            <span className="font-semibold">admin@waspadain.id</span>
            <br />
            Kata sandi: <span className="font-semibold">Waspada#2026</span>
          </p>
        </div>
      ) : (
        <p className="text-center text-[10px] leading-relaxed text-brand-ink/40">
          Dengan mendaftar, kamu memahami bahwa seluruh isi simulasi bersifat edukatif dan
          menggunakan data sintetis.
        </p>
      )}
    </form>
  );
}
