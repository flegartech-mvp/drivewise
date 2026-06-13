import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { scoresApi, tripsApi } from '../../src/api/client';
import { colors, StatCard, ScoreRing, Card, SectionHeader, LoadingState } from '../../src/components/ui';

interface Trip {
  id: string;
  startedAt: string;
  distanceKm: number;
  score?: number;
  status: string;
}

interface Summary {
  totalTrips: number;
  averageScore: number | null;
  totalDistanceKm: number;
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    Promise.all([
      scoresApi.summary().then((r) => setSummary(r.data)),
      tripsApi.list().then((r) => setRecentTrips((r.data as Trip[]).slice(0, 5))),
    ]).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.greeting}>Pozdravljeni, {user?.name?.split(' ')[0]} 👋</Text>

      <View style={styles.row}>
        <StatCard label="Skupaj voženj" value={summary?.totalTrips ?? 0} />
        <StatCard label="Skupaj km" value={`${summary?.totalDistanceKm ?? 0} km`} />
      </View>

      {summary?.averageScore != null && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <ScoreRing score={summary.averageScore} size={80} />
          <View>
            <Text style={styles.cardTitle}>Povprečna ocena vožnje</Text>
            <Text style={styles.cardSub}>Na podlagi vseh vaših voženj</Text>
          </View>
        </Card>
      )}

      <TouchableOpacity
        style={styles.driveBtn}
        onPress={() => router.push('/(tabs)/drive')}
      >
        <Text style={styles.driveBtnText}>🚗  Začni vožnjo</Text>
      </TouchableOpacity>

      <SectionHeader title="Zadnje vožnje" />
      {recentTrips.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textDim, textAlign: 'center' }}>Ni voženj. Začnite s prvo vožnjo!</Text>
        </Card>
      ) : (
        recentTrips.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => router.push(`/trip/${t.id}`)}>
            <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.cardTitle}>{new Date(t.startedAt).toLocaleDateString('sl-SI')}</Text>
                <Text style={styles.cardSub}>{t.distanceKm.toFixed(1)} km</Text>
              </View>
              {t.score != null && <ScoreRing score={t.score} size={50} />}
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  greeting: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  cardSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  driveBtn: {
    backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', marginBottom: 24,
  },
  driveBtnText: { color: '#000', fontSize: 17, fontWeight: '800' },
});
