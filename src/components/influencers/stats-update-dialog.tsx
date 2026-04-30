"use client";

import { useState } from "react";
import { Loader2, Camera, Music2, Play } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Influencer } from "@/lib/database.types";

export function StatsUpdateDialog({
  open,
  onOpenChange,
  influencer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer: Influencer;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [igFollowers, setIgFollowers] = useState(influencer.instagram_followers?.toString() ?? "");
  const [igEngagement, setIgEngagement] = useState(influencer.instagram_engagement_rate?.toString() ?? "");
  const [ttFollowers, setTtFollowers] = useState(influencer.tiktok_followers?.toString() ?? "");
  const [ttEngagement, setTtEngagement] = useState(influencer.tiktok_engagement_rate?.toString() ?? "");
  const [ytSubs, setYtSubs] = useState(influencer.youtube_subscribers?.toString() ?? "");
  const [ytViews, setYtViews] = useState(influencer.youtube_avg_views?.toString() ?? "");

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    const snapshots: any[] = [];
    const updates: any = { updated_at: new Date().toISOString() };

    if (influencer.instagram_handle) {
      const f = parseInt(igFollowers) || 0;
      const e = parseFloat(igEngagement) || 0;
      snapshots.push({ influencer_id: influencer.id, platform: "instagram", followers: f, engagement_rate: e, snapshot_date: today });
      updates.instagram_followers = f;
      updates.instagram_engagement_rate = e;
    }
    if (influencer.tiktok_handle) {
      const f = parseInt(ttFollowers) || 0;
      const e = parseFloat(ttEngagement) || 0;
      snapshots.push({ influencer_id: influencer.id, platform: "tiktok", followers: f, engagement_rate: e, snapshot_date: today });
      updates.tiktok_followers = f;
      updates.tiktok_engagement_rate = e;
    }
    if (influencer.youtube_handle) {
      const subs = parseInt(ytSubs) || 0;
      const views = parseInt(ytViews) || 0;
      snapshots.push({ influencer_id: influencer.id, platform: "youtube", followers: subs, avg_views: views, snapshot_date: today });
      updates.youtube_subscribers = subs;
      updates.youtube_avg_views = views;
    }

    const { error: snapErr } = await supabase.from("influencer_stats_snapshots").insert(snapshots);
    if (snapErr) {
      toast.error(snapErr.message);
      setLoading(false);
      return;
    }
    const { error: updErr } = await supabase.from("influencers").update(updates).eq("id", influencer.id);
    if (updErr) {
      toast.error(updErr.message);
      setLoading(false);
      return;
    }

    toast.success("Stats mises à jour ! Snapshot enregistré.");
    setLoading(false);
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre à jour les stats</DialogTitle>
          <DialogDescription>
            Saisis les nouvelles valeurs. Un snapshot est créé pour suivre l&apos;évolution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {influencer.instagram_handle && (
            <Section icon={<Camera className="w-4 h-4" />} label="Instagram">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Abonnés</Label>
                  <Input type="number" value={igFollowers} onChange={(e) => setIgFollowers(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Engagement (%)</Label>
                  <Input type="number" step="0.1" value={igEngagement} onChange={(e) => setIgEngagement(e.target.value)} />
                </div>
              </div>
            </Section>
          )}
          {influencer.tiktok_handle && (
            <Section icon={<Music2 className="w-4 h-4" />} label="TikTok">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Abonnés</Label>
                  <Input type="number" value={ttFollowers} onChange={(e) => setTtFollowers(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Engagement (%)</Label>
                  <Input type="number" step="0.1" value={ttEngagement} onChange={(e) => setTtEngagement(e.target.value)} />
                </div>
              </div>
            </Section>
          )}
          {influencer.youtube_handle && (
            <Section icon={<Play className="w-4 h-4" />} label="YouTube">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Abonnés</Label>
                  <Input type="number" value={ytSubs} onChange={(e) => setYtSubs(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Vues moyennes</Label>
                  <Input type="number" value={ytViews} onChange={(e) => setYtViews(e.target.value)} />
                </div>
              </div>
            </Section>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">Annuler</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold flex items-center gap-2">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}
