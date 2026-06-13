import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { tripsApi } from '../../src/api/client';
import { colors, Card, ScoreRing, LoadingState } from '../../src/components/ui';

interface Trip {
  id: string;
  startedAt: string;
  endedAt?: string;
  distanceKm: number;
  score?: number;
  status: string;
  mode: string;
  durationSeconds: number;
}

export default function HistoryScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await tripsApi.list();
      setTrips(res.data as Trip[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
    >
      <Text style={styles.count}>{trips.length} voženj skupaj</Text>

      {trips.length === 0 && (
        <Card>
          <Text style={{ color: colors.textDim, textAlign: 'center' }}>Ni voženj. Začnite s prvo!</Text>
        </Card>
      )}

      {trips.map((t) => (
        <TouchableOpacity key={t.id} onPress={() => router.push(`/trip/${t.id}`)}>
          <Card style={styles.tripCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>
                {new Date(t.startedAt).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={styles.meta}>
                {t.distanceKm.toFixed(1)} km · {Math.round(t.durationSeconds / 60)} min
              </Text>
              <Text style={[styles.mode, { color: t.mode === 'GENERATED_SIMULATION' ? colors.blue : colors.textDim }]}>
                {t.mode === 'GENERATED_SIMULATION' ? '🎮 Simulacija' : '📡 Prava vožnja'}
              </Text>
            </View>
            {t.score != null && <ScoreRing score={t.score} size={54} />}
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  count: { color: colors.textDim, fontSize: 13, marginBottom: 12 },
  tripCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: colors.text, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  mode: { fontSize: 11, marginTop: 4 },
});
