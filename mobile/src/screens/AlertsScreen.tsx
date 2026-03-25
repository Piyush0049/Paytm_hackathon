import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PAYTM_LIGHT_BLUE, WHITE, fonts } from '../styles/theme';

interface AlertsScreenProps {
  notifications: any[];
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ notifications }) => {
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeader}><Text style={s.pageTitle}>Notifications</Text></View>
      {notifications.map((n, i) => (
        <View key={i} style={[s.notifCard, !n.read && s.notifUnread]}>
          <Text style={s.notifTitle}>{n.title}</Text>
          <Text style={s.notifBody}>{n.body}</Text>
          <Text style={s.notifTime}>{n.time}</Text>
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
  notifCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 12, elevation: 2 },
  notifUnread: { borderLeftWidth: 4, borderLeftColor: PAYTM_LIGHT_BLUE },
  notifTitle: { fontSize: 16, fontFamily: fonts.bold, color: '#111', marginBottom: 4 },
  notifBody: { fontSize: 14, fontFamily: fonts.regular, color: '#555', marginBottom: 10 },
  notifTime: { fontSize: 12, color: '#999', fontFamily: fonts.medium },
});
