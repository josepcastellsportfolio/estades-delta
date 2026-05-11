import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyHeroView from './PropertyHeroView';

describe('<PropertyHeroView />', () => {
  it('renders title as h1 and subtitle as paragraph', () => {
    render(
      <PropertyHeroView
        data={{
          '@type': 'propertyHero',
          title: 'Casa Demo',
          subtitle: 'Una casa al Delta',
        }}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Casa Demo' })).toBeInTheDocument();
    expect(screen.getByText('Una casa al Delta')).toBeInTheDocument();
  });

  it('renders a capacity pill when capacity is set', () => {
    render(
      <PropertyHeroView
        data={{ '@type': 'propertyHero', title: 't', capacity: 6 }}
      />,
    );
    expect(screen.getByText('6 hostes')).toBeInTheDocument();
  });

  it('flags data-with-image=true when hero_image is provided', () => {
    const { container } = render(
      <PropertyHeroView
        data={{
          '@type': 'propertyHero',
          title: 't',
          hero_image: 'https://example.com/x.jpg',
        }}
      />,
    );
    const section = container.querySelector('.propertyHero') as HTMLElement;
    expect(section.getAttribute('data-with-image')).toBe('true');
    expect(section.style.backgroundImage).toContain('https://example.com/x.jpg');
  });

  it('flags data-with-image=false when no hero_image', () => {
    const { container } = render(
      <PropertyHeroView data={{ '@type': 'propertyHero', title: 't' }} />,
    );
    expect(
      (container.querySelector('.propertyHero') as HTMLElement).getAttribute(
        'data-with-image',
      ),
    ).toBe('false');
  });

  it('renders nothing extra when all optional fields are missing', () => {
    const { container } = render(
      <PropertyHeroView data={{ '@type': 'propertyHero' }} />,
    );
    expect(container.querySelector('.propertyHero')).toBeTruthy();
    expect(container.querySelector('h1')).toBeNull();
  });
});
