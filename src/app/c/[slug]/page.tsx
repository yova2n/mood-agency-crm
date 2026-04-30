import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatorPublicView } from "@/components/creator-public/creator-public-view";
import type { Brand, Collaboration, Influencer, StatsSnapshot } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: influencer } = await supabase
    .from("influencers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!influencer) notFound();

  const [{ data: collabs }, { data: brands }, { data: snapshots }] = await Promise.all([
    supabase
      .from("collaborations")
      .select("*")
      .eq("influencer_id", influencer.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase.from("brands").select("*"),
    supabase
      .from("influencer_stats_snapshots")
      .select("*")
      .eq("influencer_id", influencer.id)
      .order("snapshot_date", { ascending: true }),
  ]);

  return (
    <CreatorPublicView
      influencer={influencer as Influencer}
      collaborations={(collabs ?? []) as Collaboration[]}
      brands={(brands ?? []) as Brand[]}
      snapshots={(snapshots ?? []) as StatsSnapshot[]}
    />
  );
}
