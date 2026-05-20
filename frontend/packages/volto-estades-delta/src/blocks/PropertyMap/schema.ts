/**
 * PropertyMap block schema.
 *
 * The latitude/longitude can either be set explicitly in the block data (for
 * standalone use) or read from the parent `content` object by the View
 * component (for use inside PropertyView, where content.latitude /
 * content.longitude are always available).
 */
export interface PropertyMapData {
  '@type': 'propertyMap';
  /** Override latitude (falls back to content.latitude). */
  latitude?: number;
  /** Override longitude (falls back to content.longitude). */
  longitude?: number;
  /** Zoom level (1–18, default 14). */
  zoom?: number;
  /** Height of the map container in pixels (default 360). */
  height?: number;
}

const PropertyMapSchema = {
  title: 'Property map',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['latitude', 'longitude', 'zoom', 'height'],
    },
  ],
  properties: {
    latitude: {
      title: 'Latitude',
      description: 'Leave empty to use the Property content latitude field.',
      type: 'number',
    },
    longitude: {
      title: 'Longitude',
      description: 'Leave empty to use the Property content longitude field.',
      type: 'number',
    },
    zoom: {
      title: 'Zoom',
      description: 'Map zoom level (1–18). Default: 14.',
      type: 'integer',
      minimum: 1,
      maximum: 18,
    },
    height: {
      title: 'Height (px)',
      description: 'Map height in pixels. Default: 360.',
      type: 'integer',
    },
  },
  required: [],
};

export default PropertyMapSchema;
