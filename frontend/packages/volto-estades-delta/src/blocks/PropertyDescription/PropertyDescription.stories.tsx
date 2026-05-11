import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PropertyDescriptionView from './PropertyDescriptionView';
import PaletteScope from '../../components/PaletteScope';
import { PALETTES, type PaletteName } from '../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Blocks/PropertyDescription',
  component: PropertyDescriptionView,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PropertyDescriptionView>;
export default meta;

type Story = StoryObj<typeof PropertyDescriptionView>;

const sampleData = {
  '@type': 'propertyDescription' as const,
  heading: 'Sobre la propietat',
  body:
    "Una casa boutique al Delta de l'Ebre. Tres dormitoris, dos banys, " +
    'cuina equipada i una terrassa amb vistes al riu. Ideal per a famílies o ' +
    "grups d'amics que vulguin gaudir de l'entorn natural i la gastronomia local.",
};

export const Default: Story = {
  render: () => (
    <div style={{ background: 'var(--ed-color-bg)', padding: 32 }}>
      <PropertyDescriptionView data={sampleData} />
    </div>
  ),
};

export const OnlyHeading: Story = {
  render: () => (
    <div style={{ background: 'var(--ed-color-bg)', padding: 32 }}>
      <PropertyDescriptionView
        data={{ '@type': 'propertyDescription', heading: sampleData.heading }}
      />
    </div>
  ),
};

export const AcrossPalettes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <div
            style={{
              background: 'var(--ed-color-bg)',
              padding: 32,
              borderBottom: '1px solid var(--ed-color-border)',
            }}
          >
            <PropertyDescriptionView data={sampleData} />
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--ed-color-text-muted)',
              }}
            >
              {p}
            </div>
          </div>
        </PaletteScope>
      ))}
    </div>
  ),
};
