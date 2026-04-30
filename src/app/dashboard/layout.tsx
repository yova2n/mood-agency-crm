import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import type { Profile } from "@/lib/database.types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <Sidebar profile={profile as Profile} email={user.email ?? ""} />
      <main className="lg:ml-[260px] min-h-screen min-w-0 overflow-x-hidden">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-w-0">{children}</div>
      </main>
    </div>
  );
}
