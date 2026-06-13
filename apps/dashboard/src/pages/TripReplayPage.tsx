import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { tripsApi, adminApi } from '../api/client';
import { SectionHeader, LoadingState, ErrorState, EventBadge, Badge } from '../components/ui';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

interface TripPoint { latitude: number; longitude: number; gpsSpeedKmh?: number; timestamp: string }
interface DrivingEvent { id: string; type: string; severity: string; timestamp: string; value?: number; latitude?: number; longitude?: number }

function MovingMarker({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.5 });
  }, [position, map]);
  return (
    <CircleMarker center={position} radius={9} fillColor="#3b82f6" color="#fff" fillOpacity={1} weight={2}>
      <Popup><div className="text-xs font-bold">Vozilo</div></Popup>
    </CircleMarker>
  );
}

const severityColor: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f97316', LOW: '#eab308' };

export default function TripReplayPage() {
  const { id } = useParams<{ id: string }>();
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [playing, setPlaying] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [speed, setSpeed] = useState(10); // playback speed multiplier
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      tripsApi.points(id).then((r) => setPoints(r.data)),
      tripsApi.events(id).then((r) => setEvents(r.data)),
    ])
      .catch(() => setError('Napaka pri nalaganju podatkov vožnje.'))
      .finally(() => setLoading(false));
  }, [id]);

  const stop = useCallback(() => {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const play = useCallback(() => {
    if (frameIdx >= points.length - 1) setFrameIdx(0);
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setFrameIdx((prev) => {
        if (prev >= points.length - 1) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, Math.max(50, 200 / speed));
  }, [frameIdx, points.length, speed]);

  useEffect(() => {
    if (!playing) return;
    stop();
    play();
  }, [speed]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8"><ErrorState message={error} /></div>;
  if (points.length === 0) return <div className="p-8"><ErrorState message="Ni GPS točk za predvajanje." /></div>;

  const routeLine: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
  const traveledLine = routeLine.slice(0, frameIdx + 1);
  const currentPoint = points[frameIdx];
  const mapCenter = routeLine[Math.floor(routeLine.length / 2)];

  const currentTime = currentPoint ? new Date(currentPoint.timestamp) : null;
  const startTime = new Date(points[0].timestamp);
  const endTime = new Date(points[points.length - 1].timestamp);
  const elapsed = currentTime ? (currentTime.getTime() - startTime.getTime()) / 1000 : 0;
  const total = (endTime.getTime() - startTime.getTime()) / 1000;
  const progressPct = total > 0 ? (elapsed / total) * 100 : 0;

  const recentEvents = events.filter((e) => {
    if (!currentTime) return false;
    const et = new Date(e.timestamp);
    return et <= currentTime && (currentTime.getTime() - et.getTime()) < 10000;
  });

  const eventPoints = events.filter((e) => e.latitude && e.longitude);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/trips" className="text-surface-400 hover:text-white text-sm">← Vožnje</Link>
        <span className="text-surface-600">/</span>
        <span className="text-surface-300 text-sm">Predvajanje vožnje</span>
      </div>

      <SectionHeader title="Predvajanje vožnje" sub={`${points.length} GPS točk · ${events.length} tveganih dogodkov`} />

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-surface-600 mb-4" style={{ height: 440 }}>
        <MapContainer center={mapCenter as [number, number]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© CARTO | OSM" />
          {routeLine.length > 1 && (
            <Polyline positions={routeLine} color="#374151" weight={3} opacity={0.4} />
          )}
          {traveledLine.length > 1 && (
            <Polyline positions={traveledLine} color="#22c55e" weight={3} opacity={0.9} />
          )}
          {currentPoint && (
            <MovingMarker position={[currentPoint.latitude, currentPoint.longitude]} />
          )}
          {routeLine.length > 0 && (
            <CircleMarker center={routeLine[0]} radius={6} fillColor="#22c55e" color="#fff" fillOpacity={1} weight={2}>
              <Popup><div className="text-xs font-bold">Start</div></Popup>
            </CircleMarker>
          )}
          {eventPoints.map((e, i) => (
            <CircleMarker key={i} center={[e.latitude!, e.longitude!]} radius={5}
              fillColor={severityColor[e.severity] ?? '#888'} color="transparent" fillOpacity={0.7}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold">{e.type.replace(/_/g, ' ')}</div>
                  <div>{format(new Date(e.timestamp), 'HH:mm:ss')}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Controls */}
      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-3">
          {/* Play/Pause */}
          <button
            className="btn-primary px-6"
            onClick={() => { if (playing) stop(); else play(); }}
          >
            {playing ? '⏸ Pavza' : frameIdx >= points.length - 1 ? '↺ Ponovi' : '▶ Predvajaj'}
          </button>
          <button className="btn-secondary" onClick={() => { stop(); setFrameIdx(0); }}>
            ⏹ Ponastavi
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-surface-400">Hitrost:</span>
            {[5, 10, 25, 50].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-xs font-mono ${speed === s ? 'bg-brand-500 text-white' : 'bg-surface-700 text-surface-300 hover:bg-surface-600'}`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Timeline slider */}
        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={frameIdx}
          onChange={(e) => { stop(); setFrameIdx(Number(e.target.value)); }}
          className="w-full accent-brand-400"
        />

        {/* Progress bar */}
        <div className="h-1 bg-surface-700 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Current status */}
        <div className="flex gap-6 mt-3 text-sm">
          <div>
            <span className="text-surface-400">Čas: </span>
            <span className="text-white font-mono">
              {currentTime ? format(currentTime, 'HH:mm:ss') : '—'}
            </span>
          </div>
          <div>
            <span className="text-surface-400">Hitrost: </span>
            <span className="text-white font-mono">
              {currentPoint?.gpsSpeedKmh != null ? `${Math.round(currentPoint.gpsSpeedKmh)} km/h` : '—'}
            </span>
          </div>
          <div>
            <span className="text-surface-400">Točka: </span>
            <span className="text-white font-mono">{frameIdx + 1} / {points.length}</span>
          </div>
          <div>
            <span className="text-surface-400">Preteklo: </span>
            <span className="text-white font-mono">{Math.round(elapsed)}s / {Math.round(total)}s</span>
          </div>
        </div>
      </div>

      {/* Recent events panel */}
      <div className="card">
        <div className="text-sm font-medium text-white mb-3">Nedavni dogodki</div>
        {recentEvents.length === 0 ? (
          <div className="text-surface-400 text-sm py-2">Ni nedavnih tveganih dogodkov v zadnjih 10s.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2 bg-surface-700 rounded-lg px-3 py-1.5">
                <EventBadge type={e.type} />
                <Badge variant={e.severity === 'HIGH' ? 'red' : e.severity === 'MEDIUM' ? 'yellow' : 'gray'}>
                  {e.severity}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
