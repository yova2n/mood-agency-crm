import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { CampaignEditor } from "@/components/campaigns/campaign-editor";
import type { CampaignPost, Influencer, Brand } from "@/lib/database.types";

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

  const [{ data: posts }, { data: brands }] = await Promise.all([
    supabase
      .from("campaign_posts")
      .select("*")
      .eq("influencer_id", influencer.id)
      .order("posted_at", { ascending: false }),
    supabase.from("brands").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={`Campagne — ${influencer.name}`}
        subtitle={`Saisis les publications du créateur. Dashboard public : /c/${slug}`}
      />
      <CampaignEditor
        influencer={influencer as Influencer}
        initialPosts={(posts ?? []) as CampaignPost[]}
        brands={(brands ?? []) as Brand[]}
      />
    </div>
  );
}
