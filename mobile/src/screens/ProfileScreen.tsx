import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Lock, LineChart, Globe, ChevronRight, LogOut } from 'lucide-react-native';
import { PAYTM_BLUE, WHITE, fonts } from '../styles/theme';

interface ProfileScreenProps {
  profile: any;
  logout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, logout }) => {
  const menuItems = [
    { icon: Lock, color: '#FF9800', label: 'Security & VoiceGuard' },
    { icon: LineChart, color: '#21C17C', label: 'Credit Score' },
    { icon: Globe, color: '#00BAF2', label: 'Language Settings' },
  ];

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.profileHeader}>
        <View style={s.avatarBig}><Text style={s.avatarTextBig}>{(profile?.name || 'U')[0].toUpperCase()}</Text></View>
        <Text style={s.profileName}>{profile?.name || 'User'}</Text>
        <Text style={s.profileEmail}>{profile?.email || ''}</Text>
        <View style={s.upiBadge}><Text style={s.upiBadgeText}>{profile?.upi_id || ''}</Text></View>
      </View>
      <View style={s.profileListGroup}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={s.profileListItem}>
            <View style={[s.profileListIcon, { backgroundColor: item.color + '18' }]}><item.icon size={20} color={item.color} /></View>
            <Text style={s.profileListText}>{item.label}</Text>
            <ChevronRight size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.logoutBtnReal} onPress={logout}>
        <LogOut size={20} color="#FF4E4E" style={{ marginRight: 6 }} />
        <Text style={s.logoutTextReal}>Log Out</Text>
      </TouchableOpacity>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  profileHeader: { backgroundColor: WHITE, margin: 16, borderRadius: 16, padding: 30, alignItems: 'center', elevation: 3 },
  avatarBig: { width: 84, height: 84, borderRadius: 42, backgroundColor: PAYTM_BLUE, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarTextBig: { fontSize: 32, fontFamily: fonts.bold, color: WHITE },
  profileName: { fontSize: 22, fontFamily: fonts.bold, color: '#111' },
  profileEmail: { fontSize: 13, fontFamily: fonts.regular, color: '#666', marginTop: 4 },
  upiBadge: { backgroundColor: '#F0F5FA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 14 },
  upiBadgeText: { color: PAYTM_BLUE, fontFamily: fonts.bold, fontSize: 12 },
  profileListGroup: { backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', elevation: 2 },
  profileListItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  profileListIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  profileListText: { flex: 1, fontSize: 14, fontFamily: fonts.semiBold, color: '#111' },
  logoutBtnReal: { margin: 16, backgroundColor: WHITE, padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFEBEB' },
  logoutTextReal: { color: '#FF4E4E', fontFamily: fonts.bold, fontSize: 14 },
});
