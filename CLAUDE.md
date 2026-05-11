# CLAUDE.md — Estades Delta

> **Para Claude Code y cualquier desarrollador que entre nuevo al proyecto.**
> Este documento es la fuente única de verdad operativa. Si algo aquí contradice a las specs históricas, gana este archivo. Si encuentras algo desactualizado, actualízalo y commitea.

---

## 1. Qué es Estades Delta

Marketplace direct-booking multi-tenant para alquiler turístico vacacional en el Delta del Ebro. Forma parte de **Pack 1 Vía B** (Stays Direct) del plan comercial del estudio: ayudamos a propietarios particulares de chalets, casetes y apartaments turístics a captar reservas directas (sin comisión Booking) bajo una marca paraguas territorial común, mientras conservan su autonomía operativa y sus calendarios sincronizados con Booking/Airbnb.

**Modelo de negocio:**
- Setup one-time: 1.000-1.200€ por propietario (incluye microsite con marca propia + integración channel manager + traducciones profesionales CA/ES/EN/FR/DE + onboarding).
- Cuota mensual: 30-40€ (cubre hosting, channel manager prorrateado, mantenimiento técnico).
- Comisión variable: **6% sobre reservas vía microsite individual** del propietario, **10% sobre reservas vía marketplace agregador** (`estadesdelta.cat`).
- El propietario recibe los pagos directamente vía Stripe Connect Express; nuestra comisión se cobra automáticamente.

**Target tamaño:** 12-20 propietarios año 1, 30-50 año 2.

**Diferenciación frente a Booking:** propietario ahorra 9-11% de comisión sobre sus clientes recurrentes (que son ~30-50% del volumen total en alquiler vacacional rural maduro), tiene marca propia, mantiene su autonomía. Booking sigue captando primeras visitas; Estades Delta convierte a directos las recurrencias y boca-oreja.

---

## 2. Estado actual y fase

**Fase actual: 1 — Desarrollo local**

| Fase | Estado | Disparador para pasar a la siguiente |
|---|---|---|
| **1. Local dev** | 🟢 activa | Necesitas URL pública para integrar webhooks Stripe/Beds24 |
| 2. Integración externa con tunel (Cloudflare Tunnel / ngrok) | ⏳ próxima | Primera reunión cliente o piloto firmado |
| 3. Staging en VPS (Hetzner CX32 + dominio `.cat`) | ⏳ futura | Primer contrato firmado con propietario |
| 4. Producción | ⏳ futura | — |

**Regla:** mientras estés en Fase 1, NO se compran dominios, NO se contrata VPS, NO se hace nada público. El trabajo es invisible al exterior.

---

## 3. Stack at a glance

| Capa | Tecnología | Versión | Por qué |
|---|---|---|---|
| CMS / Backend | **Plone** | 6.1 | 2 años de experiencia del equipo, seguridad madura, multilingüe y workflow nativos |
| Frontend | **Volto** | 18 | React, integrado nativamente con Plone REST API |
| Lenguaje backend | Python | 3.12 | Plone runtime |
| Lenguaje frontend | TypeScript / JavaScript | Node 20 LTS | Volto |
| DB principal | PostgreSQL | 16 (imagen `pgvector/pgvector:pg16`) | Relstorage para Plone, pgvector para futuros embeddings del chatbot |
| Cache + sessions | Redis | 7 | Plone cache, Django assistant sessions futuro |
| Channel manager | **Beds24** | API v2 | Mejor relación capacidad/precio para volumen año 1 |
| Pagos | Stripe + **Stripe Connect Express** | API v2024-11-20 | Onboarding mínimo del propietario, KYC delegado |
| Email transaccional | Resend | — | Deliverability sólido, EU |
| Analytics | Umami | self-hosted | OSS, sin cookies, GDPR clean |
| Reverse proxy | Traefik | 3.1 | Routing automático por labels Docker |
| Hosting (Fase 3+) | Hetzner Cloud | CX32, Helsinki | Soberanía EU, coste predecible |
| Repo | GitHub privado | — | CI/CD vía GitHub Actions |
| Package manager Node | pnpm | 9.x | Estándar Volto 18 |

**Decisiones de stack cerradas (no reabrir sin razón comercial fuerte):** Plone vs alternativas headless, Beds24 vs Smoobu/Lodgify, Stripe vs Mollie, Hetzner vs Vercel/Railway. Razones completas en specs históricas (`docs/specs/`).

---

## 4. Quick start (dev local)

```bash
# Clonar y entrar
git clone git@github.com:<user>/estades-delta.git
cd estades-delta

# Levantar stack dev
docker compose -f devops/docker-compose.dev.yml up -d

# Logs en vivo
docker compose -f devops/docker-compose.dev.yml logs -f backend

# Acceder
# - Backend Plone Classic UI:  http://api.estadesdelta.local/Plone
# - Volto frontend marketplace: http://estadesdelta.local
# - Volto microsite ejemplo:    http://casa-demo.estadesdelta.local
# - Traefik dashboard:          http://localhost:8090
# - Umami analytics:            http://analytics.estadesdelta.local

# Crear Plone Site (primera vez)
docker compose -f devops/docker-compose.dev.yml exec backend bash
# Dentro del contenedor:
./bin/plone create-classic-site --site-id=Plone --title="Estades Delta" --language=ca
exit

# Bajar todo
docker compose -f devops/docker-compose.dev.yml down

# Bajar y limpiar volúmenes (¡borra DB!)
docker compose -f devops/docker-compose.dev.yml down -v
```

**Prerequisito DNS local:** `*.estadesdelta.local` debe resolver a `127.0.0.1`. Configurado vía dnsmasq o `/etc/hosts`. Si Volto da error de host, verifica DNS antes de cualquier otra cosa.

---

## 5. Arquitectura

### 5.1 Patrón multi-tenant

**Single Plone Site + content type `Property` + Volto multi-domain routing.**

Una sola Plone Site (`/Plone`) contiene todos los Properties (chalets). Cada Property es un objeto Dexterity con su propio Owner, schedule, pricing. El "microsite" individual por chalet no es un Plone Site separado — es Volto renderizando la misma Property bajo un hostname distinto con tema custom.

**Cómo funciona el routing:**

1. Hostname llega a Traefik (ej. `casariumar.cat` o `casa-demo.estadesdelta.local`).
2. Traefik enruta a Volto frontend.
3. Middleware `tenantRouting.js` lee `X-Forwarded-Host` y determina:
   - Si es `estadesdelta.cat` o `www.*` → render marketplace agregador (`/`)
   - Si es dominio custom en `VOLTO_TENANT_MAP` → render `/properties/<slug>`
   - Si es subdominio `*.estadesdelta.cat` o `*.estadesdelta.local` → render `/properties/<subdomain>`
4. Volto carga la Property correspondiente desde Plone REST API.
5. CSS tokens / theme override aplicados según tenant.

**Por qué no multi-site o lineage:** maintenance overhead inadmisible para solo operator, y no aporta valor real porque tenants no son competidores legales que necesiten aislamiento de datos cataláctico. Trade-off elegido conscientemente.

### 5.2 Layout de servicios (Fase 1 — local)

```
┌─────────────────────────────────────────────────────────┐
│ traefik:80 (reverse proxy)                              │
└───┬─────────────────────────────────────────────────────┘
    │
    ├──► frontend (Volto, port 3000)
    │      consumes Plone REST API
    │
    ├──► backend (Plone, port 8080)
    │      ├─► postgres:5432 (relstorage)
    │      ├─► redis:6379 (cache)
    │      └─► pgvector schema (KB embeddings, mes 2+)
    │
    └──► umami (analytics, port 3000 interno)
           └─► postgres (umami schema)
```

### 5.3 Servicios futuros (mes 2+, no construir todavía)

- `assistant` — Django microservice basado en fork de `recetia_assistant`, integración chatbot multi-tenant. Comunicará con Plone vía REST API, usará pgvector para RAG, Anthropic Claude Haiku 4.5 como LLM default.
- `listmonk` — newsletter / email marketing (cuando llegue contenido editorial).
- `cal-com` — agendamiento reuniones comerciales.
- `plane` — project management self-hosted.

---

## 6. Estructura del repo (monorepo)

```
estades-delta/
├── backend/                              ← Plone backend
│   ├── src/estades/delta/
│   │   ├── content/                      ← Property, Owner, Booking
│   │   ├── behaviors/                    ← Geolocation, pricing
│   │   ├── adapters/                     ← Beds24, Stripe, futuro Plone↔Assistant
│   │   ├── browser/                      ← Views custom Plone
│   │   ├── api/                          ← Endpoints plone.restapi extendidos
│   │   ├── workflows/                    ← booking_workflow.xml
│   │   ├── profiles/default/             ← types.xml, workflows.xml, metadata.xml
│   │   ├── locales/                      ← .po files ca/es/en/fr/de
│   │   └── tests/
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/                             ← Volto
│   ├── packages/volto-estades-delta/
│   │   ├── src/
│   │   │   ├── blocks/                   ← PropertyHero, Gallery, Calendar, etc.
│   │   │   ├── components/               ← Componentes compartidos
│   │   │   ├── middleware/               ← tenantRouting.js
│   │   │   ├── theme/                    ← Theme tokens por tenant
│   │   │   ├── customizations/           ← Override de Volto core
│   │   │   └── config.js
│   │   └── package.json
│   ├── src/                              ← Volto app shell
│   └── Dockerfile
│
├── devops/
│   ├── docker-compose.dev.yml            ← Fase 1 local
│   ├── docker-compose.yml                ← Fase 3+ producción
│   ├── traefik/
│   ├── scripts/
│   │   ├── postgres-init.sql
│   │   ├── backup.sh                     ← solo Fase 3+
│   │   └── hetzner-bootstrap.sh          ← solo Fase 3+
│   └── varnish/                          ← solo Fase 3+
│
├── docs/
│   ├── specs/                            ← spec v1, v2 inmutables como referencia
│   ├── ADRs/                             ← Architecture Decision Records
│   └── sessions/                         ← Logs de sesiones de trabajo
│
├── .github/workflows/
│   ├── ci.yml                            ← Lint + test + build (siempre)
│   └── deploy.yml                        ← Push GHCR + SSH deploy (Fase 3+)
│
├── CLAUDE.md                             ← este archivo
├── README.md                             ← contexto público (cuando lo haya)
└── .env.example
```

---

## 7. Content types — referencia rápida

### Property (Container)

Chalet/casa rural turística. Children: Photos, custom blocks.

**Campos clave:**
- `short_name` (slug URL)
- `subtitle`
- `owner_ref` (Choice → Owner)
- `municipality`, `zone`, `address`, `latitude`, `longitude`
- `max_guests`, `bedrooms`, `bathrooms`, `beds_double`, `beds_single`
- `amenities` (List Choice multivalue)
- `base_price_low_season`, `base_price_mid_season`, `base_price_high_season`
- `cleaning_fee`, `tourist_tax_per_night` (default 1.10€)
- `minimum_stay_low`, `minimum_stay_high`
- `check_in_time`, `check_out_time`
- `beds24_property_id` (sync external)
- `custom_domain` (e.g. `casariumar.cat`)
- **Chatbot reserved fields** (no usar todavía): `chatbot_enabled`, `chatbot_tier`, `chatbot_custom_prompt`

**Multilingüe:** title, subtitle, description, long_description, house_rules son `plone.app.multilingual` aware.

### Owner (Container)

Propietario del chalet. Children: Properties que posee.

**Campos clave:**
- `legal_name`, `legal_id` (NIF/CIF), `legal_id_type`
- `address`, `postal_code`, `city`, `country`
- `email`, `phone`, `iban`
- `stripe_connect_id`, `stripe_connect_status` (pending/active/restricted)
- `has_hut` (Habitatge d'Ús Turístic), `hut_number`
- `preferred_language` (CA/ES/EN/FR/DE)
- `contract_signed_date`, `contract_revision`
- `commission_rate_microsite` (default 0.06), `commission_rate_marketplace` (default 0.10)
- **Chatbot reserved fields:** `chatbot_enabled`, `chatbot_tier`, `chatbot_custom_prompt`

### Booking (Item)

Reserva. Pertenece a una Property.

**Campos clave:**
- `property_ref` (RelationField → Property)
- `guest_first_name`, `guest_last_name`, `guest_email`, `guest_phone`, `guest_country`
- `guest_count_adults`, `guest_count_children`, `guest_count_infants`
- `check_in_date`, `check_out_date`, `nights` (computed)
- `subtotal`, `cleaning_fee`, `tourist_tax_total`, `total_amount`
- `our_commission_rate`, `our_commission_amount`, `owner_payout_amount`
- `payment_intent_id`, `payment_status` (pending/paid/refunded/failed)
- `source` (direct_microsite / direct_marketplace / booking_com / airbnb / manual)

**Workflow:** `booking_workflow`
- `pending` (initial) → `confirm` → `confirmed`
- `pending` → `cancel` → `cancelled`
- `confirmed` → `complete` → `completed` (auto via cron diario)
- `confirmed` → `cancel` → `cancelled`

Transiciones disparan eventos hookeados para: notificación owner, sync Beds24, computar comisión, generar payout intent.

---

## 8. Multi-domain routing en Volto

**Variable env clave:** `VOLTO_TENANT_MAP` — JSON con mapeo `hostname → property path`.

```json
{
  "casariumar.cat": "/properties/casa-riumar",
  "masdelfangar.com": "/properties/mas-del-fangar",
  "casa-demo.estadesdelta.local": "/properties/casa-demo-riumar"
}
```

**Patrones que el middleware reconoce:**
1. Dominio principal `estadesdelta.cat` / `.local` → marketplace `/`
2. Dominio en TENANT_MAP → property mapeada
3. Subdominio `<slug>.estadesdelta.cat/local` → `/properties/<slug>`
4. Fallback → marketplace

**Cómo añadir nuevo propietario con dominio propio:**
1. Crear Property en Plone con `short_name` y `custom_domain` rellenos
2. Añadir entrada en `VOLTO_TENANT_MAP` (env var, requiere restart frontend)
3. Configurar DNS del propietario (CNAME al servidor) o si es subdominio del marketplace, ya cubierto por wildcard

---

## 9. Conventions

### Commits — Conventional Commits

```
<type>(<scope>): <imperative description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.

**Scopes habituales:** `content-types`, `volto`, `adapters`, `workflows`, `i18n`, `multi-tenant`, `ci`, `dev-env`, `claude`.

Ejemplos:
- `feat(content-types): add Property dexterity content type with all base fields`
- `fix(volto): correct subdomain matching in tenantRouting middleware`
- `docs(claude): update multi-tenant routing section after VOLTO_TENANT_MAP change`
- `refactor(adapters): extract Beds24 client into separate module`

### Branches

- `main` — siempre desplegable. Protegida por convención. Merges solo vía PR.
- `staging` — destino de Fase 3+. Lo que está aquí va a VPS staging.
- `feature/<descripción-kebab>` — trabajo en curso. Mergea a `main` vía PR.
- `fix/<descripción-kebab>` — fixes urgentes.
- `chore/<descripción-kebab>` — mantenimiento, deps, etc.

Auto-merge PRs propios después de pasar CI y revisar diff completo manualmente. Auto-aprobarse está bien siendo solo, pero **siempre revisar el diff completo antes** — escala mental de PR es la última red de seguridad.

### Code style

**Python:**
- `ruff` con preset PEP8 + isort + simplify
- Imports absolutos siempre (`from estades.delta.adapters.beds24 import ...`)
- Type hints obligatorios en funciones públicas, opcionales en privadas
- Docstrings Google style en clases y funciones públicas

**JS/TS:**
- Prettier con config Volto default
- ESLint config Volto default
- Componentes React funcionales con hooks (no class components)
- Nombres de archivos: PascalCase para componentes, camelCase para utils, kebab-case para directorios

**SQL:**
- Snake_case para tablas, columnas, indices
- Prefijo de schema explícito en queries cross-schema

### Idiomas en código y docs

- **Identifiers (variables, funciones, clases, archivos):** inglés siempre.
- **Comentarios técnicos en código:** inglés o español según contexto, consistencia dentro de un archivo.
- **Docstrings:** inglés.
- **Documentación interna del repo (docs/, ADRs):** inglés por defecto, salvo decisiones de producto/comerciales (en español).
- **CLAUDE.md y session logs:** español.
- **README.md público (cuando exista):** español + inglés.

### Naming en Plone

- Content type ID: PascalCase (`Property`, `Owner`, `Booking`)
- Behavior ID: dotted lower (`estades.delta.behaviors.pricing`)
- Workflow ID: snake_case (`booking_workflow`)
- Vocabularies: `estades.delta.vocabularies.<Name>`

### Naming en Volto

- Block ID: kebab-case (`property-hero`, `property-gallery`)
- Component file: PascalCase matching component name (`PropertyHero.jsx`)
- Folder per block: `blocks/PropertyHero/{View,Edit,Schema,index}.jsx`

---

## 10. External integrations

### Beds24 (channel manager)

**Estado:** stubs only en Fase 1. Integración real en Fase 2 con sandbox.

**Adapter:** `backend/src/estades/delta/adapters/beds24.py` implementa `IBeds24Adapter`:
- `sync_calendar(property)` → trae availability desde Beds24, actualiza Property
- `create_booking(property, dates, guest)` → bloquea fechas en Beds24 cuando se crea Booking confirmado
- `update_availability(property, dates, available)` → push manual disponibilidad
- `handle_webhook(payload)` → recibe cambios desde Beds24 (cancelaciones Booking/Airbnb)

**Webhook endpoint:** `POST /++api++/@beds24-webhook`. Idempotente vía `booking_external_id` lock.

### Stripe Connect Express (pagos)

**Estado:** stubs only en Fase 1. Sandbox en Fase 2.

**Adapter:** `backend/src/estades/delta/adapters/stripe_connect.py` implementa `IStripeAdapter`:
- `create_connected_account(owner)` → crea Stripe Express account, devuelve onboarding link
- `create_payment_intent(booking)` → crea PaymentIntent con `application_fee_amount` (nuestra comisión)
- `compute_commission(booking)` → calcula comisión según `source` (microsite 6% / marketplace 10%)
- `handle_webhook(payload)` → procesa `payment_intent.succeeded`, `account.updated`, `payout.paid`

**Webhook endpoint:** `POST /++api++/@stripe-webhook`. Verifica signature con `STRIPE_WEBHOOK_SECRET`.

**Flujo de pago:**
1. Guest selecciona fechas en `PropertyBookingForm`
2. Frontend llama a `POST /++api++/@create-booking-intent` con datos
3. Backend crea Booking en estado `pending`, calcula totales, crea PaymentIntent con destination charge al owner
4. Frontend abre Stripe Checkout / Elements con `client_secret`
5. Guest paga → Stripe webhook → Booking transiciona a `confirmed` → Beds24 sync → email al owner y al guest

### LLM (Anthropic Claude) — mes 2+

**Estado:** no implementado. Reserva pgvector + campos chatbot en content types.

**Modelo default cuando llegue:** `claude-haiku-4-5-20251001`. Sonnet 4.6 para agentes complejos del planner (area_recommendations, comparison). Opus prácticamente no se usa.

**Integración:** microservicio Django separado (fork de `recetia_assistant`) en mismo docker-compose, comunicación vía REST API con Plone como `domain_data_port`, pgvector como `vector_store_port`.

---

## 11. Pricing model — contexto comercial

Necesario tener presente porque informa decisiones técnicas (defaults de comisión, tier de chatbot, etc.).

| Concepto | Valor |
|---|---|
| Setup propietario (one-time) | 1.000-1.200€ |
| Cuota mensual | 30-40€ |
| Comisión microsite directo | 6% |
| Comisión marketplace agregador | 10% |
| Traducciones profesionales EN/FR/DE | incluidas en setup |
| Sesión fotográfica pro | 400-700€ (subcontratada, opcional, paga propietario aparte) |
| Cancellation policy default | moderate (50% reembolso si cancela >14 días antes) |

**Chatbot (mes 3+):**

| Tier | Setup | Mensual | Conversaciones/mes |
|---|---|---|---|
| S (FAQ) | 400-600€ | 30-40€ | 200 |
| M (transaccional ligero) | 700-900€ | 60-80€ | 500 |
| L (concierge completo) | 1.200-1.600€ | 120-180€ | 1.500 |

---

## 12. Roadmap

### Done
- ✅ Decisión de stack (Plone-first, Arquitectura C)
- ✅ Decisión de marca (Estades Delta)
- ✅ Spec técnica completa (v1) y plan local-first (v2)
- ✅ Prompt Claude Code Day 1

### Next (Day 1 + days siguientes inmediatos)
- Day 1: scaffold + content types + Volto blocks básicos + CI ← **estamos aquí**
- Day 2: `PropertyBookingForm` con cálculo precio mock, `PropertyGallery`, `PropertyAmenities`
- Day 3: `PropertyCalendar` mock, `PropertyMap` con Leaflet+OSM, multi-domain testing con 3 properties
- Day 4-5: Marketplace aggregator (`AggregatorFilters`, `AggregatorMap`, `AggregatorPropertyCard`)
- Day 6-7: Testing end-to-end, primer borrador i18n CA/ES, deploy a tunel Cloudflare para empezar Fase 2

### Mes 1
- Cerrar primer piloto propietario chalet (objetivo: convertir el candidato sin compromiso firme actual)
- Construir **calculadora de ahorro Booking** como artefacto de venta (microsite separado, no parte del marketplace)
- Conseguir 3 traductores EN/FR/DE pre-acordados
- Asesoría legal: contrato Vía B con propietarios

### Mes 2
- Integración real Beds24 sandbox → producción
- Integración real Stripe Connect sandbox → producción
- Fork `recetia_assistant` → `estades_assistant`, adaptar adapters (Plone REST, pgvector, tenant-aware sessions)
- Diseñar set de agentes vertical "accommodation" para chatbot

### Mes 3
- Primer piloto chatbot Tier S con un restaurante cliente Pack 1 Vía A (no Vía B)
- Cutover a Fase 3 (VPS Hetzner) cuando primer propietario firme
- Onboard primer propietario real, validar end-to-end

### Mes 4-6
- Escalar a 12-20 propietarios
- Tier S chatbot como upsell standard
- Set agentes vertical "accommodation" operativo para microsites
- Empezar conversaciones Plataforma 2 (e-commerce premium DOP)

---

## 13. Out of scope right now — no tocar

- **Plataforma 2 (e-commerce premium DTC + B2B)** — viene mes 6+, requiere Medusa.js cuando llegue cliente pagando
- **Plataforma 3 (marketplace municipal Comprar Deltebre)** — viene año 2, vertical commerce + workflow vendor approval
- **Plataforma 4 (DTI institucional)** — viene año 2-3, ahí entrará Plone "puro" institucional con SAML/LDAP
- **Compras de dominio, VPS, Cloudflare account de pago** mientras estés en Fase 1
- **Push de imágenes Docker a GHCR** — solo cuando Fase 3
- **Modificar `recetia_assistant` original** — siempre forkeas a `estades_assistant`, nunca tocas el upstream
- **Vía A (Web Pro Kit Digital)** — es otro producto, otro repo, otra cadencia. No mezclar en este repo.
- **Cualquier cosa que cueste dinero recurrente sin contrato firmado** — incluido SaaS, dominios, cuentas pagas. Solo trial gratis y planes free.

---

## 14. Decision log resumido

ADRs completos en `docs/ADRs/`. Estos son los resumidos:

| # | Decisión | Razón |
|---|---|---|
| 001 | Plone-first stack | 2 años experiencia equipo, velocidad relativa, madurez seguridad |
| 002 | Single Plone Site + Property content type + Volto multi-domain | Gestión simple, reutilizable Plataforma 3 |
| 003 | Beds24 como channel manager | API potente, precio entry-level, suficiente para volumen año 1 |
| 004 | Stripe Connect Express accounts | Onboarding mínimo propietario, KYC delegado a Stripe |
| 005 | Self-hosted en Hetzner (Fase 3+) | Soberanía datos EU, coste predecible, GDPR clean |
| 006 | Local-first desarrollo (Fase 1) | Iteración rápida, no exposición pública prematura, no gasto antes de demostrable |
| 007 | pgvector en Postgres en lugar de Chroma | Reutiliza Postgres existente, un servicio menos, backup unificado |
| 008 | Fork `recetia_assistant` para chatbot, no refactor | Validar demanda primero, extraer core genérico después |
| 009 | Claude Haiku 4.5 como LLM default | Mejor relación calidad/precio multilingüe, margen sano todos los tiers |
| 010 | Holded para facturación (no self-hosted) | Verifactu compliance (2026) no negociable |

---

## 15. Referencias

**Internas:**
- `docs/specs/estades-delta-spec.md` — spec técnica completa v1
- `docs/specs/estades-delta-spec-v2-local.md` — plan local-first v2 (sobrescribe v1 en lo relativo a infra Fase 1-2)
- `docs/ADRs/` — Architecture Decision Records detallados
- `docs/sessions/` — log de cada sesión de desarrollo

**Externas:**
- Plone 6 docs: https://6.docs.plone.org/
- Volto docs: https://6.docs.plone.org/volto/
- cookiecutter-plone-starter: https://github.com/plone/cookiecutter-plone-starter
- plone.app.multilingual: https://github.com/plone/plone.app.multilingual
- Beds24 API: https://beds24.com/api/v2/docs/
- Stripe Connect Express: https://stripe.com/docs/connect/express-accounts
- pgvector: https://github.com/pgvector/pgvector

---

## 16. Troubleshooting común

**`*.estadesdelta.local` no resuelve:**
```bash
# Verificar
dig casa-demo.estadesdelta.local @127.0.0.1

# Si falla y usas dnsmasq
sudo systemctl status dnsmasq
sudo systemctl restart dnsmasq
sudo systemctl restart systemd-resolved

# Si falla y usas /etc/hosts
grep estadesdelta /etc/hosts
# Añadir las entradas que falten
```

**Plone backend no arranca / errores Relstorage:**
```bash
# Ver logs
docker compose -f devops/docker-compose.dev.yml logs backend

# Verificar Postgres healthy
docker compose -f devops/docker-compose.dev.yml exec postgres pg_isready -U plone

# Reset si DB corrompida (¡borra datos!)
docker compose -f devops/docker-compose.dev.yml down -v
docker compose -f devops/docker-compose.dev.yml up -d
```

**Volto error de hot reload tras editar bloque:**
```bash
# Restart solo frontend
docker compose -f devops/docker-compose.dev.yml restart frontend
# O reconstruir si cambió package.json
docker compose -f devops/docker-compose.dev.yml up -d --build frontend
```

**Cambios en content type FTI no aparecen:**
- Reinstalar el addon en Plone: Site Setup → Add-ons → Estades Delta → Uninstall + Install
- O hard upgrade: en `pdbpp`/instance, `portal_setup.runImportStepFromProfile('estades.delta:default', 'typeinfo')`

**Volto no reconoce nuevo bloque:**
- Verificar registro en `frontend/packages/volto-estades-delta/src/config.js`
- `pnpm install` en el addon si añadiste deps
- Restart frontend container

**Multi-tenant routing no funciona:**
- Verificar `VOLTO_TENANT_MAP` en env (debe ser JSON válido)
- Verificar middleware está registrado en `volto.config.js`
- Verificar Traefik labels apuntan al patrón regex correcto

---

## 17. Para Claude Code que entra a una sesión nueva

1. Leer este archivo entero (siempre, primero).
2. Leer `docs/sessions/` los últimos 2-3 logs de sesión para entender qué se hizo recientemente.
3. Verificar estado del repo: `git status`, `git log --oneline -10`, `docker compose ps`.
4. Si hay TODOs activos del usuario, plantearlos con `TodoWrite`.
5. Si encuentras algo en este CLAUDE.md desactualizado respecto al estado real, **actualízalo en el mismo commit que el cambio**.
6. Al final de la sesión, escribir log en `docs/sessions/YYYY-MM-DD-<scope>.md` con: qué se hizo, decisiones técnicas no triviales, blockers, próximo paso recomendado.

---

*Última actualización: 2026-05-11. Próxima revisión obligatoria: tras Day 1, tras Fase 2 cutover, tras Fase 3 cutover.*