import { Easing } from 'react-native-reanimated';

export const motion = {
  duration: {
    fast: 180,
    normal: 260,
    slow: 360,
    screen: 420,
  },
  spring: {
    soft: { damping: 18, stiffness: 220, mass: 0.7 },
    snappy: { damping: 14, stiffness: 280, mass: 0.7 },
  },
  easing: {
    standard: Easing.out(Easing.cubic),
    emphasized: Easing.out(Easing.exp),
  },
};

export default motion;
