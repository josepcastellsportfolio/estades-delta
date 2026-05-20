import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AggregatorFiltersView from './AggregatorFiltersView';

const baseData = { '@type': 'aggregatorFilters' as const };

describe('<AggregatorFiltersView />', () => {
  it('renders the four filter fields and a Cercar button', () => {
    render(<AggregatorFiltersView data={baseData} />);
    expect(screen.getByLabelText('Entrada')).toBeInTheDocument();
    expect(screen.getByLabelText('Sortida')).toBeInTheDocument();
    expect(screen.getByLabelText('Hostes')).toBeInTheDocument();
    expect(screen.getByLabelText('Zona')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cercar' })).toBeInTheDocument();
  });

  it('renders an optional heading when provided', () => {
    render(
      <AggregatorFiltersView
        data={{ ...baseData, heading: 'Troba la teva casa' }}
      />,
    );
    expect(screen.getByText('Troba la teva casa')).toBeInTheDocument();
  });

  it('does not render a heading when omitted', () => {
    render(<AggregatorFiltersView data={baseData} />);
    expect(screen.queryByText(/^Troba/)).toBeNull();
  });

  it('shows the "Esborrar filtres" button only when a filter has a value', () => {
    render(<AggregatorFiltersView data={baseData} />);
    // Initially no active filter → clear button absent.
    expect(screen.queryByRole('button', { name: /esborrar/i })).toBeNull();

    // Set a zone value → clear button appears.
    fireEvent.change(screen.getByLabelText('Zona'), {
      target: { value: 'Riumar' },
    });
    expect(
      screen.getByRole('button', { name: /esborrar/i }),
    ).toBeInTheDocument();
  });

  it('resets filters when "Esborrar filtres" is clicked', () => {
    render(<AggregatorFiltersView data={baseData} />);
    fireEvent.change(screen.getByLabelText('Zona'), {
      target: { value: 'Riumar' },
    });
    fireEvent.click(screen.getByRole('button', { name: /esborrar/i }));
    expect((screen.getByLabelText('Zona') as HTMLSelectElement).value).toBe(
      '',
    );
    expect(screen.queryByRole('button', { name: /esborrar/i })).toBeNull();
  });

  it('guest input defaults to 1 and updates on change', () => {
    render(<AggregatorFiltersView data={baseData} />);
    const input = screen.getByLabelText('Hostes') as HTMLInputElement;
    expect(input.value).toBe('1');
    fireEvent.change(input, { target: { value: '4' } });
    expect(input.value).toBe('4');
  });
});
