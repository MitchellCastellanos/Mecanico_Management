# Matriz de correo — Mecanico Management

Dominio del cliente (IONOS) + envío automático (Resend). Los buzones IONOS son para **leer y responder**; Resend es para **mandar desde la app/web**.

## Canales activos

| Canal | Dispara | FROM (prioridad) | Reply-To | TO | Motor |
|-------|---------|------------------|----------|-----|-------|
| **INVOICE** | Enviar / reenviar factura | `shop.billingEmail` → `EMAIL_FROM_INVOICES` → `shop.email` → `EMAIL_FROM` | `billingEmail` → `email` | Email del cliente | Resend |
| **REMINDER** | Recordatorio de servicio (cron / manual) | `shop.infoEmail` → `EMAIL_FROM_REMINDERS` → `shop.email` → `EMAIL_FROM` | `infoEmail` → `email` | Email del cliente | Resend |
| **ACCOUNTING** | Subida de documento contable | `shop.billingEmail` → `EMAIL_FROM_ACCOUNTING` → `shop.email` → `EMAIL_FROM` | `billingEmail` → `email` | `ACCOUNTANT_EMAIL` (env) | Resend |

## Canales preparados (futuro)

| Canal | Uso previsto | FROM | Reply-To | Motor |
|-------|--------------|------|----------|-------|
| **WEB_CONTACT** | Formulario del website | `infoEmail` → `EMAIL_FROM_WEB` | `infoEmail` | Resend |
| **NEWSLETTER** | Campañas masivas | `newsletterEmail` | `newsletterEmail` | Brevo / Mailchimp (no Resend) |
| **PROVIDERS** | Órdenes a proveedores | `providersEmail` | `providersEmail` | Resend (fase 2) |

## Buzones recomendados en IONOS

| Buzón | Rol |
|-------|-----|
| `billing@` | Facturas, contabilidad, cobros |
| `info@` | Consultas, recordatorios, web |
| `providers@` | Proveedores (humano / futuro automático) |
| `newsletter@` | Marketing |
| `carlos@` o personal | Dueño — puede ser alias de los anteriores |

## Configuración

### Variables de entorno (fallback global / plataforma)

```env
RESEND_API_KEY=
EMAIL_FROM="Taller Demo <noreply@tudominio.com>"
EMAIL_FROM_INVOICES=
EMAIL_FROM_REMINDERS=
EMAIL_FROM_ACCOUNTING=
EMAIL_FROM_WEB=
ACCOUNTANT_EMAIL=
NEXT_PUBLIC_APP_URL=
```

### Por taller (Configuración → Correos del taller)

- **Email principal** — contacto general y fallback de reply-to
- **billing@** — facturas y avisos a contadora
- **info@** — recordatorios y futuro formulario web
- **providers@** / **newsletter@** — reservados para fases siguientes

## DNS (IONOS)

1. **MX** → IONOS (recibir correo)
2. **SPF** → incluir IONOS + Resend
3. **DKIM** → registros de IONOS y de Resend
4. **DMARC** → política recomendada

Resend verifica el dominio; los registros se pegan en el panel DNS de IONOS.

## Lectura de correo

La app **no lee buzones**. Carlos usa Outlook, Gmail o webmail IONOS. Las respuestas de clientes llegan al buzón configurado en Reply-To (`billing@`, `info@`, etc.).
