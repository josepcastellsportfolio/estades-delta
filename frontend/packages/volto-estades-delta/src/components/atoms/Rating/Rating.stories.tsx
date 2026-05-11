import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Rating from './Rating';
import PaletteScope from '../../PaletteScope';
import { PALETTES, type PaletteName } from '../../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Atoms/Rating',
  component: Rating,
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 5, step: 0.1 } },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    showScore: { control: 'boolean' },
  },
} satisfies Meta<typeof Rating>;
export default meta;

type Story = StoryObj<typeof Rating>;

export const Full: Story = { args: { value: 5 } };
export const Partial: Story = { args: { value: 4.3 } };
export const WithCount: Story = { args: { value: 4.7, count: 128 } };
export const ScoreHidden: Story = { args: { value: 3.5, showScore: false } };
export const LargeSize: Story = { args: { value: 4.8, size: 'lg', count: 42 } };

/** Star colour comes from `--ed-color-secondary-default` so the rating tints
 *  per palette without code changes. Visual smoke test below. */
export const AcrossPalettes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <div
            style={{
              padding: 24,
              background: 'var(--ed-color-bg)',
              borderRadius: 16,
              width: 220,
            }}
          >
            <Rating value={4.6} count={84} size="lg" />
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
