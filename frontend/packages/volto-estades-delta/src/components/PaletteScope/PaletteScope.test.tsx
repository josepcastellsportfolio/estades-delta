import React from 'react';
import { render } from '@testing-library/react';
import PaletteScope from './PaletteScope';

describe('<PaletteScope />', () => {
  it('renders a div by default with the supplied palette', () => {
    const { container } = render(
      <PaletteScope palette="riu-i-mar">child</PaletteScope>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('data-palette')).toBe('riu-i-mar');
    expect(root.textContent).toBe('child');
  });

  it('accepts a custom element via `as`', () => {
    const { container } = render(
      <PaletteScope palette="capvespre" as="article">
        x
      </PaletteScope>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.tagName).toBe('ARTICLE');
    expect(root.getAttribute('data-palette')).toBe('capvespre');
  });

  it('falls back to arrossar for an invalid palette value', () => {
    const { container } = render(
      // @ts-expect-error - testing runtime fallback for invalid input
      <PaletteScope palette="not-a-real-palette">x</PaletteScope>,
    );
    expect(
      (container.firstChild as HTMLElement).getAttribute('data-palette'),
    ).toBe('arrossar');
  });

  it('falls back to arrossar when palette is undefined', () => {
    const { container } = render(<PaletteScope>x</PaletteScope>);
    expect(
      (container.firstChild as HTMLElement).getAttribute('data-palette'),
    ).toBe('arrossar');
  });

  it('forwards extra props onto the rendered element', () => {
    const { container } = render(
      <PaletteScope palette="arrossar" id="hello" className="cls">
        x
      </PaletteScope>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.id).toBe('hello');
    expect(root.className).toBe('cls');
  });
});
