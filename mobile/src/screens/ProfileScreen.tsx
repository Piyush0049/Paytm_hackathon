import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { ShieldCheck, LineChart, Globe, ChevronRight, LogOut, Settings2, HelpCircle } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED } from '../styles/theme';
import { QRModal } from '../components/QRModal';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  profile: any;
  logout: () => void;
  onEnroll: () => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, logout, onEnroll, isDarkMode = false, setIsDarkMode }) => {
  const [showQR, setShowQR] = useState(false);

  const menuItems = [
    { icon: ShieldCheck, color: '#FF9800', label: 'Security & VoiceGuard' },
    { icon: LineChart, color: '#21C17C', label: 'Credit Score & Reports' },
    { icon: Settings2, color: PAYTM_LIGHT_BLUE, label: 'Payment Settings' },
    { icon: Globe, color: '#9C27B0', label: 'Language' },
    { icon: HelpCircle, color: '#607D8B', label: '24x7 Help & Support' },
  ];

  const qrUrl = profile?.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${profile?.upi_id || ''}`;
  const bg = isDarkMode ? DARK_BACKGROUND : '#F5F7FA';
  const surface = isDarkMode ? DARK_SURFACE : WHITE;
  const text = isDarkMode ? DARK_TEXT : '#111';
  const textMuted = isDarkMode ? DARK_TEXT_MUTED : '#666';

  return (
    <ScrollView style={[s.screen, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      {/* Premium Profile Header Background */}
      <View style={s.topBackground} />

      {/* Floating Header Card */}
      <View style={[s.profileHeaderCard, { backgroundColor: surface, shadowColor: isDarkMode ? '#000' : '#CCC' }]}>
        <View style={s.avatarWrapper}>
          <View style={s.avatarBig}>
            <Text style={s.avatarTextBig}>{(profile?.name || 'U')[0].toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[s.profileName, { color: text }]}>{profile?.name || 'User'}</Text>
        <Text style={[s.profileEmail, { color: textMuted }]}>{profile?.email || ''}</Text>
        <View style={s.upiBadge}>
          <Text style={s.upiBadgeText}>{profile?.upi_id || 'UPI ID Not Set'}</Text>
        </View>
      </View>

      {/* Modern QR Card */}
      <TouchableOpacity style={[s.qrCard, { backgroundColor: surface }]} onPress={() => setShowQR(true)} activeOpacity={0.85}>
        <View style={s.qrCardInner}>
          <View style={[s.qrPreview, { backgroundColor: isDarkMode ? '#111' : '#F0F5FA' }]}>
            <Image source={{ uri: qrUrl }} style={s.qrPreviewImg} />
          </View>
          <View style={s.qrCardText}>
            <Text style={[s.qrCardTitle, { color: text }]}>My Paytm QR</Text>
            <Text style={[s.qrCardSub, { color: textMuted }]}>Tap to expand and receive money</Text>
          </View>
          <View style={s.arrowBubble}>
            <ChevronRight size={18} color={PAYTM_BLUE} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Settings List */}
      <View style={[s.profileListGroup, { backgroundColor: surface }]}>
        {menuItems.map((item, i) => (
          <TouchableOpacity 
            key={i} 
            style={[s.profileListItem, { borderBottomColor: isDarkMode ? '#333' : '#F5F5F5', borderBottomWidth: i === menuItems.length - 1 ? 0 : 1 }]} 
            onPress={() => item.label.includes('VoiceGuard') ? onEnroll() : null}
          >
            <View style={[s.profileListIcon, { backgroundColor: item.color + '18' }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <Text style={[s.profileListText, { color: text }]}>{item.label}</Text>
            <ChevronRight size={20} color={isDarkMode ? '#555' : '#CCC'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={[s.logoutBtnReal, { backgroundColor: surface, borderColor: isDarkMode ? '#333' : '#FFEBEB' }]} onPress={logout}>
        <LogOut size={20} color="#FF4E4E" style={{ marginRight: 8 }} />
        <Text style={s.logoutTextReal}>Sign Out securely</Text>
      </TouchableOpacity>
      
      <View style={{ height: 120 }} />

      {/* Modal */}
      <QRModal 
        visible={showQR} 
        onClose={() => setShowQR(false)} 
        profile={profile} 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode || (() => {})}
      />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  
  topBackground: { height: 120, width: '100%', backgroundColor: PAYTM_BLUE, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, position: 'absolute', top: 0 },
  profileHeaderCard: { marginHorizontal: 20, marginTop: 40, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 20 },
  avatarWrapper: { marginTop: -50, padding: 6, backgroundColor: WHITE, borderRadius: 50, marginBottom: 12 },
  avatarBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: PAYTM_BLUE, justifyContent: 'center', alignItems: 'center' },
  avatarTextBig: { fontSize: 32, fontFamily: fonts.bold, color: WHITE },
  profileName: { fontSize: 20, fontFamily: fonts.bold },
  profileEmail: { fontSize: 13, fontFamily: fonts.medium, marginTop: 4 },
  upiBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 16 },
  upiBadgeText: { color: PAYTM_BLUE, fontFamily: fonts.bold, fontSize: 12 },

  qrCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  qrCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  qrPreview: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  qrPreviewImg: { width: 44, height: 44 },
  qrCardText: { flex: 1 },
  qrCardTitle: { fontSize: 16, fontFamily: fonts.bold, marginBottom: 2 },
  qrCardSub: { fontSize: 12, fontFamily: fonts.regular },
  arrowBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },

  profileListGroup: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', elevation: 1 },
  profileListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
  profileListIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  profileListText: { flex: 1, fontSize: 14, fontFamily: fonts.semiBold },

  logoutBtnReal: { marginHorizontal: 20, marginTop: 24, padding: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 1 },
  logoutTextReal: { color: '#FF4E4E', fontFamily: fonts.bold, fontSize: 15 },
});
