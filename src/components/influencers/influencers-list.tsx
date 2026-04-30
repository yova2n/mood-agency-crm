"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Camera, Music2, Play, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfluencerSheet } from "@/components/influencers/influencer-sheet";
import { formatNumber } from "@/lib/utils";
import type { Influencer, InfluencerStatus } from "@/lib/database.types";

const STATUSES: { value: InfluencerStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Inactifs" },
  { value: "en_attente", label: "En attente" },
];

export function InfluencersList({ initialInfluencers }: { initialInfluencers: Influencer[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InfluencerStatus | "all">("all");

  const filtered = useMemo(() => {
    return initialInfluencers.filter((inf) => {
      const matchSearch =
        inf.name.toLowerCase().includes(search.toLowerCase()) ||
        inf.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filter === "all" || inf.status === filter;
      return matchSearch && matchStatus;
    });
  }, [initialInfluencers, search, filter]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-1 gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              placeholder="Rechercher par nom ou tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>

          <div className="flex items-center gap-1 glass rounded-full p-1">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === s.value
                    ? "gradient-mood text-white shadow-md shadow-orange-600/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Ajouter un influenceur
        </Button>
      </div>

      {/* Stats résumé */}
      <div className="text-sm text-white/50">
        {filtered.length} influenceur{filtered.length > 1 ? "s" : ""}
        {filter !== "all" ? ` ${filter}` : ""}
        {search ? ` correspondant à "${search}"` : ""}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-white/60">Aucun influenceur ne correspond à tes critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((inf, i) => {
            const total =
              (inf.instagram_followers || 0) +
              (inf.tiktok_followers || 0) +
              (inf.youtube_subscribers || 0);

            return (
              <motion.div
                key={inf.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/dashboard/influenceurs/${inf.slug}`}
                  className="block glass glass-hover rounded-3xl p-5 group h-full"
                >
                  <div className="flex items-start gap-3 mb-4">
                    {inf.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inf.profile_picture_url}
                        alt={inf.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full gradient-mood flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {inf.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{inf.name}</div>
                      <Badge
                        variant={
                          inf.status === "actif"
                            ? "success"
                            : inf.status === "inactif"
                            ? "muted"
                            : "warning"
                        }
                        className="mt-1"
                      >
                        {inf.status}
                      </Badge>
                    </div>
                  </div>

                  {inf.bio && (
                    <p className="text-xs text-white/50 line-clamp-2 mb-4 min-h-[32px]">{inf.bio}</p>
                  )}

                  {/* Tags */}
                  {inf.tags && inf.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {inf.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="primary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats réseaux */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    {inf.instagram_handle && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-white/60">
                          <Camera className="w-3.5 h-3.5" /> Instagram
                        </span>
                        <span className="font-semibold">{formatNumber(inf.instagram_followers)}</span>
                      </div>
                    )}
                    {inf.tiktok_handle && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-white/60">
                          <Music2 className="w-3.5 h-3.5" /> TikTok
                        </span>
                        <span className="font-semibold">{formatNumber(inf.tiktok_followers)}</span>
                      </div>
                    )}
                    {inf.youtube_handle && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-white/60">
                          <Play className="w-3.5 h-3.5" /> YouTube
                        </span>
                        <span className="font-semibold">{formatNumber(inf.youtube_subscribers)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Total</div>
                      <div className="text-xl font-extrabold gradient-text">{formatNumber(total)}</div>
                    </div>
                    <span className="text-xs text-orange-300 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <InfluencerSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}
