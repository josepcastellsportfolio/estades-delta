import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyBookingFormView from './PropertyBookingFormView';

function setDateInput(label: RegExp, value: string) {
  const input = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

const sampleData = {
  '@type': 'propertyBookingForm' as const,
  heading: 'Reserva',
  basePriceLowSeason: 80,
  basePriceMidSeason: 110,
  basePriceHighSeason: 160,
  cleaningFee: 50,
  touristTaxPerNight: 1.1,
  maxGuests: 6,
};

describe('<PropertyBookingFormView />', () => {
  it('renders the heading, all inputs and a Reservar button', () => {
    render(<PropertyBookingFormView data={sampleData} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Reserva' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/entrada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sortida/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adults/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nens$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/beb/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reservar' }),
    ).toBeInTheDocument();
  });

  it('shows an error when checkout precedes checkin', () => {
    render(<PropertyBookingFormView data={sampleData} />);
    setDateInput(/entrada/i, '2026-08-10');
    setDateInput(/sortida/i, '2026-08-09');
    expect(screen.getByRole('alert')).toHaveTextContent(/sortida ha de ser/i);
  });

  it('refuses more guests than maxGuests', () => {
    render(<PropertyBookingFormView data={sampleData} />);
    fireEvent.change(screen.getByLabelText(/adults/i), {
      target: { value: '10' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/màxim 6/);
  });

  it('computes a breakdown for a valid stay and calls onSubmit on click', () => {
    const onSubmit = jest.fn();
    render(<PropertyBookingFormView data={sampleData} onSubmit={onSubmit} />);
    setDateInput(/entrada/i, '2026-08-01');
    setDateInput(/sortida/i, '2026-08-04'); // 3 high-season nights
    fireEvent.change(screen.getByLabelText(/adults/i), {
      target: { value: '2' },
    });
    // Subtotal should appear in DOM somewhere.
    expect(screen.getByText('Total')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.adults).toBe(2);
    expect(arg.breakdown.nights).toBe(3);
    // 3 * 160 + 50 + 3 * 1.1 * 2 = 480 + 50 + 6.6 = 536.60
    expect(arg.breakdown.total).toBeCloseTo(536.6, 2);
  });

  it('disables the submit button while in error state', () => {
    render(<PropertyBookingFormView data={sampleData} />);
    setDateInput(/entrada/i, '2026-08-10');
    setDateInput(/sortida/i, '2026-08-09');
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled();
  });
});
