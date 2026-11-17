"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileAccountForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Nama minimal 2 karakter.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Gagal menyimpan nama.");
        return;
      }
      setName(data.user.name);
      toast.success("Nama diperbarui.");
      router.refresh();
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Nama panggilan</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} readOnly disabled className="bg-brand-cream/60" />
        <p className="text-[9.5px] text-brand-ink/40">
          Email adalah identitas masuk dan tidak dapat diubah dari halaman ini.
        </p>
      </div>
      <Button type="submit" size="sm" disabled={pending || name.trim() === initialName}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Simpan nama
      </Button>
    </form>
  );
}

export function ProfilePasswordForm() {
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
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Gagal mengubah kata sandi.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Kata sandi diperbarui.");
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Kata sandi saat ini</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
      <p className="flex items-center gap-1.5 text-[9.5px] text-brand-ink/40">
        <ShieldCheck className="h-3 w-3 text-primary" /> Minimal 8 karakter. Sesi lain tidak
        otomatis keluar.
      </p>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending || !currentPassword || !newPassword || !confirmPassword}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Ubah kata sandi
      </Button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = async () => {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Kamu sudah keluar.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Gagal keluar. Coba lagi.");
      setPending(false);
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={logout} disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      Keluar dari akun
    </Button>
  );
}
