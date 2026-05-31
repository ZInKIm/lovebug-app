import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import ActionCard from '../components/ActionCard';
import { GUIDE_DATA, SEASON_BANNER, NAVER_CAFE_URL } from '../data/guide';

export default function GuideScreen() {
  const bannerColors = {
    safe:   { bg: '#E1F5EE', text: '#085041', icon: 'check-circle' },
    warn:   { bg: '#FAEEDA', text: '#633806', icon: 'exclamation-triangle' },
    danger: { bg: '#FCEBEB', text: '#791F1F', icon: 'exclamation-circle' },
  };
  const banner = bannerColors[SEASON_BANNER.level];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {SEASON_BANNER.active && (
        <View style={[styles.banner, { backgroundColor: banner.bg }]}>
          <FontAwesome name={banner.icon} size={22} color={banner.text} />
          <Text style={[styles.bannerText, { color: banner.text }]}>
            <Text style={{ fontWeight: '600' }}>출몰 주의보</Text>
            {'  '}{SEASON_BANNER.message}
          </Text>
        </View>
      )}

      {GUIDE_DATA.map((section) => (
        <View key={section.id}>
          <Text style={styles.sectionLabel}>{section.section}</Text>
          {section.items.map((item) => (
            <ActionCard key={item.id} item={item} />
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={styles.cafeLink}
        onPress={() => Linking.openURL(NAVER_CAFE_URL)}
        activeOpacity={0.8}
      >
        <View style={styles.cafeIcon}>
          <FontAwesome name="comments" size={20} color="#27500A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cafeLinkTitle}>러브버그 대응 카페</Text>
          <Text style={styles.cafeLinkSub}>이웃들의 퇴치 후기와 실시간 출몰 정보</Text>
        </View>
        <FontAwesome name="external-link" size={14} color="#888780" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4ee' },
  content: { padding: 16, paddingBottom: 32 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888780',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 2,
  },
  cafeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 14,
    marginTop: 16,
  },
  cafeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EAF3DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cafeLinkTitle: { fontSize: 13, fontWeight: '500', color: '#1a1a18' },
  cafeLinkSub: { fontSize: 12, color: '#888780', marginTop: 1 },
});
