import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { TrendingUp, ExternalLink } from "lucide-react";
import type { Influencer, CampaignPost } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();

  const [{ data: influencers }, { data: posts }] = await Promise.all([
    supabase.from("influencers").select("*").order("name"),
    supabase.from("campaign_posts").select("influencer_id"),
  ]);

  const list = (influencers ?? []) as Influencer[];
  const allPosts = (posts ?? []) as Pick<CampaignPost, "influencer_id">[];

  const postsCount = new Map<string, number>();
  for (const p of allPosts) {
    postsCount.set(p.influencer_id, (postsCount.get(p.influencer_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Campagnes"
        subtitle="Sélectionne un créateur pour saisir ses publications et stats. Le dashboard public se met à jour automatiquement."
      />

      {list.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-white/60">
            Aucun créateur — commence par en créer un dans l&apos;onglet Influenceurs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((inf) => {
            const total = postsCount.get(inf.id) ?? 0;
            return (
              <Link
                key={inf.id}
                href={`/dashboard/campagnes/${inf.slug}`}
                className="glass glass-hover rounded-3xl p-5 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  {inf.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={inf.profile_picture_url}
                      alt={inf.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full gradient-mood flex items-center justify-center text-white font-bold">
                      {inf.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{inf.name}</div>
                    <div className="text-xs text-white/50 mt-0.5">@{inf.slug}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">Publications</div>
                    <div className="text-2xl font-extrabold gradient-text">{total}</div>
                  </div>
                  <a
                    href={`/c/${inf.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-white/50 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
                  >
                    Voir dashboard public
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
