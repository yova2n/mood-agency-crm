"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/database.types";

export function ProfileSettings({ profile, email }: { profile: Profile | null; email: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleProfileSave() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), avatar_url: avatarUrl.trim() || null })
      .eq("id", profile!.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Profil mis à jour");
    setLoading(false);
    router.refresh();
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast.error("8 caractères minimum");
      return;
    }
    setPwLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
      setPwLoading(false);
      return;
    }
    toast.success("Mot de passe modifié");
    setNewPassword("");
    setPwLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mon profil</CardTitle>
        <CardDescription>Tes infos personnelles dans l&apos;outil</CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <div className="font-semibold mb-1">{email}</div>
            <div className="text-xs text-white/50 mb-3">Email non modifiable</div>
          </div>

          <div>
            <Label className="mb-1.5 block">Avatar</Label>
            <ImageUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              folder="avatars"
              shape="circle"
              size="sm"
              fallback={fullName || email}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Nom complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Yovann Pigenet" />
          </div>

          <Button onClick={handleProfileSave} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer le profil
          </Button>
        </div>

        <div className="space-y-4 lg:border-l lg:border-white/8 lg:pl-5">
          <div>
            <h4 className="font-semibold mb-1">Changer le mot de passe</h4>
            <p className="text-xs text-white/50 mb-3">Au moins 8 caractères</p>
            <Label className="mb-1.5 block">Nouveau mot de passe</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={pwLoading || !newPassword} variant="outline">
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Modifier le mot de passe"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
