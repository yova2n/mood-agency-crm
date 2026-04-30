"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PipelineSteps } from "@/components/collaborations/pipeline-progress";
import { createClient } from "@/lib/supabase/client";
import { formatEuros, MONTHS_FR } from "@/lib/utils";
import type {
  Brand,
  Collaboration,
  Influencer,
  ApporteurType,
  CollabStatus,
  CollabType,
} from "@/lib/database.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration?: Collaboration | null;
  influencers: Influencer[];
  brands: Brand[];
  isAdmin: boolean;
  defaultInfluencerId?: string;
};

export function CollaborationSheet({ open, onOpenChange, collaboration, influencers, brands, isAdmin, defaultInfluencerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [title, setTitle] = useState(collaboration?.title ?? "");
  const [brandId, setBrandId] = useState(collaboration?.brand_id ?? "");
  const [influencerId, setInfluencerId] = useState(collaboration?.influencer_id ?? defaultInfluencerId ?? "");
  const [year, setYear] = useState(collaboration?.year?.toString() ?? now.getFullYear().toString());
  const [month, setMonth] = useState(collaboration?.month?.toString() ?? (now.getMonth() + 1).toString());
  const [type, setType] = useState<CollabType>(collaboration?.type ?? "agence");
  const [apporteur, setApporteur] = useState<ApporteurType>(collaboration?.apporteur ?? "agence");
  const [budgetHt, setBudgetHt] = useState(collaboration?.budget_ht?.toString() ?? "");
  const [commissionRate, setCommissionRate] = useState((collaboration ? Number(collaboration.commission_rate) * 100 : 30).toString());
  const [status, setStatus] = useState<CollabStatus>(collaboration?.status ?? "en_cours");
  const [brief, setBrief] = useState(collaboration?.brief ?? "");
  const [deliverables, setDeliverables] = useState(collaboration?.deliverables ?? "");
  const [publicationDate, setPublicationDate] = useState(collaboration?.publication_date ?? "");
  const [notes, setNotes] = useState(collaboration?.notes ?? "");

  // Pipeline steps
  const [steps, setSteps] = useState({
    step_devis_contrat_envoye: collaboration?.step_devis_contrat_envoye ?? false,
    step_contrat_signe: collaboration?.step_contrat_signe ?? false,
    step_devis_signe: collaboration?.step_devis_signe ?? false,
    step_en_production: collaboration?.step_en_production ?? false,
    step_publie: collaboration?.step_publie ?? false,
    step_facture_envoyee: collaboration?.step_facture_envoyee ?? false,
    step_stats_envoyees: collaboration?.step_stats_envoyees ?? false,
    step_drive_ok: collaboration?.step_drive_ok ?? false,
  });

  const budget = parseFloat(budgetHt) || 0;
  const rate = (parseFloat(commissionRate) || 0) / 100;
  const commission = budget * rate;
  const reverse = budget - commission;

  // Suggérer le % selon apporteur
  function handleApporteurChange(v: ApporteurType) {
    setApporteur(v);
    if (!collaboration) {
      if (v === "agent") setCommissionRate("30");
      else if (v === "createur") setCommissionRate("15");
    }
  }

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
      brand_id: brandId || null,
      influencer_id: influencerId || null,
      year: parseInt(year),
      month: parseInt(month),
      type,
      apporteur,
      budget_ht: budget,
      commission_rate: rate,
      status,
      brief: brief.trim() || null,
      deliverables: deliverables.trim() || null,
      publication_date: publicationDate || null,
      notes: notes.trim() || null,
      ...steps,
    };

    const { error } = collaboration
      ? await supabase.from("collaborations").update(payload).eq("id", collaboration.id)
      : await supabase.from("collaborations").insert(payload);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(collaboration ? "Collaboration mise à jour" : "Collaboration ajoutée !");
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  const fakeCollab = useMemo(() => ({ ...collaboration, ...steps } as Collaboration), [steps, collaboration]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{collaboration ? "Modifier la collaboration" : "Nouvelle collaboration"}</SheetTitle>
          <SheetDescription>
            {collaboration ? "Mets à jour les détails et le pipeline." : "Renseigne marque, influenceur, budget et étapes."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto pr-2 -mr-2 flex-1 mt-4">
          {/* Infos */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Campagne</div>
            <div>
              <Label className="mb-1.5 block">Titre *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Drop printemps Puma" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Marque</Label>
                <Select value={brandId || ""} onValueChange={setBrandId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Influenceur</Label>
                <Select value={influencerId || ""} onValueChange={setInfluencerId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Mois</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS_FR.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Année</Label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="2020" max="2100" />
              </div>
            </div>
          </div>

          {/* Type & apporteur & financier */}
          {isAdmin && (
            <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Financier</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Type</Label>
                  <Select value={type} onValueChange={(v: CollabType) => setType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agence">Agence</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Apporteur</Label>
                  <Select value={apporteur} onValueChange={(v: ApporteurType) => handleApporteurChange(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agence">Agence</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="createur">Créateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Budget HT (€)</Label>
                  <Input type="number" step="0.01" value={budgetHt} onChange={(e) => setBudgetHt(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Commission (%)</Label>
                  <Input type="number" step="0.5" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                </div>
              </div>

              {/* Calculs en direct */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold">Commission agence</div>
                  <div className="text-lg font-extrabold text-emerald-300">{formatEuros(commission)}</div>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Reversé créateur</div>
                  <div className="text-lg font-extrabold">{formatEuros(reverse)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Pipeline</div>
            <PipelineSteps
              collab={fakeCollab}
              onToggle={(key, val) => setSteps((s) => ({ ...s, [key]: val }))}
            />
          </div>

          {/* Détails campagne */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Détails</div>
            <div>
              <Label className="mb-1.5 block">Statut</Label>
              <Select value={status} onValueChange={(v: CollabStatus) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="terminee">Terminée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Livrables</Label>
              <Input value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="2 Reels + 3 Stories" />
            </div>
            <div>
              <Label className="mb-1.5 block">Date de publication</Label>
              <Input type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Brief</Label>
              <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} placeholder="Description de la campagne, objectifs, hooks…" />
            </div>
            <div>
              <Label className="mb-1.5 block">Notes internes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </form>

        <div className="flex gap-2 pt-4 mt-2 border-t border-white/8">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button" className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : collaboration ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
