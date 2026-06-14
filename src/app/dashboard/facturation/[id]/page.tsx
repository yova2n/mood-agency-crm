import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import type { Brand, Invoice, InvoiceItem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (!invoice) notFound();

  const [{ data: items }, { data: brands }] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
    supabase.from("brands").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader title={`Facture ${invoice.number}`} subtitle="Modifie, exporte en PDF ou change le statut." />
      <InvoiceForm
        mode="edit"
        invoice={invoice as Invoice}
        initialItems={(items ?? []) as InvoiceItem[]}
        brands={(brands ?? []) as Brand[]}
      />
    </div>
  );
}
