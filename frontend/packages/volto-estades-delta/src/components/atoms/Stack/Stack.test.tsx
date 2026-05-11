import React from 'react';
import { render, screen } from '@testing-library/react';
import Stack from './Stack';

describe('<Stack />', () => {
  it('renders vertical by default with gap-4', () => {
    render(
      <Stack data-testid="s">
        <span>a</span>
        <span>b</span>
      </Stack>,
    );
    const s = screen.getByTestId('s');
    expect(s.className).toContain('ed-stack--vertical');
    expect(s.className).toContain('ed-stack--gap-4');
  });

  it('switches to horizontal with custom gap and wrap', () => {
    render(
      <Stack data-testid="s" direction="horizontal" gap={2} wrap>
        x
      </Stack>,
    );
    const s = screen.getByTestId('s');
    expect(s.className).toContain('ed-stack--horizontal');
    expect(s.className).toContain('ed-stack--gap-2');
    expect(s.className).toContain('ed-stack--wrap');
  });

  it('applies align and justify modifiers', () => {
    render(
      <Stack data-testid="s" align="center" justify="between">
        x
      </Stack>,
    );
    const s = screen.getByTestId('s');
    expect(s.className).toContain('ed-stack--align-center');
    expect(s.className).toContain('ed-stack--justify-between');
  });

  it('renders as custom tag', () => {
    render(
      <Stack data-testid="s" as="nav">
        x
      </Stack>,
    );
    expect(screen.getByTestId('s').tagName).toBe('NAV');
  });
});
