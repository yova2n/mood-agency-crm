"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PipelineProgress } from "@/components/collaborations/pipeline-progress";
import { formatEuros, MONTHS_FR } from "@/lib/utils";
import type { Collaboration, Influencer } from "@/lib/database.types";

export function RecentCollabs({
  collabs,
  influencers,
  isAdmin,
}: {
  collabs: Collaboration[];
  influencers: Influencer[];
  isAdmin: boolean;
}) {
  const map = new Map(influencers.map((i) => [i.id, i]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dernières collabs</CardTitle>
            <CardDescription>Activité récente</CardDescription>
          </div>
          <Link
            href="/dashboard/collaborations"
            className="text-xs text-orange-300 hover:text-orange-200 flex items-center gap-1 font-semibold"
          >
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>

      {collabs.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">Aucune collaboration enregistrée.</div>
      ) : (
        <div className="space-y-3">
          {collabs.map((c) => {
            const inf = c.influencer_id ? map.get(c.influencer_id) : null;
            return (
              <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.title}</div>
                    <div className="text-xs text-white/50 truncate">
                      {inf?.name ?? "—"} · {MONTHS_FR[c.month - 1]} {c.year}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isAdmin ? (
                      <>
                        <div className="text-sm font-semibold text-emerald-300">
                          {formatEuros(Number(c.commission_ht))}
                        </div>
                        <div className="text-[10px] text-white/40">commission</div>
                      </>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-white/20" />
                    )}
                  </div>
                </div>
                <PipelineProgress collab={c} compact />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
