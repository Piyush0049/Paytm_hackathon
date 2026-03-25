import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Send, Gift, Smartphone, ScrollText, CreditCard } from 'lucide-react-native';
import { PAYTM_LIGHT_BLUE, WHITE, fonts } from '../styles/theme';

interface HistoryScreenProps {
  transactions: any[];
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ transactions }) => {
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
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
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
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  pageHeader: { padding: 24, paddingBottom: 10 },
  pageTitle: { fontSize: 26, fontFamily: fonts.bold, color: '#111' },
  txCardGlobal: { backgroundColor: WHITE, padding: 18, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  txIconWrapperGlobal: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfoGlobal: { flex: 1 },
  txRecipientGlobal: { fontSize: 16, fontFamily: fonts.bold, color: '#111' },
  txMetaGlobal: { fontSize: 13, fontFamily: fonts.medium, color: '#666', marginTop: 2 },
  txTimeGlobal: { fontSize: 11, fontFamily: fonts.regular, color: '#AAA', marginTop: 4 },
  txAmountGlobal: { fontSize: 17, fontFamily: fonts.bold },
});
