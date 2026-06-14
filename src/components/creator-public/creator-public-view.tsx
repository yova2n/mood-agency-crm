"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Music2,
  Play,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Calendar,
  Users,
} from "lucide-react";
import { CreatorCollabsTable } from "@/components/collaborations/creator-collabs-table";
import { FollowersChart } from "@/components/influencers/followers-chart";
import { formatNumber, formatPercent } from "@/lib/utils";
import { PLATFORM_LABEL } from "@/components/campaigns/post-sheet";
import type {
  Brand,
  CampaignPost,
  Collaboration,
  Influencer,
  Platform,
  PostPlatform,
  StatsSnapshot,
} from "@/lib/database.types";

type Tab = "overview" | PostPlatform | "calendar" | "instagram_all" | "youtube_all";

export function CreatorPublicView({
  influencer,
  collaborations,
  brands,
  snapshots,
  posts,
}: {
  influencer: Influencer;
  collaborations: Collaboration[];
  brands: Brand[];
  snapshots: StatsSnapshot[];
  posts: CampaignPost[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

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

  // Stats agrégées des posts
  const stats = useMemo(() => {
    const totals = posts.reduce(
      (acc, p) => {
        acc.views += p.views;
        acc.likes += p.likes;
        acc.comments += p.comments;
        acc.shares += p.shares;
        acc.saves += p.saves;
        acc.reach += p.reach;
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0 }
    );
    const totalInteractions = totals.likes + totals.comments + totals.shares + totals.saves;
    const avgEngagementRate =
      totals.reach > 0 ? (totalInteractions / totals.reach) * 100 : 0;
    return { ...totals, totalInteractions, avgEngagementRate };
  }, [posts]);

  // Évolution interactions = somme sur la période vs période avant
  const interactionTrend = useMemo(() => {
    if (posts.length < 2) return null;
    const sorted = [...posts].sort(
      (a, b) => +new Date(a.posted_at) - +new Date(b.posted_at)
    );
    const half = Math.ceil(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);
    const sumInter = (arr: CampaignPost[]) =>
      arr.reduce((s, p) => s + p.likes + p.comments + p.shares + p.saves, 0);
    const a = sumInter(firstHalf);
    const b = sumInter(secondHalf);
    if (a === 0) return null;
    const pct = ((b - a) / a) * 100;
    return { diff: b - a, pct };
  }, [posts]);

  // Posts filtrés par tab
  const filteredPosts = useMemo(() => {
    if (tab === "overview") return posts.slice(0, 6);
    if (tab === "calendar") return [];
    return posts.filter((p) => {
      if (tab === "instagram_all") return p.platform.startsWith("instagram");
      if (tab === "youtube_all") return p.platform === "youtube" || p.platform === "youtube_shorts";
      return p.platform === tab;
    });
  }, [posts, tab]);

  const tabCounts = useMemo(() => {
    const ig = posts.filter((p) => p.platform.startsWith("instagram")).length;
    const tt = posts.filter((p) => p.platform === "tiktok").length;
    const yt = posts.filter((p) => p.platform === "youtube" || p.platform === "youtube_shorts").length;
    const sn = posts.filter((p) => p.platform === "snapchat").length;
    const tw = posts.filter((p) => p.platform === "twitch").length;
    const li = posts.filter((p) => p.platform === "linkedin").length;
    return { ig, tt, yt, sn, tw, li };
  }, [posts]);

  const brandsById = useMemo(() => {
    const m = new Map<string, Brand>();
    for (const b of brands) m.set(b.id, b);
    return m;
  }, [brands]);

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "overview", label: "Vue globale" },
    { id: "instagram_all", label: "Instagram", count: tabCounts.ig },
    { id: "tiktok", label: "TikTok", count: tabCounts.tt },
    { id: "youtube_all", label: "YouTube", count: tabCounts.yt },
    { id: "snapchat", label: "Snapchat", count: tabCounts.sn },
    { id: "twitch", label: "Twitch", count: tabCounts.tw },
    { id: "linkedin", label: "LinkedIn", count: tabCounts.li },
  ];

  return (
    <div className="min-h-svh w-full creator-bg text-white">
      {/* HERO */}
      <header className="relative">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-10 pt-12 pb-8">
          <div className="flex items-start gap-5 flex-wrap">
            {influencer.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={influencer.profile_picture_url}
                alt={influencer.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-2xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl gradient-mood flex items-center justify-center text-white font-black text-4xl shadow-2xl">
                {influencer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.3em] text-orange-200/80 font-bold mb-2">
                Espace créateur · Mood Agency
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Bonjour <span className="gradient-text">{influencer.name}</span>
              </h1>
              <p className="text-white/70 mt-3 max-w-2xl text-sm">
                Voici ton suivi en temps réel : audience, publications, collaborations.
                L&apos;équipe Mood Agency met à jour les chiffres à chaque étape.
              </p>
            </div>
            <div className="hidden md:flex gap-2 items-start">
              <div className="apple-card !p-4 text-center">
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Audience totale</div>
                <div className="text-2xl font-extrabold gradient-text mt-0.5">{formatNumber(totalFollowers)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/8 sticky top-0 z-30 creator-bg-blur">
          <div className="max-w-7xl mx-auto px-5 lg:px-10">
            <nav className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                      active
                        ? "text-white border-orange-400"
                        : "text-white/50 hover:text-white/80 border-transparent"
                    }`}
                  >
                    {t.label}
                    {t.count !== undefined && t.count > 0 && (
                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-orange-500/20 text-orange-200" : "bg-white/5 text-white/40"}`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-7xl mx-auto px-5 lg:px-10 py-8 space-y-8">
        {tab === "overview" && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiBlock label="Publications" value={posts.length.toString()} icon={Sparkles} />
              <KpiBlock
                label="Vues cumulées"
                value={formatNumber(stats.views)}
                icon={Eye}
                trendPct={interactionTrend?.pct}
              />
              <KpiBlock
                label="Interactions"
                value={formatNumber(stats.totalInteractions)}
                icon={Heart}
                trendPct={interactionTrend?.pct}
              />
              <KpiBlock
                label="Engagement moy."
                value={stats.avgEngagementRate.toFixed(1) + "%"}
                icon={TrendingUp}
              />
            </section>

            <section>
              <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-3">Plateformes</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {influencer.instagram_handle && (
                  <PlatformCard
                    icon={Camera}
                    platform="Instagram"
                    handle={influencer.instagram_handle}
                    followers={influencer.instagram_followers}
                    engagementRate={Number(influencer.instagram_engagement_rate)}
                    evolution={getEvolution("instagram")}
                    accent="from-pink-400 to-orange-400"
                  />
                )}
                {influencer.tiktok_handle && (
                  <PlatformCard
                    icon={Music2}
                    platform="TikTok"
                    handle={influencer.tiktok_handle}
                    followers={influencer.tiktok_followers}
                    engagementRate={Number(influencer.tiktok_engagement_rate)}
                    evolution={getEvolution("tiktok")}
                    accent="from-orange-400 to-rose-500"
                  />
                )}
                {influencer.youtube_handle && (
                  <PlatformCard
                    icon={Play}
                    platform="YouTube"
                    handle={influencer.youtube_handle}
                    followers={influencer.youtube_subscribers}
                    engagementRate={null}
                    evolution={getEvolution("youtube")}
                    avgViews={influencer.youtube_avg_views}
                    accent="from-red-400 to-orange-500"
                  />
                )}
              </div>
            </section>

            {posts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Dernières publications</div>
                  {posts.length > 6 && (
                    <button
                      onClick={() => setTab(tabs.find(t => t.count && t.count > 0)?.id ?? "instagram_all")}
                      className="text-xs text-orange-300 hover:text-orange-200 font-semibold"
                    >
                      Voir tout ({posts.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPosts.map((p, i) => (
                    <PostCard key={p.id} post={p} index={i} brand={p.brand_id ? brandsById.get(p.brand_id) : null} />
                  ))}
                </div>
              </section>
            )}

            {snapshots.length > 1 && (
              <section className="apple-card">
                <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-1">
                  Évolution de ton audience
                </div>
                <div className="text-xs text-white/50 mb-4">
                  Snapshots enregistrés par l&apos;équipe Mood Agency
                </div>
                <FollowersChart snapshots={snapshots} />
              </section>
            )}

            <section className="apple-card">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-0.5">Tes collaborations</div>
                  <div className="text-xs text-white/50">{ongoingCount} en cours · {completedCount} terminées</div>
                </div>
              </div>
              <CreatorCollabsTable collaborations={collaborations} brands={brands} influencer={influencer} />
            </section>
          </>
        )}

        {tab !== "overview" && tab !== "calendar" && (
          <section>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-extrabold">{tabs.find(t => t.id === tab)?.label}</h2>
                <div className="text-sm text-white/50 mt-0.5">
                  {filteredPosts.length} publication{filteredPosts.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            {filteredPosts.length === 0 ? (
              <div className="apple-card text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-white/30" />
                <p className="text-white/60 text-sm">Aucune publication enregistrée sur cette plateforme.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((p, i) => (
                  <PostCard key={p.id} post={p} index={i} brand={p.brand_id ? brandsById.get(p.brand_id) : null} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "calendar" && (
          <section className="apple-card text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/60 text-sm">Calendrier des publications à venir.</p>
          </section>
        )}

        <p className="text-center text-xs text-white/30 font-medium pt-8">
          © {new Date().getFullYear()} Mood Agency — Espace privé créateur · Kainova Group
        </p>
      </main>

      <style>{`
        .creator-bg {
          background:
            radial-gradient(ellipse 80% 50% at 0% 0%, rgba(255, 138, 61, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 100% 0%, rgba(244, 63, 94, 0.18) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255, 87, 34, 0.12) 0%, transparent 60%),
            #100806;
          background-attachment: fixed;
        }
        .creator-bg-blur {
          background: rgba(16, 8, 6, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .hero-glow {
          background: radial-gradient(ellipse 60% 80% at 30% 0%, rgba(255, 138, 61, 0.15) 0%, transparent 70%);
        }
        .apple-card {
          background: rgba(255, 180, 120, 0.05);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(217, 119, 6, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function KpiBlock({
  label,
  value,
  icon: Icon,
  trendPct,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
  trendPct?: number | null;
}) {
  const up = trendPct !== null && trendPct !== undefined && trendPct >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="apple-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-orange-300" />
        </div>
        {trendPct !== null && trendPct !== undefined && (
          <div
            className={`text-[10px] font-bold inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
              up ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"
            }`}
          >
            {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {Math.abs(trendPct).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
    </motion.div>
  );
}

function PlatformCard({
  icon: Icon,
  platform,
  handle,
  followers,
  engagementRate,
  evolution,
  avgViews,
  accent,
}: {
  icon: typeof Camera;
  platform: string;
  handle: string;
  followers: number;
  engagementRate: number | null;
  evolution: { diff: number; pct: number } | null;
  avgViews?: number;
  accent: string;
}) {
  return (
    <div className="apple-card">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 font-bold">{platform}</div>
          <div className="font-bold">@{handle}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">
            {platform === "YouTube" ? "Abonnés" : "Followers"}
          </div>
          <div className="text-2xl font-extrabold">{formatNumber(followers)}</div>
          {evolution && (
            <div
              className={`text-[10px] mt-0.5 font-bold inline-flex items-center gap-0.5 ${
                evolution.diff >= 0 ? "text-green-300" : "text-red-300"
              }`}
            >
              {evolution.diff >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {evolution.diff >= 0 ? "+" : ""}{formatNumber(evolution.diff)} ({evolution.pct.toFixed(1)}%)
            </div>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">
            {platform === "YouTube" ? "Vues moy." : "Engagement"}
          </div>
          <div className="text-2xl font-extrabold gradient-text">
            {platform === "YouTube" && avgViews !== undefined
              ? formatNumber(avgViews)
              : engagementRate !== null
              ? formatPercent(engagementRate)
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, index, brand }: { post: CampaignPost; index: number; brand?: Brand | null }) {
  const totalInteractions = post.likes + post.comments + post.shares + post.saves;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="apple-card overflow-hidden !p-0"
    >
      {post.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnail_url}
          alt={post.title || ""}
          className="w-full aspect-square object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[9px] uppercase tracking-wider font-bold text-orange-300 bg-orange-500/15 px-2 py-0.5 rounded-full">
            {PLATFORM_LABEL[post.platform]}
          </span>
          {brand && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-white/60 bg-white/5 px-2 py-0.5 rounded-full">
              {brand.name}
            </span>
          )}
          <span className="text-[10px] text-white/40 ml-auto">
            {new Date(post.posted_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        </div>

        {post.title && <div className="font-semibold text-sm mb-3 line-clamp-2">{post.title}</div>}

        <div className="grid grid-cols-4 gap-1.5">
          <PostStat icon={Eye} value={post.views} />
          <PostStat icon={Heart} value={post.likes} />
          <PostStat icon={MessageCircle} value={post.comments} />
          <PostStat icon={Share2} value={post.shares} />
        </div>

        {post.reach > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-white/50 flex items-center justify-between">
            <span>Reach: <strong className="text-white/70">{formatNumber(post.reach)}</strong></span>
            <span>Eng: <strong className="text-orange-200">{((totalInteractions / post.reach) * 100).toFixed(1)}%</strong></span>
          </div>
        )}

        {post.post_url && (
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-orange-300 transition-colors"
          >
            Voir le post <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function PostStat({ icon: Icon, value }: { icon: typeof Eye; value: number }) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-white/60">
      <Icon className="w-3 h-3 text-white/40" />
      <span className="font-semibold">{formatNumber(value)}</span>
    </div>
  );
}
