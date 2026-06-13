import React from 'react';
import clsx from 'clsx';

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent }: {
  label: string; value: React.ReactNode; sub?: string; accent?: boolean;
}) {
  return (
    <div className="card">
      <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={clsx('text-2xl font-bold', accent ? 'text-brand-400' : 'text-white')}>{value}</div>
      {sub && <div className="text-xs text-surface-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = score >= 90 ? '#22c55e' : score >= 75 ? '#eab308' : score >= 50 ? '#f97316' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2d333b" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray';
const badgeColors: Record<BadgeVariant, string> = {
  green: 'bg-brand-500/20 text-brand-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
  red: 'bg-red-500/20 text-red-400',
  blue: 'bg-blue-500/20 text-blue-400',
  gray: 'bg-surface-500/40 text-surface-300',
};

export function Badge({ children, variant = 'gray' }: {
  children: React.ReactNode; variant?: BadgeVariant;
}) {
  return <span className={clsx('badge', badgeColors[variant])}>{children}</span>;
}

// ── EventBadge ────────────────────────────────────────────────────────────────
const eventColors: Record<string, BadgeVariant> = {
  SPEEDING: 'red',
  HARSH_BRAKING: 'yellow',
  HARSH_ACCELERATION: 'yellow',
  SHARP_CORNERING: 'blue',
  PHONE_MOVEMENT: 'red',
  NIGHT_DRIVING: 'gray',
  GPS_SIGNAL_LOSS: 'gray',
  CRASH_LIKE_SPIKE: 'red',
};

const eventLabels: Record<string, string> = {
  SPEEDING: 'Prekoračitev hitrosti',
  HARSH_BRAKING: 'Močno zaviranje',
  HARSH_ACCELERATION: 'Močno pospeševanje',
  SHARP_CORNERING: 'Oster ovinek',
  PHONE_MOVEMENT: 'Premik telefona',
  NIGHT_DRIVING: 'Nočna vožnja',
  GPS_SIGNAL_LOSS: 'Izguba GPS',
  CRASH_LIKE_SPIKE: 'Možen trk',
};

export function EventBadge({ type }: { type: string }) {
  return <Badge variant={eventColors[type] ?? 'gray'}>{eventLabels[type] ?? type}</Badge>;
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {sub && <p className="text-surface-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}

// ── LoadingState ──────────────────────────────────────────────────────────────
export function LoadingState({ label = 'Nalagam…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-surface-400">
      <div className="flex gap-2 items-center">
        <div className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
        {label}
      </div>
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="card text-red-400 text-sm">
      ⚠ {message}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ label }: { label: string }) {
  return (
    <div className="card text-center text-surface-400 py-12">
      {label}
    </div>
  );
}

// ── DataSourceStatus ──────────────────────────────────────────────────────────
export function DataSourceStatus({ provider, status, lastSuccessAt, message }: {
  provider: string;
  status: string;
  lastSuccessAt?: string;
  message?: string;
}) {
  const variant: BadgeVariant = status === 'OK' ? 'green' : status === 'ERROR' ? 'red' : 'gray';
  return (
    <div className="card flex items-start justify-between gap-4">
      <div>
        <div className="font-medium text-white">{provider}</div>
        {lastSuccessAt && (
          <div className="text-xs text-surface-400 mt-0.5">
            Zadnja uspešna sinhronizacija: {new Date(lastSuccessAt).toLocaleString('sl-SI')}
          </div>
        )}
        {message && <div className="text-xs text-red-400 mt-0.5">{message}</div>}
      </div>
      <Badge variant={variant}>{status}</Badge>
    </div>
  );
}
