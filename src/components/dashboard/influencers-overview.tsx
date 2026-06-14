"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Music2, Play, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/influencer-status";
import type { Influencer } from "@/lib/database.types";

export function InfluencersOverview({ influencers }: { influencers: Influencer[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activité influenceurs</CardTitle>
            <CardDescription>Vue d&apos;ensemble des créateurs signés</CardDescription>
          </div>
          <Link
            href="/dashboard/influenceurs"
            className="text-xs text-orange-300 hover:text-orange-200 flex items-center gap-1 transition-colors font-semibold"
          >
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>

      {influencers.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">
          Aucun influenceur pour le moment.
          <Link href="/dashboard/influenceurs" className="block text-violet-300 mt-2">
            Ajouter le premier
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {influencers.map((inf, i) => {
            const total =
              (inf.instagram_followers || 0) +
              (inf.tiktok_followers || 0) +
              (inf.youtube_subscribers || 0);
            return (
              <motion.div
                key={inf.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/dashboard/influenceurs/${inf.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full gradient-mood flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {inf.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{inf.name}</span>
                      <Badge variant={STATUS_BADGE[inf.status]} className="shrink-0">
                        {STATUS_LABEL[inf.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                      {inf.instagram_handle && (
                        <span className="flex items-center gap-1" title="Instagram">
                          <Camera className="w-3 h-3" /> {formatNumber(inf.instagram_followers)}
                        </span>
                      )}
                      {inf.tiktok_handle && (
                        <span className="flex items-center gap-1" title="TikTok">
                          <Music2 className="w-3 h-3" /> {formatNumber(inf.tiktok_followers)}
                        </span>
                      )}
                      {inf.youtube_handle && (
                        <span className="flex items-center gap-1" title="YouTube">
                          <Play className="w-3 h-3" /> {formatNumber(inf.youtube_subscribers)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold gradient-text">{formatNumber(total)}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Total</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
