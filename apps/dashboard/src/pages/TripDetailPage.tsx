import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { tripsApi } from '../api/client';
import {
  SectionHeader, LoadingState, ErrorState, Badge, ScoreRing, EventBadge,
} from '../components/ui';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

interface TripPoint { latitude: number; longitude: number; gpsSpeedKmh?: number; timestamp: string }
interface DrivingEvent { id: string; type: string; severity: string; timestamp: string; value?: number; latitude?: number; longitude?: number; metadata: string }
interface DriverLevel { tier: string; labelSl: string; emoji: string; color: string; progressToNext: number; nextTier?: string; nextMinScore?: number; minScore: number; maxScore: number }
interface ScoreBreakdown {
  tripId: string;
  distanceKm: number;
  durationSeconds: number;
  finalScore: number;
  baseScore: number;
  penalties: { reason: string; points: number; count: number; eventType: string }[];
  bonuses: { reason: string; points: number }[];
  warnings: string[];
  topWeaknesses: string[];
  topStrengths: string[];
  recommendations: string[];
  driverLevel: DriverLevel;
  explanationText: string;
}

interface Trip {
  id: string; startedAt: string; endedAt?: string; distanceKm: number;
  durationSeconds: number; averageSpeedKmh: number; maxSpeedKmh: number;
  score?: number; status: string; mode: string;
  user?: { name: string; email: string };
}

const severityColor: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f97316', LOW: '#eab308' };

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      tripsApi.get(id).then((r) => setTrip(r.data)),
      tripsApi.points(id).then((r) => setPoints(r.data)),
      tripsApi.events(id).then((r) => setEvents(r.data)),
      tripsApi.scoreBreakdown(id).then((r) => setBreakdown(r.data)).catch(() => {}),
    ])
      .catch(() => setError('Napaka pri nalaganju podrobnosti vožnje.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8"><ErrorState message={error} /></div>;
  if (!trip) return <div className="p-8"><ErrorState message="Vožnja ni bila najdena." /></div>;

  const routeLine: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
  const mapCenter = routeLine.length > 0 ? routeLine[Math.floor(routeLine.length / 2)] : [46.55, 15.64] as [number, number];
  const eventPoints = events.filter((e) => e.latitude && e.longitude);

  const levelColors: Record<string, string> = {
    PLATINUM: '#e5e4e2', GOLD: '#ffd700', SILVER: '#c0c0c0', BRONZE: '#cd7f32',
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/trips" className="text-surface-400 hover:text-white text-sm">← Vožnje</Link>
        <span className="text-surface-600">/</span>
        <span className="text-surface-300 text-sm">Podrobnosti vožnje</span>
      </div>

      <SectionHeader
        title="Podrobnosti vožnje"
        sub={format(new Date(trip.startedAt), "d. MMMM yyyy 'ob' HH:mm", { locale: sl })}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {trip.score != null && (
          <div className="card flex flex-col items-center gap-1 col-span-1">
            <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Ocena</div>
            <ScoreRing score={trip.score} size={64} />
          </div>
        )}
        <div className="card"><div className="text-xs text-surface-400 uppercase mb-1">Razdalja</div><div className="text-xl font-bold text-white">{trip.distanceKm.toFixed(1)} km</div></div>
        <div className="card"><div className="text-xs text-surface-400 uppercase mb-1">Čas</div><div className="text-xl font-bold text-white">{Math.round(trip.durationSeconds / 60)} min</div></div>
        <div className="card"><div className="text-xs text-surface-400 uppercase mb-1">Povpr. hitrost</div><div className="text-xl font-bold text-white">{Math.round(trip.averageSpeedKmh)} km/h</div></div>
        <div className="card"><div className="text-xs text-surface-400 uppercase mb-1">Max hitrost</div><div className="text-xl font-bold text-white">{Math.round(trip.maxSpeedKmh)} km/h</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Map */}
        <div className="card p-0 overflow-hidden" style={{ minHeight: 340 }}>
          <div className="px-4 py-3 border-b border-surface-600 flex justify-between items-center">
            <span className="font-medium text-white text-sm">Trasa vožnje</span>
            <span className="text-xs text-surface-400">{points.length} GPS točk</span>
          </div>
          {routeLine.length > 0 ? (
            <MapContainer center={mapCenter as [number, number]} zoom={13} style={{ height: 280, width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© CARTO | OSM" />
              {routeLine.length > 1 && (
                <Polyline positions={routeLine} color="#22c55e" weight={3} opacity={0.8} />
              )}
              {routeLine.length > 0 && (
                <>
                  <CircleMarker center={routeLine[0]} radius={7} fillColor="#22c55e" color="#fff" fillOpacity={1} weight={2}>
                    <Popup><div className="text-xs font-bold">Start</div></Popup>
                  </CircleMarker>
                  <CircleMarker center={routeLine[routeLine.length - 1]} radius={7} fillColor="#ef4444" color="#fff" fillOpacity={1} weight={2}>
                    <Popup><div className="text-xs font-bold">Konec</div></Popup>
                  </CircleMarker>
                </>
              )}
              {eventPoints.map((e, i) => (
                <CircleMarker key={i} center={[e.latitude!, e.longitude!]} radius={5}
                  fillColor={severityColor[e.severity] ?? '#888'} color="transparent" fillOpacity={0.8}>
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold">{e.type.replace(/_/g, ' ')}</div>
                      <div>Resnost: {e.severity}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-surface-400 text-sm">
              Ni GPS podatkov za prikaz.
            </div>
          )}
        </div>

        {/* Score breakdown */}
        {breakdown && (
          <div className="card">
            <div className="text-sm font-medium text-white mb-3">Razčlenitev ocene</div>

            {/* Driver level */}
            {breakdown.driverLevel && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-700 mb-4">
                <span className="text-2xl">{breakdown.driverLevel.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium" style={{ color: levelColors[breakdown.driverLevel.tier] ?? '#888' }}>
                      {breakdown.driverLevel.labelSl}
                    </span>
                    <span className="text-xs text-surface-400">
                      {breakdown.driverLevel.minScore}–{breakdown.driverLevel.maxScore} točk
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${breakdown.driverLevel.progressToNext}%`, backgroundColor: levelColors[breakdown.driverLevel.tier] ?? '#888' }}
                    />
                  </div>
                  {breakdown.driverLevel.nextTier && (
                    <div className="text-xs text-surface-400 mt-1">
                      {breakdown.driverLevel.progressToNext}% do {breakdown.driverLevel.nextTier} ({breakdown.driverLevel.nextMinScore} točk)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Penalties */}
            {breakdown.penalties.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-surface-400 uppercase tracking-wider mb-2">Odbitki</div>
                {breakdown.penalties.map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-surface-700 text-sm">
                    <span className="text-surface-300">{p.reason} <span className="text-surface-500">({p.count}×)</span></span>
                    <span className="text-red-400 font-mono">-{p.points}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bonuses */}
            {breakdown.bonuses.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-surface-400 uppercase tracking-wider mb-2">Bonusi</div>
                {breakdown.bonuses.map((b, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-surface-700 text-sm">
                    <span className="text-surface-300">{b.reason}</span>
                    <span className="text-brand-400 font-mono">+{b.points}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Score total */}
            <div className="flex justify-between items-center py-2 text-sm font-bold border-t border-surface-600 mt-2">
              <span className="text-white">Skupaj</span>
              <span className="text-brand-400">{breakdown.finalScore} / 100</span>
            </div>
          </div>
        )}
      </div>

      {/* Strengths / Weaknesses / Recommendations */}
      {breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {breakdown.topStrengths.length > 0 && (
            <div className="card">
              <div className="text-xs text-brand-400 uppercase tracking-wider mb-3">Prednosti</div>
              {breakdown.topStrengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-sm text-surface-300">
                  <span className="text-brand-400 mt-0.5">✓</span> {s}
                </div>
              ))}
            </div>
          )}
          {breakdown.topWeaknesses.length > 0 && (
            <div className="card">
              <div className="text-xs text-red-400 uppercase tracking-wider mb-3">Slabosti</div>
              {breakdown.topWeaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-sm text-surface-300">
                  <span className="text-red-400 mt-0.5">✗</span> {w}
                </div>
              ))}
            </div>
          )}
          {breakdown.recommendations.length > 0 && (
            <div className="card">
              <div className="text-xs text-yellow-400 uppercase tracking-wider mb-3">Priporočila</div>
              {breakdown.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-sm text-surface-300">
                  <span className="text-yellow-400 mt-0.5">→</span> {r}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events table */}
      <div className="card">
        <div className="text-sm font-medium text-white mb-3">Tvegani dogodki ({events.length})</div>
        {events.length === 0 ? (
          <div className="text-center text-surface-400 py-6 text-sm">✅ Nobenih tveganih dogodkov — odlična vožnja!</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-surface-400 border-b border-surface-700 text-left">
                <th className="pb-2 pr-4">Vrsta</th>
                <th className="pb-2 pr-4">Resnost</th>
                <th className="pb-2 pr-4">Čas</th>
                <th className="pb-2">Vrednost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-surface-700/30">
                  <td className="py-2 pr-4"><EventBadge type={e.type} /></td>
                  <td className="py-2 pr-4">
                    <Badge variant={e.severity === 'HIGH' ? 'red' : e.severity === 'MEDIUM' ? 'yellow' : 'gray'}>
                      {e.severity}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-surface-400 text-xs">
                    {format(new Date(e.timestamp), 'HH:mm:ss')}
                  </td>
                  <td className="py-2 text-surface-400 text-xs font-mono">
                    {e.value != null ? e.value.toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Warnings */}
      {breakdown?.warnings && breakdown.warnings.length > 0 && (
        <div className="card mt-4">
          <div className="text-xs text-yellow-400 uppercase tracking-wider mb-2">Sistemska opozorila</div>
          {breakdown.warnings.map((w, i) => (
            <div key={i} className="text-xs text-surface-400 py-1">⚠ {w}</div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-surface-500">
        ℹ DriveWise MVP — Ocene so ocenjevalne in niso primerne za zavarovalniško ali pravno presojo.
      </div>
    </div>
  );
}
