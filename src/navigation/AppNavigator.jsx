import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen.jsx';
import WelcomeSetupScreen from '../screens/WelcomeSetupScreen';
import BottomTabNavigator from './BottomTabNavigator';
import NowPlayingScreen from '../screens/NowPlayingScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CreateAdSheet from '../screens/CreateAdSheet';

import { colorScheme, colors } from '../theme';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: colorScheme === 'dark',
  colors: {
    ...DefaultTheme.colors,
    background: colors.secondary,
    card: colors.secondary,
    primary: colors.primary,
    text: colors.textPrimary,
    border: colors.divider,
    notification: colors.primary,
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.secondary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="WelcomeSetup" component={WelcomeSetupScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen
          name="NowPlaying"
          component={NowPlayingScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="CreateAd"
          component={CreateAdSheet}
          options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
