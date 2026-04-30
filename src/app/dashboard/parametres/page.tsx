import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { TeamManagement } from "@/components/settings/team-management";
import { ProfileSettings } from "@/components/settings/profile-settings";
import type { Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const profile = myProfile as Profile | null;
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  return (
    <div className="space-y-8">
      <DashboardHeader title="Paramètres" subtitle="Gestion de l'équipe et de ton profil" />
      <ProfileSettings profile={profile} email={user!.email ?? ""} />
      <TeamManagement profiles={(profiles ?? []) as Profile[]} currentUserId={user!.id} />
    </div>
  );
}
