import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ArrowLeft, User, ShieldCheck } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, WHITE, fonts, DARK_BACKGROUND, DARK_SURFACE, DARK_TEXT, DARK_TEXT_MUTED } from '../styles/theme';

interface TransferScreenProps {
  onBack: () => void;
  onTransfer: (amount: number, recipient: string) => void;
  initialRecipient?: { id: string; name: string };
  isDarkMode?: boolean;
}

export const TransferScreen: React.FC<TransferScreenProps> = ({ onBack, onTransfer, initialRecipient, isDarkMode = false }) => {
  const [recipient, setRecipient] = useState(initialRecipient?.id || '');
  const [recipientName] = useState(initialRecipient?.name || 'Unknown Recipient');
  const [amount, setAmount] = useState('');

  const bg = isDarkMode ? DARK_BACKGROUND : '#F5F7FA';
  const surface = isDarkMode ? DARK_SURFACE : WHITE;
  const text = isDarkMode ? DARK_TEXT : '#111';
  const textMuted = isDarkMode ? DARK_TEXT_MUTED : '#666';

  const handleSend = () => {
    if (!recipient || !amount) return;
    onTransfer(parseFloat(amount), recipient);
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.header, { backgroundColor: bg }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ArrowLeft size={24} color={text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: text }]}>Transfer Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Detailed Recipient Banner (Only if scanned) */}
          {initialRecipient ? (
            <View style={s.recipientBanner}>
              <View style={s.avatarBig}>
                <Text style={s.avatarBigText}>{(initialRecipient.name || 'U')[0].toUpperCase()}</Text>
              </View>
              <Text style={[s.recipientName, { color: text }]}>{initialRecipient.name}</Text>
              <Text style={[s.recipientId, { color: textMuted }]}>UPI ID: {initialRecipient.id}</Text>

              <View style={s.verifiedBadge}>
                <ShieldCheck size={14} color="#21C17C" style={{ marginRight: 4 }} />
                <Text style={s.verifiedText}>Verified Paytm User</Text>
              </View>
            </View>
          ) : (
            <View style={[s.inputGroup, { backgroundColor: surface }]}>
              <Text style={[s.label, { color: textMuted }]}>Send To (UPI ID / Mobile Number)</Text>
              <TextInput
                style={[s.input, { color: text, borderColor: isDarkMode ? '#333' : '#EEE' }]}
                placeholder="Enter recipient UPI ID"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Amount Input */}
          <View style={s.amountContainer}>
            <Text style={[s.amountSymbol, { color: text }]}>₹</Text>
            <TextInput
              style={[s.amountInput, { color: text }]}
              placeholder="0"
              placeholderTextColor={isDarkMode ? '#333' : '#CCC'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus={!!initialRecipient}
            />
          </View>

          {amount ? (
            <Text style={[s.amountWords, { color: textMuted }]}>
              Rupees {amount} only
            </Text>
          ) : null}

        </ScrollView>

        {/* Sticky Pay Button */}
        <View style={[s.footer, { backgroundColor: bg, borderTopColor: isDarkMode ? '#333' : '#E0E0E0' }]}>
          <TouchableOpacity
            style={[s.payBtn, (!recipient || !amount) && s.payBtnDisabled]}
            onPress={handleSend}
            disabled={!recipient || !amount}
          >
            <Text style={s.payBtnText}>Pay ₹{amount || '0'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold },

  scrollContent: { padding: 20, alignItems: 'center' },

  recipientBanner: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: PAYTM_LIGHT_BLUE, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4 },
  avatarBigText: { fontSize: 36, fontFamily: fonts.bold, color: WHITE },
  recipientName: { fontSize: 24, fontFamily: fonts.bold, marginBottom: 4 },
  recipientId: { fontSize: 14, fontFamily: fonts.medium, marginBottom: 12 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { fontSize: 11, fontFamily: fonts.bold, color: '#1A531B' },

  inputGroup: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 30, elevation: 2 },
  label: { fontSize: 12, fontFamily: fonts.medium, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, fontFamily: fonts.medium },

  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  amountSymbol: { fontSize: 40, fontFamily: fonts.regular, marginRight: 8, marginTop: 4 },
  amountInput: { fontSize: 56, fontFamily: fonts.bold, minWidth: 100, textAlign: 'center' },
  amountWords: { fontSize: 12, fontFamily: fonts.medium, marginTop: -10, marginBottom: 40 },

  footer: { padding: 16, borderTopWidth: 1 },
  payBtn: { backgroundColor: PAYTM_BLUE, paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 2 },
  payBtnDisabled: { backgroundColor: '#A0AEC0', elevation: 0 },
  payBtnText: { color: WHITE, fontSize: 16, fontFamily: fonts.bold },
});
