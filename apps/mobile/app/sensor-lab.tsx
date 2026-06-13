import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { GeneratedSimulationSensorProvider } from '../src/sensors/GeneratedSimulationSensorProvider';
import { EventDetector, enrichSample } from '@drivewise/sensors';
import type { SensorSample } from '@drivewise/shared';
import type { DetectedEvent } from '@drivewise/sensors';
import { colors, Card, SectionHeader } from '../src/components/ui';

const SCENARIOS: { id: string; label: string }[] = [
  { id: 'safe_city', label: '🟢 Varna vožnja' },
  { id: 'aggressive_driver', label: '🔴 Agresivni voznik' },
  { id: 'harsh_braking', label: '🟡 Močno zaviranje' },
  { id: 'speeding', label: '🔴 Prekoračitev hitrosti' },
  { id: 'full_risk', label: '🚨 Polna tvegana vožnja' },
];

export default function SensorLabScreen() {
  const [running, setRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('safe_city');
  const [latestSample, setLatestSample] = useState<SensorSample | null>(null);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [sampleCount, setSampleCount] = useState(0);
  const providerRef = useRef<GeneratedSimulationSensorProvider | null>(null);
  const detectorRef = useRef(new EventDetector());
  const prevRef = useRef<SensorSample | null>(null);

  const start = async (scenarioId: string) => {
    if (providerRef.current) await providerRef.current.stop();
    detectorRef.current.reset();
    prevRef.current = null;
    setEvents([]);
    setSampleCount(0);

    const provider = new GeneratedSimulationSensorProvider(scenarioId as any);
    providerRef.current = provider;
    setRunning(true);

    provider.subscribe((sample) => {
      const enriched = enrichSample(sample, prevRef.current);
      prevRef.current = enriched;
      setLatestSample(enriched);
      setSampleCount((c) => c + 1);

      const detected = detectorRef.current.detectFromSample(enriched, prevRef.current);
      if (detected.length > 0) {
        setEvents((e) => [...detected, ...e].slice(0, 30));
      }
    });

    await provider.start();
  };

  const stop = async () => {
    if (providerRef.current) { await providerRef.current.stop(); providerRef.current = null; }
    setRunning(false);
  };

  useEffect(() => { return () => { providerRef.current?.stop(); }; }, []);

  const s = latestSample;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <SectionHeader title="🔬 Senzorski laboratorij" sub="Testiranje senzorjev in zaznavanja dogodkov" />

      <View style={styles.scenarioRow}>
        {SCENARIOS.map((sc) => (
          <TouchableOpacity
            key={sc.id}
            style={[styles.scenarioBtn, currentScenario === sc.id && { borderColor: colors.brand }]}
            onPress={() => { setCurrentScenario(sc.id); if (running) start(sc.id); }}
          >
            <Text style={[styles.scenarioBtnText, currentScenario === sc.id && { color: colors.brand }]}>{sc.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: running ? colors.red : colors.brand }]}
          onPress={() => running ? stop() : start(currentScenario)}
        >
          <Text style={styles.actionBtnText}>{running ? '⏹ Ustavi' : '▶ Zaženi'}</Text>
        </TouchableOpacity>
      </View>

      {s && (
        <Card>
          <Text style={styles.cardTitle}>📍 GPS</Text>
          <Text style={styles.dataRow}>Lat: {s.latitude?.toFixed(5) ?? '—'}  Lng: {s.longitude?.toFixed(5) ?? '—'}</Text>
          <Text style={styles.dataRow}>Hitrost: {s.gpsSpeedKmh?.toFixed(1) ?? '—'} km/h  Natančnost: {s.gpsAccuracy?.toFixed(1) ?? '—'} m</Text>

          <Text style={[styles.cardTitle, { marginTop: 12 }]}>📐 Pospeškomer (m/s²)</Text>
          <Text style={styles.dataRow}>
            X: {s.accelX?.toFixed(2) ?? '—'}  Y: {s.accelY?.toFixed(2) ?? '—'}  Z: {s.accelZ?.toFixed(2) ?? '—'}
          </Text>
          <Text style={styles.dataRow}>Long: {s.estimatedLongitudinalAcceleration?.toFixed(2) ?? '—'}  Lat: {s.estimatedLateralAcceleration?.toFixed(2) ?? '—'}</Text>

          <Text style={[styles.cardTitle, { marginTop: 12 }]}>🌀 Žiroskop (rad/s)</Text>
          <Text style={styles.dataRow}>
            X: {s.gyroX?.toFixed(3) ?? '—'}  Y: {s.gyroY?.toFixed(3) ?? '—'}  Z: {s.gyroZ?.toFixed(3) ?? '—'}
          </Text>

          <Text style={styles.counter}>{sampleCount} vzorcev</Text>
        </Card>
      )}

      {!s && !running && (
        <Card><Text style={{ color: colors.textDim, textAlign: 'center' }}>Izberite scenarij in pritisnite ▶ Zaženi</Text></Card>
      )}

      {events.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>⚡ Zaznani dogodki ({events.length})</Text>
          {events.map((e, i) => (
            <View key={i} style={styles.eventRow}>
              <Text style={styles.eventType}>{e.type}</Text>
              <Text style={styles.eventSev}>{e.severity}</Text>
              <Text style={styles.eventVal}>{e.value.toFixed(2)}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scenarioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  scenarioBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  scenarioBtnText: { color: colors.textDim, fontSize: 11 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  cardTitle: { color: colors.text, fontWeight: '600', fontSize: 13, marginBottom: 4 },
  dataRow: { color: colors.textDim, fontSize: 12, fontFamily: 'monospace', marginBottom: 2 },
  counter: { color: colors.brand, fontSize: 11, marginTop: 8, textAlign: 'right' },
  eventRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventType: { color: colors.red, fontSize: 11, flex: 2 },
  eventSev: { color: colors.yellow, fontSize: 11, flex: 1 },
  eventVal: { color: colors.textDim, fontSize: 11, flex: 1, textAlign: 'right' },
});
