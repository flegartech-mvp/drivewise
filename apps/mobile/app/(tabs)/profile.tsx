import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { useTripStore } from '../../src/store/trip.store';
import { SensorMode } from '@drivewise/shared';
import { colors, Card, SectionHeader, Button } from '../../src/components/ui';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const sensorMode = useTripStore((s) => s.sensorMode);
  const setSensorMode = useTripStore((s) => s.setSensorMode);

  const handleLogout = async () => {
    Alert.alert('Odjava', 'Ali se res želite odjaviti?', [
      { text: 'Prekliči', style: 'cancel' },
      { text: 'Odjavi', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const handleExport = () => {
    Alert.alert('Izvoz podatkov', 'Demo: V produkciji bi tukaj sprožili GDPR izvoz vaših podatkov v JSON obliki.');
  };

  const handleDelete = () => {
    Alert.alert('Izbriši račun', 'Demo: V produkciji bi tukaj trajno izbrisali vaš račun in vse podatke.', [
      { text: 'Prekliči', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <SectionHeader title="Profil" />

      <Card>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </Card>

      <Text style={styles.sectionLabel}>Način senzorjev</Text>
      {[
        { mode: SensorMode.GENERATED_SIMULATION, label: '🎮 Simulirani senzorji (demo)', sub: 'Brez prave naprave' },
        { mode: SensorMode.REAL_DEVICE, label: '📡 Prava naprava', sub: 'GPS + pospeškomer + žiroskop' },
      ].map(({ mode, label, sub }) => (
        <TouchableOpacity key={mode} onPress={() => setSensorMode(mode)}>
          <Card style={[styles.modeCard, sensorMode === mode && { borderColor: colors.brand }]}>
            <Text style={[styles.modeLabel, sensorMode === mode && { color: colors.brand }]}>{label}</Text>
            <Text style={styles.modeSub}>{sub}</Text>
          </Card>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => router.push('/achievements')}>
        <Card>
          <Text style={styles.linkText}>🏆 Moji dosežki</Text>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/sensor-lab')}>
        <Card>
          <Text style={styles.linkText}>🔬 Odpri senzorski laboratorij</Text>
        </Card>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Zasebnost (GDPR)</Text>
      <Button label="📤 Izvozi moje podatke" onPress={handleExport} variant="secondary" />
      <View style={{ height: 8 }} />
      <Button label="🗑  Izbriši moj račun" onPress={handleDelete} variant="danger" />

      <View style={{ height: 16 }} />
      <Button label="Odjava" onPress={handleLogout} variant="secondary" />

      <Text style={styles.gdprNote}>
        DriveWise zbira GPS lokacijo in senzorske podatke izključno med aktivno vožnjo. Podatki se ne delijo s tretjimi osebami. Ocene vožnje so ocenjevalne in niso primerne za zavarovalniške ali pravne namene.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  email: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  role: { color: colors.brand, fontSize: 11, marginTop: 4 },
  sectionLabel: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  modeCard: { borderWidth: 2, borderColor: colors.border },
  modeLabel: { color: colors.text, fontWeight: '600', fontSize: 14 },
  modeSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  linkText: { color: colors.brand, fontWeight: '600' },
  gdprNote: { color: colors.textDim, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 24, marginBottom: 32 },
});
