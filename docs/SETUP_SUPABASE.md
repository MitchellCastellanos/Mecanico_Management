# Usar Supabase `dev-tarantulapp` para Mecanico Management

## 1. Datos en Supabase Dashboard

1. Abre [supabase.com/dashboard](https://supabase.com/dashboard) → proyecto **dev-tarantulapp**.
2. **Project Settings → General** → copia **Reference ID** (ej. `abcdefghijklmnop`).
3. **Project Settings → Database** → copia **Database password**.
4. **Project Settings → API** → copia **Project URL** y **service_role** (para Storage).

## 2. Connection strings (pooler — obligatorio en Vercel)

**No uses solo Direct (`db....:5432`) en Vercel** — suele fallar. En **Connect** copia:

| Variable | Modo en Supabase | Uso |
|----------|------------------|-----|
| `DATABASE_URL` | **Transaction** pooler, puerto **6543** | App en producción |
| `DIRECT_URL` | **Session** pooler, puerto **5432** | `prisma db push` local |

Ejemplo de región (tu proyecto): `aws-1-us-east-2.pooler.supabase.com`  
Usuario: `postgres.iiiekxgjltnwpeyjfpjs`

### Base compartida con TarantulApp

Este proyecto usa el schema PostgreSQL **`mecanico`** para no tocar las tablas de TarantulApp en `public`.

Si la contraseña tiene `@`, `#`, `%`, etc., codifícala en la URL:

| Carácter | Codificado |
|----------|------------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |

Ejemplo:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD_ENCODED@db.TU_REF.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:TU_PASSWORD_ENCODED@db.TU_REF.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://TU_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

Pega lo mismo en **Vercel** → proyecto `mecanico-management` → **Settings → Environment Variables**.

## 3. Storage (logos / contabilidad)

En el proyecto Supabase:

1. **Storage** → crea bucket `accounting` (público si quieres logos públicos en PDF).
2. O reutiliza el bucket que ya tengas en dev-tarantulapp.
3. Si el logo falla con *Bucket not found*, el mensaje de error en Configuración lo indicará — el logo se guarda en `accounting/logos/{shopId}/logo.{ext}`.

## 4. Inicializar tablas y tu cuenta admin

En la carpeta del proyecto, con `.env` apuntando a dev-tarantulapp:

```powershell
$env:PLATFORM_ADMIN_EMAIL="mitchell.castellanos@hotmail.com"
$env:PLATFORM_ADMIN_PASSWORD="tu-contraseña-segura"
npx tsx scripts/bootstrap-platform.ts
```

Eso corre `prisma db push` y crea tu usuario **SUPER_ADMIN** (sin taller).

## 5. Carlos (dueño del taller)

1. Entra a `https://mecanico-management.vercel.app/admin` con tu cuenta.
2. Abre el taller → **Crear dueño** con el email de Carlos.
3. Carlos entra en `/login` y va a su **Dashboard** (no al panel admin).

## Roles

| Rol | Quién | Acceso |
|-----|--------|--------|
| **SUPER_ADMIN** | Mitchell (tú) | `/admin` — todos los talleres |
| **OWNER** | Carlos | `/dashboard` + Configuración + Equipo de su taller |
| **MECHANIC** | Empleados | Operación del taller |
| **VIEWER** | Solo consulta | Lectura |
