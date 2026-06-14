"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Send,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatEuros } from "@/lib/utils";
import { InvoicePrint } from "@/components/invoices/invoice-print";
import type { Brand, Invoice, InvoiceItem, InvoiceStatus } from "@/lib/database.types";

type Mode = "create" | "edit";

type ItemDraft = {
  id?: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
};

const DEFAULT_ISSUER = {
  issuer_name: "Mood Agency",
  issuer_legal_name: "KAINOVA GROUP",
  issuer_address: "60 rue François 1er, 75008 Paris",
  issuer_siret: "93477638600013",
  issuer_vat: "FR00934776386",
  issuer_email: "contact@mood-production.com",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

export function InvoiceForm({
  mode,
  invoice,
  initialItems,
  brands,
  suggestedNumber,
}: {
  mode: Mode;
  invoice?: Invoice;
  initialItems?: InvoiceItem[];
  brands: Brand[];
  suggestedNumber?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // En-tête
  const [number, setNumber] = useState(invoice?.number ?? suggestedNumber ?? "");
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status ?? "draft");
  const [issueDate, setIssueDate] = useState(
    invoice?.issue_date ?? new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(
    invoice?.due_date ?? (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })()
  );
  const [vatRate, setVatRate] = useState(invoice?.vat_rate ?? 0);

  // Émetteur (overridable)
  const [issuerName, setIssuerName] = useState(invoice?.issuer_name ?? DEFAULT_ISSUER.issuer_name);
  const [issuerLegalName, setIssuerLegalName] = useState(invoice?.issuer_legal_name ?? DEFAULT_ISSUER.issuer_legal_name);
  const [issuerAddress, setIssuerAddress] = useState(invoice?.issuer_address ?? DEFAULT_ISSUER.issuer_address);
  const [issuerSiret, setIssuerSiret] = useState(invoice?.issuer_siret ?? DEFAULT_ISSUER.issuer_siret);
  const [issuerVat, setIssuerVat] = useState(invoice?.issuer_vat ?? DEFAULT_ISSUER.issuer_vat);
  const [issuerEmail, setIssuerEmail] = useState(invoice?.issuer_email ?? DEFAULT_ISSUER.issuer_email);
  const [issuerIban, setIssuerIban] = useState(invoice?.issuer_iban ?? "");
  const [issuerBic, setIssuerBic] = useState(invoice?.issuer_bic ?? "");

  // Destinataire
  const [brandId, setBrandId] = useState<string>(invoice?.brand_id ?? "none");
  const [recipientName, setRecipientName] = useState(invoice?.recipient_name ?? "");
  const [recipientLegalName, setRecipientLegalName] = useState(invoice?.recipient_legal_name ?? "");
  const [recipientAddress, setRecipientAddress] = useState(invoice?.recipient_address ?? "");
  const [recipientSiret, setRecipientSiret] = useState(invoice?.recipient_siret ?? "");
  const [recipientVat, setRecipientVat] = useState(invoice?.recipient_vat ?? "");
  const [recipientEmail, setRecipientEmail] = useState(invoice?.recipient_email ?? "");

  // Contenu
  const [subject, setSubject] = useState(invoice?.subject ?? "");
  const [description, setDescription] = useState(invoice?.description ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [paymentTerms, setPaymentTerms] = useState(invoice?.payment_terms ?? "Paiement à 30 jours par virement bancaire.");

  // Items
  const [items, setItems] = useState<ItemDraft[]>(
    initialItems && initialItems.length > 0
      ? initialItems.map((it) => ({
          id: it.id,
          description: it.description,
          quantity: Number(it.quantity),
          unit_price_ht: Number(it.unit_price_ht),
        }))
      : [{ description: "", quantity: 1, unit_price_ht: 0 }]
  );

  // Préremplit le destinataire quand on choisit une marque
  function applyBrand(id: string) {
    setBrandId(id);
    if (id === "none") return;
    const b = brands.find((x) => x.id === id);
    if (!b) return;
    setRecipientName(b.name);
    if (b.legal_form) setRecipientLegalName(`${b.legal_form}`);
    if (b.address) setRecipientAddress(b.address);
    if (b.siret) setRecipientSiret(b.siret);
    if (b.primary_contact_email) setRecipientEmail(b.primary_contact_email);
  }

  const totals = useMemo(() => {
    const total_ht = items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price_ht) || 0),
      0
    );
    const vat_amount = total_ht * (Number(vatRate) / 100);
    const total_ttc = total_ht + vat_amount;
    return { total_ht, vat_amount, total_ttc };
  }, [items, vatRate]);

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price_ht: 0 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function persist(newStatus?: InvoiceStatus) {
    if (!number.trim()) {
      toast.error("Le numéro de facture est requis");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Le destinataire est requis");
      return;
    }
    if (items.length === 0 || items.every((it) => !it.description.trim())) {
      toast.error("Ajoute au moins une ligne de prestation");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const finalStatus = newStatus ?? status;

    const payload: Partial<Invoice> = {
      number: number.trim(),
      status: finalStatus,
      issuer_name: issuerName.trim(),
      issuer_legal_name: issuerLegalName.trim(),
      issuer_address: issuerAddress.trim(),
      issuer_siret: issuerSiret.trim(),
      issuer_vat: issuerVat.trim(),
      issuer_email: issuerEmail.trim(),
      issuer_iban: issuerIban.trim() || null,
      issuer_bic: issuerBic.trim() || null,
      brand_id: brandId === "none" ? null : brandId,
      recipient_name: recipientName.trim(),
      recipient_legal_name: recipientLegalName.trim() || null,
      recipient_address: recipientAddress.trim() || null,
      recipient_siret: recipientSiret.trim() || null,
      recipient_vat: recipientVat.trim() || null,
      recipient_email: recipientEmail.trim() || null,
      issue_date: issueDate,
      due_date: dueDate || null,
      vat_rate: Number(vatRate) || 0,
      total_ht: totals.total_ht,
      subject: subject.trim() || null,
      description: description.trim() || null,
      notes: notes.trim() || null,
      payment_terms: paymentTerms.trim() || null,
      sent_at: finalStatus === "sent" && !invoice?.sent_at ? new Date().toISOString() : invoice?.sent_at ?? null,
      paid_at: finalStatus === "paid" && !invoice?.paid_at ? new Date().toISOString() : invoice?.paid_at ?? null,
    };

    let invoiceId = invoice?.id;

    if (mode === "create") {
      // Auteur
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("invoices")
        .insert({ ...payload, created_by: user?.id })
        .select("id")
        .single();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      invoiceId = data.id;
    } else {
      const { error } = await supabase.from("invoices").update(payload).eq("id", invoice!.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }

    // Items : on supprime tout puis on réinsère (simple et fiable)
    if (invoiceId) {
      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
      const itemsPayload = items
        .filter((it) => it.description.trim())
        .map((it, idx) => ({
          invoice_id: invoiceId!,
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unit_price_ht: Number(it.unit_price_ht) || 0,
          sort_order: idx,
        }));
      if (itemsPayload.length > 0) {
        const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload);
        if (itemsError) {
          toast.error(`Lignes : ${itemsError.message}`);
          setSaving(false);
          return;
        }
      }
    }

    toast.success(mode === "create" ? "Facture créée ✓" : "Facture mise à jour ✓");
    setSaving(false);

    if (mode === "create") {
      router.push(`/dashboard/facturation/${invoiceId}`);
    } else {
      setStatus(finalStatus);
      router.refresh();
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleSendEmail() {
    if (!recipientEmail) {
      toast.error("Renseigne d'abord l'email du destinataire");
      return;
    }
    const subj = encodeURIComponent(`Facture ${number} — ${issuerName}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVous trouverez ci-joint la facture ${number} pour la prestation : ${subject || "(à préciser)"}.\n\nMontant : ${formatEuros(totals.total_ttc)} TTC.\n\nMerci de votre confiance.\n\n${issuerName} — ${issuerLegalName}`
    );
    window.open(`mailto:${recipientEmail}?subject=${subj}&body=${body}`);
    toast.info("Pense à attacher le PDF (Export PDF) avant d'envoyer.");
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap no-print">
        <Link href="/dashboard/facturation" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Retour aux factures
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={status === "paid" ? "success" : status === "sent" ? "primary" : "muted"}>
            {STATUS_LABEL[status]}
          </Badge>
          {mode === "edit" && (
            <>
              <Button variant="outline" onClick={handlePrint} type="button">
                <Printer className="w-4 h-4" />
                Export PDF
              </Button>
              {status === "draft" && (
                <Button variant="outline" onClick={() => persist("sent")} disabled={saving} type="button">
                  <Send className="w-4 h-4" />
                  Marquer envoyée
                </Button>
              )}
              {status !== "paid" && (
                <Button variant="outline" onClick={() => persist("paid")} disabled={saving} type="button">
                  <CheckCircle2 className="w-4 h-4" />
                  Marquer payée
                </Button>
              )}
              <Button variant="outline" onClick={handleSendEmail} type="button">
                <Send className="w-4 h-4" />
                Envoyer par email
              </Button>
            </>
          )}
          <Button onClick={() => persist()} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Bloc 1 : En-tête + parties */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-4">Identité de la facture</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Numéro *</Label>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="FAC-2026-0001" required />
              </div>
              <div>
                <Label className="mb-1.5 block">Statut</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as InvoiceStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Date d&apos;émission</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Date d&apos;échéance</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Sujet (interne)</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Campagne Puma — Avril 2026" />
              </div>
              <div>
                <Label className="mb-1.5 block">TVA (%)</Label>
                <Input type="number" min={0} max={100} step={0.01} value={vatRate} onChange={(e) => setVatRate(Number(e.target.value) || 0)} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
              <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold">Facturé à</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Marque (préremplissage automatique)</Label>
                <Select value={brandId} onValueChange={applyBrand}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Saisie manuelle —</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Nom *</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
              </div>
              <div>
                <Label className="mb-1.5 block">Forme juridique</Label>
                <Input value={recipientLegalName} onChange={(e) => setRecipientLegalName(e.target.value)} placeholder="SAS / SARL" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Adresse</Label>
                <Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="12 rue X, 75001 Paris" />
              </div>
              <div>
                <Label className="mb-1.5 block">SIRET</Label>
                <Input value={recipientSiret} onChange={(e) => setRecipientSiret(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">TVA intracom</Label>
                <Input value={recipientVat} onChange={(e) => setRecipientVat(e.target.value)} placeholder="FR..." />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Email du destinataire (pour l&apos;envoi)</Label>
                <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-4">Prestations</div>
            {description && (
              <div className="mb-3">
                <Label className="mb-1.5 block">Description globale (optionnel)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
            )}
            {!description && (
              <Button variant="ghost" type="button" onClick={() => setDescription(" ")} className="mb-3">
                + Ajouter une description globale
              </Button>
            )}

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_120px_120px_auto] gap-2 items-end">
                  <div>
                    {idx === 0 && <Label className="mb-1.5 block">Désignation</Label>}
                    <Input
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      placeholder="Story Instagram + tag marque"
                    />
                  </div>
                  <div>
                    {idx === 0 && <Label className="mb-1.5 block">Qté</Label>}
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    {idx === 0 && <Label className="mb-1.5 block">PU HT</Label>}
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={it.unit_price_ht}
                      onChange={(e) => updateItem(idx, { unit_price_ht: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    {idx === 0 && <Label className="mb-1.5 block">Total HT</Label>}
                    <div className="h-11 flex items-center px-4 rounded-full bg-white/[0.02] border border-white/5 text-sm font-semibold">
                      {formatEuros((Number(it.quantity) || 0) * (Number(it.unit_price_ht) || 0))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="h-11 w-11 rounded-full hover:bg-red-500/15 text-white/40 hover:text-red-300 transition-colors inline-flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" type="button" onClick={addItem}>
                <Plus className="w-4 h-4" />
                Ajouter une ligne
              </Button>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-4">Conditions & notes</div>
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block">Conditions de paiement</Label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Notes (internes / mentions légales)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="TVA non applicable — art. 293 B du CGI" />
              </div>
            </div>
          </Card>
        </div>

        {/* Bloc 2 : Récap + émetteur */}
        <div className="space-y-6">
          <Card>
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-4">Totaux</div>
            <div className="space-y-3">
              <Row label="Total HT" value={formatEuros(totals.total_ht)} />
              <Row label={`TVA (${vatRate}%)`} value={formatEuros(totals.vat_amount)} />
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 font-semibold">Total TTC</span>
                <span className="text-3xl font-extrabold gradient-text">{formatEuros(totals.total_ttc)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] uppercase tracking-widest text-orange-300 font-bold mb-4">Émetteur</div>
            <p className="text-xs text-white/40 mb-3">Pré-rempli avec les infos Mood Agency / Kainova Group — modifiable.</p>
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block">Nom commercial</Label>
                <Input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Raison sociale</Label>
                <Input value={issuerLegalName} onChange={(e) => setIssuerLegalName(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Adresse</Label>
                <Input value={issuerAddress} onChange={(e) => setIssuerAddress(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">SIRET</Label>
                <Input value={issuerSiret} onChange={(e) => setIssuerSiret(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">TVA intracom</Label>
                <Input value={issuerVat} onChange={(e) => setIssuerVat(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <Input type="email" value={issuerEmail} onChange={(e) => setIssuerEmail(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">IBAN (paiement)</Label>
                <Input value={issuerIban} onChange={(e) => setIssuerIban(e.target.value)} placeholder="FR76 ..." />
              </div>
              <div>
                <Label className="mb-1.5 block">BIC</Label>
                <Input value={issuerBic} onChange={(e) => setIssuerBic(e.target.value)} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Vue d'impression — affichée seulement en print, sinon hidden */}
      <InvoicePrint
        number={number}
        status={status}
        issueDate={issueDate}
        dueDate={dueDate}
        issuer={{
          name: issuerName,
          legal_name: issuerLegalName,
          address: issuerAddress,
          siret: issuerSiret,
          vat: issuerVat,
          email: issuerEmail,
          iban: issuerIban || null,
          bic: issuerBic || null,
        }}
        recipient={{
          name: recipientName,
          legal_name: recipientLegalName || null,
          address: recipientAddress || null,
          siret: recipientSiret || null,
          vat: recipientVat || null,
          email: recipientEmail || null,
        }}
        subject={subject}
        description={description}
        items={items.filter((it) => it.description.trim()).map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 0,
          unit_price_ht: Number(it.unit_price_ht) || 0,
        }))}
        vatRate={Number(vatRate) || 0}
        totals={totals}
        notes={notes}
        paymentTerms={paymentTerms}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
