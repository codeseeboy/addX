import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  CircleUser,
  Home,
  Megaphone,
  Settings2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import HomeScreen from '../screens/HomeScreen';
import AdsScreen from '../screens/AdsScreen';
import StoreSettingsScreen from '../screens/StoreSettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { colors, radius, spacing, typography } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', label: 'Home', icon: Home, component: HomeScreen },
  { name: 'Ads', label: 'Ads', icon: Megaphone, component: AdsScreen },
  { name: 'Store', label: 'Store', icon: Settings2, component: StoreSettingsScreen },
  { name: 'Profile', label: 'Profile', icon: CircleUser, component: ProfileScreen },
];

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const indicatorX = useSharedValue(0);
  const tabWidth = useSharedValue(0);

  const onLayout = (e) => {
    const w = e.nativeEvent.layout.width / state.routes.length;
    tabWidth.value = w;
    indicatorX.value = withSpring(w * state.index + (w - PILL_W) / 2, {
      damping: 20, stiffness: 220, mass: 0.8,
    });
  };

  useEffect(() => {
    if (tabWidth.value > 0) {
      indicatorX.value = withSpring(
        tabWidth.value * state.index + (tabWidth.value - PILL_W) / 2,
        { damping: 20, stiffness: 220, mass: 0.8 },
      );
    }
  }, [state.index, indicatorX, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) + 6 },
      ]}
      onLayout={onLayout}
    >
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tabDef = TABS.find((t) => t.name === route.name);
        const Icon = tabDef?.icon || Home;
        const onPress = () => {
          Haptics.selectionAsync().catch(() => {});
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TabButton
            key={route.key}
            focused={focused}
            label={tabDef?.label || route.name}
            Icon={Icon}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function TabButton({ focused, label, Icon, onPress }) {
  const scale = useSharedValue(focused ? 1 : 0.95);
  const opacity = useSharedValue(focused ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 0.95, { damping: 14, stiffness: 250, mass: 0.6 });
    opacity.value = withTiming(focused ? 1 : 0.65, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [focused, scale, opacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabBtn} hitSlop={8}>
      <Animated.View style={iconStyle}>
        <Icon
          size={22}
          strokeWidth={focused ? 2.6 : 2}
          color={focused ? colors.primary : colors.textSecondary}
        />
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const PILL_W = 48;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    width: PILL_W,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
  },
  label: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
