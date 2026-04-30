import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { CollaborationsTable } from "@/components/collaborations/collaborations-table";
import type { Brand, Collaboration, Influencer, Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const [{ data: collabs }, { data: influencers }, { data: brands }] = await Promise.all([
    supabase
      .from("collaborations")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("influencers").select("*").order("name"),
    supabase.from("brands").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Collaborations"
        subtitle="Pipeline complet des campagnes en cours et passées"
      />
      <CollaborationsTable
        initialCollabs={(collabs ?? []) as Collaboration[]}
        influencers={(influencers ?? []) as Influencer[]}
        brands={(brands ?? []) as Brand[]}
        isAdmin={(profile as Profile | null)?.role === "admin"}
      />
    </div>
  );
}
