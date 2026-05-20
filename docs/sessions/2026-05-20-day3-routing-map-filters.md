# Day 3 — Multi-tenant routing fix, AggregatorFilters, PropertyMap, RTL tests

**Branch:** `feature/day3-routing-map-filters`  
**Status:** rama abierta, PR pendiente tras CI verde.

---

## Lo que se hizo

### Bloque 1 — Fix multi-tenant routing (Opción A hotfix + demo content)

**Problema:** `casa-demo.estadesdelta.local` daba 404.  
Causa raíz: el middleware reescribía a `/properties/casa-demo-riumar`, Volto
multilingual prepend `/ca/` → `/ca/properties/casa-demo-riumar`, pero el
contenido de prueba estaba en `/Plone/ca/Josep-test/casa-demo-riumar`
(ruta creada manualmente fuera de la carpeta canónica).

**Cambios:**

- `devops/docker-compose.dev.yml`:
  - `VOLTO_TENANT_MAP` apunta ahora al path canónico `/properties/<slug>` (para
    instancias frescas con el step de demo content). El comentario inline
    explica también el valor de hotfix para instancias existentes
    (`/ca/Josep-test/casa-demo-riumar`).
  - Se añaden los dos subdominios de prueba adicionales
    (`casa-test-riu.estadesdelta.local`, `casa-test-cap.estadesdelta.local`)
    a `CORS_ALLOW_ORIGIN`, Traefik backend API router y Traefik frontend router.

- `frontend/packages/volto-estades-delta/src/middleware/tenantRouting.ts`:
  - Docblock ampliado con la convención de paths (sin prefijo de idioma para
    instancias canónicas) y el comentario `TODO(day4)` completo explicando la
    Opción B arquitectural (fetch automático desde Plone REST API al arrancar).

- `.env.example`: documentados `VOLTO_TENANT_MAP` y `CREATE_DEMO_CONTENT`.

**Backend — demo content fixture:**

- `backend/src/estades/delta/setuphandlers/demo_content.py`: nuevo módulo con
  `create_demo_content()` que crea, si `CREATE_DEMO_CONTENT=1`:
  - Carpeta `/Plone/ca/properties/` (si no existe).
  - 3 Properties de prueba (casa-demo-riumar / arrossar,
    casa-test-riu-i-mar / riu-i-mar, casa-test-capvespre / capvespre).
  - Cada Property se publica automáticamente. `transaction.commit()` al final.
  - Guard explícito: si la carpeta `ca` no existe (multilingual no instalado),
    log warning y salida limpia.

- `backend/src/estades/delta/profiles/default/import_steps.xml`: registra el
  step `estades.delta.demo_content` con dependency `content`.

**Para aplicar en instancia existente:**
```bash
docker compose -f devops/docker-compose.dev.yml down -v
CREATE_DEMO_CONTENT=1 docker compose -f devops/docker-compose.dev.yml up -d
```
O en una instancia en marcha: Site Setup → Add-ons → Re-install + activar
`CREATE_DEMO_CONTENT=1` en el env antes de reiniciar.

---

### Bloque 2 — AggregatorFilters block

Nuevo bloque Volto para la página del marketplace agregador.

**Ficheros:** `src/blocks/AggregatorFilters/{index.ts, schema.ts,
AggregatorFiltersView.tsx, AggregatorFiltersEdit.tsx, AggregatorFilters.scss,
AggregatorFiltersView.test.tsx}`

**Funcionalidad:**
- 4 controles: check-in (date), check-out (date), hostes (number), zona (select).
  Zonas fijas: Amposta, Camarles, l'Ampolla, Poblenou del Delta, Riumar,
  Sant Jaume d'Enveja, Tortosa.
- Estado persistido en URL query params (`checkin`, `checkout`, `guests`,
  `zone`). Se usa `window.history.pushState` para no causar navegación.
- Emite el custom event `aggregatorFiltersChange` al submit para que
  `AggregatorPropertyList` (Day 4+) pueda reaccionar sin store compartido.
- Botón "Esborrar filtres" aparece solo cuando hay filtros activos.
- Edit mode: preview no-interactivo (pointerEvents: none).
- 5 tests RTL cubren rendering, heading opcional, clear button, reset y
  guest count.

---

### Bloque 3 — PropertyMap block (Leaflet + OSM)

**Ficheros:** `src/blocks/PropertyMap/{index.ts, schema.ts,
PropertyMapView.tsx, PropertyMapEdit.tsx, PropertyMap.scss,
PropertyMapView.test.tsx}`

**Diseño SSR-safe:**
- `import('leaflet')` dentro de `useEffect` → solo se ejecuta en cliente.
- CSS de Leaflet: inyectado dinámicamente vía `<link>` en `document.head` la
  primera vez (evita el `document is not defined` de SSR con Razzle).
- Fix Webpack para iconos Leaflet: `delete L.Icon.Default.prototype._getIconUrl`
  + `L.Icon.Default.mergeOptions` con URLs de unpkg. Sin this, los marcadores
  dan 404 en cualquier app Webpack.
- Fuente de coordenadas: block data > content object (fallback). Si no hay
  coords, muestra placeholder "Sense coordenades".
- CSS custom property `--property-map-height` controla la altura desde TSX
  sin hardcodear en SCSS.
- 4 tests: placeholder sin coords, container con coords de block, fallback a
  content coords, prioridad block sobre content.

**PropertyView actualizado:**
- Importa `PropertyMapView` y lo añade en la sección de bloques, debajo de
  amenities, con heading "Com arribar-hi".
- Solo se renderiza si `content.latitude` o `content.longitude` tienen valor.
- `PropertyContent` interface ampliada con `latitude?: number` y
  `longitude?: number`.

**Dependencia añadida:** `"leaflet": "^1.9.4"` en
`packages/volto-estades-delta/package.json`.

---

### Bloque 4 — RTL tests activados

**Problema:** tests `.test.tsx.disabled` no se ejecutaban porque
`jest-addon.config.js` no especificaba `testEnvironment: 'jsdom'`.
(La env de Razzle por defecto en el workspace de Volto puede ser `node`
para algunos paths del addon.)

**Fix:**
- `frontend/jest-addon.config.js`: añadido `testEnvironment: 'jsdom'` y
  `globals: { __CLIENT__: true, __DEVELOPMENT__: false }`.

**Tests activados** (nuevos `.tsx` sin sufijo `.disabled`):
- `src/components/PaletteScope/PaletteScope.test.tsx` — 5 assertions
- `src/components/atoms/Button/Button.test.tsx` — 6 assertions
- `src/blocks/PropertyBookingForm/PropertyBookingFormView.test.tsx` — 5 assertions
- `src/blocks/PropertyGallery/PropertyGalleryView.test.tsx` — 5 assertions
- `src/blocks/AggregatorFilters/AggregatorFiltersView.test.tsx` — 5 assertions (nuevos Day 3)
- `src/blocks/PropertyMap/PropertyMapView.test.tsx` — 4 assertions (nuevos Day 3)

**Total RTL assertions activas:** 30 (+ 8 pricing.test.ts ya existentes = 38).

Los ficheros `.disabled` se conservan como backup inerte; Jest no los recoge
porque no coinciden con el patrón `*.test.{ts,tsx}`.

---

## Registro de bloques actualizado

`src/config/blocks.ts` registra ahora 8 bloques:
1. `propertyHero`
2. `propertyGallery`
3. `propertyDescription`
4. `propertyAmenities`
5. `propertyBookingForm`
6. `aggregatorPropertyCard`
7. `aggregatorFilters` ← **nuevo Day 3**
8. `propertyMap` ← **nuevo Day 3**

---

## Decisiones técnicas no triviales

- **Leaflet CSS via `<link>` dinámico vs Webpack import:** importar
  `leaflet/dist/leaflet.css` estáticamente funciona en bundle Webpack (CSS
  loader lo extrae), pero falla en SSR con Razzle porque el Leaflet JS se
  inicializa antes de que el CSS esté disponible. La inyección dinámica con
  un guard `if (!document.getElementById('leaflet-css'))` es idempotente y
  funciona sin acoplar al ciclo de build.

- **`AggregatorFilters` con URL params en vez de estado React:** la decisión
  de persistir filtros en URL (no Context ni Redux) permite deep-link de
  resultados, funciona con SSR inicial y no requiere wrap de Provider alrededor
  del bloque. El custom event `aggregatorFiltersChange` es el bus mínimo entre
  hermanos sin store compartido. `TODO(day4)`: conectar `AggregatorPropertyList`
  (que leerá estos params para filtrar la query Plone REST API).

- **demo_content.py con `transaction.commit()` explícito:** el step de
  GenericSetup no siempre termina dentro de una transacción Zope activa cuando
  se llama desde `plone.app.upgrade` o scripts externos. El commit explícito
  evita `ConflictError` en instancias multi-thread.

---

## Próximo paso (Day 4 — sugerido)

1. `pnpm install` en `frontend/` para instalar `leaflet@1.9.4`.
2. `docker compose -f devops/docker-compose.dev.yml down -v && CREATE_DEMO_CONTENT=1 docker compose up -d` para recrear stack con demo content canónico.
3. Smoke visual: `http://casa-demo.estadesdelta.local:8081` → debe mostrar PropertyView con paleta Arrossar + mapa (si las coords están en los datos de demo).
4. **AggregatorPropertyList** — bloque que lee los URL params de `AggregatorFilters` y hace `GET /++api++/@search?portal_type=Property&zone=<zone>&...` para listar Properties en el marketplace.
5. **Opción B routing (TODO(day4))** — fetch dinámico de `custom_domain` desde Plone al arrancar Volto SSR; elimina `VOLTO_TENANT_MAP` como env var manual.
6. **pnpm-lock.yaml commit** — restaurar `--frozen-lockfile` en CI tras instalar `leaflet`.
7. **i18n Day 3 strings** — extraer strings CA: "Com arribar-hi", "Sense coordenades", "Tota la zona", "Entrada", "Sortida", "Hostes", "Zona", "Cercar", "Esborrar filtres".
