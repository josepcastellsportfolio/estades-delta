import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Heading from './Heading';
import PaletteScope from '../../PaletteScope';
import { PALETTES, type PaletteName } from '../../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Atoms/Heading',
  component: Heading,
  parameters: { layout: 'centered' },
  argTypes: {
    level: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    tone: {
      control: 'select',
      options: [undefined, 'primary', 'secondary', 'muted', 'inverse'],
    },
    decorative: { control: 'boolean' },
    size: { control: 'select', options: [undefined, '2xl', 'xl', 'lg'] },
  },
} satisfies Meta<typeof Heading>;
export default meta;

type Story = StoryObj<typeof Heading>;

export const Level1: Story = {
  args: { level: 1, children: "Una casa al Delta de l'Ebre" },
};

export const Level2: Story = {
  args: { level: 2, children: 'Sobre la propietat' },
};

export const Level3: Story = { args: { level: 3, children: 'Comoditats' } };

export const HeroDecorative: Story = {
  args: {
    level: 1,
    decorative: true,
    children: "El Delta·l'experiència",
  },
};

/** Visual hierarchy at a glance, with multilingual glyphs. */
export const Hierarchy: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <Heading level={1}>Una casa al Delta · CA</Heading>
      <Heading level={2}>Una casa en el Delta · ES</Heading>
      <Heading level={3}>A house in the Delta · EN</Heading>
      <Heading level={4}>Une maison dans le Delta · FR</Heading>
      <Heading level={5}>Ein Haus im Delta · DE</Heading>
      <Heading level={6}>l·l ñ ç ß œ · glifos especiales</Heading>
    </div>
  ),
};

/** Tone variants across palettes. */
export const TonesAcrossPalettes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <div
            style={{
              padding: 24,
              background: 'var(--ed-color-bg)',
              borderRadius: 16,
              width: 280,
            }}
          >
            <Heading level={1}>Estades</Heading>
            <Heading level={2} tone="primary">
              Primari
            </Heading>
            <Heading level={3} tone="secondary">
              Secundari
            </Heading>
            <Heading level={4} tone="muted">
              Mut
            </Heading>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ed-color-text-muted)' }}>
              {p}
            </div>
          </div>
        </PaletteScope>
      ))}
    </div>
  ),
};
