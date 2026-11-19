import { Link, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import FloatingEventChat from './components/FloatingEventChat.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import CreateEventPage from './pages/CreateEventPage.jsx'
import AdminEventsPage from './pages/AdminEventsPage.jsx'
import TicketCheckoutPage from './pages/TicketCheckoutPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EventCheckInPage from './pages/EventCheckInPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import Profile from './pages/Profile.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'

// Every URL in the SPA and which page it renders. Protected pages require login.
export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute role="admin">
                  <AdminEventsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/events" element={<EventsPage />} />
            <Route
              path="/events/:id/checkout"
              element={
                <ProtectedRoute>
                  <TicketCheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/check-in"
              element={
                <ProtectedRoute>
                  <EventCheckInPage />
                </ProtectedRoute>
              }
            />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/new"
              element={
                <ProtectedRoute>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-event"
              element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>}
            />
            <Route
              path="/events/:id/edit"
              element={
                <ProtectedRoute>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <FloatingEventChat />
        <footer className="on-ink bg-ink text-cream">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-tomato uppercase">Campus Hub</p>
                <p className="display mt-3 max-w-lg text-3xl sm:text-5xl">Find something worth showing up for.</p>
              </div>
              <Link to="/events" className="btn btn-accent self-start px-5 py-3 md:self-auto">
                Browse events <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="mt-10 flex flex-col justify-between gap-2 border-t border-cream/15 pt-5 font-mono text-[10px] tracking-[0.12em] text-cream/55 uppercase sm:flex-row">
              <span>◒ Campus Hub · COMP3322 group project</span>
              <span>HKU · CUHK · PolyU</span>
            </div>
          </div>
        </footer>
    </div>
  )
}