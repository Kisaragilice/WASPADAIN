"use client";

import { useState } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForcePasswordChangeForm({ redirectTo }: { redirectTo: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error ?? "Gagal mengubah kata sandi.");
        setPending(false);
        return;
      }
      toast.success("Kata sandi diperbarui. Lanjutkan.");
      window.location.assign(redirectTo);
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Kata sandi awal</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/30" />
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Kata sandi baru</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Ulangi kata sandi baru</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          required
        />
      </div>
      <p className="flex items-center gap-1.5 text-[10px] text-brand-ink/60">
        <ShieldCheck className="h-3 w-3 text-primary" />
        Minimal 8 karakter. Sesi di perangkat lain akan diakhiri.
      </p>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || !currentPassword || !newPassword || !confirmPassword}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Simpan kata sandi baru
      </Button>
    </form>
  );
}
