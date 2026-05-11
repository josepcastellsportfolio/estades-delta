import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Stack from './Stack';
import Pill from '../Pill';

const meta = {
  title: 'EstadesDelta/Atoms/Stack',
  component: Stack,
  parameters: { layout: 'centered' },
  argTypes: {
    direction: { control: 'select', options: ['horizontal', 'vertical'] },
    gap: { control: 'select', options: [0, 1, 2, 3, 4, 6, 8, 12, 16] },
    wrap: { control: 'boolean' },
    align: {
      control: 'select',
      options: [undefined, 'start', 'center', 'end', 'stretch'],
    },
    justify: {
      control: 'select',
      options: [undefined, 'start', 'center', 'end', 'between'],
    },
  },
} satisfies Meta<typeof Stack>;
export default meta;

type Story = StoryObj<typeof Stack>;

export const Vertical: Story = {
  args: { direction: 'vertical', gap: 4 },
  render: (args) => (
    <Stack {...args}>
      <Pill>1</Pill>
      <Pill>2</Pill>
      <Pill>3</Pill>
    </Stack>
  ),
};

export const Horizontal: Story = {
  args: { direction: 'horizontal', gap: 2 },
  render: (args) => (
    <Stack {...args}>
      <Pill>wifi</Pill>
      <Pill>aire</Pill>
      <Pill>cuina</Pill>
    </Stack>
  ),
};

export const HorizontalWrap: Story = {
  args: { direction: 'horizontal', gap: 2, wrap: true },
  render: (args) => (
    <div style={{ width: 220 }}>
      <Stack {...args}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Pill key={i}>amenity {i + 1}</Pill>
        ))}
      </Stack>
    </div>
  ),
};
