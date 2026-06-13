import React, { useEffect, useState } from 'react';
import { adminApi, ingestionApi } from '../api/client';
import { SectionHeader, DataSourceStatus, LoadingState, ErrorState } from '../components/ui';

interface ProviderStatus {
  provider: string;
  status: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  message?: string;
}

interface ImportLog {
  id: string;
  provider: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  recordsImported: number;
  errorMessage?: string;
}

export default function DataSourcesPage() {
  const [data, setData] = useState<{ statuses: ProviderStatus[]; recentLogs: ImportLog[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const refresh = () => {
    adminApi.dataSources()
      .then((r) => setData(r.data))
      .catch(() => setError('Napaka pri nalaganju statusa.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const runImport = async (type: 'osm' | 'traffic') => {
    setImporting(type);
    try {
      if (type === 'osm') await ingestionApi.importOsm();
      else await ingestionApi.importTraffic();
      refresh();
    } catch {
      setError(`Uvoz ${type} je spodletel.`);
    } finally {
      setImporting(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8"><ErrorState message={error} /></div>;

  return (
    <div className="p-8 max-w-4xl">
      <SectionHeader title="Podatkovni viri" sub="Status zunanjih virov in uvoznih opravil" />

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Status ponudnikov</h2>
        <div className="space-y-3">
          {data?.statuses.map((s) => (
            <DataSourceStatus
              key={s.provider}
              provider={s.provider}
              status={s.status}
              lastSuccessAt={s.lastSuccessAt}
              message={s.message}
            />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Ročni uvoz</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            className="btn-primary"
            onClick={() => runImport('osm')}
            disabled={importing !== null}
          >
            {importing === 'osm' ? 'Uvažam OSM…' : 'Uvozi cestne podatke (OSM)'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => runImport('traffic')}
            disabled={importing !== null}
          >
            {importing === 'traffic' ? 'Uvažam promet…' : 'Uvozi prometne podatke'}
          </button>
        </div>
        <p className="text-xs text-surface-500 mt-2">
          OSM uvoz bere javne podatke iz Overpass API za demo območja (Murska Sobota, Ljubljana, Maribor, Celje).
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Zadnji uvozi</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-surface-400 border-b border-surface-600 text-left">
                <th className="pb-2 pr-4">Ponudnik</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Zapisi</th>
                <th className="pb-2">Čas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {data?.recentLogs.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-4 text-white">{l.provider}</td>
                  <td className="py-2 pr-4">
                    <span className={l.status === 'SUCCESS' ? 'text-brand-400' : l.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-surface-300">{l.recordsImported}</td>
                  <td className="py-2 text-surface-400 text-xs">
                    {new Date(l.startedAt).toLocaleString('sl-SI')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.recentLogs.length && (
            <div className="text-center text-surface-400 py-8">Ni zapisov uvoza.</div>
          )}
        </div>
      </div>
    </div>
  );
}
