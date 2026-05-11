import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AggregatorPropertyCardView, {
  type AggregatorPropertyCardData,
} from './AggregatorPropertyCardView';
import PaletteScope from '../../components/PaletteScope';
import { PALETTES, type PaletteName } from '../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Blocks/AggregatorPropertyCard',
  component: AggregatorPropertyCardView,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AggregatorPropertyCardView>;
export default meta;

type Story = StoryObj<typeof AggregatorPropertyCardView>;

const base: AggregatorPropertyCardData = {
  '@type': 'aggregatorPropertyCard',
  title: 'Casa Demo · Riumar',
  location: 'Deltebre · Riumar',
  capacity: 6,
  bedrooms: 3,
  bathrooms: 2,
  rating: 4.7,
  ratingCount: 84,
  fromPrice: 85,
  href: '/properties/casa-demo-riumar',
};

const sampleImg =
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=70';

export const Default: Story = {
  render: () => <AggregatorPropertyCardView data={{ ...base, image: sampleImg }} />,
};

export const WithoutImage: Story = {
  render: () => <AggregatorPropertyCardView data={base} />,
};

export const WithTag: Story = {
  render: () => (
    <AggregatorPropertyCardView
      data={{ ...base, image: sampleImg, tag: 'Destacat' }}
    />
  ),
};

export const ListingRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <AggregatorPropertyCardView data={{ ...base, image: sampleImg }} />
      <AggregatorPropertyCardView
        data={{
          ...base,
          title: 'Mas del Fangar',
          image: sampleImg,
          tag: 'Nou',
          fromPrice: 110,
          rating: 4.9,
          ratingCount: 31,
        }}
      />
      <AggregatorPropertyCardView
        data={{
          ...base,
          title: 'Capvespre al Delta',
          fromPrice: 160,
          rating: 4.5,
          ratingCount: 12,
        }}
      />
    </div>
  ),
};

export const AcrossPalettes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <div
            style={{
              padding: 24,
              background: 'var(--ed-color-bg)',
              borderBottom: '1px solid var(--ed-color-border)',
            }}
          >
            <AggregatorPropertyCardView
              data={{ ...base, image: sampleImg, tag: p }}
            />
            <div
              style={{
                marginTop: 12,
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
