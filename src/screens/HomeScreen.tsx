import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import ScanCard, { ScanCardData } from '../components/ScanCard';
import { useRecentScans } from '../hooks/useScans';
import { useUserStats } from '../hooks/useUser';
import { useAds } from '../hooks/useAds';
import type { RootStackParamList } from '../navigation/RootNavigator';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

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

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.statIconWrap}>
        {icon}
      </View>
    </View>
  );
}

interface BigStatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function BigStatCard({ label, value, icon }: BigStatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bigStatCard, { backgroundColor: colors.surface }]}>
      <View style={styles.bigStatContent}>
        <Text style={[styles.bigStatValue, { color: colors.savings }]}>{value}</Text>
        <Text style={[styles.bigStatLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <View style={[styles.bigStatIconWrap, { backgroundColor: colors.surfaceLight }]}>
        {icon}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useRecentScans();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { loadAd: preloadAd } = useAds();

  useEffect(() => {
    preloadAd();
  }, [preloadAd]);

  const fadeIn = useRef(new Animated.Value(0)).current;

  const scans: ScanCardData[] = (data?.pages ?? []).flatMap((page) =>
    (page.scans ?? []).map((s: any) => ({
      id: s.id,
      imageUrl: s.imageUrl ?? '',
      productName: s.productName ?? 'Unknown Product',
      bestPrice: s.deals?.[0]?.price != null ? parseFloat(s.deals[0].price) : 0,
      originalPrice: s.estimatedRetailPrice != null ? parseFloat(s.estimatedRetailPrice) : 0,
      aiConfidence: s.aiConfidence,
    }))
  );

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeIn]);

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

  const totalSavings = stats?.totalSavings ? `$${parseFloat(stats.totalSavings).toFixed(2)}` : '$0.00';
  const totalScans = stats?.totalScans?.toString() ?? '0';
  const dealsFound = stats?.dealsFound?.toString() ?? '0';

  const ListHeader = useMemo(() => (
    <Animated.View style={{ opacity: fadeIn }}>
      {/* Big savings card */}
      {statsLoading ? (
        <View style={[styles.bigStatCard, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', height: 100 }]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <BigStatCard
          label="All Time Potential Savings"
          value={totalSavings}
          icon={<MaterialCommunityIcons name="piggy-bank-outline" size={28} color={colors.savings} />}
        />
      )}

      {/* Small stat cards row */}
      <View style={styles.statRow}>
        {statsLoading ? (
          <>
            <View style={[styles.statCard, { backgroundColor: colors.surface, flex: 1 }]}>
              <ActivityIndicator color={colors.accent} />
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, flex: 1 }]}>
              <ActivityIndicator color={colors.accent} />
            </View>
          </>
        ) : (
          <>
            <StatCard
              label="Total Scans"
              value={totalScans}
              icon={<Ionicons name="camera-outline" size={18} color={colors.textMuted} />}
            />
            <StatCard
              label="Deals Found"
              value={dealsFound}
              icon={<MaterialCommunityIcons name="tag-outline" size={18} color={colors.textMuted} />}
            />
          </>
        )}
      </View>

      {/* Recent scans header */}
      <View style={styles.recentHeaderRow}>
        <Text style={[styles.recentHeader, { color: colors.textPrimary }]}>Recent Scans</Text>
        {scans.length > 0 && (
          <Text style={[styles.recentCount, { color: colors.textMuted }]}>{scans.length}</Text>
        )}
      </View>
    </Animated.View>
  ), [fadeIn, statsLoading, colors, totalSavings, totalScans, dealsFound, scans.length]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.flex}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <Text style={[styles.wordmark, { color: colors.textPrimary }]}>Lowball</Text>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.listPadding}>
              {ListHeader}
              <SkeletonList />
            </View>
          ) : scans.length === 0 ? (
            <View style={styles.listPadding}>
              {ListHeader}
              <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <View style={styles.emptyContent}>
                  <Ionicons name="scan-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No scans yet</Text>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Point your camera at any product to find the best deals
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <FlatList
              data={scans}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListHeaderComponent={ListHeader}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listPadding}
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
      </View>
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
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Content
  content: {
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Big stat card
  bigStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  bigStatContent: {
    flex: 1,
  },
  bigStatValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  bigStatLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  bigStatIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stat cards row
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  statIconWrap: {
    marginTop: 4,
  },

  // Recent scans
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentHeader: {
    fontSize: 20,
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
});
