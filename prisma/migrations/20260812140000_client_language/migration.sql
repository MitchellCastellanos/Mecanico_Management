-- Idioma preferido del cliente (ES/EN/FR) — determina el idioma de SMS y emails de citas
ALTER TABLE "mecanico"."Client" ADD COLUMN "language" "mecanico"."InvoiceLanguage" NOT NULL DEFAULT 'ES';
