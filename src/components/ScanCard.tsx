import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { formatPrice, formatSavingsAmount } from '../utils/formatters';

export interface ScanCardData {
  id: string;
  imageUrl: string;
  productName: string;
  bestPrice: number;
  originalPrice: number;
  aiConfidence?: number;
}

interface ScanCardProps {
  scan: ScanCardData;
  onPress: (scanId: string) => void;
}

function getConfidence(c?: number) {
  if (c === -1) return { label: 'Corrected', level: 'corrected' as const };
  if (typeof c !== 'number') return { label: 'Partial match', level: 'medium' as const };
  if (c >= 0.8) return { label: 'High match', level: 'high' as const };
  if (c >= 0.5) return { label: 'Partial match', level: 'medium' as const };
  return { label: 'Low match', level: 'low' as const };
}

function ScanCard({ scan, onPress }: ScanCardProps) {
  const { colors } = useTheme();
  const savings = scan.originalPrice - scan.bestPrice;
  const conf = getConfidence(scan.aiConfidence);
  const confColor = conf.level === 'high' ? colors.savings
    : conf.level === 'medium' ? colors.warning
    : conf.level === 'corrected' ? colors.textSecondary
    : colors.danger;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => onPress(scan.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: scan.imageUrl }} style={[styles.thumbnail, { backgroundColor: colors.surfaceLight }]} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
            {scan.productName}
          </Text>
          <View style={[styles.confidenceDot, { backgroundColor: confColor }]} />
        </View>
        <Text style={[styles.bestPrice, { color: colors.savings }]}>{formatPrice(scan.bestPrice)}</Text>
        <Text style={[styles.originalPrice, { color: colors.danger }]}>
          {formatPrice(scan.originalPrice)}
        </Text>
      </View>
      {savings > 0.01 && (
        <View style={[styles.savingsBadge, { backgroundColor: colors.savings }]}>
          <Text style={[styles.savingsText, { color: '#FFFFFF' }]}>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    flex: 1,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  bestPrice: {
    fontSize: 22,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginTop: 2,
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
