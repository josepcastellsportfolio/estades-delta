import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PropertyGalleryView from './PropertyGalleryView';

const meta = {
  title: 'EstadesDelta/Blocks/PropertyGallery',
  component: PropertyGalleryView,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PropertyGalleryView>;
export default meta;

type Story = StoryObj<typeof PropertyGalleryView>;

const HERO_URL =
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&q=70';

export const Empty: Story = {
  render: () => <PropertyGalleryView data={{ '@type': 'propertyGallery' }} />,
};

export const HeroOnly: Story = {
  render: () => (
    <PropertyGalleryView
      data={{ '@type': 'propertyGallery', hero: HERO_URL }}
    />
  ),
};

export const FullGrid: Story = {
  render: () => (
    <PropertyGalleryView
      data={{
        '@type': 'propertyGallery',
        hero: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&q=70',
        images: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=70',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=70',
          'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=70',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=70',
        ],
        total: 12,
        alt: 'Casa Demo Riumar',
      }}
    />
  ),
};
