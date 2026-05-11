import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyGalleryView from './PropertyGalleryView';

const images = [
  'https://x/img-1.jpg',
  'https://x/img-2.jpg',
  'https://x/img-3.jpg',
  'https://x/img-4.jpg',
];

describe('<PropertyGalleryView />', () => {
  it('renders hero with role=button when hero set', () => {
    render(
      <PropertyGalleryView
        data={{ '@type': 'propertyGallery', hero: images[0], alt: 'h' }}
      />,
    );
    const hero = screen.getAllByRole('button')[0];
    expect(hero.className).toContain('propertyGallery__cell--hero');
  });

  it('renders placeholders when no images provided', () => {
    render(<PropertyGalleryView data={{ '@type': 'propertyGallery' }} />);
    // 1 hero placeholder + 4 secondary placeholders
    expect(screen.getAllByText('(sense imatge)')).toHaveLength(5);
  });

  it('renders the "+N more" overlay when total > visible', () => {
    render(
      <PropertyGalleryView
        data={{
          '@type': 'propertyGallery',
          hero: images[0],
          images: images.slice(1),
          total: 12,
        }}
      />,
    );
    expect(screen.getByText(/\+\s*8\s*més/)).toBeInTheDocument();
  });

  it('caps secondary images to 4 even when given more', () => {
    render(
      <PropertyGalleryView
        data={{
          '@type': 'propertyGallery',
          hero: images[0],
          images: [...images, 'extra1', 'extra2'],
        }}
      />,
    );
    // No empty placeholder when all 4 secondary slots are filled.
    expect(screen.queryByText('(sense imatge)')).toBeNull();
  });

  it('calls onOpen with the cell index', () => {
    const onOpen = jest.fn();
    render(
      <PropertyGalleryView
        data={{
          '@type': 'propertyGallery',
          hero: images[0],
          images: [images[1]],
        }}
        onOpen={onOpen}
      />,
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onOpen).toHaveBeenCalledWith(1);
  });
});
