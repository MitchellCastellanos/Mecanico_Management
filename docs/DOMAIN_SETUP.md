# Checklist: dominio propio (IONOS + Resend + Vercel)

Usa esta lista cuando compres y configures el dominio del taller (ej. `tallercarlos.com`).

## 0. Base de datos — migraciones automáticas

Las migraciones SQL se aplican **automáticamente en cada deploy de Vercel** (ver [`docs/MIGRATIONS.md`](./MIGRATIONS.md)).

### Requisito obligatorio en Vercel

Variable `DATABASE_URL` → marcar **Build** + **Production** (Settings → Environment Variables).

### Verificar que la DB está al día

```bash
curl https://mecanico-management.vercel.app/api/version
```

Busca `"schema_ok": true`. Si es `false`, ejecuta migración manual:

```bash
curl -X POST "https://mecanico-management.vercel.app/api/setup/migrate" \
  -H "x-setup-secret: TU_CRON_SECRET"
```

- [ ] `DATABASE_URL` disponible en build de Vercel
- [ ] `/api/version` muestra `schema_ok: true` tras deploy
- [ ] `/dashboard` sin errores Prisma en logs

Guía detallada: [`docs/MIGRATIONS.md`](./MIGRATIONS.md) · Citas web: [`docs/BOOKING.md`](./BOOKING.md)

## 1. IONOS — DNS y buzones

- [ ] Comprar/registrar el dominio en IONOS
- [ ] Crear buzones (o alias) según la matriz de correo:
  - `billing@` — facturas y cotizaciones
  - `info@` — recordatorios, citas y contacto web
  - (Opcional) `providers@`, `newsletter@` para uso futuro
- [ ] En **Configuración → Datos del taller**, completar los buzones del dominio
- [ ] Verificar que puedes enviar/recibir desde cada buzón desde el webmail de IONOS

## 2. Resend — dominio verificado

- [ ] Entrar a [Resend](https://resend.com) → **Domains** → **Add domain**
- [ ] Añadir el dominio del taller (ej. `tallercarlos.com`)
- [ ] Copiar los registros DNS que Resend indica (SPF, DKIM, opcional DMARC)
- [ ] En IONOS → **DNS**, crear esos registros TXT/CNAME/MX según Resend
- [ ] Esperar verificación en Resend (puede tardar hasta 48 h, normalmente minutos)
- [ ] Confirmar estado **Verified** en Resend antes de enviar desde producción

## 3. Vercel — variables de entorno

En el proyecto de Vercel → **Settings → Environment Variables** (Production + Preview si aplica):

| Variable | Ejemplo | Uso |
|----------|---------|-----|
| `EMAIL_FROM_INVOICES` | `"Taller Carlos" <billing@tallercarlos.com>` | Facturas y cotizaciones |
| `EMAIL_FROM_REMINDERS` | `"Taller Carlos" <info@tallercarlos.com>` | Recordatorios de servicio y citas |
| `EMAIL_FROM_ACCOUNTING` | `"Taller Carlos" <billing@tallercarlos.com>` | Avisos a contabilidad |
| `EMAIL_FROM` | Fallback general | Solo si no hay buzón específico |
| `RESEND_API_KEY` | `re_...` | API key de Resend |
| `CRON_SECRET` | string aleatorio largo | Protege `/api/webhooks/cron` |
| `ACCOUNTANT_EMAIL` | email de la contadora | Canal contabilidad |

- [ ] Redeploy después de cambiar variables (`Deployments → Redeploy`)
- [ ] Probar envío de factura/cotización desde la app
- [ ] Probar confirmación de cita y esperar cron de recordatorio (o invocar cron manualmente con `Authorization: Bearer $CRON_SECRET`)

## 4. Comprobaciones finales

- [ ] En **Configuración**, revisar la vista previa de enrutamiento de correo (todos los canales activos en verde)
- [ ] Enviar email de prueba al cliente de prueba; revisar bandeja y spam
- [ ] Confirmar que **Reply-To** apunta al buzón correcto del taller
- [ ] Documentar credenciales IONOS y Resend en gestor de contraseñas del taller (no en el repo)

## Notas

- Si el taller aún no tiene dominio, Resend permite enviar desde dominio de prueba de Resend solo a direcciones verificadas — útil en desarrollo, no en producción.
- Los buzones en la ficha del taller tienen prioridad sobre `EMAIL_FROM_*`; las variables de Vercel son fallback cuando el buzón no está configurado en la app.
