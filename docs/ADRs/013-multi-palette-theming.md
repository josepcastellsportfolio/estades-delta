# ADR 013 — Multi-palette theming with per-tenant override

**Status:** accepted
**Date:** 2026-05-11
**Supersedes:** none (refines ADR 011 once ADR 011 is formally written)
**Context loaded by:** Day 2, Bloque 1

## Context

Pack 1 Vía B is a marketplace plus per-property microsites. Each owner needs
to feel that their microsite is "their" brand — not a Booking-style chrome
that smells of central control. At the same time the marketplace aggregator
has to feel like a single, coherent destination.

Two tensions:

- **Identity per property** — the Riumar beach-front chalet and a hillside
  masia should not look like the same room with different sofa cushions.
- **Aggregator coherence** — the listing page can't be a quilt of clashing
  themes; it needs one stable visual identity.

## Decision

We ship **three pre-built palettes**, every property picks one, and the
marketplace is locked to one of them as master.

- **Arrossar** (rural green) — marketplace master.
- **Riu i Mar** (boutique navy) — coastal / naval / ornithological.
- **Capvespre** (sunset ocre) — experience retreats, photo-stays.

Typography is shared across all three (DM Serif Display for `h1`/`h2`, DM
Sans for everything else). Only colours change between palettes.

Implementation:

- Each palette is a single `[data-palette="<id>"]` block in
  `frontend/packages/volto-estades-delta/src/theme/palettes.scss` defining
  ~25 CSS custom properties. Components only ever reference those custom
  properties; they never name a colour.
- A `PaletteScope` React component sets `data-palette` on its rendered
  element. The cascade does the rest.
- The marketplace SSR sets `data-palette="arrossar"` on `<body>` via Volto's
  `htmlBodyAttributes`. PropertyView subtrees override by mounting a new
  `<PaletteScope palette={property.palette}>` wrapper.
- The Property content type gains a required `palette` field
  (`SimpleVocabulary` with the three valid values).
- An upgrade step (1000 → 1001) back-fills `arrossar` on existing Property
  instances.

## Why three and not one (or five)

**One palette** was tempting for simplicity but loses the "their brand" hook
that's the entire pitch behind direct-booking microsites. Booking can give
you a coloured banner; we can give you a coherent visual world. We need at
least a clearly distinguishable second option, and the third gives owners a
choice — choice that matters, not a 20-swatch picker.

**Five palettes** felt like fishing for variety. Each palette adds:

- ~25 CSS custom properties to design, agree on, and re-audit when one shifts.
- An asset of cognitive load on the owner ("which one fits me?").
- A multiplication factor in Storybook visual-regression maintenance.

Three is the sweet spot where each palette has a defensible identity
(rural / sea-adjacent / sensory) and the owner can decide in two minutes.

## Why CSS custom properties (and not CSS-in-JS / SCSS variable maps)

- **Cascade respects scope.** A `<PaletteScope>` wrapper changes colours for
  its subtree without React re-rendering or extra build steps. SCSS variables
  can't do that; they're resolved at build time.
- **Runtime preview.** A future "preview palette before saving" screen for
  the owner is one `setProperty` call away. With CSS-in-JS we'd have to
  re-render the React tree with a new theme provider.
- **Storybook-friendly.** A story can put three `<PaletteScope>` siblings on
  the same canvas with no provider gymnastics.

We deliberately don't use `prefers-color-scheme` dark mode in Phase 1.
Hospitality booking is overwhelmingly browsed in light mode on phones in
daylight; dark mode is a Phase 3 nice-to-have.

## Why typography is locked across palettes

A different display face per palette would shred brand coherence on the
aggregator (where the user sees several palettes side by side). Locking
type means the visual difference between properties is colour and photo,
not typeface — which is exactly the boutique hotel chain pattern that we
want to emulate.

DM Serif Display + DM Sans were chosen because:

- DM Serif Display has presence at large sizes without being self-conscious.
- DM Sans is a Google-host-friendly neutral that doesn't fight the serif.
- Both have CA / ES / EN / FR / DE glyph coverage including `l·l`, `ç`, `ñ`,
  `ß`, `œ`.
- The whole family is free under the SIL Open Font License.

## Trade-offs we accepted

- **Owners cannot upload a custom palette.** Possible future feature but
  not now; the moment we open custom palettes we're a Theme Tool company
  not a booking company.
- **The marketplace can never use Riu i Mar or Capvespre.** Acceptable; the
  marketplace is the consistent face, individual microsites carry variety.
- **An owner who really hates all three palettes will be turned down.** Fine
  — they're not our customer profile.

## How to add a fourth palette

If the customer mix in 2027 demands it (e.g. an "urban Tortosa loft"
opportunity that's neither rural-green nor coastal-navy nor sensory-ocre):

1. Append `[data-palette="<new-id>"] { … }` to `palettes.scss` with the full
   25-token shape.
2. Append the id to `PALETTES` in `theme/tokens.ts`.
3. Append the id to the `palettes` SimpleVocabulary in
   `backend/src/estades/delta/vocabularies/__init__.py`.
4. Rebuild backend so the dropdown picks up the new value, ship.

No code or component needs to change. The cascade and the catalogue are
the only things that grow.

## Consequences

- New Volto blocks must read tokens only, never hard-coded colours. Lint or
  code review catches this.
- Visual regression in Storybook lives across all three palettes, not just
  one; CI cost grows ~3× for snapshot checks but that's bounded.
- ADR 011 (Volto multi-domain routing) is reinforced: the same domain →
  property mapping now also drives the palette choice via the field on the
  loaded content object.
