import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { InvoicesList } from "@/components/invoices/invoices-list";
import type { Invoice, InvoiceItem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: items }] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("invoice_items").select("*"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Facturation"
        subtitle="Crée et envoie les factures Mood Agency. Statuts : brouillon, envoyée, payée."
      />
      <InvoicesList
        invoices={(invoices ?? []) as Invoice[]}
        items={(items ?? []) as InvoiceItem[]}
      />
    </div>
  );
}
