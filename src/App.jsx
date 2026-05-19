import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "./context/AuthContext";
import { initGA, logPageView } from "./utils/analytics";
import { ROLES } from "./utils/constants";

// Lazy loaded pages for performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const VolunteerDashboard = lazy(() => import("./pages/VolunteerDashboard"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage"));
const VolunteersPage = lazy(() => import("./pages/VolunteersPage"));
const ChaptersPage = lazy(() => import("./pages/ChaptersPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-ieee-blue/20 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Global component to track page views on route changes with GA4
 */
function AnalyticsTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // GA4 Initialization is now handled by Firebase config
    initGA();
  }, []);

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

// Smart wrapper — redirects to correct dashboard based on role
function DashboardRouter() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
  return <Navigate to="/volunteer" replace />;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AnalyticsTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="auth" element={<AuthPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="event/:id" element={<EventDetailPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="volunteers" element={<VolunteersPage />} />
            <Route path="chapters" element={<ChaptersPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="resources" element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            } />
            <Route path="contact" element={<ContactPage />} />

            {/* Protected Routes */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="volunteer" element={
              <ProtectedRoute allowedRoles={[ROLES.VOLUNTEER, ROLES.STUDENT]}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } />

            {/* Smart routing for /dashboard */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } />

            {/* 404 Catch-all Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
