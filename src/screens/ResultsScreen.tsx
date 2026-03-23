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
import { Colors } from '../constants/colors';
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

  useEffect(() => {
    if (scan) {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!scan || deals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Results</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No deals found</Text>
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <TouchableOpacity onPress={handleShare} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
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
              <Image source={{ uri: scan.imageUrl }} style={styles.productImage} />
              <View style={styles.productInfo}>
                {isEditing ? (
                  <>
                    <TextInput
                      ref={inputRef}
                      style={styles.editInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Enter product name"
                      placeholderTextColor={Colors.textMuted}
                      returnKeyType="search"
                      onSubmitEditing={handleRetry}
                      autoCorrect={false}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.retryButton, retryMutation.isPending && styles.retryButtonDisabled]}
                        onPress={handleRetry}
                        disabled={retryMutation.isPending}
                        activeOpacity={0.7}
                      >
                        {retryMutation.isPending ? (
                          <ActivityIndicator color="#000" size="small" />
                        ) : (
                          <Text style={styles.retryButtonText}>Search Again</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                    {retryMutation.isPending && (
                      <Animated.Text style={[styles.retryStatus, { opacity: retryMessageOpacity }]}>
                        {RETRY_MESSAGES[retryMessageIndex]}
                      </Animated.Text>
                    )}
                    {retryError ? <Text style={styles.retryError}>{retryError}</Text> : null}
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.nameRow} onPress={enterEditMode} activeOpacity={0.7}>
                      <Text style={styles.productName} numberOfLines={2}>{scan.productName}</Text>
                      <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} style={styles.editIcon} />
                    </TouchableOpacity>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{scan.category}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Confidence banner */}
            {confidenceLevel === 'medium' && !isEditing && (
              <Animated.View style={[styles.bannerMedium, { opacity: bannerOpacity }]}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} style={styles.bannerIcon} />
                <Text style={styles.bannerText}>
                  We think this is a {scan.productName}. Not right?{' '}
                  <Text style={styles.bannerLink} onPress={enterEditMode}>Tap the name above</Text>
                  {' '}to correct it.
                </Text>
              </Animated.View>
            )}
            {confidenceLevel === 'low' && !isEditing && (
              <Animated.View style={[styles.bannerLow, { opacity: bannerOpacity }]}>
                <Ionicons name="alert-circle-outline" size={20} color="#FF9800" style={styles.bannerIcon} />
                <View style={styles.bannerTextWrap}>
                  <Text style={styles.bannerLowTitle}>We couldn't identify this exact product</Text>
                  <Text style={styles.bannerText}>
                    Here are some similar items we found.{' '}
                    <Text style={styles.bannerLink} onPress={enterEditMode}>Tap the product name above</Text>
                    {' '}to search for something specific.
                  </Text>
                </View>
              </Animated.View>
            )}

            <View style={styles.dealsHeader}>
              <Text style={styles.dealsTitle}>{dealsHeaderText}</Text>
              <Text style={styles.dealsCount}>({deals.length})</Text>
            </View>
            <Text style={styles.priceDisclaimer}>
              Prices from Google Shopping — tap a deal to buy
            </Text>
          </>
        }
        renderItem={({ item }) => <DealCard deal={item} onPress={handleDealPress} />}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? Colors.accent : Colors.textPrimary}
          />
          <Text style={[styles.saveLabel, isSaved && { color: Colors.accent }]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={18} color="#000" style={{ marginRight: 6 }} />
          <Text style={styles.shareButtonText}>Share Deals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  productCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: Colors.surfaceLight },
  productInfo: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600', flex: 1 },
  editIcon: { marginLeft: 8 },
  categoryBadge: { backgroundColor: Colors.surfaceLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  categoryText: { color: Colors.textSecondary, fontSize: 13 },

  // Edit mode
  editInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  retryStatus: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  retryError: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: 6,
  },
  // Confidence banners
  bannerMedium: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bannerLow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
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
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  bannerLink: {
    color: Colors.accent,
  },

  dealsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dealsTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  dealsCount: { color: Colors.textSecondary, fontSize: 16, marginLeft: 6 },
  priceDisclaimer: { color: Colors.textMuted, fontSize: 12, marginBottom: 12 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 18, marginTop: 16, marginBottom: 24 },
  scanAgainButton: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  scanAgainText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface,
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: Colors.border,
    zIndex: 10, elevation: 10,
  },
  saveButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4 },
  saveLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  shareButton: {
    backgroundColor: Colors.accent, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  shareButtonText: { color: '#000000', fontSize: 15, fontWeight: '700' },
});
