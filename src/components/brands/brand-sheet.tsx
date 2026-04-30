"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import type { Brand } from "@/lib/database.types";

export function BrandSheet({
  open,
  onOpenChange,
  brand,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(brand?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url ?? "");
  const [sector, setSector] = useState(brand?.sector ?? "");
  const [website, setWebsite] = useState(brand?.website ?? "");
  const [contactName, setContactName] = useState(brand?.primary_contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(brand?.primary_contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(brand?.primary_contact_phone ?? "");
  const [contact2Name, setContact2Name] = useState(brand?.secondary_contact_name ?? "");
  const [contact2Email, setContact2Email] = useState(brand?.secondary_contact_email ?? "");
  const [contact2Phone, setContact2Phone] = useState(brand?.secondary_contact_phone ?? "");
  const [notes, setNotes] = useState(brand?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const payload = {
      name: name.trim(),
      logo_url: logoUrl.trim() || null,
      sector: sector.trim() || null,
      website: website.trim() || null,
      primary_contact_name: contactName.trim() || null,
      primary_contact_email: contactEmail.trim() || null,
      primary_contact_phone: contactPhone.trim() || null,
      secondary_contact_name: contact2Name.trim() || null,
      secondary_contact_email: contact2Email.trim() || null,
      secondary_contact_phone: contact2Phone.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = brand
      ? await supabase.from("brands").update(payload).eq("id", brand.id)
      : await supabase.from("brands").insert(payload);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(brand ? "Marque mise à jour" : "Marque ajoutée !");
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{brand ? "Modifier la marque" : "Nouvelle marque"}</SheetTitle>
          <SheetDescription>
            {brand ? "Mets à jour les infos et contacts." : "Renseigne les infos générales et au moins un contact."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto pr-2 -mr-2 flex-1 mt-4">
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Infos générales</div>
            <div>
              <Label className="mb-1.5 block">Nom *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Puma" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Secteur</Label>
                <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Mode / Sport" />
              </div>
              <div>
                <Label className="mb-1.5 block">Site web</Label>
                <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://puma.com" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Logo</Label>
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                folder="brands"
                shape="square"
                size="sm"
                fallback={name || "?"}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Contact principal</div>
            <div>
              <Label className="mb-1.5 block">Nom</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Marketing Manager" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@marque.com" />
              </div>
              <div>
                <Label className="mb-1.5 block">Téléphone</Label>
                <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+33 ..." />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/40 font-bold">Contact secondaire (optionnel)</div>
            <div>
              <Label className="mb-1.5 block">Nom</Label>
              <Input value={contact2Name} onChange={(e) => setContact2Name(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <Input type="email" value={contact2Email} onChange={(e) => setContact2Email(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Téléphone</Label>
                <Input type="tel" value={contact2Phone} onChange={(e) => setContact2Phone(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Notes internes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </form>

        <div className="flex gap-2 pt-4 mt-2 border-t border-white/8">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button" className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : brand ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
