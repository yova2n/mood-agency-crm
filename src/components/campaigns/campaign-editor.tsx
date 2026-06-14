"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostSheet, PLATFORM_LABEL } from "@/components/campaigns/post-sheet";
import { createClient } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils";
import type { CampaignPost, Brand, Influencer, PostPlatform } from "@/lib/database.types";

export function CampaignEditor({
  influencer,
  initialPosts,
  brands,
}: {
  influencer: Influencer;
  initialPosts: CampaignPost[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [posts] = useState<CampaignPost[]>(initialPosts);
  const [editing, setEditing] = useState<CampaignPost | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PostPlatform | "all">("all");

  const stats = useMemo(() => {
    return posts.reduce(
      (acc, p) => {
        acc.views += p.views;
        acc.likes += p.likes;
        acc.comments += p.comments;
        acc.shares += p.shares;
        acc.saves += p.saves;
        acc.reach += p.reach;
        acc.impressions += p.impressions;
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 }
    );
  }, [posts]);

  const totalEngagement = stats.likes + stats.comments + stats.shares + stats.saves;
  const avgEngagementRate =
    stats.reach > 0 ? (totalEngagement / stats.reach) * 100 : 0;

  const filteredPosts = useMemo(() => {
    if (platformFilter === "all") return posts;
    return posts.filter((p) => p.platform === platformFilter);
  }, [posts, platformFilter]);

  const platformCounts = useMemo(() => {
    const m = new Map<PostPlatform, number>();
    for (const p of posts) m.set(p.platform, (m.get(p.platform) ?? 0) + 1);
    return m;
  }, [posts]);

  async function handleDelete(p: CampaignPost) {
    if (!confirm(`Supprimer la publication "${p.title || p.post_url || "sans titre"}" ?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("campaign_posts").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Publication supprimée");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Publications", value: posts.length, icon: TrendingUp },
          { label: "Vues totales", value: formatNumber(stats.views), icon: Eye },
          { label: "Likes", value: formatNumber(stats.likes), icon: Heart },
          { label: "Commentaires", value: formatNumber(stats.comments), icon: MessageCircle },
          { label: "Partages", value: formatNumber(stats.shares), icon: Share2 },
          { label: "Sauvegardes", value: formatNumber(stats.saves), icon: Bookmark },
          { label: "Engagement moy.", value: avgEngagementRate.toFixed(1) + "%", icon: TrendingUp },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="!p-4">
              <Icon className="w-4 h-4 text-orange-300 mb-2" />
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">{k.label}</div>
              <div className="text-xl font-extrabold mt-1">{k.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPlatformFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              platformFilter === "all"
                ? "bg-orange-500/20 text-orange-200 border border-orange-500/40"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Toutes ({posts.length})
          </button>
          {(Object.keys(PLATFORM_LABEL) as PostPlatform[]).map((pf) => {
            const count = platformCounts.get(pf) ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={pf}
                onClick={() => setPlatformFilter(pf)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  platformFilter === pf
                    ? "bg-orange-500/20 text-orange-200 border border-orange-500/40"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {PLATFORM_LABEL[pf]} ({count})
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Ajouter une publication
        </Button>
      </div>

      {/* Liste posts */}
      {filteredPosts.length === 0 ? (
        <Card className="text-center py-12">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-white/60">
            Aucune publication pour ce filtre. Clique sur &quot;Ajouter une publication&quot; pour démarrer.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPosts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass glass-hover rounded-3xl p-5 group"
            >
              <div className="flex items-start gap-3 mb-3">
                {p.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_url} alt={p.title || ""} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl gradient-mood flex items-center justify-center text-white font-bold text-sm">
                    {PLATFORM_LABEL[p.platform].slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="primary" className="text-[10px]">
                      {PLATFORM_LABEL[p.platform]}
                    </Badge>
                    <span className="text-xs text-white/40">
                      {new Date(p.posted_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="font-semibold truncate">{p.title || "Sans titre"}</div>
                  {p.post_url && (
                    <a
                      href={p.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white/50 hover:text-orange-300 inline-flex items-center gap-1 mt-1"
                    >
                      Voir le post <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setSheetOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-white/5">
                <Stat label="Vues" value={p.views} />
                <Stat label="Likes" value={p.likes} />
                <Stat label="Comm." value={p.comments} />
                <Stat label="Partages" value={p.shares} />
                <Stat label="Saves" value={p.saves} />
                <Stat label="Reach" value={p.reach} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <PostSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(null);
        }}
        post={editing}
        influencerId={influencer.id}
        brands={brands}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider font-bold text-white/40">{label}</div>
      <div className="text-sm font-bold">{formatNumber(value)}</div>
    </div>
  );
}
