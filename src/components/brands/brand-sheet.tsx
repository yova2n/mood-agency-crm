"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Building2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import type { Brand, CompanySearchResult } from "@/lib/database.types";

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

  // Données légales
  const [siren, setSiren] = useState(brand?.siren ?? "");
  const [siret, setSiret] = useState(brand?.siret ?? "");
  const [legalForm, setLegalForm] = useState(brand?.legal_form ?? "");
  const [nafCode, setNafCode] = useState(brand?.naf_code ?? "");
  const [nafLabel, setNafLabel] = useState(brand?.naf_label ?? "");
  const [address, setAddress] = useState(brand?.address ?? "");

  // Autocomplete
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CompanySearchResult[]>([]);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger autocomplete sur le champ "name" — uniquement en mode création
  useEffect(() => {
    if (brand) return; // pas d'autocomplete en édition
    if (!name.trim() || name.trim().length < 2) {
      setSuggestions([]);
      setSearchOpen(false);
      return;
    }

    // Debounce 300ms
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      // Annule la requête précédente
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const ctrl = new AbortController();
      searchAbortRef.current = ctrl;

      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/companies/search?q=${encodeURIComponent(name.trim())}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error("Erreur API");
        const data = (await res.json()) as { results: CompanySearchResult[] };
        setSuggestions(data.results ?? []);
        setSearchOpen((data.results ?? []).length > 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // silencieux : pas la peine de spammer si la recherche échoue
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [name, brand]);

  function applyCompany(c: CompanySearchResult) {
    setName(c.name);
    setSiren(c.siren);
    setSiret(c.siret);
    setLegalForm(c.legal_form ?? "");
    setNafCode(c.naf_code ?? "");
    setNafLabel(c.naf_label ?? "");
    setAddress(c.address ?? "");
    if (c.naf_label && !sector) setSector(c.naf_label);
    setSearchOpen(false);
    setSuggestions([]);
    toast.success(`Infos remplies depuis l'API SIRENE`);
  }

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
      siren: siren.trim() || null,
      siret: siret.trim() || null,
      legal_form: legalForm.trim() || null,
      naf_code: nafCode.trim() || null,
      naf_label: nafLabel.trim() || null,
      address: address.trim() || null,
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
            {brand
              ? "Mets à jour les infos et contacts."
              : "Tape le nom — on cherche dans la base SIRENE et on remplit tout."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto pr-2 -mr-2 flex-1 mt-4">
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">
              Infos générales
            </div>

            {/* Nom avec autocomplete */}
            <div className="relative">
              <Label className="mb-1.5 block flex items-center gap-1.5">
                Nom *
                {!brand && (
                  <span className="text-[10px] text-orange-300/80 font-semibold inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    recherche auto
                  </span>
                )}
              </Label>
              <div className="relative">
                {!brand && (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                )}
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setSearchOpen(true)}
                  placeholder="Puma, L'Oréal, Decathlon…"
                  required
                  autoComplete="off"
                  className={!brand ? "pl-10" : ""}
                />
                {searchLoading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300 animate-spin" />
                )}
              </div>

              {/* Dropdown suggestions */}
              {searchOpen && suggestions.length > 0 && !brand && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {suggestions.map((c) => (
                      <button
                        key={c.siret}
                        type="button"
                        onClick={() => applyCompany(c)}
                        className="w-full text-left p-3 rounded-xl hover:bg-orange-500/10 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                            <Building2 className="w-4 h-4 text-white/60 group-hover:text-orange-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-white truncate">{c.name}</div>
                            <div className="text-xs text-white/50 mt-0.5 truncate">
                              {c.naf_label ?? c.legal_form ?? "—"}
                            </div>
                            <div className="text-[11px] text-white/40 mt-0.5 truncate">
                              {[c.postcode, c.city].filter(Boolean).join(" ")} · SIREN {c.siren}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-3 py-2 border-t border-white/5 text-[10px] text-white/40 text-center">
                    Source : base SIRENE (data.gouv.fr) · Clique pour pré-remplir
                  </div>
                </div>
              )}
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

          {/* Données légales */}
          <div className="space-y-3 rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">
                Données légales
              </div>
              {siren && (
                <a
                  href={`https://www.pappers.fr/entreprise/${siren}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-orange-300 hover:text-orange-200 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  Voir sur Pappers
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">SIREN</Label>
                <Input value={siren} onChange={(e) => setSiren(e.target.value)} placeholder="123456789" maxLength={9} />
              </div>
              <div>
                <Label className="mb-1.5 block">SIRET (siège)</Label>
                <Input value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="12345678900012" maxLength={14} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Forme juridique</Label>
                <Input value={legalForm} onChange={(e) => setLegalForm(e.target.value)} placeholder="SAS" />
              </div>
              <div>
                <Label className="mb-1.5 block">Code NAF</Label>
                <Input value={nafCode} onChange={(e) => setNafCode(e.target.value)} placeholder="70.21Z" />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Libellé d&apos;activité (NAF)</Label>
              <Input value={nafLabel} onChange={(e) => setNafLabel(e.target.value)} placeholder="Conseil en relations publiques et communication" />
            </div>

            <div>
              <Label className="mb-1.5 block">Adresse du siège</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 rue de la Paix 75002 Paris" />
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
