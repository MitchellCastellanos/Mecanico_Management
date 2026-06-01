# Migraciones de base de datos (Supabase)

Este proyecto **no usa Flyway**. Usa migraciones SQL idempotentes propias (estilo Flyway) que se aplican automáticamente en cada deploy de Vercel.

## Cómo funciona

1. **`src/lib/incremental-migrate.ts`** — lista de sentencias `IF NOT EXISTS` + enums
2. **`scripts/deploy-migrate.ts`** — corre en el **build de Vercel** (antes de `next build`)
3. **`mecanico.SchemaMigration`** — tabla historial con versión aplicada (ej. `20260530-booking-v1`)
4. **`POST /api/setup/migrate`** — respaldo manual (header `x-setup-secret: CRON_SECRET`)

## Automático en deploy

El script `npm run build` ejecuta:

```
prisma generate → deploy-migrate → next build
```

En Vercel, con `DATABASE_URL` configurada, cada deploy alinea Supabase con `prisma/schema.prisma`. Si la migración falla, **el deploy falla** (evita producción rota).

### Requisito en Vercel

En **Settings → Environment Variables → `DATABASE_URL`**:

- Entorno: **Production** (y Preview si comparten DB)
- Marcar **Build** además de Runtime

Sin esto, Vercel no tendrá `DATABASE_URL` durante el build y la migración no correrá.

## Verificar estado

```bash
curl https://garagecarlosainc.ca/api/version
```

Respuesta:

```json
{
  "schema_version_expected": "20260530-booking-v1",
  "schema_version_db": "20260530-booking-v1",
  "schema_ok": true
}
```

Si `schema_ok` es `false`, la DB está desactualizada.

## Migración manual (emergencia)

```bash
curl -X POST "https://garagecarlosainc.ca/api/setup/migrate" \
  -H "x-setup-secret: TU_CRON_SECRET"
```

## Añadir cambios de schema

1. Editar `prisma/schema.prisma`
2. Añadir sentencias idempotentes a `INCREMENTAL_MIGRATE_STATEMENTS` en `incremental-migrate.ts`
3. **Incrementar `SCHEMA_VERSION`** (ej. `20260601-invoices-v2`)
4. Commit + push → Vercel aplica solo en deploy

## Local

```bash
npx tsx scripts/apply-incremental-migrate.ts
```

Requiere `DATABASE_URL` o `DIRECT_URL` válido en `.env`.

Para omitir migración en build local de Vercel CLI: `SKIP_DB_MIGRATE=1`.
