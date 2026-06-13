import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { colors } from '../src/components/ui';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert('Napaka', 'Izpolnite vsa polja.'); return; }
    if (password.length < 8) { Alert.alert('Napaka', 'Geslo mora imeti vsaj 8 znakov.'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Napaka', e?.response?.data?.message ?? 'Registracija ni uspela.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.logo}>DriveWise</Text>
      <Text style={styles.tagline}>Ustvarite račun</Text>

      <View style={styles.form}>
        {[
          { label: 'Ime in priimek', value: name, set: setName, type: 'default' as const },
          { label: 'E-pošta', value: email, set: setEmail, type: 'email-address' as const },
          { label: 'Geslo (min. 8 znakov)', value: password, set: setPassword, type: 'default' as const, secure: true },
        ].map(({ label, value, set, type, secure }) => (
          <View key={label}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input} value={value} onChangeText={set}
              keyboardType={type} autoCapitalize="none"
              secureTextEntry={!!secure} placeholderTextColor={colors.textDim}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleRegister} disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Registriram…' : 'Ustvari račun'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Že imam račun → Prijava</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.gdpr}>
        Z registracijo se strinjate z zbiranjem GPS in senzorskih podatkov izključno za namen analize vožnje. Podatki se ne delijo s tretjimi osebami.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { color: colors.brand, fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  tagline: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginBottom: 32 },
  form: { gap: 8 },
  label: { color: colors.textDim, fontSize: 13 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.text, fontSize: 14, marginBottom: 4,
  },
  btn: { backgroundColor: colors.brand, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  link: { color: colors.brand, textAlign: 'center', marginTop: 12, fontSize: 13 },
  gdpr: { color: colors.textDim, fontSize: 10, textAlign: 'center', marginTop: 20, lineHeight: 14 },
});
