import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyAmenitiesView from './PropertyAmenitiesView';

describe('<PropertyAmenitiesView />', () => {
  it('renders flat items from string (comma or pipe)', () => {
    render(
      <PropertyAmenitiesView
        data={{
          '@type': 'propertyAmenities',
          heading: 'Comoditats',
          items: 'wifi, aire condicionat | cuina equipada',
        }}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Comoditats' })).toBeInTheDocument();
    expect(screen.getByText('wifi')).toBeInTheDocument();
    expect(screen.getByText('aire condicionat')).toBeInTheDocument();
    expect(screen.getByText('cuina equipada')).toBeInTheDocument();
  });

  it('renders flat items from array', () => {
    render(
      <PropertyAmenitiesView
        data={{
          '@type': 'propertyAmenities',
          items: ['wifi', 'aire'],
        }}
      />,
    );
    expect(screen.getByText('wifi')).toBeInTheDocument();
    expect(screen.getByText('aire')).toBeInTheDocument();
  });

  it('renders grouped amenities with group titles', () => {
    render(
      <PropertyAmenitiesView
        data={{
          '@type': 'propertyAmenities',
          heading: 'Comoditats',
          groups: [
            { title: 'Cuina', items: 'forn|nevera|cafetera' },
            { title: 'Exterior', items: ['piscina', 'jardí'] },
          ],
        }}
      />,
    );
    expect(screen.getByText('Cuina')).toBeInTheDocument();
    expect(screen.getByText('Exterior')).toBeInTheDocument();
    expect(screen.getByText('forn')).toBeInTheDocument();
    expect(screen.getByText('cafetera')).toBeInTheDocument();
    expect(screen.getByText('piscina')).toBeInTheDocument();
  });

  it('returns null when there is nothing to render', () => {
    const { container } = render(
      <PropertyAmenitiesView data={{ '@type': 'propertyAmenities' }} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
