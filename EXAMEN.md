# EXAMEN — Pedro

## Reto
F13 — Idempotencia y semántica PUT vs PATCH

## Tarea técnica

### Qué problema detecté

El endpoint de actualización de clientes y proyectos estaba registrado como `PUT` en las rutas, pero la implementación usaba `Object.assign(entity, req.body)`, que solo mezcla los campos enviados y deja intactos los que no llegan. Eso es semántica **PATCH** (actualización parcial), no PUT (reemplazo total). La RFC 7231 exige que PUT reemplace el recurso completo con la representación enviada.

Además, `deleteClient` y `deleteProject` tenían la condición `req.query.soft !== 'false'`, lo que hace que una petición **sin parámetro** active el borrado suave. El contrato correcto es: sin parámetro → borrado definitivo, `?soft=true` → borrado suave.

### Cómo lo arreglé

- Cambié `router.put('/:id', ...)` a `router.patch('/:id', ...)` en `src/routes/client.routes.js` y `src/routes/project.routes.js`.
- Corregí la condición de soft delete en `deleteClient` y `deleteProject`: `req.query.soft !== 'false'` → `req.query.soft === 'true'`.
- Actualicé los tests existentes de PUT a PATCH y añadí un test de idempotencia que llama dos veces con el mismo body y comprueba que el estado resultante es idéntico.

### Por qué mi solución es correcta

PATCH es el verbo adecuado porque la implementación solo aplica los campos presentes en el body, respetando los demás. Registrar el endpoint como PATCH comunica ese contrato con precisión al consumidor de la API. La corrección del soft delete hace que el comportamiento por defecto sea el más destructivo (hard delete), lo que obliga al cliente a ser explícito cuando quiere un borrado suave, reduciendo el riesgo de borrados accidentales irreversibles.

## Respuestas socráticas

### 1. Object.assign con PUT y el campo email

Con `Object.assign(client, req.body)`, si llamas `PUT /api/client/:id` enviando solo `{ name: 'Nuevo' }` sin incluir `email`, el campo `email` en la base de datos **no se borra**: Mongoose mantiene el valor previo porque `Object.assign` solo sobreescribe las claves presentes en `req.body`. Según la RFC 7231, PUT debe reemplazar el recurso completo; si no envías `email`, la representación enviada no lo contiene y el campo debería desaparecer o quedar como `null`. Por tanto, este comportamiento es propio de **PATCH**, no de PUT: estamos haciendo una actualización parcial disfrazada de reemplazo total.

### 2. Contrato de PATCH e idempotencia

Cambiar el endpoint de PUT a PATCH implica que el cliente de la API solo necesita enviar los campos que quiere modificar; los campos omitidos permanecen igual. Eso simplifica las integraciones porque no hace falta conocer el estado actual completo del recurso para actualizarlo. Respecto a la idempotencia: **PATCH no es idempotente por definición** según la RFC 5789 (a diferencia de PUT, que sí lo es). Un PATCH podría describir una operación relativa ("incrementa price en 10") que, aplicada dos veces, produce resultados distintos. Sin embargo, nuestra implementación concreta sí es idempotente en la práctica, porque el body describe un estado absoluto ("name = X"), no una transformación relativa; llamar dos veces con el mismo body deja el recurso en el mismo estado.

### 3. Semánticas distintas para delete de clientes vs albaranes

La práctica distingue entre clientes y albaranes porque tienen ciclos de vida y consecuencias legales distintas. Un cliente puede desactivarse temporalmente (deja de operar con nosotros) pero mantener histórico de proyectos y albaranes asociados; el soft delete permite restaurarlo sin perder esos vínculos. Un albarán, en cambio, es un documento contable: si está **firmado** tiene valor legal y no se puede borrar en absoluto (el código lanza un 409); si **no está firmado** significa que es un borrador erróneo que no debe conservarse, por lo que el hard delete directo es la semántica correcta. Que un albarán no tenga soft delete tiene sentido porque un albarán "archivado pero no borrado" no tiene significado de negocio claro, mientras que un cliente inactivo sí.

### 4. PUT como reemplazo total y los defaults de Mongoose

Si implementáramos PUT como reemplazo total (por ejemplo, con `findOneAndReplace`), los campos con `default` definidos en el schema de Mongoose **no se reaplicarían** en un documento existente. Los defaults de Mongoose solo se aplican en el momento de la creación (`Model.create` o `new Model()`). Si el body del PUT no incluye `deleted`, el campo quedaría como `undefined`; Mongoose puede omitir ese campo en la escritura, dejándolo sin valor, o lanzar un error de validación si está marcado como requerido. En la práctica, usar `findOneAndReplace` sin incluir `deleted: false` podría reactivar un cliente que estaba archivado si Mongoose deja el campo vacío y la query de listado filtra por `deleted: false`.

### 5. Validación antes de Object.assign y condiciones de carrera

Si hiciéramos el `Object.assign` antes de validar la unicidad del CIF o el projectCode, el objeto en memoria ya estaría modificado en el momento de la comprobación. Si la validación falla, tendríamos que revertir manualmente ese estado en memoria antes de responder con error, lo que añade complejidad y es propenso a errores. Más importante: si hacemos la validación **después** del assign y del save, podría ocurrir una condición de carrera: dos requests concurrentes con el mismo CIF nuevo podrían pasar ambas la validación al mismo tiempo (antes de que ninguna haya escrito en BD), y ambas guardarían, rompiendo la unicidad. Haciendo la validación **antes** del assign, nos aseguramos de que el documento solo se modifica cuando tenemos certeza razonable de que la operación es válida, reduciendo la ventana de la race condition a la operación atómica de escritura.

## Proceso
Tiempo total invertido: 1h 27 minutos

Herramientas usadas: Visual Studio Code, Claude (chat web)

