import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, StatusBar, Animated, Platform } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

// Modular Components
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, BACKGROUND_COLOR } from './src/styles/theme';
import { Header } from './src/layout/Header';
import { Navbar } from './src/layout/Navbar';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { VoicePayModal } from './src/components/VoicePayModal';

const BACKEND = 'http://192.168.1.6:8000';

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

  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showVoicePay, setShowVoicePay] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      const [p, b, t, n] = await Promise.all([
        authFetch('/user/profile', tkn),
        authFetch('/user/balance', tkn),
        authFetch('/user/transactions?limit=20', tkn),
        authFetch('/user/notifications', tkn),
      ]);
      setProfile(p);
      setBalance(b);
      setTransactions(t.transactions || []);
      setNotifications(n.notifications || []);
    } catch (e) { console.log('Load error:', e); }
  };

  useEffect(() => { if (token) loadAllData(); }, [token]);

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
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAuthLoading(false);
  };

  const logout = () => {
    setToken(null);
    setAuthEmail(''); setAuthPassword(''); setAuthOtp(''); setAuthName('');
    setShowOtpField(false); setActiveTab('home');
  };

  if (!fontsLoaded) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={PAYTM_LIGHT_BLUE} />
      </View>
    );
  }

  if (!token) {
    return (
      <AuthScreen 
        authMode={authMode} setAuthMode={setAuthMode}
        authEmail={authEmail} setAuthEmail={setAuthEmail}
        authName={authName} setAuthName={setAuthName}
        authPassword={authPassword} setAuthPassword={setAuthPassword}
        authOtp={authOtp} setAuthOtp={setAuthOtp}
        showOtpField={showOtpField} setShowOtpField={setShowOtpField}
        authLoading={authLoading} handleAuth={handleAuth}
      />
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={PAYTM_BLUE} />
      <Header userName={profile?.name || 'User'} />
      
      {activeTab === 'home' && <HomeScreen balance={balance} transactions={transactions} />}
      {activeTab === 'history' && <HistoryScreen transactions={transactions} />}
      {activeTab === 'notifs' && <AlertsScreen notifications={notifications} />}
      {activeTab === 'profile' && <ProfileScreen profile={profile} logout={logout} />}
      
      <VoicePayModal visible={showVoicePay} onClose={() => setShowVoicePay(false)} pulseAnim={pulseAnim} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} setShowVoicePay={setShowVoicePay} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE },
});
