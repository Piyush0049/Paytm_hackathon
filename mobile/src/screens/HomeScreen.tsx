import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { QrCode, Smartphone, Landmark, Send, Zap, Tv, Car, ShieldCheck, ShieldAlert, Gift, ScrollText, CreditCard } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, fonts } from '../styles/theme';

interface HomeScreenProps {
  balance: any;
  transactions: any[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ balance, transactions }) => {
  const upiActions = [
    { id: 'scan', icon: QrCode, label: 'Scan & Pay' },
    { id: 'mobile', icon: Smartphone, label: 'To Mobile or\nContact' },
    { id: 'bank', icon: Landmark, label: 'To Bank or\nSelf A/c' },
    { id: 'upi', icon: Send, label: 'To UPI ID' },
  ];

  const rechargeActions = [
    { id: 'mob', icon: Smartphone, label: 'Mobile\nRecharge' },
    { id: 'elec', icon: Zap, label: 'Electricity' },
    { id: 'dth', icon: Tv, label: 'DTH' },
    { id: 'fast', icon: Car, label: 'FASTag\nRecharge' },
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transfer': return <Send size={24} color={PAYTM_LIGHT_BLUE} />;
      case 'Cashback': return <Gift size={24} color="#21C17C" />;
      case 'Recharge': return <Smartphone size={24} color="#FF9800" />;
      case 'Bill Payment': return <ScrollText size={24} color="#9C27B0" />;
      default: return <CreditCard size={24} color="#555" />;
    }
  };

  return (
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
                  <a.icon size={24} color={WHITE} />
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
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  blueBanner: { backgroundColor: PAYTM_BLUE, height: 88, width: '100%', position: 'absolute', top: 0 },
  homeContent: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  walletStrip: { backgroundColor: WHITE, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4, marginBottom: 16 },
  walletInfo: {},
  walletLabel: { color: '#666', fontSize: 13, fontFamily: fonts.semiBold },
  walletBal: { color: '#111', fontSize: 28, fontFamily: fonts.bold, marginTop: 2 },
  addMoneyBtn: { backgroundColor: PAYTM_BLUE, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  addMoneyText: { color: WHITE, fontFamily: fonts.bold, fontSize: 13 },
  aiProtectionCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  aiText: { color: '#1A531B', fontFamily: fonts.bold, fontSize: 14, marginLeft: 8 },
  aiScoreText: { color: '#1A531B', fontSize: 13, fontFamily: fonts.semiBold },
  sectionBlock: { backgroundColor: WHITE, borderRadius: 16, padding: 18, marginBottom: 16, elevation: 2 },
  sectionHeader: { fontSize: 16, fontFamily: fonts.bold, color: '#111', marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllLink: { color: PAYTM_LIGHT_BLUE, fontFamily: fonts.bold, fontSize: 13 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionItem: { width: '23%', alignItems: 'center', marginBottom: 16 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIconSolid: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: PAYTM_LIGHT_BLUE },
  actionLabel: { fontSize: 11, color: '#333', textAlign: 'center', fontFamily: fonts.medium, lineHeight: 14 },
  txCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  txIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfo: { flex: 1 },
  txRecipient: { fontSize: 15, fontFamily: fonts.semiBold, color: '#111' },
  txTime: { fontSize: 12, fontFamily: fonts.regular, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontFamily: fonts.bold },
});
