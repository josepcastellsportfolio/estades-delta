# Auditoría visual de las páginas demo — Estades Delta

**Fecha:** 2026-07-31
**Rama:** `docs/demo-pages-audit` (auditada desde `feat/content-rag-tenant-vector` @ `0d38908`)
**Tipo:** read-only. No se modificó `src/`, `backend/`, `packages/` ni configuración.
**URL auditada:** `http://estadesdelta.local:8081/josep-test/casa-demo-riumar`

---

## Resumen

La página de propiedad **no se pinta con bloques Volto**. Se pinta con una vista
React fija ([PropertyView.tsx](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx))
que instancia seis componentes `*View` pasándoles props construidas a mano en el
JSX. El campo `blocks` del objeto Property está literalmente vacío (`{}`).

Consecuencia directa para el hito siguiente: reconstruir la demo "solo con
bloques autogestionables" **no es una migración parcial, es partir de cero**.
Hoy no hay ni un bloque colocado en el contenido.

---

## 1. Inventario del contenido demo

### 1.1 Origen: creado a mano por la UI de Plone, no por fixture

Existe un fixture de demo content —
[demo_content.py](../../backend/src/estades/delta/setuphandlers/demo_content.py),
registrado como import step en
[import_steps.xml:20-27](../../backend/src/estades/delta/profiles/default/import_steps.xml#L20-L27)
y guardado tras `CREATE_DEMO_CONTENT=1` en
[demo_content.py:127](../../backend/src/estades/delta/setuphandlers/demo_content.py#L127)
— **pero nunca se ejecutó en esta instancia**. Tres pruebas:

1. El fixture crea en `/Plone/ca/properties/`
   ([demo_content.py:150](../../backend/src/estades/delta/setuphandlers/demo_content.py#L150));
   el objeto real está en `/josep-test/`, fuera del árbol de idioma.
2. El fixture define `municipality: "Riumar"`
   ([demo_content.py:36](../../backend/src/estades/delta/setuphandlers/demo_content.py#L36));
   el objeto real tiene `Deltebre`.
3. El fixture pone amenities como etiquetas legibles (`"Piscina", "Wi-Fi"…`,
   [demo_content.py:42](../../backend/src/estades/delta/setuphandlers/demo_content.py#L42));
   el objeto real tiene tokens crudos (`wifi, ac, kitchen, parking`).

No hay `profiles/default/content/`, ni `.zexp`, ni seed script alternativo.
**El contenido demo actual es artesanal y no reproducible desde el repo.**

### 1.2 Objetos existentes (contenido total de la instancia: 2)

| Path | portal_type | Título | Idioma | ¿Traducciones? | Origen |
|---|---|---|---|---|---|
| `/josep-test` | `Owner` | Josep Castells (test) | *(vacío)* | No | Manual vía UI — sin fichero de origen |
| `/josep-test/casa-demo-riumar` | `Property` | Casa Demo - Riumar | *(vacío)* | No | Manual vía UI — sin fichero de origen |

Verificado con `@search`: `items_total: 1` para `Property`, `1` para `Owner`.
Las tres Properties del fixture (`casa-demo-riumar`, `casa-test-riu-i-mar`,
`casa-test-capvespre` bajo `/ca/properties/`) **no existen**. Las paletas
`riu-i-mar` y `capvespre` no tienen hoy ningún objeto que las ejercite.

### 1.3 El dato clave: `blocks` vacío

Del volcado [raw/casa-demo-riumar.json](raw/casa-demo-riumar.json):

```
blocks:        {}            ← 0 bloques
blocks_layout: {"items": []} ← 0 items
layout:        "view"
```

### 1.4 Estado de campos (65 claves: 42 con valor, 23 vacías)

**Con valor:** `title`, `subtitle`, `short_name`, `municipality` (Deltebre),
`zone` (Riumar), `latitude` 40.7148, `longitude` 0.7506, `max_guests` 6,
`bedrooms` 3, `bathrooms` 2, `beds_double` 2, `beds_single` 2, `amenities`
`[wifi, ac, kitchen, parking]`, `base_price_low/mid/high` 85/110/160,
`cleaning_fee` 50, `tourist_tax_per_night` 1.10, `minimum_stay_low` 2,
`minimum_stay_high` 4, `check_in_time` 16:00, `check_out_time` 11:00,
`palette` `arrossar`, `long_description` (un solo `<p>`, 103 caracteres, en
inglés), `review_state` published.

**Vacíos:** `blocks`, `blocks_layout`, `description`, `address`, `house_rules`,
`owner_ref`, `custom_domain`, `beds24_property_id`, `language`, los tres
`chatbot_*`, `subjects`, `rights`, `relatedItems`, `expires`.

Tres vacíos con consecuencia directa:

- **`owner_ref: null`** — la Property no está enlazada a su Owner por campo,
  solo por contención de carpeta. Una sección "Anfitrión" no tendría fuente.
- **`custom_domain: null`** — el resolver dinámico Opción B no puede mapear esta
  Property; de ahí que haga falta el `VOLTO_TENANT_MAP` manual.
- **`language: ""`** — objeto fuera del árbol multilingüe; sin traducciones ni
  posibilidad de tenerlas en su ubicación actual.

**Sin imágenes.** `items_total: 0` — la Property no tiene hijos y `image_scales`
ni siquiera aparece en la respuesta REST.

---

## 2. Anatomía de la página de propiedad

### 2.1 Registro de la vista

[views.ts:16](../../frontend/packages/volto-estades-delta/src/config/views.ts#L16)
asigna `settings.contentTypesViews.Property = PropertyView`. Es decir: **todo
objeto `Property` se renderiza siempre con esta plantilla fija**, sin importar
lo que contenga su campo `blocks`. Un editor no puede elegir otra vista.

### 2.2 El patrón: bloques invocados como componentes, no como bloques

[PropertyView.tsx:113-183](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L113-L183)
importa seis componentes `*View` desde `src/blocks/` y los invoca con un objeto
`data` **literal escrito en el JSX**. Ejemplo real
([PropertyView.tsx:123-129](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L123-L129)):

```
data={{ '@type': 'propertyDescription', heading: 'Sobre la propietat', body: bodyText }}
```

El `heading` `'Sobre la propietat'` es una cadena hardcodeada en el JSX, no un
valor editable. Lo mismo con `'Comoditats'`
([:136](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L136)),
`'Disponibilitat'`
([:146](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L146))
y `'Reserva'`
([:174](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L174)).

**En ningún punto de la vista se lee `content.blocks`.** Los componentes viven
en `src/blocks/` y están registrados en el editor, pero en esta página funcionan
como componentes de presentación acoplados, no como bloques.

### 2.3 Tabla de secciones (orden real de arriba a abajo)

Fuente de datos: `campo` = campo del content type · `hardcode` = literal en JSX ·
`derivado` = calculado en cliente.

| # | Sección visible | Componente | Fichero:línea | Fuente de datos | ¿Autogestionable? | Variantes hoy |
|---|---|---|---|---|---|---|
| 0 | Breadcrumb + header/footer Plone | *(chrome Volto core)* | fuera del addon | navegación Plone | No — core | — |
| 1 | Título `<h1>` | `Heading` | [PropertyView.tsx:86-88](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L86-L88) | campo `title` | Sí — campo editable | ninguna |
| 2 | Subtítulo | `<p>` inline | [PropertyView.tsx:89-100](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L89-L100) | campo `subtitle` | Parcial — texto sí, estilo no (`style={{}}` inline) | ninguna |
| 3 | Meta ubicación (`Deltebre · Riumar`) | `<div>` | [PropertyView.tsx:101-103](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L101-L103) | campos `municipality` + `zone`, unidos por `·` | Parcial — valores sí, formato no ([:74](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L74)) | ninguna |
| 4 | Pills de datos (`6 hostes`, `3 hab`, `2 banys`) | `Pill` en `Stack` | [PropertyView.tsx:104-110](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L104-L110) | derivado de `max_guests`/`bedrooms`/`bathrooms`; **sufijos hardcoded en catalán** ([:77-79](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L77-L79)) | No — hardcode | ninguna |
| 5 | Galería (5 celdas) | `PropertyGalleryView` | [PropertyView.tsx:113-118](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L113-L118) | **ninguna** — solo se pasa `alt`; `hero` e `images` nunca se rellenan | No — hardcode | 1 layout fijo (hero 2×2 + 4 celdas) |
| 6 | Descripción | `PropertyDescriptionView` | [PropertyView.tsx:122-130](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L122-L130) | campo `long_description` → fallback `description` ([:67-72](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L67-L72)) | Parcial — texto sí, heading no | ninguna |
| 7 | Comoditats | `PropertyAmenitiesView` | [PropertyView.tsx:132-140](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L132-L140) | campo `amenities` | Parcial — lista sí, heading y agrupación no | soporta `groups` pero la vista **nunca los pasa** |
| 8 | Disponibilitat (calendario) | `PropertyCalendarView` | [PropertyView.tsx:142-151](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L142-L151) | `content.unavailable_dates` — **campo inexistente en el schema** | No — hardcode | `monthsToShow` fijo a 2 |
| 9 | Com arribar-hi (mapa) | `PropertyMapView` | [PropertyView.tsx:153-167](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L153-L167) | campos `latitude`/`longitude`; `zoom: 13` hardcoded | Parcial — coords sí, zoom/heading no | ninguna |
| 10 | Reserva (aside sticky) | `PropertyBookingFormView` | [PropertyView.tsx:170-184](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L170-L184) | campos `base_price_*`, `cleaning_fee`, `tourist_tax_per_night`, `max_guests`; `source` hardcoded | Parcial — precios sí, textos y `source` no | ninguna |

### 2.4 Secciones esperables que NO existen

Verificado por ausencia en el JSX y en el DOM renderizado:

- **Normas de la casa** — el campo `house_rules` existe en el schema
  ([property.py](../../backend/src/estades/delta/content/property.py)) pero
  `PropertyView` **nunca lo renderiza**. Dato capturable, invisible.
- **Política de cancelación** — no existe ni campo ni sección.
- **Anfitrión / propietario** — no se renderiza. `owner_ref` está vacío.
- **Reseñas** — no existe.
- **Propiedades relacionadas** — no existe.
- **Check-in / check-out** — `check_in_time` (16:00) y `check_out_time` (11:00)
  están rellenos pero **no se muestran en ninguna parte**.
- **`minimum_stay_low/high`** — rellenos (2 y 4), no mostrados ni aplicados como
  validación en el formulario de reserva.
- **CTA de reserva funcional** — el botón existe pero `PropertyView` **no pasa
  `onSubmit`** ([PropertyView.tsx:171-183](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L171-L183));
  el handler es opcional
  ([PropertyBookingFormView.tsx:119](../../frontend/packages/volto-estades-delta/src/blocks/PropertyBookingForm/PropertyBookingFormView.tsx#L119)),
  así que el clic **no hace nada**.

### 2.5 Layout, grid y espaciado

De [PropertyView.scss](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.scss):

- **Contenedor**: `max-width: 1180px`, centrado, `padding: 0 var(--ed-space-6)`
  ([:7-14](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.scss#L7-L14)).
- **Ritmo vertical**: `gap: var(--ed-space-12)` entre secciones del contenedor
  ([:13](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.scss#L13))
  y el mismo gap entre bloques de la columna principal
  ([:49-53](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.scss#L49-L53)).
  Todo sale de tokens `--ed-*`, no de valores sueltos.
- **Grid de dos columnas**: único breakpoint en `min-width: 1024px` →
  `grid-template-columns: 1fr 360px`
  ([:37-42](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.scss#L37-L42)).
  Por debajo de 1024px es una sola columna y el formulario de reserva cae al
  final de la página.
- **Aside sticky**: `position: sticky; top: var(--ed-space-8)`
  ([:44-47](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.scss#L44-L47)).
- **Paleta**: `PaletteScope` envuelve todo como `<article>` y estampa
  `data-palette` ([PropertyView.tsx:83](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L83)),
  leyendo `content.palette` con fallback a `arrossar`
  ([:53-57](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L53-L57)).
  Confirmado en el DOM: `data-palette="arrossar"`.

**El orden de las secciones es el orden del JSX.** No hay mecanismo de
reordenación: cambiar el orden requiere editar y desplegar el TSX.

### 2.6 Render condicional

| Sección | Condición | Fichero:línea |
|---|---|---|
| Subtítulo | `content.subtitle` truthy | [:89](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L89) |
| Meta ubicación | `headerMeta` no vacío | [:101](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L101) |
| Pills | `facts.length > 0` | [:104](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L104) |
| Descripción | `bodyText` truthy | [:122](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L122) |
| Comoditats | `content.amenities` truthy | [:132](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L132) |
| Mapa | `latitude \|\| longitude` | [:153](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L153) |
| **Galería** | **ninguna — siempre renderiza** | [:113](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L113) |
| **Calendario** | **ninguna — siempre renderiza** | [:142](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L142) |
| **Reserva** | **ninguna — siempre renderiza** | [:171](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L171) |

### 2.7 Qué se ve realmente en pantalla hoy

Texto visible extraído del DOM renderizado en
`/josep-test/casa-demo-riumar`:

```
Casa Demo - Riumar
Demo property in Riumar (Delta de l Ebre)
Deltebre · Riumar
[6 hostes] [3 hab] [2 banys]
(sense imatge) (sense imatge) (sense imatge) (sense imatge) (sense imatge)
Sobre la propietat
<p>Casa Riumar sleeps six, beachfront in the Ebro Delta. Dogs allowed…</p>
Comoditats
[wifi] [ac] [kitchen] [parking]
Disponibilitat  ‹ ›  juliol del 2026 … agost del 2026 … Disponible Ocupat Passat
Com arribar-hi
Reserva  Entrada Sortida Adults Nens Bebès
160 € × 3 nits → 480 €  ·  Neteja 50 €  ·  Taxa turística 6,60 €  ·  Total 536,60 €
[Reservar]
```

Cuatro defectos visibles, anotados sin corregir (fuera de alcance):

1. **Las etiquetas `<p>` se imprimen literalmente.**
   [PropertyDescriptionView.tsx:25](../../frontend/packages/volto-estades-delta/src/blocks/PropertyDescription/PropertyDescriptionView.tsx#L25)
   renderiza `{data.body}` como hijo de texto, escapando el HTML del campo
   rich-text. En pantalla se lee `<p>Casa Riumar sleeps six…</p>`.
2. **Amenities crudas.** Se muestran los tokens `wifi`, `ac`, `kitchen`,
   `parking` en vez de etiquetas legibles. No hay vocabulario que los traduzca.
3. **Galería vacía.** Cinco celdas "(sense imatge)"
   ([PropertyGalleryView.tsx:67-71](../../frontend/packages/volto-estades-delta/src/blocks/PropertyGallery/PropertyGalleryView.tsx#L67-L71)
   y [:97-109](../../frontend/packages/volto-estades-delta/src/blocks/PropertyGallery/PropertyGalleryView.tsx#L97-L109)),
   porque `PropertyView` nunca pasa `hero` ni `images`.
4. **Mapa vacío en SSR.** `propertyMap__container` sale sin hijos: Leaflet se
   monta solo en cliente vía `useEffect`.

**Mezcla de idiomas en una sola pantalla**: chrome en castellano, secciones en
catalán, contenido en inglés.

### 2.8 El microsite por subdominio no funciona hoy

`http://casa-demo.estadesdelta.local:8081/` devuelve **200 pero sirve la página
de bienvenida por defecto de Plone** (`<h1>Project Title</h1>`, "Welcome to your
new Plone site!"), no la Property. Causa: `VOLTO_TENANT_MAP` está apuntado a
`/josep-test/casa-demo-riumar` en el working tree (cambio sin commitear), y la
Property tiene `custom_domain: null`, así que el resolver dinámico tampoco la
mapea. La vista de propiedad **solo es accesible por su path directo**.

---

## 3. Huecos detectados

- **`docs/session-logs/` no existe** — la convención real es `docs/sessions/`.
- **`docs/adr/` no existe** — la convención real es `docs/ADRs/`.
- **ADRs 001-012 y 014-020 citados en CLAUDE.md §14 no existen como fichero.**
  Solo están escritos el 013 y los 021-024.
- **`unavailable_dates` no existe en el schema de `Property`**, pero
  `PropertyView` lo lee ([:149](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L149))
  y `PropertyContent` lo declara ([:42](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L42)).
  El calendario nunca podrá mostrar ocupación con el modelo actual.
- **Las 2 Properties del fixture con paletas `riu-i-mar` y `capvespre` no
  existen**, así que dos de las tres paletas no están validadas visualmente.
- **Los puertos 8080 y 3000 no están publicados al host** — todo pasa por
  Traefik en `:8081`, al contrario de lo que indica CLAUDE.md §4.

---

## 4. Design system y átomos

### 4.1 Los 7 átomos (Day 2)

Todos en [components/atoms/](../../frontend/packages/volto-estades-delta/src/components/atoms/),
con el patrón `Atom.tsx + Atom.scss + Atom.test.tsx + Atom.stories.tsx + index.ts`.

| Átomo | Props principales | Variantes / estados |
|---|---|---|
| `Button` | `variant`, `size`, `block`, `as` | 3 variantes × 3 tamaños, `as="a"`, slots de icono, `disabled` |
| `Card` | `elevation`, `interactive`, `as` | elevación 0–3, hover-lift opcional, slots header/body/footer |
| `Pill` | `tone`, `outline`, `icon` | 7 tonos, contorno opcional |
| `Stack` | `direction`, `gap`, `wrap`, `as` | horizontal/vertical, gap por escala de tokens |
| `Heading` | `level`, `tone`, `decorative`, `size` | `h1`–`h6` |
| `Price` | `amount`, `currency`, `size`, `strikethrough` | formato `Intl` |
| `Rating` | `value`, `max`, `count`, `size` | relleno fraccional de estrellas |

**Uso real en la ficha de propiedad:** solo `Heading`, `Pill`, `Stack`, `Price` y
`Button`. **`Card` y `Rating` no se usan en ninguna parte de la página de
propiedad** — únicamente en `AggregatorPropertyCard`. Es decir: la ficha no tiene
ninguna tarjeta ni ninguna valoración, y el átomo `Rating` existe sin que exista
un modelo de reseñas detrás.

### 4.2 Las 3 paletas

Definidas como **CSS custom properties** en
[palettes.scss](../../frontend/packages/volto-estades-delta/src/theme/palettes.scss),
una por selector `[data-palette='…']`, más un `:root` espejo de Arrossar como
fallback. **25 propiedades por paleta, con la misma forma exacta** — sin herencia
entre ellas.

| Paleta | Primario | Fondo | Uso previsto (según el campo backend) |
|---|---|---|---|
| `arrossar` | `#2d5f3f` verde rural | `#faf7f0` | Chalets de campo, masies, agroturismes |
| `riu-i-mar` | `#2d4a5f` navy boutique | `#f8f7f4` | Costa, náutico, ornitológico |
| `capvespre` | `#b5723a` ocre | — | Retiros de experiencia, photo-stays |

**Selección — sí es autogestionable.** `palette` es un `schema.Choice` con
vocabulario `estades.delta.vocabularies.Palettes`, `default="arrossar"`,
`required=True`
([property.py:170-183](../../backend/src/estades/delta/content/property.py#L170-L183)),
con una `description` que explica al editor cuándo usar cada una. Un propietario
la cambia desde el formulario de edición de Plone, sin tocar código.

**Aplicación:** `PaletteScope` estampa `data-palette` en su elemento y valida el
valor en runtime contra la lista, con fallback a `arrossar`
([PaletteScope.tsx:41](../../frontend/packages/volto-estades-delta/src/components/PaletteScope/PaletteScope.tsx#L41)).
El marketplace fija Arrossar en `<body>` vía `appExtras`
([palette.ts:14-26](../../frontend/packages/volto-estades-delta/src/config/palette.ts#L14-L26)).
Confirmado en el DOM renderizado: `data-palette="arrossar"`.

**Límite:** la elección es entre **tres opciones cerradas**. Un propietario no
puede ajustar un color concreto, ni cambiar la tipografía (fijada a DM Serif
Display + DM Sans por decisión de ADR-013), ni el layout.

**Sin validar visualmente:** no existe hoy ningún objeto con `riu-i-mar` ni
`capvespre`, así que dos de las tres paletas nunca se han visto en una página real.

### 4.3 Inventario de tokens

[tokens.scss](../../frontend/packages/volto-estades-delta/src/theme/tokens.scss)
define, con namespace `--ed-*`: escala de espaciado de 13 pasos (base 4px),
9 tamaños tipográficos (ratio 1.25, base 16px), 3 pesos, 5 alturas de línea,
2 familias, 5 radios, 3 sombras y 4 breakpoints.

**69 tokens definidos en total (tokens + paletas). 51 se usan; 18 no.**

Sin usar: los 4 `--ed-bp-*` (breakpoints — los `@media` están escritos con
valores literales, p. ej. `1024px` en
[PropertyView.scss:37](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.scss#L37)),
`--ed-color-accent-hover`, `--ed-color-info`, `--ed-color-secondary-contrast`,
`--ed-color-secondary-hover`, `--ed-font-size-4xl`, `--ed-line-height-loose`,
`--ed-line-height-normal`, `--ed-line-height-snug`, `--ed-radius-xl`,
`--ed-space-0`, `--ed-space-24/32/48/64`.

El grueso del ritmo vertical de la ficha se apoya en `--ed-space-12` y
`--ed-space-6`; los pasos grandes (24–64) están definidos y no se usan.

---

## 5. Calendario y disponibilidad

### 5.1 Qué lo pinta

[PropertyCalendarView.tsx](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/PropertyCalendarView.tsx)
— **componente propio, sin librería de fechas externa**. La rejilla se construye
con `Date` nativo ([:76-121](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/PropertyCalendarView.tsx#L76-L121)),
semana empezando en lunes ([:54](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/PropertyCalendarView.tsx#L54)).
Es el único bloque de la ficha con i18n real: nombres de mes vía
`intl.formatDate` y días/leyenda desde `propertyCalendarMessages`.

### 5.2 De dónde salen los datos: **de ningún sitio**

El View une dos fuentes ([:192-196](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/PropertyCalendarView.tsx#L192-L196)):
`data.unavailableDates` (block data) y `content.unavailable_dates` (objeto Plone).

**Ninguna de las dos tiene datos hoy:**

- `content.unavailable_dates` — **el campo `unavailable_dates` NO existe en el
  schema de `Property`**. Búsqueda en todo `backend/src/`: cero resultados. El
  campo solo existe en las interfaces TypeScript del frontend
  ([PropertyView.tsx:42](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L42),
  [PropertyCalendarView.tsx:24](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/PropertyCalendarView.tsx#L24)).
  La REST API nunca lo devolverá.
- `data.unavailableDates` — solo se rellenaría desde el sidebar del bloque, que
  no se renderiza (§0 de [blocks-catalog.md](blocks-catalog.md)).

**Resultado: el calendario muestra hoy todos los días como disponibles**, siempre.
Es una decoración, no información.

### 5.3 Beds24: stub nunca invocado

[beds24.py](../../backend/src/estades/delta/adapters/beds24.py) define el
protocolo `IBeds24Adapter` y `Beds24StubAdapter`, que devuelve una ventana de
60 días abierta y escribe logs.

**Verificado: `sync_calendar`, `Beds24StubAdapter` y `beds24` no se referencian
desde ningún otro fichero del backend.** El único rastro fuera del módulo es el
campo `beds24_property_id` en el content type
([property.py:146](../../backend/src/estades/delta/content/property.py#L146)).
No hay endpoint `@beds24-webhook` registrado — los endpoints que existen son
`@messaging-webhook`, `@conversations`, `@approve-response`, `@assistant-search`
y `@assistant-chat` ([api/configure.zcml](../../backend/src/estades/delta/api/configure.zcml)).

Lo mismo aplica a `stripe_connect.py`: stub completo, **nunca llamado**.

Falta además la pieza intermedia: el stub devuelve `AvailabilityWindow(start, end,
available)`, pero el frontend espera una lista plana de `YYYY-MM-DD`. Nadie
escribe la conversión.

### 5.4 ¿Bloque o parte fija de la vista?

**Las dos cosas, y ahí está el problema.** Está registrado como bloque
`propertyCalendar`, pero en la ficha se renderiza como sección fija dentro de
`<section className="propertyView__calendar">`
([PropertyView.tsx:142-151](../../frontend/packages/volto-estades-delta/src/components/PropertyView/PropertyView.tsx#L142-L151)),
**sin condición** — siempre aparece, aunque no haya datos.

### 5.5 Opciones de configuración

| Opción | ¿Configurable? | Nota |
|---|---|---|
| Nº de meses | En el schema (1–2) | La ficha lo fija a `2` en el JSX |
| Heading | En el schema | La ficha lo fija a `'Disponibilitat'` |
| Fechas no disponibles | En el schema | Inalcanzable sin sidebar |
| Mínimo de noches | ❌ | `minimum_stay_low/high` existen y no se usan |
| Precio por noche en la celda | ❌ | No implementado |
| Leyenda | ❌ | Fija: Disponible / Ocupat / Passat |
| Idioma | ✅ automático | Vía `react-intl` |

Navegación: adelante sin límite, atrás bloqueada antes del mes actual
([:228-230](../../frontend/packages/volto-estades-delta/src/blocks/PropertyCalendar/PropertyCalendarView.tsx#L228-L230)).
Las celdas **no son seleccionables**: no hay `onClick` en los días, así que el
calendario no alimenta al formulario de reserva. Son dos islas independientes.

### 5.6 ¿Más de un calendario por propiedad?

**No.** Verificado en el content type: `Property` no tiene ningún campo de
colección de unidades/habitaciones, y `Booking` referencia `property_ref` a una
Property entera. El modelo asume **una propiedad = una unidad reservable**. Un
propietario con dos apartamentos en el mismo edificio necesita dos Properties, y
por tanto dos microsites y dos fichas.

### 5.7 Comportamiento ante fallo del channel manager

**No existe: no hay llamada de red que pueda fallar.** El componente es
síncrono, sin `fetch`, sin estado de carga, sin `error`, sin estado vacío
diferenciado. Cuando se conecte Beds24 habrá que añadir los tres estados desde
cero.

---

## 6. Capturas de pantalla — no realizadas

No hay Playwright (ni config ni dependencia). **Cypress 13.17.0 sí está
instalado** ([frontend/cypress.config.js](../../frontend/cypress.config.js) y
binario en `~/.cache/Cypress/`), pero **no arranca en esta máquina**:

```
Cypress: error while loading shared libraries: libatk-1.0.so.0:
cannot open shared object file: No such file or directory
```

Arreglarlo exige instalar librerías de sistema con `sudo apt`. El prompt prohíbe
instalar nada, así que **el bloque se salta**. `docs/audit/screenshots/` no se
crea.

En su lugar, el §2.7 documenta el texto visible extraído del DOM renderizado
realmente servido por el frontend, que cubre la misma necesidad de verificación.

---

## 7. Gap analysis

### 7.A Tabla de brechas

| Elemento visual | Cómo se produce hoy | Qué haría falta | Bloque nuevo / extensión / campo | Esfuerzo |
|---|---|---|---|---|
| **Sidebar de edición de bloques** | No existe: los `edit` propios sustituyen a `DefaultEdit`, que es quien monta `SidebarPortal` | Añadir `SidebarPortal`+`BlockDataForm` a cada `edit`, o eliminar los `edit` y dejar que Volto use `DefaultEdit` | Extensión de los 10 bloques | **S** (desbloquea todo lo demás) |
| **Orden de las secciones** | Orden del JSX de `PropertyView` | Renderizar `content.blocks` con `RenderBlocks` en vez de la composición fija | Refactor de `PropertyView` | **M** |
| **Galería con fotos reales** | `PropertyGalleryView` sin `hero`/`images`; 5 placeholders | Widget de imagen de Plone (subir y elegir), no URL en texto | Extensión de `propertyGallery` + campo imagen | **M** |
| **Texto con formato** | `textarea` + render como texto → HTML escapado visible | Widget rich-text y render como HTML | Extensión de `propertyDescription` (o usar bloque `text` de core) | **S** |
| **Amenities legibles** | Tokens crudos `wifi, ac, kitchen` | Vocabulario Plone con etiquetas traducidas + iconos | Campo `amenities` → `Choice` con vocabulario | **M** |
| **Amenities agrupadas** | El View lo soporta; `groups` no está en el schema | Exponer `groups` en el schema | Extensión de `propertyAmenities` | **S** |
| **Normas de la casa** | El campo `house_rules` existe y no se renderiza | Sección/bloque que lo pinte | Bloque nuevo o sección en la vista | **S** |
| **Check-in / check-out** | Campos rellenos, nunca mostrados | Sección de "información práctica" | Bloque nuevo | **S** |
| **Disponibilidad real** | Calendario siempre "todo libre"; campo inexistente | Campo `unavailable_dates` en el content type + conversión desde `AvailabilityWindow` + wiring del stub | Campo backend + adapter | **L** |
| **Reservar funcional** | Botón sin `onSubmit`; Stripe stub nunca llamado | Endpoint `@create-booking-intent` + wiring Stripe | Backend + frontend | **L** |
| **Anfitrión** | No existe; `owner_ref` vacío | Rellenar `owner_ref` + bloque que lo lea | Bloque nuevo | **M** |
| **Reseñas** | No existe (el átomo `Rating` sí) | Modelo de contenido + bloque | Content type + bloque | **L** |
| **Política de cancelación** | No existe ni campo ni sección | Campo + sección | Campo + bloque | **S** |
| **Variantes de bloque** | `variations: []` en los 10 | Declarar `variations` y ramificar el View | Extensión por bloque | **M** |
| **Textos de la ficha traducidos** | Hardcodeados en catalán en los 5 bloques de propiedad | Migrar a `react-intl` como ya hacen calendar/map | Extensión de 5 bloques | **M** |
| **Microsite por subdominio** | Sirve la home por defecto de Plone | Rellenar `custom_domain` y mover el contenido al árbol `/ca/` | Datos + fixture | **S** |
| **Contenido demo reproducible** | Creado a mano, fuera del árbol de idioma | Ejecutar el fixture existente en instancia limpia | Ninguno — ya está escrito | **S** |

### 7.B Lo que un propietario NO puede cambiar hoy sin tocar código

Ordenado por impacto comercial percibido. 🔴 = bloqueante para vender a un
propietario exigente.

1. 🔴 **No puede poner ni una sola foto de su casa.** Las imágenes se configuran
   pegando URLs externas, y ese formulario no se muestra. Hoy su ficha enseña
   cinco recuadros que dicen "(sense imatge)". Para un alquiler vacacional, esto
   solo es inaceptable.
2. 🔴 **No puede editar ningún bloque.** Al seleccionar un bloque, el panel
   lateral aparece vacío. Todo lo "autogestionable" lo es solo sobre el papel.
3. 🔴 **No puede dar formato a su descripción.** Sin negritas, listas ni enlaces
   — y hoy la ficha muestra literalmente `<p>` y `</p>` alrededor del texto.
4. 🔴 **No puede recibir una reserva.** El botón "Reservar" calcula el precio
   correctamente y al pulsarlo no ocurre nada.
5. 🔴 **Su calendario miente.** Muestra todos los días libres siempre, sin
   conexión con su ocupación real. Un huésped puede pedir una fecha ya ocupada.
6. 🔴 **No puede reordenar las secciones de su ficha.** El orden — galería,
   descripción, comodidades, calendario, mapa — es el mismo para todos y solo se
   cambia editando código.
7. **No puede publicar sus normas de la casa**, aunque el formulario de Plone se
   las pide y guarda el texto. Nunca aparece en la web.
8. **No puede mostrar su hora de entrada y salida**, aunque también las tiene
   guardadas (16:00 / 11:00).
9. **No puede presentarse como anfitrión.** No hay sección de propietario.
10. **No puede mostrar reseñas** de huéspedes anteriores — probablemente su
    argumento de venta más fuerte frente a Booking.
11. **No puede elegir entre formatos de galería.** Un único mosaico fijo: sin
    carrusel, sin pantalla completa, sin lightbox.
12. **No puede añadir una sección propia** (una tabla de tarifas, un apartado de
    "qué visitar en el Delta", una nota de temporada).
13. **Sus comodidades se ven como `wifi`, `ac`, `kitchen`** en vez de "Wi-Fi",
    "Aire acondicionado", "Cocina equipada".
14. **No puede publicar su política de cancelación**, aunque el modelo comercial
    la define (moderate, 50% si cancela con más de 14 días).
15. **No puede ofrecer su microsite en otro idioma** con las secciones
    traducidas: los rótulos están fijados en catalán aunque el visitante llegue
    en castellano o inglés.
16. **No puede afinar los colores ni la tipografía** — solo elegir entre tres
    paletas cerradas. *(Esto es una decisión de diseño consciente, ADR-013, no un
    defecto.)*

**Lectura comercial:** de las seis primeras, cinco (1, 2, 3, 4, 5) impiden que la
ficha funcione como producto vendible. La 6 es la que un propietario exigente
notará al comparar con la competencia. Las brechas 1-4 son además las de menor
esfuerzo técnico relativo: la 2 (sidebar) es **S** y desbloquea la 1 y la 3.
