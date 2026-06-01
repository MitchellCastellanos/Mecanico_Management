# Citas en línea y reservas desde el website

Guía para configurar mecánicos, horarios de apertura y la página pública de reservas (`/book/…`) que enlazarás desde el sitio web del taller.

## Resumen

| Pieza | Ubicación |
|-------|-----------|
| Crear mecánicos | Configuración → **Equipo del taller** |
| Horario + reservas web | Configuración → **Citas — reservas desde el website** |
| Citas internas | `/appointments` |
| Página pública | `/book/{slug}` (sin login) |
| API slots | `GET /api/book/{slug}/slots` |
| API reservar | `POST /api/book/{slug}` |

## 1. Migración tras deploy

Si acabas de desplegar cambios de schema, ejecuta la migración incremental en producción (ver también `docs/DOMAIN_SETUP.md` §0):

```bash
curl -X POST "https://garagecarlosainc.ca/api/setup/migrate" \
  -H "x-setup-secret: TU_CRON_SECRET"
```

## 2. Configurar el taller (dueño)

### Paso A — Equipo

1. Ir a **Configuración → Equipo del taller**
2. Crear usuarios con rol **Mecánico** (o Dueño si también atiende citas)
3. Entregar credenciales al empleado

### Paso B — Horario y reservas web

1. **Configuración → Citas — reservas desde el website**
2. **Horario de apertura**: marcar días cerrados y horas de apertura/cierre
3. **Enlace público (slug)**: solo minúsculas, números y guiones (ej. `taller-carlos`)
4. Activar **Reservas en línea**
5. Ajustar:
   - **Duración de cada cita** (minutos, ej. 60)
   - **Anticipación mínima** (horas antes de la cita, ej. 24)
   - **Reservar hasta** (días hacia adelante, ej. 30)
6. En **Mecánicos disponibles**, marcar quién recibe citas web
7. Guardar y copiar el enlace público

Zona horaria por defecto: `America/Montreal`.

## 3. Enlazar desde el website del cliente

Botón o enlace directo:

```html
<a href="https://garagecarlosainc.ca/book/garage-carlos-a">
  Reservar cita en línea
</a>
```

Cuando el taller tenga dominio propio (`NEXT_PUBLIC_APP_URL=https://garagecarlosainc.ca`), los enlaces usan esa base automáticamente.

### Iframe (opcional)

```html
<iframe
  src="https://garagecarlosainc.ca/book/garage-carlos-a"
  title="Reservar cita"
  width="100%"
  height="900"
  style="border:0; max-width:640px;"
></iframe>
```

## 4. Qué hace la reserva pública

1. El cliente elige fecha/hora entre slots disponibles
2. Completa datos personales, vehículo y servicio
3. La app crea o actualiza **Cliente** y **Vehículo**
4. Asigna un mecánico libre (o el elegido si hay varios)
5. Crea la cita con estado **Confirmada** y origen **Web**
6. Envía email de confirmación si `appointmentEmailsEnabled` está activo y el cliente tiene email

Las citas web aparecen en `/appointments` con badge **Web**.

## 5. API (integración avanzada)

### Listar fechas y mecánicos

```http
GET /api/book/{slug}/slots
```

Respuesta: `{ shop, dates, mechanics }`

### Slots de un día

```http
GET /api/book/{slug}/slots?date=2026-06-02&mechanicId=opcional
```

Respuesta: `{ slots: [{ date, time, startsAt, mechanicId, mechanicName }] }`

### Crear reserva

```http
POST /api/book/{slug}
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "5145551234",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2019,
  "licensePlate": "ABC123",
  "title": "Cambio de aceite",
  "date": "2026-06-02",
  "time": "10:00",
  "mechanicId": "",
  "notes": ""
}
```

Respuesta exitosa: `{ ok: true, appointmentId, mechanicName, startsAt }`

Errores comunes:
- `404` — slug inexistente o reservas desactivadas
- `409` — horario ya ocupado (elegir otro slot)

## 6. Lógica de disponibilidad

Un slot está disponible si:

- El día no está marcado como cerrado
- La hora cae dentro del horario de apertura
- Respeta anticipación mínima y ventana máxima de reserva
- Al menos un mecánico **bookable** no tiene otra cita solapada

## 7. Checklist antes de entregar al cliente

- [ ] Migración ejecutada en producción
- [ ] Al menos un mecánico creado y marcado como bookable
- [ ] Horario de apertura guardado
- [ ] Slug definido y reservas web activadas
- [ ] Probar `/book/{slug}` de punta a punta
- [ ] Verificar email de confirmación (Resend + buzón `info@`)
- [ ] Enlazar botón en el website del taller
