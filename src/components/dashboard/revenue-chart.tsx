"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatEuros } from "@/lib/utils";

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-end justify-between">
            <div>
              <CardTitle>Revenus agence — 12 derniers mois</CardTitle>
              <CardDescription>Cumul des commissions HT</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text">{formatEuros(total)}</div>
              <div className="text-xs text-white/40">Total YTD</div>
            </div>
          </div>
        </CardHeader>
        <div className="h-72 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff8a3d" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v.toString())}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "rgba(20,20,30,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  backdropFilter: "blur(12px)",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}
                formatter={(v) => [formatEuros(Number(v)), "Commission"]}
              />
              <Bar dataKey="revenue" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
