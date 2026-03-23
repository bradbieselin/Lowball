import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import DealCard, { DealCardData } from '../components/DealCard';
import { shareDeals } from '../utils/share';
import { useScan, useSaveScan, useUnsaveScan } from '../hooks/useScans';
import { trackClick } from '../services/api';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ResultsNav = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type ResultsRoute = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const navigation = useNavigation<ResultsNav>();
  const route = useRoute<ResultsRoute>();
  const { scanId } = route.params;
  const { data: scan, isLoading } = useScan(scanId);
  const saveMutation = useSaveScan();
  const unsaveMutation = useUnsaveScan();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (scan) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [scan]);

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

  // Fix 1: Open URL immediately, track click in background (no await)
  const handleDealPress = useCallback((deal: DealCardData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (deal.productUrl) {
      Linking.openURL(deal.productUrl).catch(() => {});
    }
    // Fire-and-forget — don't block the URL opening
    trackClick(scanId, deal.id, deal.retailer, deal.price).catch(() => {});
  }, [scanId]);

  // Fix 3: Save with haptic feedback and error handling
  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved) {
      setIsSaved(false);
      unsaveMutation.mutate(scanId, {
        onError: () => setIsSaved(true), // revert on failure
      });
    } else {
      setIsSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveMutation.mutate(scanId, {
        onError: () => setIsSaved(false), // revert on failure
      });
    }
  }, [isSaved, scanId, saveMutation, unsaveMutation]);

  // Fix 4: Dedicated share handler that can't accidentally trigger a link
  const handleShare = useCallback(async () => {
    if (!scan || deals.length === 0) return;
    const retailPrice = scan.estimatedRetailPrice ? parseFloat(scan.estimatedRetailPrice) : undefined;
    await shareDeals(scan.productName, deals[0].price, retailPrice);
  }, [scan, deals]);

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
        ListHeaderComponent={
          <>
            <View style={styles.productCard}>
              <Image source={{ uri: scan.imageUrl }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{scan.productName}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{scan.category}</Text>
                </View>
              </View>
            </View>
            <View style={styles.dealsHeader}>
              <Text style={styles.dealsTitle}>Deals Found</Text>
              <Text style={styles.dealsCount}>({deals.length})</Text>
            </View>
            <Text style={styles.priceDisclaimer}>
              Estimated prices — tap a deal to see the current price
            </Text>
          </>
        }
        renderItem={({ item }) => <DealCard deal={item} onPress={handleDealPress} />}
      />

      {/* Fix 4: Bottom bar with elevated zIndex so touches don't fall through to FlatList */}
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
  productCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: Colors.surfaceLight },
  productInfo: { flex: 1, marginLeft: 14 },
  productName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  categoryBadge: { backgroundColor: Colors.surfaceLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  categoryText: { color: Colors.textSecondary, fontSize: 13 },
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
