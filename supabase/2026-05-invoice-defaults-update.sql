-- =====================================================================
-- MOOD AGENCY CRM — Mise à jour des defaults de facturation
-- (IBAN + BIC Qonto Kainova Group, conditions de paiement)
-- =====================================================================

alter table public.invoices
  alter column issuer_iban set default 'FR76 1695 8000 0158 2552 1837 272';

alter table public.invoices
  alter column issuer_bic set default 'QNTOFRP1XXX';

alter table public.invoices
  alter column payment_terms set default
  'Paiement à 30 jours par virement bancaire. Pour les virements internationaux, BIC intermédiaire : TRWIBEB3XXX.';
