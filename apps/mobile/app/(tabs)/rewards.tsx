import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { rewardsApi, scoresApi } from '../../src/api/client';
import { colors, Card, SectionHeader, LoadingState } from '../../src/components/ui';

interface SimResult {
  tier: string;
  simulatedDiscountPercent: number;
  nextTier?: string;
  requiredKmForNextTier?: number;
  requiredScoreForNextTier?: number;
  isDemo: boolean;
  disclaimer: string;
}

interface AchievementsData {
  unlocked: number;
  total: number;
}

const tierColors: Record<string, string> = {
  NONE: colors.textDim,
  BRONZE: '#cd7f32',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
  PLATINUM: '#e5e4e2',
};

const tierEmoji: Record<string, string> = {
  NONE: '⬜', BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎',
};

const tierLabel: Record<string, string> = {
  NONE: 'Brez stopnje', BRONZE: 'Bronast', SILVER: 'Srebrn', GOLD: 'Zlatast', PLATINUM: 'Platinast',
};

const tierMinScore: Record<string, number> = {
  NONE: 0, BRONZE: 85, SILVER: 90, GOLD: 95, PLATINUM: 97,
};

const tierMinKm: Record<string, number> = {
  NONE: 0, BRONZE: 200, SILVER: 400, GOLD: 800, PLATINUM: 1000,
};

const tierDescription: Record<string, string> = {
  NONE: 'Začnite voziti varno, da dosežete bronasto stopnjo.',
  BRONZE: 'Dobro! Ohranite dosleden stil vožnje za napredovanje.',
  SILVER: 'Odlično! Zmanjšajte tvegane dogodke za zlato stopnjo.',
  GOLD: 'Izjemno! Najboljša stopnja je v dosegu.',
  PLATINUM: '🎉 Dosegli ste najvišjo stopnjo! Vzor varnega voznika.',
};

const TIERS = ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

export default function RewardsScreen() {
  const [sim, setSim] = useState<SimResult | null>(null);
  const [achievements, setAchievements] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      rewardsApi.simulator().then((r) => setSim(r.data as SimResult)),
      scoresApi.achievements().then((r) => setAchievements(r.data as AchievementsData)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const currentTier = sim?.tier ?? 'NONE';
  const currentIdx = TIERS.indexOf(currentTier);
  const tierColor = tierColors[currentTier];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <SectionHeader title="Nagrade" sub="Simulacija programa nagrajevanja varne vožnje" />

      {/* Main tier card */}
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Text style={styles.tierEmoji}>{tierEmoji[currentTier]}</Text>
        <Text style={[styles.tierName, { color: tierColor }]}>{tierLabel[currentTier]}</Text>
        {(sim?.simulatedDiscountPercent ?? 0) > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{sim?.simulatedDiscountPercent}% simuliran popust</Text>
          </View>
        )}
        <Text style={styles.tierDesc}>{tierDescription[currentTier]}</Text>
      </Card>

      {/* Tier progress ladder */}
      <Card>
        <Text style={styles.sectionLabel}>Lestvica stopenj</Text>
        {TIERS.slice(1).map((t, i) => {
          const idx = TIERS.indexOf(t);
          const reached = idx <= currentIdx;
          const current = t === currentTier;
          return (
            <View key={t} style={[styles.tierRow, current && { backgroundColor: tierColors[t] + '18', borderRadius: 8 }]}>
              <Text style={{ fontSize: 20 }}>{tierEmoji[t]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tierRowLabel, { color: reached ? tierColors[t] : colors.textDim }]}>
                  {tierLabel[t]} {current ? '← Vaša stopnja' : ''}
                </Text>
                <Text style={styles.tierRowSub}>
                  ≥ {tierMinScore[t]} točk · ≥ {tierMinKm[t]} km/mesec
                </Text>
              </View>
              {reached && <Text style={[styles.check, { color: tierColors[t] }]}>✓</Text>}
            </View>
          );
        })}
      </Card>

      {/* Next tier requirements */}
      {sim?.nextTier && (
        <Card>
          <Text style={styles.sectionLabel}>Do naslednje stopnje</Text>
          {(sim.requiredKmForNextTier ?? 0) > 0 && (
            <View style={styles.reqRow}>
              <Text style={styles.reqIcon}>📍</Text>
              <Text style={styles.reqText}>+{sim.requiredKmForNextTier?.toFixed(0)} km ta mesec</Text>
            </View>
          )}
          {(sim.requiredScoreForNextTier ?? 0) > 0 && (
            <View style={styles.reqRow}>
              <Text style={styles.reqIcon}>📈</Text>
              <Text style={styles.reqText}>+{sim.requiredScoreForNextTier?.toFixed(0)} točk povprečne ocene</Text>
            </View>
          )}
        </Card>
      )}

      {/* Achievements preview */}
      {achievements && (
        <TouchableOpacity onPress={() => router.push('/achievements')}>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.achievTitle}>🏆 Dosežki</Text>
              <Text style={styles.achievSub}>{achievements.unlocked} / {achievements.total} odklenjen</Text>
            </View>
            <Text style={{ color: colors.brand, fontSize: 18 }}>›</Text>
          </Card>
        </TouchableOpacity>
      )}

      <Card>
        <Text style={styles.disclaimer}>⚠️ {sim?.disclaimer}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tierEmoji: { fontSize: 52, marginBottom: 8 },
  tierName: { fontSize: 28, fontWeight: '800' },
  discountBadge: { backgroundColor: colors.brand + '20', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8 },
  discountText: { color: colors.brand, fontWeight: '700', fontSize: 15 },
  tierDesc: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 10, paddingHorizontal: 16 },
  sectionLabel: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 6 },
  tierRowLabel: { fontWeight: '600', fontSize: 13 },
  tierRowSub: { color: colors.textDim, fontSize: 11, marginTop: 1 },
  check: { fontSize: 18, fontWeight: '700' },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reqIcon: { fontSize: 16 },
  reqText: { color: colors.textDim, fontSize: 13 },
  achievTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  achievSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  disclaimer: { color: colors.textDim, fontSize: 11, lineHeight: 16 },
});
