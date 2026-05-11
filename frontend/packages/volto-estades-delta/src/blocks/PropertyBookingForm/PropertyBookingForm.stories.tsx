import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PropertyBookingFormView, {
  type PropertyBookingFormData,
} from './PropertyBookingFormView';
import PaletteScope from '../../components/PaletteScope';
import { PALETTES, type PaletteName } from '../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Blocks/PropertyBookingForm',
  component: PropertyBookingFormView,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PropertyBookingFormView>;
export default meta;

type Story = StoryObj<typeof PropertyBookingFormView>;

const sampleData: PropertyBookingFormData = {
  '@type': 'propertyBookingForm',
  heading: 'Reserva',
  basePriceLowSeason: 80,
  basePriceMidSeason: 110,
  basePriceHighSeason: 160,
  cleaningFee: 50,
  touristTaxPerNight: 1.1,
  maxGuests: 6,
  source: 'direct_microsite',
};

export const Default: Story = {
  render: () => <PropertyBookingFormView data={sampleData} />,
};

export const Marketplace10pct: Story = {
  render: () => (
    <PropertyBookingFormView
      data={{ ...sampleData, source: 'direct_marketplace' }}
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
            <PropertyBookingFormView data={sampleData} />
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
