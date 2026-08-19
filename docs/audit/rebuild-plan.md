# Plan de reconstrucción — ficha de propiedad con bloques autogestionables

**Fecha:** 2026-07-31
**Base:** [demo-pages-visual-inventory.md](demo-pages-visual-inventory.md) + [blocks-catalog.md](blocks-catalog.md)
**Rama de trabajo sugerida:** `feat/property-blocks-rebuild`

---

## Decisiones que enmarcan el plan

| Decisión | Elección | Implicación |
|---|---|---|
| **Arquitectura** | **Híbrido** — chrome fijo + zona de bloques | Cabecera, galería y formulario de reserva quedan fijos y garantizados en toda ficha. En medio, zona libre que el propietario compone. |
| **Datos demo** | **Recrear desde fixture** (`down -v`) | Entorno reproducible, 3 paletas ejercitadas, subdominios operativos. Se pierde la Property manual actual (asumido). |
| **Alcance** | **Paridad visual autogestionable** | Entra todo lo que hoy se ve, hecho editable. **No entra** reserva real (Stripe) ni disponibilidad real (Beds24). |

### Qué significa "híbrido" en concreto

```
PropertyView
├── [FIJO]  Cabecera: título, subtítulo, ubicación, pills
├── [FIJO]  Galería
├── [LIBRE] ── RenderBlocks(content.blocks) ──┐
│              descripción, comodidades,      │  el propietario
│              calendario, mapa, normas,      │  ordena, añade
│              info práctica, texto libre…    │  y quita
│            ─────────────────────────────────┘
└── [FIJO]  Aside: formulario de reserva (sticky)
```

Lo fijo garantiza que ninguna ficha salga sin lo esencial comercial. Lo libre
cierra la brecha nº6 (reordenar) dentro de un marco acotado.

### Primitivas de Volto 18 verificadas disponibles

Antes de escribir tareas se comprobó que existen en `node_modules/@plone/volto`:

- `RenderBlocks` — [components/theme/View/RenderBlocks.jsx](../../frontend/node_modules/@plone/volto/src/components/theme/View/RenderBlocks.jsx)
- `ObjectBrowserWidget` — [components/manage/Widgets/ObjectBrowserWidget.jsx](../../frontend/node_modules/@plone/volto/src/components/manage/Widgets/ObjectBrowserWidget.jsx)
- `withBlockSchemaEnhancer` / `addStyling` — [helpers/Extensions/withBlockSchemaEnhancer.jsx](../../frontend/node_modules/@plone/volto/src/helpers/Extensions/withBlockSchemaEnhancer.jsx)
- `volto.blocks` **ya está activo** en el content type
  ([Property.xml:44](../../backend/src/estades/delta/profiles/default/types/Property.xml#L44))
  — el backend ya soporta bloques; nadie los ha usado.

No hay que inventar widgets ni behaviors: el plan se apoya en core.

---

## Orden de ejecución

```
FASE 0  T1 ─── desbloqueo (nada funciona sin esto)
          │
FASE 1    ├── T2 ── T3 ── T4      contenido editable (paralelizable)
          │
FASE 2    └── T5 ── T6            arquitectura híbrida
                     │
FASE 3               ├── T7  T8   secciones nuevas
                     │
FASE 4               └── T9  T10  pulido y cierre
```

**T1 es bloqueante de todo.** Sin sidebar no se puede verificar ninguna otra
tarea desde la UI.

---

## FASE 0 — Desbloqueo

### T1 · Restaurar el sidebar de edición en los 10 bloques

**Esfuerzo:** S · **Prioridad:** 🔴 bloqueante · **Brecha que cierra:** nº1, nº2

**Problema.** Los 10 bloques registran un `edit` propio que sustituye a
`DefaultEdit`, y `DefaultEdit` es quien monta `SidebarPortal` + `BlockDataForm`
([DefaultEdit.jsx:22-41](../../frontend/node_modules/@plone/volto/src/components/manage/Blocks/Block/DefaultEdit.jsx#L22-L41)).
`SidebarPortal`, `BlockDataForm` e `InlineForm` no aparecen ni una vez en todo
`src/` del addon.

**Qué hacer.** Dos caminos; elegir uno y aplicarlo uniformemente:

- **(a) Eliminar los `edit` propios** de los bloques que solo renderizan el View
  (7 de 10: hero, gallery, description, amenities, bookingForm,
  aggregatorPropertyCard, y comprobar el resto). Volto cae en `DefaultEdit`, que
  ya hace preview + sidebar. Es menos código y menos superficie de error.
- **(b) Añadir `SidebarPortal` + `BlockDataForm`** a cada `edit` propio, para los
  que sí necesitan comportamiento extra en edición (`propertyCalendar` desactiva
  `pointerEvents`, `aggregatorFilters` y `aggregatorPropertyList` tienen preview
  no interactivo).

Recomendación: **(a) por defecto, (b) solo donde el preview lo justifique.**

**Criterio de aceptación.** Seleccionar cualquiera de los 10 bloques en el editor
abre un formulario en la barra lateral con los campos de su `schema.ts`. Editar
un campo se refleja en el preview.

**Trampa conocida.** El comentario de
[PropertyHeroEdit.tsx:12-13](../../frontend/packages/volto-estades-delta/src/blocks/PropertyHero/PropertyHeroEdit.tsx#L12-L13)
afirma que la edición ya ocurre en el sidebar. No es cierto — no tomarlo como
prueba de que funciona.

---

## FASE 1 — Contenido editable

Las tres tareas son independientes entre sí. Todas dependen de T1 para ser
verificables.

### T2 · Galería con imágenes reales de Plone

**Esfuerzo:** M · **Prioridad:** 🔴 · **Brecha que cierra:** nº1 de la lista comercial

**Problema.** `hero` e `images` son URLs en texto plano
([schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyGallery/schema.ts));
un propietario tendría que hospedar las fotos fuera y pegar URLs. Además
`PropertyView` nunca las pasa, así que hoy se ven 5 placeholders
"(sense imatge)".

**Qué hacer.**
1. Cambiar el schema a un campo de selección de contenido Plone usando
   `ObjectBrowserWidget` (`widget: 'object_browser'`, `mode: 'image'`,
   `allowExternals: false`), sustituyendo los campos `hero` / `images` de tipo
   URL.
2. Adaptar `PropertyGalleryView` para resolver `@id` → URL de scale
   (`/@@images/image/large`) en vez de asumir una URL absoluta.
3. Mantener retrocompatibilidad con URL externa si el valor es un string.

**Criterio de aceptación.** Un editor sube fotos a la Property, abre el sidebar
de la galería, las selecciona con el object browser y se ven en la ficha. Sin
pegar ninguna URL.

**Nota de alcance.** El límite de 5 imágenes visibles y el layout único de mosaico
**se mantienen** en este hito. Las variantes de galería son T10.

**Dependencia de datos.** La Property demo no tiene ninguna imagen
(`items_total: 0`). Esta tarea necesita que T5 haya cargado fotos, o subirlas a
mano para probar.

### T3 · Descripción con texto enriquecido

**Esfuerzo:** S · **Prioridad:** 🔴 · **Brecha que cierra:** nº3 de la lista comercial

**Problema.** `body` es `widget: 'textarea'` y el View lo pinta como hijo de
texto ([PropertyDescriptionView.tsx:25](../../frontend/packages/volto-estades-delta/src/blocks/PropertyDescription/PropertyDescriptionView.tsx#L25)),
así que el HTML se escapa: hoy la ficha muestra literalmente
`<p>Casa Riumar sleeps six…</p>`.

**Qué hacer.** Evaluar dos opciones y elegir:

- **(a) Usar el bloque `text` de core** (Slate) en la zona libre, y reservar
  `propertyDescription` solo para el volcado del campo `long_description`.
  Cero código nuevo, editor rico completo y ya traducido.
- **(b) Cambiar `body` a widget rich-text** y renderizar con el serializador de
  Slate de Volto.

Recomendación: **(a)** — el bloque `text` de core ya resuelve el problema mejor
de lo que lo haría un bloque propio, y el addon no desactiva ningún bloque core.

En ambos casos, arreglar el render del campo `long_description` del content type,
que llega como `{'content-type': 'text/html', 'data': '…'}` y hoy se escapa.

**Criterio de aceptación.** El propietario escribe un párrafo con negritas, una
lista y un enlace, y se ve con formato. Ningún `<p>` visible en pantalla.

### T4 · Comodidades legibles y traducibles

**Esfuerzo:** M · **Prioridad:** 🟠 · **Brecha que cierra:** nº13 de la lista comercial

**Problema.** Hoy se muestran los tokens crudos `wifi`, `ac`, `kitchen`,
`parking`. El campo `amenities` es una `List` de `TextLine` libre
([property.py:92-98](../../backend/src/estades/delta/content/property.py#L92-L98)),
sin vocabulario. Además el View soporta `groups` agrupadas
([PropertyAmenitiesView.tsx:54-74](../../frontend/packages/volto-estades-delta/src/blocks/PropertyAmenities/PropertyAmenitiesView.tsx#L54-L74))
pero `groups` **no está expuesto en el schema** — la propia descripción del campo
admite que hay que editarlo "via REST API".

**Qué hacer.**
1. Crear el vocabulario `estades.delta.vocabularies.Amenities` con token →
   etiqueta traducible (`wifi` → "Wi-Fi", `ac` → "Aire condicionat", …).
2. Cambiar `amenities` a `List(value_type=Choice(vocabulary=…))` + upgrade step
   que mapee los valores existentes.
3. Exponer `groups` en el schema del bloque.
4. Que el View resuelva token → etiqueta traducida.

**Criterio de aceptación.** La ficha muestra "Wi-Fi", "Aire acondicionado",
"Cocina equipada"; en un microsite en castellano salen en castellano. El editor
elige de una lista, no teclea texto libre.

**Decisión pendiente.** Iconos por amenity: **fuera de alcance de este hito**
(el addon no tiene librería de iconos por decisión de Day 2, ver ATOMS.md).

---

## FASE 2 — Arquitectura híbrida

### T5 · Recrear el contenido demo desde el fixture

**Esfuerzo:** S · **Prioridad:** 🔴 · **Brecha que cierra:** nº17, nº16

⚠️ **Tarea destructiva.** `down -v` borra la base de datos. Se pierde la Property
manual `/josep-test/casa-demo-riumar`, el Owner de test, y cualquier
conversación/mensaje de la línea Messaging IA. Confirmado como aceptable.

**Qué hacer.**
1. **Ampliar `demo_content.py`** antes de ejecutarlo, para que la demo nazca
   completa:
   - Imágenes reales en cada Property (necesarias para T2).
   - `owner_ref` relleno apuntando a un Owner demo.
   - `custom_domain` relleno → arregla los microsites por subdominio.
   - `house_rules`, `address`.
   - **`blocks` / `blocks_layout` por defecto** — el conjunto de bloques que
     compone la zona libre (depende de T6).
2. Ejecutar:
   ```
   docker compose -f devops/docker-compose.dev.yml down -v
   CREATE_DEMO_CONTENT=1 docker compose -f devops/docker-compose.dev.yml up -d
   ```
3. **Revertir el hotfix del working tree**: `VOLTO_TENANT_MAP` vuelve a
   `/properties/<slug>`, que es el path canónico que crea el fixture. Ese cambio
   sigue sin commitear desde la auditoría.

**Criterio de aceptación.** Las 3 Properties existen en `/ca/properties/`, cada
una con su paleta; `casa-demo.estadesdelta.local:8081` sirve la ficha (no la home
de Plone); las 3 paletas se ven distintas.

**Por qué aquí y no antes.** Ampliar el fixture con `blocks` por defecto exige
saber qué bloques van en la zona libre (T6). Hacerlo antes obligaría a recrear
dos veces.

### T6 · PropertyView híbrido con RenderBlocks

**Esfuerzo:** M · **Prioridad:** 🔴 · **Brecha que cierra:** nº6 de la lista comercial

**Problema.** El orden de las secciones es el orden del JSX
([PropertyView.tsx:113-183](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L113-L183)).
No hay forma de reordenar sin editar y desplegar código.

**Qué hacer.**
1. Reescribir `PropertyView` con la estructura híbrida:
   - **Fijo:** cabecera (título, subtítulo, meta, pills) y galería.
   - **Libre:** `<RenderBlocks content={content} />` en `propertyView__blocks`.
   - **Fijo:** aside sticky con el formulario de reserva.
2. Quitar de la vista los `*View` que pasan a la zona libre
   (`propertyDescription`, `propertyAmenities`, `propertyCalendar`,
   `propertyMap`) — dejan de invocarse a mano.
3. Definir el **conjunto de bloques por defecto** al crear una Property, para
   que ninguna nazca vacía. Se materializa en T5.
4. Mantener `PaletteScope` envolviendo todo y el grid `1fr 360px`.

**Criterio de aceptación.** El propietario arrastra "Comoditats" por encima de
"Sobre la propietat" y el cambio persiste en la ficha pública. Puede borrar el
mapa si no lo quiere. Puede añadir un bloque `text` de core con una nota propia.

**Riesgo a vigilar.** `restricted: false` en los 10 bloques significa que en la
zona libre aparecerán también los bloques de marketplace
(`aggregatorFilters`, `aggregatorPropertyList`, `aggregatorPropertyCard`), que no
tienen sentido dentro de una ficha. Se acota en T9.

**Sobre `propertyHero`.** Está registrado pero huérfano: `PropertyView` construye
su cabecera aparte. Con el chrome fijo sigue sin usarse. **Decidir en esta tarea**
si se elimina del registro o se reutiliza como la cabecera fija.

---

## FASE 3 — Secciones que faltan

### T7 · Bloque de normas de la casa

**Esfuerzo:** S · **Prioridad:** 🟠 · **Brecha que cierra:** nº7 de la lista comercial

**Problema.** El campo `house_rules` existe en el content type
([property.py:165-168](../../backend/src/estades/delta/content/property.py#L165-L168)),
el formulario de Plone se lo pide al propietario y lo guarda — y
`PropertyView` **nunca lo renderiza**. Dato capturado e invisible.

**Qué hacer.** Bloque `propertyHouseRules` que lea `content.house_rules` con
fallback a texto propio del bloque, siguiendo el patrón de `propertyDescription`
ya corregido en T3 (render de HTML, no escapado).

**Criterio de aceptación.** Lo que el propietario escribe en "House rules"
aparece en su ficha, con formato.

### T8 · Bloque de información práctica

**Esfuerzo:** S · **Prioridad:** 🟠 · **Brecha que cierra:** nº8 de la lista comercial

**Problema.** `check_in_time` (16:00), `check_out_time` (11:00),
`minimum_stay_low` (2) y `minimum_stay_high` (4) están rellenos en el objeto y no
se muestran en ninguna parte.

**Qué hacer.** Bloque `propertyPracticalInfo` que presente entrada/salida y
estancia mínima leyendo los campos del content type, con etiquetas i18n.

**Criterio de aceptación.** La ficha muestra "Entrada a partir de las 16:00",
"Salida antes de las 11:00", "Estancia mínima: 2 noches". Traducido.

---

## FASE 4 — Pulido y cierre

### T9 · Acotar qué bloques se pueden insertar en una Property

**Esfuerzo:** S · **Prioridad:** 🟠

**Problema.** Los 10 bloques tienen `restricted: false`, así que en la zona libre
de una ficha aparecerán también los tres bloques de marketplace, que no tienen
sentido ahí (y viceversa).

**Qué hacer.** Usar `restricted` como función `({properties}) => boolean` para
que los bloques `aggregator*` solo se ofrezcan fuera de un `Property`, y los
`property*` de zona libre solo dentro. Añadir además `icon` a los 10 — hoy los
diez salen sin icono, indistinguibles en el selector.

**Criterio de aceptación.** El selector de bloques dentro de una ficha ofrece
solo bloques con sentido para una ficha, cada uno con su icono.

### T10 · i18n de los bloques de la ficha

**Esfuerzo:** M · **Prioridad:** 🟠 · **Brecha que cierra:** nº15 de la lista comercial

**Problema.** Los cinco bloques de la ficha (`hero`, `gallery`, `description`,
`amenities`, `bookingForm`) **carecen de i18n**: sus textos visibles están
hardcodeados en catalán. Un microsite en castellano o inglés mostraría igualmente
"Comoditats", "Entrada", "Sortida", "Reservar" y "(sense imatge)".

Los bloques de Day 3-4 (`calendar`, `map`, `aggregator*`) ya usan `react-intl`
correctamente — hay patrón que seguir en
[i18n/messages.ts](../../frontend/packages/volto-estades-delta/src/i18n/messages.ts).

**Qué hacer.** Migrar los literales a `defineMessages` + `FormattedMessage`,
añadiendo los grupos `propertyGalleryMessages`, `propertyDescriptionMessages`,
`propertyAmenitiesMessages`, `propertyBookingFormMessages`. Extraer a los
catálogos `.po` de CA/ES/EN.

**Criterio de aceptación.** La misma ficha vista en `/es/` y `/en/` muestra los
rótulos traducidos.

**Incluye además** los literales de `PropertyView` que no son de bloque: los
sufijos `hostes` / `hab` / `banys`
([PropertyView.tsx:77-79](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L77-L79))
y los headings hardcodeados que sobrevivan al híbrido.

---

## Resumen de tareas

| # | Tarea | Fase | Esfuerzo | Prio | Depende de |
|---|---|---|---|---|---|
| T1 | Restaurar el sidebar de edición | 0 | S | 🔴 | — |
| T2 | Galería con imágenes de Plone | 1 | M | 🔴 | T1, (T5 para datos) |
| T3 | Descripción con texto enriquecido | 1 | S | 🔴 | T1 |
| T4 | Comodidades legibles y traducibles | 1 | M | 🟠 | T1 |
| T5 | Recrear demo desde fixture | 2 | S | 🔴 | T6 (para `blocks` default) |
| T6 | PropertyView híbrido + RenderBlocks | 2 | M | 🔴 | T1 |
| T7 | Bloque de normas de la casa | 3 | S | 🟠 | T3, T6 |
| T8 | Bloque de información práctica | 3 | S | 🟠 | T6 |
| T9 | Acotar bloques por content type | 4 | S | 🟠 | T6 |
| T10 | i18n de los bloques de la ficha | 4 | M | 🟠 | T2, T3, T4 |

**Total:** 10 tareas · 4 esfuerzo M, 6 esfuerzo S.

**Camino crítico:** T1 → T6 → T5 → (T7, T8). Todo lo demás paraleliza.

---

## Fuera de alcance de este hito

Confirmado con la decisión de alcance "paridad visual autogestionable":

| Elemento | Por qué queda fuera |
|---|---|
| **Reserva funcional** (botón "Reservar" → Stripe) | Esfuerzo L; requiere credenciales sandbox → Fase 2 según CLAUDE.md §2 |
| **Disponibilidad real** (campo `unavailable_dates` + Beds24) | Esfuerzo L; el stub existe pero nunca se invoca; requiere sandbox |
| **Reseñas** | Requiere content type nuevo; el átomo `Rating` existe sin modelo detrás |
| **Bloque anfitrión** | Descartado del alcance elegido (estaba en la opción "paridad + secciones") |
| **Política de cancelación** | Ídem |
| **Variantes de bloque** (`variations`) | Ningún bloque las declara; es trabajo de diseño posterior |
| **Iconos por amenity** | El addon no tiene librería de iconos por decisión de Day 2 |
| **Multi-unidad por propiedad** | El modelo asume 1 Property = 1 unidad reservable; cambiarlo es rediseño |

**Deuda técnica anotada y no abordada:** los healthchecks de `backend`, `worker`
y `beat` marcan `unhealthy` con los servicios respondiendo bien; y los tests
`.test.tsx.disabled` de 5 bloques siguen inertes.
