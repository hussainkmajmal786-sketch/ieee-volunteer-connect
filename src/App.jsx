import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// Lazy loaded pages for performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const VolunteerDashboard = lazy(() => import("./pages/VolunteerDashboard"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}

// Smart wrapper to route to correct dashboard based on role
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" />;
  if (user.role === 'ADMIN') return <AdminDashboard />;
  return <VolunteerDashboard />;
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="auth" element={<AuthPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="event/:id" element={<EventDetailPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />

            {/* Protected Routes */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="volunteer" element={
              <ProtectedRoute allowedRoles={['VOLUNTEER', 'STUDENT']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } />

            {/* Smart routing for /dashboard */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
