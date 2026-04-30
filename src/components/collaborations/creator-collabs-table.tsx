"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollaborationSheet } from "@/components/collaborations/collaboration-sheet";
import { createClient } from "@/lib/supabase/client";
import { formatEuros, MONTHS_FR, cn } from "@/lib/utils";

const PIPELINE_STEPS_SHORT = [
  { key: "step_devis_contrat_envoye", short: "Devis env.", full: "Devis & contrat envoyés" },
  { key: "step_contrat_signe", short: "Contrat", full: "Contrat signé" },
  { key: "step_devis_signe", short: "Devis", full: "Devis signé" },
  { key: "step_en_production", short: "Prod", full: "En production" },
  { key: "step_publie", short: "Publié", full: "Publié" },
  { key: "step_facture_envoyee", short: "Facture", full: "Facture envoyée" },
  { key: "step_stats_envoyees", short: "Stats", full: "Stats envoyées" },
  { key: "step_drive_ok", short: "Drive", full: "Drive OK" },
] as const;
import type { Brand, Collaboration, Influencer } from "@/lib/database.types";

type Mode = "admin" | "readonly";

export function CreatorCollabsTable({
  collaborations,
  influencer,
  brands,
  influencers,
  mode = "admin",
  showFinancials = true,
}: {
  collaborations: Collaboration[];
  influencer: Influencer;
  brands: Brand[];
  influencers?: Influencer[];
  mode?: Mode;
  showFinancials?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Collaboration | null>(null);
  const [creating, setCreating] = useState(false);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const brandMap = new Map(brands.map((b) => [b.id, b]));

  async function toggleStep(c: Collaboration, key: string, current: boolean) {
    if (mode !== "admin") return;
    const cellKey = `${c.id}-${key}`;
    setUpdatingCell(cellKey);

    const supabase = createClient();
    const { error } = await supabase
      .from("collaborations")
      .update({ [key]: !current })
      .eq("id", c.id);

    setUpdatingCell(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Tableau de suivi des collaborations</h3>
          <p className="text-sm text-white/55">
            {mode === "admin"
              ? "Coche les étapes au fur et à mesure. Les cases sauvegardent automatiquement."
              : `${collaborations.length} collaboration${collaborations.length > 1 ? "s" : ""} enregistrée${collaborations.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {mode === "admin" && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Nouvelle collab
          </Button>
        )}
      </div>

      {collaborations.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-10 text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-white/50 text-sm">Pas encore de collaboration enregistrée pour {influencer.name}.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 overflow-hidden bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.04]">
                  {/* Group : Infos */}
                  <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">Client</th>
                  <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">Année</th>
                  <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">Mois</th>
                  <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">Type</th>
                  {showFinancials && (
                    <th className="px-3 py-2 text-right font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">Budget HT</th>
                  )}
                  <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">Apporteur</th>
                  {showFinancials && (
                    <>
                      <th className="px-3 py-2 text-right font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">%</th>
                      <th className="px-3 py-2 text-right font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8 bg-emerald-500/[0.06]">Commission HT</th>
                      <th className="px-3 py-2 text-right font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8">Rémunération</th>
                    </>
                  )}
                  {/* Group : Pipeline */}
                  {PIPELINE_STEPS_SHORT.map((s) => (
                    <th
                      key={s.key}
                      className="px-2 py-2 text-center font-bold text-[10px] uppercase tracking-wider text-white/60 border-b border-white/8 bg-orange-500/[0.05]"
                      title={s.full}
                    >
                      {s.short}
                    </th>
                  ))}
                  {mode === "admin" && <th className="border-b border-white/8 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {collaborations.map((c, i) => {
                  const brand = c.brand_id ? brandMap.get(c.brand_id) : null;
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap">
                        {brand?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-white/70">{c.year}</td>
                      <td className="px-3 py-2.5 text-white/70 capitalize">{MONTHS_FR[c.month - 1]}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={c.type === "agence" ? "primary" : "muted"} className="text-[10px]">
                          {c.type === "agence" ? "Agence" : "Direct"}
                        </Badge>
                      </td>
                      {showFinancials && (
                        <td className="px-3 py-2.5 text-right font-mono text-white/90 whitespace-nowrap">
                          {Number(c.budget_ht) > 0 ? formatEuros(Number(c.budget_ht)) : "—"}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={c.apporteur === "agent" ? "accent" : c.apporteur === "createur" ? "warning" : "muted"}
                          className="text-[10px] capitalize"
                        >
                          {c.apporteur}
                        </Badge>
                      </td>
                      {showFinancials && (
                        <>
                          <td className="px-3 py-2.5 text-right">
                            <Badge variant="primary" className="font-mono text-[10px]">
                              {Math.round(Number(c.commission_rate) * 100)}%
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-300 whitespace-nowrap bg-emerald-500/[0.04]">
                            {Number(c.commission_ht) > 0 ? formatEuros(Number(c.commission_ht)) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-white/70 whitespace-nowrap">
                            {Number(c.remuneration_createur_ht) !== 0 ? formatEuros(Number(c.remuneration_createur_ht)) : "—"}
                          </td>
                        </>
                      )}
                      {/* Pipeline checkboxes */}
                      {PIPELINE_STEPS_SHORT.map((s) => {
                        const checked = !!c[s.key as keyof Collaboration];
                        const cellKey = `${c.id}-${s.key}`;
                        const isUpdating = updatingCell === cellKey;
                        return (
                          <td key={s.key} className="px-2 py-2.5 text-center bg-orange-500/[0.02]">
                            <button
                              onClick={() => toggleStep(c, s.key, checked)}
                              disabled={mode !== "admin" || isUpdating}
                              className={cn(
                                "w-6 h-6 rounded-md border flex items-center justify-center mx-auto transition-all",
                                checked
                                  ? "gradient-mood border-transparent shadow shadow-orange-500/30"
                                  : "bg-white/[0.03] border-white/15 hover:border-orange-500/40",
                                mode === "admin" && "cursor-pointer hover:scale-110",
                                mode !== "admin" && "cursor-default",
                                isUpdating && "opacity-50 animate-pulse"
                              )}
                              title={s.full}
                            >
                              {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}
                      {mode === "admin" && (
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => setEditing(c)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sheets pour édition — admin only */}
      {mode === "admin" && influencers && (
        <>
          <CollaborationSheet
            open={!!editing}
            onOpenChange={(o) => { if (!o) setEditing(null); }}
            collaboration={editing}
            influencers={influencers}
            brands={brands}
            isAdmin
          />
          <CollaborationSheet
            open={creating}
            onOpenChange={(o) => setCreating(o)}
            collaboration={null}
            defaultInfluencerId={influencer.id}
            influencers={influencers}
            brands={brands}
            isAdmin
          />
        </>
      )}
    </div>
  );
}
