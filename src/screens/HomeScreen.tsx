import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import ScanCard, { ScanCardData } from '../components/ScanCard';
import { useRecentScans } from '../hooks/useScans';
import { useAds } from '../hooks/useAds';
import type { RootStackParamList } from '../navigation/RootNavigator';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const SCAN_BUTTON_SIZE = 88;
const RING_SIZE = SCAN_BUTTON_SIZE + 24;
const OUTER_GLOW_SIZE = RING_SIZE + 60;

const SKELETON_PLACEHOLDER_COUNT = 3;

function SkeletonScanCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={skeletonStyles.card}>
      <Animated.View style={[skeletonStyles.thumbnail, { opacity }]} />
      <View style={skeletonStyles.info}>
        <Animated.View style={[skeletonStyles.nameLine, { opacity }]} />
        <Animated.View style={[skeletonStyles.priceLine, { opacity }]} />
      </View>
    </View>
  );
}

function SkeletonList() {
  return (
    <View>
      {Array.from({ length: SKELETON_PLACEHOLDER_COUNT }).map((_, i) => (
        <SkeletonScanCard key={i} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameLine: {
    width: '65%',
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
    marginBottom: 10,
  },
  priceLine: {
    width: '40%',
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
  },
});

function HowItWorksBar() {
  return (
    <View style={styles.howItWorks}>
      <View style={styles.howStep}>
        <View style={styles.howIcon}>
          <Ionicons name="camera-outline" size={20} color={Colors.accent} />
        </View>
        <Text style={styles.howLabel}>Snap</Text>
      </View>
      <View style={styles.howDivider} />
      <View style={styles.howStep}>
        <View style={styles.howIcon}>
          <Ionicons name="search-outline" size={20} color={Colors.accent} />
        </View>
        <Text style={styles.howLabel}>Search</Text>
      </View>
      <View style={styles.howDivider} />
      <View style={styles.howStep}>
        <View style={styles.howIcon}>
          <MaterialCommunityIcons name="tag-outline" size={20} color={Colors.accent} />
        </View>
        <Text style={styles.howLabel}>Save</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useRecentScans();
  const { loadAd: preloadAd } = useAds();

  // Preload an ad so it's ready when the user finishes scanning
  useEffect(() => {
    preloadAd();
  }, [preloadAd]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const scans: ScanCardData[] = (data?.pages ?? []).flatMap((page) =>
    (page.scans ?? []).map((s: any) => ({
      id: s.id,
      imageUrl: s.imageUrl ?? '',
      productName: s.productName ?? 'Unknown Product',
      bestPrice: s.deals?.[0]?.price != null ? parseFloat(s.deals[0].price) : 0,
      originalPrice: s.estimatedRetailPrice != null ? parseFloat(s.estimatedRetailPrice) : 0,
    }))
  );

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    const ringLoop = Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 8000, useNativeDriver: true })
    );
    ringLoop.start();

    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    return () => {
      pulseLoop.stop();
      ringLoop.stop();
    };
  }, [pulseAnim, ringRotate, fadeIn]);

  const ringSpin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scanPressedRef = useRef(false);
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const buttonTap = useRef(new Animated.Value(1)).current;
  const buttonScale = useMemo(() => Animated.multiply(buttonPulse, buttonTap), [buttonPulse, buttonTap]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(buttonPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [buttonPulse]);

  const handleScanPress = () => {
    if (scanPressedRef.current) return;
    scanPressedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(buttonTap, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonTap, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('Camera');
      setTimeout(() => { scanPressedRef.current = false; }, 1000);
    });
  };

  const handleScanCardPress = useCallback((scanId: string) => {
    navigation.navigate('Results', { scanId });
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: ScanCardData }) => (
    <ScanCard scan={item} onPress={handleScanCardPress} />
  ), [handleScanCardPress]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={styles.container}>
      {/* Background gradient glow from bottom where button is */}
      <LinearGradient
        colors={['transparent', 'rgba(0,230,118,0.03)', 'rgba(0,230,118,0.08)']}
        style={styles.bgGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <View>
            <Text style={styles.wordmark}>Lowball</Text>
            <Text style={styles.tagline}>Snap. Search. Save.</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <BlurView intensity={40} tint="dark" style={styles.profileBlur}>
              <Ionicons name="person" size={18} color={Colors.textSecondary} />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* How it works */}
        <Animated.View style={{ opacity: fadeIn }}>
          <HowItWorksBar />
        </Animated.View>

        {/* Recent Scans — now the main body */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentHeader}>Recent Scans</Text>
            {scans.length > 0 && (
              <Text style={styles.recentCount}>{scans.length}</Text>
            )}
          </View>

          {isLoading ? (
            <SkeletonList />
          ) : scans.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['rgba(0,230,118,0.06)', 'transparent']}
                style={styles.emptyGradient}
              >
                <Ionicons name="scan-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No scans yet</Text>
                <Text style={styles.emptyText}>
                  Point your camera at any product to find the best deals
                </Text>
              </LinearGradient>
            </View>
          ) : (
            <FlatList
              data={scans}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={handleRefresh}
                  tintColor={Colors.accent}
                />
              }
            />
          )}
        </View>

        {/* Bottom scan button area */}
        <View style={styles.scanSection}>
          {/* Outer glow — centered on button */}
          <Animated.View style={[styles.outerGlow, { opacity: pulseAnim }]}>
            <LinearGradient
              colors={['rgba(0,230,118,0.15)', 'rgba(0,230,118,0.0)']}
              style={styles.outerGlowGradient}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0.5, y: 0 }}
            />
          </Animated.View>

          {/* Rotating dashed ring — centered on button */}
          <Animated.View style={[styles.ring, { transform: [{ rotate: ringSpin }] }]}>
            {[...Array(24)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.ringDot,
                  {
                    transform: [
                      { rotate: `${i * 15}deg` },
                      { translateY: -(RING_SIZE / 2) },
                    ],
                    opacity: i % 3 === 0 ? 0.9 : 0.3,
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Main scan button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanPress}
              activeOpacity={1}
            >
              <LinearGradient
                colors={[Colors.accent, Colors.accentDim]}
                style={styles.scanButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="scan" size={36} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  bgGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  wordmark: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // How it works
  howItWorks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  howStep: {
    alignItems: 'center',
    flex: 1,
  },
  howIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,230,118,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  howLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  howDivider: {
    width: 24,
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 16,
  },

  // Recent scans — main body
  recentSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentHeader: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  recentCount: {
    color: Colors.textMuted,
    fontSize: 14,
    marginLeft: 8,
  },

  // Empty state
  emptyState: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 24,
  },

  // Bottom scan button area
  scanSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: OUTER_GLOW_SIZE,
    marginBottom: 16,
  },
  outerGlow: {
    position: 'absolute',
    width: OUTER_GLOW_SIZE,
    height: OUTER_GLOW_SIZE,
    borderRadius: OUTER_GLOW_SIZE / 2,
    overflow: 'hidden',
  },
  outerGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: OUTER_GLOW_SIZE / 2,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.accent,
  },
  scanButton: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  scanButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
});
