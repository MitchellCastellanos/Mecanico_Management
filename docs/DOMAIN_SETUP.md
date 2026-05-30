# Checklist: dominio propio (IONOS + Resend + Vercel)

Usa esta lista cuando compres y configures el dominio del taller (ej. `tallercarlos.com`).

## 0. Base de datos — migración tras deploy

Tras un deploy que incluya cambios en `prisma/schema.prisma`, la base de Supabase en producción debe actualizarse **antes** de usar la app (si no, verás errores como `Invoice.sentAt does not exist`).

Desde tu máquina (PowerShell o bash), con el valor de `CRON_SECRET` de Vercel Production:

```bash
curl -X POST "https://mecanico-management.vercel.app/api/setup/migrate" \
  -H "x-setup-secret: TU_CRON_SECRET"
```

Respuesta esperada: `{"ok":true,"file":"incremental-migrate","statements":N}`. Es idempotente; puedes ejecutarlo de nuevo sin problema.

- [ ] Ejecutar migración incremental tras cada deploy con cambios de schema
- [ ] Abrir `/dashboard` y confirmar que no hay errores Prisma en los logs de Vercel

Guía detallada de citas y reservas web: [`docs/BOOKING.md`](./BOOKING.md)

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
