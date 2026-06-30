import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';
import { LoadingState, ErrorState, Badge, ScoreRing } from '../components/ui';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

interface FraudInfo { status: 'NORMAL' | 'SUSPICIOUS' | 'INVALID'; flags: { reason: string; detail: string }[] }

interface Trip {
  id: string;
  startedAt: string;
  endedAt?: string;
  distanceKm: number;
  score?: number;
  status: string;
  mode: string;
  user?: { name: string; email: string };
  _count?: { events: number; points: number };
  fraud?: FraudInfo;
}

const modeBadge = (mode: string) => {
  if (mode === 'GENERATED_SIMULATION') return <Badge variant="blue">Simulacija</Badge>;
  if (mode === 'REPLAY_FILE') return <Badge variant="yellow">Posnetek</Badge>;
  return <Badge variant="gray">Prava naprava</Badge>;
};

const fraudBadge = (fraud?: FraudInfo) => {
  if (!fraud || fraud.status === 'NORMAL') return null;
  return (
    <Badge variant={fraud.status === 'INVALID' ? 'red' : 'yellow'}>
      {fraud.status === 'INVALID' ? '⚠ Neveljavna' : '⚑ Sumljiva'}
    </Badge>
  );
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterFraud, setFilterFraud] = useState(false);

  useEffect(() => {
    adminApi.trips()
      .then((r) => setTrips(r.data))
      .catch(() => setError('Napaka pri nalaganju voženj.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8"><ErrorState message={error} /></div>;

  const suspiciousCount = trips.filter((t) => t.fraud && t.fraud.status !== 'NORMAL').length;
  const displayed = filterFraud ? trips.filter((t) => t.fraud && t.fraud.status !== 'NORMAL') : trips;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vožnje</h1>
          <p className="text-surface-400 text-sm mt-1">{trips.length} voženj skupaj</p>
        </div>
        <div className="flex gap-2 items-center">
          {suspiciousCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterFraud((f) => !f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterFraud ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-surface-700 text-surface-300 hover:bg-surface-600'}`}
            >
              ⚑ {suspiciousCount} sumljivih
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-surface-400 border-b border-surface-600 text-left">
              <th className="pb-3 pr-4">Voznik</th>
              <th className="pb-3 pr-4">Začetek</th>
              <th className="pb-3 pr-4">Razdalja</th>
              <th className="pb-3 pr-4">Ocena</th>
              <th className="pb-3 pr-4">Dogodki</th>
              <th className="pb-3 pr-4">Način</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Prevara</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {displayed.map((t) => (
              <tr key={t.id} className={`hover:bg-surface-700/40 transition-colors ${t.fraud?.status === 'INVALID' ? 'bg-red-500/5' : t.fraud?.status === 'SUSPICIOUS' ? 'bg-yellow-500/5' : ''}`}>
                <td className="py-3 pr-4">
                  <Link to={`/trips/${t.id}`} className="text-white hover:text-brand-400 transition-colors">
                    {t.user?.name ?? '—'}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-surface-300 whitespace-nowrap">
                  {format(new Date(t.startedAt), 'd. M. yyyy HH:mm', { locale: sl })}
                </td>
                <td className="py-3 pr-4 text-surface-300">{t.distanceKm.toFixed(1)} km</td>
                <td className="py-3 pr-4">
                  {t.score != null
                    ? <ScoreRing score={t.score} size={38} />
                    : <span className="text-surface-500">—</span>}
                </td>
                <td className="py-3 pr-4 text-surface-300">{t._count?.events ?? 0}</td>
                <td className="py-3 pr-4">{modeBadge(t.mode)}</td>
                <td className="py-3 pr-4">
                  <Badge variant={t.status === 'COMPLETED' ? 'green' : t.status === 'ACTIVE' ? 'yellow' : 'gray'}>
                    {t.status}
                  </Badge>
                </td>
                <td className="py-3">
                  {fraudBadge(t.fraud) ?? <span className="text-surface-600 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div className="text-center text-surface-400 py-12">
            {filterFraud ? 'Ni sumljivih voženj.' : 'Ni voženj. Ustvari demo vožnjo na strani Simulacija.'}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-surface-500">
        Zaznavanja prevar so avtomatska in ocenjevalna — temeljijo na preprostih pravilih.
      </div>
    </div>
  );
}
