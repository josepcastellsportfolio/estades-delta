import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Price from './Price';

const meta = {
  title: 'EstadesDelta/Atoms/Price',
  component: Price,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['md', 'lg', 'xl'] },
    strikethrough: { control: 'boolean' },
  },
} satisfies Meta<typeof Price>;
export default meta;

type Story = StoryObj<typeof Price>;

export const PerNight: Story = {
  args: { amount: 85, suffix: '/ nit', size: 'lg' },
};

export const FractionalES: Story = {
  args: { amount: 85.5, locale: 'es-ES', suffix: 'por noche' },
};

export const EnglishUSD: Story = {
  args: { amount: 1234, currency: 'USD', locale: 'en-US', size: 'xl' },
};

export const FrenchEUR: Story = {
  args: { amount: 1234.5, locale: 'fr-FR', suffix: '/ nuit' },
};

export const Discount: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <Price amount={120} size="md" strikethrough />
      <Price amount={85} size="lg" suffix="/ nit" />
    </div>
  ),
};
