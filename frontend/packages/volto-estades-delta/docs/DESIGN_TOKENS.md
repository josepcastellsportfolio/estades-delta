# Estades Delta — design tokens

Single source of truth for what we paint with.

The tokens live in two files inside the Volto addon:

- `src/theme/tokens.scss` — palette-independent (spacing, typography, radii,
  shadows, font families, breakpoints).
- `src/theme/palettes.scss` — three palettes applied via `[data-palette="…"]`.

Both are loaded via `src/theme/index.scss`, which is imported from
`src/index.ts` on addon load.

A JS mirror lives at `src/theme/tokens.ts` (`PALETTES`, `DEFAULT_PALETTE`,
`SPACING`, `BREAKPOINTS`, `FONT_FAMILY`). Use it only when CSS variables
aren't reachable (legacy chart libs, JS animation curves). In all other
places **read the CSS custom property directly**.

## Hierarchy convention (the only typography rule worth memorising)

DM Serif Display ships in a single weight (400). The visual hierarchy
between `h1` and `h2` comes from **size and line-height**, never weight.
For `h3` and below we switch to DM Sans, intentionally — the display serif
should never feel like a wall.

| Level     | Family             | Weight | Size           | Line-height | Letter-spacing |
| --------- | ------------------ | ------ | -------------- | ----------- | -------------- |
| h1 hero   | DM Serif Display   | 400    | `--ed-font-size-5xl` (4.5rem) | tight   | -0.02em |
| h1 page   | DM Serif Display   | 400    | `--ed-font-size-4xl` (3.25rem) | tight   | -0.02em |
| h2        | DM Serif Display   | 400    | `--ed-font-size-3xl` (2.5rem)  | snug    | -0.01em |
| h3        | **DM Sans**        | 700    | `--ed-font-size-2xl` (2rem)    | snug    | 0       |
| h4        | DM Sans            | 500    | `--ed-font-size-xl` (1.5rem)   | snug    | 0       |
| h5        | DM Sans            | 500    | `--ed-font-size-lg` (1.125rem) | snug    | 0       |
| h6        | DM Sans            | 500    | `--ed-font-size-md` (1rem)     | snug    | 0       |
| body      | DM Sans            | 400    | `--ed-font-size-md`            | normal  | 0       |
| body emphasis | DM Sans       | 500    | inherit                        | inherit | 0       |
| caption / muted | DM Sans      | 400    | `--ed-font-size-sm`            | relaxed | 0       |

The `body`, `h1`–`h6` rules above are already wired in `reset.scss`. Block
components should rely on those defaults and override only when really
needed (e.g. a hero title that uses 5xl instead of 4xl).

## Palette catalogue

There are three palettes, all shipped, selectable per Property and per
microsite via the `palette` field on the content type.

### Arrossar (master)

> Green rural. Used by `estadesdelta.cat` / `.local` marketplace as master.

Best fit: chalets de campo, masies, agroturismes. Anything where the customer
mental model is "rural retreat" or "farmhouse".

```
primary  #2D5F3F  hover #1F4530  subtle #5A8366  bg #E8F0EB
secondary #C49A4F  hover #9A7838  subtle #D9B776
accent   #A85432  hover #87421F
bg       #FAF7F0  surface #F0EBE0  elevated #FFFFFF
text     #1A1F1A primary  #4D5446 secondary  #8A8F82 muted
```

### Riu i Mar

> Boutique navy, serene.

Best fit: chalets cerca de costa, orientación náutica u ornitológica.
Anything where the customer mental model is "calm, water-adjacent stay".

```
primary  #2D4A5F  hover #1F3445  subtle #547588  bg #E5ECEF
secondary #8FA5B0 hover #6A8190  subtle #B5C5CC
accent   #C49A6E  hover #9A7849
bg       #F8F7F4  surface #EEEDE8  elevated #FFFFFF
text     #1A1F26 primary  #4A5560 secondary  #8A929B muted
```

### Capvespre

> Sunset ocre, emotional.

Best fit: properties that lean on sensory experience, photographic retreats,
"go off-grid for a weekend" pitch.

```
primary  #B5723A  hover #8A551F  subtle #C99564  bg #F5EBE0
secondary #4A5F75 hover #344559  subtle #708498
accent   #D9B776  hover #B89757
bg       #FAF6EE  surface #F0EBE0  elevated #FFFFFF
text     #261F1A primary  #544840 secondary  #8C8478 muted
```

## How a palette is applied

Globally on the marketplace via `htmlBodyAttributes['data-palette']` set in
`src/config/palette.ts`. The body therefore lives under the Arrossar palette
unless a subtree overrides it.

For a Property microsite, the page-level component wraps the rendered
property in `<PaletteScope palette={property.palette} as="article">`. Anything
under that element reads the overridden CSS custom properties. The cascade
takes care of nested blocks automatically.

```tsx
<PaletteScope palette="riu-i-mar">
  <PropertyHero ... />          {/* paints with Riu i Mar colours */}
  <PropertyDescription ... />   {/* same */}
</PaletteScope>
```

`PaletteScope` validates the value against the runtime list and silently
falls back to `arrossar` if anything goes wrong (unknown value, undefined).
That defence exists because the `palette` field on Property is required, but
we still want to render gracefully if a future content type reuses the
component without thinking.

## Storybook

Each palette has a dedicated story under `EstadesDelta/PaletteScope`:

- `Arrossar`
- `RiuIMar`
- `Capvespre`
- `AllPalettes` — side-by-side comparison, useful for visual review.

When you add a new block, add a story per palette so we can catch regressions
the moment the palette tokens shift.

## Adding a fourth palette in the future

Three steps:

1. Append a new `[data-palette="<id>"] { … }` block in `palettes.scss` with
   the same token shape as the existing three. **Every token must be set
   explicitly** — there is no inheritance between palette blocks.
2. Add the `<id>` to `PALETTES` in `theme/tokens.ts`.
3. Add the `<id>` to the backend `palettes` SimpleVocabulary in
   `backend/src/estades/delta/vocabularies/__init__.py` (and rebuild the
   backend image so the new value is selectable in the UI).

`PaletteScope` and `[data-palette]` lookups automatically work; no other
files need edits.

## Tokens that aren't used yet (deliberate)

The spacing scale jumps from 16 to 24 to 32 to 48, skipping 20 and 40. If a
component ever genuinely needs `20px` of vertical rhythm, that's a sign the
layout is fighting the scale; revisit the design before adding a token.

Likewise we ship only three shadow steps (`sm`, `md`, `lg`). Boutique
aesthetic plays with subtle elevation, not Material-Design-grade layering;
no `xl` shadow on purpose.
