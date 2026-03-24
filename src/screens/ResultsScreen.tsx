import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  TextInput,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import DealCard, { DealCardData } from '../components/DealCard';
import { shareDeals } from '../utils/share';
import { useScan, useSaveScan, useUnsaveScan, useIsScanSaved, useRetryScan } from '../hooks/useScans';
import { trackClick } from '../services/api';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ResultsNav = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type ResultsRoute = RouteProp<RootStackParamList, 'Results'>;

const RETRY_MESSAGES = [
  'Searching for deals...',
  'Checking retailers...',
  'Finding best prices...',
];

export default function ResultsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<ResultsNav>();
  const route = useRoute<ResultsRoute>();
  const { scanId } = route.params;
  const { data: scan, isLoading } = useScan(scanId);
  const saveMutation = useSaveScan();
  const unsaveMutation = useUnsaveScan();
  const retryMutation = useRetryScan();
  const alreadySaved = useIsScanSaved(scanId);
  const [isSaved, setIsSaved] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [retryError, setRetryError] = useState('');
  const [retryMessageIndex, setRetryMessageIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const retryMessageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsSaved(alreadySaved);
  }, [alreadySaved]);

  const hapticFiredRef = useRef(false);
  useEffect(() => {
    if (scan && !hapticFiredRef.current) {
      hapticFiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [scan]);

  // Rotating retry messages while mutation is pending
  useEffect(() => {
    if (!retryMutation.isPending) return;
    const interval = setInterval(() => {
      Animated.timing(retryMessageOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setRetryMessageIndex((prev) => (prev + 1) % RETRY_MESSAGES.length);
        Animated.timing(retryMessageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [retryMutation.isPending, retryMessageOpacity]);

  const deals: DealCardData[] = useMemo(() =>
    (scan?.deals ?? [])
      .map((d: any) => ({
        id: d.id,
        retailer: d.retailer,
        retailerLogoUrl: d.retailerLogoUrl,
        productTitle: d.productTitle,
        price: d.price != null ? parseFloat(d.price) : 0,
        originalPrice: d.originalPrice ? parseFloat(d.originalPrice) : undefined,
        condition: d.condition,
        productUrl: d.productUrl ?? '',
        savingsPercent: d.savingsPercent,
      }))
      .sort((a: DealCardData, b: DealCardData) => a.price - b.price),
    [scan?.deals]
  );

  const handleDealPress = useCallback((deal: DealCardData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (deal.productUrl) {
      Linking.openURL(deal.productUrl).catch(() => {});
    }
    trackClick(scanId, deal.id, deal.retailer, deal.price).catch(() => {});
  }, [scanId]);

  const renderDeal = useCallback(({ item }: { item: DealCardData }) => (
    <DealCard deal={item} onPress={handleDealPress} />
  ), [handleDealPress]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved) {
      setIsSaved(false);
      unsaveMutation.mutate(scanId, { onError: () => setIsSaved(true) });
    } else {
      setIsSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveMutation.mutate(scanId, { onError: () => setIsSaved(false) });
    }
  }, [isSaved, scanId, saveMutation, unsaveMutation]);

  const handleShare = useCallback(async () => {
    if (!scan || deals.length === 0) return;
    const retailPrice = scan.estimatedRetailPrice ? parseFloat(scan.estimatedRetailPrice) : undefined;
    await shareDeals(scan.productName, deals[0].price, retailPrice);
  }, [scan, deals]);

  // Edit mode handlers
  const enterEditMode = useCallback(() => {
    setEditName(scan?.productName ?? '');
    setRetryError('');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [scan?.productName]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setRetryError('');
    Keyboard.dismiss();
  }, []);

  const handleRetry = useCallback(() => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (trimmed === scan?.productName) {
      setRetryError('Enter a different product name');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    setRetryError('');
    setRetryMessageIndex(0);
    retryMutation.mutate(
      { scanId, correctedProductName: trimmed },
      {
        onSuccess: () => {
          setIsEditing(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (err) => {
          setRetryError(err instanceof Error ? err.message : 'Failed to search. Try again.');
        },
      }
    );
  }, [editName, scan?.productName, scanId, retryMutation]);

  // Derive confidence level
  const confidenceLevel: 'high' | 'medium' | 'low' | 'user_corrected' = useMemo(() => {
    if (!scan) return 'high';
    const c = scan.aiConfidence;
    if (c === -1) return 'user_corrected';
    if (typeof c === 'number') {
      if (c >= 0.8) return 'high';
      if (c >= 0.5) return 'medium';
      return 'low';
    }
    return 'medium';
  }, [scan]);

  // Banner fade-in
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (confidenceLevel === 'medium' || confidenceLevel === 'low') {
      Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [confidenceLevel, bannerOpacity]);

  const dealsHeaderText = confidenceLevel === 'low' ? 'Similar Items' :
    confidenceLevel === 'medium' ? 'Best Matches' : 'Deals Found';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!scan || deals.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Results</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No deals found</Text>
          <TouchableOpacity style={[styles.scanAgainButton, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('Home')}>
            <Text style={[styles.scanAgainText, { color: colors.accentOnDark }]}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Results</Text>
        <TouchableOpacity onPress={handleShare} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Product Card */}
            <View style={styles.productCard}>
              <Image source={{ uri: scan.imageUrl }} style={[styles.productImage, { backgroundColor: colors.surfaceLight }]} />
              <View style={styles.productInfo}>
                {isEditing ? (
                  <>
                    <TextInput
                      ref={inputRef}
                      style={[styles.editInput, { backgroundColor: colors.surfaceLight, color: colors.textPrimary }]}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Enter product name"
                      placeholderTextColor={colors.textMuted}
                      returnKeyType="search"
                      onSubmitEditing={handleRetry}
                      autoCorrect={false}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.accent }, retryMutation.isPending && styles.retryButtonDisabled]}
                        onPress={handleRetry}
                        disabled={retryMutation.isPending}
                        activeOpacity={0.7}
                      >
                        {retryMutation.isPending ? (
                          <ActivityIndicator color={colors.accentOnDark} size="small" />
                        ) : (
                          <Text style={[styles.retryButtonText, { color: colors.accentOnDark }]}>Search Again</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
                        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                    {retryMutation.isPending && (
                      <Animated.Text style={[styles.retryStatus, { opacity: retryMessageOpacity, color: colors.textSecondary }]}>
                        {RETRY_MESSAGES[retryMessageIndex]}
                      </Animated.Text>
                    )}
                    {retryError ? <Text style={[styles.retryError, { color: colors.danger }]}>{retryError}</Text> : null}
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.nameRow} onPress={enterEditMode} activeOpacity={0.7}>
                      <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>{scan.productName}</Text>
                      <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} style={styles.editIcon} />
                    </TouchableOpacity>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceLight }]}>
                      <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{scan.category}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Confidence banner */}
            {confidenceLevel === 'medium' && !isEditing && (
              <Animated.View style={[styles.bannerMedium, { opacity: bannerOpacity, backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} style={styles.bannerIcon} />
                <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
                  We think this is a {scan.productName}. Not right?{' '}
                  <Text style={[styles.bannerLink, { color: colors.accent }]} onPress={enterEditMode}>Tap the name above</Text>
                  {' '}to correct it.
                </Text>
              </Animated.View>
            )}
            {confidenceLevel === 'low' && !isEditing && (
              <Animated.View style={[styles.bannerLow, { opacity: bannerOpacity, backgroundColor: colors.surfaceLight, borderLeftColor: colors.warning }]}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.warning} style={styles.bannerIcon} />
                <View style={styles.bannerTextWrap}>
                  <Text style={[styles.bannerLowTitle, { color: colors.textPrimary }]}>We couldn't identify this exact product</Text>
                  <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
                    Here are some similar items we found.{' '}
                    <Text style={[styles.bannerLink, { color: colors.accent }]} onPress={enterEditMode}>Tap the product name above</Text>
                    {' '}to search for something specific.
                  </Text>
                </View>
              </Animated.View>
            )}

            <View style={styles.dealsHeader}>
              <Text style={[styles.dealsTitle, { color: colors.textPrimary }]}>{dealsHeaderText}</Text>
              <Text style={[styles.dealsCount, { color: colors.textSecondary }]}>({deals.length})</Text>
            </View>
            <Text style={[styles.priceDisclaimer, { color: colors.textMuted }]}>
              Prices from Google Shopping — tap a deal to buy
            </Text>
          </>
        }
        renderItem={renderDeal}
      />

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.accent : colors.textPrimary}
          />
          <Text style={[styles.saveLabel, { color: colors.textPrimary }, isSaved && { color: colors.accent }]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.accent }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={18} color={colors.accentOnDark} style={{ marginRight: 6 }} />
          <Text style={[styles.shareButtonText, { color: colors.accentOnDark }]}>Share Deals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  productCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  productImage: { width: 80, height: 80, borderRadius: 8 },
  productInfo: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 18, fontWeight: '600', flex: 1 },
  editIcon: { marginLeft: 8 },
  categoryBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  categoryText: { fontSize: 13 },

  // Edit mode
  editInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 14,
  },
  retryStatus: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  retryError: {
    fontSize: 13,
    marginTop: 6,
  },
  // Confidence banners
  bannerMedium: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bannerLow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 16,
  },
  bannerIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerLowTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  bannerLink: {},

  dealsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dealsTitle: { fontSize: 18, fontWeight: '600' },
  dealsCount: { fontSize: 16, marginLeft: 6 },
  priceDisclaimer: { fontSize: 12, marginBottom: 12 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 18, marginTop: 16, marginBottom: 24 },
  scanAgainButton: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  scanAgainText: { fontSize: 16, fontWeight: '700' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 34,
    borderTopWidth: 1,
    zIndex: 10, elevation: 10,
  },
  saveButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4 },
  saveLabel: { fontSize: 15, fontWeight: '600' },
  shareButton: {
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  shareButtonText: { fontSize: 15, fontWeight: '700' },
});
