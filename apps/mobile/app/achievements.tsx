import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { scoresApi } from '../src/api/client';
import { colors, Card, SectionHeader, LoadingState } from '../src/components/ui';

interface Achievement {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: string | null;
}

interface AchievementsData {
  achievements: Achievement[];
  unlocked: number;
  total: number;
}

export default function AchievementsScreen() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scoresApi.achievements()
      .then((r) => setData(r.data as AchievementsData))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const pct = data ? Math.round((data.unlocked / data.total) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <SectionHeader
        title="Dosežki"
        sub={`${data?.unlocked ?? 0} / ${data?.total ?? 0} dosežkov odklenjenih`}
      />

      {/* Progress bar */}
      <Card style={{ marginBottom: 8 }}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Skupni napredek</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
      </Card>

      {/* Achievement list */}
      {data?.achievements.map((a) => (
        <View
          key={a.id}
          style={[styles.achievementCard, a.unlocked ? styles.unlocked : styles.locked]}
        >
          <Text style={[styles.emoji, !a.unlocked && styles.lockedEmoji]}>{a.emoji}</Text>
          <View style={styles.achievementBody}>
            <Text style={[styles.achievementLabel, !a.unlocked && styles.lockedText]}>
              {a.label}
            </Text>
            <Text style={styles.achievementDesc}>{a.description}</Text>
            {a.unlocked && a.unlockedAt && (
              <Text style={styles.unlockedAt}>
                ✓ Odklenjen {new Date(a.unlockedAt).toLocaleDateString('sl-SI')}
              </Text>
            )}
          </View>
          {a.unlocked && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          )}
        </View>
      ))}

      <Text style={styles.note}>
        Dosežki se izračunajo avtomatično iz podatkov vaših voženj.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: colors.textDim, fontSize: 12 },
  progressPct: { color: colors.brand, fontSize: 12, fontWeight: '700' },
  progressBg: { height: 8, backgroundColor: colors.surface2, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: 4 },
  achievementCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: 14, marginBottom: 10, borderWidth: 1, gap: 12,
  },
  unlocked: { backgroundColor: colors.surface, borderColor: colors.brand + '60' },
  locked: { backgroundColor: colors.surface2, borderColor: colors.border, opacity: 0.6 },
  emoji: { fontSize: 28, width: 36, textAlign: 'center' },
  lockedEmoji: { opacity: 0.4 },
  achievementBody: { flex: 1 },
  achievementLabel: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  lockedText: { color: colors.textDim },
  achievementDesc: { color: colors.textDim, fontSize: 12 },
  unlockedAt: { color: colors.brand, fontSize: 11, marginTop: 3 },
  checkBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#000', fontWeight: '800', fontSize: 12 },
  note: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 32 },
});
