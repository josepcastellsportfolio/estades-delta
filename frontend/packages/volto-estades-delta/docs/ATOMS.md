# Atoms — boutique UI primitives

The minimum set of components that the property blocks and the marketplace
aggregator compose with. All atoms live under
`src/components/atoms/<Atom>/` with this triplet:

```
Atom.tsx           ← React component, TS
Atom.scss          ← styles using `--ed-*` CSS variables only
Atom.test.tsx      ← Jest + @testing-library/react
Atom.stories.tsx   ← Storybook stories (incl. palette comparison where useful)
index.ts           ← re-export
```

Re-exported from `src/components/atoms/index.ts` for ergonomic imports:

```ts
import { Button, Card, Pill, Stack, Heading, Price, Rating } from 'volto-estades-delta/components/atoms';
```

## Rules

- **Palette-agnostic.** Every colour must come from a `--ed-*` CSS variable
  defined in `theme/palettes.scss`. A hardcoded hex inside an atom is a
  review block.
- **No data side-effects.** Atoms read props and render. No Redux, no
  router, no fetches. Composition happens at the block layer (B3-B4).
- **No icon library.** Atoms accept `ReactNode` slots (`leadingIcon`,
  `icon`, etc.). Each block decides which icon source to inject.
- **Light typing.** Each atom exports its `Props` plus enum types
  (`ButtonVariant`, `PillTone`, etc.) so blocks can reuse them.

## Catalogue

| Atom    | Purpose                                           | Key props                          |
| ------- | ------------------------------------------------- | ---------------------------------- |
| Button  | Primary CTA (`Reservar`, `Continuar`)             | `variant`, `size`, `block`, `as`   |
| Card    | Surface for properties, modals, side panels       | `elevation 0..3`, `interactive`, `header`, `footer` |
| Pill    | Tag for amenities, statuses, source              | `tone`, `outline`, `icon`          |
| Stack   | Flex layout primitive                             | `direction`, `gap`, `wrap`, `align`, `justify` |
| Heading | `h1`–`h6` wrapping the typography hierarchy       | `level`, `tone`, `decorative`, `size` |
| Price   | Currency-aware money display (Intl)               | `amount`, `currency`, `locale`, `suffix`, `size`, `strikethrough` |
| Rating  | Read-only 0–5 stars with fractional fill          | `value`, `max`, `count`, `size`, `showScore` |

## Adding a new atom

Repeat the same skeleton and respect the rules above. The minimum a new
atom needs to ship:

1. `Atom.tsx` exporting a `React.FC` (or `forwardRef` if any consumer might
   need DOM access).
2. `Atom.scss` using `--ed-*` variables.
3. `Atom.test.tsx` covering at least: default render, every variant/size,
   any prop that toggles a class, and basic a11y if relevant.
4. `Atom.stories.tsx` with a default story plus an `AcrossPalettes` smoke
   story for anything that uses primary/secondary/accent colours.
5. `index.ts` re-export, then add to `atoms/index.ts`.

## What is *not* an atom

- Anything that knows about a `Property` or `Booking` shape (those are
  blocks/molecules — Day 2 B3 onwards).
- Anything calling Plone REST API (move to a hook, used by a block).
- Anything that renders an icon set (let the block pick its icons).
