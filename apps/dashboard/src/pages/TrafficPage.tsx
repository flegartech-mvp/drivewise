import React, { useEffect, useState } from 'react';
import { ingestionApi } from '../api/client';
import { SectionHeader, LoadingState, ErrorState, Badge } from '../components/ui';
import { format } from 'date-fns';

interface TrafficEvent {
  id: string;
  source: string;
  type: string;
  title: string;
  description?: string;
  severity?: string;
  roadName?: string;
  latitude?: number;
  longitude?: number;
  validFrom?: string;
  validTo?: string;
  importedAt: string;
}

const typeLabel: Record<string, string> = {
  accident: 'Nesreča', roadwork: 'Dela', closure: 'Zapora',
  congestion: 'Zastoj', unknown: 'Neznano',
};

export default function TrafficPage() {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ingestionApi.trafficEvents()
      .then((r) => setEvents(r.data))
      .catch(() => setError('Prometni podatki niso na voljo.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="p-8">
      <SectionHeader title="Prometni dogodki" sub="Uvoženi iz javnih virov (Promet.si / DATEX II)" />
      {error && (
        <div className="card border-yellow-500/30 text-yellow-400 text-sm mb-6">
          ⚠ {error} Prikazujem lokalne podatke (če obstajajo).
        </div>
      )}
      {events.length === 0 ? (
        <div className="card text-surface-400 text-center py-12">
          Ni prometnih dogodkov. Zaženite uvoz na strani Podatkovni viri.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-white">{e.title}</div>
                  {e.description && <div className="text-sm text-surface-400 mt-0.5">{e.description}</div>}
                  {e.roadName && <div className="text-xs text-surface-500 mt-1">Cesta: {e.roadName}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge variant="gray">{typeLabel[e.type] ?? e.type}</Badge>
                  {e.severity && (
                    <Badge variant={e.severity === 'HIGH' ? 'red' : e.severity === 'MEDIUM' ? 'yellow' : 'gray'}>
                      {e.severity}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-surface-500 mt-2">
                Vir: {e.source} · {format(new Date(e.importedAt), 'd. M. yyyy HH:mm')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
