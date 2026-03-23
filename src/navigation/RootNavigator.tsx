import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthStack from './AuthStack';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import ScanningScreen from '../screens/ScanningScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../constants/colors';
import { useAuthContext } from '../contexts/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Home: undefined;
  Camera: undefined;
  Scanning: { imageUri: string };
  Results: { scanId: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = '@lowball_onboarding_complete';

export function useOnboardingComplete() {
  return _setOnboardingDone;
}

let _setOnboardingDone: React.Dispatch<React.SetStateAction<boolean | null>> = () => {};

export default function RootNavigator() {
  const { user, loading } = useAuthContext();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  _setOnboardingDone = setOnboardingDone;

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingDone(value === 'true');
    });
  }, []);

  if (loading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      {!user ? (
        <>
          {!onboardingDone && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Auth" component={AuthStack} />
        </>
      ) : (
        <>
          {!onboardingDone && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Scanning" component={ScanningScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Results" component={ResultsScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
