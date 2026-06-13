import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTripStore } from '../../src/store/trip.store';
import { GeneratedSimulationSensorProvider } from '../../src/sensors/GeneratedSimulationSensorProvider';
import { RealDeviceSensorProvider } from '../../src/sensors/RealDeviceSensorProvider';
import { SensorMode } from '@drivewise/shared';
import { colors, Button, Card, EventBadge } from '../../src/components/ui';

export default function DriveScreen() {
  const isActive = useTripStore((s) => s.isActive);
  const tripId = useTripStore((s) => s.tripId);
  const startedAt = useTripStore((s) => s.startedAt);
  const currentSpeedKmh = useTripStore((s) => s.currentSpeedKmh);
  const recentEvents = useTripStore((s) => s.recentEvents);
  const liveScore = useTripStore((s) => s.liveScore);
  const sensorMode = useTripStore((s) => s.sensorMode);
  const startTrip = useTripStore((s) => s.startTrip);
  const stopTrip = useTripStore((s) => s.stopTrip);
  const setSensorMode = useTripStore((s) => s.setSensorMode);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive || !startedAt) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, startedAt]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const provider = sensorMode === SensorMode.REAL_DEVICE
        ? new RealDeviceSensorProvider()
        : new GeneratedSimulationSensorProvider('safe_city');
      await startTrip(undefined, provider, sensorMode);
    } catch (e: any) {
      Alert.alert('Napaka', e?.message ?? 'Ne morem začeti vožnje');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const result = await stopTrip();
      if (result) {
        router.push(`/trip/${result.tripId}`);
      }
    } catch (e: any) {
      Alert.alert('Napaka', e?.message ?? 'Ne morem zaustaviti vožnje');
    } finally {
      setLoading(false);
    }
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (!isActive) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Način sledenja</Text>
        <View style={styles.modeRow}>
          {[SensorMode.GENERATED_SIMULATION, SensorMode.REAL_DEVICE].map((m) => (
            <View key={m} style={{ flex: 1, marginHorizontal: 4 }}>
              <Button
                label={m === SensorMode.REAL_DEVICE ? '📡 Prava naprava' : '🎮 Simulacija'}
                onPress={() => setSensorMode(m)}
                variant={sensorMode === m ? 'primary' : 'secondary'}
              />
            </View>
          ))}
        </View>
        {sensorMode === SensorMode.REAL_DEVICE && (
          <Card>
            <Text style={styles.warningText}>
              ℹ️ Prava naprava zahteva dovoljenje za lokacijo. Zagotovite, da ste zunaj z dobrim GPS signalom.
            </Text>
          </Card>
        )}
        {sensorMode === SensorMode.GENERATED_SIMULATION && (
          <Card>
            <Text style={styles.infoText}>🎮 Demo način: simulirani GPS in senzorski podatki. Primerno za testiranje.</Text>
          </Card>
        )}
        <Button label="🚗  Začni vožnjo" onPress={handleStart} disabled={loading} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
        <Text style={styles.timerLabel}>Čas vožnje</Text>
      </Card>

      <View style={styles.statsRow}>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.bigNum}>{Math.round(currentSpeedKmh)}</Text>
          <Text style={styles.unit}>km/h</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.bigNum, { color: liveScore >= 80 ? colors.brand : liveScore >= 60 ? colors.yellow : colors.red }]}>
            {liveScore}
          </Text>
          <Text style={styles.unit}>ocena</Text>
        </Card>
      </View>

      {recentEvents.length > 0 && (
        <Card>
          <Text style={styles.eventsTitle}>Zaznani dogodki</Text>
          {recentEvents.slice(0, 5).map((e, i) => (
            <EventBadge key={i} type={e.type} />
          ))}
        </Card>
      )}

      <Button label="⏹  Zaustavi vožnjo" onPress={handleStop} variant="danger" disabled={loading} />

      <Text style={styles.disclaimer}>
        Ocene so ocenjevalne. Bodite varni in ne glejte v telefon med vožnjo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  timer: { color: colors.brand, fontSize: 48, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerLabel: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  bigNum: { color: colors.text, fontSize: 36, fontWeight: '800' },
  unit: { color: colors.textDim, fontSize: 12 },
  eventsTitle: { color: colors.text, fontWeight: '600', marginBottom: 8 },
  label: { color: colors.textDim, fontSize: 13, marginBottom: 8 },
  modeRow: { flexDirection: 'row', marginBottom: 12 },
  warningText: { color: colors.yellow, fontSize: 12, lineHeight: 18 },
  infoText: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  disclaimer: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
