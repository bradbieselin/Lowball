import React from 'react';
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
import { Colors } from '../constants/colors';
import ScanCard, { ScanCardData } from '../components/ScanCard';
import { useUserStats } from '../hooks/useUser';
import { useAuthContext } from '../contexts/AuthContext';

interface MenuRowProps {
  label: string;
  rightText?: string;
  rightTextColor?: string;
  onPress: () => void;
}

function MenuRow({ label, rightText, rightTextColor, onPress }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {rightText && (
          <Text style={[styles.menuRightText, rightTextColor ? { color: rightTextColor } : undefined]}>
            {rightText}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuthContext();
  const { data: stats, isLoading } = useUserStats();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch { /* ignore */ }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { /* TODO */ } },
      ]
    );
  };

  const totalSavings = stats?.totalSavings ? parseFloat(stats.totalSavings).toFixed(2) : '0.00';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Savings Stats Card */}
        <View style={styles.statsCard}>
          {isLoading ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <>
              <Text style={styles.statsLabel}>Total Saved</Text>
              <Text style={styles.statsBig}>${totalSavings}</Text>
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Scans</Text>
                  <Text style={styles.statNumber}>{stats?.totalScans ?? 0}</Text>
                </View>
                <View>
                  <Text style={styles.statsLabel}>Deals Found</Text>
                  <Text style={styles.statNumber}>{stats?.dealsFound ?? 0}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Saved Deals */}
        <Text style={styles.sectionHeader}>Saved Deals</Text>
        <Text style={styles.emptyText}>No saved deals yet. Start scanning!</Text>

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.menuGroup}>
          <MenuRow label="Update Email" onPress={() => {}} />
          <MenuRow label="Change Password" onPress={() => {}} />
          <MenuRow label="Remove Ads" rightText="$2.99" rightTextColor={Colors.accent} onPress={() => {}} />
          <MenuRow label="Restore Purchases" onPress={() => {}} />
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.menuGroup}>
          <MenuRow label="Rate Lowball" onPress={() => {}} />
          <MenuRow label="Privacy Policy" onPress={() => {}} />
          <MenuRow label="Terms of Service" onPress={() => {}} />
          <MenuRow label="Contact Us" onPress={() => {}} />
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
          <Text style={styles.dangerText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
          <Text style={styles.dangerText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '600' },
  scroll: { paddingHorizontal: 16 },
  statsCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 24 },
  statsLabel: { color: Colors.textSecondary, fontSize: 13 },
  statsBig: { color: Colors.accent, fontSize: 28, fontWeight: '700', marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 32 },
  statNumber: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600', marginTop: 4 },
  sectionHeader: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginVertical: 16 },
  menuGroup: { backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuLabel: { color: Colors.textPrimary, fontSize: 16 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuRightText: { color: Colors.textSecondary, fontSize: 14 },
  dangerButton: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  dangerText: { color: Colors.danger, fontSize: 16, fontWeight: '600' },
});
