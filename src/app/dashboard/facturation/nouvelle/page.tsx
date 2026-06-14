import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import type { Brand } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: brands } = await supabase.from("brands").select("*").order("name");

  // Génère un numéro de facture suggéré : FAC-YYYY-XXXX
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  const suggestedNumber = `FAC-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;

  return (
    <div className="space-y-8">
      <DashboardHeader title="Nouvelle facture" subtitle="Renseigne le destinataire et les prestations." />
      <InvoiceForm
        mode="create"
        brands={(brands ?? []) as Brand[]}
        suggestedNumber={suggestedNumber}
      />
    </div>
  );
}
