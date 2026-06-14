"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  FileText,
  Eye,
  Heart,
  Sparkles,
  Users,
  Megaphone,
  Camera,
  Music2,
  Play,
  Ghost,
  Tv,
  Briefcase,
  Calendar,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Globe,
  Settings,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { PLATFORM_LABEL } from "@/components/campaigns/post-sheet";
import type {
  Influencer,
  PartnerDashboard,
  PartnerDashboardPost,
  PostPlatform,
} from "@/lib/database.types";

const PLATFORM_GROUP: Record<string, { label: string; icon: typeof Camera; color: string }> = {
  overview: { label: "Vue globale", icon: Sparkles, color: "#7C3AED" },
  instagram: { label: "Instagram", icon: Camera, color: "#E1306C" },
  tiktok: { label: "TikTok", icon: Music2, color: "#000" },
  snapchat: { label: "Snapchat", icon: Ghost, color: "#FFFC00" },
  youtube: { label: "YouTube", icon: Play, color: "#FF0000" },
  twitch: { label: "Twitch", icon: Tv, color: "#9146FF" },
  linkedin: { label: "LinkedIn", icon: Briefcase, color: "#0A66C2" },
  calendar: { label: "Calendrier", icon: Calendar, color: "#10b981" },
};

function groupOf(platform: PostPlatform): string {
  if (platform.startsWith("instagram")) return "instagram";
  if (platform === "youtube" || platform === "youtube_shorts") return "youtube";
  return platform;
}

export function PartnerDashboardView({
  dashboard,
  posts,
  influencer,
}: {
  dashboard: PartnerDashboard;
  posts: PartnerDashboardPost[];
  influencer?: Influencer | null;
}) {
  // Parse les liens (un par ligne)
  const externalLinks = (dashboard.links ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const [tab, setTab] = useState<string>("overview");
  const [chartMetric, setChartMetric] = useState<"views" | "interactions" | "posts">("views");

  const accent = dashboard.partner_color || "#7C3AED";

  // Posts du tab actif
  const filteredPosts = useMemo(() => {
    if (tab === "overview" || tab === "calendar") return posts;
    return posts.filter((p) => groupOf(p.platform) === tab);
  }, [posts, tab]);

  // KPIs globaux (de la sélection)
  const stats = useMemo(() => {
    const totals = filteredPosts.reduce(
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
    const interactions = totals.likes + totals.comments + totals.shares + totals.saves;
    const engagement = totals.reach > 0 ? (interactions / totals.reach) * 100 : 0;
    const viewsPerPost = filteredPosts.length > 0 ? totals.views / filteredPosts.length : 0;
    return { ...totals, interactions, engagement, viewsPerPost };
  }, [filteredPosts]);

  // Courbe cumulative pour le chart
  const chartData = useMemo(() => {
    const sorted = [...filteredPosts].sort(
      (a, b) => +new Date(a.posted_at) - +new Date(b.posted_at)
    );
    let cumViews = 0;
    let cumInter = 0;
    let cumPosts = 0;
    return sorted.map((p) => {
      cumViews += p.views;
      cumInter += p.likes + p.comments + p.shares + p.saves;
      cumPosts += 1;
      return {
        date: new Date(p.posted_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        views: cumViews,
        interactions: cumInter,
        posts: cumPosts,
      };
    });
  }, [filteredPosts]);

  // Compteurs par plateforme (pour la sidebar)
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) {
      const g = groupOf(p.platform);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  }, [posts]);

  // Répartition par plateforme (tableau du bas)
  const breakdown = useMemo(() => {
    const m = new Map<string, { count: number; views: number; interactions: number; reach: number }>();
    for (const p of filteredPosts) {
      const g = groupOf(p.platform);
      const cur = m.get(g) ?? { count: 0, views: 0, interactions: 0, reach: 0 };
      cur.count++;
      cur.views += p.views;
      cur.interactions += p.likes + p.comments + p.shares + p.saves;
      cur.reach += p.reach;
      m.set(g, cur);
    }
    return Array.from(m.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.views - a.views);
  }, [filteredPosts]);

  const tabs = [
    { id: "overview", label: "Vue globale" },
    { id: "instagram", label: "Instagram", count: counts.get("instagram") },
    { id: "tiktok", label: "TikTok", count: counts.get("tiktok") },
    { id: "snapchat", label: "Snapchat", count: counts.get("snapchat") },
    { id: "youtube", label: "YouTube", count: counts.get("youtube") },
    { id: "twitch", label: "Twitch", count: counts.get("twitch") },
    { id: "linkedin", label: "LinkedIn", count: counts.get("linkedin") },
    { id: "calendar", label: "Calendrier" },
  ];

  return (
    <div className="partner-app">
      {/* Sidebar */}
      <aside className="partner-sidebar">
        <div className="partner-sidebar-brand">
          {dashboard.agency_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dashboard.agency_logo_url} alt={dashboard.agency_name} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="partner-brand-sticker">
              <span>{(dashboard.agency_name || "Mood").slice(0, 4)}</span>
            </div>
          )}
          <div className="partner-sidebar-sub">Espace partenaires</div>
        </div>

        <nav className="partner-nav">
          {tabs.map((t) => {
            const meta = PLATFORM_GROUP[t.id] || PLATFORM_GROUP.overview;
            const Icon = meta.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`partner-nav-item ${active ? "active" : ""}`}
                style={active ? { background: accent, color: "white" } : undefined}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span className={`partner-nav-count ${active ? "active" : ""}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="partner-main">
        {/* Top bar */}
        <header className="partner-topbar">
          <div className="partner-topbar-brand">
            {dashboard.partner_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dashboard.partner_logo_url} alt={dashboard.partner_name} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: accent }}
              >
                {dashboard.partner_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="partner-topbar-name">{dashboard.partner_name}</span>
            <span className="partner-topbar-title">Tableau de bord partenaire</span>
          </div>

          <div className="partner-topbar-actions">
            <button onClick={() => window.print()} className="partner-pill-btn">
              <FileText className="w-4 h-4" />
              Exporter PDF
            </button>
            <div className="partner-pill-btn">
              <span className="text-lg">🇫🇷</span>
              FR
              <Globe className="w-3.5 h-3.5 opacity-50" />
            </div>
            <div className="partner-pill-btn">
              <Settings className="w-4 h-4" />
              Admin
            </div>
          </div>
        </header>

        {/* Créateur engagé */}
        {influencer && (
          <section className="partner-creator-pill">
            {influencer.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={influencer.profile_picture_url} alt={influencer.name} className="partner-creator-avatar" />
            ) : (
              <div className="partner-creator-avatar partner-creator-fallback" style={{ background: accent }}>
                {influencer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="partner-creator-label">Créateur engagé sur cette campagne</div>
              <div className="partner-creator-name">{influencer.name}</div>
            </div>
            <div className="partner-creator-handles">
              {influencer.instagram_handle && (
                <a href={`https://instagram.com/${influencer.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="partner-creator-handle">
                  @{influencer.instagram_handle}
                </a>
              )}
              {influencer.tiktok_handle && (
                <a href={`https://tiktok.com/@${influencer.tiktok_handle}`} target="_blank" rel="noopener noreferrer" className="partner-creator-handle">
                  TikTok
                </a>
              )}
              {influencer.youtube_handle && (
                <a href={`https://youtube.com/@${influencer.youtube_handle}`} target="_blank" rel="noopener noreferrer" className="partner-creator-handle">
                  YouTube
                </a>
              )}
            </div>
          </section>
        )}

        {tab === "overview" && (
          <>
            {/* KPI row 1 */}
            <section className="partner-kpi-grid">
              <KpiCard label="Posts publiés" value={posts.length.toString()} accent={accent} icon={FileText} trend={0} />
              <KpiCard label="Vues totales" value={formatNumber(stats.views)} accent={accent} icon={Eye} trend={2.7} />
              <KpiCard label="Interactions" value={formatNumber(stats.interactions)} accent={accent} icon={Heart} trend={2.4} />
              <KpiCard label="Taux d'engagement" value={stats.engagement.toFixed(1) + "%"} accent={accent} icon={Sparkles} trend={0} subtitle="points vs période précédente" trendIsNegative={true} />
            </section>

            {/* KPI row 2 */}
            <section className="partner-kpi-grid partner-kpi-grid--3">
              <KpiCard label="Reach cumulé" value={formatNumber(stats.reach)} accent="#10b981" icon={Users} trend={2.7} subtitle="utilisateurs uniques touchés" />
              <KpiCard label="Impressions cumulées" value={formatNumber(stats.impressions)} accent="#F59E0B" icon={Megaphone} trend={2.7} subtitle="nombre de diffusions" />
              <KpiCard label="Vues / post" value={formatNumber(Math.round(stats.viewsPerPost))} accent={accent} icon={Eye} trend={0} hideTrendBadge />
            </section>

            {/* Chart */}
            <section className="partner-chart-card">
              <div className="partner-chart-head">
                <div>
                  <h2 className="partner-chart-title">Croissance globale</h2>
                  <p className="partner-chart-sub">Évolution cumulée sur la période</p>
                </div>
                <div className="partner-chart-switch">
                  <button className="partner-pill-btn partner-pill-btn--outline">Comparer</button>
                  {(["views", "interactions", "posts"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setChartMetric(m)}
                      className={`partner-pill-btn ${chartMetric === m ? "active" : ""}`}
                      style={chartMetric === m ? { background: accent, color: "white" } : undefined}
                    >
                      {m === "views" ? "Vues" : m === "interactions" ? "Interactions" : "Posts"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[340px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="partnerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(Number(v))} />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(v) => formatNumber(Number(v))}
                      />
                      <Area type="monotone" dataKey={chartMetric} stroke={accent} strokeWidth={2.5} fill="url(#partnerGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée à afficher.
                  </div>
                )}
              </div>
            </section>

            {/* Breakdown table */}
            {breakdown.length > 0 && (
              <section className="partner-card">
                <h2 className="partner-section-title">Répartition par plateforme</h2>
                <div className="partner-table-wrap">
                  <table className="partner-table">
                    <thead>
                      <tr>
                        <th>Plateforme</th>
                        <th className="text-right">Posts</th>
                        <th className="text-right">Vues</th>
                        <th className="text-right">Interactions</th>
                        <th className="text-right">Reach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((b) => {
                        const meta = PLATFORM_GROUP[b.key];
                        const Icon = meta?.icon ?? Sparkles;
                        return (
                          <tr key={b.key}>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: (meta?.color ?? accent) + "20", color: meta?.color ?? accent }}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-semibold">{meta?.label ?? b.key}</span>
                              </div>
                            </td>
                            <td className="text-right">{b.count}</td>
                            <td className="text-right">{formatNumber(b.views)}</td>
                            <td className="text-right">{formatNumber(b.interactions)}</td>
                            <td className="text-right">{formatNumber(b.reach)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Latest posts */}
            {posts.length > 0 && (
              <section className="partner-card">
                <h2 className="partner-section-title">Dernières publications</h2>
                <div className="partner-posts-grid">
                  {filteredPosts.slice(0, 8).map((p) => (
                    <PostMini key={p.id} post={p} accent={accent} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {tab !== "overview" && tab !== "calendar" && (
          <>
            <section className="partner-kpi-grid">
              <KpiCard label="Posts" value={filteredPosts.length.toString()} accent={accent} icon={FileText} trend={0} hideTrendBadge />
              <KpiCard label="Vues" value={formatNumber(stats.views)} accent={accent} icon={Eye} trend={2.7} />
              <KpiCard label="Interactions" value={formatNumber(stats.interactions)} accent={accent} icon={Heart} trend={2.4} />
              <KpiCard label="Engagement" value={stats.engagement.toFixed(1) + "%"} accent={accent} icon={Sparkles} trend={0} hideTrendBadge />
            </section>

            {filteredPosts.length === 0 ? (
              <div className="partner-card text-center py-16 text-gray-400">
                Aucune publication enregistrée pour cette plateforme.
              </div>
            ) : (
              <section className="partner-card">
                <h2 className="partner-section-title">Publications</h2>
                <div className="partner-posts-grid">
                  {filteredPosts.map((p) => (
                    <PostMini key={p.id} post={p} accent={accent} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {tab === "calendar" && (
          <section className="partner-card text-center py-20 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Calendrier des publications à venir.</p>
          </section>
        )}

        {externalLinks.length > 0 && (
          <section className="partner-card">
            <h2 className="partner-section-title">Liens des posts & ressources</h2>
            <div className="partner-links-list">
              {externalLinks.map((link, i) => {
                let label = link;
                try {
                  const u = new URL(link);
                  label = u.hostname.replace(/^www\./, "") + u.pathname;
                  if (label.length > 60) label = label.slice(0, 57) + "…";
                } catch {
                  // pas une URL valide, on garde le texte brut
                }
                return (
                  <a
                    key={i}
                    href={link.startsWith("http") ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="partner-link"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                    <span className="truncate">{label}</span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <footer className="partner-footer">
          © {new Date().getFullYear()} {dashboard.agency_name} — Tableau de bord {dashboard.partner_name}
        </footer>
      </main>

      <style>{`
        .partner-app {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 240px 1fr;
          background:
            radial-gradient(ellipse 60% 50% at 0% 0%, rgba(196, 181, 253, 0.55) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 100% 0%, rgba(167, 243, 208, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 50% 100%, rgba(254, 215, 170, 0.35) 0%, transparent 60%),
            #FAFAFA;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif;
          color: #0A0A0A;
        }
        @media (max-width: 900px) {
          .partner-app { grid-template-columns: 1fr; }
          .partner-sidebar { display: none; }
        }

        /* Sidebar */
        .partner-sidebar {
          padding: 28px 18px;
          border-right: 1px solid rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .partner-sidebar-brand { text-align: center; margin-bottom: 28px; }
        .partner-brand-sticker {
          width: 96px; height: 96px;
          border-radius: 24px;
          background: linear-gradient(135deg, #C4B5FD, #A78BFA);
          color: white; font-weight: 900; font-size: 22px;
          display: inline-flex; align-items: center; justify-content: center;
          text-transform: uppercase; letter-spacing: -0.04em;
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.25);
          margin-bottom: 8px;
        }
        .partner-sidebar-sub {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: #6B7280; font-weight: 700;
        }
        .partner-nav { display: flex; flex-direction: column; gap: 4px; }
        .partner-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 999px;
          font-size: 14px; font-weight: 600;
          color: #4B5563; background: transparent;
          border: none; cursor: pointer; transition: background 0.15s, color 0.15s;
          width: 100%;
        }
        .partner-nav-item:hover { background: rgba(0,0,0,0.04); color: #111827; }
        .partner-nav-item.active { color: white; }
        .partner-nav-count {
          font-size: 10px; font-weight: 700;
          padding: 2px 7px; border-radius: 999px;
          background: rgba(0,0,0,0.06); color: #6B7280;
        }
        .partner-nav-count.active { background: rgba(255,255,255,0.25); color: white; }

        /* Main */
        .partner-main {
          padding: 24px 32px 48px;
          max-width: 1400px;
          width: 100%;
        }
        @media (max-width: 900px) { .partner-main { padding: 20px; } }

        /* Topbar */
        .partner-topbar {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          margin-bottom: 28px;
        }
        .partner-topbar-brand {
          display: flex; align-items: center; gap: 12px;
          background: white; border-radius: 999px;
          padding: 6px 18px 6px 6px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.04);
        }
        .partner-topbar-name { font-weight: 700; font-size: 14px; }
        .partner-topbar-title { font-size: 14px; color: #6B7280; margin-left: 6px; }
        .partner-topbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .partner-pill-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 999px;
          background: white; color: #111827;
          font-size: 13px; font-weight: 600;
          border: 1px solid rgba(0,0,0,0.06);
          cursor: pointer; transition: all 0.15s;
        }
        .partner-pill-btn:hover { background: #F9FAFB; }
        .partner-pill-btn--outline { background: transparent; }

        /* KPI grid */
        .partner-kpi-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
          margin-bottom: 20px;
        }
        .partner-kpi-grid--3 { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1100px) {
          .partner-kpi-grid, .partner-kpi-grid--3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .partner-kpi-grid, .partner-kpi-grid--3 { grid-template-columns: 1fr; }
        }

        /* KPI card */
        .partner-kpi {
          background: white;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.04);
        }
        .partner-kpi-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .partner-kpi-icon { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .partner-kpi-trend {
          font-size: 11px; font-weight: 700;
          padding: 4px 9px; border-radius: 999px;
          display: inline-flex; align-items: center; gap: 3px;
        }
        .partner-kpi-trend.up { background: #D1FAE5; color: #065F46; }
        .partner-kpi-trend.down { background: #FEE2E2; color: #991B1B; }
        .partner-kpi-trend.flat { background: #F3F4F6; color: #6B7280; }
        .partner-kpi-value { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
        .partner-kpi-label { font-size: 14px; color: #6B7280; margin-top: 4px; font-weight: 500; }
        .partner-kpi-subtitle { font-size: 11px; color: #9CA3AF; margin-top: 2px; }

        /* Chart */
        .partner-chart-card {
          background: white; border-radius: 22px;
          padding: 22px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.04);
          margin-bottom: 20px;
        }
        .partner-chart-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
        .partner-chart-title { font-size: 18px; font-weight: 700; margin: 0; }
        .partner-chart-sub { font-size: 13px; color: #6B7280; margin: 2px 0 0; }
        .partner-chart-switch { display: flex; gap: 6px; flex-wrap: wrap; }
        .partner-pill-btn.active { color: white; }

        /* Card générique */
        .partner-card {
          background: white; border-radius: 22px;
          padding: 22px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.04);
          margin-bottom: 20px;
        }
        .partner-section-title { font-size: 16px; font-weight: 700; margin: 0 0 14px; }

        /* Table */
        .partner-table-wrap { overflow-x: auto; }
        .partner-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .partner-table th { text-align: left; font-size: 10px; text-transform: uppercase; color: #6B7280; letter-spacing: 0.08em; font-weight: 700; padding: 8px 10px; border-bottom: 1px solid #F3F4F6; }
        .partner-table td { padding: 12px 10px; border-bottom: 1px solid #F3F4F6; }
        .partner-table tr:last-child td { border-bottom: none; }

        /* Posts grid */
        .partner-posts-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 1100px) { .partner-posts-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .partner-posts-grid { grid-template-columns: 1fr; } }

        /* Créateur engagé */
        .partner-creator-pill {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          background: white; border-radius: 22px; padding: 14px 20px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.04);
          margin-bottom: 20px;
        }
        .partner-creator-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .partner-creator-fallback {
          color: white; font-weight: 800; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
        }
        .partner-creator-label {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em;
          font-weight: 700; color: #9CA3AF;
        }
        .partner-creator-name { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; margin-top: 2px; }
        .partner-creator-handles { display: flex; gap: 8px; flex-wrap: wrap; }
        .partner-creator-handle {
          font-size: 11px; font-weight: 600; color: #4B5563;
          padding: 6px 12px; border-radius: 999px;
          background: #F3F4F6; text-decoration: none;
          transition: background 0.15s;
        }
        .partner-creator-handle:hover { background: #E5E7EB; }

        /* Liens externes */
        .partner-links-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        @media (max-width: 700px) { .partner-links-list { grid-template-columns: 1fr; } }
        .partner-link {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 12px;
          background: #F9FAFB; border: 1px solid #F3F4F6;
          font-size: 12px; color: #4B5563; text-decoration: none;
          font-weight: 500; transition: all 0.15s;
        }
        .partner-link:hover { background: #F3F4F6; color: #111827; }

        .partner-footer { text-align: center; font-size: 11px; color: #9CA3AF; margin-top: 32px; }

        @media print {
          .partner-sidebar { display: none; }
          .partner-app { grid-template-columns: 1fr; background: white; }
          .partner-pill-btn, .partner-chart-switch { display: none !important; }
          .partner-main { max-width: 100%; padding: 16px; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
  icon: Icon,
  trend,
  subtitle,
  trendIsNegative,
  hideTrendBadge,
}: {
  label: string;
  value: string;
  accent: string;
  icon: typeof Eye;
  trend: number;
  subtitle?: string;
  trendIsNegative?: boolean;
  hideTrendBadge?: boolean;
}) {
  const up = trend > 0;
  const flat = trend === 0;
  const trendClass = flat ? "flat" : up && !trendIsNegative ? "up" : "down";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="partner-kpi">
      <div className="partner-kpi-head">
        <div className="partner-kpi-icon" style={{ background: accent + "1A", color: accent }}>
          <Icon className="w-4 h-4" />
        </div>
        {!hideTrendBadge && (
          <span className={`partner-kpi-trend ${trendClass}`}>
            {up && !flat && <TrendingUp className="w-3 h-3" />}
            {!up && !flat && <TrendingDown className="w-3 h-3" />}
            {trend.toFixed(1)} %
          </span>
        )}
      </div>
      <div className="partner-kpi-value">{value}</div>
      <div className="partner-kpi-label">{label}</div>
      {subtitle && <div className="partner-kpi-subtitle">{subtitle}</div>}
    </motion.div>
  );
}

function PostMini({ post, accent }: { post: PartnerDashboardPost; accent: string }) {
  return (
    <a
      href={post.post_url ?? "#"}
      target={post.post_url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden bg-white border border-black/[0.04] hover:shadow-lg transition-shadow"
    >
      {post.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.thumbnail_url} alt={post.title || ""} className="w-full aspect-square object-cover" />
      ) : (
        <div
          className="w-full aspect-square flex items-center justify-center text-white font-bold text-xs"
          style={{ background: accent }}
        >
          {PLATFORM_LABEL[post.platform]}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: accent }}>
            {PLATFORM_LABEL[post.platform]}
          </span>
          <span className="text-[10px] text-gray-400 ml-auto">
            {new Date(post.posted_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        </div>
        {post.title && <div className="font-semibold text-xs mb-2 line-clamp-2 text-gray-900">{post.title}</div>}
        <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-500">
          <span>👁 {formatNumber(post.views)}</span>
          <span>❤ {formatNumber(post.likes)}</span>
          <span>💬 {formatNumber(post.comments)}</span>
        </div>
        {post.post_url && (
          <div className="mt-2 text-[10px] text-gray-400 inline-flex items-center gap-0.5">
            Voir <ExternalLink className="w-2.5 h-2.5" />
          </div>
        )}
      </div>
    </a>
  );
}
