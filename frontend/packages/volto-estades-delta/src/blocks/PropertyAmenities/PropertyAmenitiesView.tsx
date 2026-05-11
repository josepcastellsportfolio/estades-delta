import React from 'react';
import Heading from '../../components/atoms/Heading';
import Pill from '../../components/atoms/Pill';
import Stack from '../../components/atoms/Stack';
import './PropertyAmenities.scss';

export interface PropertyAmenitiesGroup {
  /** Group label, e.g. "Cuina", "Exterior". */
  title?: string;
  /** Pipe-separated string OR an array of amenity labels. */
  items?: string[] | string;
}

export interface PropertyAmenitiesData {
  '@type': 'propertyAmenities';
  heading?: string;
  /** Optional grouped amenities. If omitted, falls back to `items`. */
  groups?: PropertyAmenitiesGroup[];
  /** Flat list when no groups are needed. */
  items?: string[] | string;
}

interface ViewProps {
  data: PropertyAmenitiesData;
  className?: string;
}

function toArray(value: string[] | string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((s) => String(s).trim());
  // Accept comma or pipe separated strings; trim empty entries.
  return value
    .split(/[,|]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

const PropertyAmenitiesView: React.FC<ViewProps> = ({ data, className }) => {
  const flat = toArray(data.items);
  const groups = Array.isArray(data.groups) ? data.groups : [];

  const hasContent = groups.length > 0 || flat.length > 0;
  if (!hasContent && !data.heading) return null;

  return (
    <section
      className={`block propertyAmenities ${className ?? ''}`}
      data-block-type="propertyAmenities"
    >
      <Stack direction="vertical" gap={4}>
        {data.heading ? <Heading level={2}>{data.heading}</Heading> : null}

        {groups.length > 0
          ? groups.map((g, gi) => {
              const groupItems = toArray(g.items);
              if (groupItems.length === 0) return null;
              return (
                <div className="propertyAmenities__group" key={g.title ?? `g-${gi}`}>
                  {g.title ? (
                    <p className="propertyAmenities__group-title">{g.title}</p>
                  ) : null}
                  <Stack direction="horizontal" gap={2} wrap>
                    {groupItems.map((it) => (
                      <Pill key={it}>{it}</Pill>
                    ))}
                  </Stack>
                </div>
              );
            })
          : null}

        {groups.length === 0 && flat.length > 0 ? (
          <Stack direction="horizontal" gap={2} wrap>
            {flat.map((it) => (
              <Pill key={it}>{it}</Pill>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </section>
  );
};

export default PropertyAmenitiesView;
