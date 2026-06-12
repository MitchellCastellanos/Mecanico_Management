# Matriz de correo — Garage Carlos A Inc.

Dominio: **garagecarlosainc.ca** (IONOS) + envío (Resend).

## Canales activos

| Canal | Dispara | FROM (prioridad) | Reply-To | TO | Motor |
|-------|---------|------------------|----------|-----|-------|
| **INVOICE** | Enviar / reenviar factura | `shop.infoEmail` → `EMAIL_FROM_INVOICES` → `shop.email` → `EMAIL_FROM` | `infoEmail` → `email` | Email del cliente | Resend |
| **REMINDER** | Recordatorio de servicio (cron / manual) | `shop.infoEmail` → `EMAIL_FROM_REMINDERS` → `shop.email` → `EMAIL_FROM` | `infoEmail` → `email` | Email del cliente | Resend |
| **ACCOUNTING** | Subida de documento contable | `shop.infoEmail` → `EMAIL_FROM_ACCOUNTING` → `shop.email` → `EMAIL_FROM` | `infoEmail` → `email` | `ACCOUNTANT_EMAIL` (env) | Resend |

## Canales preparados (futuro)

| Canal | Uso previsto | FROM | Reply-To | Motor |
|-------|--------------|------|----------|-------|
| **WEB_CONTACT** | Formulario del website | `infoEmail` → `EMAIL_FROM_WEB` | `infoEmail` | Resend |
| **NEWSLETTER** | Campañas masivas | `newsletterEmail` | `newsletterEmail` | Brevo / Mailchimp (no Resend) |
| **PROVIDERS** | Órdenes a proveedores | `providersEmail` | `providersEmail` | Resend (fase 2) |

## Buzones recomendados en IONOS

| Buzón | Rol |
|-------|-----|
| `info@` | Facturas, cotizaciones, contabilidad, consultas, recordatorios, web — único remitente al cliente |
| `billing@` | Sin uso (legacy) |
| `providers@` | Proveedores (humano / futuro automático) |
| `newsletter@` | Marketing |
| `carlos@` o personal | Dueño — puede ser alias de los anteriores |

## Configuración

### Variables de entorno (fallback global / plataforma)

```env
RESEND_API_KEY=
EMAIL_FROM="Garage Carlos A <info@garagecarlosainc.ca>"
EMAIL_FROM_INVOICES="Garage Carlos A <info@garagecarlosainc.ca>"
EMAIL_FROM_REMINDERS="Garage Carlos A <info@garagecarlosainc.ca>"
EMAIL_FROM_ACCOUNTING="Garage Carlos A <info@garagecarlosainc.ca>"
EMAIL_FROM_WEB="Garage Carlos A <info@garagecarlosainc.ca>"
ACCOUNTANT_EMAIL=
NEXT_PUBLIC_APP_URL=https://garagecarlosainc.ca
NEXTAUTH_URL=https://garagecarlosainc.ca
```

### Por taller (Configuración → Correos del taller)

- **Email principal** — contacto general y fallback de reply-to
- **info@** — facturas, cotizaciones, avisos a contadora, recordatorios y futuro formulario web
- **billing@** — sin uso (legacy)
- **providers@** / **newsletter@** — reservados para fases siguientes

## DNS (IONOS)

1. **MX** → IONOS (recibir correo)
2. **SPF** → incluir IONOS + Resend
3. **DKIM** → registros de IONOS y de Resend
4. **DMARC** → política recomendada

Resend verifica el dominio; los registros se pegan en el panel DNS de IONOS.

## Lectura de correo

La app **no lee buzones**. Carlos usa Outlook, Gmail o webmail IONOS. Las respuestas de clientes llegan al buzón configurado en Reply-To (`info@`).
