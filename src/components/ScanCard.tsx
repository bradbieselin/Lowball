import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
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
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(scan.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: scan.imageUrl }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>
          {scan.productName}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.bestPrice}>{formatPrice(scan.bestPrice)}</Text>
          <Text style={styles.originalPrice}>
            {formatPrice(scan.originalPrice)}
          </Text>
        </View>
      </View>
      <View style={styles.savingsBadge}>
        <Text style={styles.savingsText}>
          {formatSavingsAmount(scan.originalPrice, scan.bestPrice)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  productName: {
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bestPrice: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: '700',
  },
  originalPrice: {
    color: Colors.danger,
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  savingsText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default React.memo(ScanCard);
