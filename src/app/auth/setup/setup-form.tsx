"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Quand on arrive depuis l'email Supabase, le hash contient access_token + refresh_token.
    // Le client browser les détecte et établit la session automatiquement.
    const supabase = createClient();
    let cancelled = false;

    async function init() {
      // Petit délai pour laisser le SDK traiter le hash
      await new Promise((r) => setTimeout(r, 200));
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        toast.error("Lien d'invitation invalide ou expiré. Demande un nouvel envoi.");
        setTimeout(() => router.push("/login"), 2500);
        return;
      }
      setEmail(user.email ?? "");
      setFullName(
        (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          ""
      );
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mot de passe : 8 caractères minimum");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const { error: pwError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName.trim() },
    });
    if (pwError) {
      toast.error(pwError.message);
      setLoading(false);
      return;
    }

    // Met aussi à jour le profil (le trigger l'a créé avec les valeurs initiales)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);
    }

    toast.success("Compte activé. Bienvenue !");
    router.push("/dashboard");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-10 text-white/60">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Validation de l&apos;invitation...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-semibold mb-1">{email}</div>
        <div className="text-xs text-white/50">
          Choisis ton nom et un mot de passe pour finaliser ton accès.
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nom complet</Label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Yovann Pigenet"
            required
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="new-password"
            className="pl-10"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} size="lg" className="mt-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Activer mon compte"
        )}
      </Button>
    </form>
  );
}
