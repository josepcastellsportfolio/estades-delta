/**
 * AggregatorPropertyList — RTL tests.
 *
 * The block does an async fetch on mount. We stub `global.fetch` and use
 * `findBy*` to wait for resolved state.
 */
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import AggregatorPropertyListView from './AggregatorPropertyListView';

const baseData = { '@type': 'aggregatorPropertyList' as const };

interface FetchMock extends jest.Mock {
  mock: jest.Mock['mock'];
}

function mockFetchOnce(response: object, ok = true) {
  (global.fetch as FetchMock).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: async () => response,
  } as Response);
}

function mockFetchReject(err: Error) {
  (global.fetch as FetchMock).mockRejectedValueOnce(err);
}

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    '@id': 'http://localhost/Plone/ca/properties/casa-demo',
    '@type': 'Property',
    UID: 'uid-1',
    title: 'Casa Demo',
    municipality: 'Riumar',
    zone: 'Riumar',
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    base_price_low_season: 85,
    base_price_mid_season: 110,
    base_price_high_season: 155,
    ...overrides,
  };
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
  // Reset URL between tests.
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('<AggregatorPropertyListView />', () => {
  it('shows the loading state during fetch', async () => {
    mockFetchOnce({ items_total: 0, items: [] });
    render(<AggregatorPropertyListView data={baseData} />);
    expect(screen.getByRole('status')).toHaveTextContent(/carregant/i);
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    );
  });

  it('renders the empty-state message when the API returns 0 items', async () => {
    mockFetchOnce({ items_total: 0, items: [] });
    render(<AggregatorPropertyListView data={baseData} />);
    expect(
      await screen.findByText(/no hi ha cap propietat/i),
    ).toBeInTheDocument();
  });

  it('renders a custom empty message when provided', async () => {
    mockFetchOnce({ items_total: 0, items: [] });
    render(
      <AggregatorPropertyListView
        data={{ ...baseData, emptyMessage: 'Sense resultats personalitzat' }}
      />,
    );
    expect(
      await screen.findByText('Sense resultats personalitzat'),
    ).toBeInTheDocument();
  });

  it('renders cards for each Property returned by Plone', async () => {
    mockFetchOnce({
      items_total: 2,
      items: [
        makeItem({ title: 'Casa A', '@id': '/casa-a' }),
        makeItem({ title: 'Casa B', '@id': '/casa-b' }),
      ],
    });
    render(<AggregatorPropertyListView data={baseData} />);
    expect(await screen.findByText('Casa A')).toBeInTheDocument();
    expect(screen.getByText('Casa B')).toBeInTheDocument();
    expect(screen.getByText('2 propietats')).toBeInTheDocument();
  });

  it('uses the singular "propietat" when the total is exactly 1', async () => {
    mockFetchOnce({
      items_total: 1,
      items: [makeItem({ title: 'Casa Única' })],
    });
    render(<AggregatorPropertyListView data={baseData} />);
    expect(await screen.findByText('1 propietat')).toBeInTheDocument();
  });

  it('renders the error state when fetch rejects', async () => {
    mockFetchReject(new Error('Network down'));
    render(<AggregatorPropertyListView data={baseData} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no s.+han pogut carregar/i,
    );
  });

  it('passes the zone URL param to the fetch URL', async () => {
    window.history.replaceState({}, '', '/?zone=Riumar');
    mockFetchOnce({ items_total: 0, items: [] });
    render(<AggregatorPropertyListView data={baseData} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const url = (global.fetch as FetchMock).mock.calls[0][0] as string;
    expect(url).toMatch(/zone=Riumar/);
    expect(url).toMatch(/portal_type=Property/);
  });

  it('filters out properties that cannot host the requested guest count', async () => {
    window.history.replaceState({}, '', '/?guests=8');
    mockFetchOnce({
      items_total: 2,
      items: [
        makeItem({ title: 'Casa Petita', max_guests: 4 }),
        makeItem({ title: 'Casa Gran', max_guests: 10 }),
      ],
    });
    render(<AggregatorPropertyListView data={baseData} />);
    expect(await screen.findByText('Casa Gran')).toBeInTheDocument();
    expect(screen.queryByText('Casa Petita')).toBeNull();
  });

  it('refetches when the aggregatorFiltersChange event fires', async () => {
    mockFetchOnce({ items_total: 0, items: [] });
    render(<AggregatorPropertyListView data={baseData} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    mockFetchOnce({
      items_total: 1,
      items: [makeItem({ title: 'Casa Filtrada' })],
    });
    act(() => {
      window.dispatchEvent(
        new CustomEvent('aggregatorFiltersChange', {
          detail: { checkin: '', checkout: '', guests: 1, zone: 'Tortosa' },
        }),
      );
    });
    expect(await screen.findByText('Casa Filtrada')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const secondUrl = (global.fetch as FetchMock).mock.calls[1][0] as string;
    expect(secondUrl).toMatch(/zone=Tortosa/);
  });

  it('shows pagination when total exceeds page size', async () => {
    mockFetchOnce({
      items_total: 25,
      items: Array.from({ length: 12 }, (_, i) =>
        makeItem({ title: `Casa ${i}`, '@id': `/casa-${i}` }),
      ),
    });
    render(<AggregatorPropertyListView data={baseData} />);
    expect(
      await screen.findByRole('button', { name: /següent/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
    expect(screen.getByText(/pàgina 1 de 3/i)).toBeInTheDocument();
  });

  it('disables Següent on the last page', async () => {
    mockFetchOnce({
      items_total: 12,
      items: Array.from({ length: 12 }, (_, i) =>
        makeItem({ title: `Casa ${i}`, '@id': `/casa-${i}` }),
      ),
    });
    render(<AggregatorPropertyListView data={baseData} />);
    await screen.findByText('Casa 0');
    // total === pageSize → no pagination row at all.
    expect(
      screen.queryByRole('button', { name: /següent/i }),
    ).not.toBeInTheDocument();
  });

  it('clicking Següent triggers another fetch with incremented b_start', async () => {
    mockFetchOnce({
      items_total: 25,
      items: Array.from({ length: 12 }, (_, i) =>
        makeItem({ title: `Casa P1-${i}`, '@id': `/casa-p1-${i}` }),
      ),
    });
    render(<AggregatorPropertyListView data={baseData} />);
    const next = await screen.findByRole('button', { name: /següent/i });

    mockFetchOnce({
      items_total: 25,
      items: [makeItem({ title: 'Casa P2', '@id': '/casa-p2' })],
    });
    fireEvent.click(next);
    expect(await screen.findByText('Casa P2')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const secondUrl = (global.fetch as FetchMock).mock.calls[1][0] as string;
    expect(secondUrl).toMatch(/b_start=12/);
  });
});
