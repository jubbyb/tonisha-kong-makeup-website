import { useSearchParams } from 'react-router-dom';
import DashboardLayout from './dashboard/DashboardLayout';
import Today from './dashboard/Today';
import Calendar from './dashboard/Calendar';
import Clients from './dashboard/Clients';
import Services from './dashboard/Services';
import Hours from './dashboard/Hours';
import Portfolio from './dashboard/Portfolio';
import Testimonials from './dashboard/Testimonials';
import Profile from './dashboard/Profile';
import type { TabId } from './dashboard/types';

// ─── Artist Dashboard ─────────────────────────────────────────────────────────
// Thin shell: reads ?tab= from URL and renders DashboardLayout + the right tab.
// Default tab: today.

export default function ArtistDashboard() {
  const [searchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) || 'today';

  return (
    <DashboardLayout>
      {tab === 'today' && <Today />}
      {tab === 'calendar' && <Calendar />}
      {tab === 'clients' && <Clients />}
      {tab === 'services' && <Services />}
      {tab === 'hours' && <Hours />}
      {tab === 'portfolio' && <Portfolio />}
      {tab === 'testimonials' && <Testimonials />}
      {tab === 'profile' && <Profile />}
    </DashboardLayout>
  );
}
