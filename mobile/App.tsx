import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Alert, ActivityIndicator, StatusBar, Animated, Modal, Dimensions, Image, Platform, SafeAreaView
} from 'react-native';
import {
  Home, ScrollText, Bell, User, Mic, Send, QrCode, ArrowDownToLine, Landmark, Smartphone, Zap, Tv, Car,
  ShieldCheck, Globe, LineChart, Coins, ClipboardList, Calendar, LogOut, Lock, CircleDollarSign,
  BadgePercent, CheckCircle, Search, Gift, ShieldAlert, CreditCard, ChevronRight, X, ArrowRight, Info, HelpCircle
} from 'lucide-react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
const paytmLogo = require('./assets/paytm_logo.png');

const { width, height } = Dimensions.get('window');
const BACKEND = 'http://192.168.1.6:8000';
const PAYTM_BLUE = '#002E6E';
const PAYTM_LIGHT_BLUE = '#00BAF2';

// ═══════════════════════════════════════════════
// PAYTM AI VOICEGUARD - MOBILE APP
// ═══════════════════════════════════════════════
export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // App State
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [showVoicePay, setShowVoicePay] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const authFetch = async (endpoint: string, tkn?: string) => {
    const t = tkn || token;
    const res = await fetch(`${BACKEND}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }
    });
    if (res.status === 401) { setToken(null); throw new Error('Session expired'); }
    return res.json();
  };

  const loadAllData = async (tkn?: string) => {
    try {
      const [p, b, t, n, o] = await Promise.all([
        authFetch('/user/profile', tkn),
        authFetch('/user/balance', tkn),
        authFetch('/user/transactions?limit=20', tkn),
        authFetch('/user/notifications', tkn),
        authFetch('/user/offers', tkn),
      ]);
      setProfile(p);
      setBalance(b);
      setTransactions(t.transactions || []);
      setNotifications(n.notifications || []);
      setOffers(o.offers || []);
    } catch (e) { console.log('Load error:', e); }
  };

  useEffect(() => { if (token) loadAllData(); }, [token]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleAuth = async () => {
    if (!authEmail || !authPassword || (authMode === 'signup' && !authName) || (showOtpField && !authOtp)) {
      Alert.alert('Missing Fields', 'Please fill all required fields');
      return;
    }
    setAuthLoading(true);
    try {
      if (!showOtpField) {
        const res = await fetch(`${BACKEND}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail.toLowerCase().trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
        setShowOtpField(true);
        Alert.alert('Success', data.message || 'Check your email');
      } else {
        const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/login';
        const body = authMode === 'signup'
          ? { email: authEmail.toLowerCase().trim(), name: authName, password: authPassword, otp: authOtp }
          : { email: authEmail.toLowerCase().trim(), password: authPassword, otp: authOtp };
        const res = await fetch(`${BACKEND}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Auth failed');
        setToken(data.token);
        loadAllData(data.token);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setAuthLoading(false);
  };

  const logout = () => {
    setToken(null);
    setAuthEmail(''); setAuthPassword(''); setAuthOtp(''); setAuthName('');
    setShowOtpField(false);
    setActiveTab('home');
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color={PAYTM_LIGHT_BLUE} />
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  // AUTH SCREEN (Premium Design)
  // ═══════════════════════════════════════════════
  if (!token) {
    return (
      <SafeAreaView style={s.authSafe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

        {/* Header with Help/Icon like real Paytm */}
        <View style={s.cleanAuthHeader}>
          <Image
            source={paytmLogo}
            style={{ width: 100, height: 36, resizeMode: 'contain' }}
          />
        </View>

        <ScrollView contentContainerStyle={s.authScrollContent} bounces={false}>
          <View style={s.authWelcomeBlock}>
            <Text style={s.authTitle}>{authMode === 'login' ? 'Login' : 'Create Account'}</Text>
            <Text style={s.authSub}>Welcome to the future of voice payments</Text>
          </View>

          <View style={s.authFormContainer}>
            {!showOtpField ? (
              <>
                {authMode === 'signup' && (
                  <View style={s.inputContainer}>
                    <Text style={s.inputLabel}>Full Name</Text>
                    <TextInput style={s.premiumInput} placeholder="Enter your name" placeholderTextColor="#AAA" value={authName} onChangeText={setAuthName} />
                  </View>
                )}
                <View style={s.inputContainer}>
                  <Text style={s.inputLabel}>Email Address</Text>
                  <TextInput style={s.premiumInput} placeholder="name@email.com" placeholderTextColor="#AAA" keyboardType="email-address" autoCapitalize="none" value={authEmail} onChangeText={setAuthEmail} />
                </View>
                <View style={s.inputContainer}>
                  <Text style={s.inputLabel}>Password</Text>
                  <TextInput style={s.premiumInput} placeholder="••••••••" placeholderTextColor="#AAA" secureTextEntry value={authPassword} onChangeText={setAuthPassword} />
                </View>
              </>
            ) : (
              <View style={s.otpAuthContainer}>
                <Text style={s.otpAuthTitle}>Enter 4-digit OTP</Text>
                <Text style={s.otpAuthSub}>Sent to {authEmail}</Text>
                <TextInput style={s.otpAuthInput} placeholder="0 0 0 0" placeholderTextColor="#EEE" keyboardType="number-pad" value={authOtp} onChangeText={setAuthOtp} maxLength={4} autoFocus />
              </View>
            )}

            <TouchableOpacity style={s.actionBtnAuth} onPress={handleAuth} activeOpacity={0.8}>
              {authLoading ? <ActivityIndicator color="#FFF" /> : (
                <Text style={s.actionBtnTextAuth}>
                  {!showOtpField ? 'Proceed Securely' : (authMode === 'login' ? 'Verify & Login' : 'Verify & Claim ₹1,000')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setShowOtpField(false); setAuthOtp(''); }} style={s.switchAuthBtn}>
              <Text style={s.switchAuthText}>{authMode === 'login' ? "New to Paytm? Create an account" : "Already have an account? Login"}</Text>
            </TouchableOpacity>
          </View>

          {/* Social Proof / Security */}
          <View style={s.authTrustBlock}>
            <ShieldCheck size={28} color="#21C17C" />
            <View style={{ marginLeft: 12 }}>
              <Text style={s.trustTitle}>100% Secure & AI Protected</Text>
              <Text style={s.trustSub}>Your voice is your unique security key.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════
  // DASHBOARD LAYOUT
  // ═══════════════════════════════════════════════
  const upiActions = [
    { id: 'scan', icon: QrCode, label: 'Scan & Pay', color: '#002E6E' },
    { id: 'mobile', icon: Smartphone, label: 'To Mobile or\nContact', color: '#002E6E' },
    { id: 'bank', icon: Landmark, label: 'To Bank or\nSelf A/c', color: '#002E6E' },
    { id: 'upi', icon: Send, label: 'To UPI ID', color: '#002E6E' },
  ];

  const rechargeActions = [
    { id: 'mob', icon: Smartphone, label: 'Mobile\nRecharge', color: '#00BAF2' },
    { id: 'elec', icon: Zap, label: 'Electricity', color: '#00BAF2' },
    { id: 'dth', icon: Tv, label: 'DTH', color: '#00BAF2' },
    { id: 'fast', icon: Car, label: 'FASTag\nRecharge', color: '#00BAF2' },
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transfer': return <Send size={24} color="#00BAF2" />;
      case 'Cashback': return <Gift size={24} color="#21C17C" />;
      case 'Recharge': return <Smartphone size={24} color="#FF9800" />;
      case 'Bill Payment': return <ScrollText size={24} color="#9C27B0" />;
      default: return <CreditCard size={24} color="#555" />;
    }
  };

  const renderHome = () => (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} bounces={false}>
      <View style={s.blueBanner} />
      <View style={s.homeContent}>
        <View style={s.walletStrip}>
          <View style={s.walletInfo}>
            <Text style={s.walletLabel}>Paytm Balance</Text>
            <Text style={s.walletBal}>₹{(balance?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <TouchableOpacity style={s.addMoneyBtn}>
            <Text style={s.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        <View style={s.aiProtectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {balance?.voice_enrolled ? <ShieldCheck size={22} color="#21C17C" /> : <ShieldAlert size={22} color="#FF9800" />}
            <Text style={s.aiText}>{balance?.voice_enrolled ? 'VoiceGuard Active' : 'VoiceGuard Disabled'}</Text>
          </View>
          <Text style={s.aiScoreText}>Credit Score: {balance?.credit_score || 750}</Text>
        </View>

        <View style={s.sectionBlock}>
          <Text style={s.sectionHeader}>UPI Money Transfer</Text>
          <View style={s.actionGrid}>
            {upiActions.map((a) => (
              <TouchableOpacity key={a.id} style={s.actionItem}>
                <View style={[s.actionIcon, { backgroundColor: '#F0F5FA' }]}>
                  <a.icon size={26} color={PAYTM_BLUE} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.sectionBlock}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionHeader}>Recharge & Bill Payments</Text>
            <TouchableOpacity><Text style={s.viewAllLink}>View All</Text></TouchableOpacity>
          </View>
          <View style={s.actionGrid}>
            {rechargeActions.map((a) => (
              <TouchableOpacity key={a.id} style={s.actionItem}>
                <View style={s.actionIconSolid}>
                  <a.icon size={24} color={'#FFF'} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.sectionBlock}>
          <Text style={s.sectionHeader}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((t, i) => (
            <View key={i} style={s.txCard}>
              <View style={s.txIconWrapper}>{getCategoryIcon(t.category)}</View>
              <View style={s.txInfo}>
                <Text style={s.txRecipient}>{t.recipient}</Text>
                <Text style={s.txTime}>{new Date(t.timestamp).toLocaleDateString()}</Text>
              </View>
              <Text style={[s.txAmount, { color: t.type === 'received' ? '#21C17C' : '#333' }]}>
                {t.type === 'received' ? '+' : '-'}₹{t.amount}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={[s.screen, { backgroundColor: '#F5F7FA' }]} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeader}><Text style={s.pageTitle}>History</Text></View>
      {transactions.map((t, i) => (
        <View key={i} style={s.txCardGlobal}>
          <View style={s.txIconWrapperGlobal}>{getCategoryIcon(t.category)}</View>
          <View style={s.txInfoGlobal}>
            <Text style={s.txRecipientGlobal}>{t.recipient}</Text>
            <Text style={s.txMetaGlobal}>{t.memo}</Text>
            <Text style={s.txTimeGlobal}>{new Date(t.timestamp).toLocaleString()}</Text>
          </View>
          <Text style={[s.txAmountGlobal, { color: t.type === 'received' ? '#21C17C' : '#333' }]}>
            {t.type === 'received' ? '+' : '-'}₹{t.amount}
          </Text>
        </View>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const renderNotifications = () => (
    <ScrollView style={[s.screen, { backgroundColor: '#F5F7FA' }]} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeader}><Text style={s.pageTitle}>Notifications</Text></View>
      {notifications.map((n, i) => (
        <View key={i} style={[s.notifCard, !n.read && s.notifUnread]}>
          <Text style={s.notifTitle}>{n.title}</Text>
          <Text style={s.notifBody}>{n.body}</Text>
          <Text style={s.notifTime}>{n.time}</Text>
        </View>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView style={[s.screen, { backgroundColor: '#F5F7FA' }]} showsVerticalScrollIndicator={false}>
      <View style={s.profileHeader}>
        <View style={s.avatarBig}><Text style={s.avatarTextBig}>{(profile?.name || 'U')[0].toUpperCase()}</Text></View>
        <Text style={s.profileName}>{profile?.name || 'User'}</Text>
        <Text style={s.profileEmail}>{profile?.email || ''}</Text>
        <View style={s.upiBadge}><Text style={s.upiBadgeText}>{profile?.upi_id || ''}</Text></View>
      </View>
      <View style={s.profileListGroup}>
        {[
          { icon: Lock, color: '#FF9800', label: 'Security & VoiceGuard' },
          { icon: LineChart, color: '#21C17C', label: 'Credit Score' },
          { icon: Globe, color: '#00BAF2', label: 'Language Settings' },
        ].map((item, i) => (
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

  const renderVoiceModal = () => (
    <Modal visible={showVoicePay} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.voiceModal}>
          <View style={s.voiceDragHandle} />
          <Text style={s.voiceTitle}>VoiceGuard Pay</Text>
          <Text style={s.voiceSub}>Triple Secured Transaction</Text>
          <View style={s.voiceCircle}>
            <Animated.View style={[s.voicePulse, { transform: [{ scale: pulseAnim }] }]}>
              <Mic size={56} color="#00BAF2" />
            </Animated.View>
          </View>
          <Text style={s.voiceHint}>Try: "Pay 500 to Rahul"</Text>
          <TouchableOpacity style={s.voiceClose} onPress={() => setShowVoicePay(false)}>
            <Text style={s.voiceCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={PAYTM_BLUE} />

      {/* Real Top Bar with safe area padding */}
      <View style={[s.topBarReal, { paddingTop: Platform.OS === 'ios' ? 44 : 32, height: Platform.OS === 'ios' ? 100 : 88 }]}>
        <View style={s.topBarLeft}>
          <TouchableOpacity style={s.userIconReal}><Text style={s.userIconInit}>{(profile?.name || 'U')[0].toUpperCase()}</Text></TouchableOpacity>
          <Image source={paytmLogo} style={{ width: 80, height: 26, resizeMode: 'contain', marginLeft: 12, tintColor: '#FFF' }} />
        </View>
        <View style={s.topBarRight}>
          <TouchableOpacity style={s.topIconReal}><Search size={22} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity style={s.topIconReal}><Bell size={22} color="#FFF" /></TouchableOpacity>
        </View>
      </View>

      {activeTab === 'home' && renderHome()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'notifs' && renderNotifications()}
      {activeTab === 'profile' && renderProfile()}
      {renderVoiceModal()}

      {/* Bottom Profile Navbar */}
      <View style={s.tabBarReal}>
        {[{ id: 'home', icon: Home, label: 'Home' }, { id: 'history', icon: ScrollText, label: 'History' }, { id: 'voice', icon: Mic, label: 'Voice' }, { id: 'notifs', icon: Bell, label: 'Alerts' }, { id: 'profile', icon: User, label: 'Profile' }].map((tab) => (
          <TouchableOpacity key={tab.id} style={s.tabReal} onPress={() => tab.id === 'voice' ? setShowVoicePay(true) : setActiveTab(tab.id)} activeOpacity={0.8}>
            {tab.id === 'voice' ? (
              <View style={s.voiceFabRealCenter}><View style={s.voiceFabReal}><Mic size={28} color="#FFF" /></View><Text style={s.voiceFabLabel}>Voice</Text></View>
            ) : (
              <View style={s.tabContentReal}><tab.icon size={24} color={activeTab === tab.id ? PAYTM_BLUE : '#888'} /><Text style={[s.tabLabelReal, activeTab === tab.id && { color: PAYTM_BLUE, fontWeight: '700' }]}>{tab.label}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════
// STYLES (Enforced Poppins & Fixed Spacing)
// ═══════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingTop: 10 },

  // Auth Layout
  authSafe: { flex: 1, backgroundColor: '#FFF' },
  cleanAuthHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, height: 70 },
  authScrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  authWelcomeBlock: { marginBottom: 24 },
  authTitle: { fontSize: 28, fontFamily: 'Poppins-Bold', color: '#111' },
  authSub: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666', marginTop: 2 },

  authFormContainer: { marginBottom: 24 },
  inputContainer: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#555', marginBottom: 6, marginLeft: 4 },
  premiumInput: { backgroundColor: '#F9FAFC', borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Poppins-Medium', color: '#111', borderWidth: 1, borderColor: '#EEE' },

  otpAuthContainer: { alignItems: 'center', marginBottom: 30 },
  otpAuthTitle: { fontSize: 20, fontFamily: 'Poppins-Bold', color: '#111' },
  otpAuthSub: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#888', marginTop: 4 },
  otpAuthInput: { backgroundColor: '#F9FAFC', borderRadius: 16, padding: 20, fontSize: 32, fontFamily: 'Poppins-Bold', color: PAYTM_BLUE, letterSpacing: 10, textAlign: 'center', width: '90%', marginTop: 20, borderWidth: 2, borderColor: PAYTM_LIGHT_BLUE },

  actionBtnAuth: { backgroundColor: PAYTM_LIGHT_BLUE, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: PAYTM_LIGHT_BLUE, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  actionBtnTextAuth: { color: '#FFF', fontSize: 17, fontFamily: 'Poppins-Bold' },
  switchAuthBtn: { marginTop: 16, alignItems: 'center' },
  switchAuthText: { color: PAYTM_BLUE, fontFamily: 'Poppins-SemiBold', fontSize: 14 },

  authTrustBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', padding: 16, borderRadius: 16 },
  trustTitle: { fontSize: 15, fontFamily: 'Poppins-Bold', color: '#1A531B' },
  trustSub: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#1A531B', opacity: 0.7 },

  // Dashboard Styles
  topBarReal: { backgroundColor: PAYTM_BLUE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  userIconReal: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  userIconInit: { color: '#FFF', fontFamily: 'Poppins-Bold', fontSize: 16 },
  topBarRight: { flexDirection: 'row', gap: 16 },
  topIconReal: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  screen: { flex: 1 },
  blueBanner: { backgroundColor: PAYTM_BLUE, height: Platform.OS === 'ios' ? 100 : 88, width: '100%', position: 'absolute', top: 0 },
  homeContent: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  walletStrip: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, marginBottom: 16 },
  walletInfo: {},
  walletLabel: { color: '#666', fontSize: 13, fontFamily: 'Poppins-SemiBold' },
  walletBal: { color: '#111', fontSize: 28, fontFamily: 'Poppins-Bold', marginTop: 2 },
  addMoneyBtn: { backgroundColor: PAYTM_BLUE, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  addMoneyText: { color: '#FFF', fontFamily: 'Poppins-Bold', fontSize: 13 },

  aiProtectionCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  aiText: { color: '#1A531B', fontFamily: 'Poppins-Bold', fontSize: 14, marginLeft: 8 },
  aiScoreText: { color: '#1A531B', fontSize: 13, fontFamily: 'Poppins-SemiBold' },

  sectionBlock: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  sectionHeader: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#111', marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllLink: { color: PAYTM_LIGHT_BLUE, fontFamily: 'Poppins-Bold', fontSize: 13 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionItem: { width: '23%', alignItems: 'center', marginBottom: 16 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIconSolid: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: PAYTM_LIGHT_BLUE },
  actionLabel: { fontSize: 11, color: '#333', textAlign: 'center', fontFamily: 'Poppins-Medium', lineHeight: 14 },

  txCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  txIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfo: { flex: 1 },
  txRecipient: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#111' },
  txTime: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontFamily: 'Poppins-Bold' },

  pageHeader: { padding: 24, paddingBottom: 10 },
  pageTitle: { fontSize: 26, fontFamily: 'Poppins-Bold', color: '#111' },

  txCardGlobal: { backgroundColor: '#FFF', padding: 18, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  txIconWrapperGlobal: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfoGlobal: { flex: 1 },
  txRecipientGlobal: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#111' },
  txMetaGlobal: { fontSize: 13, fontFamily: 'Poppins-Medium', color: '#666', marginTop: 2 },
  txTimeGlobal: { fontSize: 11, fontFamily: 'Poppins-Regular', color: '#AAA', marginTop: 4 },
  txAmountGlobal: { fontSize: 17, fontFamily: 'Poppins-Bold' },

  notifCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 12 },
  notifUnread: { borderLeftWidth: 4, borderLeftColor: PAYTM_LIGHT_BLUE },
  notifTitle: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#111', marginBottom: 4 },
  notifBody: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#555', marginBottom: 10 },
  notifTime: { fontSize: 12, color: '#999', fontFamily: 'Poppins-Medium' },

  profileHeader: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  avatarBig: { width: 84, height: 84, borderRadius: 42, backgroundColor: PAYTM_BLUE, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarTextBig: { fontSize: 36, fontFamily: 'Poppins-Bold', color: '#FFF' },
  profileName: { fontSize: 24, fontFamily: 'Poppins-Bold', color: '#111' },
  profileEmail: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666', marginTop: 4 },
  upiBadge: { backgroundColor: '#F0F5FA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 14 },
  upiBadgeText: { color: PAYTM_BLUE, fontFamily: 'Poppins-Bold', fontSize: 13 },

  profileListGroup: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  profileListItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  profileListIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  profileListText: { flex: 1, fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#111' },

  logoutBtnReal: { margin: 16, backgroundColor: '#FFF', padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFEBEB' },
  logoutTextReal: { color: '#FF4E4E', fontFamily: 'Poppins-Bold', fontSize: 16 },

  tabBarReal: { flexDirection: 'row', backgroundColor: '#FFF', height: 80, position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#EEE', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 20, paddingBottom: Platform.OS === 'ios' ? 24 : 0 },
  tabReal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContentReal: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  tabLabelReal: { fontSize: 10, color: '#888', marginTop: 4, fontFamily: 'Poppins-Medium' },
  voiceFabRealCenter: { position: 'absolute', top: -24, alignItems: 'center' },
  voiceFabReal: { width: 62, height: 62, borderRadius: 31, backgroundColor: PAYTM_LIGHT_BLUE, justifyContent: 'center', alignItems: 'center', shadowColor: PAYTM_LIGHT_BLUE, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  voiceFabLabel: { fontSize: 11, color: PAYTM_BLUE, fontFamily: 'Poppins-Bold', marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  voiceModal: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, alignItems: 'center' },
  voiceDragHandle: { width: 40, height: 6, borderRadius: 3, backgroundColor: '#EEE', marginBottom: 24 },
  voiceTitle: { fontSize: 26, fontFamily: 'Poppins-Bold', color: '#111' },
  voiceSub: { fontSize: 15, color: '#21C17C', fontFamily: 'Poppins-Bold', marginTop: 4, marginBottom: 30 },
  voiceCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,186,242,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  voicePulse: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,186,242,0.2)', justifyContent: 'center', alignItems: 'center' },
  voiceHint: { fontSize: 16, color: '#555', fontFamily: 'Poppins-Medium', marginBottom: 30 },
  voiceClose: { backgroundColor: '#F0F5FA', width: '100%', borderRadius: 16, padding: 18, alignItems: 'center' },
  voiceCloseText: { fontFamily: 'Poppins-Bold', color: PAYTM_BLUE, fontSize: 16 },
});
