-- Quotes now carry the same Efectivo/Interno vs Tarjeta/Declarado decision as
-- invoices, decided at quoting time, so it can flow through to the invoice's
-- folio series and tax handling at conversion time.
ALTER TABLE "mecanico"."Quote"
  ADD COLUMN "revenueType" "mecanico"."RevenueType" NOT NULL DEFAULT 'OFFICIAL';
