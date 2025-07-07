import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Services from './Services';

describe('Services', () => {
  it('renders the services page with a heading', async () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Our Services')).toBeInTheDocument();
  });

  it('shows a loading state initially', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>,
    );
    expect(screen.getByText('Loading Services...')).toBeInTheDocument();
  });

  it('displays the list of services after loading', async () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Bridal Makeup - $250')).toBeInTheDocument();
    });
  });

  it('opens the booking modal when "Book Now" is clicked', async () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>,
    );

    await waitFor(() => {
      fireEvent.click(screen.getAllByText('Book Now')[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Book Bridal Makeup')).toBeInTheDocument();
    });
  });
});
