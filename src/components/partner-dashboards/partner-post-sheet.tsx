"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { PLATFORM_LABEL } from "@/components/campaigns/post-sheet";
import { createClient } from "@/lib/supabase/client";
import type { Influencer, PartnerDashboardPost, PostPlatform } from "@/lib/database.types";

export function PartnerPostSheet({
  open,
  onOpenChange,
  post,
  dashboardId,
  influencers,
  nextSortOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  post?: PartnerDashboardPost | null;
  dashboardId: string;
  influencers: Influencer[];
  nextSortOrder: number;
  onSaved: (p: PartnerDashboardPost) => void;
}) {
  const [loading, setLoading] = useState(false);

  const [platform, setPlatform] = useState<PostPlatform>("instagram");
  const [influencerId, setInfluencerId] = useState<string>("none");
  const [postUrl, setPostUrl] = useState("");
  const [postedAt, setPostedAt] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(0);
  const [saves, setSaves] = useState(0);
  const [reach, setReach] = useState(0);
  const [impressions, setImpressions] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (post) {
      setPlatform(post.platform);
      setInfluencerId(post.influencer_id ?? "none");
      setPostUrl(post.post_url ?? "");
      setPostedAt(post.posted_at);
      setTitle(post.title ?? "");
      setThumbnailUrl(post.thumbnail_url ?? "");
      setViews(post.views);
      setLikes(post.likes);
      setComments(post.comments);
      setShares(post.shares);
      setSaves(post.saves);
      setReach(post.reach);
      setImpressions(post.impressions);
      setNotes(post.notes ?? "");
    } else if (open) {
      setPlatform("instagram");
      setInfluencerId("none");
      setPostUrl("");
      setPostedAt(new Date().toISOString().slice(0, 10));
      setTitle("");
      setThumbnailUrl("");
      setViews(0);
      setLikes(0);
      setComments(0);
      setShares(0);
      setSaves(0);
      setReach(0);
      setImpressions(0);
      setNotes("");
    }
  }, [post, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const totalEngagement = likes + comments + shares + saves;
    const engagementRate = reach > 0 ? (totalEngagement / reach) * 100 : 0;

    const payload = {
      partner_dashboard_id: dashboardId,
      influencer_id: influencerId === "none" ? null : influencerId,
      platform,
      post_url: postUrl.trim() || null,
      posted_at: postedAt,
      title: title.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      views,
      likes,
      comments,
      shares,
      saves,
      reach,
      impressions,
      engagement_rate: Number(engagementRate.toFixed(2)),
      notes: notes.trim() || null,
      sort_order: post?.sort_order ?? nextSortOrder,
    };

    const res = post
      ? await supabase.from("partner_dashboard_posts").update(payload).eq("id", post.id).select("*").single()
      : await supabase.from("partner_dashboard_posts").insert(payload).select("*").single();

    if (res.error) {
      toast.error(res.error.message);
      setLoading(false);
      return;
    }

    toast.success(post ? "Publication mise à jour" : "Publication ajoutée");
    onSaved(res.data as PartnerDashboardPost);
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{post ? "Modifier la publication" : "Nouvelle publication"}</SheetTitle>
          <SheetDescription>Saisis manuellement les stats — le dashboard partenaire se met à jour live.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto pr-2 -mr-2 flex-1 mt-4">
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Infos générales</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Plateforme *</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as PostPlatform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PLATFORM_LABEL) as PostPlatform[]).map((p) => (
                      <SelectItem key={p} value={p}>{PLATFORM_LABEL[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Date de publication</Label>
                <Input type="date" value={postedAt} onChange={(e) => setPostedAt(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Créateur (optionnel)</Label>
              <Select value={influencerId} onValueChange={setInfluencerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sans créateur lié —</SelectItem>
                  {influencers.map((inf) => (
                    <SelectItem key={inf.id} value={inf.id}>{inf.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">Titre / Légende</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reel — Test 7 jours avec Bunq" />
            </div>

            <div>
              <Label className="mb-1.5 block">URL du post</Label>
              <Input type="url" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://www.instagram.com/p/..." />
            </div>

            <div>
              <Label className="mb-1.5 block">Vignette</Label>
              <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} folder="partner-posts" shape="square" size="sm" fallback={title || "post"} />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Statistiques</div>
            <div className="grid grid-cols-2 gap-3">
              <Num label="Vues" value={views} onChange={setViews} />
              <Num label="Likes" value={likes} onChange={setLikes} />
              <Num label="Commentaires" value={comments} onChange={setComments} />
              <Num label="Partages" value={shares} onChange={setShares} />
              <Num label="Sauvegardes" value={saves} onChange={setSaves} />
              <Num label="Reach" value={reach} onChange={setReach} />
              <Num label="Impressions" value={impressions} onChange={setImpressions} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Notes internes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </form>

        <div className="flex gap-2 pt-4 mt-2 border-t border-white/8">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button" className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : post ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}
