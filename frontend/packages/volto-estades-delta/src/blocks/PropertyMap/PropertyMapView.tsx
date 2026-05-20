/**
 * PropertyMap — View component.
 *
 * Renders an interactive Leaflet + OpenStreetMap tile map centred on the
 * property's coordinates. SSR-safe: the Leaflet library is loaded dynamically
 * inside useEffect so it only runs on the client. A static placeholder is
 * rendered on the server and during hydration.
 *
 * Coordinates are read in this order (first wins):
 *   1. Block data fields (data.latitude / data.longitude)
 *   2. Parent Plone content object (content?.latitude / content?.longitude)
 *
 * If no coordinates are found, a "no location set" message is shown instead.
 *
 * Uses plain `leaflet` (not react-leaflet) to avoid SSR adapter complexity.
 * Tiles: OpenStreetMap standard layer (no API key required).
 */
import React, { useCallback, useEffect, useRef } from 'react';
import './PropertyMap.scss';
import type { PropertyMapData } from './schema';

// Type alias so we don't import the full leaflet types in the module scope
// (that would break SSR because leaflet references `window` at import time).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletModule = any;

export interface PropertyContent {
  title?: string;
  latitude?: number | string;
  longitude?: number | string;
}

interface PropertyMapViewProps {
  data: PropertyMapData;
  /** Passed by Volto when the block is rendered inside a content view. */
  content?: PropertyContent;
}

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const DEFAULT_ZOOM = 14;
const DEFAULT_HEIGHT = 360;

function parseCoord(val: number | string | undefined): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isFinite(n) ? n : null;
}

const PropertyMapView: React.FC<PropertyMapViewProps> = ({ data, content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Hold the Leaflet map instance so we can destroy it on unmount.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  const lat = parseCoord(data.latitude) ?? parseCoord(content?.latitude);
  const lng = parseCoord(data.longitude) ?? parseCoord(content?.longitude);
  const zoom = data.zoom ?? DEFAULT_ZOOM;
  const height = data.height ?? DEFAULT_HEIGHT;
  const title = content?.title ?? 'Propietat';

  const initMap = useCallback(async () => {
    if (!containerRef.current) return;
    if (lat === null || lng === null) return;
    // Destroy existing instance before re-initialising (hot reload safe).
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Dynamic import: only runs on the client, never during SSR.
    const L: LeafletModule = (await import('leaflet')).default;

    // Leaflet CSS must be loaded once. We inject it dynamically so Webpack
    // does not try to server-side-render the CSS (which references image URLs).
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href =
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Fix the default marker icon paths that are broken by Webpack asset hashing.
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(containerRef.current).setView([lat, lng], zoom);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(title);

    mapRef.current = map;
  }, [lat, lng, zoom, title]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  const hasCoords = lat !== null && lng !== null;

  return (
    <div
      className="propertyMap"
      style={{ '--property-map-height': `${height}px` } as React.CSSProperties}
    >
      {hasCoords ? (
        <div
          ref={containerRef}
          className="propertyMap__container"
          aria-label={`Mapa de localització de ${title}`}
        />
      ) : (
        <div className="propertyMap__placeholder">
          Sense coordenades — afegeix latitud i longitud a la propietat.
        </div>
      )}
    </div>
  );
};

export default PropertyMapView;
