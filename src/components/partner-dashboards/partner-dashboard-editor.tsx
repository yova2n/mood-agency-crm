"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { PartnerPostSheet } from "@/components/partner-dashboards/partner-post-sheet";
import { PLATFORM_LABEL } from "@/components/campaigns/post-sheet";
import { createClient } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils";
import type {
  Brand,
  Influencer,
  PartnerDashboard,
  PartnerDashboardPost,
  PartnerDashboardStatus,
} from "@/lib/database.types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const STATUS_LABEL: Record<PartnerDashboardStatus, string> = {
  draft: "Brouillon",
  active: "Actif",
  archived: "Archivé",
};

export function PartnerDashboardEditor({
  mode,
  dashboard,
  initialPosts,
  brands,
  influencers,
}: {
  mode: "create" | "edit";
  dashboard?: PartnerDashboard;
  initialPosts: PartnerDashboardPost[];
  brands: Brand[];
  influencers: Influencer[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(dashboard?.name ?? "");
  const [slug, setSlug] = useState(dashboard?.slug ?? "");
  const [partnerName, setPartnerName] = useState(dashboard?.partner_name ?? "");
  const [partnerLogo, setPartnerLogo] = useState(dashboard?.partner_logo_url ?? "");
  const [partnerColor, setPartnerColor] = useState(dashboard?.partner_color ?? "#7C3AED");
  const [agencyName, setAgencyName] = useState(dashboard?.agency_name ?? "Mood Agency");
  const [agencyLogo, setAgencyLogo] = useState(dashboard?.agency_logo_url ?? "");
  const [brandId, setBrandId] = useState<string>(dashboard?.brand_id ?? "none");
  const [status, setStatus] = useState<PartnerDashboardStatus>(dashboard?.status ?? "active");
  const [periodStart, setPeriodStart] = useState(dashboard?.period_start ?? "");
  const [periodEnd, setPeriodEnd] = useState(dashboard?.period_end ?? "");
  const [description, setDescription] = useState(dashboard?.description ?? "");

  const [posts, setPosts] = useState<PartnerDashboardPost[]>(initialPosts);
  const [editingPost, setEditingPost] = useState<PartnerDashboardPost | null>(null);
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  // KPIs cumulés (pour aperçu côté CRM)
  const stats = useMemo(() => {
    const totals = posts.reduce(
      (acc, p) => {
        acc.views += p.views;
        acc.likes += p.likes;
        acc.comments += p.comments;
        acc.shares += p.shares;
        acc.saves += p.saves;
        acc.reach += p.reach;
        acc.impressions += p.impressions;
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 }
    );
    const interactions = totals.likes + totals.comments + totals.shares + totals.saves;
    const engagement = totals.reach > 0 ? (interactions / totals.reach) * 100 : 0;
    return { ...totals, interactions, engagement };
  }, [posts]);

  function autoSlug(value: string) {
    setName(value);
    if (mode === "create" && !slug) setSlug(slugify(value));
  }

  async function saveDashboard() {
    if (!name.trim() || !partnerName.trim() || !slug.trim()) {
      toast.error("Nom, partenaire et slug requis");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const payload = {
      slug: slug.trim(),
      name: name.trim(),
      partner_name: partnerName.trim(),
      partner_logo_url: partnerLogo.trim() || null,
      partner_color: partnerColor,
      agency_name: agencyName.trim() || "Mood Agency",
      agency_logo_url: agencyLogo.trim() || null,
      brand_id: brandId === "none" ? null : brandId,
      status,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      description: description.trim() || null,
    };

    if (mode === "create") {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("partner_dashboards")
        .insert({ ...payload, created_by: user?.id })
        .select("slug")
        .single();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Tableau partenaire créé ✓");
      setSaving(false);
      router.push(`/dashboard/partenaires/${data.slug}`);
      return;
    }

    const { error } = await supabase
      .from("partner_dashboards")
      .update(payload)
      .eq("id", dashboard!.id);
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    toast.success("Tableau mis à jour ✓");
    setSaving(false);
    if (slug !== dashboard!.slug) router.push(`/dashboard/partenaires/${slug}`);
    else router.refresh();
  }

  async function deletePost(p: PartnerDashboardPost) {
    if (!confirm(`Supprimer "${p.title || "cette publication"}" ?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("partner_dashboard_posts").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    toast.success("Publication supprimée");
  }

  function onPostSaved(p: PartnerDashboardPost) {
    setPosts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = p;
        return copy;
      }
      return [...prev, p].sort((a, b) => a.sort_order - b.sort_order);
    });
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/dashboard/partenaires" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Retour aux tableaux
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {mode === "edit" && dashboard && (
            <a
              href={`/p/${dashboard.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-orange-300 px-3 py-2 rounded-full hover:bg-white/5"
            >
              <ExternalLink className="w-4 h-4" />
              Voir le dashboard partenaire
            </a>
          )}
          <Button onClick={saveDashboard} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloc 1 : Métadonnées + identité */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-4">Identité du dashboard</div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Nom de la campagne *</Label>
                  <Input value={name} onChange={(e) => autoSlug(e.target.value)} placeholder="Bunq × Genki — Q1 2026" required />
                </div>
                <div>
                  <Label className="mb-1.5 block">Slug URL *</Label>
                  <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="bunq-genki-q1" />
                  <p className="text-[10px] text-white/40 mt-1">URL : /p/{slug || "..."}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Nom du partenaire (titre)</Label>
                  <Input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="bunq" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Marque liée (CRM)</Label>
                  <Select value={brandId} onValueChange={setBrandId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Aucune —</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Logo du partenaire</Label>
                  <ImageUpload value={partnerLogo} onChange={setPartnerLogo} folder="partners" shape="square" size="sm" fallback={partnerName || "?"} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Logo agence / créateur</Label>
                  <ImageUpload value={agencyLogo} onChange={setAgencyLogo} folder="partners" shape="square" size="sm" fallback={agencyName} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Couleur accent</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={partnerColor}
                      onChange={(e) => setPartnerColor(e.target.value)}
                      className="w-11 h-11 rounded-full border border-white/10 bg-transparent cursor-pointer"
                    />
                    <Input value={partnerColor} onChange={(e) => setPartnerColor(e.target.value)} placeholder="#7C3AED" />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Nom de l&apos;agence affiché</Label>
                  <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Mood Agency" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1.5 block">Statut</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as PartnerDashboardStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABEL) as PartnerDashboardStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Période — du</Label>
                  <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block">au</Label>
                  <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Description (visible côté partenaire)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Campagne de lancement de l'app Bunq sur le marché FR..." />
              </div>
            </div>
          </Card>

          {/* Posts */}
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Publications de la campagne</div>
                <div className="text-xs text-white/50 mt-0.5">{posts.length} vidéo{posts.length > 1 ? "s" : ""}</div>
              </div>
              {mode === "edit" && (
                <Button
                  onClick={() => {
                    setEditingPost(null);
                    setPostSheetOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une publication
                </Button>
              )}
            </div>

            {mode === "create" && (
              <p className="text-xs text-white/50 mb-3">
                Enregistre d&apos;abord la campagne pour pouvoir ajouter des publications.
              </p>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-8 text-white/50 text-sm">
                Aucune publication pour l&apos;instant.
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 group">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail_url} alt={p.title || ""} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg gradient-mood flex items-center justify-center text-white text-[10px] font-bold">
                        {PLATFORM_LABEL[p.platform].slice(0, 3)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.title || "Sans titre"}</div>
                      <div className="text-xs text-white/40">
                        {PLATFORM_LABEL[p.platform]} · {new Date(p.posted_at).toLocaleDateString("fr-FR")} ·{" "}
                        {formatNumber(p.views)} vues · {formatNumber(p.likes + p.comments + p.shares + p.saves)} interactions
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingPost(p);
                          setPostSheetOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePost(p)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Bloc 2 : Aperçu KPIs */}
        <div className="space-y-6">
          <Card>
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-4">Aperçu cumulé</div>
            <div className="grid grid-cols-2 gap-3">
              <Kpi icon={Eye} label="Vues" value={formatNumber(stats.views)} />
              <Kpi icon={Heart} label="Interactions" value={formatNumber(stats.interactions)} />
              <Kpi icon={MessageCircle} label="Reach" value={formatNumber(stats.reach)} />
              <Kpi icon={Share2} label="Engagement" value={stats.engagement.toFixed(1) + "%"} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-white/50">
              C&apos;est ce qu&apos;affichera le dashboard partenaire en haut de page.
            </div>
          </Card>

          {mode === "edit" && dashboard && (
            <Card>
              <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-3">Lien à partager</div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-xs text-white/70 truncate flex-1">
                  {typeof window !== "undefined" ? window.location.origin : ""}/p/{dashboard.slug}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/p/${dashboard.slug}`);
                    toast.success("Copié ✓");
                  }}
                  className="text-xs text-orange-300 hover:text-orange-200 font-semibold"
                >
                  Copier
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {mode === "edit" && dashboard && (
        <PartnerPostSheet
          open={postSheetOpen}
          onOpenChange={(o) => {
            setPostSheetOpen(o);
            if (!o) setEditingPost(null);
          }}
          post={editingPost}
          dashboardId={dashboard.id}
          influencers={influencers}
          nextSortOrder={posts.length}
          onSaved={onPostSaved}
        />
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-orange-300" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">{label}</span>
      </div>
      <div className="text-xl font-extrabold">{value}</div>
    </motion.div>
  );
}
