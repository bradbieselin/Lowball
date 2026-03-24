import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import ScanCard, { ScanCardData } from '../components/ScanCard';
import { useUserStats } from '../hooks/useUser';
import { useSavedScans } from '../hooks/useScans';
import { usePurchases } from '../hooks/usePurchases';
import { useAuthContext } from '../contexts/AuthContext';
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
  const navigation = useNavigation<ProfileNav>();
  const { signOut } = useAuthContext();
  const { colors, mode, setMode, isDark } = useTheme();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: savedScansRaw, isLoading: savedLoading } = useSavedScans();
  const { isAdFree, loading: purchaseLoading, buyRemoveAds, restore } = usePurchases();
  const [restoring, setRestoring] = useState(false);

  const savedScans: ScanCardData[] = (savedScansRaw ?? []).map((s: any) => ({
    id: s.scan?.id ?? s.scanId,
    imageUrl: s.scan?.imageUrl ?? '',
    productName: s.scan?.productName ?? 'Unknown Product',
    bestPrice: s.scan?.deals?.[0]?.price != null ? parseFloat(s.scan.deals[0].price) : 0,
    originalPrice: s.scan?.estimatedRetailPrice != null ? parseFloat(s.scan.estimatedRetailPrice) : 0,
  }));

  const handleScanCardPress = useCallback((scanId: string) => {
    navigation.navigate('Results', { scanId });
  }, [navigation]);

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch { /* ignore */ }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Please contact support@lowball.app to delete your account.',
      [{ text: 'OK' }]
    );
  };

  const totalSavings = stats?.totalSavings ? parseFloat(stats.totalSavings).toFixed(2) : '0.00';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Savings Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          {statsLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Saved</Text>
              <Text style={[styles.statsBig, { color: colors.accent }]}>${totalSavings}</Text>
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
          <MenuRow label="Update Email" onPress={() => {}} colors={colors} />
          <MenuRow label="Change Password" onPress={() => {}} colors={colors} />
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
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            <Text style={[styles.adFreeText, { color: colors.accent }]}>Ad-free — thank you for your support!</Text>
          </View>
        )}

        {/* About */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>About</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surface }]}>
          <MenuRow label="Rate Lowball" onPress={() => {}} colors={colors} />
          <MenuRow label="Privacy Policy" onPress={() => {}} colors={colors} />
          <MenuRow label="Terms of Service" onPress={() => {}} colors={colors} />
          <MenuRow label="Contact Us" onPress={() => {}} colors={colors} />
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
          <Text style={[styles.dangerText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
          <Text style={[styles.dangerText, { color: colors.danger }]}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '600' },
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
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuRightText: { fontSize: 14 },
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
