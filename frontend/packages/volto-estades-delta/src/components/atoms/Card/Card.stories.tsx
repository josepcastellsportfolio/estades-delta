import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';
import Button from '../Button';
import PaletteScope from '../../PaletteScope';
import { PALETTES, type PaletteName } from '../../../theme/tokens';

const meta = {
  title: 'EstadesDelta/Atoms/Card',
  component: Card,
  parameters: { layout: 'centered' },
  argTypes: {
    elevation: { control: { type: 'range', min: 0, max: 3, step: 1 } },
    interactive: { control: 'boolean' },
  },
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  args: {
    elevation: 1,
    children: (
      <>
        <h3 style={{ margin: 0 }}>Casa Demo · Riumar</h3>
        <p style={{ margin: 0, color: 'var(--ed-color-text-secondary)' }}>
          Una casa al Delta, vora el riu. 6 hostes, 3 hab.
        </p>
      </>
    ),
  },
};

export const WithHeaderFooter: Story = {
  args: {
    elevation: 2,
    header: <h3 style={{ margin: 0 }}>Casa Demo · Riumar</h3>,
    footer: <Button variant="primary">Reservar</Button>,
    children: (
      <p style={{ margin: 0, color: 'var(--ed-color-text-secondary)' }}>
        Bonica casa al Delta amb vista al riu. 6 hostes, 3 hab, 2 banys.
      </p>
    ),
  },
};

export const Interactive: Story = {
  args: {
    elevation: 1,
    interactive: true,
    children: <>Hover over me</>,
  },
};

/** All three palettes side by side — quick smoke check for surface tokens. */
export const InAllPalettes: Story = {
  args: { elevation: 2 },
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {PALETTES.map((p: PaletteName) => (
        <PaletteScope palette={p} key={p}>
          <Card
            header={<h3 style={{ margin: 0 }}>{p}</h3>}
            footer={<Button variant="primary">Reservar</Button>}
          >
            <p style={{ margin: 0, color: 'var(--ed-color-text-secondary)' }}>
              Surfaces and text in {p}.
            </p>
          </Card>
        </PaletteScope>
      ))}
    </div>
  ),
};
