"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Printer,
  Check,
  CheckSquare,
  Square,
  Users,
  Camera,
  Music2,
  Play,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CataloguePrint } from "@/components/catalogue/catalogue-print";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/influencer-status";
import { formatNumber } from "@/lib/utils";
import type { Influencer, InfluencerStatus } from "@/lib/database.types";

type StatusFilter = InfluencerStatus | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "signed", label: "Signés" },
  { value: "activable", label: "Activables" },
  { value: "prospect", label: "Prospects" },
];

export function CatalogueBuilder({ influencers }: { influencers: Influencer[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(() => {
    // Par défaut on présélectionne tous les "signed" et "activable"
    return new Set(
      influencers
        .filter((i) => i.status === "signed" || i.status === "activable")
        .map((i) => i.id)
    );
  });
  const [coverTitle, setCoverTitle] = useState("Catalogue créateurs · Mood Agency");
  const [coverSubtitle, setCoverSubtitle] = useState(
    `Sélection ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
  );

  const filtered = useMemo(() => {
    return influencers.filter((inf) => {
      const matchSearch =
        !search.trim() ||
        inf.name.toLowerCase().includes(search.toLowerCase()) ||
        inf.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || inf.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [influencers, search, statusFilter]);

  const selectedList = useMemo(
    () => influencers.filter((i) => selected.has(i.id)),
    [influencers, selected]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((i) => i.id)));
  }
  function deselectAll() {
    setSelected(new Set());
  }

  function handlePrint() {
    window.print();
  }

  const totalFollowers = selectedList.reduce(
    (sum, i) =>
      sum +
      (i.instagram_followers || 0) +
      (i.tiktok_followers || 0) +
      (i.youtube_subscribers || 0),
    0
  );

  return (
    <>
      <div className="space-y-6 no-print">
        {/* Toolbar header */}
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-2">
                Personnalise ton catalogue
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Titre</label>
                  <Input value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Sous-titre</label>
                  <Input value={coverSubtitle} onChange={(e) => setCoverSubtitle(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">Sélectionnés</div>
              <div className="text-3xl font-extrabold gradient-text">{selectedList.length}</div>
              <div className="text-[11px] text-white/50">{formatNumber(totalFollowers)} followers cumulés</div>
            </div>

            <Button onClick={handlePrint} disabled={selectedList.length === 0}>
              <Printer className="w-4 h-4" />
              Exporter le PDF
            </Button>
          </div>
        </Card>

        {/* Filtres + recherche */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              placeholder="Rechercher par nom ou tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>

          <div className="flex items-center gap-1 glass rounded-full p-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === s.value
                    ? "gradient-mood text-white shadow-md shadow-orange-600/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={selectAll} type="button">
              <CheckSquare className="w-4 h-4" />
              Tout sélectionner ({filtered.length})
            </Button>
            <Button variant="ghost" onClick={deselectAll} type="button">
              <Square className="w-4 h-4" />
              Tout désélectionner
            </Button>
          </div>
        </div>

        {/* Grille de sélection */}
        {filtered.length === 0 ? (
          <Card className="text-center py-16 text-white/50">
            <Users className="w-12 h-12 mx-auto mb-3 text-white/30" />
            <p>Aucun créateur ne correspond à ces filtres.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((inf, i) => {
              const isSel = selected.has(inf.id);
              const total =
                (inf.instagram_followers || 0) +
                (inf.tiktok_followers || 0) +
                (inf.youtube_subscribers || 0);
              return (
                <motion.button
                  key={inf.id}
                  type="button"
                  onClick={() => toggle(inf.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`relative rounded-3xl p-4 text-left transition-all ${
                    isSel
                      ? "bg-orange-500/12 border-2 border-orange-500/60 shadow-lg shadow-orange-500/10"
                      : "glass border-2 border-transparent"
                  }`}
                >
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isSel ? "bg-orange-500 text-white" : "bg-white/10 text-white/40"
                  }`}>
                    {isSel ? <Check className="w-4 h-4" /> : <Square className="w-3 h-3" />}
                  </div>

                  <div className="flex items-start gap-3 mb-3 pr-7">
                    {inf.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inf.profile_picture_url}
                        alt={inf.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full gradient-mood flex items-center justify-center text-white font-bold">
                        {inf.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{inf.name}</div>
                      <Badge variant={STATUS_BADGE[inf.status]} className="text-[10px] mt-1">
                        {STATUS_LABEL[inf.status]}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">
                      {formatNumber(total)} followers
                    </span>
                    <div className="flex gap-1 text-white/30">
                      {inf.instagram_handle && <Camera className="w-3 h-3" />}
                      {inf.tiktok_handle && <Music2 className="w-3 h-3" />}
                      {inf.youtube_handle && <Play className="w-3 h-3" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Vue d'impression (cachée sauf au print) */}
      <CataloguePrint
        title={coverTitle}
        subtitle={coverSubtitle}
        influencers={selectedList}
      />
    </>
  );
}
