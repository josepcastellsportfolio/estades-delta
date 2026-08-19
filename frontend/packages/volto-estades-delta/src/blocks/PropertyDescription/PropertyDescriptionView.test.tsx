import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyDescriptionView, {
  richTextToHtml,
} from './PropertyDescriptionView';

describe('<PropertyDescriptionView />', () => {
  it('renders heading as h2 and plain body as paragraph', () => {
    render(
      <PropertyDescriptionView
        data={{
          '@type': 'propertyDescription',
          heading: 'Sobre la propietat',
          body: 'Bonica casa al Delta.',
        }}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Sobre la propietat' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Bonica casa al Delta.')).toBeInTheDocument();
  });

  it('omits heading when missing', () => {
    render(
      <PropertyDescriptionView
        data={{ '@type': 'propertyDescription', body: 'only body' }}
      />,
    );
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('only body')).toBeInTheDocument();
  });

  it('omits body when missing', () => {
    render(
      <PropertyDescriptionView
        data={{ '@type': 'propertyDescription', heading: 'only heading' }}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'only heading' }),
    ).toBeInTheDocument();
  });

  // Regression: a Plone RichText field arrives as an object and used to be
  // rendered as a text child, so visitors saw literal "<p>…</p>" on the page.
  it('renders a Plone RichText object as real markup', () => {
    const { container } = render(
      <PropertyDescriptionView
        data={{
          '@type': 'propertyDescription',
          body: {
            'content-type': 'text/html',
            data: '<p>Casa <strong>Riumar</strong></p><ul><li>Wi-Fi</li></ul>',
            encoding: 'utf8',
          },
        }}
      />,
    );
    expect(container.querySelector('strong')).not.toBeNull();
    expect(container.querySelector('ul li')).not.toBeNull();
    expect(screen.queryByText(/<p>/)).toBeNull();
  });

  it('renders an HTML string as markup too', () => {
    const { container } = render(
      <PropertyDescriptionView
        data={{
          '@type': 'propertyDescription',
          body: '<p>Hola <em>mon</em></p>',
        }}
      />,
    );
    expect(container.querySelector('em')).not.toBeNull();
    expect(screen.queryByText(/<p>/)).toBeNull();
  });
});

describe('richTextToHtml', () => {
  it('unwraps a RichText object', () => {
    expect(
      richTextToHtml({ 'content-type': 'text/html', data: '<p>x</p>' }),
    ).toEqual({ html: '<p>x</p>', isHtml: true });
  });

  it('treats a plain string as text, not markup', () => {
    expect(richTextToHtml('just text')).toEqual({
      html: 'just text',
      isHtml: false,
    });
  });

  it('detects markup inside a string', () => {
    expect(richTextToHtml('<p>x</p>').isHtml).toBe(true);
  });

  it('handles undefined', () => {
    expect(richTextToHtml(undefined)).toEqual({ html: '', isHtml: false });
  });
});
