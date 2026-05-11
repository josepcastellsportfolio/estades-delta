import React from 'react';
import { render, screen } from '@testing-library/react';
import Rating from './Rating';

describe('<Rating />', () => {
  it('renders an aria-label with score / max', () => {
    render(<Rating value={4.3} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('4.3 de 5');
  });

  it('clamps to range [0, max]', () => {
    render(<Rating value={9} max={5} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('5.0 de 5');
  });

  it('clamps negatives to 0', () => {
    render(<Rating value={-1} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('0.0 de 5');
  });

  it('shows numeric score by default', () => {
    render(<Rating value={4.5} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('omits the numeric score when showScore=false', () => {
    render(<Rating value={4.5} showScore={false} />);
    expect(screen.queryByText('4.5')).toBeNull();
  });

  it('renders count in parentheses', () => {
    render(<Rating value={4.5} count={42} />);
    expect(screen.getByText('(42)')).toBeInTheDocument();
  });
});
