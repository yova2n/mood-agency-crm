import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { PartnerDashboardEditor } from "@/components/partner-dashboards/partner-dashboard-editor";
import type { Brand, Influencer, PartnerDashboard, PartnerDashboardPost } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: dashboard } = await supabase
    .from("partner_dashboards")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!dashboard) notFound();

  const [{ data: posts }, { data: brands }, { data: influencers }] = await Promise.all([
    supabase
      .from("partner_dashboard_posts")
      .select("*")
      .eq("partner_dashboard_id", dashboard.id)
      .order("sort_order"),
    supabase.from("brands").select("*").order("name"),
    supabase.from("influencers").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={dashboard.name}
        subtitle={`URL publique : /p/${dashboard.slug} — saisis les vidéos et stats, le partenaire voit le rendu live.`}
      />
      <PartnerDashboardEditor
        mode="edit"
        dashboard={dashboard as PartnerDashboard}
        initialPosts={(posts ?? []) as PartnerDashboardPost[]}
        brands={(brands ?? []) as Brand[]}
        influencers={(influencers ?? []) as Influencer[]}
      />
    </div>
  );
}
