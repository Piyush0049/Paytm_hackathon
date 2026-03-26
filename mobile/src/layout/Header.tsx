import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { PAYTM_BLUE, WHITE, fonts, layout } from '../styles/theme';

interface HeaderProps {
  userName: string;
  onProfilePress?: () => void;
  isDarkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userName, onProfilePress, isDarkMode = false }) => {
  const initials = (userName || 'U')[0].toUpperCase();
  const paytmLogo = require('../../assets/app-logo.png');

  return (
    <View style={[s.topBarReal, { backgroundColor: isDarkMode ? '#0D0D0D' : PAYTM_BLUE, paddingTop: layout.headerPaddingTop, height: layout.headerHeight }]}>
      <View style={s.topBarLeft}>
        <TouchableOpacity style={s.userIconReal} onPress={onProfilePress}>
          <Text style={s.userIconInit}>{initials}</Text>
        </TouchableOpacity>
        <Image
          source={paytmLogo}
          style={{ width: 120, height: 80, resizeMode: 'contain', marginLeft: 12 }}
        />
      </View>
      <View style={s.topBarRight}>
        <TouchableOpacity style={s.topIconReal}><Search size={22} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={s.topIconReal}><Bell size={22} color="#FFF" /></TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  topBarReal: { backgroundColor: PAYTM_BLUE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  userIconReal: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  userIconInit: { color: '#FFF', fontFamily: fonts.bold, fontSize: 16 },
  topBarRight: { flexDirection: 'row', gap: 16 },
  topIconReal: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
});
