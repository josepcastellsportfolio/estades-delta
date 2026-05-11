import React from 'react';
import { render, screen } from '@testing-library/react';
import Pill from './Pill';

describe('<Pill />', () => {
  it('defaults to neutral tone', () => {
    render(<Pill>wifi</Pill>);
    const p = screen.getByText('wifi');
    expect(p.className).toContain('ed-pill--neutral');
  });

  it('applies tone modifier', () => {
    render(<Pill tone="success">paid</Pill>);
    expect(screen.getByText('paid').className).toContain('ed-pill--success');
  });

  it('applies outline modifier', () => {
    render(
      <Pill tone="primary" outline>
        primary outline
      </Pill>,
    );
    const p = screen.getByText('primary outline');
    expect(p.className).toContain('ed-pill--primary');
    expect(p.className).toContain('ed-pill--outline');
  });

  it('renders icon before children', () => {
    render(<Pill icon={<span data-testid="ic">★</span>}>5.0</Pill>);
    expect(screen.getByTestId('ic')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });
});
