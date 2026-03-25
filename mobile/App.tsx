import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Alert, ActivityIndicator, StatusBar, Animated, Modal, Dimensions
} from 'react-native';
import { 
  Home, ScrollText, Bell, User, Mic, Send, QrCode, ArrowDownToLine, Landmark, Smartphone, Zap, Tv, Car,
  ShieldCheck, Globe, LineChart, Coins, ClipboardList, Calendar, LogOut, Lock, CircleDollarSign,
  BadgePercent, CheckCircle, Search, Gift, ShieldAlert, CreditCard
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const BACKEND = 'http://192.168.1.6:8000';

// ═══════════════════════════════════════════════
// PAYTM AI VOICEGUARD - MOBILE APP
// ═══════════════════════════════════════════════
export default function App() {
  // ─── Auth State ───
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // ─── App State ───
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVoicePay, setShowVoicePay] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ─── API Helper ───
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

  // Voice Pay pulse animation
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

  // ─── Auth Handler ───
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
        if (data.message) Alert.alert('Welcome!', data.message);
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
    setProfile(null); setBalance(null);
    setTransactions([]); setNotifications([]); setOffers([]);
    setActiveTab('home');
  };

  // ═══════════════════════════════════════════════
  // AUTH SCREEN
  // ═══════════════════════════════════════════════
  if (!token) {
    return (
      <View style={s.authBg}>
        <StatusBar barStyle="light-content" backgroundColor="#012B5D" />
        <View style={s.authHeader}>
          <Text style={s.authLogo}>Paytm</Text>
          <Text style={s.authLogoSub}>AI VOICEGUARD</Text>
          <Text style={s.authTagline}>Secure Voice-Powered UPI Payments</Text>
        </View>

        <View style={s.authCard}>
          <Text style={s.authCardTitle}>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={s.authCardSub}>
            {authMode === 'login'
              ? (showOtpField ? 'Enter the code from your email' : 'Sign in to your wallet')
              : (showOtpField ? `Verifying ${authEmail}` : 'Get ₹1,000 signup bonus!')}
          </Text>

          {!showOtpField ? (
            <>
              {authMode === 'signup' && (
                <TextInput style={s.input} placeholder="Full Name" placeholderTextColor="#999" value={authName} onChangeText={setAuthName} />
              )}
              <TextInput style={s.input} placeholder="Email Address" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" value={authEmail} onChangeText={setAuthEmail} />
              <TextInput style={s.input} placeholder={authMode === 'signup' ? 'Create Password' : 'Password'} placeholderTextColor="#999" secureTextEntry value={authPassword} onChangeText={setAuthPassword} />
            </>
          ) : (
            <View style={s.otpContainer}>
              <Text style={s.otpLabel}>Enter 4-digit OTP</Text>
              <TextInput style={s.otpInput} placeholder="● ● ● ●" placeholderTextColor="#CCC" keyboardType="number-pad" value={authOtp} onChangeText={setAuthOtp} maxLength={4} autoFocus />
            </View>
          )}

          <TouchableOpacity style={s.primaryBtn} onPress={handleAuth} activeOpacity={0.8}>
            {authLoading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={s.primaryBtnText}>
                {!showOtpField ? 'Send OTP to Email' : (authMode === 'login' ? 'Verify & Login' : 'Verify & Claim ₹1,000')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setShowOtpField(false); setAuthOtp(''); }} style={s.switchBtn}>
            <Text style={s.switchText}>{authMode === 'login' ? "New here? Create account" : "Already registered? Login"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  // QUICK ACTIONS DATA
  // ═══════════════════════════════════════════════
  const quickActions = [
    { id: 'send', icon: Send, label: 'Send\nMoney', color: '#00BAF2' },
    { id: 'scan', icon: QrCode, label: 'Scan &\nPay', color: '#21C17C' },
    { id: 'req', icon: ArrowDownToLine, label: 'Request\nMoney', color: '#FF9800' },
    { id: 'bank', icon: Landmark, label: 'Bank\nTransfer', color: '#9C27B0' },
    { id: 'mob', icon: Smartphone, label: 'Mobile\nRecharge', color: '#F44336' },
    { id: 'elec', icon: Zap, label: 'Electricity\nBill', color: '#FFB800' },
    { id: 'dth', icon: Tv, label: 'DTH\nRecharge', color: '#E91E63' },
    { id: 'fast', icon: Car, label: 'FASTag\nRecharge', color: '#607D8B' },
  ];

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Transfer': return <Send size={22} color="#555" />;
      case 'Cashback': return <Gift size={22} color="#00BAF2" />;
      case 'Recharge': return <Smartphone size={22} color="#555" />;
      case 'Bill Payment': return <ScrollText size={22} color="#555" />;
      default: return <CreditCard size={22} color="#555" />;
    }
  };

  const getOfferIcon = (title: string, color: string) => {
    if (title.includes('Cashback')) return <CircleDollarSign size={32} color={color} style={{marginBottom: 8}} />;
    if (title.includes('Gold Coins')) return <Coins size={32} color={color} style={{marginBottom: 8}} />;
    return <BadgePercent size={32} color={color} style={{marginBottom: 8}} />;
  };

  // ═══════════════════════════════════════════════
  // HOME TAB
  // ═══════════════════════════════════════════════
  const renderHome = () => (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      {/* Balance Card */}
      <View style={s.balanceCard}>
        <View style={s.balanceTop}>
          <Text style={s.balanceLabel}>Paytm Balance</Text>
          <TouchableOpacity style={s.addMoneyBtn}><Text style={s.addMoneyText}>+ Add Money</Text></TouchableOpacity>
        </View>
        <Text style={s.balanceAmount}>₹{(balance?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        <View style={s.balanceRow}>
          <View style={s.balanceStat}>
            <Text style={s.statValue}>{balance?.total_transactions || 0}</Text>
            <Text style={s.statLabel}>Transactions</Text>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceStat}>
            <Text style={s.statValue}>{balance?.credit_score || 750}</Text>
            <Text style={s.statLabel}>Credit Score</Text>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceStat}>
            {balance?.voice_enrolled ? <ShieldCheck size={20} color="#21C17C" /> : <ShieldAlert size={20} color="#FF4E4E" />}
            <Text style={s.statLabel}>Voice ID</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actionsGrid}>
        {quickActions.map((a) => (
          <TouchableOpacity key={a.id} style={s.actionItem} activeOpacity={0.7}>
            <View style={[s.actionIcon, { backgroundColor: a.color + '18' }]}>
              <a.icon size={26} color={a.color} />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Offers */}
      {offers.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Offers & Rewards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.offersScroll}>
            {offers.map((o, i) => (
              <View key={i} style={[s.offerCard, { backgroundColor: o.color + '15', borderColor: o.color + '40' }]}>
                {getOfferIcon(o.title, o.color)}
                <Text style={[s.offerTitle, { color: o.color }]}>{o.title}</Text>
                <Text style={s.offerSub}>{o.subtitle}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Recent Transactions */}
      <Text style={s.sectionTitle}>Recent Transactions</Text>
      {transactions.length === 0 ? (
        <View style={s.emptyState}>
          <Mic size={32} color="#CCC" style={{marginBottom: 10}} />
          <Text style={s.emptyText}>No transactions yet. Start by making a voice payment!</Text>
        </View>
      ) : (
        transactions.slice(0, 5).map((t, i) => (
          <View key={i} style={s.txCard}>
            <View style={s.txIcon}>{getCategoryIcon(t.category)}</View>
            <View style={s.txInfo}>
              <Text style={s.txRecipient}>{t.recipient}</Text>
              <Text style={s.txMeta}>{t.category} • {t.status}</Text>
            </View>
            <Text style={[s.txAmount, { color: t.type === 'received' ? '#21C17C' : '#FF4E4E' }]}>
              {t.type === 'received' ? '+' : '-'}₹{t.amount}
            </Text>
          </View>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ═══════════════════════════════════════════════
  // HISTORY TAB
  // ═══════════════════════════════════════════════
  const renderHistory = () => (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>Transaction History</Text>
      {transactions.map((t, i) => (
        <View key={i} style={s.txCard}>
          <View style={s.txIcon}>{getCategoryIcon(t.category)}</View>
          <View style={s.txInfo}>
            <Text style={s.txRecipient}>{t.recipient}</Text>
            <Text style={s.txMeta}>{t.memo} • {t.verification_method}</Text>
            <Text style={s.txTime}>{new Date(t.timestamp).toLocaleString()}</Text>
          </View>
          <View style={s.txRight}>
            <Text style={[s.txAmount, { color: t.type === 'received' ? '#21C17C' : '#FF4E4E' }]}>
              {t.type === 'received' ? '+' : '-'}₹{t.amount}
            </Text>
            {t.risk_level && <Text style={s.txRisk}>Risk: {t.risk_level}</Text>}
          </View>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ═══════════════════════════════════════════════
  // NOTIFICATIONS TAB
  // ═══════════════════════════════════════════════
  const renderNotifications = () => (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <Text style={s.pageTitle}>Notifications</Text>
      {notifications.map((n, i) => (
        <View key={i} style={[s.notifCard, !n.read && s.notifUnread]}>
          <Text style={s.notifTitle}>{n.title}</Text>
          <Text style={s.notifBody}>{n.body}</Text>
          <Text style={s.notifTime}>{n.time}</Text>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ═══════════════════════════════════════════════
  // PROFILE TAB
  // ═══════════════════════════════════════════════
  const renderProfile = () => (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.profileHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(profile?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={s.profileName}>{profile?.name || 'User'}</Text>
        <Text style={s.profileEmail}>{profile?.email || ''}</Text>
        <Text style={s.profileUpi}>{profile?.upi_id || ''}</Text>
      </View>

      <View style={s.profileSection}>
        {[
          { icon: Lock, color: '#FF9800', label: 'Security Settings', sub: 'VoiceGuard, PIN, Biometric' },
          { icon: Globe, color: '#00BAF2', label: 'Language', sub: profile?.preferred_language === 'en' ? 'English' : profile?.preferred_language },
          { icon: LineChart, color: '#21C17C', label: 'Credit Score', sub: `${profile?.credit_score || 750} Points` },
          { icon: Coins, color: '#FFB800', label: 'Gold Coins', sub: `${profile?.gold_coins || 0} Coins` },
          { icon: ClipboardList, color: '#9C27B0', label: 'KYC Status', sub: profile?.kyc_status || 'Pending' },
          { icon: Calendar, color: '#607D8B', label: 'Member Since', sub: profile?.member_since || '2026' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={s.profileRow}>
            <View style={[s.profileIconWrap, { backgroundColor: item.color + '15' }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={s.profileRowInfo}>
              <Text style={s.profileRowLabel}>{item.label}</Text>
              <Text style={s.profileRowSub}>{item.sub}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <LogOut size={20} color="#FF4E4E" style={{marginRight: 8}} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
      <Text style={s.versionText}>Paytm AI VoiceGuard v2.0</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ═══════════════════════════════════════════════
  // VOICE PAY MODAL
  // ═══════════════════════════════════════════════
  const renderVoiceModal = () => (
    <Modal visible={showVoicePay} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.voiceModal}>
          <Text style={s.voiceTitle}>VoiceGuard Payment</Text>
          <Text style={s.voiceSub}>Speak your payment command</Text>
          <View style={s.voiceCircle}>
            <Animated.View style={[s.voicePulse, { transform: [{ scale: pulseAnim }] }]}>
              <Mic size={48} color="#00BAF2" />
            </Animated.View>
          </View>
          <Text style={s.voiceHint}>Say: "Pay 500 to Rahul"</Text>

          <View style={s.voiceSteps}>
            {[
              { label: 'Voice Capture', icon: Mic, c: '#00BAF2' }, 
              { label: 'Biometric Verify', icon: ShieldCheck, c: '#21C17C' }, 
              { label: 'AI Risk Score', icon: ShieldAlert, c: '#FF9800' }, 
              { label: 'Execute Payment', icon: CheckCircle, c: '#21C17C' }
            ].map((step, i) => (
              <View key={i} style={s.voiceStep}>
                <step.icon size={18} color={step.c} style={{marginRight: 10}} />
                <Text style={s.voiceStepText}>{step.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.voiceClose} onPress={() => setShowVoicePay(false)}>
            <Text style={s.voiceCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ═══════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'history', icon: ScrollText, label: 'History' },
    { id: 'voice', icon: Mic, label: '' },
    { id: 'notifs', icon: Bell, label: 'Alerts' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#012B5D" />

      {/* Top Bar */}
      <View style={s.topBar}>
        <View>
          <Text style={s.topLogo}>Paytm</Text>
          <Text style={s.topSub}>AI VoiceGuard</Text>
        </View>
        <View style={s.topRight}>
          <TouchableOpacity style={s.topIcon}><Search size={22} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity style={s.topIcon} onPress={() => setActiveTab('notifs')}><Bell size={22} color="#FFF" /></TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'notifs' && renderNotifications()}
      {activeTab === 'profile' && renderProfile()}

      {/* Voice Pay Modal */}
      {renderVoiceModal()}

      {/* Bottom Tab Bar */}
      <View style={s.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, tab.id === 'voice' && s.voiceTab]}
            onPress={() => tab.id === 'voice' ? setShowVoicePay(true) : setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            {tab.id === 'voice' ? (
              <Animated.View style={[s.voiceFab, { transform: [{ scale: pulseAnim }] }]}>
                <Mic size={28} color="#FFF" />
              </Animated.View>
            ) : (
              <>
                <tab.icon size={24} color={activeTab === tab.id ? '#00BAF2' : '#999'} />
                <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>{tab.label}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════
const s = StyleSheet.create({
  // ─── Auth ───
  authBg: { flex: 1, backgroundColor: '#012B5D' },
  authHeader: { paddingTop: 70, paddingBottom: 30, alignItems: 'center' },
  authLogo: { fontSize: 38, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  authLogoSub: { fontSize: 14, color: '#00BAF2', fontWeight: '700', letterSpacing: 4, marginTop: 4 },
  authTagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 12 },
  authCard: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingTop: 32 },
  authCardTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  authCardSub: { fontSize: 14, color: '#888', marginBottom: 24 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 14, padding: 16, fontSize: 15, color: '#333', marginBottom: 14, borderWidth: 1, borderColor: '#E8ECF0' },
  otpContainer: { alignItems: 'center', marginVertical: 10 },
  otpLabel: { fontSize: 14, color: '#888', marginBottom: 12 },
  otpInput: { backgroundColor: '#F5F7FA', borderRadius: 14, padding: 18, fontSize: 28, color: '#012B5D', fontWeight: '900', letterSpacing: 16, textAlign: 'center', width: '80%', borderWidth: 2, borderColor: '#00BAF2' },
  primaryBtn: { backgroundColor: '#00BAF2', borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#00BAF2', fontWeight: '700', fontSize: 14 },
  footerText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20, fontSize: 12 },

  // ─── Main ───
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  topBar: { backgroundColor: '#012B5D', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topLogo: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  topSub: { fontSize: 10, color: '#00BAF2', fontWeight: '700', letterSpacing: 3 },
  topRight: { flexDirection: 'row', gap: 12 },
  topIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  // ─── Balance Card ───
  balanceCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 22, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  balanceLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  addMoneyBtn: { backgroundColor: '#00BAF215', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addMoneyText: { color: '#00BAF2', fontWeight: '700', fontSize: 13 },
  balanceAmount: { fontSize: 36, fontWeight: '900', color: '#1A1A2E', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 14 },
  balanceStat: { alignItems: 'center', flexDirection: 'column' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#333', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  balanceDivider: { width: 1, backgroundColor: '#F0F0F0' },

  // ─── Quick Actions ───
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 14, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  actionItem: { width: (width - 32) / 4, alignItems: 'center', marginBottom: 16 },
  actionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 14 },

  // ─── Offers ───
  offersScroll: { marginBottom: 20 },
  offerCard: { width: 140, padding: 16, borderRadius: 16, marginRight: 12, borderWidth: 1, alignItems: 'flex-start' },
  offerTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  offerSub: { fontSize: 12, color: '#888' },

  // ─── Transactions ───
  txCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  txIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txRecipient: { fontSize: 15, fontWeight: '700', color: '#333' },
  txMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  txTime: { fontSize: 11, color: '#BBB', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '800' },
  txRisk: { fontSize: 10, color: '#999', marginTop: 2 },
  emptyState: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },

  // ─── Page Title ───
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', marginBottom: 16 },

  // ─── Notifications ───
  notifCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10 },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: '#00BAF2' },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  notifBody: { fontSize: 13, color: '#666', marginBottom: 6 },
  notifTime: { fontSize: 11, color: '#BBB' },

  // ─── Profile ───
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00BAF2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  profileEmail: { fontSize: 14, color: '#888', marginTop: 4 },
  profileUpi: { fontSize: 13, color: '#00BAF2', fontWeight: '700', marginTop: 4, backgroundColor: '#00BAF210', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  profileSection: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginVertical: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  profileIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  profileRowInfo: { flex: 1, marginLeft: 14 },
  profileRowLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  profileRowSub: { fontSize: 12, color: '#999', marginTop: 2 },
  chevron: { fontSize: 20, color: '#CCC' },
  logoutBtn: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#FF4E4E', fontWeight: '700', fontSize: 16 },
  versionText: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 16 },

  // ─── Voice Modal ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  voiceModal: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 30, alignItems: 'center', minHeight: 480 },
  voiceTitle: { fontSize: 22, fontWeight: '900', color: '#012B5D' },
  voiceSub: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24 },
  voiceCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#00BAF210', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  voicePulse: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00BAF220', justifyContent: 'center', alignItems: 'center' },
  voiceHint: { fontSize: 14, color: '#00BAF2', fontWeight: '600', marginBottom: 20 },
  voiceSteps: { width: '100%', marginBottom: 20 },
  voiceStep: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  voiceStepText: { fontSize: 14, fontWeight: '600', color: '#555' },
  voiceClose: { backgroundColor: '#F0F0F0', borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  voiceCloseText: { fontWeight: '700', color: '#666', fontSize: 15 },

  // ─── Tab Bar ───
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', paddingBottom: 28, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  voiceTab: { marginTop: -25 },
  voiceFab: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#00BAF2', justifyContent: 'center', alignItems: 'center', shadowColor: '#00BAF2', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  tabLabel: { fontSize: 10, color: '#999', marginTop: 4 },
  tabLabelActive: { color: '#00BAF2', fontWeight: '700' },
});
