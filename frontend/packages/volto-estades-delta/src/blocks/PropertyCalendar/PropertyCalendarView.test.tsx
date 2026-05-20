/**
 * PropertyCalendar tests.
 *
 * The grid is built deterministically from `today` — we freeze Date with
 * jest.useFakeTimers so tests don't drift across runs.
 */
import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithIntl as render } from '../../i18n/testUtils';
import PropertyCalendarView from './PropertyCalendarView';

const baseData = { '@type': 'propertyCalendar' as const };

beforeEach(() => {
  // Mid-month so prev-month padding has cells from prev month and we can
  // assert that the current month's "today" cell exists.
  jest.useFakeTimers().setSystemTime(new Date('2026-06-15T10:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('<PropertyCalendarView />', () => {
  it('renders 2 months by default starting from the current month', () => {
    render(<PropertyCalendarView data={baseData} />);
    // Both headers should be present.
    expect(screen.getByText(/juny.*2026/i)).toBeInTheDocument();
    expect(screen.getByText(/juliol.*2026/i)).toBeInTheDocument();
  });

  it('respects monthsToShow=1', () => {
    render(<PropertyCalendarView data={{ ...baseData, monthsToShow: 1 }} />);
    expect(screen.getByText(/juny.*2026/i)).toBeInTheDocument();
    expect(screen.queryByText(/juliol.*2026/i)).toBeNull();
  });

  it('renders an optional heading', () => {
    render(
      <PropertyCalendarView
        data={{ ...baseData, heading: 'Disponibilitat' }}
      />,
    );
    expect(screen.getByText('Disponibilitat')).toBeInTheDocument();
  });

  it('marks unavailableDates from block data as unavailable', () => {
    const { container } = render(
      <PropertyCalendarView
        data={{
          ...baseData,
          monthsToShow: 1,
          unavailableDates: ['2026-06-20', '2026-06-21'],
        }}
      />,
    );
    const unavailable = container.querySelectorAll(
      '.propertyCalendar__day--unavailable',
    );
    // The two declared dates render as unavailable; past dates also can't be
    // unavailable (past wins).
    expect(unavailable.length).toBeGreaterThanOrEqual(2);
    expect(
      container.querySelector('[data-date="2026-06-20"]')?.className,
    ).toContain('unavailable');
    expect(
      container.querySelector('[data-date="2026-06-21"]')?.className,
    ).toContain('unavailable');
  });

  it('merges unavailable dates from block data and content', () => {
    const { container } = render(
      <PropertyCalendarView
        data={{
          ...baseData,
          monthsToShow: 1,
          unavailableDates: ['2026-06-20'],
        }}
        content={{ unavailable_dates: ['2026-06-25'] }}
      />,
    );
    expect(
      container.querySelector('[data-date="2026-06-20"]')?.className,
    ).toContain('unavailable');
    expect(
      container.querySelector('[data-date="2026-06-25"]')?.className,
    ).toContain('unavailable');
  });

  it('marks past dates (before today) as past, not available', () => {
    const { container } = render(
      <PropertyCalendarView data={{ ...baseData, monthsToShow: 1 }} />,
    );
    // 2026-06-10 is before today (2026-06-15) → past
    const past = container.querySelector('[data-date="2026-06-10"]');
    expect(past?.className).toContain('past');
    expect(past?.className).not.toContain('available');
  });

  it('marks today and future in-month dates as available', () => {
    const { container } = render(
      <PropertyCalendarView data={{ ...baseData, monthsToShow: 1 }} />,
    );
    const future = container.querySelector('[data-date="2026-06-25"]');
    expect(future?.className).toContain('available');
  });

  it('disables the prev button on the current month', () => {
    render(<PropertyCalendarView data={baseData} />);
    expect(
      screen.getByRole('button', { name: /mes anterior/i }),
    ).toBeDisabled();
  });

  it('enables prev after clicking next, and going back returns to current', () => {
    render(<PropertyCalendarView data={baseData} />);
    fireEvent.click(screen.getByRole('button', { name: /mes següent/i }));
    // Now showing july + august
    expect(screen.getByText(/juliol.*2026/i)).toBeInTheDocument();
    expect(screen.getByText(/agost.*2026/i)).toBeInTheDocument();
    const prev = screen.getByRole('button', { name: /mes anterior/i });
    expect(prev).not.toBeDisabled();
    fireEvent.click(prev);
    expect(screen.getByText(/juny.*2026/i)).toBeInTheDocument();
  });

  it('renders the legend with three swatches', () => {
    const { container } = render(<PropertyCalendarView data={baseData} />);
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/ocupat/i)).toBeInTheDocument();
    expect(screen.getByText(/passat/i)).toBeInTheDocument();
    expect(
      container.querySelectorAll('.propertyCalendar__legendSwatch').length,
    ).toBe(3);
  });

  it('renders the 7 European weekday headers (Dl…Dg)', () => {
    const { container } = render(<PropertyCalendarView data={baseData} />);
    const headers = within(
      container.querySelector(
        '.propertyCalendar__month',
      ) as HTMLElement,
    ).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual([
      'Dl',
      'Dt',
      'Dc',
      'Dj',
      'Dv',
      'Ds',
      'Dg',
    ]);
  });

  it('crosses year boundary correctly (Dec → Jan)', () => {
    jest.setSystemTime(new Date('2026-12-15T10:00:00Z'));
    render(<PropertyCalendarView data={baseData} />);
    expect(screen.getByText(/desembre.*2026/i)).toBeInTheDocument();
    expect(screen.getByText(/gener.*2027/i)).toBeInTheDocument();
  });
});
