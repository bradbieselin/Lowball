import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import ScanCard, { ScanCardData } from '../components/ScanCard';
import { useRecentScans } from '../hooks/useScans';
import { useAds } from '../hooks/useAds';
import type { RootStackParamList } from '../navigation/RootNavigator';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const SCAN_BUTTON_SIZE = 88;

const SKELETON_PLACEHOLDER_COUNT = 3;

function SkeletonScanCard() {
  const { colors } = useTheme();
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
    <View style={[skeletonStyles.card, { backgroundColor: colors.surface }]}>
      <Animated.View style={[skeletonStyles.thumbnail, { opacity, backgroundColor: colors.surfaceLight }]} />
      <View style={skeletonStyles.info}>
        <Animated.View style={[skeletonStyles.nameLine, { opacity, backgroundColor: colors.surfaceLight }]} />
        <Animated.View style={[skeletonStyles.priceLine, { opacity, backgroundColor: colors.surfaceLight }]} />
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameLine: {
    width: '65%',
    height: 14,
    borderRadius: 4,
    marginBottom: 10,
  },
  priceLine: {
    width: '40%',
    height: 20,
    borderRadius: 4,
  },
});

function HowItWorksBar() {
  const { colors } = useTheme();
  return (
    <View style={[styles.howItWorks, { backgroundColor: colors.surfaceLight }]}>
      <View style={styles.howStep}>
        <View style={styles.howIcon}>
          <Ionicons name="camera-outline" size={20} color={colors.accent} />
        </View>
        <Text style={[styles.howLabel, { color: colors.textSecondary }]}>Snap</Text>
      </View>
      <View style={[styles.howDivider, { backgroundColor: colors.border }]} />
      <View style={styles.howStep}>
        <View style={styles.howIcon}>
          <Ionicons name="search-outline" size={20} color={colors.accent} />
        </View>
        <Text style={[styles.howLabel, { color: colors.textSecondary }]}>Search</Text>
      </View>
      <View style={[styles.howDivider, { backgroundColor: colors.border }]} />
      <View style={styles.howStep}>
        <View style={styles.howIcon}>
          <MaterialCommunityIcons name="tag-outline" size={20} color={colors.accent} />
        </View>
        <Text style={[styles.howLabel, { color: colors.textSecondary }]}>Save</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<HomeNav>();
  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useRecentScans();
  const { loadAd: preloadAd } = useAds();

  // Preload an ad so it's ready when the user finishes scanning
  useEffect(() => {
    preloadAd();
  }, [preloadAd]);

  // Animations
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
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeIn]);

  const scanPressedRef = useRef(false);
  const buttonTap = useRef(new Animated.Value(1)).current;

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <View>
            <Text style={[styles.wordmark, { color: colors.textPrimary }]}>Lowball</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>Snap. Search. Save.</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.profileInner, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="person" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* How it works */}
        <Animated.View style={{ opacity: fadeIn }}>
          <HowItWorksBar />
        </Animated.View>

        {/* Recent Scans — main body */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={[styles.recentHeader, { color: colors.textPrimary }]}>Recent Scans</Text>
            {scans.length > 0 && (
              <Text style={[styles.recentCount, { color: colors.textMuted }]}>{scans.length}</Text>
            )}
          </View>

          {isLoading ? (
            <SkeletonList />
          ) : scans.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <View style={styles.emptyContent}>
                <Ionicons name="scan-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No scans yet</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Point your camera at any product to find the best deals
                </Text>
              </View>
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
                  tintColor={colors.accent}
                />
              }
            />
          )}
        </View>

        {/* Bottom scan button area */}
        <View style={styles.scanSection}>
          <Animated.View style={{ transform: [{ scale: buttonTap }] }}>
            <TouchableOpacity
              style={[styles.scanButton, { shadowColor: colors.accent }]}
              onPress={handleScanPress}
              activeOpacity={1}
            >
              <View style={[styles.scanButtonFill, { backgroundColor: colors.accent }]}>
                <Ionicons name="scan" size={36} color={colors.accentOnDark} />
              </View>
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
  },
  flex: { flex: 1 },

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
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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
    borderRadius: 16,
  },
  howStep: {
    alignItems: 'center',
    flex: 1,
  },
  howIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(48,209,88,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  howLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  howDivider: {
    width: 24,
    height: 1,
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
    fontSize: 18,
    fontWeight: '600',
  },
  recentCount: {
    fontSize: 14,
    marginLeft: 8,
  },

  // Empty state
  emptyState: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
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
    paddingVertical: 20,
    marginBottom: 16,
  },
  scanButton: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  scanButtonFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
