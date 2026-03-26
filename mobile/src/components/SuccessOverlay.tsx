import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { SUCCESS_GREEN, WHITE, fonts } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface SuccessOverlayProps {
  visible: boolean;
  message: string;
  submessage?: string;
  onFinish: () => void;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ visible, message, submessage, onFinish }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();

      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => onFinish());
      }, 2500);
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[s.overlay, { opacity }]}>
      <Animated.View style={[s.card, { transform: [{ scale }] }]}>
        <CheckCircle2 size={80} color={SUCCESS_GREEN} strokeWidth={3} />
        <Text style={s.title}>{message}</Text>
        {submessage && <Text style={s.sub}>{submessage}</Text>}
      </Animated.View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, width, height, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  card: { backgroundColor: WHITE, padding: 40, borderRadius: 32, alignItems: 'center', width: '85%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 22, fontFamily: fonts.bold, color: '#111', marginTop: 24, textAlign: 'center' },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: '#666', marginTop: 8, textAlign: 'center' }
});
