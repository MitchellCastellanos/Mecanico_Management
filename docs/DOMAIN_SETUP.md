# Dominio `garagecarlosainc.ca` — configuración

Checklist para el taller **Garage Carlos A Inc.** (app + correo + website).

## URLs del sistema

| Uso | URL |
|-----|-----|
| App (login, facturas, citas) | https://garagecarlosainc.ca |
| Reservas en línea | https://garagecarlosainc.ca/book/garage-carlos-a |
| Health / schema | https://garagecarlosainc.ca/api/version |

El host `mecanico-management.vercel.app` redirige automáticamente a `garagecarlosainc.ca`.

## 0. Base de datos — migraciones automáticas

En cada deploy de Vercel se aplican migraciones SQL y se rellenan buzones vacíos del taller.

**Vercel:** `DATABASE_URL` debe estar marcada para **Build** y **Production**.

Verificar:

```bash
curl https://garagecarlosainc.ca/api/version
```

Debe mostrar `"schema_ok": true`.

Manual (emergencia):

```bash
curl -X POST "https://garagecarlosainc.ca/api/setup/migrate" \
  -H "x-setup-secret: TU_CRON_SECRET"
```

Más info: [`docs/MIGRATIONS.md`](./MIGRATIONS.md) · Citas web: [`docs/BOOKING.md`](./BOOKING.md)

## 1. IONOS — DNS y buzones

- [x] Dominio: `garagecarlosainc.ca`
- [ ] Buzones creados:
  - `info@garagecarlosainc.ca` — facturas, cotizaciones, recordatorios, citas y web (único remitente al cliente)
  - (Opcional) `providers@`, `newsletter@`
- [ ] En **Configuración → Datos del taller**, confirmar buzones (el deploy los rellena si estaban vacíos)
- [ ] Probar envío/recibo desde webmail IONOS

## 2. Resend — dominio verificado

- [ ] Resend → **Domains** → `garagecarlosainc.ca` → **Verified**
- [ ] DNS en IONOS: SPF, DKIM (y DMARC recomendado) según Resend

## 3. Vercel — variables de entorno (Production)

| Variable | Valor recomendado |
|----------|-------------------|
| `NEXT_PUBLIC_APP_URL` | `https://garagecarlosainc.ca` |
| `NEXTAUTH_URL` | `https://garagecarlosainc.ca` |
| `AUTH_TRUST_HOST` | `true` |
| `EMAIL_FROM_INVOICES` | `"Garage Carlos A" <info@garagecarlosainc.ca>` |
| `EMAIL_FROM_REMINDERS` | `"Garage Carlos A" <info@garagecarlosainc.ca>` |
| `EMAIL_FROM_ACCOUNTING` | `"Garage Carlos A" <info@garagecarlosainc.ca>` |
| `EMAIL_FROM` | `"Garage Carlos A" <info@garagecarlosainc.ca>` |
| `RESEND_API_KEY` | `re_...` |
| `CRON_SECRET` | string largo |
| `DATABASE_URL` | Supabase (Build + Runtime) |
| `ACCOUNTANT_EMAIL` | email contadora |

- [ ] Dominio `garagecarlosainc.ca` añadido en Vercel → Project → Domains
- [ ] Redeploy tras cambiar variables
- [ ] Probar factura/cotización por email
- [ ] Probar `/book/garage-carlos-a`

## 4. Website del taller

Enlazar reservas desde el sitio:

```html
<a href="https://garagecarlosainc.ca/book/garage-carlos-a">
  Réserver un rendez-vous / Book appointment
</a>
```

## 5. Comprobaciones finales

- [ ] `/api/version` → `schema_ok: true`
- [ ] Login en https://garagecarlosainc.ca
- [ ] Configuración → vista previa de correo en verde
- [ ] Email de prueba no cae en spam
- [ ] Activar **Reservas en línea** en Configuración si aún no está activo

## Código de referencia

Valores por defecto del taller: `src/config/brand.ts`
