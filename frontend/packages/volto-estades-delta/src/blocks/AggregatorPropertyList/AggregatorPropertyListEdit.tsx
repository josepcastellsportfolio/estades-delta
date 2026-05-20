/**
 * AggregatorPropertyList — Edit component (CMS backend mode).
 *
 * Renders a static preview with 3 placeholder cards so the editor can see
 * the grid layout without firing real network requests during edit.
 */
import React from 'react';
import AggregatorPropertyCardView from '../AggregatorPropertyCard/AggregatorPropertyCardView';
import './AggregatorPropertyList.scss';
import type { AggregatorPropertyListData } from './schema';

const PLACEHOLDER_CARDS = [
  {
    '@type': 'aggregatorPropertyCard' as const,
    title: 'Casa Exemple Riumar',
    location: 'Deltebre · Riumar',
    capacity: 6,
    bedrooms: 3,
    bathrooms: 2,
    fromPrice: 85,
    currency: 'EUR',
    locale: 'ca-ES',
    href: '#',
  },
  {
    '@type': 'aggregatorPropertyCard' as const,
    title: 'Apartament Exemple Riu i Mar',
    location: "l'Ampolla · l'Ampolla",
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    fromPrice: 70,
    currency: 'EUR',
    locale: 'ca-ES',
    href: '#',
  },
  {
    '@type': 'aggregatorPropertyCard' as const,
    title: 'Mas Exemple Capvespre',
    location: 'Poblenou del Delta · Poblenou del Delta',
    capacity: 8,
    bedrooms: 4,
    bathrooms: 2,
    fromPrice: 100,
    currency: 'EUR',
    locale: 'ca-ES',
    href: '#',
  },
];

interface AggregatorPropertyListEditProps {
  data: AggregatorPropertyListData;
  selected?: boolean;
}

const AggregatorPropertyListEdit: React.FC<AggregatorPropertyListEditProps> = ({
  data,
  selected,
}) => {
  return (
    <div
      className="aggregatorPropertyList"
      style={{ opacity: selected ? 1 : 0.85, pointerEvents: 'none' }}
    >
      {data.heading ? (
        <h2 className="aggregatorPropertyList__heading">{data.heading}</h2>
      ) : null}
      <p className="aggregatorPropertyList__count">
        Vista prèvia — 3 propietats d'exemple
      </p>
      <div className="aggregatorPropertyList__grid">
        {PLACEHOLDER_CARDS.map((card) => (
          <AggregatorPropertyCardView key={card.title} data={card} />
        ))}
      </div>
    </div>
  );
};

export default AggregatorPropertyListEdit;
