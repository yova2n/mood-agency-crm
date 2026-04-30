import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { InfluencersOverview } from "@/components/dashboard/influencers-overview";
import { RecentCollabs } from "@/components/dashboard/recent-collabs";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import type { Collaboration, Influencer, Profile } from "@/lib/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const isAdmin = (profile as Profile | null)?.role === "admin";

  const [{ data: influencers }, { data: collabs }] = await Promise.all([
    supabase.from("influencers").select("*").order("created_at", { ascending: false }),
    supabase.from("collaborations").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
  ]);

  const allInfluencers = (influencers ?? []) as Influencer[];
  const allCollabs = (collabs ?? []) as Collaboration[];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const activeInfluencers = allInfluencers.filter((i) => i.status === "actif").length;
  const ongoingCollabs = allCollabs.filter((c) => c.status === "en_cours").length;
  const monthRevenue = allCollabs
    .filter((c) => c.year === currentYear && c.month === currentMonth)
    .reduce((sum, c) => sum + Number(c.commission_ht || 0), 0);
  const monthPublications = allCollabs.filter(
    (c) => c.year === currentYear && c.month === currentMonth && c.step_publie
  ).length;

  // Revenus 12 derniers mois
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const total = allCollabs
      .filter((c) => c.year === y && c.month === m)
      .reduce((sum, c) => sum + Number(c.commission_ht || 0), 0);
    monthlyRevenue.push({
      month: d.toLocaleDateString("fr-FR", { month: "short" }),
      revenue: Math.round(total),
    });
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Vue d'ensemble"
        subtitle={`Bonjour ${(profile as Profile | null)?.full_name?.split(" ")[0] || "👋"}, voici un aperçu de l'activité.`}
      />

      <KpiGrid
        activeInfluencers={activeInfluencers}
        ongoingCollabs={ongoingCollabs}
        monthRevenue={monthRevenue}
        monthPublications={monthPublications}
        isAdmin={isAdmin}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InfluencersOverview influencers={allInfluencers.slice(0, 6)} />
        </div>
        <div>
          <RecentCollabs
            collabs={allCollabs.slice(0, 5)}
            influencers={allInfluencers}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {isAdmin && <RevenueChart data={monthlyRevenue} />}
    </div>
  );
}
