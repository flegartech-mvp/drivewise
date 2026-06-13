import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { StatCard, ScoreRing, LoadingState, ErrorState } from '../components/ui';
import { SectionHeader } from '../components/ui';

interface Stats {
  totalUsers: number;
  totalTrips: number;
  totalEvents: number;
  roadSegments: number;
  averageScore: number | null;
  totalDistanceKm: number;
  completedTrips: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => setError('Napaka pri nalaganju statistike.'));
  }, []);

  if (error) return <div className="p-8"><ErrorState message={error} /></div>;
  if (!stats) return <LoadingState />;

  return (
    <div className="p-8">
      <SectionHeader title="Pregled" sub="Splošna statistika sistema DriveWise" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Uporabniki" value={stats.totalUsers} />
        <StatCard label="Vožnje skupaj" value={stats.totalTrips} />
        <StatCard label="Tvegani dogodki" value={stats.totalEvents} />
        <StatCard label="Km skupaj" value={`${stats.totalDistanceKm} km`} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Zaključene vožnje" value={stats.completedTrips} />
        <StatCard label="Cestni odseki (OSM)" value={stats.roadSegments} />
        <StatCard label="Skupna razdalja" value={`${stats.totalDistanceKm} km`} />
        <div className="card flex flex-col items-center gap-2">
          <div className="text-xs text-surface-400 uppercase tracking-wider">Povprečna ocena</div>
          {stats.averageScore != null
            ? <ScoreRing score={stats.averageScore} size={70} />
            : <div className="text-surface-400 text-sm">Ni podatkov</div>}
        </div>
      </div>
      <div className="card text-xs text-surface-400 border-surface-600">
        <strong className="text-surface-300">Opomba:</strong> DriveWise je MVP demonstracija. Ocene vožnje so ocenjevalne in niso primerne za zavarovalniško ali pravno presojo.
      </div>
    </div>
  );
}
