import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { BrandsList } from "@/components/brands/brands-list";
import type { Brand, Collaboration, Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const [{ data: brands }, { data: collabs }] = await Promise.all([
    supabase.from("brands").select("*").order("name"),
    supabase.from("collaborations").select("*"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader title="Marques" subtitle="Annuaire des marques partenaires & contacts" />
      <BrandsList
        initialBrands={(brands ?? []) as Brand[]}
        collaborations={(collabs ?? []) as Collaboration[]}
        isAdmin={(profile as Profile | null)?.role === "admin"}
      />
    </div>
  );
}
