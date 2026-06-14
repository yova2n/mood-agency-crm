import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { CatalogueBuilder } from "@/components/catalogue/catalogue-builder";
import type { Influencer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: influencers } = await supabase
    .from("influencers")
    .select("*")
    .order("name");

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Catalogue créateurs"
        subtitle="Sélectionne les créateurs à présenter et exporte un catalogue PDF pour tes marques."
      />
      <CatalogueBuilder influencers={(influencers ?? []) as Influencer[]} />
    </div>
  );
}
