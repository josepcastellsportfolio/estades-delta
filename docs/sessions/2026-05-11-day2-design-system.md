# Day 2 — Design system, atoms, blocks, PropertyView

**Branch:** `feature/design-system-day2`
**Status:** rama abierta, PR pendiente tras CI verde.

## Lo que se hizo

### Bloque 1 — Design system (`fcfe2fd`)
- `frontend/packages/volto-estades-delta/src/theme/`:
  - `tokens.scss` — spacing, typography (sizes + weights + line-heights),
    radii, shadows, font families, breakpoints. Namespace `--ed-*`.
  - `fonts.scss` — `@import` único de DM Serif Display (400 + italic) + DM
    Sans (400/500/700 + italic 400). Nada superfluo.
  - `palettes.scss` — 3 paletas en `[data-palette="…"]` + fallback `:root`
    espejo de Arrossar. Cada paleta exporta 25 custom properties con la
    misma forma exacta — no hay herencia entre paletas.
  - `reset.scss` — body+h1/h2 con DM Serif Display, h3+ con DM Sans
    (regla de jerarquía documentada).
  - `tokens.ts` — mirror JS de PALETTES, SPACING, BREAKPOINTS, FONT_FAMILY
    para casos donde no se puede leer la CSS variable.
- `components/PaletteScope` — wrapper que setea `data-palette` en su
  elemento, valida runtime contra la lista, fallback a arrossar. Tests
  Jest + Storybook (Arrossar/RiuIMar/Capvespre/AllPalettes).
- Backend: campo `palette` (Choice) en Property con vocabulary `Palettes`
  (arrossar/riu-i-mar/capvespre, default arrossar, required). Upgrade
  step 1000→1001 que back-fillea Properties existentes.
- ADR `docs/ADRs/013-multi-palette-theming.md`.
- `docs/DESIGN_TOKENS.md`.

### Bloque 2 — Atoms (`53a626c`)
Siete primitivos en `components/atoms/`:
- **Button** — primary/secondary/ghost × sm/md/lg, opcional `block`,
  `as="a"`, ref forwarding, leading/trailing icon slots.
- **Card** — article-por-defecto con elevation 0..3, opcional
  `interactive` hover-lift, slots header/body/footer.
- **Pill** — 7 tonos, opcional `outline`, opcional `icon`.
- **Stack** — flex layout con gap por escala de tokens.
- **Heading** — `h1`–`h6` con `tone`, `decorative`, `size`.
- **Price** — Intl currency display con suffix, size, strikethrough.
- **Rating** — 0..N estrellas con fractional fill, count opcional.

Cada atom: Atom.tsx + Atom.scss + Atom.test.tsx + Atom.stories.tsx + index.ts.
Barrel en `atoms/index.ts`. Total: 28 nuevas Jest assertions.

ATOMS.md documenta las reglas (palette-agnostic, no data side-effects,
no icon library) + catalog + how-to-add-a-new-atom.

### Bloque 3 — Refactor blocks Day 1 (`0f93fb3`)
PropertyHero ahora compone con Heading + Stack + Pill, dos modos:
- Sin imagen: surface flat, paleta default.
- Con imagen: background + scrim overlay, texto invertido.

PropertyDescription compone con Heading + Stack, body con `max-width: 65ch`.

Tests + stories AcrossPalettes para ambos.

### Bloque 4 — Bloques nuevos (`b9e1050`)
Cuatro bloques nuevos en `src/blocks/`:
- **PropertyGallery** — CSS grid: hero (2 cols × 2 rows) + 4 secundarias
  (2x2). Mobile: stack. "+N más" overlay en última cell cuando
  `total > visible`. `onOpen(index)` callback para lightbox upstream.
- **PropertyAmenities** — flat o grouped pills. Acepta `items` como
  string con `,`/`|` o array. Returns null cuando vacío.
- **AggregatorPropertyCard** — la card del listing del marketplace.
  Surface + foto + título + location + meta + rating + "des de" precio
  + CTA "Veure". `Card interactive` para hover-lift.
- **PropertyBookingForm** — fechas + 3 contadores de huéspedes +
  breakdown live + total + Reservar. Validación de date range y
  capacidad. `onSubmit(payload)` para upstream Stripe.

Nueva utility `pricing.ts` con engine mock que replica la forma del
endpoint backend (Phase 2). 8 specs cubren season lookup, niños/bebés
exemption, commission rates microsite/marketplace, vector de rates por
noche.

5 bloques registrados en `config/blocks.ts` bajo `estadesDelta` group.

### Bloque 5 — PropertyView (`da2772f`)
Template completo del Property content type:
- Lee `content.palette` (acepta `{token}` REST shape o string plain) y
  envuelve la página en `<PaletteScope palette={...}>`.
- Layout: header (h1 decorative + subtitle + meta pills) → gallery
  full-width → main two-column (left: description + amenities;
  right: sticky booking form aside).
- Mobile-first: aside cae debajo en < 1024px.

Registrado en `config.views.contentTypesViews.Property` via nuevo
`src/config/views.ts` step.

### Estilo (`7c247c8`)
- `prettier --write` sobre todos los archivos del addon (29 cambios).
- Newsfragments en news/ y volto-estades-delta/news/.

## Verificación end-to-end

CSS bundle del frontend (rebuilt) contiene:
- 3 selectores `[data-palette=…]` (las 3 paletas compiladas).
- DM Sans + DM Serif Display @imports.
- Custom properties `--ed-color-primary-default` etc.

Backend REST API:
- `Property` type expone campo `palette` como `{title, token}`.
- "Casa Demo - Riumar" tiene `palette.token = arrossar` (default + upgrade).
- "Casa Test B - Riu i Mar" tiene `palette.token = riu-i-mar` (test data).
- "Casa Test C - Capvespre" tiene `palette.token = capvespre` (test data).

## Decisiones técnicas no triviales

- `MarketplaceBodyPalette` finalmente usa `useEffect` en cliente para setear
  `<body data-palette>`. Probado primero con `<Helmet bodyAttributes>` y
  con `<Helmet><body data-palette/></Helmet>`; ninguno sobrevivía el SSR de
  Volto 18 (react-side-effect bundled). El paint inicial es correcto
  porque `:root` fallback espejea Arrossar.
- `appExtras` `match: { path: '/', exact: false, strict: false }` —
  react-router-config requiere objeto, no string vacío.
- Vocabulary tokens vienen del backend como `{token, title}` shape.
  PropertyView usa una función helper para aceptar las dos formas.
- Webpack tree-shake elimina SCSS de atoms hasta que se usen. Eso es
  correcto — los atoms entran al bundle cuando un bloque importa el TSX.

## Próximo paso (Day 3 — sugerido)

1. Visual smoke en navegador: `http://api.estadesdelta.local:8081/josep-test/casa-demo-riumar` con login admin y probar que los blocks se pueden insertar.
2. **Arreglar `VOLTO_TENANT_MAP` + middleware multi-tenant** — el bug `casa-demo.estadesdelta.local` → 404 viene de que el middleware rewritea a un path sin prefijo de idioma (`/properties/casa-demo-riumar`), pero Volto inyecta `/ca/` automáticamente, y la Property real vive en `/josep-test/casa-demo-riumar`. Dos opciones:
   - **A (hotfix)**: mapear con prefijo de idioma en `VOLTO_TENANT_MAP` (`/ca/josep-test/casa-demo-riumar`). Rápido pero acopla routing a idioma default — si el usuario cambia idioma, el subdominio rompe el switch.
   - **B (correcto)**: middleware rewritea sin prefijo, Volto detecta idioma vía `Accept-Language`/cookie y prepende `/<lang>/`. Requiere ajustar `middleware/tenantRouting.ts` para no asumir `/properties/<slug>` y aceptar el path real de la Property; o crear redirects backend `/properties/<slug>` → `/<owner>/<slug>` vía `plone.app.redirector`. Esta es la decisión arquitectónica que queremos a futuro.
   - Acordado: si Day 3 viene apretado, ship opción A con `// TODO(day4)` en código apuntando a opción B. Si hay tiempo, hacer B directamente.
3. AggregatorFilters (date range + capacity + zone) para listar los Properties en el marketplace.
4. PropertyMap (Leaflet + OSM) para AggregatorPropertyCard y PropertyView.
5. Wire `@testing-library/react` + `jest-dom` para reactivar los `.test.tsx.disabled` (60+ assertions ya escritas, lo único que falta es la config).
6. Hot reload del backend (Dockerfile.dev con pip install -e .).
7. Commit pnpm-lock.yaml y restaurar --frozen-lockfile.
