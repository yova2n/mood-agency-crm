"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CollaborationSheet } from "@/components/collaborations/collaboration-sheet";
import { PipelineProgress } from "@/components/collaborations/pipeline-progress";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatEuros, MONTHS_FR } from "@/lib/utils";
import type { Brand, Collaboration, Influencer, CollabStatus } from "@/lib/database.types";

const STATUSES: { value: CollabStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminées" },
  { value: "annulee", label: "Annulées" },
];

export function CollaborationsTable({
  initialCollabs,
  influencers,
  brands,
  isAdmin,
}: {
  initialCollabs: Collaboration[];
  influencers: Influencer[];
  brands: Brand[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collaboration | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CollabStatus | "all">("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const router = useRouter();
  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const influencerMap = useMemo(() => new Map(influencers.map((i) => [i.id, i])), [influencers]);

  const years = useMemo(() => {
    const set = new Set(initialCollabs.map((c) => c.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [initialCollabs]);

  const filtered = useMemo(() => {
    return initialCollabs.filter((c) => {
      const brand = c.brand_id ? brandMap.get(c.brand_id) : null;
      const inf = c.influencer_id ? influencerMap.get(c.influencer_id) : null;
      const haystack = `${c.title} ${brand?.name ?? ""} ${inf?.name ?? ""}`.toLowerCase();
      const matchSearch = haystack.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchYear = yearFilter === "all" || c.year === parseInt(yearFilter);
      return matchSearch && matchStatus && matchYear;
    });
  }, [initialCollabs, search, statusFilter, yearFilter, brandMap, influencerMap]);

  // Totals (admin only)
  const totals = useMemo(() => {
    const totalBudget = filtered.reduce((s, c) => s + Number(c.budget_ht || 0), 0);
    const totalCommission = filtered.reduce((s, c) => s + Number(c.commission_ht || 0), 0);
    return { totalBudget, totalCommission };
  }, [filtered]);

  async function handleDelete(c: Collaboration) {
    if (!confirm(`Supprimer la collaboration "${c.title}" ?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("collaborations").delete().eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Collaboration supprimée");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              placeholder="Rechercher campagne, marque, influenceur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>

          <div className="w-40">
            <Select value={statusFilter} onValueChange={(v: CollabStatus | "all") => setStatusFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4" />
          Nouvelle collab
        </Button>
      </div>

      {/* Totals */}
      {isAdmin && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryStat label="Total collabs" value={filtered.length.toString()} />
          <SummaryStat label="Budget total HT" value={formatEuros(totals.totalBudget)} />
          <SummaryStat label="Commission agence HT" value={formatEuros(totals.totalCommission)} accent />
          <SummaryStat label="Reversé créateurs" value={formatEuros(totals.totalBudget - totals.totalCommission)} />
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-white/60">Aucune collaboration ne correspond à tes critères.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold">Campagne</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold">Marque</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold">Influenceur</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold">Mois</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold">Type</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold">Apporteur</th>
                  {isAdmin && (
                    <>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold text-right">Budget HT</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold text-right">%</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold text-right">Commission</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold text-right">Reversé</th>
                    </>
                  )}
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold min-w-[180px]">Pipeline</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-white/50 font-bold">Statut</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const brand = c.brand_id ? brandMap.get(c.brand_id) : null;
                  const inf = c.influencer_id ? influencerMap.get(c.influencer_id) : null;
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-5 py-4 font-semibold">{c.title}</td>
                      <td className="px-5 py-4 text-white/80">{brand?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-white/80">{inf?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-white/60 whitespace-nowrap">{MONTHS_FR[c.month - 1]} {c.year}</td>
                      <td className="px-5 py-4">
                        <Badge variant={c.type === "agence" ? "primary" : "muted"}>
                          {c.type === "agence" ? "Agence" : "Direct"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-white/70 capitalize">{c.apporteur}</td>
                      {isAdmin ? (
                        <>
                          <td className="px-5 py-4 text-right font-mono">{formatEuros(Number(c.budget_ht))}</td>
                          <td className="px-5 py-4 text-right">
                            <Badge variant="accent">{Math.round(Number(c.commission_rate) * 100)}%</Badge>
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-emerald-300">{formatEuros(Number(c.commission_ht))}</td>
                          <td className="px-5 py-4 text-right font-mono text-white/70">{formatEuros(Number(c.remuneration_createur_ht))}</td>
                        </>
                      ) : null}
                      <td className="px-5 py-4">
                        <PipelineProgress collab={c} compact />
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={c.status === "en_cours" ? "warning" : c.status === "terminee" ? "success" : "muted"}>
                          {c.status === "en_cours" ? "En cours" : c.status === "terminee" ? "Terminée" : "Annulée"}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditing(c); setOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-300 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CollaborationSheet
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        collaboration={editing}
        influencers={influencers}
        brands={brands}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{label}</div>
      <div className={`text-xl font-extrabold mt-1 ${accent ? "gradient-text" : ""}`}>{value}</div>
    </div>
  );
}
