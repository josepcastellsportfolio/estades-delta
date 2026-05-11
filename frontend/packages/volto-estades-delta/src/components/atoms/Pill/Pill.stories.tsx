import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Pill from './Pill';
import PaletteScope from '../../PaletteScope';
import { PALETTES, type PaletteName } from '../../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Atoms/Pill',
  component: Pill,
  parameters: { layout: 'centered' },
  argTypes: {
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'secondary',
        'accent',
        'success',
        'warning',
        'error',
      ],
    },
    outline: { control: 'boolean' },
  },
} satisfies Meta<typeof Pill>;
export default meta;

type Story = StoryObj<typeof Pill>;

export const Neutral: Story = { args: { children: 'wifi', tone: 'neutral' } };
export const Primary: Story = { args: { children: 'destacat', tone: 'primary' } };
export const Success: Story = { args: { children: 'pagat', tone: 'success' } };
export const Warning: Story = { args: { children: 'pendent', tone: 'warning' } };
export const Error: Story = { args: { children: 'fallat', tone: 'error' } };

export const WithIcon: Story = {
  args: { tone: 'primary', icon: '★', children: '5.0' },
};

/** Common amenities row, rendered across all palettes. */
export const AmenitiesRow: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <div
            style={{
              padding: 16,
              background: 'var(--ed-color-bg)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill tone="neutral">wifi</Pill>
              <Pill tone="neutral">aire condicionat</Pill>
              <Pill tone="neutral">cuina equipada</Pill>
              <Pill tone="neutral">aparcament</Pill>
              <Pill tone="primary">destacat</Pill>
              <Pill tone="accent" outline>
                solidari
              </Pill>
            </div>
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
