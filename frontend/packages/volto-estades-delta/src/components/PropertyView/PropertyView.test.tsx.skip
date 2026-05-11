import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyView from './PropertyView';

const baseContent = {
  '@id': '/josep-test/casa-demo-riumar',
  '@type': 'Property' as const,
  title: 'Casa Demo - Riumar',
  subtitle: "Una casa al Delta de l'Ebre",
  municipality: 'Deltebre',
  zone: 'Riumar',
  max_guests: 6,
  bedrooms: 3,
  bathrooms: 2,
  base_price_low_season: 80,
  base_price_mid_season: 110,
  base_price_high_season: 160,
  cleaning_fee: 50,
  tourist_tax_per_night: 1.1,
  description: 'Bonica casa al Delta.',
};

describe('<PropertyView />', () => {
  it('uses the palette token from `content.palette.token`', () => {
    const { container } = render(
      <PropertyView
        content={{ ...baseContent, palette: { token: 'riu-i-mar' } }}
      />,
    );
    expect(
      (container.firstChild as HTMLElement).getAttribute('data-palette'),
    ).toBe('riu-i-mar');
  });

  it('accepts a plain string palette value', () => {
    const { container } = render(
      <PropertyView content={{ ...baseContent, palette: 'capvespre' }} />,
    );
    expect(
      (container.firstChild as HTMLElement).getAttribute('data-palette'),
    ).toBe('capvespre');
  });

  it('defaults to arrossar when palette is missing', () => {
    const { container } = render(<PropertyView content={baseContent} />);
    expect(
      (container.firstChild as HTMLElement).getAttribute('data-palette'),
    ).toBe('arrossar');
  });

  it('renders title, subtitle and meta facts as pills', () => {
    render(<PropertyView content={baseContent} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Casa Demo - Riumar' }),
    ).toBeInTheDocument();
    expect(screen.getByText("Una casa al Delta de l'Ebre")).toBeInTheDocument();
    expect(screen.getByText('6 hostes')).toBeInTheDocument();
    expect(screen.getByText('3 hab')).toBeInTheDocument();
    expect(screen.getByText('2 banys')).toBeInTheDocument();
  });

  it('shows the booking form aside', () => {
    render(<PropertyView content={baseContent} />);
    expect(
      screen.getByRole('button', { name: 'Reservar' }),
    ).toBeInTheDocument();
  });
});
