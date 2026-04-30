import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { InfluencersList } from "@/components/influencers/influencers-list";
import type { Influencer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("influencers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Influenceurs"
        subtitle="Gestion des créateurs signés Mood Agency"
      />
      <InfluencersList initialInfluencers={(data ?? []) as Influencer[]} />
    </div>
  );
}
