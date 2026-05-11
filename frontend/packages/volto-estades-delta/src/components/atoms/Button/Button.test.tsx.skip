import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('<Button />', () => {
  it('renders a button with default classes', () => {
    render(<Button>Hello</Button>);
    const btn = screen.getByRole('button', { name: 'Hello' });
    expect(btn.className).toContain('ed-btn');
    expect(btn.className).toContain('ed-btn--primary');
    expect(btn.className).toContain('ed-btn--md');
  });

  it('honours variant and size props', () => {
    render(
      <Button variant="ghost" size="lg">
        Cancel
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Cancel' });
    expect(btn.className).toContain('ed-btn--ghost');
    expect(btn.className).toContain('ed-btn--lg');
  });

  it('renders as <a> when `as="a"`', () => {
    render(
      <Button as="a" href="/info">
        Info
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Info' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/info');
  });

  it('fires onClick on native button', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('adds the block modifier when block=true', () => {
    render(<Button block>Wide</Button>);
    expect(screen.getByRole('button', { name: 'Wide' }).className).toContain(
      'ed-btn--block',
    );
  });

  it('renders leading and trailing icons', () => {
    render(
      <Button
        leadingIcon={<span data-testid="lead">L</span>}
        trailingIcon={<span data-testid="trail">T</span>}
      >
        Book
      </Button>,
    );
    expect(screen.getByTestId('lead')).toBeInTheDocument();
    expect(screen.getByTestId('trail')).toBeInTheDocument();
  });
});
