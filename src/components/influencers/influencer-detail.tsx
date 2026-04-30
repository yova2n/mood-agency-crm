"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Music2, Play, Pencil, RefreshCw, TrendingUp, TrendingDown, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatorCollabsTable } from "@/components/collaborations/creator-collabs-table";
import { InfluencerSheet } from "@/components/influencers/influencer-sheet";
import { StatsUpdateDialog } from "@/components/influencers/stats-update-dialog";
import { FollowersChart } from "@/components/influencers/followers-chart";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { Influencer, StatsSnapshot, Collaboration, Brand, Platform } from "@/lib/database.types";

export function InfluencerDetail({
  influencer,
  snapshots,
  collaborations,
  brands,
  allInfluencers,
  isAdmin,
}: {
  influencer: Influencer;
  snapshots: StatsSnapshot[];
  collaborations: Collaboration[];
  brands: Brand[];
  allInfluencers: Influencer[];
  isAdmin: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Évolution par plateforme
  function getEvolution(platform: Platform) {
    const snaps = snapshots.filter((s) => s.platform === platform);
    if (snaps.length < 2) return null;
    const last = snaps[snaps.length - 1];
    const prev = snaps[snaps.length - 2];
    const diff = last.followers - prev.followers;
    const pct = prev.followers > 0 ? (diff / prev.followers) * 100 : 0;
    return { diff, pct };
  }

  async function copyShareLink() {
    const url = `${window.location.origin}/c/${influencer.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien créateur copié dans le presse-papier");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/influenceurs"
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tous les influenceurs
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 lg:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 gradient-mood-soft rounded-full blur-[120px] opacity-30 -z-10" />

        <div className="flex flex-col lg:flex-row gap-6 lg:items-start lg:justify-between">
          <div className="flex gap-5 flex-1">
            {influencer.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={influencer.profile_picture_url}
                alt={influencer.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full gradient-mood flex items-center justify-center text-white font-black text-3xl shrink-0 glow-primary">
                {influencer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight">{influencer.name}</h1>
                <Badge
                  variant={
                    influencer.status === "actif"
                      ? "success"
                      : influencer.status === "inactif"
                      ? "muted"
                      : "warning"
                  }
                >
                  {influencer.status}
                </Badge>
              </div>
              {influencer.bio && <p className="text-white/60 mt-2 max-w-2xl">{influencer.bio}</p>}
              {influencer.tags && influencer.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {influencer.tags.map((tag) => (
                    <Badge key={tag} variant="primary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="secondary" size="sm" onClick={copyShareLink}>
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copié !" : "Lien créateur"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setStatsOpen(true)}>
              <RefreshCw className="w-4 h-4" />
              Update stats
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" />
              Modifier
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats par plateforme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlatformCard
          platform="instagram"
          label="Instagram"
          icon={<Camera className="w-5 h-5" />}
          handle={influencer.instagram_handle}
          followers={influencer.instagram_followers}
          engagement={influencer.instagram_engagement_rate}
          evolution={getEvolution("instagram")}
        />
        <PlatformCard
          platform="tiktok"
          label="TikTok"
          icon={<Music2 className="w-5 h-5" />}
          handle={influencer.tiktok_handle}
          followers={influencer.tiktok_followers}
          engagement={influencer.tiktok_engagement_rate}
          evolution={getEvolution("tiktok")}
        />
        <PlatformCard
          platform="youtube"
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

      {/* Graph evolution */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution des abonnés</CardTitle>
            <CardDescription>Derniers snapshots enregistrés</CardDescription>
          </CardHeader>
          <FollowersChart snapshots={snapshots} />
        </Card>
      )}

      {/* Tableau Excel-like — Suivi des collaborations */}
      <Card>
        <CreatorCollabsTable
          collaborations={collaborations}
          influencer={influencer}
          brands={brands}
          influencers={allInfluencers}
          mode="admin"
          showFinancials={isAdmin}
        />
      </Card>

      <InfluencerSheet open={editOpen} onOpenChange={setEditOpen} influencer={influencer} />
      <StatsUpdateDialog
        open={statsOpen}
        onOpenChange={setStatsOpen}
        influencer={influencer}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}

function PlatformCard({
  platform,
  label,
  icon,
  handle,
  followers,
  engagement,
  engagementLabel = "engagement",
  evolution,
  isYouTube,
}: {
  platform: Platform;
  label: string;
  icon: React.ReactNode;
  handle: string | null;
  followers: number;
  engagement: number;
  engagementLabel?: string;
  evolution: { diff: number; pct: number } | null;
  isYouTube?: boolean;
}) {
  if (!handle) {
    return (
      <div className="glass rounded-3xl p-5 opacity-40">
        <div className="flex items-center gap-2 text-white/60 mb-3">
          {icon}
          <span className="font-semibold">{label}</span>
        </div>
        <div className="text-sm text-white/40">Pas de compte connecté</div>
      </div>
    );
  }

  const isUp = evolution && evolution.diff >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-hover rounded-3xl p-5"
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
      <div className="text-xs text-white/50">
        @{handle}
        {evolution && (
          <>
            {" · "}
            <span className={isUp ? "text-emerald-300" : "text-rose-300"}>
              {isUp ? "+" : ""}
              {formatNumber(Math.abs(evolution.diff))} cette semaine
            </span>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-white/50">{engagementLabel}</span>
        <span className="font-semibold">
          {isYouTube ? formatNumber(engagement) : formatPercent(engagement)}
        </span>
      </div>
    </motion.div>
  );
}
