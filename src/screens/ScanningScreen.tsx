import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useScanProduct } from '../hooks/useScans';
import { useAds } from '../hooks/useAds';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ScanningNav = NativeStackNavigationProp<RootStackParamList, 'Scanning'>;
type ScanningRoute = RouteProp<RootStackParamList, 'Scanning'>;

const STATUS_MESSAGES = [
  'Identifying product...',
  'Searching for deals...',
  'Checking Amazon...',
  'Checking Walmart...',
  'Checking eBay...',
  'Finding you the best price...',
];

const IMAGE_SIZE = 200;
const MIN_DISPLAY_MS = 3000;

export default function ScanningScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<ScanningNav>();
  const route = useRoute<ScanningRoute>();
  const { imageUri } = route.params;
  const { mutate } = useScanProduct();
  const { shouldShowAds, loadAd, showAd, isAdLoaded } = useAds();

  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());
  const isMounted = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Preload ad if not already loaded
    if (shouldShowAds && !isAdLoaded()) {
      loadAd();
    }
    return () => {
      isMounted.current = false;
      timers.current.forEach(clearTimeout);
    };
  }, [shouldShowAds, loadAd, isAdLoaded]);

  // Scanning line animation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scanLineAnim]);

  // Rotating status messages
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        if (!isMounted.current) return;
        setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [textOpacity]);

  const navigateAfterAd = useCallback(async (scanId: string) => {
    // Wait for minimum display time
    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    await new Promise((resolve) => {
      const timer = setTimeout(resolve, remaining);
      timers.current.push(timer);
    });

    if (!isMounted.current) return;

    // Show ad if applicable, then navigate
    if (shouldShowAds) {
      await showAd(); // Resolves immediately if no ad loaded
    }

    if (isMounted.current) {
      navigation.replace('Results', { scanId });
    }
  }, [navigation, shouldShowAds, showAd]);

  const doScan = useCallback(() => {
    setError(null);
    startTime.current = Date.now();
    mutate(imageUri, {
      onSuccess: (data) => {
        if (isMounted.current) {
          navigateAfterAd(data.id);
        }
      },
      onError: (err) => {
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      },
    });
  }, [imageUri, mutate, navigateAfterAd]);

  // Trigger scan mutation on mount
  useEffect(() => {
    doScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, IMAGE_SIZE - 4],
  });

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.accent }]} onPress={doScan}>
            <Text style={[styles.retryText, { color: colors.accentOnDark }]}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
            <Text style={[styles.homeText, { color: colors.textSecondary }]}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
        <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.productImage} />
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }], backgroundColor: colors.accent, shadowColor: colors.accent }]}
          />
        </View>
        <Animated.Text style={[styles.statusText, { opacity: textOpacity, color: colors.textSecondary }]}>
          {STATUS_MESSAGES[messageIndex]}
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 1, padding: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 12, overflow: 'hidden', marginBottom: 40 },
  productImage: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 12 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 3,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
  },
  statusText: { fontSize: 16, textAlign: 'center' },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 16, marginBottom: 24, paddingHorizontal: 32 },
  retryButton: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  retryText: { fontSize: 16, fontWeight: '700' },
  homeButton: { paddingVertical: 14 },
  homeText: { fontSize: 16 },
});
