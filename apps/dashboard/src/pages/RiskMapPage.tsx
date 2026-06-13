import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { adminApi } from '../api/client';
import { SectionHeader, LoadingState, ErrorState, EventBadge } from '../components/ui';
import 'leaflet/dist/leaflet.css';

interface HeatPoint {
  lat: number;
  lng: number;
  type: string;
  severity: string;
}

const severityColor: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f97316',
  LOW: '#eab308',
};

export default function RiskMapPage() {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    adminApi.heatmap()
      .then((r) => setPoints(r.data))
      .catch(() => setError('Napaka pri nalaganju karte tveganj.'))
      .finally(() => setLoading(false));
  }, []);

  const eventTypes = ['ALL', 'SPEEDING', 'HARSH_BRAKING', 'HARSH_ACCELERATION', 'SHARP_CORNERING', 'PHONE_MOVEMENT'];
  const filtered = filter === 'ALL' ? points : points.filter((p) => p.type === filter);

  if (error) return <div className="p-8"><ErrorState message={error} /></div>;

  return (
    <div className="p-8 flex flex-col h-full">
      <SectionHeader title="Tvegana karta" sub={`${points.length} zaznanih dogodkov (anonimiziranih)`} />

      <div className="flex gap-2 flex-wrap mb-4">
        {eventTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === t ? 'bg-brand-500 text-white' : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
            }`}
          >
            {t === 'ALL' ? 'Vse' : <EventBadge type={t} />}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <div className="flex-1 rounded-xl overflow-hidden border border-surface-600" style={{ minHeight: 500 }}>
          <MapContainer
            center={[46.66, 16.17]}
            zoom={11}
            style={{ height: '100%', width: '100%', background: '#0f1117' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a> | OSM'
            />
            {filtered.map((pt, i) => (
              <CircleMarker
                key={i}
                center={[pt.lat, pt.lng]}
                radius={6}
                fillColor={severityColor[pt.severity] ?? '#888'}
                color="transparent"
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="text-xs">
                    <EventBadge type={pt.type} /><br />
                    Resnost: {pt.severity}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
      <div className="mt-3 text-xs text-surface-500">
        Koordinate so zaokrožene na ~110 m za anonimizacijo (GDPR).
      </div>
    </div>
  );
}
