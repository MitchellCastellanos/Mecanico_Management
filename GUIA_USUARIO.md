# Mecanico — Sistema de Gestión de Taller
## Guía de Usuario y Documento de Entrega

---

> **Su sistema está listo en:** `https://mecanico-management.vercel.app`
>
> **Usuario:** su correo electrónico
> **Contraseña:** la que usted eligió

---

## ¿Qué incluye su sistema?

Su sistema de gestión le permite manejar todo su taller desde cualquier dispositivo — computadora, tableta o celular — sin instalar nada.

| Módulo | ¿Qué hace? |
|--------|-----------|
| **Clientes** | Registro completo de clientes con historial |
| **Vehículos** | Ficha por vehículo con historial de servicios |
| **Facturas** | Crear, enviar y descargar facturas en PDF con impuestos QC |
| **Recordatorios** | Avisos automáticos de servicio por email al cliente |
| **Contabilidad** | Subir documentos directo a Google Drive para su contadora |
| **Configuración** | Datos del taller, logo, números de impuestos |

---

## Cómo entrar al sistema

1. Abra su navegador (Chrome, Firefox, Safari)
2. Vaya a: **`https://mecanico-management.vercel.app`**
3. Ingrese su email y contraseña
4. Haga clic en **Entrar**

> **Consejo:** Guarde la página en favoritos para acceder más rápido.

---

## Módulo 1 — Clientes

### Registrar un cliente nuevo

1. En el menú izquierdo, haga clic en **Clientes**
2. Haga clic en el botón **Nuevo cliente** (arriba a la derecha)
3. Complete los datos: nombre, apellido, email, teléfono, dirección
4. Haga clic en **Guardar cliente**

### Buscar un cliente

- En la página de Clientes hay una barra de búsqueda
- Puede buscar por nombre, apellido, email o teléfono
- Los resultados aparecen automáticamente mientras escribe

### Ver el historial de un cliente

- Haga clic en el nombre del cliente en la lista
- Verá todos sus vehículos registrados y todas sus facturas anteriores

---

## Módulo 2 — Vehículos

### Agregar un vehículo a un cliente

1. Vaya a la página del cliente (haga clic en su nombre)
2. Haga clic en **Agregar vehículo**
3. Complete: marca, modelo, año, placa, color, kilometraje
4. Haga clic en **Guardar vehículo**

> Un cliente puede tener varios vehículos registrados.

---

## Módulo 3 — Facturas

Este es el corazón del sistema. Le permite crear facturas profesionales con impuestos de Quebec (TPS + TVQ) calculados automáticamente.

### Crear una factura nueva

1. En el menú, haga clic en **Facturas**
2. Haga clic en **Nueva factura**
3. Seleccione el **cliente** del menú desplegable
4. Seleccione el **vehículo** (se filtra automáticamente por cliente)
5. Ingrese el **kilometraje de entrada**
6. Agregue las líneas de trabajo:
   - Haga clic en **Agregar línea**
   - Escriba la descripción (ej. "Cambio de aceite y filtro")
   - Seleccione el tipo: Mano de obra, Repuesto u Otro
   - Ingrese cantidad y precio unitario
   - El total de la línea se calcula solo
7. Los impuestos (TPS 5% + TVQ 9.975%) se calculan automáticamente
8. Agregue notas si es necesario
9. Haga clic en **Crear factura**

### Numeración automática

Las facturas se numeran automáticamente: INV-0001, INV-0002, INV-0003...
No necesita llevar la cuenta — el sistema lo hace por usted.

### Descargar o imprimir la factura en PDF

1. Abra la factura que desea imprimir
2. Haga clic en el botón **Descargar PDF**
3. El PDF se descarga con el logo de su taller, sus datos fiscales y todos los detalles

> El PDF es equivalente a sus talonarios de papel actuales, pero digital y con su logo.

### Estados de una factura

| Estado | Significado |
|--------|-------------|
| **Borrador** | En preparación, aún no enviada al cliente |
| **Enviada** | El cliente la recibió |
| **Pagada** | El trabajo fue pagado |
| **Vencida** | Pasó la fecha de pago sin recibir pago |
| **Cancelada** | Se anuló |

Para cambiar el estado, abra la factura y use los botones de acción en la parte superior.

---

## Módulo 4 — Recordatorios de Servicio

Envíe avisos automáticos a sus clientes cuando su vehículo necesite mantenimiento.

### Crear un recordatorio

1. En el menú, haga clic en **Recordatorios**
2. Haga clic en **Nuevo recordatorio**
3. Seleccione el vehículo
4. Indique el tipo de servicio (ej. "Cambio de aceite", "Revisión de frenos")
5. Ponga una fecha límite o un kilometraje límite
6. Haga clic en **Guardar**

### Enviar el recordatorio por email

- En la lista de recordatorios, haga clic en **Enviar** junto al recordatorio
- El cliente recibe un email automático con el aviso de servicio
- El sistema registra que fue enviado para no enviarlo dos veces

### Recordatorios automáticos

El sistema revisa todos los días a las 8am si hay recordatorios que vencen en los próximos 7 días y los envía automáticamente — usted no tiene que hacer nada.

---

## Módulo 5 — Contabilidad

Suba documentos directamente a Google Drive para que su contadora los reciba automáticamente.

### Subir un documento

1. En el menú, haga clic en **Contabilidad**
2. Seleccione la categoría: Facturas, Recibos, Nómina, Documentos Fiscales, Estados de Cuenta u Otros
3. Arrastre el archivo a la zona indicada, o haga clic para seleccionar el archivo
4. El documento se guarda en Google Drive automáticamente
5. Su contadora recibe un email avisándole que hay documentos nuevos

> Ideal para enviarle los estados de cuenta del banco, recibos de proveedores y documentos de impuestos sin tener que reunirse o enviar emails con adjuntos.

---

## Módulo 6 — Configuración

### Actualizar los datos de su taller

1. En el menú, haga clic en **Configuración**
2. Puede cambiar: nombre del taller, dirección, teléfono, email, logo
3. Ingrese sus números fiscales: NEQ, TPS, TVQ
4. Haga clic en **Guardar cambios**

> **Importante:** Sus números fiscales aparecen en todas las facturas PDF. Asegúrese de que estén correctos antes de enviar facturas a clientes.

### Cambiar el logo

1. En Configuración, haga clic en el área del logo
2. Seleccione una imagen desde su computadora (JPG o PNG, fondo blanco preferible)
3. El logo nuevo aparecerá en todas las facturas PDF a partir de ese momento

---

## Preguntas Frecuentes

**¿Puedo usar el sistema desde mi celular?**
Sí. El sistema funciona en cualquier navegador de celular o tableta. No necesita instalar ninguna aplicación.

**¿Qué pasa si se va el internet?**
El sistema requiere conexión a internet para funcionar. Sus datos están guardados en la nube, así que no se pierden si su computadora falla.

**¿Mis datos están seguros?**
Sí. El sistema usa cifrado SSL (el candado verde que ve en el navegador) y los datos se guardan en servidores seguros en Canadá/EE.UU.

**¿Puedo tener más de un empleado usando el sistema?**
Sí. Si usted es el **dueño** del taller, vaya a **Configuración → Equipo del taller** para crear cuentas, asignar roles y restablecer contraseñas.

**¿Qué impuestos calcula el sistema?**
TPS (5%) + TVQ (9.975%) = 14.975%, que es la tasa combinada de Quebec. Aparece desglosada en cada factura.

**¿Puedo recuperar facturas viejas?**
Sí. Todas las facturas quedan guardadas indefinidamente. Puede buscarlas por cliente, fecha o número.

**¿Qué pasa si me equivoco en una factura?**
Puede editar una factura en estado Borrador. Si ya fue enviada al cliente, lo más recomendable es crear una nota de crédito o cancelarla y crear una nueva — igual que con los talonarios de papel.

**¿Cómo exporto mis datos si en el futuro quiero cambiar de sistema?**
Sus datos están en una base de datos estándar PostgreSQL. Puede exportarlos en cualquier momento — solicítelo a su desarrollador.

---

## Información de acceso

| | |
|---|---|
| **URL del sistema** | `https://mecanico-management.vercel.app` |
| **Su usuario** | *(su correo electrónico)* |
| **Contraseña** | *(la que usted eligió)* |

> **Guarde esta información en un lugar seguro.**
> Si olvida su contraseña y es el dueño, puede restablecerla desde **Configuración → Equipo del taller**. Si es empleado, pida al dueño que la restablezca.

---

## Módulo 6 — Equipo del taller (solo dueño)

Si su cuenta tiene rol **Dueño**, en **Configuración** verá la sección **Equipo del taller**:

| Acción | Cómo hacerlo |
|--------|----------------|
| **Crear empleado** | Clic en **Nuevo usuario** → nombre, correo, contraseña temporal y rol |
| **Restablecer contraseña** | Ícono de llave junto al usuario → nueva contraseña → **Guardar** |
| **Cambiar permisos** | Menú desplegable de rol: Dueño / Mecánico / Solo lectura |
| **Eliminar cuenta** | Ícono de papelera (no puede eliminarse a sí mismo) |

**Roles:**
- **Dueño** — acceso total, incluyendo esta sección
- **Mecánico** — puede trabajar con clientes, facturas y recordatorios
- **Solo lectura** — puede ver información pero no modificarla

---

## Soporte

Para soporte técnico, cambios o nuevas funciones, use el recuadro **¿Necesita ayuda?** al final de **Configuración**, o contacte:

**GABAN Solutions** — [gabansolutions.ca](https://gabansolutions.ca)

---

*Sistema desarrollado a medida para su taller. Todos los derechos reservados.*
*Versión 1.0 — 2025*
