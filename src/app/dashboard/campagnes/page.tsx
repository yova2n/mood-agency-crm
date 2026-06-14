import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { TrendingUp, ExternalLink, AlertTriangle } from "lucide-react";
import type { Influencer, CampaignPost } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Bulletproof : on isole chaque requête pour qu'une erreur partielle
  // (ex: table campaign_posts pas encore créée côté Supabase) ne crash pas la page.
  let influencers: Influencer[] = [];
  let postsRaw: Pick<CampaignPost, "influencer_id">[] = [];
  let errorMessages: string[] = [];

  try {
    const supabase = await createClient();

    const infRes = await supabase.from("influencers").select("*").order("name");
    if (infRes.error) {
      errorMessages.push(`Influenceurs : ${infRes.error.message}`);
    } else {
      influencers = (infRes.data ?? []) as Influencer[];
    }

    const postsRes = await supabase.from("campaign_posts").select("influencer_id");
    if (postsRes.error) {
      errorMessages.push(
        `Table campaign_posts : ${postsRes.error.message}. ` +
          `As-tu bien exécuté supabase/2026-05-campaigns-and-invoices.sql sur le projet bcvmhzokqqqtdelfgkyz ?`
      );
    } else {
      postsRaw = (postsRes.data ?? []) as Pick<CampaignPost, "influencer_id">[];
    }
  } catch (err) {
    errorMessages.push(err instanceof Error ? err.message : "Erreur inconnue");
  }

  const postsCount = new Map<string, number>();
  for (const p of postsRaw) {
    postsCount.set(p.influencer_id, (postsCount.get(p.influencer_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Campagnes"
        subtitle="Sélectionne un créateur pour saisir ses publications et stats."
      />

      {errorMessages.length > 0 && (
        <div className="rounded-3xl bg-orange-500/10 border border-orange-500/30 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-orange-200 mb-1">
              Configuration Supabase incomplète
            </div>
            <ul className="text-sm text-white/70 space-y-1">
              {errorMessages.map((m, i) => (
                <li key={i}>• {m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {influencers.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-white/60">
            Aucun créateur — commence par en créer un dans l&apos;onglet Influenceurs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {influencers.map((inf) => {
            const total = postsCount.get(inf.id) ?? 0;
            return (
              <div key={inf.id} className="glass glass-hover rounded-3xl p-5 relative">
                <Link
                  href={`/dashboard/campagnes/${inf.slug}`}
                  className="absolute inset-0 rounded-3xl z-0"
                  aria-label={`Éditer la campagne de ${inf.name}`}
                />
                <div className="relative z-10 pointer-events-none">
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
                      <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                        Publications
                      </div>
                      <div className="text-2xl font-extrabold gradient-text">{total}</div>
                    </div>
                    <a
                      href={`/c/${inf.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-20 pointer-events-auto text-xs text-white/50 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
                    >
                      Dashboard public
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
