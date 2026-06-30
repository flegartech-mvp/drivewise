import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { scoresApi } from '../api/client';
import { SectionHeader, LoadingState, ErrorState, StatCard } from '../components/ui';

interface WeeklyReport {
  period: string;
  tripCount: number;
  totalKm: number;
  totalSeconds: number;
  averageScore: number | null;
  previousAverageScore: number | null;
  improvement: number | null;
  bestTrip: { id: string; score: number; distanceKm: number; startedAt: string } | null;
  worstTrip: { id: string; score: number; distanceKm: number; startedAt: string } | null;
  harshEvents: number;
  speedingEvents: number;
  phoneEvents: number;
  eventByType: Record<string, number>;
}

interface MonthlyEntry {
  month: string;
  averageScore: number | null;
  tripCount: number;
  distanceKm: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

const improvementColor = (v: number | null) => {
  if (v === null) return 'text-surface-400';
  if (v > 0) return 'text-brand-400';
  if (v < 0) return 'text-red-400';
  return 'text-surface-300';
};

export default function ReportPage() {
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [monthly, setMonthly] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      scoresApi.weeklyReport().then((r) => setWeekly(r.data)),
      scoresApi.monthly().then((r) => setMonthly(r.data)),
    ])
      .catch(() => setError('Napaka pri nalaganju poročila.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8"><ErrorState message={error} /></div>;

  const eventChartData = weekly ? [
    { name: 'Prekoračitev hitrosti', count: weekly.speedingEvents },
    { name: 'Sunkovito zaviranje', count: weekly.harshEvents },
    { name: 'Telefon', count: weekly.phoneEvents },
  ] : [];

  return (
    <div className="p-8 max-w-6xl">
      <SectionHeader title="Tedensko poročilo" sub="Analiza voženj zadnjih 7 dni" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Število voženj" value={weekly?.tripCount ?? 0} />
        <StatCard label="Skupna razdalja" value={`${weekly?.totalKm ?? 0} km`} />
        <StatCard label="Skupni čas" value={weekly ? formatDuration(weekly.totalSeconds) : '—'} />
        <div className="card">
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Povprečna ocena</div>
          <div className="text-2xl font-bold text-white">{weekly?.averageScore ?? '—'}</div>
          {weekly?.improvement !== null && weekly?.improvement !== undefined && (
            <div className={`text-xs mt-0.5 font-medium ${improvementColor(weekly.improvement)}`}>
              {weekly.improvement > 0 ? `↑ +${weekly.improvement}` : weekly.improvement < 0 ? `↓ ${weekly.improvement}` : '→ enako'} glede na prejšnji teden
            </div>
          )}
        </div>
      </div>

      {/* Best / Worst trip */}
      {(weekly?.bestTrip || weekly?.worstTrip) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {weekly?.bestTrip && (
            <div className="card">
              <div className="text-xs text-brand-400 uppercase tracking-wider mb-2">Najboljša vožnja</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{new Date(weekly.bestTrip.startedAt).toLocaleDateString('sl-SI')}</div>
                  <div className="text-surface-400 text-sm">{weekly.bestTrip.distanceKm.toFixed(1)} km</div>
                </div>
                <div className="text-2xl font-bold text-brand-400">{weekly.bestTrip.score}</div>
              </div>
            </div>
          )}
          {weekly?.worstTrip && weekly.worstTrip.id !== weekly.bestTrip?.id && (
            <div className="card">
              <div className="text-xs text-red-400 uppercase tracking-wider mb-2">Najslabša vožnja</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{new Date(weekly.worstTrip.startedAt).toLocaleDateString('sl-SI')}</div>
                  <div className="text-surface-400 text-sm">{weekly.worstTrip.distanceKm.toFixed(1)} km</div>
                </div>
                <div className="text-2xl font-bold text-red-400">{weekly.worstTrip.score}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly score trend */}
        <div className="card">
          <div className="text-sm font-medium text-white mb-4">Trend ocene (mesečno)</div>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[...monthly].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="averageScore" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Ocena" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-surface-400 text-sm text-center py-8">Ni dovolj podatkov za trend.</div>
          )}
        </div>

        {/* Event breakdown */}
        <div className="card">
          <div className="text-sm font-medium text-white mb-4">Dogodki ta teden</div>
          {eventChartData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Število" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-surface-400 text-sm text-center py-8">
              <div className="text-2xl mb-2">✅</div>
              Nobenih tveganih dogodkov ta teden!
            </div>
          )}
        </div>
      </div>

      {/* Monthly history table */}
      <div className="card">
        <div className="text-sm font-medium text-white mb-4">Mesečna statistika</div>
        {monthly.length === 0 ? (
          <div className="text-surface-400 text-sm text-center py-6">Ni mesečnih podatkov.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-surface-400 border-b border-surface-700 text-left">
                <th className="pb-2 pr-4">Mesec</th>
                <th className="pb-2 pr-4">Vožnje</th>
                <th className="pb-2 pr-4">Razdalja</th>
                <th className="pb-2">Povprečna ocena</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {monthly.map((m) => (
                <tr key={m.month} className="hover:bg-surface-700/30">
                  <td className="py-2 pr-4 text-white font-mono">{m.month}</td>
                  <td className="py-2 pr-4 text-surface-300">{m.tripCount}</td>
                  <td className="py-2 pr-4 text-surface-300">{m.distanceKm} km</td>
                  <td className="py-2">
                    {m.averageScore != null ? (
                      <span className={`font-bold ${m.averageScore >= 85 ? 'text-brand-400' : m.averageScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {m.averageScore}/100
                      </span>
                    ) : <span className="text-surface-500">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-xs text-surface-500">
        ℹ Poročila so ocenjevalna in niso primerna za zavarovalniške namene.
      </div>
    </div>
  );
}
