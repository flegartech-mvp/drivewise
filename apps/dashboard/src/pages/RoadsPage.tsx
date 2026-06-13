import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { SectionHeader, LoadingState, ErrorState, StatCard } from '../components/ui';

interface RoadIntelligence {
  totalSegments: number;
  withSpeedLimit: number;
  missingSpeedLimitPercent: number;
  byRoadType: { roadType: string | null; _count: { id: number } }[];
}

export default function RoadsPage() {
  const [data, setData] = useState<RoadIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.roadIntelligence()
      .then((r) => setData(r.data))
      .catch(() => setError('Napaka pri nalaganju cestnih podatkov.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8"><ErrorState message={error} /></div>;

  return (
    <div className="p-8 max-w-4xl">
      <SectionHeader title="Cestni podatki (OSM)" sub="Uvoženi odseki in podatki o omejitvi hitrosti" />

      {!data || data.totalSegments === 0 ? (
        <div className="card text-surface-400 text-center py-12">
          Ni uvoženih cestnih podatkov. Zaženite <strong>Uvozi cestne podatke (OSM)</strong> na strani Podatkovni viri.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Skupaj odsekov" value={data.totalSegments} />
            <StatCard label="Z omejitvijo hitrosti" value={data.withSpeedLimit} accent />
            <StatCard
              label="Brez omejitve (%)"
              value={`${data.missingSpeedLimitPercent}%`}
              sub="Vrednosti so ocenjene iz tipa ceste"
            />
          </div>

          <div className="card">
            <div className="text-sm font-semibold text-surface-300 mb-4">Razporeditev po tipu ceste</div>
            <div className="space-y-2">
              {data.byRoadType
                .sort((a, b) => b._count.id - a._count.id)
                .slice(0, 15)
                .map((row) => (
                  <div key={row.roadType} className="flex items-center gap-3">
                    <div className="w-32 text-xs text-surface-400 truncate">{row.roadType ?? '(neznano)'}</div>
                    <div className="flex-1 bg-surface-700 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (row._count.id / data.totalSegments) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-surface-300 w-10 text-right">{row._count.id}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card mt-4 text-xs text-surface-400">
            Vir: <a href="https://www.openstreetmap.org" className="text-brand-400 hover:underline" target="_blank">OpenStreetMap</a> contributors,
            licenca <a href="https://opendatacommons.org/licenses/odbl/" className="text-brand-400 hover:underline" target="_blank">ODbL</a>.
          </div>
        </>
      )}
    </div>
  );
}
