import React from 'react';
import Heading from '../../components/atoms/Heading';
import Stack from '../../components/atoms/Stack';
import './PropertyDescription.scss';

/**
 * Plone `RichText` fields arrive over the REST API as an object, not a string:
 *   { 'content-type': 'text/html', data: '<p>…</p>', encoding: 'utf8' }
 * Block data, by contrast, carries a plain string. Accept both.
 */
export interface RichTextValue {
  'content-type'?: string;
  data?: string;
  encoding?: string;
}

export interface PropertyDescriptionData {
  '@type': 'propertyDescription';
  heading?: string;
  body?: string | RichTextValue;
}

interface ViewProps {
  data: PropertyDescriptionData;
  className?: string;
}

/** Unwrap a RichText object to its markup; pass plain strings through. */
export function richTextToHtml(value: string | RichTextValue | undefined): {
  html: string;
  isHtml: boolean;
} {
  if (!value) return { html: '', isHtml: false };
  if (typeof value === 'string') {
    // A block-authored string may still be markup if it came from a rich widget.
    return { html: value, isHtml: /<[a-z][\s\S]*>/i.test(value) };
  }
  const data = value.data ?? '';
  const isHtml = (value['content-type'] ?? 'text/html').includes('html');
  return { html: data, isHtml };
}

const PropertyDescriptionView: React.FC<ViewProps> = ({ data, className }) => {
  const { html, isHtml } = richTextToHtml(data.body);

  return (
    <section
      className={`block propertyDescription ${className ?? ''}`}
      data-block-type="propertyDescription"
    >
      <Stack direction="vertical" gap={4}>
        {data.heading ? <Heading level={2}>{data.heading}</Heading> : null}
        {html ? (
          isHtml ? (
            // Markup comes from a Plone RichText field or the rich-text widget:
            // authored by editors with edit rights, never by site visitors.
            // Rendering it as text is what made literal <p> tags show up on the
            // public page.
            <div
              className="propertyDescription__body"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="propertyDescription__body">{html}</p>
          )
        ) : null}
      </Stack>
    </section>
  );
};

export default PropertyDescriptionView;
