import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PropertyHeroView from './PropertyHeroView';
import PaletteScope from '../../components/PaletteScope';
import { PALETTES, type PaletteName } from '../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Blocks/PropertyHero',
  component: PropertyHeroView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PropertyHeroView>;
export default meta;

type Story = StoryObj<typeof PropertyHeroView>;

const sampleData = {
  '@type': 'propertyHero' as const,
  title: 'Casa Demo · Riumar',
  subtitle: "Una casa al Delta de l'Ebre, vora el riu i a tocar de mar.",
  capacity: 6,
};

const sampleImage =
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&q=70';

export const Solid: Story = {
  render: () => (
    <div style={{ background: 'var(--ed-color-bg)', padding: 32 }}>
      <PropertyHeroView data={sampleData} />
    </div>
  ),
};

export const WithImage: Story = {
  render: () => (
    <div style={{ background: 'var(--ed-color-bg)', padding: 32 }}>
      <PropertyHeroView data={{ ...sampleData, hero_image: sampleImage }} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ background: 'var(--ed-color-bg)', padding: 32 }}>
      <PropertyHeroView data={{ '@type': 'propertyHero' }} />
    </div>
  ),
};

/** Same hero in three palettes — quick visual diff for token coverage. */
export const AcrossPalettes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <div
            style={{
              padding: 24,
              background: 'var(--ed-color-bg)',
              borderBottom: '1px solid var(--ed-color-border)',
            }}
          >
            <PropertyHeroView data={sampleData} />
            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: 'var(--ed-color-text-muted)',
              }}
            >
              {p} — solid
            </div>
            <div style={{ marginTop: 24 }}>
              <PropertyHeroView
                data={{ ...sampleData, hero_image: sampleImage }}
              />
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: 'var(--ed-color-text-muted)',
              }}
            >
              {p} — with image
            </div>
          </div>
        </PaletteScope>
      ))}
    </div>
  ),
};
