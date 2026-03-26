import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, StatusBar, Animated, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Modular Components
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, BACKGROUND_COLOR } from './src/styles/theme';
import { Header } from './src/layout/Header';
import { Navbar } from './src/layout/Navbar';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { TransferScreen } from './src/screens/TransferScreen';
import { RechargeScreen } from './src/screens/RechargeScreen';
import { VoicePayModal } from './src/components/VoicePayModal';
import { SuccessOverlay } from './src/components/SuccessOverlay';
import { QRModal } from './src/components/QRModal';
import { MockService } from './src/services/MockService';

// ⚠️ IMPORTANT: After restarting `python main.py`, copy the ngrok URL printed in the terminal and paste it below.
// Use the public tunnel unconditionally for off-network friends.
const BACKEND_LOCAL = 'http://192.168.1.6:8000';
const BACKEND_TUNNEL = 'https://paytm-voiceguard-new-25.loca.lt'; // tunnel URL for iOS

const BACKEND = BACKEND_TUNNEL; // Use tunnel for ALL devices so friends can access it!

const safeJson = async (res: Response) => {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { detail: 'Invalid server response' }; }
};

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
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showUserQR, setShowUserQR] = useState(false);
  const [scannedRecipient, setScannedRecipient] = useState<{id: string, name: string} | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showVoicePay, setShowVoicePay] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState({ visible: false, title: '', sub: '' });
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

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('authToken');
        const authTime = await AsyncStorage.getItem('authTime');
        if (savedToken && authTime) {
          // 24 hours in milliseconds = 86400000
          if (Date.now() - parseInt(authTime) < 86400000) {
            setToken(savedToken);
          } else {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('authTime');
          }
        }
      } catch (e) {
        console.error('Failed to load storage', e);
      }
    };
    checkLogin();
  }, []);

  const authFetch = async (endpoint: string, tkn?: string) => {
    const t = tkn || token;
    const res = await fetch(`${BACKEND}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' }
    });
    if (res.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authTime');
      setToken(null);
      throw new Error('Session expired');
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { throw new Error('Invalid response from server'); }
  };

  const loadAllData = async () => {
    try {
      const [p, b, t, n] = await Promise.all([
        authFetch('/user/profile'),
        authFetch('/user/balance'),
        authFetch('/user/transactions?limit=20'),
        authFetch('/user/notifications'),
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
          headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
          body: JSON.stringify({ 
            email: authEmail.toLowerCase().trim(), 
            password: authPassword, 
            is_login: authMode === 'login' 
          })
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
        setShowOtpField(true);
        setSuccessMsg({ visible: true, title: 'OTP Sent', sub: data.message || 'Check your email' });
      } else {
        const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/login';
        const body = authMode === 'signup'
          ? { email: authEmail.toLowerCase().trim(), name: authName, password: authPassword, otp: authOtp }
          : { email: authEmail.toLowerCase().trim(), password: authPassword, otp: authOtp };
        const res = await fetch(`${BACKEND}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
          body: JSON.stringify(body)
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.detail || 'Auth failed');
        setToken(data.token);
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('authTime', Date.now().toString());
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAuthLoading(false);
  };

  const handleTransfer = async (amount: number, recipient: string, password: string) => {
    setAuthLoading(true);
    try {
      const res = await fetch(`${BACKEND}/payment/upi`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
        body: JSON.stringify({ recipient, amount, password })
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.detail || 'Transfer failed');
      setSubScreen(null);
      setSuccessMsg({ visible: true, title: 'Money Sent', sub: `₹${amount} sent to ${data.recipient || recipient}` });
      loadAllData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAuthLoading(false);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('authTime');
    setToken(null);
    setAuthEmail(''); setAuthPassword(''); setAuthOtp(''); setAuthName('');
    setShowOtpField(false); setActiveTab('home');
  };

  const processVoicePlay = async () => {
    setShowVoicePay(true);
    setIsVoiceProcessing(false);
    setTimeout(() => setIsVoiceProcessing(true), 1500);
    
    setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append('audio', { uri: 'file:///mock_audio.wav', name: 'voice.wav', type: 'audio/wav' } as any);

        const res = await fetch(`${BACKEND}/payment/voice/process`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await safeJson(res);
        setShowVoicePay(false);
        setIsVoiceProcessing(false);
        if (!res.ok) throw new Error(data.detail || 'Voice payment failed');
        setSuccessMsg({ visible: true, title: 'Payment Successful', sub: `Sent ₹${data.amount} to ${data.recipient}` });
        loadAllData();
      } catch (e: any) {
        setShowVoicePay(false);
        setIsVoiceProcessing(false);
        Alert.alert('VoiceGuard Error', e.message);
      }
    }, 4000);
  };

  const handleRecharge = async (num: string, amt: number) => {
    setAuthLoading(true);
    try {
      const formData = new FormData();
      formData.append('mobile_number', num);
      formData.append('operator', 'Jio');
      formData.append('amount', amt.toString());

      const res = await fetch(`${BACKEND}/payment/recharge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.detail || 'Recharge failed');
      setSuccessMsg({ visible: true, title: 'Recharge Done', sub: `₹${amt} credited to ${num}` });
      loadAllData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAuthLoading(false);
  };

  const handleEnrollVoice = async () => {
    setAuthLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', { uri: 'file:///enroll_mock.wav', name: 'enroll.wav', type: 'audio/wav' } as any);

      const res = await fetch(`${BACKEND}/payment/voice/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.detail || 'Enrollment failed');
      setSuccessMsg({ visible: true, title: 'Voice Enrolled', sub: 'Your voice is your secure key' });
      loadAllData();
    } catch (e: any) { Alert.alert('Enrollment Error', e.message); }
    setAuthLoading(false);
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={PAYTM_LIGHT_BLUE} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!token) {
    return (
      <SafeAreaProvider>
        <AuthScreen
          authMode={authMode} setAuthMode={setAuthMode}
          authEmail={authEmail} setAuthEmail={setAuthEmail}
          authName={authName} setAuthName={setAuthName}
          authPassword={authPassword} setAuthPassword={setAuthPassword}
          authOtp={authOtp} setAuthOtp={setAuthOtp}
          showOtpField={showOtpField} setShowOtpField={setShowOtpField}
          authLoading={authLoading} handleAuth={handleAuth}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0D0D0D' : BACKGROUND_COLOR }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? '#000' : PAYTM_BLUE} />
        {subScreen !== 'scan' && <Header userName={profile?.name || 'User'} onProfilePress={() => setShowUserQR(true)} isDarkMode={isDarkMode} />}

        {activeTab === 'home' && (
          subScreen === 'scan' ? <ScanScreen 
            onBack={() => setSubScreen(null)} 
            onScan={(data) => { setScannedRecipient(data); setSubScreen('transfer'); }} 
            token={token}
            backendUrl={BACKEND}
          /> :
          subScreen === 'transfer' ? <TransferScreen 
            onBack={() => { setSubScreen(null); setScannedRecipient(null); }} 
            onTransfer={(a, r, p) => { setScannedRecipient(null); handleTransfer(a, r, p); }} 
            initialRecipient={scannedRecipient || undefined}
            isDarkMode={isDarkMode}
          /> :
          subScreen === 'recharge' ? <RechargeScreen onBack={() => setSubScreen(null)} onRecharge={(n, a) => { setSubScreen(null); handleRecharge(n, a); }} /> :
          subScreen === 'history' ? <HistoryScreen transactions={transactions} isDarkMode={isDarkMode} onBack={() => setSubScreen(null)} token={token} backendUrl={BACKEND} /> :
          <HomeScreen
            balance={balance}
            transactions={transactions}
            setSubScreen={setSubScreen}
            isDarkMode={isDarkMode}
            onAction={(type) => {
              if (type === 'scan' || type === 'upi') {
                setSubScreen(type === 'scan' ? 'scan' : 'transfer');
              } else if (type === 'mob') {
                setSubScreen('recharge');
              } else if (type === 'add') {
                Alert.alert('Add Money', 'Redirecting to secure gateway...');
              }
            }}
          />
        )}
        {activeTab === 'history' && <HistoryScreen transactions={transactions} isDarkMode={isDarkMode} token={token} backendUrl={BACKEND} />}
        {activeTab === 'notifs' && <AlertsScreen notifications={notifications} isDarkMode={isDarkMode} />}
        {activeTab === 'profile' && <ProfileScreen profile={profile} logout={logout} onEnroll={handleEnrollVoice} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}

        <VoicePayModal
          visible={showVoicePay}
          onClose={() => setShowVoicePay(false)}
          pulseAnim={pulseAnim}
          isProcessing={isVoiceProcessing}
        />
        {!subScreen && (
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setShowVoicePay={() => processVoicePlay()}
            isDarkMode={isDarkMode}
          />
        )}

        <SuccessOverlay 
          visible={successMsg.visible} 
          message={successMsg.title} 
          submessage={successMsg.sub}
          onFinish={() => setSuccessMsg({ ...successMsg, visible: false })}
        />

        <QRModal 
          visible={showUserQR} 
          onClose={() => setShowUserQR(false)} 
          profile={profile} 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE },
});
