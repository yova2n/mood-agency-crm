import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreatorPublicView } from "@/components/creator-public/creator-public-view";
import type { Brand, Collaboration, Influencer, StatsSnapshot } from "@/lib/database.types";

export const dynamic = "force-dynamic";

/**
 * Vue publique d'un créateur — accessible via une URL « secret » (le slug).
 *
 * SÉCURITÉ : on n'utilise PAS le client anon (qui exposerait toutes les tables).
 * On utilise l'admin client server-side, et on filtre strictement à un seul
 * influenceur + ses propres collabs / snapshots / marques liées.
 *
 * Cela permet de supprimer toutes les RLS policies "anon read *" qui donnaient
 * accès au schéma entier via la clé publique embarquée dans le navigateur.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Validation simple du slug (defense-in-depth contre injection / paths exotiques)
  if (!slug || !/^[a-z0-9-]{1,80}$/i.test(slug)) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: influencer } = await admin
    .from("influencers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!influencer) notFound();

  const [{ data: collabs }, { data: snapshots }] = await Promise.all([
    admin
      .from("collaborations")
      .select("*")
      .eq("influencer_id", influencer.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    admin
      .from("influencer_stats_snapshots")
      .select("*")
      .eq("influencer_id", influencer.id)
      .order("snapshot_date", { ascending: true }),
  ]);

  // On ne fetch QUE les marques liées aux collabs de ce créateur — pas toute la table
  const brandIds = Array.from(
    new Set((collabs ?? []).map((c) => c.brand_id).filter((id): id is string => !!id))
  );
  let brands: Brand[] = [];
  if (brandIds.length > 0) {
    const { data: b } = await admin.from("brands").select("*").in("id", brandIds);
    brands = (b ?? []) as Brand[];
  }

  return (
    <CreatorPublicView
      influencer={influencer as Influencer}
      collaborations={(collabs ?? []) as Collaboration[]}
      brands={brands}
      snapshots={(snapshots ?? []) as StatsSnapshot[]}
    />
  );
}
