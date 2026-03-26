import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import ScanCard, { ScanCardData } from '../components/ScanCard';
import { useUserStats } from '../hooks/useUser';
import { useSavedScans } from '../hooks/useScans';
import { usePurchases } from '../hooks/usePurchases';
import { useAuthContext } from '../contexts/AuthContext';
import { updateEmail, deleteAccount } from '../services/api';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ProfileNav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface MenuRowProps {
  label: string;
  rightText?: string;
  rightTextColor?: string;
  rightElement?: React.ReactNode;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function MenuRow({ label, rightText, rightTextColor, rightElement, onPress, colors }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.menuRight}>
        {rightElement}
        {rightText && (
          <Text style={[styles.menuRightText, { color: colors.textSecondary }, rightTextColor ? { color: rightTextColor } : undefined]}>
            {rightText}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNav>();
  const { user, signOut } = useAuthContext();
  const { colors, mode, setMode, isDark } = useTheme();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: savedScansRaw, isLoading: savedLoading } = useSavedScans();
  const { isAdFree, loading: purchaseLoading, buyRemoveAds, restore } = usePurchases();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const savedScans: ScanCardData[] = (savedScansRaw ?? []).map((s: any) => ({
    id: s.scan?.id ?? s.scanId,
    imageUrl: s.scan?.imageUrl ?? '',
    productName: s.scan?.productName ?? 'Unknown Product',
    bestPrice: s.scan?.deals?.[0]?.price != null ? parseFloat(s.scan.deals[0].price) : 0,
    originalPrice: s.scan?.estimatedRetailPrice != null ? parseFloat(s.scan.estimatedRetailPrice) : 0,
    aiConfidence: s.scan?.aiConfidence,
  }));

  const handleScanCardPress = useCallback((scanId: string) => {
    navigation.navigate('Results', { scanId });
  }, [navigation]);

  // === Update Email ===
  const handleUpdateEmail = useCallback(() => {
    Alert.prompt(
      'Update Email',
      'Enter your new email address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newEmail) => {
            if (!newEmail || !newEmail.trim()) return;
            const trimmed = newEmail.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmed)) {
              Alert.alert('Invalid Email', 'Please enter a valid email address.');
              return;
            }
            try {
              await updateEmail(trimmed);
              Alert.alert('Email Updated', `Your email has been changed to ${trimmed}.`);
            } catch (err: any) {
              Alert.alert('Update Failed', err.message || 'Could not update email. Please try again.');
            }
          },
        },
      ],
      'plain-text',
      user?.email ?? '',
    );
  }, [user?.email]);

  // === Change Password ===
  const handleChangePassword = useCallback(() => {
    const email = user?.email;
    if (!email) {
      Alert.alert('No Email', 'No email associated with this account. Cannot send password reset.');
      return;
    }
    Alert.alert(
      'Change Password',
      `We'll send a password reset link to ${email}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) throw error;
              Alert.alert('Link Sent', 'Check your email for the password reset link.');
            } catch (err: any) {
              Alert.alert('Failed', err.message || 'Could not send reset link. Please try again.');
            }
          },
        },
      ],
    );
  }, [user?.email]);

  // === Remove Ads ===
  const handleRemoveAds = useCallback(async () => {
    try {
      const success = await buyRemoveAds();
      if (success) {
        Alert.alert('Ads Removed!', 'You now have an ad-free experience. Thank you for your support!');
      }
    } catch (err: any) {
      Alert.alert('Purchase Failed', err.message || 'Something went wrong. Please try again.');
    }
  }, [buyRemoveAds]);

  // === Restore Purchases ===
  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const found = await restore();
      if (found) {
        Alert.alert('Purchases Restored!', 'Your ad-free access has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
  }, [restore]);

  // === Rate Lowball ===
  const handleRate = useCallback(() => {
    // This will work once the app is on the App Store.
    // For now it opens the App Store to the app's page.
    const appStoreUrl = 'https://apps.apple.com/app/id[APP_ID]'; // Replace with real ID when published
    Linking.openURL('itms-apps://itunes.apple.com/app/id[APP_ID]?action=write-review').catch(() => {
      Alert.alert('Not Available', 'Rating is available once the app is published to the App Store.');
    });
  }, []);

  // === Sign Out ===
  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch { /* ignore */ }
          },
        },
      ],
    );
  }, [signOut]);

  // === Delete Account ===
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Double confirmation
            Alert.alert(
              'Are you absolutely sure?',
              'All your scans, saved deals, and account data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await deleteAccount();
                      await signOut();
                    } catch (err: any) {
                      Alert.alert('Failed', err.message || 'Could not delete account. Please try again.');
                      setDeleting(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [signOut]);

  // === Contact Us ===
  const handleContact = useCallback(() => {
    Linking.openURL('mailto:support@lowball.app').catch(() => {
      Alert.alert('Email', 'Send us an email at support@lowball.app');
    });
  }, []);

  // === Privacy Policy / Terms ===
  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://lowball.app/privacy').catch(() => {});
  }, []);

  const handleTerms = useCallback(() => {
    Linking.openURL('https://lowball.app/terms').catch(() => {});
  }, []);

  const totalSavings = stats?.totalSavings ? parseFloat(stats.totalSavings).toFixed(2) : '0.00';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Savings Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          {statsLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Saved</Text>
              <Text style={[styles.statsBig, { color: colors.savings }]}>${totalSavings}</Text>
              <View style={styles.statsRow}>
                <View>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Scans</Text>
                  <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats?.totalScans ?? 0}</Text>
                </View>
                <View>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Deals Found</Text>
                  <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats?.dealsFound ?? 0}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Saved Deals */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>
          Saved Deals{savedScans.length > 0 ? ` (${savedScans.length})` : ''}
        </Text>
        {savedLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
        ) : savedScans.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No saved deals yet. Start scanning!</Text>
        ) : (
          savedScans.map((scan) => (
            <ScanCard key={scan.id} scan={scan} onPress={handleScanCardPress} />
          ))
        )}

        {/* Appearance */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Appearance</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
          <View style={[styles.themeRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Theme</Text>
            <View style={[styles.themeSwitcher, { backgroundColor: colors.surfaceLight }]}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  isDark && { backgroundColor: colors.accent },
                ]}
                onPress={() => setMode('dark')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="moon"
                  size={14}
                  color={isDark ? colors.accentOnDark : colors.textSecondary}
                />
                <Text style={[
                  styles.themeOptionText,
                  { color: isDark ? colors.accentOnDark : colors.textSecondary },
                ]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  !isDark && { backgroundColor: colors.accent },
                ]}
                onPress={() => setMode('light')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="sunny"
                  size={14}
                  color={!isDark ? colors.accentOnDark : colors.textSecondary}
                />
                <Text style={[
                  styles.themeOptionText,
                  { color: !isDark ? colors.accentOnDark : colors.textSecondary },
                ]}>Light</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Account</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
          <MenuRow
            label="Update Email"
            rightText={user?.email ?? ''}
            onPress={handleUpdateEmail}
            colors={colors}
          />
          <MenuRow label="Change Password" onPress={handleChangePassword} colors={colors} />
          {!isAdFree && (
            <MenuRow
              label="Remove Ads"
              rightElement={purchaseLoading ? <ActivityIndicator color={colors.accent} size="small" style={{ marginRight: 8 }} /> : undefined}
              rightText={purchaseLoading ? undefined : '$2.99'}
              rightTextColor={colors.accent}
              onPress={handleRemoveAds}
              colors={colors}
            />
          )}
          <MenuRow
            label="Restore Purchases"
            rightElement={restoring ? <ActivityIndicator color={colors.textSecondary} size="small" style={{ marginRight: 8 }} /> : undefined}
            onPress={handleRestore}
            colors={colors}
          />
        </View>

        {isAdFree && (
          <View style={styles.adFreeBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.savings} />
            <Text style={[styles.adFreeText, { color: colors.savings }]}>Ad-free — thank you for your support!</Text>
          </View>
        )}

        {/* About */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>About</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
          <MenuRow label="Rate Lowball" onPress={handleRate} colors={colors} />
          <MenuRow label="Privacy Policy" onPress={handlePrivacyPolicy} colors={colors} />
          <MenuRow label="Terms of Service" onPress={handleTerms} colors={colors} />
          <MenuRow label="Contact Us" onPress={handleContact} colors={colors} />
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
          <Text style={[styles.dangerText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={[styles.dangerText, { color: colors.danger }]}>Delete Account</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 16 },
  statsCard: { borderRadius: 16, padding: 20, marginBottom: 24 },
  statsLabel: { fontSize: 13 },
  statsBig: { fontSize: 28, fontWeight: '700', marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 32 },
  statNumber: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  sectionHeader: { fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', marginVertical: 16 },
  menuGroup: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  menuLabel: { fontSize: 16 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  menuRightText: { fontSize: 14, maxWidth: 180 },
  adFreeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8,
  },
  adFreeText: { fontSize: 13, fontWeight: '500' },
  dangerButton: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  dangerText: { fontSize: 16, fontWeight: '600' },
  themeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  themeSwitcher: {
    flexDirection: 'row', borderRadius: 8, padding: 2,
  },
  themeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  themeOptionText: { fontSize: 13, fontWeight: '600' },
});
