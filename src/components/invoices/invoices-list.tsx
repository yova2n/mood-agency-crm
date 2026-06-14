"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, FileText, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatEuros } from "@/lib/utils";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/lib/database.types";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

const STATUS_BADGE: Record<InvoiceStatus, "muted" | "primary" | "success" | "danger"> = {
  draft: "muted",
  sent: "primary",
  paid: "success",
  cancelled: "danger",
};

export function InvoicesList({
  invoices,
  items,
}: {
  invoices: Invoice[];
  items: InvoiceItem[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Recalcule le total HT effectif depuis les items pour chaque facture
  const totalByInvoice = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      m.set(it.invoice_id, (m.get(it.invoice_id) ?? 0) + Number(it.total_ht || 0));
    }
    return m;
  }, [items]);

  const kpis = useMemo(() => {
    let total = invoices.length;
    let sent = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    for (const inv of invoices) {
      const amount = totalByInvoice.get(inv.id) ?? Number(inv.total_ht);
      if (inv.status === "sent") {
        sent++;
        pendingAmount += amount;
      } else if (inv.status === "paid") {
        paidAmount += amount;
      }
    }
    return { total, sent, pendingAmount, paidAmount };
  }, [invoices, totalByInvoice]);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.number.toLowerCase().includes(q) ||
        i.recipient_name.toLowerCase().includes(q) ||
        i.subject?.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  async function handleDelete(inv: Invoice) {
    if (!confirm(`Supprimer la facture ${inv.number} ?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("invoices").delete().eq("id", inv.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Facture supprimée");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">Total émises</div>
          <div className="text-3xl font-extrabold mt-1">{kpis.total}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">Envoyées</div>
          <div className="text-3xl font-extrabold mt-1 text-orange-300">{kpis.sent}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">En attente</div>
          <div className="text-3xl font-extrabold mt-1 gradient-text">{formatEuros(kpis.pendingAmount)}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">Payées</div>
          <div className="text-3xl font-extrabold mt-1 text-green-300">{formatEuros(kpis.paidAmount)}</div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <Input
            placeholder="Rechercher numéro, client, sujet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <Link href="/dashboard/facturation/nouvelle">
          <Button>
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-white/60">
            {invoices.length === 0
              ? "Aucune facture pour l'instant. Crée-en une avec le bouton ci-dessus."
              : "Aucune facture ne correspond à ta recherche."}
          </p>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.map((inv, i) => {
              const amount = totalByInvoice.get(inv.id) ?? Number(inv.total_ht);
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-orange-300" />
                  </div>

                  <Link
                    href={`/dashboard/facturation/${inv.id}`}
                    className="flex-1 min-w-0 flex items-center gap-2 flex-wrap"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold truncate">
                          {inv.subject || inv.recipient_name}
                        </span>
                        <Badge variant={STATUS_BADGE[inv.status]} className="text-[10px]">
                          {STATUS_LABEL[inv.status]}
                        </Badge>
                      </div>
                      <div className="text-xs text-white/50 truncate">
                        {inv.recipient_name} · {inv.number} · {new Date(inv.issue_date).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </Link>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold">{formatEuros(amount)}</div>
                    {inv.due_date && (
                      <div className="text-[10px] text-white/40">
                        Échéance {new Date(inv.due_date).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(inv)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
