"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Mail, Phone, Globe, Pencil, Trash2, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandSheet } from "@/components/brands/brand-sheet";
import { createClient } from "@/lib/supabase/client";
import { formatEuros } from "@/lib/utils";
import type { Brand, Collaboration } from "@/lib/database.types";

export function BrandsList({
  initialBrands,
  collaborations,
  isAdmin,
}: {
  initialBrands: Brand[];
  collaborations: Collaboration[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const m = new Map<string, { count: number; totalCommission: number; totalBudget: number }>();
    for (const c of collaborations) {
      if (!c.brand_id) continue;
      const cur = m.get(c.brand_id) || { count: 0, totalCommission: 0, totalBudget: 0 };
      cur.count++;
      cur.totalCommission += Number(c.commission_ht || 0);
      cur.totalBudget += Number(c.budget_ht || 0);
      m.set(c.brand_id, cur);
    }
    return m;
  }, [collaborations]);

  const filtered = useMemo(() => {
    return initialBrands.filter(
      (b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.sector?.toLowerCase().includes(search.toLowerCase()) ||
        b.primary_contact_email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [initialBrands, search]);

  async function handleDelete(b: Brand) {
    if (!confirm(`Supprimer la marque "${b.name}" ?\nLes collaborations seront conservées mais détachées.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("brands").delete().eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marque supprimée");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <Input placeholder="Rechercher marque, secteur, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4" />
          Ajouter une marque
        </Button>
      </div>

      <div className="text-sm text-white/50">{filtered.length} marque{filtered.length > 1 ? "s" : ""}</div>

      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-white/60">Aucune marque enregistrée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b, i) => {
            const s = stats.get(b.id) || { count: 0, totalCommission: 0, totalBudget: 0 };
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass glass-hover rounded-3xl p-5 group"
              >
                <div className="flex items-start gap-3 mb-4">
                  {b.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo_url} alt={b.name} className="w-12 h-12 rounded-xl object-cover bg-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl gradient-mood flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{b.name}</div>
                    {b.sector && <div className="text-xs text-white/50 mt-0.5">{b.sector}</div>}
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(b); setOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contacts */}
                <div className="space-y-2 mb-4">
                  {b.primary_contact_name && (
                    <div className="text-sm">
                      <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Contact</span>
                      <div className="text-white/90 truncate font-medium">{b.primary_contact_name}</div>
                    </div>
                  )}
                  {b.primary_contact_email && (
                    <a href={`mailto:${b.primary_contact_email}`} className="flex items-center gap-2 text-xs text-white/70 hover:text-orange-300 transition-colors">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{b.primary_contact_email}</span>
                    </a>
                  )}
                  {b.primary_contact_phone && (
                    <a href={`tel:${b.primary_contact_phone}`} className="flex items-center gap-2 text-xs text-white/70 hover:text-orange-300 transition-colors">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="truncate">{b.primary_contact_phone}</span>
                    </a>
                  )}
                  {b.website && (
                    <a href={b.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-white/70 hover:text-orange-300 transition-colors">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span className="truncate">{b.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Collabs</div>
                    <div className="text-xl font-extrabold">{s.count}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">CA généré</div>
                    {isAdmin ? (
                      <div className="text-xl font-extrabold gradient-text">{formatEuros(s.totalCommission)}</div>
                    ) : (
                      <Lock className="w-4 h-4 text-white/20 mt-1" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <BrandSheet
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        brand={editing}
      />
    </div>
  );
}
