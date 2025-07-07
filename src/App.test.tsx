import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders the main layout with Navbar, Outlet, and Footer', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    // Check for Navbar by looking for the mobile menu button
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    // Check for Footer
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
