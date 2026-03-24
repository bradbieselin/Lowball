import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type CameraNav = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

const FLASH_MODES: FlashMode[] = ['auto', 'on', 'off'];
const FLASH_ICONS: Partial<Record<FlashMode, string>> = {
  auto: 'flash',
  on: 'flash',
  off: 'flash-off',
};

export default function CameraScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<CameraNav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [flashIndex, setFlashIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const flashOverlay = useRef(new Animated.Value(0)).current;

  const toggleFlash = () => {
    const next = (flashIndex + 1) % FLASH_MODES.length;
    setFlashIndex(next);
    setFlashMode(FLASH_MODES[next]);
  };

  const showFlashAnimation = () => {
    flashOverlay.setValue(1);
    Animated.timing(flashOverlay, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showFlashAnimation();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        const compressed = await compressImage(photo.uri);
        navigation.navigate('Scanning', { imageUri: compressed });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const pickingRef = useRef(false);

  const handlePickImage = async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        try {
          const compressed = await compressImage(result.assets[0].uri);
          navigation.navigate('Scanning', { imageUri: compressed });
        } catch {
          // Compression failed — use original image
          navigation.navigate('Scanning', { imageUri: result.assets[0].uri });
        }
      }
    } finally {
      setTimeout(() => { pickingRef.current = false; }, 1000);
    }
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>Camera Access Needed</Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          Lowball needs camera access to scan products
        </Text>
        {permission.canAskAgain ? (
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.accent }]} onPress={requestPermission}>
            <Text style={[styles.permissionButtonText, { color: colors.accentOnDark }]}>Grant Access</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.accent }]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={[styles.permissionButtonText, { color: colors.accentOnDark }]}>Open Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashMode}
      />

      {/* Crosshair guide */}
      <View style={styles.crosshairContainer} pointerEvents="none">
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />
      </View>

      {/* Top bar — outside CameraView so touches always work */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topButton}
          onPress={toggleFlash}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={FLASH_ICONS[flashMode] as any}
            size={24}
            color={colors.textPrimary}
          />
          {flashMode === 'auto' && (
            <Text style={[styles.flashLabel, { color: colors.textPrimary }]}>A</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom bar — outside CameraView */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
          <Ionicons name="images" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shutterOuter, { backgroundColor: colors.textPrimary }]} onPress={handleCapture}>
          <View style={[styles.shutterInner, { backgroundColor: colors.textPrimary, borderColor: colors.background }]} />
        </TouchableOpacity>
        <View style={styles.galleryButton} />
      </View>

      {/* Flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOverlay, backgroundColor: colors.textPrimary }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  flashLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: 40,
    height: 1,
    backgroundColor: 'rgba(142,142,147,0.3)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: 40,
    backgroundColor: 'rgba(142,142,147,0.3)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  galleryButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
