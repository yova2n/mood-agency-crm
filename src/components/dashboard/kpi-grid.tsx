"use client";

import { motion } from "framer-motion";
import { Users, Handshake, TrendingUp, Activity, Lock } from "lucide-react";
import { formatEuros } from "@/lib/utils";

type KpiGridProps = {
  activeInfluencers: number;
  ongoingCollabs: number;
  monthRevenue: number;
  monthPublications: number;
  isAdmin: boolean;
};

export function KpiGrid({
  activeInfluencers,
  ongoingCollabs,
  monthRevenue,
  monthPublications,
  isAdmin,
}: KpiGridProps) {
  const kpis = [
    {
      label: "Influenceurs actifs",
      value: activeInfluencers.toString(),
      icon: Users,
      glow: "shadow-orange-500/15",
      iconBg: "bg-orange-500/15 text-orange-300",
    },
    {
      label: "Collaborations en cours",
      value: ongoingCollabs.toString(),
      icon: Handshake,
      glow: "shadow-rose-500/15",
      iconBg: "bg-rose-500/15 text-rose-300",
    },
    {
      label: "CA agence (ce mois)",
      value: isAdmin ? formatEuros(monthRevenue) : "—",
      icon: isAdmin ? TrendingUp : Lock,
      glow: "shadow-emerald-500/15",
      iconBg: "bg-emerald-500/15 text-emerald-300",
      restricted: !isAdmin,
    },
    {
      label: "Publications ce mois",
      value: monthPublications.toString(),
      icon: Activity,
      glow: "shadow-amber-500/15",
      iconBg: "bg-amber-500/15 text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`glass glass-hover rounded-3xl p-5 shadow-lg ${kpi.glow}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${kpi.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-3xl font-extrabold tracking-tight ${kpi.restricted ? "text-white/30" : "text-white"}`}>
              {kpi.value}
            </div>
            <div className="text-xs text-white/50 mt-1 font-medium">{kpi.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
