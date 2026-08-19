# Catálogo de bloques Volto — Estades Delta

**Fecha:** 2026-07-31 · **Tipo:** auditoría read-only
**Fuente de registro:** [config/blocks.ts](../../frontend/packages/volto-estades-delta/src/config/blocks.ts)

---

## 0. Resumen

**10 bloques propios registrados**, todos en el grupo `estadesDelta`.
(El log del Day 3 dice 8 — está desactualizado: faltan `aggregatorPropertyList`
y `propertyCalendar`, añadidos después.)

**Ningún bloque core de Volto está desactivado.** El addon solo *añade* entradas
a `config.blocks.blocksConfig` ([blocks.ts:35-54](../../frontend/packages/volto-estades-delta/src/config/blocks.ts#L35-L54))
y hace un único `.filter()` sobre `groupBlocksOrder` para no duplicar su propio
grupo ([blocks.ts:56-63](../../frontend/packages/volto-estades-delta/src/config/blocks.ts#L56-L63)).
No hay ningún `delete config.blocks.blocksConfig[...]` ni `restricted: true` en
todo el addon. Todos los bloques core siguen disponibles tal cual.

### 🚩 Defecto transversal: los schemas no llegan nunca al editor

Los 10 bloques definen un `blockSchema` correcto y bien formado. `blockSchema`
**es** la clave correcta en Volto 18 — la consume
[DefaultEdit.jsx:12-16](../../frontend/node_modules/@plone/volto/src/components/manage/Blocks/Block/DefaultEdit.jsx#L12-L16).

El problema es otro: **`DefaultEdit` es quien monta `SidebarPortal` +
`BlockDataForm`** ([DefaultEdit.jsx:22-41](../../frontend/node_modules/@plone/volto/src/components/manage/Blocks/Block/DefaultEdit.jsx#L22-L41)),
y los 10 bloques registran un `edit` propio que **sustituye** a `DefaultEdit`.
Todos esos `edit` se limitan a renderizar el `View` como preview:

```
const PropertyDescriptionEdit = (props) => <PropertyDescriptionView data={props.data} />;
```
— [PropertyDescriptionEdit.tsx:13-15](../../frontend/packages/volto-estades-delta/src/blocks/PropertyDescription/PropertyDescriptionEdit.tsx#L13-L15)

Verificado por búsqueda exhaustiva: **`SidebarPortal`, `BlockDataForm` e
`InlineForm` no aparecen ni una sola vez en todo `src/` del addon.**

**Consecuencia:** al seleccionar cualquiera de los 10 bloques en el editor, la
barra lateral **no muestra ningún formulario**. Los campos existen en el schema
y el View sabe pintarlos, pero **no hay forma de rellenarlos desde la UI** — solo
vía REST API a mano.

El comentario de [PropertyHeroEdit.tsx:12-13](../../frontend/packages/volto-estades-delta/src/blocks/PropertyHero/PropertyHeroEdit.tsx#L12-L13)
("Field editing happens in the sidebar via the schema registered in `schema.ts`")
describe una intención que el código no cumple.

Esto es **la brecha número uno** para el objetivo de "reconstruir la demo solo
con bloques autogestionables": hoy los bloques no son editables por un
propietario, aunque estén registrados.

---

## 1. Tabla comparativa

| id | Título | Grupo | mostUsed | sidebarTab | restricted | Variantes | styleWrapper | Sidebar funcional |
|---|---|---|---|---|---|---|---|---|
| `propertyHero` | Property hero | estadesDelta | ✅ | 1 | false | ninguna | ❌ | ❌ |
| `propertyGallery` | Property gallery | estadesDelta | ❌ | 1 | false | ninguna | ❌ | ❌ |
| `propertyDescription` | Property description | estadesDelta | ✅ | 1 | false | ninguna | ❌ | ❌ |
| `propertyAmenities` | Property amenities | estadesDelta | ❌ | 1 | false | ninguna | ❌ | ❌ |
| `propertyBookingForm` | Property booking form | estadesDelta | ✅ | 1 | false | ninguna | ❌ | ❌ |
| `propertyCalendar` | Property calendar | estadesDelta | ❌ | 1 | false | ninguna | ❌ | ❌ |
| `propertyMap` | Property map | estadesDelta | ❌ | 1 | false | ninguna | ❌ | ❌ |
| `aggregatorPropertyCard` | Aggregator property card | estadesDelta | ❌ | 1 | false | ninguna | ❌ | ❌ |
| `aggregatorFilters` | Aggregator filters | estadesDelta | ✅ | 1 | false | ninguna | ❌ | ❌ |
| `aggregatorPropertyList` | Aggregator property list | estadesDelta | ✅ | 1 | false | ninguna | ❌ | ❌ |

**Observaciones transversales:**

- **`icon: undefined` en los 10.** En el selector de bloques del editor los diez
  aparecen sin icono — indistinguibles de un vistazo.
- **`variations: []` — ninguno declara variantes.** No existe hoy la posibilidad
  de que un propietario elija "galería en mosaico vs carrusel", ni equivalente.
- **`restricted: false` en los 10** — cualquier bloque se puede insertar en
  cualquier content type, incluyendo bloques de marketplace dentro de una ficha
  de propiedad y viceversa. No hay separación editorial.
- **`security: { addPermission: [], view: [] }` en los 10** — sin restricción de
  permisos.
- **Ninguno soporta `styleWrapper` / `blockStyles`.**

---

## 2. Ficha por bloque

### 2.1 `propertyHero` — Property hero

[index.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyHero/index.ts) ·
[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyHero/schema.ts)

| Campo | Tipo | Widget | Default | Req. |
|---|---|---|---|---|
| `title` | string | — | — | no |
| `subtitle` | string | — | — | no |
| `hero_image` | string | `url` | — | no |
| `capacity` | integer | — | — | no |

Fieldset único `Hero`. **Nota:** `hero_image` es una **URL en texto plano**, no
un selector de imagen de Plone — el propietario tendría que pegar una URL a mano.
Sin i18n. Sin test activo (`.disabled`). Con story. SCSS propio.

**No se usa en `PropertyView`** — la vista de propiedad construye su cabecera con
`Heading`/`Pill` directamente ([PropertyView.tsx:85-111](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L85-L111)).
Bloque registrado pero huérfano.

### 2.2 `propertyGallery` — Property gallery

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyGallery/schema.ts)

| Campo | Tipo | Widget | Descripción | Req. |
|---|---|---|---|---|
| `hero` | string | `url` | Hero image URL | no |
| `images` | string | `textarea` | Hasta 4 URLs secundarias, una por línea | no |
| `total` | integer | — | Dispara el overlay "+N más" | no |
| `alt` | string | — | Alt text | no |

**Todas las imágenes son URLs en texto**, no referencias a contenido Plone. Un
propietario no puede subir fotos y elegirlas: tiene que hospedarlas fuera y pegar
la URL. Máximo estructural de 5 imágenes visibles
([PropertyGalleryView.tsx:26](../../frontend/packages/volto-estades-delta/src/blocks/PropertyGallery/PropertyGalleryView.tsx#L26)).
Layout único: hero 2×2 + cuatro celdas. Sin i18n (el placeholder
`(sense imatge)` está hardcodeado en catalán,
[:69](../../frontend/packages/volto-estades-delta/src/blocks/PropertyGallery/PropertyGalleryView.tsx#L69)).
Test activo + story.

### 2.3 `propertyDescription` — Property description

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyDescription/schema.ts)

| Campo | Tipo | Widget | Req. |
|---|---|---|---|
| `heading` | string | — | no |
| `body` | string | `textarea` | no |

⚠️ **`body` es `textarea`, no un widget rich-text**, y el View lo pinta como hijo
de texto ([PropertyDescriptionView.tsx:25](../../frontend/packages/volto-estades-delta/src/blocks/PropertyDescription/PropertyDescriptionView.tsx#L25)),
así que cualquier HTML se escapa y se ve literal. Es la causa del
`<p>Casa Riumar sleeps six…</p>` visible hoy en la demo. Sin negritas, listas ni
enlaces posibles. Sin i18n. Test `.disabled`. Story.

### 2.4 `propertyAmenities` — Property amenities

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyAmenities/schema.ts)

| Campo | Tipo | Widget | Default | Req. |
|---|---|---|---|---|
| `heading` | string | — | `'Comoditats'` | no |
| `items` | string | `textarea` | — | no |

El View soporta `groups` (amenities agrupadas con título)
([PropertyAmenitiesView.tsx:54-74](../../frontend/packages/volto-estades-delta/src/blocks/PropertyAmenities/PropertyAmenitiesView.tsx#L54-L74))
pero **`groups` no está expuesto en el schema** — la propia descripción del campo
admite que hay que editarlo "via REST API"
([schema.ts:18-21](../../frontend/packages/volto-estades-delta/src/blocks/PropertyAmenities/schema.ts#L18-L21)).
Funcionalidad construida e inalcanzable desde la UI.

`items` es texto libre separado por comas o pipes
([:28-37](../../frontend/packages/volto-estades-delta/src/blocks/PropertyAmenities/PropertyAmenitiesView.tsx#L28-L37)):
sin vocabulario, sin iconos, sin traducción. Sin i18n. Test `.disabled`. Story.

### 2.5 `propertyBookingForm` — Property booking form

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyBookingForm/schema.ts)

Tres fieldsets — el schema más completo del addon:

| Fieldset | Campo | Tipo | Default |
|---|---|---|---|
| Form | `heading` | string | `'Reserva'` |
| Form | `maxGuests` | integer | `6` |
| Pricing | `basePriceLowSeason` | number | — |
| Pricing | `basePriceMidSeason` | number | — |
| Pricing | `basePriceHighSeason` | number | — |
| Pricing | `cleaningFee` | number | — |
| Pricing | `touristTaxPerNight` | number | `1.1` |
| Channel | `source` | string (choices) | `direct_microsite` |
| Channel | `currency` | string | `'EUR'` |

`source` es el único campo del addon con `choices`:
`direct_microsite` (6%) / `direct_marketplace` (10%)
([schema.ts:43-47](../../frontend/packages/volto-estades-delta/src/blocks/PropertyBookingForm/schema.ts#L43-L47)).

Etiquetas de UI (`Entrada`, `Sortida`, `Adults`, `Nens`, `Bebès`, `Neteja`,
`Taxa turística`, `Total`, `Reservar`) y los mensajes de error **hardcodeados en
catalán** ([PropertyBookingFormView.tsx:68-76](../../frontend/packages/volto-estades-delta/src/blocks/PropertyBookingForm/PropertyBookingFormView.tsx#L68-L76),
[:137-273](../../frontend/packages/volto-estades-delta/src/blocks/PropertyBookingForm/PropertyBookingFormView.tsx#L137-L273)).
Sin i18n. **Único bloque con lógica de negocio testeada**: `pricing.ts` +
`pricing.test.ts`. Test RTL activo + story.

`onSubmit` es opcional ([:119](../../frontend/packages/volto-estades-delta/src/blocks/PropertyBookingForm/PropertyBookingFormView.tsx#L119))
y `PropertyView` no lo pasa → el botón "Reservar" no hace nada.

### 2.6 `propertyCalendar` — Property calendar

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/schema.ts)

| Campo | Tipo | Rango | Req. |
|---|---|---|---|
| `heading` | string | — | no |
| `monthsToShow` | integer | 1–2 | no |
| `unavailableDates` | array de string | YYYY-MM-DD | no |

Único bloque con `Edit` que hace algo más que renderizar el View: desactiva
`pointerEvents` para el preview
([PropertyCalendarEdit.tsx:25](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/PropertyCalendarEdit.tsx#L25)).
**Con i18n** (nombres de meses vía `intl.formatDate`, días de semana y leyenda
desde `propertyCalendarMessages`). Test activo. Sin story. Detalle en el §5 del
inventario visual.

### 2.7 `propertyMap` — Property map

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/PropertyMap/schema.ts)

| Campo | Tipo | Rango | Default doc. |
|---|---|---|---|
| `latitude` | number | — | fallback a `content.latitude` |
| `longitude` | number | — | fallback a `content.longitude` |
| `zoom` | integer | 1–18 | 14 |
| `height` | integer | px | 360 |

Único bloque con dependencia externa: **Leaflet + tiles de OpenStreetMap**.
El schema documenta `zoom` default 14, pero `PropertyView` le pasa `13`
hardcodeado ([PropertyView.tsx:159](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L159)).
Con i18n. Test activo. Sin story.

### 2.8 `aggregatorPropertyCard` — Aggregator property card

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/AggregatorPropertyCard/schema.ts)

Tres fieldsets, 12 campos — el schema con más campos del addon:

| Fieldset | Campos |
|---|---|
| Content | `title` (**único campo `required` de todo el addon**), `location`, `image` (url), `href` (url), `tag` |
| Meta | `capacity`, `bedrooms`, `bathrooms` (integer) |
| Commerce | `fromPrice`, `currency` (default `EUR`), `rating`, `ratingCount` |

Todos los datos se teclean a mano — **no hay enlace a un objeto `Property`**.
Duplicar aquí el título, precio y capacidad de una propiedad es teclearlos otra
vez y mantenerlos sincronizados manualmente. Test `.disabled`. Story.

### 2.9 `aggregatorFilters` — Aggregator filters

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/AggregatorFilters/schema.ts)

| Campo | Tipo | Req. |
|---|---|---|
| `heading` | string | no |

El schema documenta explícitamente que el bloque no almacena datos: lee y escribe
los `URL search params` en runtime
([schema.ts:1-7](../../frontend/packages/volto-estades-delta/src/blocks/AggregatorFilters/schema.ts#L1-L7)).
**Las zonas del desplegable están hardcodeadas en el View**, no en el schema:
añadir un municipio nuevo requiere tocar código. Con i18n. Test activo.

### 2.10 `aggregatorPropertyList` — Aggregator property list

[schema.ts](../../frontend/packages/volto-estades-delta/src/blocks/AggregatorPropertyList/schema.ts)

| Campo | Tipo | Rango | Req. |
|---|---|---|---|
| `heading` | string | — | no |
| `pageSize` | integer | 1–50 (default 12) | no |
| `emptyMessage` | string | — | no |

Único bloque que consulta el backend en vivo (Plone `@search`). Se sincroniza con
`aggregatorFilters` vía el evento `aggregatorFiltersChange` + URL params. Con
i18n. Test activo.

---

## 3. Cobertura de tests, stories e i18n

| Bloque | Test activo | Test `.disabled` | Story | SCSS | i18n |
|---|---|---|---|---|---|
| `propertyHero` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `propertyGallery` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `propertyDescription` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `propertyAmenities` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `propertyBookingForm` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `propertyCalendar` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `propertyMap` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `aggregatorPropertyCard` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `aggregatorFilters` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `aggregatorPropertyList` | ✅ | ❌ | ❌ | ✅ | ✅ |

**Patrón claro:** los bloques del Day 2 (hero, gallery, description, amenities,
bookingForm) tienen story pero **no i18n** y sus tests están mayormente
`.disabled`. Los del Day 3-4 (calendar, map, aggregator*) tienen **i18n y tests
activos** pero no story. Las convenciones cambiaron a mitad de camino y nadie
volvió atrás.

**Todos los bloques de la ficha de propiedad — los cinco que un propietario
vería — carecen de i18n.** Sus textos visibles están hardcodeados en catalán.
Un microsite en castellano, inglés, francés o alemán mostraría igualmente
"Comoditats", "Entrada", "Sortida", "Reservar" y "(sense imatge)".

---

## 4. Bloques core de Volto

**Ninguno desactivado, ninguno restringido.** El addon no toca la configuración
de bloques core. Siguen disponibles `text`, `image`, `video`, `listing`, `grid`,
`teaser`, `search`, `toc`, `html`, `maps`, etc.

Esto tiene una implicación práctica para el hito de reconstrucción: **parte del
camino ya está cubierta por bloques core** (`text` con rich-text real,
`image`/`grid` para galería con imágenes de Plone). No todo requiere bloque
propio nuevo.
