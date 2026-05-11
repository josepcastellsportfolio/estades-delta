import React from 'react';
import { render, screen } from '@testing-library/react';
import Heading from './Heading';

describe('<Heading />', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('renders h%i for level=%i', (level) => {
    render(<Heading level={level}>Title</Heading>);
    const h = screen.getByRole('heading', { level, name: 'Title' });
    expect(h.tagName).toBe(`H${level}`);
  });

  it('applies tone class', () => {
    render(
      <Heading level={2} tone="muted">
        x
      </Heading>,
    );
    expect(screen.getByText('x').className).toContain('ed-heading--tone-muted');
  });

  it('adds decorative modifier', () => {
    render(
      <Heading level={1} decorative>
        Hero
      </Heading>,
    );
    expect(screen.getByText('Hero').className).toContain(
      'ed-heading--decorative',
    );
  });

  it('honours size override', () => {
    render(
      <Heading level={3} size="lg">
        x
      </Heading>,
    );
    expect(screen.getByText('x').className).toContain('ed-heading--size-lg');
  });
});
