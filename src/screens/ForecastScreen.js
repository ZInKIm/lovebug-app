import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { FORECAST_DATA } from '../data/guide';

function levelColor(v) {
  if (v > 80) return '#E24B4A';
  if (v > 50) return '#EF9F27';
  return '#1D9E75';
}

export default function ForecastScreen() {
  const { peak, end, dday, weekly, areas } = FORECAST_DATA;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 주간 차트 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>서울 출몰 예보</Text>
          <Text style={styles.cardSub}>최근 7일</Text>
        </View>

        <View style={styles.chart}>
          {weekly.map((d, i) => (
            <View key={i} style={styles.bar}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${d.value}%`, backgroundColor: levelColor(d.value) },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
              <Text style={[styles.barVal, { color: levelColor(d.value) }]}>{d.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statN}>{peak}</Text>
            <Text style={styles.statL}>피크 예상일</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statN}>{end}</Text>
            <Text style={styles.statL}>종료 예상일</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statN, { color: '#E24B4A' }]}>D-{dday}</Text>
            <Text style={styles.statL}>종료까지</Text>
          </View>
        </View>
      </View>

      {/* 지역별 강도 */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>우리 동네 출몰 강도</Text>
          <Text style={styles.cardSub}>사용자 신고 기반</Text>
        </View>
        {areas.map((a, i) => (
          <View key={i} style={styles.areaRow}>
            <Text style={styles.areaName}>{a.name}</Text>
            <View style={styles.areaBarTrack}>
              <View
                style={[
                  styles.areaBarFill,
                  { width: `${a.value}%`, backgroundColor: levelColor(a.value) },
                ]}
              />
            </View>
            <Text style={[styles.areaVal, { color: levelColor(a.value) }]}>{a.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          출몰 지수는 날씨 조건 기반 추정치입니다. 사용자 신고 데이터가 쌓이면 정확도가 높아집니다.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4ee' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: '500', color: '#1a1a18' },
  cardSub: { fontSize: 12, color: '#888780' },
  chart: { flexDirection: 'row', gap: 4, height: 120, alignItems: 'flex-end', marginBottom: 16 },
  bar: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f1f0ea',
    borderRadius: 3,
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: 9, color: '#B4B2A9' },
  barVal: { fontSize: 9, fontWeight: '500' },
  statRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingTop: 12,
    gap: 4,
  },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontSize: 16, fontWeight: '500', color: '#1a1a18' },
  statL: { fontSize: 11, color: '#888780', marginTop: 2 },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  areaName: { fontSize: 13, color: '#1a1a18', width: 120 },
  areaBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f0ea',
    borderRadius: 3,
  },
  areaBarFill: { height: '100%', borderRadius: 3 },
  areaVal: { fontSize: 12, fontWeight: '500', width: 28, textAlign: 'right' },
  disclaimer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f1f0ea',
    borderRadius: 8,
  },
  disclaimerText: { fontSize: 12, color: '#888780', lineHeight: 18 },
});
