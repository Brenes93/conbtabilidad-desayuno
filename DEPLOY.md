# Despliegue en Vercel

La app esta preparada para funcionar 24/7 como sitio estatico en Vercel.

## Variables necesarias

Configurar estas variables en Vercel, dentro de Project Settings > Environment Variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Comandos de Vercel

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Install command:

```text
npm install
```

## Base de datos

Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase antes de usar la app.

## Uso diario

La usuaria puede abrir la URL de Vercel desde Android o iPhone cada dia. El historial queda guardado en Supabase y se puede consultar desde cualquier dispositivo con acceso a la URL.
