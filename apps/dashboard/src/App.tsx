import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Route pages are code-split so heavy, route-specific dependencies (Leaflet maps
// on the replay/risk-map routes, Recharts on the detail/overview/report routes)
// are only downloaded when the user navigates to them, instead of bloating the
// initial bundle. LoginPage and the Layout shell stay eager since they are on
// the critical first-paint path.
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const TripReplayPage = lazy(() => import('./pages/TripReplayPage'));
const RiskMapPage = lazy(() => import('./pages/RiskMapPage'));
const TrafficPage = lazy(() => import('./pages/TrafficPage'));
const RoadsPage = lazy(() => import('./pages/RoadsPage'));
const DataSourcesPage = lazy(() => import('./pages/DataSourcesPage'));
const SimulationPage = lazy(() => import('./pages/SimulationPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">
      Loading…
    </div>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (token) fetchMe().catch(() => {});
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Suspense fallback={<RouteFallback />}><OverviewPage /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<RouteFallback />}><UsersPage /></Suspense>} />
        <Route path="trips" element={<Suspense fallback={<RouteFallback />}><TripsPage /></Suspense>} />
        <Route path="trips/:id" element={<Suspense fallback={<RouteFallback />}><TripDetailPage /></Suspense>} />
        <Route path="trips/:id/replay" element={<Suspense fallback={<RouteFallback />}><TripReplayPage /></Suspense>} />
        <Route path="risk-map" element={<Suspense fallback={<RouteFallback />}><RiskMapPage /></Suspense>} />
        <Route path="traffic" element={<Suspense fallback={<RouteFallback />}><TrafficPage /></Suspense>} />
        <Route path="roads" element={<Suspense fallback={<RouteFallback />}><RoadsPage /></Suspense>} />
        <Route path="data-sources" element={<Suspense fallback={<RouteFallback />}><DataSourcesPage /></Suspense>} />
        <Route path="simulation" element={<Suspense fallback={<RouteFallback />}><SimulationPage /></Suspense>} />
        <Route path="report" element={<Suspense fallback={<RouteFallback />}><ReportPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
