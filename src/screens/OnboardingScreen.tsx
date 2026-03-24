import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useOnboardingComplete } from '../navigation/RootNavigator';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  iconName: string;
  iconLib: 'ionicons' | 'material';
  title: string;
  subtitle: string;
  detail: string;
}

const slides: Slide[] = [
  {
    id: '1',
    iconName: 'camera',
    iconLib: 'ionicons',
    title: 'Snap It',
    subtitle: 'Take a photo of any product you see',
    detail: "In a store, online, at a friend\u2019s house \u2014 anywhere.",
  },
  {
    id: '2',
    iconName: 'pricetag',
    iconLib: 'ionicons',
    title: 'Find It Cheaper',
    subtitle: 'Lowball searches the internet for the best deals',
    detail: 'We check Amazon, Walmart, Target, eBay and more.',
  },
  {
    id: '3',
    iconName: 'piggy-bank',
    iconLib: 'material',
    title: 'Save Big',
    subtitle: 'Get direct links to the lowest prices',
    detail: 'Track how much you save over time.',
  },
];

const ONBOARDING_KEY = '@lowball_onboarding_complete';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const setOnboardingDone = useOnboardingComplete();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
  };

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        {item.iconLib === 'ionicons' ? (
          <Ionicons name={item.iconName as any} size={100} color={colors.textPrimary} />
        ) : (
          <MaterialCommunityIcons name={item.iconName as any} size={100} color={colors.textPrimary} />
        )}
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textPrimary }]}>{item.subtitle}</Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.detail}</Text>
      {index === slides.length - 1 && (
        <TouchableOpacity style={[styles.getStartedButton, { backgroundColor: colors.accent }]} onPress={handleGetStarted}>
          <Text style={[styles.getStartedText, { color: colors.accentOnDark }]}>Get Started</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === activeIndex ? colors.accent : colors.border }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  getStartedButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
});
