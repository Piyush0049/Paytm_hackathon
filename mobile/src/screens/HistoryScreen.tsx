import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Send, Gift, Smartphone, ScrollText, CreditCard } from 'lucide-react-native';
import { PAYTM_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED } from '../styles/theme';

interface HistoryScreenProps {
  transactions: any[];
  isDarkMode?: boolean;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ transactions, isDarkMode = false }) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transfer': return <Send size={22} color={PAYTM_LIGHT_BLUE} />;
      case 'Cashback': return <Gift size={22} color="#21C17C" />;
      case 'Recharge': return <Smartphone size={22} color="#FF9800" />;
      case 'Bill Payment': return <ScrollText size={22} color="#9C27B0" />;
      default: return <CreditCard size={22} color="#555" />;
    }
  };

  const bg = isDarkMode ? DARK_BACKGROUND : '#F5F7FA';
  const surface = isDarkMode ? DARK_SURFACE : WHITE;
  const text = isDarkMode ? DARK_TEXT : '#111';
  const textMuted = isDarkMode ? DARK_TEXT_MUTED : '#666';
  const subtleIconBg = isDarkMode ? '#333' : '#F5F7FA';

  return (
    <ScrollView style={[s.screen, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeader}><Text style={[s.pageTitle, { color: text }]}>History</Text></View>
      {transactions.map((t, i) => (
        <View key={i} style={[s.txCardGlobal, { backgroundColor: surface }]}>
          <View style={[s.txIconWrapperGlobal, { backgroundColor: subtleIconBg }]}>{getCategoryIcon(t.category)}</View>
          <View style={s.txInfoGlobal}>
            <Text style={[s.txRecipientGlobal, { color: text }]}>{t.recipient}</Text>
            <Text style={[s.txMetaGlobal, { color: textMuted }]}>{t.memo}</Text>
            <Text style={[s.txTimeGlobal, { color: isDarkMode ? '#888' : '#AAA' }]}>{new Date(t.timestamp).toLocaleString()}</Text>
          </View>
          <Text style={[s.txAmountGlobal, { color: t.type === 'received' ? '#21C17C' : (isDarkMode ? '#E0E0E0' : '#333') }]}>
            {t.type === 'received' ? '+' : '-'}₹{t.amount}
          </Text>
        </View>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  pageHeader: { padding: 24, paddingBottom: 10 },
  pageTitle: { fontSize: 18, fontFamily: fonts.bold },
  txCardGlobal: { padding: 16, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  txIconWrapperGlobal: { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfoGlobal: { flex: 1 },
  txRecipientGlobal: { fontSize: 14, fontFamily: fonts.bold },
  txMetaGlobal: { fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  txTimeGlobal: { fontSize: 10, fontFamily: fonts.regular, marginTop: 4 },
  txAmountGlobal: { fontSize: 14, fontFamily: fonts.bold },
});
