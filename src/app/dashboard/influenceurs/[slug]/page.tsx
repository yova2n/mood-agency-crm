import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfluencerDetail } from "@/components/influencers/influencer-detail";
import type { Influencer, StatsSnapshot, Collaboration, Brand, Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: influencer } = await supabase
    .from("influencers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!influencer) notFound();

  const [{ data: snapshots }, { data: collabs }, { data: brands }, { data: allInfluencers }] = await Promise.all([
    supabase
      .from("influencer_stats_snapshots")
      .select("*")
      .eq("influencer_id", influencer.id)
      .order("snapshot_date", { ascending: true }),
    supabase
      .from("collaborations")
      .select("*")
      .eq("influencer_id", influencer.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase.from("brands").select("*").order("name"),
    supabase.from("influencers").select("*").order("name"),
  ]);

  return (
    <InfluencerDetail
      influencer={influencer as Influencer}
      snapshots={(snapshots ?? []) as StatsSnapshot[]}
      collaborations={(collabs ?? []) as Collaboration[]}
      brands={(brands ?? []) as Brand[]}
      allInfluencers={(allInfluencers ?? []) as Influencer[]}
      isAdmin={(profile as Profile | null)?.role === "admin"}
    />
  );
}
