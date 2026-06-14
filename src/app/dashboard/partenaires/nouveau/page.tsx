import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { PartnerDashboardEditor } from "@/components/partner-dashboards/partner-dashboard-editor";
import type { Brand, Influencer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: brands }, { data: influencers }] = await Promise.all([
    supabase.from("brands").select("*").order("name"),
    supabase.from("influencers").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Nouveau tableau partenaire"
        subtitle="Crée le dashboard, puis ajoute les vidéos de la campagne."
      />
      <PartnerDashboardEditor
        mode="create"
        brands={(brands ?? []) as Brand[]}
        influencers={(influencers ?? []) as Influencer[]}
        initialPosts={[]}
      />
    </div>
  );
}
