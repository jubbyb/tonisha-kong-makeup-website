import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

describe('App', () => {
  it('renders the main layout with Navbar, Outlet, and Footer', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </AuthProvider>,
    );

    // Check for Navbar by looking for the mobile menu button
    expect(screen.getAllByLabelText('Open menu')[0]).toBeInTheDocument();
    // Check for Footer
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
