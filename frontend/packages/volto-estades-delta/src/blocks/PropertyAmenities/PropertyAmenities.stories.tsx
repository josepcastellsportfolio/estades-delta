import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PropertyAmenitiesView from './PropertyAmenitiesView';
import PaletteScope from '../../components/PaletteScope';
import { PALETTES, type PaletteName } from '../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Blocks/PropertyAmenities',
  component: PropertyAmenitiesView,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PropertyAmenitiesView>;
export default meta;

type Story = StoryObj<typeof PropertyAmenitiesView>;

export const Flat: Story = {
  render: () => (
    <PropertyAmenitiesView
      data={{
        '@type': 'propertyAmenities',
        heading: 'Comoditats',
        items: 'wifi, aire condicionat, cuina equipada, aparcament, terrassa, BBQ',
      }}
    />
  ),
};

export const Grouped: Story = {
  render: () => (
    <PropertyAmenitiesView
      data={{
        '@type': 'propertyAmenities',
        heading: 'Comoditats',
        groups: [
          { title: 'Generals', items: 'wifi|aire condicionat|calefacció' },
          { title: 'Cuina', items: 'forn|nevera|cafetera|microones' },
          { title: 'Exterior', items: 'piscina|terrassa|jardí|BBQ' },
        ],
      }}
    />
  ),
};

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
            <PropertyAmenitiesView
              data={{
                '@type': 'propertyAmenities',
                heading: 'Comoditats',
                groups: [
                  { title: 'Cuina', items: 'forn|nevera|cafetera' },
                  { title: 'Exterior', items: 'piscina|terrassa|BBQ' },
                ],
              }}
            />
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
