import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('<Card />', () => {
  it('renders as <article> by default', () => {
    render(
      <Card>
        <p>hello</p>
      </Card>,
    );
    const root = screen.getByText('hello').closest('.ed-card') as HTMLElement;
    expect(root.tagName).toBe('ARTICLE');
    expect(root.className).toContain('ed-card--elevation-1');
  });

  it('renders header and footer slots', () => {
    render(
      <Card header={<h3>Title</h3>} footer={<button>Book</button>}>
        body
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('toggles interactive class', () => {
    render(<Card interactive>x</Card>);
    expect(
      (screen.getByText('x').closest('.ed-card') as HTMLElement).className,
    ).toContain('ed-card--interactive');
  });

  it('respects elevation prop', () => {
    render(<Card elevation={3}>x</Card>);
    expect(
      (screen.getByText('x').closest('.ed-card') as HTMLElement).className,
    ).toContain('ed-card--elevation-3');
  });

  it('renders as `section` when requested', () => {
    render(<Card as="section">x</Card>);
    expect(
      (screen.getByText('x').closest('.ed-card') as HTMLElement).tagName,
    ).toBe('SECTION');
  });
});
