import React, { useEffect, useState } from 'react';
import { simulationApi } from '../api/client';
import { SectionHeader, LoadingState, ErrorState, ScoreRing, Badge } from '../components/ui';

interface Scenario {
  id: string;
  label: string;
  labelSl: string;
  description: string;
  durationSeconds: number;
}

interface GenerateResult {
  tripId: string;
  scenarioId: string;
  distanceKm: number;
  samplesGenerated: number;
  eventsDetected: number;
  isDemo: boolean;
  score: {
    finalScore: number;
    penalties: { reason: string; points: number; count: number }[];
    bonuses: { reason: string; points: number }[];
    warnings: string[];
    explanationText: string;
  };
}

export default function SimulationPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    simulationApi.scenarios().then((r) => setScenarios(r.data));
  }, []);

  const generate = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await simulationApi.generate(selected);
      setResult(res.data);
    } catch {
      setError('Generiranje demo vožnje je spodletelo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <SectionHeader title="Simulacija vožnje" sub="Generiraj demo vožnje za testiranje sistema" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`card text-left transition-all hover:border-brand-500 ${
              selected === s.id ? 'border-brand-500 bg-surface-700' : ''
            }`}
          >
            <div className="font-medium text-white">{s.labelSl}</div>
            <div className="text-xs text-surface-400 mt-0.5">{s.description}</div>
            <div className="text-xs text-surface-500 mt-1">{Math.round(s.durationSeconds / 60)} min</div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <button
          className="btn-primary"
          onClick={generate}
          disabled={!selected || loading}
        >
          {loading ? 'Generiram…' : 'Generiraj demo vožnjo'}
        </button>
        {selected && (
          <button className="btn-secondary" onClick={() => { setSelected(null); setResult(null); }}>
            Počisti
          </button>
        )}
      </div>

      {error && <ErrorState message={error} />}

      {result && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-6 mb-4">
              <ScoreRing score={result.score.finalScore} size={80} />
              <div>
                <div className="text-xl font-bold text-white">Ocena vožnje: {result.score.finalScore}/100</div>
                <div className="text-sm text-surface-400 mt-1">
                  Scenarij: <span className="text-white">{result.scenarioId}</span>
                </div>
                <div className="text-sm text-surface-400">
                  {result.distanceKm.toFixed(2)} km · {result.samplesGenerated} vzorcev · {result.eventsDetected} dogodkov
                </div>
                <Badge variant="blue">DEMO / SIMULACIJA</Badge>
              </div>
            </div>

            {result.score.penalties.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-surface-400 uppercase tracking-wider mb-2">Odbitki</div>
                {result.score.penalties.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-surface-700">
                    <span className="text-surface-300">{p.reason} ({p.count}×)</span>
                    <span className="text-red-400">-{p.points} točk</span>
                  </div>
                ))}
              </div>
            )}

            {result.score.bonuses.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-surface-400 uppercase tracking-wider mb-2">Bonusi</div>
                {result.score.bonuses.map((b, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-surface-700">
                    <span className="text-surface-300">{b.reason}</span>
                    <span className="text-brand-400">+{b.points} točk</span>
                  </div>
                ))}
              </div>
            )}

            {result.score.warnings.length > 0 && (
              <div>
                <div className="text-xs text-surface-400 uppercase tracking-wider mb-2">Opozorila</div>
                {result.score.warnings.map((w, i) => (
                  <div key={i} className="text-xs text-yellow-400 py-0.5">⚠ {w}</div>
                ))}
              </div>
            )}
          </div>

          <div className="card text-xs text-surface-400">
            <pre className="whitespace-pre-wrap font-mono">{result.score.explanationText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
