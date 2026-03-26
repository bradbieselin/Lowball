import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { RootStackParamList } from './RootNavigator';

export default function TabNavigator() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Both screens stay mounted; hide inactive with display: none */}
      <View style={[styles.screen, activeTab !== 'home' && styles.hidden]}>
        <HomeScreen />
      </View>
      <View style={[styles.screen, activeTab !== 'settings' && styles.hidden]}>
        <ProfileScreen />
      </View>

      {/* Floating pill bar */}
      <View
        style={[styles.floatingContainer, { bottom: Math.max(insets.bottom, 16) }]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.pillBar}
        >
          <View style={[
            styles.pillInner,
            { backgroundColor: isDark ? 'rgba(60,60,67,0.36)' : 'rgba(255,255,255,0.72)' },
          ]}>
            {/* Home tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('home')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === 'home' ? 'home' : 'home-outline'}
                size={22}
                color={activeTab === 'home' ? colors.textPrimary : colors.textMuted}
              />
              <Text style={[
                styles.tabLabel,
                { color: activeTab === 'home' ? colors.textPrimary : colors.textMuted },
              ]}>Home</Text>
            </TouchableOpacity>

            {/* Scan button */}
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Camera');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="scan" size={24} color={isDark ? '#000000' : '#FFFFFF'} />
            </TouchableOpacity>

            {/* Settings tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('settings')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === 'settings' ? 'cog' : 'cog-outline'}
                size={22}
                color={activeTab === 'settings' ? colors.textPrimary : colors.textMuted}
              />
              <Text style={[
                styles.tabLabel,
                { color: activeTab === 'settings' ? colors.textPrimary : colors.textMuted },
              ]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pillBar: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
