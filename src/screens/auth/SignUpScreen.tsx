import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type SignUpNav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<SignUpNav>();
  const { signUp, signInWithApple } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignUp = async () => {
    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setPasswordError('');
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await signUp(email, password);
      // Always show the same generic message to prevent email enumeration
      setSuccessMessage('Check your email for a confirmation link.');
    } catch (err: any) {
      // Map known Supabase error messages to generic ones to prevent email enumeration
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setSuccessMessage('Check your email for a confirmation link.');
      } else {
        setError(msg || 'Sign up failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError && text.length >= 8) {
      setPasswordError('');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Start saving money today</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary }]}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary }, passwordError ? [styles.inputError, { borderColor: colors.danger }] : null]}
          placeholder="Password (min 8 characters)"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
        />
        {passwordError ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>{passwordError}</Text>
        ) : null}

        {error ? <Text style={[styles.authError, { color: colors.danger }]}>{error}</Text> : null}
        {successMessage ? <Text style={[styles.successText, { color: colors.accent }]}>{successMessage}</Text> : null}

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.accent }]} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.accentOnDark} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.accentOnDark }]}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity style={[styles.socialButton, { borderColor: colors.textPrimary }]} onPress={() => Alert.alert('Coming Soon', 'Social login will be available in a future update.')}>
          <Text style={[styles.socialButtonText, { color: colors.textPrimary }]}>Continue with Google</Text>
        </TouchableOpacity>

        {appleAvailable && (
          <TouchableOpacity
            style={styles.appleButton}
            onPress={async () => {
              setAppleLoading(true);
              setError('');
              try {
                await signInWithApple();
              } catch (err: any) {
                setError(err.message || 'Apple Sign-In failed');
              } finally {
                setAppleLoading(false);
              }
            }}
            disabled={appleLoading}
          >
            {appleLoading ? (
              <ActivityIndicator color={colors.accentOnDark} />
            ) : (
              <Text style={[styles.appleButtonText, { color: colors.accentOnDark }]}> Continue with Apple</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={[styles.linkText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[styles.linkAccent, { color: colors.accent }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderWidth: 1,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 16,
    marginLeft: 4,
  },
  authError: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
  },
  linkAccent: {
    fontWeight: '600',
  },
});
