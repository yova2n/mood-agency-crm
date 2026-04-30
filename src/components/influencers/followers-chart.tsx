"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatNumber } from "@/lib/utils";
import type { StatsSnapshot } from "@/lib/database.types";

export function FollowersChart({ snapshots }: { snapshots: StatsSnapshot[] }) {
  // Group snapshots by date and platform
  const byDate = new Map<string, { date: string; instagram?: number; tiktok?: number; youtube?: number }>();
  for (const s of snapshots) {
    const entry = byDate.get(s.snapshot_date) || { date: s.snapshot_date };
    entry[s.platform] = s.followers;
    byDate.set(s.snapshot_date, entry);
  }
  const data = Array.from(byDate.values()).map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d MMM", { locale: fr }),
  }));

  return (
    <div className="h-72 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
          <Tooltip
            contentStyle={{
              background: "rgba(28,24,21,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              backdropFilter: "blur(12px)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}
            formatter={(v: number) => formatNumber(v)}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
          <Line type="monotone" dataKey="instagram" name="Instagram" stroke="#ff5722" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="tiktok" name="TikTok" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="youtube" name="YouTube" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
