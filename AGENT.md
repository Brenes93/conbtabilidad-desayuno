# AGENT.md

# Breakfast Stock Manager

## Proyecto

Aplicacion web responsive, mobile first, para controlar el stock diario de pan usado en los desayunos de un bar.

La aplicacion sera usada principalmente desde un telefono movil por personal no tecnico. La prioridad absoluta es que cualquier tarea habitual se pueda completar rapido, sin dudas y sin calculos manuales.

La aplicacion debe separar siempre dos inventarios distintos:

1. Stock general del almacen.
2. Stock disponible y consumido durante cada servicio de desayunos.

Nunca mezclar ambos conceptos.

## Objetivos Principales

La aplicacion debe permitir:

- Controlar el stock real del almacen.
- Registrar entradas de pan desde proveedores.
- Registrar pan retirado del almacen para el desayuno.
- Registrar pan sobrante al finalizar el desayuno.
- Calcular automaticamente el consumo diario.
- Mantener un historial completo y fiable.
- Evitar calculos manuales por parte del usuario.

El objetivo es sustituir por completo el cuaderno usado actualmente.

## Filosofia Del Producto

Prioridades, en este orden:

1. Simplicidad.
2. Rapidez.
3. Claridad.
4. Mantenimiento sencillo.
5. Codigo limpio.

No anadir funcionalidades innecesarias. Cada pantalla debe poder entenderse en pocos segundos.

Antes de implementar cualquier funcionalidad, evaluar:

1. Aporta valor real?
2. Hace la app mas sencilla?
3. Complica la experiencia movil?
4. Existe una solucion mas simple?

Elegir siempre la alternativa mas sencilla que resuelva el problema.

## Usuario Principal

La usuaria principal es la encargada del desayuno:

- Usa principalmente el movil.
- No tiene conocimientos tecnicos.
- Necesita introducir datos de forma rapida.
- No debe hacer calculos manuales.

Implicaciones de diseno:

- Interfaces limpias.
- Botones grandes y faciles de pulsar.
- Pocos campos editables.
- Textos claros y directos.
- Sin navegacion complicada.
- Sin ventanas o pasos innecesarios.

## Flujo Diario

### Antes Del Desayuno

Puede entrar pan desde proveedor.

La entrada de proveedor incrementa el stock del almacen.

Despues se registra cuanto pan se saca del almacen para preparar el desayuno.

El pan sacado para desayuno reduce el stock del almacen.

### Durante El Desayuno

El pan disponible para vender se calcula asi:

```text
Disponible desayuno = resto inicial + sacado del almacen
```

### Final Del Desayuno

La encargada introduce unicamente el pan restante.

La aplicacion calcula automaticamente:

```text
Consumo desayuno = disponible desayuno - resto final
```

El resto final pasa automaticamente a ser el resto inicial del dia siguiente.

## Conceptos De Negocio

### Stock Almacen

Cantidad real existente dentro del almacen. Debe mantenerse siempre actualizado.

### Entrada Proveedor

Pan recibido mediante factura o entrega de proveedor. Incrementa el stock del almacen.

### Sacado Para Desayuno

Pan retirado del almacen para el servicio de desayuno. Reduce el stock del almacen.

### Resto Inicial

Pan sobrante del desayuno anterior. No pertenece al almacen. Pertenece al desayuno del dia.

### Disponible Desayuno

Pan disponible durante el servicio de desayuno.

```text
Disponible desayuno = resto inicial + sacado para desayuno
```

### Resto Final

Pan sobrante al finalizar el desayuno. Sera el resto inicial del siguiente dia.

### Consumo Desayuno

Pan consumido durante el desayuno.

```text
Consumo desayuno = disponible desayuno - resto final
```

## Reglas De Negocio

- Nunca permitir sacar mas pan del almacen del disponible.
- Nunca permitir consumos negativos.
- Nunca permitir restos finales mayores que el disponible del desayuno.
- Permitir correcciones manuales del almacen.
- Toda correccion manual debe quedar registrada con historial.
- Nunca eliminar informacion historica.
- No borrar registros de negocio.
- Usar estados activos/inactivos cuando sea necesario ocultar o desactivar datos.
- No programar productos fijos en el codigo.
- Leer siempre los productos desde la base de datos.
- Mantener separado el stock de almacen del stock del desayuno.

## Productos Iniciales

Productos iniciales esperados:

- Entera normal
- Media normal
- Entera integral
- Media integral
- Bollito
- Semilla
- Centeno

El administrador debe poder:

- Anadir productos.
- Editar productos.
- Desactivar productos.
- Cambiar el orden de visualizacion.

Los productos iniciales pueden existir como datos semilla, pero nunca como constantes de negocio obligatorias dentro de la interfaz o la logica.

## Base De Datos

Usar Supabase como backend.

Las tablas deben mantenerse normalizadas. Evitar duplicar informacion calculable o derivada salvo que exista una razon clara.

Separar, como minimo, estos conceptos:

- Productos.
- Movimientos de almacen.
- Registros diarios de desayuno.
- Lineas de producto del desayuno.

Priorizar relaciones claras, constraints utiles y datos faciles de auditar.

## Tecnologia

Frontend:

- React
- Vite
- TypeScript

Backend:

- Supabase

Estilos:

- TailwindCSS

Hosting:

- Vercel

## Diseno UI

- Mobile first.
- Optimizado para telefonos.
- Layouts claros, sin saturacion visual.
- Espaciado generoso.
- Botones grandes.
- Formularios cortos.
- Estados de carga y error comprensibles.
- Confirmaciones solo cuando eviten errores importantes.
- Evitar modales y navegacion profunda si una pantalla simple resuelve el caso.

## Estilo De Codigo

- TypeScript estricto.
- Componentes pequenos y con responsabilidad clara.
- Nombres descriptivos.
- Funciones reutilizables cuando reduzcan duplicacion real.
- Hooks personalizados solo cuando simplifiquen la lectura o encapsulen logica reutilizable.
- No mezclar logica de negocio compleja directamente con la interfaz.
- Evitar codigo duplicado.
- Mantener comentarios solo cuando aporten contexto que el codigo no expresa por si solo.
- Preferir cambios pequenos, claros y faciles de revisar.

## Directrices Para OpenCode

Cuando OpenCode modifique el proyecto debe:

- Explicar brevemente que va a cambiar antes de editar si el cambio es relevante.
- Revisar la estructura existente antes de implementar.
- Mantener la estructura actual salvo que haya una razon clara para cambiarla.
- No romper funcionalidades existentes.
- No eliminar codigo util sin una razon explicita.
- No introducir abstracciones prematuras.
- Crear componentes reutilizables cuando haya reutilizacion real.
- Mantener las reglas de negocio centralizadas y testeables cuando sea posible.
- Validar entradas del usuario antes de guardar datos.
- Verificar los cambios con los comandos disponibles del proyecto cuando sea viable.

## MVP

La primera version debe incluir unicamente:

- Gestion de productos.
- Gestion del almacen.
- Registro diario de desayuno.
- Calculos automaticos.
- Historial.
- Persistencia en Supabase.

Todo lo demas queda fuera del MVP salvo peticion expresa.

## Mejoras Futuras

No implementar estas funcionalidades salvo que el usuario las solicite expresamente:

- Estadisticas mensuales.
- Consumo medio por producto.
- Prediccion de compras.
- Avisos de stock minimo.
- Exportacion a Excel o PDF.
- Multiples establecimientos.
- Usuarios y permisos.
- Modo oscuro.
- PWA instalable.
- Escaner de codigos de barras.

## Criterio Final

Si hay duda entre una solucion completa y una solucion simple, elegir la simple siempre que respete las reglas de negocio y no comprometa el historial de datos.
