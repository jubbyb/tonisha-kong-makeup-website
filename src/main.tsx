import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Classes from './pages/Classes';
import Bookings from './pages/Bookings';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Artists from './pages/Artists';
import ArtistProfile from './pages/ArtistProfile';
import MyBookings from './pages/MyBookings';
import ArtistDashboard from './pages/ArtistDashboard';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="classes" element={<Classes />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="artists" element={<Artists />} />
            <Route path="artists/:id" element={<ArtistProfile />} />
            <Route
              path="my-bookings"
              element={
                <ProtectedRoute role="user">
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="artist-dashboard"
              element={
                <ProtectedRoute role="artist">
                  <ArtistDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
