import React from 'react';
import { render, screen } from '@testing-library/react';
import Price from './Price';

describe('<Price />', () => {
  it('renders an integer amount without decimals', () => {
    const { container } = render(<Price amount={85} locale="ca-ES" />);
    const root = container.querySelector('.ed-price') as HTMLElement;
    expect(root.textContent).toMatch(/85\s?€/);
  });

  it('renders fractional amount with two decimals', () => {
    const { container } = render(<Price amount={85.5} locale="ca-ES" />);
    const root = container.querySelector('.ed-price') as HTMLElement;
    // Decimal separator may be `,` (ca-ES) or `.` depending on Intl polyfill.
    expect(root.textContent).toMatch(/85[.,]50\s?€/);
  });

  it('renders the suffix label when provided', () => {
    render(<Price amount={85} suffix="/ nit" />);
    expect(screen.getByText('/ nit')).toBeInTheDocument();
  });

  it('applies strikethrough modifier', () => {
    const { container } = render(<Price amount={85} strikethrough />);
    expect(
      (container.querySelector('.ed-price') as HTMLElement).className,
    ).toContain('ed-price--strikethrough');
  });

  it('honours size modifier', () => {
    const { container } = render(<Price amount={85} size="xl" />);
    expect(
      (container.querySelector('.ed-price') as HTMLElement).className,
    ).toContain('ed-price--size-xl');
  });

  it('exposes optional aria-label', () => {
    const { container } = render(
      <Price amount={85} ariaLabel="vuitanta-cinc euros la nit" />,
    );
    expect(
      (container.querySelector('.ed-price') as HTMLElement).getAttribute(
        'aria-label',
      ),
    ).toBe('vuitanta-cinc euros la nit');
  });
});
