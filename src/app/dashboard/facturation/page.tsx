import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { InvoicesList } from "@/components/invoices/invoices-list";
import { AlertTriangle } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let invoices: Invoice[] = [];
  let items: InvoiceItem[] = [];
  let errorMessages: string[] = [];

  try {
    const supabase = await createClient();

    const invRes = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (invRes.error) {
      errorMessages.push(
        `Table invoices : ${invRes.error.message}. ` +
          `As-tu exécuté supabase/2026-05-campaigns-and-invoices.sql sur le bon projet ?`
      );
    } else {
      invoices = (invRes.data ?? []) as Invoice[];
    }

    const itemsRes = await supabase.from("invoice_items").select("*");
    if (itemsRes.error) {
      errorMessages.push(`Table invoice_items : ${itemsRes.error.message}`);
    } else {
      items = (itemsRes.data ?? []) as InvoiceItem[];
    }
  } catch (err) {
    errorMessages.push(err instanceof Error ? err.message : "Erreur inconnue");
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Facturation"
        subtitle="Crée et envoie les factures Mood Agency. Statuts : brouillon, envoyée, payée."
      />

      {errorMessages.length > 0 && (
        <div className="rounded-3xl bg-orange-500/10 border border-orange-500/30 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-orange-200 mb-1">Configuration Supabase incomplète</div>
            <ul className="text-sm text-white/70 space-y-1">
              {errorMessages.map((m, i) => (
                <li key={i}>• {m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <InvoicesList invoices={invoices} items={items} />
    </div>
  );
}
