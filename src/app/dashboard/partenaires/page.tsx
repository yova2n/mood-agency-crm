import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, ExternalLink, AlertTriangle } from "lucide-react";
import type { PartnerDashboard, PartnerDashboardPost } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let dashboards: PartnerDashboard[] = [];
  let posts: Pick<PartnerDashboardPost, "partner_dashboard_id">[] = [];
  const errors: string[] = [];

  try {
    const supabase = await createClient();

    const dRes = await supabase
      .from("partner_dashboards")
      .select("*")
      .order("created_at", { ascending: false });
    if (dRes.error) {
      errors.push(
        `Table partner_dashboards : ${dRes.error.message}. ` +
          `Exécute supabase/2026-05-partner-dashboards.sql sur le projet bcvmhzokqqqtdelfgkyz.`
      );
    } else {
      dashboards = (dRes.data ?? []) as PartnerDashboard[];
    }

    const pRes = await supabase
      .from("partner_dashboard_posts")
      .select("partner_dashboard_id");
    if (!pRes.error) {
      posts = (pRes.data ?? []) as Pick<PartnerDashboardPost, "partner_dashboard_id">[];
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Erreur inconnue");
  }

  const postsCount = new Map<string, number>();
  for (const p of posts) {
    postsCount.set(p.partner_dashboard_id, (postsCount.get(p.partner_dashboard_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Tableaux partenaires"
        subtitle="Crée un dashboard par campagne — saisis les vidéos, partage l'URL à la marque."
      />

      {errors.length > 0 && (
        <div className="rounded-3xl bg-orange-500/10 border border-orange-500/30 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-orange-200 mb-1">Configuration Supabase incomplète</div>
            <ul className="text-sm text-white/70 space-y-1">
              {errors.map((m, i) => <li key={i}>• {m}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/dashboard/partenaires/nouveau">
          <Button>
            <Plus className="w-4 h-4" />
            Nouveau tableau partenaire
          </Button>
        </Link>
      </div>

      {dashboards.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <Megaphone className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-white/60">
            Aucun tableau partenaire — crée-en un pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {dashboards.map((d) => {
            const count = postsCount.get(d.id) ?? 0;
            return (
              <div key={d.id} className="glass glass-hover rounded-3xl p-5 relative">
                <Link
                  href={`/dashboard/partenaires/${d.slug}`}
                  className="absolute inset-0 rounded-3xl z-0"
                  aria-label={`Éditer ${d.name}`}
                />
                <div className="relative z-10 pointer-events-none">
                  <div className="flex items-start gap-3 mb-4">
                    {d.partner_logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.partner_logo_url}
                        alt={d.partner_name}
                        className="w-12 h-12 rounded-xl object-cover bg-white"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ background: d.partner_color }}
                      >
                        {d.partner_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{d.name}</div>
                      <div className="text-xs text-white/50 mt-0.5 capitalize">
                        Partenaire : {d.partner_name} · {d.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">Publications</div>
                      <div className="text-2xl font-extrabold gradient-text">{count}</div>
                    </div>
                    <a
                      href={`/p/${d.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-20 pointer-events-auto text-xs text-white/50 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
                    >
                      Vue partenaire
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
