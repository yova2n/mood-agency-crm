"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Brand, CalendarEvent, Collaboration, EventType, Influencer } from "@/lib/database.types";

export function CalendarEventDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  influencers,
  brands,
  collaborations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultDate?: string | null;
  influencers: Influencer[];
  brands: Brand[];
  collaborations: Collaboration[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState<EventType>(event?.type ?? "publication");
  const [startDate, setStartDate] = useState(
    event?.start_date?.slice(0, 10) ?? defaultDate ?? new Date().toISOString().slice(0, 10)
  );
  const [influencerId, setInfluencerId] = useState(event?.influencer_id ?? "");
  const [brandId, setBrandId] = useState(event?.brand_id ?? "");
  const [collabId, setCollabId] = useState(event?.collaboration_id ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const payload = {
      title: title.trim(),
      type,
      start_date: new Date(startDate + "T12:00:00").toISOString(),
      influencer_id: influencerId || null,
      brand_id: brandId || null,
      collaboration_id: collabId || null,
      notes: notes.trim() || null,
    };

    const { error } = event
      ? await supabase.from("calendar_events").update(payload).eq("id", event.id)
      : await supabase.from("calendar_events").insert(payload);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(event ? "Événement mis à jour" : "Événement créé !");
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!event || !confirm("Supprimer cet événement ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("calendar_events").delete().eq("id", event.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Événement supprimé");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
          <DialogDescription>
            {defaultDate && !event ? `Pour le ${defaultDate}` : "Planifie une publication, campagne ou deadline."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Titre *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Réunion brief Puma" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v: EventType) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="publication">Publication</SelectItem>
                  <SelectItem value="campagne">Campagne</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="reunion">Réunion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="mb-1.5 block">Influenceur (optionnel)</Label>
              <Select value={influencerId || ""} onValueChange={setInfluencerId}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  {influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Marque (optionnel)</Label>
              <Select value={brandId || ""} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Collaboration liée (optionnel)</Label>
              <Select value={collabId || ""} onValueChange={setCollabId}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  {collaborations.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex gap-2 pt-2">
            {event && (
              <Button variant="ghost" onClick={handleDelete} type="button" className="text-rose-300 hover:text-rose-200">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button" className="flex-1">Annuler</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : event ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
