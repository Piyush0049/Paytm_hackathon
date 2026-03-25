import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, StatusBar, Image, SafeAreaView } from 'react-native';
import { ShieldCheck, HelpCircle, X } from 'lucide-react-native';
import { PAYTM_BLUE, PAYTM_LIGHT_BLUE, SUCCESS_GREEN, WHITE, fonts } from '../styles/theme';

interface AuthScreenProps {
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authName: string;
  setAuthName: (name: string) => void;
  authPassword: string;
  setAuthPassword: (pass: string) => void;
  authOtp: string;
  setAuthOtp: (otp: string) => void;
  showOtpField: boolean;
  setShowOtpField: (show: boolean) => void;
  authLoading: boolean;
  handleAuth: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authMode, setAuthMode, authEmail, setAuthEmail, authName, setAuthName,
  authPassword, setAuthPassword, authOtp, setAuthOtp, showOtpField, setShowOtpField,
  authLoading, handleAuth
}) => {
  const paytmLogo = require('../../assets/paytm_logo.png');

  return (
    <SafeAreaView style={s.authSafe}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={s.cleanAuthHeader}>
        <Image
          source={paytmLogo}
          style={{ width: 180, height: 100, resizeMode: 'contain' }}
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
            {authLoading ? <ActivityIndicator color={WHITE} /> : (
              <Text style={s.actionBtnTextAuth}>
                {!showOtpField ? 'Proceed Securely' : (authMode === 'login' ? 'Verify & Login' : 'Verify & Claim ₹1,000')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setShowOtpField(false); setAuthOtp(''); }} style={s.switchAuthBtn}>
            <Text style={s.switchAuthText}>{authMode === 'login' ? "New to Paytm? Create an account" : "Already have an account? Login"}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.authTrustBlock}>
          <ShieldCheck size={28} color={SUCCESS_GREEN} />
          <View style={{ marginLeft: 12 }}>
            <Text style={s.trustTitle}>100% Secure & AI Protected</Text>
            <Text style={s.trustSub}>Your voice is your unique security key.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  authSafe: { flex: 1, backgroundColor: WHITE },
  cleanAuthHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, height: 70 },
  authScrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  authWelcomeBlock: { marginBottom: 24 },
  authTitle: { fontSize: 20, fontFamily: fonts.bold, color: '#111' },
  authSub: { fontSize: 13, fontFamily: fonts.regular, color: '#666', marginTop: 2 },
  authFormContainer: { marginBottom: 24 },
  inputContainer: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: '#555', marginBottom: 6, marginLeft: 4 },
  premiumInput: { backgroundColor: '#F9FAFC', borderRadius: 12, padding: 14, fontSize: 14, fontFamily: fonts.medium, color: '#111', borderWidth: 1, borderColor: '#EEE' },
  otpAuthContainer: { alignItems: 'center', marginBottom: 30 },
  otpAuthTitle: { fontSize: 18, fontFamily: fonts.bold, color: '#111' },
  otpAuthSub: { fontSize: 12, fontFamily: fonts.regular, color: '#888', marginTop: 4 },
  otpAuthInput: { backgroundColor: '#F9FAFC', borderRadius: 16, padding: 20, fontSize: 32, fontFamily: fonts.bold, color: PAYTM_BLUE, letterSpacing: 10, textAlign: 'center', width: '90%', marginTop: 20, borderWidth: 2, borderColor: PAYTM_LIGHT_BLUE },
  actionBtnAuth: { backgroundColor: PAYTM_LIGHT_BLUE, borderRadius: 14, padding: 16, alignItems: 'center', elevation: 5, shadowColor: PAYTM_LIGHT_BLUE, shadowOpacity: 0.3, shadowRadius: 10 },
  actionBtnTextAuth: { color: WHITE, fontSize: 15, fontFamily: fonts.bold },
  switchAuthBtn: { marginTop: 16, alignItems: 'center' },
  switchAuthText: { color: PAYTM_BLUE, fontFamily: fonts.semiBold, fontSize: 13 },
  authTrustBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', padding: 16, borderRadius: 16 },
  trustTitle: { fontSize: 14, fontFamily: fonts.bold, color: '#1A531B' },
  trustSub: { fontSize: 11, fontFamily: fonts.regular, color: '#1A531B', opacity: 0.7 },
});
