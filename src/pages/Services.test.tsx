import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import Services from './Services';

const mockCatalog = [
  {
    id: 1,
    name: 'Makeup',
    subcategories: [
      {
        id: 1,
        name: 'Bridal',
        services: [
          { id: 1, name: 'Bridal Makeup', description: 'Full bridal look', price: 250, duration_min: 120 },
        ],
      },
    ],
  },
];

beforeEach(() => {
  global.fetch = vi.fn((url: string) => {
    if (String(url).includes('/api/industries')) {
      return Promise.resolve({ json: () => Promise.resolve([]) } as Response);
    }
    return Promise.resolve({ json: () => Promise.resolve(mockCatalog) } as Response);
  }) as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Services', () => {
  it('renders the services page with a heading', async () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Services' })).toBeInTheDocument();
  });

  it('shows a loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
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
      expect(screen.getByText('Bridal Makeup')).toBeInTheDocument();
      expect(screen.getByText('$250')).toBeInTheDocument();
    });
  });

  it('navigates to artists when "Book Now" is clicked', async () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Book Now'));
  });
});
