import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

export const colors = {
  bg: '#0f1117',
  surface: '#161b22',
  surface2: '#21262d',
  border: '#30363d',
  brand: '#22c55e',
  brandDim: '#166534',
  text: '#ffffff',
  textDim: '#8b949e',
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
};

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: colors.brand }]}>{value}</Text>
    </View>
  );
}

export function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 90 ? colors.brand : score >= 75 ? colors.yellow : score >= 50 ? '#f97316' : colors.red;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.3, fontWeight: '800', color }}>{score}</Text>
      <Text style={{ fontSize: size * 0.12, color: colors.textDim }}>/100</Text>
    </View>
  );
}

export function Button({ label, onPress, variant = 'primary', disabled }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean;
}) {
  const bg = disabled
    ? colors.surface2
    : variant === 'primary' ? colors.brand
    : variant === 'danger' ? colors.red
    : colors.surface2;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled}
      style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && { color: colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function EventBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    SPEEDING: 'Prekoračitev hitrosti',
    HARSH_BRAKING: 'Močno zaviranje',
    HARSH_ACCELERATION: 'Močno pospeševanje',
    SHARP_CORNERING: 'Oster ovinek',
    PHONE_MOVEMENT: 'Možen premik telefona',
    NIGHT_DRIVING: 'Nočna vožnja',
    GPS_SIGNAL_LOSS: 'Izguba GPS',
    CRASH_LIKE_SPIKE: '[EXP] Možen trk',
  };
  const isRisk = ['SPEEDING', 'PHONE_MOVEMENT', 'CRASH_LIKE_SPIKE'].includes(type);
  return (
    <View style={[styles.badge, { backgroundColor: isRisk ? '#7f1d1d' : '#713f12' }]}>
      <Text style={[styles.badgeText, { color: isRisk ? colors.red : colors.yellow }]}>
        {labels[type] ?? type}
      </Text>
    </View>
  );
}

export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sub && <Text style={styles.sectionSub}>{sub}</Text>}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  statCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, flex: 1, marginHorizontal: 4,
  },
  statLabel: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '700' },
  button: {
    borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 15 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sectionSub: { color: colors.textDim, fontSize: 13, marginTop: 2 },
});
