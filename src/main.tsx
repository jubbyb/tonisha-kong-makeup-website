import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
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
import Industries from './pages/Industries';
import IndustryHub from './pages/IndustryHub';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import ArtistDashboard from './pages/ArtistDashboard';
import Survey from './pages/Survey';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
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
              <Route path="artists/:slug" element={<ArtistProfile />} />
              <Route path="industries" element={<Industries />} />
              <Route path="industries/:slug" element={<IndustryHub />} />
              <Route
                path="my-bookings"
                element={
                  <ProtectedRoute role="user">
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute role="user">
                    <Profile />
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
              <Route path="survey/:token" element={<Survey />} />
              <Route path="auth/callback" element={<AuthCallback />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>
            {/* Worker handles /api/* — this route prevents React Router from logging a warning
              when the browser briefly sees this URL before the worker redirect fires */}
            <Route path="api/*" element={null} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
