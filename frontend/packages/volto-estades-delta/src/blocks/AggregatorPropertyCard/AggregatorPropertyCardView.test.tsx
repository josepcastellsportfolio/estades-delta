import React from 'react';
import { render, screen } from '@testing-library/react';
import AggregatorPropertyCardView from './AggregatorPropertyCardView';

describe('<AggregatorPropertyCardView />', () => {
  it('renders title as h3, location, meta and rating', () => {
    render(
      <AggregatorPropertyCardView
        data={{
          '@type': 'aggregatorPropertyCard',
          title: 'Casa Demo',
          location: 'Deltebre · Riumar',
          capacity: 6,
          bedrooms: 3,
          bathrooms: 2,
          rating: 4.7,
          ratingCount: 84,
          fromPrice: 85,
          href: '/properties/casa-demo',
        }}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Casa Demo' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Deltebre · Riumar')).toBeInTheDocument();
    expect(screen.getByText('6 hostes')).toBeInTheDocument();
    expect(screen.getByText('3 hab')).toBeInTheDocument();
    expect(screen.getByText('2 banys')).toBeInTheDocument();
    expect(screen.getByText('(84)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Veure' })).toHaveAttribute(
      'href',
      '/properties/casa-demo',
    );
  });

  it('renders placeholder when image is missing', () => {
    render(
      <AggregatorPropertyCardView
        data={{ '@type': 'aggregatorPropertyCard', title: 't' }}
      />,
    );
    expect(screen.getByText('(sense imatge)')).toBeInTheDocument();
  });

  it('renders tag pill when tag prop is set', () => {
    render(
      <AggregatorPropertyCardView
        data={{
          '@type': 'aggregatorPropertyCard',
          title: 't',
          tag: 'Destacat',
        }}
      />,
    );
    expect(screen.getByText('Destacat')).toBeInTheDocument();
  });

  it('omits the Veure button when no href is provided', () => {
    render(
      <AggregatorPropertyCardView
        data={{ '@type': 'aggregatorPropertyCard', title: 't' }}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Veure' })).toBeNull();
  });
});
