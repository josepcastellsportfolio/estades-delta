/**
 * PropertyMap tests.
 *
 * The Leaflet map itself is NOT tested here — dynamic-import + useEffect means
 * the map canvas only renders in a real browser. We test:
 *   - The placeholder rendered when no coordinates are provided
 *   - The container div rendered when coordinates ARE provided
 *   - That `content.latitude / content.longitude` are used as fallback coords
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithIntl as render } from '../../i18n/testUtils';
import PropertyMapView from './PropertyMapView';

// Mock dynamic `import('leaflet')` so it never runs in jsdom.
jest.mock('leaflet', () => ({}), { virtual: true });

const baseData = { '@type': 'propertyMap' as const };

describe('<PropertyMapView />', () => {
  it('shows the "no coordinates" placeholder when lat/lng are absent', () => {
    render(<PropertyMapView data={baseData} />);
    expect(
      screen.getByText(/sense coordenades/i),
    ).toBeInTheDocument();
  });

  it('renders the map container div when block data coords are set', () => {
    const { container } = render(
      <PropertyMapView
        data={{ ...baseData, latitude: 40.7, longitude: 0.5 }}
      />,
    );
    expect(container.querySelector('.propertyMap__container')).not.toBeNull();
    expect(screen.queryByText(/sense coordenades/i)).toBeNull();
  });

  it('falls back to content coords when block data has none', () => {
    const { container } = render(
      <PropertyMapView
        data={baseData}
        content={{ latitude: 40.7, longitude: 0.5, title: 'Casa Test' }}
      />,
    );
    expect(container.querySelector('.propertyMap__container')).not.toBeNull();
  });

  it('block data coords take precedence over content coords', () => {
    // Both provided — block data wins (renders map, not placeholder).
    const { container } = render(
      <PropertyMapView
        data={{ ...baseData, latitude: 41.0, longitude: 1.0 }}
        content={{ latitude: 99.0, longitude: 99.0 }}
      />,
    );
    expect(container.querySelector('.propertyMap__container')).not.toBeNull();
  });
});
