import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  Mic, ShieldCheck, Zap, History, CheckCircle2, Fingerprint,
  Search, Bell, QrCode, UserPlus, Building2, Smartphone, Car,
  CreditCard, Plane, Train, Bus, Hotel, Wallet, Coins, LineChart,
  Gift, Tag, LayoutDashboard, ArrowLeft, ChevronRight, IndianRupee,
  Clock, TrendingUp, Shield, Phone, User as UserIcon, X, Send
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const BACKEND = 'http://192.168.1.6:8000'; // Change this to your backend IP

type AIStatus = 'idle' | 'recording_cmd' | 'parsing' | 'voice_match' | 'challenge' | 'otp_verify' | 'risk_scoring' | 'success' | 'failed';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeFeature, setActiveFeature] = useState('');

  // AI Flow State
  const [status, setStatus] = useState<AIStatus>('idle');
  const [paymentData, setPaymentData] = useState({ amount: 150, recipient: 'ABC', memo: 'groceries' });
  const [challengePhrase, setChallengePhrase] = useState("Suraj nikal aaya");
  const [otpCode, setOtpCode] = useState("7842");

  // Data States
  const [balance, setBalance] = useState(25430.50);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [creditScore, setCreditScore] = useState<any>(null);
  const [spending, setSpending] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Pay form
  const [payAmount, setPayAmount] = useState('');
  const [payTo, setPayTo] = useState('');
  const [payNote, setPayNote] = useState('');

  // Recharge form
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('jio');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'idle') {
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      if (status !== 'success' && status !== 'failed') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
          ])
        ).start();
      }
    } else {
      Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      pulseAnim.setValue(1);
    }
  }, [status]);

  const fetchData = async (endpoint: string, setter: (data: any) => void, key?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}${endpoint}`);
      const data = await res.json();
      setter(key ? data[key] : data);
    } catch (e) {
      // Use mock data if backend is unreachable
    }
    setLoading(false);
  };

  const runFlow = async () => {
    setStatus('recording_cmd');
    await new Promise(r => setTimeout(r, 2500));
    setStatus('parsing');
    await new Promise(r => setTimeout(r, 1500));
    setStatus('voice_match');
    await new Promise(r => setTimeout(r, 2000));
    setStatus('challenge');
    await new Promise(r => setTimeout(r, 3000));
    setStatus('otp_verify');
    await new Promise(r => setTimeout(r, 3000));
    setStatus('risk_scoring');
    await new Promise(r => setTimeout(r, 1500));
    setStatus('success');
    setTimeout(() => { setStatus('idle'); }, 4000);
  };

  const navTo = (screen: string, featureName: string = '') => {
    if (featureName) setActiveFeature(featureName);
    setCurrentScreen(screen);

    // Fetch data based on screen
    if (screen === 'history') {
      fetchData('/user/transactions?limit=20', (d) => setTransactions(d.transactions || []));
      fetchData('/user/balance', (d) => setBalance(d.balance || 25430.50));
    }
    if (screen === 'notifications') fetchData('/notifications', (d) => setNotifications(d.notifications || []));
    if (screen === 'credit_score') fetchData('/finance/credit-score', setCreditScore);
    if (screen === 'spending') fetchData('/finance/spending', setSpending);
    if (screen === 'recharge') fetchData(`/recharge/plans?operator=${selectedOperator}`, (d) => setPlans(d.plans || []));
    if (screen === 'offers') fetchData('/offers', (d) => setOffers(d.offers || []));
    if (screen === 'profile') fetchData('/user/profile', setProfile);
  };

  const doPayment = async () => {
    if (!payAmount || !payTo) { Alert.alert('Error', 'Enter amount and recipient'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/payment/execute`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: 'user_123', amount: parseFloat(payAmount), recipient: payTo, memo: payNote })
      });
      const data = await res.json();
      Alert.alert('✅ Payment Successful', data.message);
      setBalance(data.new_balance);
      setPayAmount(''); setPayTo(''); setPayNote('');
      navTo('home');
    } catch (e) { Alert.alert('Payment Simulated', `₹${payAmount} sent to ${payTo}`); navTo('home'); }
    setLoading(false);
  };

  const doRecharge = async (plan: any) => {
    if (!rechargeNumber) { Alert.alert('Error', 'Enter mobile number'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/recharge/execute`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: 'user_123', mobile_number: rechargeNumber, operator: selectedOperator, amount: plan.amount })
      });
      const data = await res.json();
      Alert.alert('✅ Recharge Done', data.message);
      navTo('home');
    } catch (e) { Alert.alert('Recharge Simulated', `₹${plan.amount} recharged for ${rechargeNumber}`); navTo('home'); }
    setLoading(false);
  };

  // ─── Sub-Screen Header ───────────────────────────────────────
  const SubHeader = ({ title }: { title: string }) => (
    <>
      <SafeAreaView style={{backgroundColor: '#012B5D'}} />
      <View style={s.subHeader}>
        <TouchableOpacity onPress={() => navTo('home')} style={{padding: 8}}><ArrowLeft color="#FFF" size={24} /></TouchableOpacity>
        <Text style={s.subHeaderText}>{title}</Text>
        <View style={{width: 40}} />
      </View>
    </>
  );

  // ─── Voice Overlay ────────────────────────────────────────────
  const renderVoiceOverlay = () => {
    if (status === 'idle') return null;
    const labels: Record<string, any> = {
      recording_cmd: { label: 'LISTENING...', sub: '"Hey Paytm, pay 150 to ABC..."' },
      parsing: { label: 'NLP PROCESSING...' },
      voice_match: { label: 'VOICE BIOMETRICS', icon: <ShieldCheck color="#00BAF2" size={80} />, sub: 'Matching voiceprint...' },
      challenge: { label: 'LIVENESS CHECK' },
      otp_verify: { label: 'SPOKEN OTP' },
      risk_scoring: { label: 'AI RISK SCORING', icon: <Zap color="#FFD600" size={60} />, sub: 'Analyzing behavioral patterns...' },
      success: { label: '', icon: <CheckCircle2 color="#00C853" size={100} /> },
    };
    const st = labels[status] || {};
    return (
      <Animated.View style={[s.voiceOverlay, { opacity: overlayAnim }]}>
        <View style={s.overlayInner}>
          {st.label ? <Text style={s.overlayLabel}>{st.label}</Text> : null}
          {status === 'parsing' && (
            <View style={s.parsedBoxMobile}>
              <Text style={s.parsedLabelMobile}>PAYING: <Text style={s.parsedValueMobile}>₹{paymentData.amount}</Text></Text>
              <Text style={s.parsedLabelMobile}>TO: <Text style={s.parsedValueMobile}>{paymentData.recipient}</Text></Text>
            </View>
          )}
          {status === 'recording_cmd' && <Text style={s.overlayTranscript}>{st.sub}</Text>}
          {status === 'challenge' && (
            <>
              <Text style={s.challengePromptText}>Say the challenge phrase:</Text>
              <View style={s.phraseBox}><Text style={s.phraseText}>"{challengePhrase}"</Text></View>
            </>
          )}
          {status === 'otp_verify' && (
            <>
              <Text style={s.challengePromptText}>Code: <Text style={{fontWeight:'900', color:'#00BAF2'}}>{otpCode}</Text></Text>
              <Fingerprint color="#00BAF2" size={60} style={{marginTop: 20}} />
            </>
          )}
          {st.icon}
          {status === 'success' && <Text style={s.successTitleMobile}>Sent ₹{paymentData.amount}</Text>}
          {st.sub && status !== 'recording_cmd' && <Text style={s.overlaySub}>{st.sub}</Text>}
        </View>
        <Animated.View style={[s.micOverlayContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Mic color="#00BAF2" size={40} />
        </Animated.View>
      </Animated.View>
    );
  };

  // ─── PAY ANYONE SCREEN ────────────────────────────────────────
  const renderPayScreen = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Pay Anyone" />
      <ScrollView style={{padding:16}}>
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Send Money</Text>
          <Text style={s.inputLabel}>Recipient Name / UPI ID</Text>
          <TextInput style={s.input} placeholder="e.g. Ramesh or ramesh@paytm" placeholderTextColor="#AAA" value={payTo} onChangeText={setPayTo} />
          <Text style={s.inputLabel}>Amount (₹)</Text>
          <TextInput style={s.input} placeholder="Enter amount" placeholderTextColor="#AAA" keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
          <Text style={s.inputLabel}>Note (optional)</Text>
          <TextInput style={s.input} placeholder="e.g. lunch, groceries" placeholderTextColor="#AAA" value={payNote} onChangeText={setPayNote} />
          <TouchableOpacity style={s.primaryBtn} onPress={doPayment}>
            {loading ? <ActivityIndicator color="#FFF" /> : <><Send color="#FFF" size={18} style={{marginRight: 8}} /><Text style={s.primaryBtnText}>Pay Now</Text></>}
          </TouchableOpacity>
        </View>
        <Text style={s.orText}>— OR —</Text>
        <TouchableOpacity style={s.voicePayAlt} onPress={runFlow}>
          <Mic color="#FFF" size={20} style={{marginRight: 8}} />
          <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 16}}>Use Voice Pay Instead</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ─── BALANCE & HISTORY SCREEN ─────────────────────────────────
  const renderHistoryScreen = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Balance & History" />
      <View style={s.balanceCard}>
        <Text style={{color:'rgba(255,255,255,0.7)', fontSize: 14}}>Available Balance</Text>
        <Text style={{color:'#FFF', fontSize: 36, fontWeight: '900'}}>₹{balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</Text>
      </View>
      <Text style={{paddingHorizontal:16, paddingTop: 16, fontWeight: 'bold', color: '#333', fontSize: 15}}>Recent Transactions</Text>
      {loading ? <ActivityIndicator style={{marginTop: 30}} /> : (
        <FlatList
          data={transactions}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerStyle={{padding: 16}}
          renderItem={({item}) => (
            <View style={s.txnItem}>
              <View style={[s.txnIcon, {backgroundColor: item.type === 'received' ? '#E8F5E9' : '#FFF3E0'}]}>
                {item.type === 'received' ? <TrendingUp color="#00C853" size={18}/> : <Send color="#FF6D00" size={18}/>}
              </View>
              <View style={{flex:1, marginLeft: 12}}>
                <Text style={{fontWeight:'bold', color:'#1B2631', fontSize: 14}}>{item.recipient}</Text>
                <Text style={{color:'#888', fontSize: 11}}>{item.memo} • {new Date(item.timestamp).toLocaleDateString()}</Text>
              </View>
              <Text style={{fontWeight:'900', color: item.type === 'received' ? '#00C853' : '#333', fontSize: 15}}>
                {item.type === 'received' ? '+' : '-'}₹{item.amount}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{textAlign:'center', color:'#888', marginTop: 30}}>No transactions yet</Text>}
        />
      )}
    </View>
  );

  // ─── MOBILE RECHARGE SCREEN ───────────────────────────────────
  const renderRechargeScreen = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Mobile Recharge" />
      <ScrollView style={{padding:16}}>
        <View style={s.sectionCard}>
          <Text style={s.inputLabel}>Mobile Number</Text>
          <TextInput style={s.input} placeholder="Enter 10 digit number" placeholderTextColor="#AAA" keyboardType="phone-pad" value={rechargeNumber} onChangeText={setRechargeNumber} maxLength={10} />
          <Text style={[s.inputLabel, {marginTop: 12}]}>Select Operator</Text>
          <View style={{flexDirection:'row', gap: 10, marginTop: 8}}>
            {['jio', 'airtel', 'vi'].map(op => (
              <TouchableOpacity key={op} onPress={() => { setSelectedOperator(op); fetchData(`/recharge/plans?operator=${op}`, (d) => setPlans(d.plans || [])); }}
                style={[s.opPill, selectedOperator === op && s.opPillActive]}>
                <Text style={[s.opPillText, selectedOperator === op && {color:'#FFF'}]}>{op.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={{fontWeight:'bold', color:'#333', fontSize: 15, marginBottom: 12, marginTop: 4}}>Available Plans</Text>
        {plans.map((plan: any) => (
          <View key={plan.id} style={s.planCard}>
            <View style={{flex:1}}>
              <Text style={{fontWeight:'900', color:'#012B5D', fontSize: 18}}>₹{plan.amount}</Text>
              <Text style={{color:'#555', fontSize: 12, marginTop: 4}}>{plan.data} • {plan.validity}</Text>
              <Text style={{color:'#888', fontSize: 11}}>{plan.name}</Text>
            </View>
            <TouchableOpacity style={s.smallBtn} onPress={() => doRecharge(plan)}>
              <Text style={{color:'#FFF', fontWeight:'bold', fontSize: 13}}>Recharge</Text>
            </TouchableOpacity>
          </View>
        ))}
        {plans.length === 0 && <Text style={{textAlign:'center', color:'#888', marginTop: 20}}>Enter number to see plans</Text>}
      </ScrollView>
    </View>
  );

  // ─── NOTIFICATIONS SCREEN ─────────────────────────────────────
  const renderNotifications = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Notifications" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{padding: 16}}
        renderItem={({item}) => (
          <View style={[s.notifItem, !item.read && {borderLeftWidth: 3, borderLeftColor: '#00BAF2'}]}>
            <Text style={{fontWeight:'bold', color:'#1B2631', fontSize: 14}}>{item.title}</Text>
            <Text style={{color:'#555', fontSize: 12, marginTop: 4}}>{item.body}</Text>
            <Text style={{color:'#AAA', fontSize: 10, marginTop: 6}}>{item.time}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{textAlign:'center', color:'#888', marginTop: 30}}>No notifications</Text>}
      />
    </View>
  );

  // ─── CREDIT SCORE SCREEN ──────────────────────────────────────
  const renderCreditScore = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Credit Score" />
      <ScrollView style={{padding: 16}}>
        {creditScore ? (
          <>
            <View style={[s.sectionCard, {alignItems: 'center', paddingVertical: 30}]}>
              <View style={s.scoreCircle}>
                <Text style={{fontSize: 42, fontWeight:'900', color:'#012B5D'}}>{creditScore.score}</Text>
              </View>
              <Text style={{fontSize: 20, fontWeight:'bold', color: creditScore.score >= 750 ? '#00C853' : '#FF6D00', marginTop: 16}}>{creditScore.rating}</Text>
              <Text style={{color:'#888', marginTop: 4, fontSize: 12}}>Last updated: {new Date(creditScore.last_updated).toLocaleDateString()}</Text>
            </View>
            <Text style={{fontWeight:'bold', color:'#333', fontSize: 15, marginBottom: 12}}>Score Factors</Text>
            {creditScore.factors?.map((f: any, i: number) => (
              <View key={i} style={s.factorRow}>
                <View style={{flex:1}}>
                  <Text style={{fontWeight:'bold', color:'#1B2631'}}>{f.name}</Text>
                  <Text style={{color:'#888', fontSize: 11}}>Impact: {f.impact}</Text>
                </View>
                <View style={[s.statusPill, {backgroundColor: f.status === 'Good' ? '#E8F5E9' : '#FFF3E0'}]}>
                  <Text style={{fontSize: 11, fontWeight:'bold', color: f.status === 'Good' ? '#00C853' : '#FF6D00'}}>{f.status}</Text>
                </View>
              </View>
            ))}
          </>
        ) : <ActivityIndicator style={{marginTop: 30}} />}
      </ScrollView>
    </View>
  );

  // ─── SPENDING TRACKER SCREEN ──────────────────────────────────
  const renderSpending = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Track Your Spends" />
      <ScrollView style={{padding: 16}}>
        {spending ? (
          <>
            <View style={[s.sectionCard, {alignItems: 'center'}]}>
              <Text style={{color:'#888', fontSize: 14}}>{spending.month}</Text>
              <Text style={{fontSize: 36, fontWeight:'900', color:'#012B5D', marginTop: 8}}>₹{spending.total_spent?.toLocaleString()}</Text>
              <Text style={{color:'#00C853', fontSize: 13, marginTop: 4}}>₹{spending.savings?.toLocaleString()} saved this month</Text>
              <View style={s.budgetBar}>
                <View style={[s.budgetFill, {width: `${Math.min(100, (spending.total_spent / spending.budget_limit) * 100)}%`}]} />
              </View>
              <Text style={{color:'#888', fontSize: 11, marginTop: 6}}>Budget: ₹{spending.budget_limit?.toLocaleString()}</Text>
            </View>
            <Text style={{fontWeight:'bold', color:'#333', fontSize: 15, marginBottom: 12}}>Category Breakdown</Text>
            {Object.entries(spending.categories || {}).map(([cat, amt]: any, i: number) => (
              <View key={i} style={s.catRow}>
                <Text style={{flex:1, fontWeight:'bold', color:'#1B2631'}}>{cat}</Text>
                <Text style={{fontWeight:'900', color:'#012B5D'}}>₹{amt.toLocaleString()}</Text>
              </View>
            ))}
          </>
        ) : <ActivityIndicator style={{marginTop: 30}} />}
      </ScrollView>
    </View>
  );

  // ─── OFFERS SCREEN ────────────────────────────────────────────
  const renderOffers = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Deals & Offers" />
      <ScrollView style={{padding: 16}}>
        {offers.map((offer: any) => (
          <View key={offer.id} style={s.offerCard}>
            <Text style={{fontWeight:'900', color:'#012B5D', fontSize: 16}}>{offer.title}</Text>
            <Text style={{color:'#555', fontSize: 13, marginTop: 4}}>{offer.desc}</Text>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop: 12}}>
              <View style={s.codePill}><Text style={{color:'#00BAF2', fontWeight:'bold', fontSize: 12}}>{offer.code}</Text></View>
              <Text style={{color:'#AAA', fontSize: 10}}>Valid till {offer.valid_until}</Text>
            </View>
          </View>
        ))}
        {offers.length === 0 && <ActivityIndicator style={{marginTop: 30}} />}
      </ScrollView>
    </View>
  );

  // ─── PROFILE SCREEN ──────────────────────────────────────────
  const renderProfile = () => (
    <View style={{flex:1, backgroundColor:'#F2F6FC'}}>
      <SubHeader title="Profile Settings" />
      <ScrollView style={{padding: 16}}>
        {profile ? (
          <>
            <View style={[s.sectionCard, {alignItems:'center', paddingVertical: 30}]}>
              <View style={[s.profileBtnLg]}><Text style={{color:'#FFF', fontSize: 28, fontWeight:'900'}}>{profile.name?.[0]}</Text></View>
              <Text style={{fontSize: 22, fontWeight:'900', color:'#1B2631', marginTop: 12}}>{profile.name}</Text>
              <Text style={{color:'#888', fontSize: 14}}>{profile.phone}</Text>
              <Text style={{color:'#00BAF2', fontSize: 13, marginTop: 4}}>{profile.upi_id}</Text>
            </View>
            <View style={s.sectionCard}>
              <ProfileRow label="KYC Status" value={profile.kyc_status === 'verified' ? '✅ Verified' : '❌ Pending'} />
              <ProfileRow label="Voice Enrolled" value={profile.voice_enrolled ? '🎙️ Active' : '❌ Not Enrolled'} />
              <ProfileRow label="Balance" value={`₹${profile.balance?.toLocaleString()}`} />
              <ProfileRow label="Gold Coins" value={`🪙 ${profile.gold_coins}`} />
              <ProfileRow label="Member Since" value={profile.member_since} last />
            </View>
            <TouchableOpacity style={[s.sectionCard, {flexDirection:'row', alignItems:'center'}]}>
              <Shield color="#FF3D00" size={20} style={{marginRight: 12}} />
              <Text style={{fontWeight:'bold', color:'#FF3D00', fontSize: 14}}>AI VoiceGuard Security Settings</Text>
              <ChevronRight color="#FF3D00" size={18} style={{marginLeft:'auto'}} />
            </TouchableOpacity>
          </>
        ) : <ActivityIndicator style={{marginTop: 30}} />}
      </ScrollView>
    </View>
  );

  const ProfileRow = ({label, value, last}: {label: string, value: string, last?: boolean}) => (
    <View style={[s.profileRow, !last && {borderBottomWidth: 1, borderBottomColor: '#F0F0F0'}]}>
      <Text style={{color:'#888', fontSize: 13}}>{label}</Text>
      <Text style={{fontWeight:'bold', color:'#1B2631', fontSize: 14}}>{value}</Text>
    </View>
  );

  // ─── HOME SCREEN ──────────────────────────────────────────────
  const renderHome = () => (
    <View style={s.container}>
      <SafeAreaView style={{ backgroundColor: '#FFF' }}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => navTo('profile')} style={s.profileBtn}>
              <Text style={s.profileText}>PJ</Text>
            </TouchableOpacity>
            <View style={s.logoContainer}>
              <Text style={s.paytmText}>paytm <Text style={{color: '#00BAF2'}}>❤️</Text> <Text style={s.upiText}>UPI</Text></Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity onPress={() => navTo('feature', 'Search')} style={s.headerIcon}><Search color="#333" size={24} /></TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('notifications')} style={s.headerIcon}><Bell color="#333" size={24} /></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={s.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 150}}>
        {/* UPI Money Transfer */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>UPI Money Transfer</Text>
          <View style={s.upiActions}>
            <TouchableOpacity onPress={() => navTo('feature', 'Scan QR Code')} style={s.upiActionBtn}>
              <View style={[s.upiIconContainer, { backgroundColor: '#022e6b' }]}><QrCode color="#FFF" size={24} /></View>
              <Text style={s.upiActionText}>Scan any QR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('pay')} style={s.upiActionBtn}>
              <View style={[s.upiIconContainer, { backgroundColor: '#022e6b' }]}><UserPlus color="#FFF" size={24} /></View>
              <Text style={s.upiActionText}>Pay Anyone</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Bank Transfer')} style={s.upiActionBtn}>
              <View style={[s.upiIconContainer, { backgroundColor: '#022e6b' }]}><Building2 color="#FFF" size={24} /></View>
              <Text style={s.upiActionText}>To Bank A/c</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('history')} style={s.upiActionBtn}>
              <View style={[s.upiIconContainer, { backgroundColor: '#022e6b' }]}><History color="#FFF" size={24} /></View>
              <Text style={s.upiActionText}>Balance & History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recharge & Bills */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeaderLine}>
            <Text style={s.sectionTitle}>Recharge & Bills</Text>
            <TouchableOpacity onPress={() => navTo('feature', 'All Recharges')}><Text style={s.viewMore}>View More</Text></TouchableOpacity>
          </View>
          <View style={s.gridContainer}>
            <TouchableOpacity onPress={() => navTo('recharge')} style={s.gridItem}>
              <View style={s.gridIconBox}><Smartphone color="#00BAF2" size={28} /></View>
              <Text style={s.gridText}>Mobile Recharge</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'FASTag Recharge')} style={s.gridItem}>
              <View style={s.gridIconBox}><Car color="#00BAF2" size={28} /></View>
              <Text style={s.gridText}>FASTag Recharge</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Electricity Bill')} style={s.gridItem}>
              <View style={s.gridIconBox}><Zap color="#00BAF2" size={28} /></View>
              <Text style={s.gridText}>Electricity Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Loan EMI')} style={s.gridItem}>
              <View style={s.gridIconBox}><CreditCard color="#00BAF2" size={28} /></View>
              <Text style={s.gridText}>Loan EMI Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Travel & Tickets */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Travel & Tickets</Text>
          <View style={s.gridContainer}>
            <TouchableOpacity onPress={() => navTo('feature', 'Flights')} style={s.gridItem}>
              <View style={s.gridIconBox}><Plane color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Flight</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Trains')} style={s.gridItem}>
              <View style={s.gridIconBox}><Train color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Train</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Buses')} style={s.gridItem}>
              <View style={s.gridIconBox}><Bus color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Bus</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Hotels')} style={s.gridItem}>
              <View style={s.gridIconBox}><Hotel color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Hotels</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.pillRow, {marginTop: 15}]}>
            <TouchableOpacity onPress={() => navTo('feature', 'Delhi Metro')} style={s.greyPill}>
              <Train color="#E91E63" size={14} style={{marginRight: 6}} /><Text style={s.greyPillText}>Delhi Metro</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Travel Pass')} style={s.greyPill}>
              <Plane color="#00BAF2" size={14} style={{marginRight: 6}} /><Text style={s.greyPillText}>Travel Pass at ₹999</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Financial Services */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Financial Services</Text>
          <View style={s.gridContainer}>
            <TouchableOpacity onPress={() => navTo('feature', 'Loan')} style={s.gridItem}>
              <View style={s.gridIconBox}><Wallet color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Loan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Car Insurance')} style={s.gridItem}>
              <View style={s.gridIconBox}><Car color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Car Insurance</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Save in Silver')} style={s.gridItem}>
              <View style={s.gridIconBox}><Coins color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Save in Silver</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Stocks')} style={s.gridItem}>
              <View style={s.gridIconBox}><LineChart color="#012B5D" size={26} /></View>
              <Text style={s.gridText}>Stocks</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Free Tools */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Free Tools</Text>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <TouchableOpacity onPress={() => navTo('credit_score')} style={[s.toolCard, {backgroundColor:'#E8F5E9'}]}><Text style={s.toolTitle}>Check Your Credit Score</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('offers')} style={[s.toolCard, {backgroundColor:'#FFFDE7'}]}><Text style={s.toolTitle}>EMI Offers Near You</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('spending')} style={[s.toolCard, {backgroundColor:'#FFEBEE'}]}><Text style={s.toolTitle}>Track Your Spends</Text></TouchableOpacity>
          </View>
        </View>

        {/* Do More */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Do More with Paytm</Text>
          <View style={s.gridContainer}>
            <TouchableOpacity onPress={() => navTo('offers')} style={s.gridItem}>
              <View style={s.gridIconBox}><Tag color="#012B5D" size={24} /></View>
              <Text style={s.gridText}>Claim Deals</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'Gift Vouchers')} style={s.gridItem}>
              <View style={s.gridIconBox}><Gift color="#012B5D" size={24} /></View>
              <Text style={s.gridText}>Gift Vouchers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('offers')} style={s.gridItem}>
              <View style={s.gridIconBox}><Coins color="#012B5D" size={24} /></View>
              <Text style={s.gridText}>Cashback</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navTo('feature', 'See All')} style={s.gridItem}>
              <View style={s.gridIconBox}><LayoutDashboard color="#012B5D" size={24} /></View>
              <Text style={s.gridText}>See All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Refer */}
        <View style={[s.sectionCard, {alignItems: 'center', paddingVertical: 24}]}>
          <Text style={{fontSize: 16, fontWeight:'900', color:'#1B2631'}}>You ❤️ Paytm</Text>
          <Text style={{color:'#888', marginTop: 4, textAlign:'center', fontSize: 12}}>Your friends are going to love us too!</Text>
          <TouchableOpacity style={s.referBtn}>
            <Text style={{color:'#00BAF2', fontWeight:'bold'}}>Refer & Win up to ₹200 →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={s.fabContainer}>
        <TouchableOpacity style={s.fab} onPress={runFlow}>
          <Mic color="#FFF" size={22} style={{ marginRight: 8 }} />
          <Text style={s.fabText}>Voice Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── GENERIC FEATURE SCREEN ───────────────────────────────────
  const renderGenericScreen = () => (
    <View style={{flex: 1, backgroundColor: '#FFF'}}>
      <SubHeader title={activeFeature} />
      <View style={s.genericContent}>
        <ShieldCheck color="#E1E5EA" size={100} style={{marginBottom: 20}} />
        <Text style={s.genericTitle}>{activeFeature}</Text>
        <Text style={s.genericSub}>This service is available within the VoiceGuard ecosystem. Use Voice Pay to securely transact.</Text>
        <TouchableOpacity onPress={runFlow} style={s.inAppVoiceBtn}>
          <Mic color="#FFF" size={20} style={{marginRight: 8}} />
          <Text style={s.inAppVoiceText}>Use Voice Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── ROUTER ───────────────────────────────────────────────────
  const renderScreen = () => {
    switch(currentScreen) {
      case 'home': return renderHome();
      case 'pay': return renderPayScreen();
      case 'history': return renderHistoryScreen();
      case 'recharge': return renderRechargeScreen();
      case 'notifications': return renderNotifications();
      case 'credit_score': return renderCreditScore();
      case 'spending': return renderSpending();
      case 'offers': return renderOffers();
      case 'profile': return renderProfile();
      default: return renderGenericScreen();
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
      {renderVoiceOverlay()}
    </>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  profileBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center' },
  profileText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  logoContainer: { marginLeft: 14 },
  paytmText: { fontSize: 18, fontWeight: '900', color: '#012B5D', letterSpacing: -0.5 },
  upiText: { color: '#012B5D', fontStyle: 'italic', fontWeight: '800' },
  headerRight: { flexDirection: 'row' },
  headerIcon: { marginLeft: 20 },
  scrollContent: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1B2631', marginBottom: 20 },
  upiActions: { flexDirection: 'row', justifyContent: 'space-between' },
  upiActionBtn: { alignItems: 'center', width: (width - 64) / 4 },
  upiIconContainer: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  upiActionText: { fontSize: 11, color: '#1B2631', textAlign: 'center', fontWeight: '500' },
  sectionHeaderLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  viewMore: { color: '#00BAF2', fontSize: 13, fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { alignItems: 'center', width: (width - 64) / 4 },
  gridIconBox: { marginBottom: 12 },
  gridText: { fontSize: 11, color: '#444', textAlign: 'center', fontWeight: '500' },
  pillRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  greyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  greyPillText: { fontSize: 10, color: '#555', fontWeight: 'bold' },
  toolCard: { width: (width - 76) / 3, padding: 12, borderRadius: 12, height: 120 },
  toolTitle: { fontSize: 12, fontWeight: 'bold', color: '#222' },
  fabContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  fab: { flexDirection: 'row', backgroundColor: '#022e6b', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 30, alignItems: 'center', shadowColor: '#012B5D', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.35, shadowRadius: 10, elevation: 12 },
  fabText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  voiceOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,15,30,0.90)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  overlayInner: { alignItems: 'center', paddingHorizontal: 30 },
  overlayLabel: { color: '#00BAF2', fontWeight: '900', letterSpacing: 2, fontSize: 16, marginBottom: 20 },
  overlayTranscript: { color: '#FFF', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  overlaySub: { color: 'rgba(255,255,255,0.7)', marginTop: 15, textAlign: 'center', fontSize: 16 },
  micOverlayContainer: { marginTop: 50, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0,186,242,0.15)', justifyContent: 'center', alignItems: 'center' },
  parsedBoxMobile: { marginTop: 30, backgroundColor: 'rgba(255,255,255,0.08)', padding: 25, borderRadius: 16, width: width * 0.8 },
  parsedLabelMobile: { color: 'rgba(255,255,255,0.5)', marginBottom: 5, fontSize: 14 },
  parsedValueMobile: { color: '#FFF', fontWeight: 'bold', fontSize: 22 },
  challengePromptText: { color: '#FFF', fontSize: 20, marginBottom: 25, textAlign: 'center' },
  phraseBox: { padding: 20, borderWidth: 2, borderColor: '#FFD600', borderRadius: 12, backgroundColor: 'rgba(255,214,0,0.05)' },
  phraseText: { color: '#FFD600', fontSize: 24, fontWeight: '900' },
  successTitleMobile: { color: '#00C853', fontSize: 32, fontWeight: '900', marginTop: 24 },
  subHeader: { backgroundColor: '#012B5D', flexDirection: 'row', alignItems: 'center', padding: 15, justifyContent: 'space-between' },
  subHeaderText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  genericContent: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' },
  genericTitle: { fontSize: 26, fontWeight: '900', color: '#1B2631', marginBottom: 15, textAlign: 'center' },
  genericSub: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  inAppVoiceBtn: { flexDirection: 'row', backgroundColor: '#00BAF2', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  inAppVoiceText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  // Extra styles for new screens
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, fontSize: 15, color: '#1B2631', borderWidth: 1, borderColor: '#E8ECEF' },
  primaryBtn: { flexDirection: 'row', backgroundColor: '#022e6b', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  orText: { textAlign: 'center', color: '#AAA', marginVertical: 20, fontWeight: 'bold' },
  voicePayAlt: { flexDirection: 'row', backgroundColor: '#00BAF2', padding: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { backgroundColor: '#012B5D', padding: 24, margin: 16, borderRadius: 16 },
  txnItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  txnIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  notifItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10 },
  scoreCircle: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, borderColor: '#00BAF2', justifyContent: 'center', alignItems: 'center' },
  factorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 10 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  budgetBar: { width: '80%', height: 8, backgroundColor: '#E8ECEF', borderRadius: 10, marginTop: 16, overflow: 'hidden' },
  budgetFill: { height: '100%', backgroundColor: '#00BAF2', borderRadius: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 8 },
  opPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E8ECEF' },
  opPillActive: { backgroundColor: '#022e6b', borderColor: '#022e6b' },
  opPillText: { fontWeight: 'bold', color: '#555' },
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, elevation: 1 },
  smallBtn: { backgroundColor: '#00BAF2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  offerCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  codePill: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  profileBtnLg: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center' },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  referBtn: { borderWidth: 1, borderColor: '#00BAF2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 16 },
});
