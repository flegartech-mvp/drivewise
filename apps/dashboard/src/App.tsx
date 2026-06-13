import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import UsersPage from './pages/UsersPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import TripReplayPage from './pages/TripReplayPage';
import RiskMapPage from './pages/RiskMapPage';
import TrafficPage from './pages/TrafficPage';
import RoadsPage from './pages/RoadsPage';
import DataSourcesPage from './pages/DataSourcesPage';
import SimulationPage from './pages/SimulationPage';
import ReportPage from './pages/ReportPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
        <Route index element={<OverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="trips/:id" element={<TripDetailPage />} />
        <Route path="trips/:id/replay" element={<TripReplayPage />} />
        <Route path="risk-map" element={<RiskMapPage />} />
        <Route path="traffic" element={<TrafficPage />} />
        <Route path="roads" element={<RoadsPage />} />
        <Route path="data-sources" element={<DataSourcesPage />} />
        <Route path="simulation" element={<SimulationPage />} />
        <Route path="report" element={<ReportPage />} />
      </Route>
    </Routes>
  );
}
