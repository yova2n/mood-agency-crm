"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/database.types";

export function TeamManagement({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleRoleChange(p: Profile, role: UserRole) {
    if (p.id === currentUserId) {
      toast.error("Tu ne peux pas modifier ton propre rôle.");
      return;
    }
    setUpdatingId(p.id);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      setUpdatingId(null);
      return;
    }
    toast.success(`Rôle mis à jour pour ${p.full_name}`);
    setUpdatingId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipe ({profiles.length})</CardTitle>
        <CardDescription>
          Gestion des rôles. Pour inviter un nouveau membre, partage-lui le lien de l&apos;app — il créera son compte via la page de login (rôle Manager par défaut).
        </CardDescription>
      </CardHeader>

      <div className="space-y-2">
        {profiles.map((p) => {
          const isMe = p.id === currentUserId;
          const isAdmin = p.role === "admin";
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-full gradient-mood flex items-center justify-center text-white font-bold text-sm shrink-0">
                {p.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{p.full_name}</span>
                  {isMe && <Badge variant="muted">Toi</Badge>}
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  Inscrit le {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={isAdmin ? "primary" : "muted"}>
                  {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {isAdmin ? "Admin" : "Manager"}
                </Badge>
                {!isMe && (
                  <div className="w-32">
                    <Select
                      value={p.role}
                      onValueChange={(v: UserRole) => handleRoleChange(p, v)}
                      disabled={updatingId === p.id}
                    >
                      <SelectTrigger>
                        {updatingId === p.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <SelectValue />}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-orange-500/8 border border-orange-500/20">
        <h4 className="text-sm font-semibold text-orange-200 mb-1">Différence Admin vs Manager</h4>
        <ul className="text-xs text-white/70 space-y-1 list-disc list-inside">
          <li><b>Admin</b> : accès total — peut voir et modifier tous les montants en €, gérer l&apos;équipe</li>
          <li><b>Manager</b> : tout sauf les montants financiers (budgets, commissions, CA)</li>
        </ul>
      </div>
    </Card>
  );
}
