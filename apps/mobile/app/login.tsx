import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { colors } from '../src/components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('voznik@drivewise.si');
  const [password, setPassword] = useState('driver1234');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Napaka', 'Napačni podatki za prijavo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.logo}>DriveWise</Text>
      <Text style={styles.tagline}>Analiza vožnje · Varna cesta · Nagrade</Text>

      <View style={styles.form}>
        <Text style={styles.label}>E-pošta</Text>
        <TextInput
          style={styles.input} value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textDim}
        />
        <Text style={styles.label}>Geslo</Text>
        <TextInput
          style={styles.input} value={password} onChangeText={setPassword}
          secureTextEntry placeholderTextColor={colors.textDim}
        />
        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleLogin} disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Prijavljam…' : 'Prijava'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.link}>Nimam računa → Registracija</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>Demo: voznik@drivewise.si / driver1234</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { color: colors.brand, fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  tagline: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginBottom: 40 },
  form: { gap: 8 },
  label: { color: colors.textDim, fontSize: 13 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, fontSize: 14, marginBottom: 4,
  },
  btn: { backgroundColor: colors.brand, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  link: { color: colors.brand, textAlign: 'center', marginTop: 16, fontSize: 13 },
  note: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 24 },
});
