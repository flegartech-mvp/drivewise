import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { tripsApi, tripsScoreApi } from '../../src/api/client';
import { colors, Card, ScoreRing, EventBadge, SectionHeader, LoadingState } from '../../src/components/ui';

interface Trip {
  id: string;
  startedAt: string;
  endedAt?: string;
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  score?: number;
  status: string;
  mode: string;
}

interface DrivingEvent {
  id: string;
  type: string;
  severity: string;
  timestamp: string;
  value?: number;
  metadata: Record<string, unknown>;
}

interface DriverLevel {
  tier: string;
  labelSl: string;
  emoji: string;
  color: string;
  progressToNext: number;
  nextTier?: string;
  nextMinScore?: number;
  minScore: number;
  maxScore: number;
}

interface ScoreBreakdown {
  finalScore: number;
  penalties: { reason: string; points: number; count: number }[];
  bonuses: { reason: string; points: number }[];
  warnings: string[];
  topWeaknesses: string[];
  topStrengths: string[];
  recommendations: string[];
  driverLevel: DriverLevel;
}

const levelColors: Record<string, string> = {
  PLATINUM: '#e5e4e2',
  GOLD: '#ffd700',
  SILVER: '#c0c0c0',
  BRONZE: '#cd7f32',
};

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      tripsApi.get(id).then((r) => setTrip(r.data as Trip)),
      tripsApi.events(id).then((r) => setEvents(r.data as DrivingEvent[])),
      tripsScoreApi.breakdown(id).then((r) => setBreakdown(r.data as ScoreBreakdown)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (!trip) return <View style={styles.container}><Text style={{ color: colors.red }}>Vožnja ni najdena.</Text></View>;

  const level = breakdown?.driverLevel;
  const levelColor = level ? (levelColors[level.tier] ?? colors.textDim) : colors.textDim;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Score + level header */}
      <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
        {trip.score != null
          ? <ScoreRing score={trip.score} size={96} />
          : <Text style={{ color: colors.textDim }}>Brez ocene</Text>}
        {level && (
          <View style={styles.levelRow}>
            <Text style={{ fontSize: 22 }}>{level.emoji}</Text>
            <Text style={[styles.levelLabel, { color: levelColor }]}>{level.labelSl}</Text>
          </View>
        )}
        {level && level.nextTier && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${level.progressToNext}%` as any, backgroundColor: levelColor }]} />
            </View>
            <Text style={styles.progressText}>{level.progressToNext}% do {level.nextTier} ({level.nextMinScore} točk)</Text>
          </View>
        )}
        <Text style={styles.date}>
          {new Date(trip.startedAt).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={[styles.mode, { color: trip.mode === 'GENERATED_SIMULATION' ? colors.blue : colors.textDim }]}>
          {trip.mode === 'GENERATED_SIMULATION' ? '🎮 Simulirana vožnja' : '📡 Prava vožnja'}
        </Text>
      </Card>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Razdalja', value: `${trip.distanceKm.toFixed(1)} km` },
          { label: 'Čas', value: `${Math.round(trip.durationSeconds / 60)} min` },
          { label: 'Povpr. hitrost', value: `${Math.round(trip.averageSpeedKmh)} km/h` },
          { label: 'Max. hitrost', value: `${Math.round(trip.maxSpeedKmh)} km/h` },
        ].map(({ label, value }) => (
          <View key={label} style={styles.statBox}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Score breakdown */}
      {breakdown && (breakdown.penalties.length > 0 || breakdown.bonuses.length > 0) && (
        <Card>
          <Text style={styles.sectionTitle}>Razčlenitev ocene</Text>
          {breakdown.penalties.map((p, i) => (
            <View key={i} style={styles.scoreRow}>
              <Text style={styles.scoreReason}>{p.reason} ({p.count}×)</Text>
              <Text style={styles.penaltyPoints}>−{p.points}</Text>
            </View>
          ))}
          {breakdown.bonuses.map((b, i) => (
            <View key={i} style={styles.scoreRow}>
              <Text style={styles.scoreReason}>{b.reason}</Text>
              <Text style={styles.bonusPoints}>+{b.points}</Text>
            </View>
          ))}
          <View style={[styles.scoreRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Skupaj</Text>
            <Text style={styles.totalScore}>{breakdown.finalScore} / 100</Text>
          </View>
        </Card>
      )}

      {/* Strengths */}
      {breakdown && breakdown.topStrengths.length > 0 && (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.brand }]}>Prednosti</Text>
          {breakdown.topStrengths.map((s, i) => (
            <Text key={i} style={styles.strengthItem}>✓  {s}</Text>
          ))}
        </Card>
      )}

      {/* Weaknesses */}
      {breakdown && breakdown.topWeaknesses.length > 0 && (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.red }]}>Slabosti</Text>
          {breakdown.topWeaknesses.map((w, i) => (
            <Text key={i} style={styles.weaknessItem}>✗  {w}</Text>
          ))}
        </Card>
      )}

      {/* Recommendations */}
      {breakdown && breakdown.recommendations.length > 0 && (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.yellow }]}>Priporočila</Text>
          {breakdown.recommendations.map((r, i) => (
            <Text key={i} style={styles.recItem}>→  {r}</Text>
          ))}
        </Card>
      )}

      {/* Events */}
      <SectionHeader title={`Tvegani dogodki (${events.length})`} />
      {events.length === 0 ? (
        <Card><Text style={{ color: colors.textDim, textAlign: 'center' }}>✅ Nobenih tveganih dogodkov!</Text></Card>
      ) : (
        events.map((e) => (
          <Card key={e.id} style={{ marginBottom: 8 }}>
            <EventBadge type={e.type} />
            <Text style={styles.eventTime}>{new Date(e.timestamp).toLocaleTimeString('sl-SI')}</Text>
            {e.value != null && <Text style={styles.eventVal}>Vrednost: {e.value.toFixed(2)}</Text>}
            {(e.metadata as any)?.speedKmh != null && (
              <Text style={styles.eventVal}>Hitrost: {Math.round((e.metadata as any).speedKmh)} km/h</Text>
            )}
            {(e.metadata as any)?.note && (
              <Text style={styles.noteText}>⚠ {(e.metadata as any).note}</Text>
            )}
          </Card>
        ))
      )}

      <Text style={styles.disclaimer}>
        Ocene so ocenjevalne in niso primerne za zavarovalniško presojo. Vrednosti temeljijo na senzorskih podatkih naprave.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  date: { color: colors.textDim, fontSize: 13, marginTop: 8 },
  mode: { fontSize: 11, marginTop: 4 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  levelLabel: { fontSize: 18, fontWeight: '700' },
  progressContainer: { width: '100%', marginTop: 8, paddingHorizontal: 16 },
  progressBg: { height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { color: colors.textDim, fontSize: 10, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  statLabel: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 2 },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  scoreReason: { color: colors.textDim, fontSize: 12, flex: 1 },
  penaltyPoints: { color: colors.red, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bonusPoints: { color: colors.brand, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  totalRow: { borderBottomWidth: 0, marginTop: 4 },
  totalLabel: { color: colors.text, fontWeight: '700', fontSize: 13 },
  totalScore: { color: colors.brand, fontWeight: '800', fontSize: 15 },
  strengthItem: { color: colors.brand, fontSize: 13, marginBottom: 4 },
  weaknessItem: { color: colors.red, fontSize: 13, marginBottom: 4 },
  recItem: { color: colors.yellow, fontSize: 13, marginBottom: 4 },
  eventTime: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  eventVal: { color: colors.textDim, fontSize: 11 },
  noteText: { color: colors.yellow, fontSize: 11, marginTop: 4 },
  disclaimer: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 32 },
});
