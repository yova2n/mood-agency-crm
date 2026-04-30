"use client";

import { motion } from "framer-motion";
import { Camera, Music2, Play, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreatorCollabsTable } from "@/components/collaborations/creator-collabs-table";
import { FollowersChart } from "@/components/influencers/followers-chart";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { Brand, Collaboration, Influencer, Platform, StatsSnapshot } from "@/lib/database.types";

export function CreatorPublicView({
  influencer,
  collaborations,
  brands,
  snapshots,
}: {
  influencer: Influencer;
  collaborations: Collaboration[];
  brands: Brand[];
  snapshots: StatsSnapshot[];
}) {
  function getEvolution(platform: Platform) {
    const snaps = snapshots.filter((s) => s.platform === platform);
    if (snaps.length < 2) return null;
    const last = snaps[snaps.length - 1];
    const prev = snaps[snaps.length - 2];
    const diff = last.followers - prev.followers;
    const pct = prev.followers > 0 ? (diff / prev.followers) * 100 : 0;
    return { diff, pct };
  }

  const totalFollowers =
    (influencer.instagram_followers || 0) +
    (influencer.tiktok_followers || 0) +
    (influencer.youtube_subscribers || 0);

  const ongoingCount = collaborations.filter((c) => c.status === "en_cours").length;
  const completedCount = collaborations.filter((c) => c.status === "terminee").length;

  return (
    <div className="min-h-screen">
      {/* Header avec sunset */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 sunset-bg -z-10" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/30 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-rose-600/20 rounded-full blur-[120px] -z-10" />

        <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-10 pb-16">
          {/* Logo Mood */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-full gradient-mood flex items-center justify-center glow-primary">
              <span className="text-white font-black text-base leading-none">m</span>
            </div>
            <div className="font-bold text-white leading-none text-base tracking-tight">
              mood<span className="text-white/50 font-normal italic ml-0.5">agency</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row gap-6 lg:items-center"
          >
            {influencer.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={influencer.profile_picture_url}
                alt={influencer.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-orange-500/40"
              />
            ) : (
              <div className="w-28 h-28 rounded-full gradient-mood flex items-center justify-center text-white font-black text-4xl shrink-0 glow-primary">
                {influencer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-1">
                Espace créateur
              </div>
              <h1 className="text-4xl lg:text-5xl display tracking-tight">
                Salut <span className="gradient-text">{influencer.name}</span> 👋
              </h1>
              <p className="text-white/70 mt-3 max-w-2xl">
                Voici ton suivi en temps réel. Tu peux voir l&apos;avancement de chacune de tes collabs avec Mood Agency.
                On le met à jour à chaque étape.
              </p>
              {influencer.tags && influencer.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {influencer.tags.map((tag) => (
                    <Badge key={tag} variant="primary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 pb-20 -mt-6 space-y-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Audience totale" value={formatNumber(totalFollowers)} accent />
          <KpiCard label="Collabs en cours" value={ongoingCount.toString()} />
          <KpiCard label="Collabs terminées" value={completedCount.toString()} />
          <KpiCard label="Plateformes actives" value={[influencer.instagram_handle, influencer.tiktok_handle, influencer.youtube_handle].filter(Boolean).length.toString()} />
        </div>

        {/* Stats par plateforme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlatformCard
            label="Instagram"
            icon={<Camera className="w-5 h-5" />}
            handle={influencer.instagram_handle}
            followers={influencer.instagram_followers}
            engagement={influencer.instagram_engagement_rate}
            evolution={getEvolution("instagram")}
          />
          <PlatformCard
            label="TikTok"
            icon={<Music2 className="w-5 h-5" />}
            handle={influencer.tiktok_handle}
            followers={influencer.tiktok_followers}
            engagement={influencer.tiktok_engagement_rate}
            evolution={getEvolution("tiktok")}
          />
          <PlatformCard
            label="YouTube"
            icon={<Play className="w-5 h-5" />}
            handle={influencer.youtube_handle}
            followers={influencer.youtube_subscribers}
            engagement={influencer.youtube_avg_views}
            engagementLabel="vues moy."
            evolution={getEvolution("youtube")}
            isYouTube
          />
        </div>

        {/* Évolution */}
        {snapshots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Évolution de ton audience</CardTitle>
              <CardDescription>Snapshots enregistrés par l&apos;équipe Mood Agency</CardDescription>
            </CardHeader>
            <FollowersChart snapshots={snapshots} />
          </Card>
        )}

        {/* Tableau de suivi */}
        <Card>
          <CreatorCollabsTable
            collaborations={collaborations}
            influencer={influencer}
            brands={brands}
            mode="readonly"
            showFinancials={false}
          />
        </Card>

        {/* Footer info */}
        <div className="glass rounded-3xl p-6 text-center">
          <Sparkles className="w-6 h-6 text-orange-300 mx-auto mb-3" />
          <p className="text-sm text-white/70 max-w-md mx-auto">
            Une question sur une collab ? Contacte directement ton interlocuteur Mood Agency.
            Les chiffres sont mis à jour en temps réel.
          </p>
        </div>

        <p className="text-center text-xs text-white/30 font-medium">
          © {new Date().getFullYear()} Mood Agency — Espace privé créateur
        </p>
      </main>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{label}</div>
      <div className={`text-2xl font-extrabold mt-1 tracking-tight ${accent ? "gradient-text" : ""}`}>{value}</div>
    </motion.div>
  );
}

function PlatformCard({
  label,
  icon,
  handle,
  followers,
  engagement,
  engagementLabel = "engagement",
  evolution,
  isYouTube,
}: {
  label: string;
  icon: React.ReactNode;
  handle: string | null;
  followers: number;
  engagement: number;
  engagementLabel?: string;
  evolution: { diff: number; pct: number } | null;
  isYouTube?: boolean;
}) {
  if (!handle) return null;

  const isUp = evolution && evolution.diff >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/80">
          {icon}
          <span className="font-semibold">{label}</span>
        </div>
        {evolution && (
          <Badge variant={isUp ? "success" : "danger"} className="font-bold">
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? "+" : ""}
            {evolution.pct.toFixed(1)}%
          </Badge>
        )}
      </div>

      <div className="text-3xl font-extrabold tracking-tight mb-1">{formatNumber(followers)}</div>
      <div className="text-xs text-white/50">@{handle}</div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-white/50">{engagementLabel}</span>
        <span className="font-semibold">
          {isYouTube ? formatNumber(engagement) : formatPercent(engagement)}
        </span>
      </div>
    </motion.div>
  );
}
