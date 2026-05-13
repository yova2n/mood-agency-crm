"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Loader2, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/database.types";

export function TeamManagement({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Formulaire d'invitation
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("manager");
  const [inviting, setInviting] = useState(false);

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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          full_name: inviteName.trim(),
          role: inviteRole,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Échec de l'invitation");
        return;
      }

      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("manager");
      setInviteOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setInviting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Équipe ({profiles.length})</CardTitle>
            <CardDescription>
              Invite un nouveau membre par email ou gère les rôles existants.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setInviteOpen((v) => !v)}
            variant={inviteOpen ? "outline" : "default"}
          >
            <UserPlus className="w-4 h-4" />
            {inviteOpen ? "Annuler" : "Inviter un membre"}
          </Button>
        </div>
      </CardHeader>

      {inviteOpen && (
        <form
          onSubmit={handleInvite}
          className="mb-4 p-4 rounded-2xl bg-white/[0.02] border border-white/8 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="prenom@mood-agency.fr"
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Nom complet (optionnel)</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Prénom Nom"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <Label className="mb-1.5 block">Rôle</Label>
              <Select
                value={inviteRole}
                onValueChange={(v: UserRole) => setInviteRole(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager — pas d&apos;accès aux montants €</SelectItem>
                  <SelectItem value="admin">Admin — accès total + gestion équipe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Envoyer l&apos;invitation
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-white/50">
            Un email sera envoyé avec un lien pour activer le compte. Le lien expire après 24h.
          </p>
        </form>
      )}

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
