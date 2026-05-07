// ─── Shared types for artist dashboard tabs ───────────────────────────────────

export interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  message: string | null;
  status: string;
}

export interface DayHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

export interface Block {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
}

export interface ArtistProfile {
  id: number;
  slug: string | null;
  name: string;
  email: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
  about: string | null;
  location: string | null;
  experience: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  whatsapp_number: string | null;
  industry_ids: number[];
}

export interface IndustryOption {
  id: number;
  slug: string;
  name: string;
}

export interface PortfolioItem {
  id: number;
  image_url: string;
  caption: string | null;
  display_order: number;
}

export interface TestimonialItem {
  id: number;
  client_name: string;
  quote: string;
  date: string | null;
  display_order: number;
}

export interface CatalogCategory {
  id: number;
  name: string;
  sort_order: number;
  subcategories: Array<{
    id: number;
    name: string;
    services: Array<{
      id: number;
      name: string;
      description: string | null;
      price: number | null;
      duration_min: number;
    }>;
  }>;
}

export const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  cancelled: 'badge-error',
  completed: 'badge-info',
};

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export interface ClientSummary {
  email: string;
  name: string;
  phone: string | null;
  contact_method: string;
  booking_count: number;
  completed_count: number;
  last_booking_date: string;
  notes: string | null;
  tags: string | null;
  is_vip: number;
}

export interface ClientDetail {
  bookings: Booking[];
  notes: { notes: string | null; tags: string | null; is_vip: number } | null;
}

export type TabId =
  | 'today'
  | 'calendar'
  | 'services'
  | 'hours'
  | 'portfolio'
  | 'testimonials'
  | 'profile'
  | 'clients';
