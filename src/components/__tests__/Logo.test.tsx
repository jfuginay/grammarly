import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo from '../Logo'; // Adjust the import path as necessary

describe('Logo Component', () => {
  it('renders without crashing', () => {
    render(<Logo />);
    // You can add more specific assertions here if needed
    // For example, checking for an element with a specific test ID or text
    // expect(screen.getByTestId('logo-svg')).toBeInTheDocument();
  });
});
