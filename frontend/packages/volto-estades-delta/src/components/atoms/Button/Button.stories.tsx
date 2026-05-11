import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';
import PaletteScope from '../../PaletteScope';
import { PALETTES, type PaletteName } from '../../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Atoms/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    block: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Reservar' },
};
export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Veure detalls' },
};
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel·lar' },
};
export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Reservar' },
};
export const Block: Story = {
  args: {
    variant: 'primary',
    block: true,
    children: 'Continuar amb la reserva',
  },
};

/** Visual regression across all three palettes — quick smoke check. */
export const InAllPalettes: Story = {
  args: { variant: 'primary', children: 'Reservar' },
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <div
            style={{
              padding: 24,
              background: 'var(--ed-color-bg)',
              borderRadius: 16,
            }}
          >
            <Button {...args} />
            <div
              style={{
                fontSize: 12,
                marginTop: 8,
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
