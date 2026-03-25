import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { Mic } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, SUCCESS_GREEN, fonts } from '../styles/theme';

interface VoicePayModalProps {
  visible: boolean;
  onClose: () => void;
  pulseAnim: Animated.Value;
}

export const VoicePayModal: React.FC<VoicePayModalProps> = ({ visible, onClose, pulseAnim }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.voiceModal}>
          <View style={s.voiceDragHandle} />
          <Text style={s.voiceTitle}>VoiceGuard Pay</Text>
          <Text style={s.voiceSub}>Triple Secured Transaction</Text>
          <View style={s.voiceCircle}>
            <Animated.View style={[s.voicePulse, { transform: [{ scale: pulseAnim }] }]}>
              <Mic size={56} color={PAYTM_LIGHT_BLUE} />
            </Animated.View>
          </View>
          <Text style={s.voiceHint}>Try: "Pay 500 to Rahul"</Text>
          <TouchableOpacity style={s.voiceClose} onPress={onClose}>
            <Text style={s.voiceCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  voiceModal: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, alignItems: 'center' },
  voiceDragHandle: { width: 40, height: 6, borderRadius: 3, backgroundColor: '#EEE', marginBottom: 24 },
  voiceTitle: { fontSize: 26, fontFamily: fonts.bold, color: '#111' },
  voiceSub: { fontSize: 15, color: SUCCESS_GREEN, fontFamily: fonts.bold, marginTop: 4, marginBottom: 30 },
  voiceCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,186,242,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  voicePulse: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,186,242,0.2)', justifyContent: 'center', alignItems: 'center' },
  voiceHint: { fontSize: 16, color: '#555', fontFamily: fonts.medium, marginBottom: 30 },
  voiceClose: { backgroundColor: '#F0F5FA', width: '100%', borderRadius: 16, padding: 18, alignItems: 'center' },
  voiceCloseText: { fontFamily: fonts.bold, color: PAYTM_BLUE, fontSize: 16 },
});
