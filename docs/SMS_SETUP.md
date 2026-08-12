# SMS de citas (Twilio)

El teléfono es ahora el canal **principal** de notificaciones de citas; el email queda como
canal **secundario** (mejor esfuerzo, solo si el cliente lo dejó). Ambos se intentan de forma
independiente — si uno falla, el otro igual se envía.

## Qué dispara un SMS

| Evento | Tipo | Incluye link de editar/cancelar |
|--------|------|----------------------------------|
| Reserva creada (web pública o botón "Confirmar" en `/appointments`) | `confirmation` | Sí |
| Cron de recordatorios (`appointmentReminderHours` antes de la cita) | `reminder` | Sí |
| El taller edita la cita desde `/appointments/{id}/edit` | `update` | Sí |
| El cliente edita su cita desde `/book/{slug}/manage/{token}` | `update` | Sí |
| Cita cancelada (admin o el propio cliente) | `cancellation` | No |

El link apunta a `/book/{slug}/manage/{token}` — la misma página de auto-gestión que ya usan
los emails. Cada cita tiene su propio `manageToken`; si una cita antigua no tiene uno, se genera
la primera vez que se le envía una notificación.

## Idioma

Cada `Client` tiene un campo `language` (ES / EN / FR — mismo enum que usan facturas y
cotizaciones). El SMS y el email de la cita se generan en ese idioma:

- **Español** por defecto para clientes creados desde el panel admin.
- El cliente elige su idioma en el formulario de reserva pública (`/book/{slug}`).
- Se puede cambiar en cualquier momento desde **Clientes → Editar**.

Las plantillas viven en `src/lib/sms.ts` (SMS) y `src/emails/AppointmentEmail.tsx` (email) —
ambas cubren `confirmation`, `reminder` y `cancellation` en los tres idiomas.

## 1. Crear cuenta Twilio

1. [twilio.com](https://www.twilio.com) → crear cuenta
2. Comprar un número con capacidad SMS en Canadá o EE.UU. (Console → Phone Numbers → Buy a number)
3. Copiar desde el Console:
   - **Account SID**
   - **Auth Token**
   - El **número comprado** (formato E.164, ej. `+15145550100`)

## 2. Variables de entorno

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+15145550100
```

Agregarlas en `.env` local y en Vercel (Settings → Environment Variables, marcar **Runtime**;
no se necesitan en build).

## 3. Activar por taller

**Configuración → Citas — notificaciones (SMS y email)**:

- **Enviar notificaciones de citas por SMS** — canal principal, requiere Twilio configurado
- **Enviar también por email (secundario)** — sigue funcionando igual que antes (Resend)

Ambos toggles están activos por defecto. Si Twilio no está configurado, el envío de SMS falla
silenciosamente (se loguea el error) y el email sigue intentándose si el cliente tiene uno.

## 4. Formato de teléfono

El sistema normaliza automáticamente a E.164 asumiendo Norteamérica (+1) cuando el cliente
ingresa un número de 10 dígitos sin código de país (`src/lib/sms.ts` → `toE164`). Números que no
se puedan normalizar hacen fallar solo el envío de SMS, sin afectar el resto de la operación.

## 5. Verificar que funciona

1. Configura las tres variables y redeploya
2. Crea una cita de prueba con tu propio teléfono (reserva pública o panel admin)
3. Envía la confirmación (automática en reserva pública, o botón "Confirmar" en `/appointments`)
4. Debes recibir un SMS con el link `/book/{slug}/manage/{token}`

Si no llega, revisa los logs de Vercel — los errores de Twilio se loguean con el prefijo
`[appointment-sms]` sin interrumpir el resto del flujo (la cita se crea igual).

## 6. Costo

Twilio cobra por SMS enviado (varía por país/segmento). No hay límite configurado en la app —
si se necesita un tope de gasto, configurarlo directamente en el dashboard de Twilio.
