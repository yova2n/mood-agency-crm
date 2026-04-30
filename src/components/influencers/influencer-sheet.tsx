"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Music2, Play } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Influencer, InfluencerStatus } from "@/lib/database.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer?: Influencer | null;
};

export function InfluencerSheet({ open, onOpenChange, influencer }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(influencer?.name ?? "");
  const [bio, setBio] = useState(influencer?.bio ?? "");
  const [profilePicture, setProfilePicture] = useState(influencer?.profile_picture_url ?? "");
  const [status, setStatus] = useState<InfluencerStatus>(influencer?.status ?? "actif");
  const [tagsInput, setTagsInput] = useState(influencer?.tags?.join(", ") ?? "");

  const [igHandle, setIgHandle] = useState(influencer?.instagram_handle ?? "");
  const [igFollowers, setIgFollowers] = useState(influencer?.instagram_followers?.toString() ?? "");
  const [igEngagement, setIgEngagement] = useState(influencer?.instagram_engagement_rate?.toString() ?? "");

  const [ttHandle, setTtHandle] = useState(influencer?.tiktok_handle ?? "");
  const [ttFollowers, setTtFollowers] = useState(influencer?.tiktok_followers?.toString() ?? "");
  const [ttEngagement, setTtEngagement] = useState(influencer?.tiktok_engagement_rate?.toString() ?? "");

  const [ytHandle, setYtHandle] = useState(influencer?.youtube_handle ?? "");
  const [ytSubs, setYtSubs] = useState(influencer?.youtube_subscribers?.toString() ?? "");
  const [ytViews, setYtViews] = useState(influencer?.youtube_avg_views?.toString() ?? "");

  function reset() {
    setName(""); setBio(""); setProfilePicture(""); setStatus("actif"); setTagsInput("");
    setIgHandle(""); setIgFollowers(""); setIgEngagement("");
    setTtHandle(""); setTtFollowers(""); setTtEngagement("");
    setYtHandle(""); setYtSubs(""); setYtViews("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      slug: influencer?.slug ?? slugify(name),
      bio: bio.trim() || null,
      profile_picture_url: profilePicture.trim() || null,
      status,
      tags,
      instagram_handle: igHandle.trim() || null,
      instagram_followers: parseInt(igFollowers) || 0,
      instagram_engagement_rate: parseFloat(igEngagement) || 0,
      tiktok_handle: ttHandle.trim() || null,
      tiktok_followers: parseInt(ttFollowers) || 0,
      tiktok_engagement_rate: parseFloat(ttEngagement) || 0,
      youtube_handle: ytHandle.trim() || null,
      youtube_subscribers: parseInt(ytSubs) || 0,
      youtube_avg_views: parseInt(ytViews) || 0,
    };

    const { data, error } = influencer
      ? await supabase.from("influencers").update(payload).eq("id", influencer.id).select().single()
      : await supabase.from("influencers").insert(payload).select().single();

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Un influenceur avec ce nom existe déjà" : error.message);
      setLoading(false);
      return;
    }

    // Snapshot initial des stats
    if (data && !influencer) {
      const snapshots = [];
      if (igHandle && parseInt(igFollowers) > 0) {
        snapshots.push({
          influencer_id: data.id,
          platform: "instagram",
          followers: parseInt(igFollowers),
          engagement_rate: parseFloat(igEngagement) || 0,
        });
      }
      if (ttHandle && parseInt(ttFollowers) > 0) {
        snapshots.push({
          influencer_id: data.id,
          platform: "tiktok",
          followers: parseInt(ttFollowers),
          engagement_rate: parseFloat(ttEngagement) || 0,
        });
      }
      if (ytHandle && parseInt(ytSubs) > 0) {
        snapshots.push({
          influencer_id: data.id,
          platform: "youtube",
          followers: parseInt(ytSubs),
          avg_views: parseInt(ytViews) || 0,
        });
      }
      if (snapshots.length > 0) {
        await supabase.from("influencer_stats_snapshots").insert(snapshots);
      }
    }

    toast.success(influencer ? "Influenceur mis à jour" : "Influenceur ajouté !");
    setLoading(false);
    onOpenChange(false);
    if (!influencer) reset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{influencer ? "Modifier l'influenceur" : "Nouvel influenceur"}</SheetTitle>
          <SheetDescription>
            {influencer ? "Mets à jour les infos et stats du créateur." : "Remplis les infos générales puis les stats des réseaux."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto pr-2 -mr-2 flex-1 mt-4">
          {/* Section infos */}
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Infos générales</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Photo de profil</Label>
                <ImageUpload
                  value={profilePicture}
                  onChange={setProfilePicture}
                  folder="influencers"
                  shape="circle"
                  size="md"
                  fallback={name || "?"}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="name" className="mb-1.5 block">Nom *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="YOVA2N" required />
              </div>

              <div>
                <Label className="mb-1.5 block">Statut</Label>
                <Select value={status} onValueChange={(v: InfluencerStatus) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags" className="mb-1.5 block">Tags (séparés par virgule)</Label>
                <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="lifestyle, food" />
              </div>

              <div className="col-span-2">
                <Label htmlFor="bio" className="mb-1.5 block">Bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Présentation rapide…" rows={3} />
              </div>
            </div>
          </div>

          {/* Instagram */}
          <PlatformSection
            icon={<Camera className="w-4 h-4" />}
            label="Instagram"
            handle={igHandle}
            setHandle={setIgHandle}
            followers={igFollowers}
            setFollowers={setIgFollowers}
            engagement={igEngagement}
            setEngagement={setIgEngagement}
            handlePlaceholder="yova2n"
          />

          {/* TikTok */}
          <PlatformSection
            icon={<Music2 className="w-4 h-4" />}
            label="TikTok"
            handle={ttHandle}
            setHandle={setTtHandle}
            followers={ttFollowers}
            setFollowers={setTtFollowers}
            engagement={ttEngagement}
            setEngagement={setTtEngagement}
            handlePlaceholder="yova2n"
          />

          {/* YouTube */}
          <PlatformSection
            icon={<Play className="w-4 h-4" />}
            label="YouTube"
            handle={ytHandle}
            setHandle={setYtHandle}
            followers={ytSubs}
            setFollowers={setYtSubs}
            engagement={ytViews}
            setEngagement={setYtViews}
            engagementLabel="Vues moyennes"
            handlePlaceholder="@yova2n"
          />
        </form>

        <div className="flex gap-2 pt-4 mt-2 border-t border-white/8">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button" className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : influencer ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PlatformSection({
  icon,
  label,
  handle,
  setHandle,
  followers,
  setFollowers,
  engagement,
  setEngagement,
  engagementLabel = "Taux d'engagement (%)",
  handlePlaceholder,
}: {
  icon: React.ReactNode;
  label: string;
  handle: string;
  setHandle: (v: string) => void;
  followers: string;
  setFollowers: (v: string) => void;
  engagement: string;
  setEngagement: (v: string) => void;
  engagementLabel?: string;
  handlePlaceholder?: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold flex items-center gap-2">
        {icon} {label}
      </div>
      <div>
        <Label className="mb-1.5 block">Pseudo</Label>
        <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={handlePlaceholder} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1.5 block">Abonnés</Label>
          <Input type="number" value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label className="mb-1.5 block">{engagementLabel}</Label>
          <Input type="number" step="0.1" value={engagement} onChange={(e) => setEngagement(e.target.value)} placeholder="0" />
        </div>
      </div>
    </div>
  );
}
