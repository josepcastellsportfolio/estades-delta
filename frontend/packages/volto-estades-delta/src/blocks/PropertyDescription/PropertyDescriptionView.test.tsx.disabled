import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyDescriptionView from './PropertyDescriptionView';

describe('<PropertyDescriptionView />', () => {
  it('renders heading as h2 and body as paragraph', () => {
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
});
