import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { formatPrice } from '../utils/formatters';

export interface DealCardData {
  id: string;
  retailer: string;
  retailerLogoUrl?: string;
  productTitle: string;
  price: number;
  originalPrice?: number;
  condition?: string;
  productUrl: string;
  savingsPercent?: number;
}

interface DealCardProps {
  deal: DealCardData;
  onPress: (deal: DealCardData) => void;
}

function DealCard({ deal, onPress }: DealCardProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onPress(deal), [deal, onPress]);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface }, pressed && styles.cardPressed]}
      onPress={handlePress}
    >
      <View style={styles.retailerIcon}>
        <Ionicons name="storefront" size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.retailerName, { color: colors.textPrimary }]}>{deal.retailer}</Text>
        <Text style={[styles.productTitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {deal.productTitle}
        </Text>
        {deal.condition && (
          <Text style={[styles.condition, { color: colors.textMuted }]}>{deal.condition}</Text>
        )}
      </View>
      <View style={styles.priceSection}>
        <Text style={[styles.price, { color: colors.savings }]}>{formatPrice(deal.price)}</Text>
        {deal.savingsPercent != null && deal.savingsPercent > 0 && (
          <View style={[styles.savingsBadge, { backgroundColor: colors.savings }]}>
            <Text style={[styles.savingsText, { color: '#FFFFFF' }]}>-{deal.savingsPercent}%</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.7,
  },
  retailerIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  retailerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  condition: {
    fontSize: 13,
    marginTop: 2,
  },
  priceSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  savingsBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default React.memo(DealCard);
