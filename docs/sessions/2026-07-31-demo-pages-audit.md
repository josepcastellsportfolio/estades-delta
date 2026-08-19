# 2026-07-31 — Auditoría visual de las páginas demo

**Rama:** `docs/demo-pages-audit` (desde `feat/content-rag-tenant-vector` @ `0d38908`)
**Tipo:** sesión de auditoría read-only. No se implementó nada.
**Objetivo:** inventariar qué parte de la página de propiedad es hoy contenido
autogestionable y qué parte está hardcodeada, antes de reconstruir la demo solo
con bloques.

---

## Lo que se hizo

Auditoría en 7 bloques sobre la única Property demo existente
(`/josep-test/casa-demo-riumar`). Entregables en `docs/audit/`.

Los servicios estaban caídos al empezar; se levantaron con
`docker compose -f devops/docker-compose.dev.yml up -d`.

---

## Hallazgos principales

### 1. La página no usa bloques en absoluto

`blocks: {}` y `blocks_layout: {"items": []}` en el objeto Property. La ficha se
pinta íntegramente con `PropertyView.tsx`, una vista React fija registrada en
`contentTypesViews.Property`. Los seis componentes `*View` se invocan con objetos
`data` literales escritos en el JSX; **en ningún punto se lee `content.blocks`**.

Reconstruir la demo con bloques autogestionables es partir de cero, no migrar.

### 2. Los schemas de los 10 bloques nunca llegan al editor

`blockSchema` es la clave correcta en Volto 18 — la consume `DefaultEdit`. Pero
`DefaultEdit` es también quien monta `SidebarPortal` + `BlockDataForm`, y los 10
bloques registran un `edit` propio que lo sustituye, limitándose a renderizar el
View como preview.

`SidebarPortal`, `BlockDataForm` e `InlineForm` **no aparecen ni una vez** en
todo `src/` del addon. Resultado: seleccionar un bloque no muestra ningún
formulario en la barra lateral.

Es la brecha nº1 y también la de menor esfuerzo (S). Desbloquea galería,
descripción y el resto.

### 3. El calendario no puede funcionar con el modelo actual

`PropertyCalendarView` lee `content.unavailable_dates`, pero **ese campo no
existe en el schema de `Property`** (cero resultados en todo `backend/src/`).
Solo vive en las interfaces TypeScript del frontend. El calendario muestra hoy
todos los días como disponibles, siempre.

`Beds24StubAdapter` y `stripe_connect.py` son stubs completos **nunca invocados
desde ningún fichero**. No hay endpoint `@beds24-webhook` registrado.

### 4. Datos demo artesanales y no reproducibles

Existe el fixture `demo_content.py` (3 Properties, una por paleta) registrado
como import step, pero **nunca se ejecutó aquí**: el objeto real está en
`/josep-test/` en vez de `/ca/properties/`, con valores distintos a los del
fixture. Solo hay 1 Property, sin imágenes, sin `owner_ref`, sin `custom_domain`,
sin `language`.

Las paletas `riu-i-mar` y `capvespre` no tienen ningún objeto que las ejercite —
dos de las tres nunca se han visto en una página real.

### 5. El microsite por subdominio no funciona

`http://casa-demo.estadesdelta.local:8081/` devuelve 200 pero sirve la home por
defecto de Plone. La ficha solo es accesible por su path directo. Causa: el
`VOLTO_TENANT_MAP` del working tree apunta a `/josep-test/casa-demo-riumar` y la
Property tiene `custom_domain: null`.

### 6. Defectos visibles en la demo actual

- Las etiquetas `<p>` se imprimen literales (`textarea` + render como texto).
- Amenities como tokens crudos: `wifi`, `ac`, `kitchen`, `parking`.
- Cinco placeholders "(sense imatge)".
- Botón "Reservar" sin `onSubmit` — el clic no hace nada.
- Tres idiomas en una pantalla: chrome ES, secciones CA, contenido EN.

### 7. Campos capturados que nunca se muestran

`house_rules`, `check_in_time`, `check_out_time`, `minimum_stay_low/high` están
rellenos en el objeto y `PropertyView` no los renderiza en ninguna parte.

---

## Decisiones de la sesión

- **Auditar solo `casa-demo-riumar`** (decisión del usuario). No se recreó el
  contenido demo porque exigía `down -v` y habría borrado la DB.
- **Commit solo de `docs/`** (decisión del usuario). El working tree tiene una
  modificación previa en `devops/docker-compose.dev.yml` (`VOLTO_TENANT_MAP`) que
  se deja intacta.
- **Bloque 6 (capturas) saltado.** No hay Playwright. Cypress 13.17.0 está
  instalado pero no arranca: falta `libatk-1.0.so.0`, que requeriría `sudo apt`.
  El prompt prohíbe instalar. En su lugar se documentó el texto visible extraído
  del DOM renderizado.

---

## Huecos detectados

- `docs/session-logs/` no existe — la convención real es `docs/sessions/`.
- `docs/adr/` no existe — es `docs/ADRs/`.
- ADRs 001-012 y 014-020 se citan en CLAUDE.md §14 pero **no existen como
  fichero**. Solo están escritos el 013 y los 021-024.
- Los puertos 8080 y 3000 **no están publicados al host**: todo pasa por Traefik
  en `:8081`, al contrario de lo que dice CLAUDE.md §4.
- El log del Day 3 dice 8 bloques registrados; hoy son **10** (faltan
  `aggregatorPropertyList` y `propertyCalendar`).
- Backend, worker y beat aparecen `unhealthy` en `docker compose ps` pero
  responden correctamente — el healthcheck está mal calibrado, no el servicio.

---

## Próximo paso recomendado

Por orden de dependencia, no de importancia:

1. **Arreglar el sidebar de bloques** (esfuerzo S). Es el desbloqueo de todo lo
   demás: sin él, ningún bloque es editable y la reconstrucción no puede empezar.
2. **Recrear el contenido demo desde el fixture** en instancia limpia
   (`down -v` + `CREATE_DEMO_CONTENT=1`), para tener las 3 paletas ejercitadas y
   `custom_domain` relleno.
3. **Decidir la estrategia de la ficha**: refactorizar `PropertyView` para
   renderizar `content.blocks` con `RenderBlocks`, contra mantener la vista fija y
   hacer editables solo los campos. La primera opción es la que hace posible
   reordenar secciones — la brecha nº6 en impacto comercial.
4. Añadir el campo `unavailable_dates` al content type antes de tocar Beds24.

Detalle completo en `docs/audit/demo-pages-visual-inventory.md` §7 (gap analysis).
