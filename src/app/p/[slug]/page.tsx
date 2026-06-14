import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PartnerDashboardView } from "@/components/partner-dashboards/partner-dashboard-view";
import type {
  Influencer,
  PartnerDashboard,
  PartnerDashboardPost,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";

/**
 * Vue publique d'une campagne pour le partenaire (la marque).
 * Sécurité : admin client server-side, accès strictement scopé au slug.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug || !/^[a-z0-9-]{1,80}$/i.test(slug)) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: dashboard } = await admin
    .from("partner_dashboards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!dashboard || dashboard.status === "archived") notFound();

  const { data: posts } = await admin
    .from("partner_dashboard_posts")
    .select("*")
    .eq("partner_dashboard_id", dashboard.id)
    .order("posted_at", { ascending: false });

  // Récupère le créateur engagé sur la campagne (s'il y en a un)
  let influencer: Influencer | null = null;
  if (dashboard.influencer_id) {
    const { data: inf } = await admin
      .from("influencers")
      .select("*")
      .eq("id", dashboard.influencer_id)
      .single();
    if (inf) influencer = inf as Influencer;
  }

  return (
    <PartnerDashboardView
      dashboard={dashboard as PartnerDashboard}
      posts={(posts ?? []) as PartnerDashboardPost[]}
      influencer={influencer}
    />
  );
}
