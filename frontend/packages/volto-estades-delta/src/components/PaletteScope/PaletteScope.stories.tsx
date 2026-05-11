import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PaletteScope from './PaletteScope';
import { PALETTES, type PaletteName } from '../../theme/tokens';

/**
 * Sample boutique card used to visualise palette tokens in isolation. Uses only
 * CSS custom properties so we can prove the cascade works.
 */
const SampleCard: React.FC<{ name: string }> = ({ name }) => (
  <div
    style={{
      background: 'var(--ed-color-surface-elevated)',
      color: 'var(--ed-color-text-primary)',
      border: '1px solid var(--ed-color-border)',
      borderRadius: 'var(--ed-radius-lg)',
      padding: 'var(--ed-space-6)',
      boxShadow: 'var(--ed-shadow-md)',
      fontFamily: 'var(--ed-font-body)',
      width: 280,
    }}
  >
    <h2
      style={{
        fontFamily: 'var(--ed-font-display)',
        fontSize: 'var(--ed-font-size-2xl)',
        margin: '0 0 var(--ed-space-2)',
        color: 'var(--ed-color-primary-default)',
        lineHeight: 'var(--ed-line-height-tight)',
      }}
    >
      {name}
    </h2>
    <p
      style={{
        margin: '0 0 var(--ed-space-4)',
        color: 'var(--ed-color-text-secondary)',
        lineHeight: 'var(--ed-line-height-relaxed)',
      }}
    >
      Una casa al Delta amb vista al riu. Frase sample que serveix per validar
      tipografia DM Sans + DM Serif Display amb caràcters catalans com l·l, ñ,
      ç i àccents oberts.
    </p>
    <button
      type="button"
      style={{
        background: 'var(--ed-color-primary-default)',
        color: 'var(--ed-color-primary-contrast)',
        border: 'none',
        padding: 'var(--ed-space-3) var(--ed-space-6)',
        borderRadius: 'var(--ed-radius-full)',
        fontFamily: 'var(--ed-font-body)',
        fontWeight: 'var(--ed-font-weight-medium)',
        cursor: 'pointer',
      }}
    >
      Reservar
    </button>
    <div
      style={{
        marginTop: 'var(--ed-space-4)',
        fontSize: 'var(--ed-font-size-sm)',
        color: 'var(--ed-color-text-muted)',
      }}
    >
      ★ ★ ★ ★ ★ · 6 hostes max · 3 hab
    </div>
  </div>
);

const meta = {
  title: 'EstadesDelta/PaletteScope',
  component: PaletteScope,
  parameters: { layout: 'centered' },
  argTypes: {
    palette: { control: 'select', options: PALETTES },
  },
} satisfies Meta<typeof PaletteScope>;
export default meta;

type Story = StoryObj<typeof PaletteScope>;

export const Arrossar: Story = {
  args: { palette: 'arrossar' },
  render: (args) => (
    <PaletteScope {...args}>
      <SampleCard name="Mas de l'Arrossar" />
    </PaletteScope>
  ),
};

export const RiuIMar: Story = {
  args: { palette: 'riu-i-mar' },
  render: (args) => (
    <PaletteScope {...args}>
      <SampleCard name="Casa de Riumar" />
    </PaletteScope>
  ),
};

export const Capvespre: Story = {
  args: { palette: 'capvespre' },
  render: (args) => (
    <PaletteScope {...args}>
      <SampleCard name="Capvespre al Delta" />
    </PaletteScope>
  ),
};

/** Side-by-side comparison of all three palettes, useful for visual review. */
export const AllPalettes: Story = {
  args: { palette: 'arrossar' },
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <SampleCard name={p} />
        </PaletteScope>
      ))}
    </div>
  ),
};
