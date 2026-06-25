# Contabilidad Desayuno

Aplicacion web movil para controlar diariamente el pan utilizado en los desayunos de un bar.

La app se creo para sustituir una libreta manual donde se apuntaban conceptos como `Hay`, `Nuevo` y `Resto`. En la aplicacion esos conceptos se organizan con nombres mas claros para evitar errores:

- `Stock almacen`: pan total disponible en almacen.
- `Entrada proveedor`: pan recibido desde proveedor o factura.
- `Sacado para desayuno`: pan retirado del almacen para el servicio del dia.
- `Resto inicial`: pan sobrante del dia anterior.
- `Disponible desayuno`: resto inicial mas pan sacado del almacen.
- `Resto final`: pan que sobra al terminar el desayuno.
- `Desayunos vendidos`: consumo calculado automaticamente.

## Para Que Sirve

La aplicacion permite que la persona encargada del desayuno pueda hacer el recuento diario desde el movil en menos de un minuto.

Funciones principales:

- Seleccionar el dia de trabajo desde calendario.
- Iniciar o corregir el stock del almacen.
- Registrar entrada de proveedor.
- Registrar pan sacado para desayuno.
- Registrar resto final del dia.
- Calcular automaticamente desayunos vendidos por producto.
- Guardar cada dia en historial.
- Editar dias anteriores si hubo una equivocacion.
- Ver resumen historico por fecha.
- Compartir por WhatsApp una imagen compacta tipo tabla para el jefe.
- Avisar cuando algun producto queda bajo de stock.

## Productos Iniciales

La base de datos incluye estos productos iniciales:

- Entera normal
- Media normal
- Entera integral
- Media integral
- Bollito
- Semilla
- Centeno

Los productos no estan fijos en el codigo. Se leen desde Supabase y pueden anadirse, editarse, ordenarse o desactivarse desde la pantalla de productos.

## Como Se Ha Creado

La app se ha desarrollado desde cero con OpenCode, a partir de los requisitos del flujo real usado en el bar.

Stack tecnico:

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

Arquitectura principal:

- `src/components/DailyScreen.tsx`: pantalla diaria de recuento.
- `src/components/HistoryScreen.tsx`: historial, resumen y compartir por WhatsApp.
- `src/components/ProductsScreen.tsx`: gestion de productos.
- `src/lib/api.ts`: acceso a Supabase y guardado de datos.
- `src/lib/calculations.ts`: calculos de stock, disponible y consumo.
- `supabase/schema.sql`: tablas, reglas y productos iniciales.

## Logica De Calculo

Para cada producto:

```text
stock_almacen_actual = stock_almacen_anterior + entrada_proveedor - sacado_desayuno
disponible_desayuno = resto_dia_anterior + sacado_desayuno
desayunos_vendidos = disponible_desayuno - resto_final
resto_dia_siguiente = resto_final_del_dia_actual
```

La app evita calculos manuales y valida que no se saque mas pan del almacen del disponible ni que el resto final sea mayor que el disponible del desayuno.

## Despliegue

La app esta desplegada en Vercel para estar disponible 24 horas desde movil o PC:

```text
https://contabilidad-desayuno.vercel.app
```

## Desarrollo Local

Instalar dependencias:

```powershell
npm install
```

Crear `.env` a partir de `.env.example` y configurar Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Arrancar en local:

```powershell
npm run dev
```

Compilar:

```powershell
npm run build
```

## Base De Datos

Antes de usar la app en un proyecto nuevo de Supabase, ejecutar el contenido de:

```text
supabase/schema.sql
```

Ese archivo crea las tablas necesarias, reglas basicas y productos iniciales.

## Nota De Seguridad

Esta primera version esta pensada como MVP privado. Las variables locales estan excluidas del repositorio mediante `.gitignore`.

Antes de usar la app con mas usuarios o datos sensibles, conviene anadir autenticacion y permisos mas estrictos en Supabase.
