import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatPrice, formatSavingsAmount } from '../utils/formatters';

export interface ScanCardData {
  id: string;
  imageUrl: string;
  productName: string;
  bestPrice: number;
  originalPrice: number;
}

interface ScanCardProps {
  scan: ScanCardData;
  onPress: (scanId: string) => void;
}

function ScanCard({ scan, onPress }: ScanCardProps) {
  const { colors } = useTheme();
  const savings = scan.originalPrice - scan.bestPrice;
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => onPress(scan.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: scan.imageUrl }} style={[styles.thumbnail, { backgroundColor: colors.surfaceLight }]} />
      <View style={styles.info}>
        <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
          {scan.productName}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.bestPrice, { color: colors.accent }]}>{formatPrice(scan.bestPrice)}</Text>
          <Text style={[styles.originalPrice, { color: colors.danger }]}>
            {formatPrice(scan.originalPrice)}
          </Text>
        </View>
      </View>
      {savings > 0.01 && (
        <View style={[styles.savingsBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.savingsText, { color: colors.accentOnDark }]}>
            {formatSavingsAmount(scan.originalPrice, scan.bestPrice)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  productName: {
    fontSize: 16,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bestPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default React.memo(ScanCard);
