-- Migración incremental (idempotente) — una sentencia por bloque (; al final)
-- El enum se crea en el script/route si aún no existe (evita DO $$ con split por ;)

CREATE SCHEMA IF NOT EXISTS mecanico;

ALTER TABLE mecanico."Client" ALTER COLUMN "lastName" DROP NOT NULL;

ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "language" mecanico."InvoiceLanguage" NOT NULL DEFAULT 'ES';

ALTER TABLE mecanico."Invoice" ALTER COLUMN "taxRate" TYPE DECIMAL(6, 5);

-- Estatus inicial DRAFT → PENDING (los borradores son cotizaciones, no facturas).
-- El rename del valor del enum se ejecuta en TS (ensureInvoicePendingStatus) por ser
-- no idempotente; aquí solo realineamos el default de la columna.
ALTER TABLE mecanico."Invoice" ALTER COLUMN "status" SET DEFAULT 'PENDING';
