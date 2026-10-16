import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { AppText } from '@/components/ui/text';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { Redirect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Sign-in screen. Issues a Sanctum personal access token for this device. */
export default function LoginScreen() {
  const { token, isBootstrapping, isSigningIn, error, signIn, clearError } = useAuth();
  const colors = useColors();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isBootstrapping && token) {
    return <Redirect href="/" />;
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSigningIn;

  return (
    <AuroraBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex}>
          <View style={styles.content}>
            <View style={styles.brand}>
              <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                <SymbolView name="fuelpump.fill" size={26} tintColor="#FFFFFF" />
              </View>
              <AppText variant="title">Ride Efficiency</AppText>
              <AppText variant="caption" tone="muted" style={styles.tagline}>
                Your real profit per shift — fuel, depreciation and kilometres in one place.
              </AppText>
            </View>

            <GlassSurface style={styles.card}>
              <View style={styles.field}>
                <AppText variant="caption" tone="muted">
                  {t('login.email')}
                </AppText>
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearError();
                  }}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor={colors.inkFaint}
                  style={[
                    styles.input,
                    { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                />
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="muted">
                  {t('login.password')}
                </AppText>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError();
                  }}
                  secureTextEntry
                  autoComplete="password"
                  placeholder="••••••••"
                  placeholderTextColor={colors.inkFaint}
                  style={[
                    styles.input,
                    { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                />
              </View>

              {error ? (
                <AppText variant="caption" tone="loss">
                  {error}
                </AppText>
              ) : null}

              <Button
                label={isSigningIn ? t('login.signingIn') : t('login.signIn')}
                icon="arrow.right"
                loading={isSigningIn}
                disabled={!canSubmit}
                onPress={() => void signIn(email, password)}
              />
            </GlassSurface>

            <AppText variant="caption" tone="faint" style={styles.endpoint}>
              Connected to {API_BASE_URL}
            </AppText>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  brand: { alignItems: 'center', gap: Spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  tagline: { textAlign: 'center', maxWidth: 280 },
  card: { padding: Spacing.lg, gap: Spacing.lg },
  field: { gap: Spacing.xs },
  input: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  endpoint: { textAlign: 'center' },
});
