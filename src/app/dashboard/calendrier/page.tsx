import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { Brand, CalendarEvent, Collaboration, Influencer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();

  const [{ data: events }, { data: collabs }, { data: influencers }, { data: brands }] = await Promise.all([
    supabase.from("calendar_events").select("*").order("start_date"),
    supabase.from("collaborations").select("*"),
    supabase.from("influencers").select("*"),
    supabase.from("brands").select("*"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader title="Calendrier" subtitle="Publications planifiées et campagnes à venir" />
      <CalendarView
        initialEvents={(events ?? []) as CalendarEvent[]}
        collaborations={(collabs ?? []) as Collaboration[]}
        influencers={(influencers ?? []) as Influencer[]}
        brands={(brands ?? []) as Brand[]}
      />
    </div>
  );
}
