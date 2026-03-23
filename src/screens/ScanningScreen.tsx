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
import { Colors } from '../constants/colors';
import { useScanProduct } from '../hooks/useScans';
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
  const navigation = useNavigation<ScanningNav>();
  const route = useRoute<ScanningRoute>();
  const { imageUri } = route.params;
  const scanMutation = useScanProduct();

  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());
  const isMounted = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      timers.current.forEach(clearTimeout);
    };
  }, []);

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

  const navigateWithDelay = useCallback((scanId: string) => {
    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
    const timer = setTimeout(() => {
      if (isMounted.current) {
        navigation.replace('Results', { scanId });
      }
    }, remaining);
    timers.current.push(timer);
  }, [navigation]);

  const doScan = useCallback(() => {
    setError(null);
    startTime.current = Date.now();
    scanMutation.mutate(imageUri, {
      onSuccess: (data) => {
        if (isMounted.current) {
          navigateWithDelay(data.id);
        }
      },
      onError: (err) => {
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      },
    });
  }, [imageUri, scanMutation, navigateWithDelay]);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={doScan}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
        <Ionicons name="arrow-back" size={28} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.productImage} />
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
          />
        </View>
        <Animated.Text style={[styles.statusText, { opacity: textOpacity }]}>
          {STATUS_MESSAGES[messageIndex]}
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 1, padding: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 12, overflow: 'hidden', marginBottom: 40 },
  productImage: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 12 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: Colors.accent,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
  },
  statusText: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center' },
  errorText: { color: Colors.danger, fontSize: 16, textAlign: 'center', marginTop: 16, marginBottom: 24, paddingHorizontal: 32 },
  retryButton: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  retryText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  homeButton: { paddingVertical: 14 },
  homeText: { color: Colors.textSecondary, fontSize: 16 },
});
