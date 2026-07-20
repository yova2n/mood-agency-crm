"use client";

import { formatEuros } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/database.types";

type Issuer = {
  name: string;
  legal_name: string;
  address: string;
  siret: string;
  vat: string;
  email: string;
  iban: string | null;
  bic: string | null;
};

type Recipient = {
  name: string;
  legal_name: string | null;
  address: string | null;
  siret: string | null;
  vat: string | null;
  email: string | null;
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

export function InvoicePrint({
  number,
  status,
  issueDate,
  dueDate,
  issuer,
  recipient,
  subject,
  description,
  items,
  vatRate,
  totals,
  notes,
  paymentTerms,
  phone = "07 49 64 48 19",
  signatory = "Yovann Pigenet",
  signatoryRole = "Représentant légal",
}: {
  number: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  issuer: Issuer;
  recipient: Recipient;
  subject: string;
  description: string;
  items: Array<{ description: string; quantity: number; unit_price_ht: number }>;
  vatRate: number;
  totals: { total_ht: number; vat_amount: number; total_ttc: number };
  notes: string;
  paymentTerms: string;
  phone?: string;
  signatory?: string;
  signatoryRole?: string;
}) {
  return (
    <div className="invoice-print">
      <style>{`
        @media screen {
          .invoice-print { display: none; }
        }
        @media print {
          @page { size: A4; margin: 18mm 14mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .invoice-print, .invoice-print * { visibility: visible !important; }
          .invoice-print {
            position: absolute; top: 0; left: 0; right: 0;
            background: #fff; color: #0a0a0a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="ip-page">
        {/* En-tête */}
        <header className="ip-header">
          <div>
            <div className="ip-brand">{issuer.name}</div>
            <div className="ip-brand-sub">{issuer.legal_name}</div>
          </div>
          <div className="ip-meta">
            <div className={`ip-status ip-status--${status}`}>{STATUS_LABEL[status]}</div>
            <div className="ip-title">FACTURE</div>
            <div className="ip-number">{number}</div>
            <div className="ip-date">Émise le {new Date(issueDate).toLocaleDateString("fr-FR")}</div>
            {dueDate && <div className="ip-date">Échéance : {new Date(dueDate).toLocaleDateString("fr-FR")}</div>}
          </div>
        </header>

        {/* Parties */}
        <section className="ip-parties">
          <div>
            <div className="ip-section-label">Émetteur</div>
            <div className="ip-party-name">{issuer.name}</div>
            <div className="ip-party-line">{issuer.legal_name}</div>
            <div className="ip-party-line">{issuer.address}</div>
            <div className="ip-party-line">SIRET : {issuer.siret}</div>
            <div className="ip-party-line">TVA intracom : {issuer.vat}</div>
            {phone && <div className="ip-party-line">Tél : {phone}</div>}
            <div className="ip-party-line ip-link">{issuer.email}</div>
          </div>
          <div>
            <div className="ip-section-label">Facturé à</div>
            <div className="ip-party-name">{recipient.name}</div>
            {recipient.legal_name && <div className="ip-party-line">{recipient.legal_name}</div>}
            {recipient.address && <div className="ip-party-line">{recipient.address}</div>}
            {recipient.siret && <div className="ip-party-line">SIRET : {recipient.siret}</div>}
            {recipient.vat && <div className="ip-party-line">TVA intracom : {recipient.vat}</div>}
            {recipient.email && <div className="ip-party-line ip-link">{recipient.email}</div>}
          </div>
        </section>

        {/* Sujet + description */}
        {(subject || description) && (
          <section className="ip-subject">
            {subject && <h2 className="ip-subject-title">{subject}</h2>}
            {description && <p className="ip-subject-desc">{description}</p>}
          </section>
        )}

        {/* Table prestations */}
        <table className="ip-table">
          <thead>
            <tr>
              <th>Prestation</th>
              <th className="ip-num">Qté</th>
              <th className="ip-num">Prix unit.</th>
              <th className="ip-num">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.description}</td>
                <td className="ip-num">{it.quantity}</td>
                <td className="ip-num">{formatEuros(it.unit_price_ht)}</td>
                <td className="ip-num"><strong>{formatEuros(it.quantity * it.unit_price_ht)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <section className="ip-totals">
          <div className="ip-totals-grid">
            <div>Total HT</div>
            <div className="ip-num">{formatEuros(totals.total_ht)}</div>
            <div>TVA ({vatRate}%)</div>
            <div className="ip-num">{formatEuros(totals.vat_amount)}</div>
            <div className="ip-total-final">Total TTC</div>
            <div className="ip-total-final ip-num">{formatEuros(totals.total_ttc)}</div>
          </div>
        </section>

        {/* Conditions */}
        <section className="ip-footer">
          {paymentTerms && <p><strong>Conditions :</strong> {paymentTerms}</p>}
          {(issuer.iban || issuer.bic) && (
            <p>
              {issuer.iban && <><strong>IBAN :</strong> {issuer.iban} &nbsp;·&nbsp; </>}
              {issuer.bic && <><strong>BIC :</strong> {issuer.bic}</>}
            </p>
          )}
          {notes && <p className="ip-notes">{notes}</p>}
        </section>

        {/* Signature & cachet — apposés sur chaque facture Kainova Group */}
        <section className="ip-sign">
          <div className="ip-sign-place">
            Fait à Paris, le {new Date(issueDate).toLocaleDateString("fr-FR")}
          </div>
          <div className="ip-sign-block">
            <div className="ip-sign-caption">Signature &amp; cachet</div>
            <div className="ip-sign-inner">
              <div className="ip-stamp" aria-hidden>
                <div className="ip-stamp-name">{issuer.legal_name}</div>
                <div className="ip-stamp-line">{issuer.address}</div>
                {phone && <div className="ip-stamp-line">Tél : {phone}</div>}
                <div className="ip-stamp-line">SIRET : {issuer.siret}</div>
              </div>
              <div className="ip-sign-name">{signatory}</div>
            </div>
            <div className="ip-sign-role">
              {signatory} — {signatoryRole}
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .ip-page {
          color: #0a0a0a;
          line-height: 1.5;
          font-size: 11px;
        }
        .ip-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 18px;
          border-bottom: 2px solid #1a1a1a;
          margin-bottom: 24px;
        }
        .ip-brand {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .ip-brand-sub {
          font-size: 10px;
          color: #6b7280;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 4px;
          font-weight: 600;
        }
        .ip-meta {
          text-align: right;
        }
        .ip-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .ip-status--paid { background: #dcfce7; color: #166534; }
        .ip-status--sent { background: #dbeafe; color: #1e40af; }
        .ip-status--draft { background: #f3f4f6; color: #374151; }
        .ip-status--cancelled { background: #fee2e2; color: #991b1b; }
        .ip-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .ip-number {
          color: #ea580c;
          font-weight: 700;
          margin-top: 2px;
          font-size: 13px;
        }
        .ip-date {
          color: #6b7280;
          font-size: 10px;
          margin-top: 2px;
        }
        .ip-parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 28px;
        }
        .ip-section-label {
          font-size: 9px;
          color: #6b7280;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .ip-party-name {
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 2px;
        }
        .ip-party-line {
          color: #374151;
          font-size: 11px;
          margin-top: 1px;
        }
        .ip-link { color: #6b7280; }
        .ip-subject {
          margin-bottom: 18px;
        }
        .ip-subject-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 6px 0;
        }
        .ip-subject-desc {
          color: #374151;
          font-size: 11px;
          margin: 0;
        }
        .ip-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
        }
        .ip-table th {
          text-align: left;
          font-size: 9px;
          color: #6b7280;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .ip-table td {
          padding: 10px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 11px;
          vertical-align: top;
        }
        .ip-num { text-align: right; }
        .ip-totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        }
        .ip-totals-grid {
          display: grid;
          grid-template-columns: auto 120px;
          gap: 6px 24px;
          min-width: 280px;
          font-size: 11px;
        }
        .ip-total-final {
          font-size: 16px;
          font-weight: 800;
          color: #ea580c;
          padding-top: 6px;
          border-top: 1px solid #1a1a1a;
        }
        .ip-footer {
          font-size: 10px;
          color: #6b7280;
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .ip-footer p {
          margin: 4px 0;
        }
        .ip-notes {
          margin-top: 12px !important;
          font-style: italic;
        }

        /* ===== Signature & cachet ===== */
        .ip-sign {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 32px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .ip-sign-place {
          font-size: 10px;
          color: #374151;
          font-style: italic;
        }
        .ip-sign-block {
          text-align: center;
          min-width: 270px;
        }
        .ip-sign-caption {
          font-size: 9px;
          color: #6b7280;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .ip-sign-inner {
          position: relative;
          height: 118px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ip-stamp {
          position: relative;
          display: inline-block;
          border: 2.5px solid #1e40af;
          outline: 1px solid #1e40af;
          outline-offset: 3px;
          border-radius: 12px;
          padding: 9px 20px;
          color: #1e40af;
          transform: rotate(-7deg);
          opacity: 0.82;
          background: transparent;
        }
        .ip-stamp-name {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .ip-stamp-line {
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.02em;
          line-height: 1.55;
        }
        .ip-sign-name {
          position: absolute;
          right: 6px;
          bottom: 4px;
          font-family: "Snell Roundhand", "Segoe Script", "Bradley Hand", "Brush Script MT", cursive;
          font-size: 32px;
          line-height: 1;
          color: #111827;
          transform: rotate(-5deg);
        }
        .ip-sign-role {
          font-size: 9px;
          color: #6b7280;
          margin-top: 6px;
          border-top: 1px solid #e5e7eb;
          padding-top: 6px;
        }
      `}</style>
    </div>
  );
}
