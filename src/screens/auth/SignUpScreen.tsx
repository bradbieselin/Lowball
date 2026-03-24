import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { useAuthContext } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type SignUpNav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpNav>();
  const { signUp } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start saving money today</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={[styles.input, passwordError ? styles.inputError : null]}
          placeholder="Password (min 8 characters)"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
        />
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        {error ? <Text style={styles.authError}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Coming Soon', 'Social login will be available in a future update.')}>
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Coming Soon', 'Social login will be available in a future update.')}>
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkAccent}>Sign In</Text>
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
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 32,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.danger,
    marginBottom: 4,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 16,
    marginLeft: 4,
  },
  authError: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    color: Colors.accent,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000000',
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
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: Colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  linkAccent: {
    color: Colors.accent,
    fontWeight: '600',
  },
});
