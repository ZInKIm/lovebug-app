import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { HOURLY_ACTIVITY, SEASON_INFO, NAVER_CAFE_URL } from '../data/guide';
import { fetchWeather, calcLovebugSignal } from '../utils/weatherApi';
import { addressToCoords } from '../utils/geocoding';
import KakaoMap from '../components/KakaoMap';

const LEVELS = {
  high: { label: '활발', color: '#E24B4A', bg: '#FCEBEB', icon: 'exclamation-circle' },
  mid:  { label: '보통', color: '#EF9F27', bg: '#FAEEDA', icon: 'minus-circle' },
  low:  { label: '적음', color: '#1D9E75', bg: '#E1F5EE', icon: 'check-circle' },
};

function aggregateByLocation(reports) {
  const map = {};
  reports.forEach(r => {
    if (!r.location) return;
    if (!map[r.location]) map[r.location] = { location: r.location, high: 0, mid: 0, low: 0, total: 0 };
    map[r.location][r.level] = (map[r.location][r.level] || 0) + 1;
    map[r.location].total++;
  });
  return Object.values(map).map(m => {
    const score = (m.high * 3 + m.mid * 2 + m.low * 1) / m.total;
    const level = score >= 2.5 ? 'high' : score >= 1.5 ? 'mid' : 'low';
    return { location: m.location, level, total: m.total, score };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

export default function ForecastScreen() {
  const [signal, setSignal] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  useEffect(() => { loadWeather(); loadReports(); }, []);

  const loadWeather = async () => {
    setLoadingWeather(true);
    const weather = await fetchWeather('서울 은평구');
    setSignal(calcLovebugSignal(weather));
    setLoadingWeather(false);
  };

  const loadReports = async () => {
    setLoadingAreas(true);
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const reports = snap.docs.map(d => d.data());
      const aggregated = aggregateByLocation(reports);
      const withCoords = await Promise.all(
        aggregated.map(async (a) => {
          const coords = await addressToCoords(a.location);
          return { ...a, ...coords };
        })
      );
      setAreas(withCoords);
    } catch (e) {
      console.log('Reports error:', e.message);
    }
    setLoadingAreas(false);
  };

  const sig = signal ? LEVELS[signal.level] : LEVELS['mid'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.signalCard, { backgroundColor: loadingWeather ? '#f1f0ea' : sig.bg }]}>
        {loadingWeather ? (
          <>
            <ActivityIndicator size="small" color="#888780" />
            <View style={{ flex: 1 }}>
              <Text style={styles.signalSmall}>오늘 러브버그 활동</Text>
              <Text style={[styles.signalBig, { color: '#888780' }]}>날씨 불러오는 중...</Text>
            </View>
          </>
        ) : (
          <>
            <FontAwesome name={sig.icon} size={32} color={sig.color} />
            <View style={{ flex: 1 }}>
              <Text style={styles.signalSmall}>오늘 러브버그 활동</Text>
              <Text style={[styles.signalBig, { color: sig.color }]}>{sig.label}</Text>
              <Text style={styles.signalBasis}>{signal?.basis}</Text>
            </View>
            <TouchableOpacity onPress={loadWeather}>
              <FontAwesome name="refresh" size={16} color={sig.color} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>시간대별 활동</Text>
        <Text style={styles.cardSub}>한낮(10–14시)에 가장 활발합니다</Text>
        {HOURLY_ACTIVITY.map((h, i) => {
          const lv = LEVELS[h.level];
          return (
            <View key={i} style={styles.hourRow}>
              <View style={styles.hourTime}>
                <Text style={styles.hourLabel}>{h.time}</Text>
                <Text style={styles.hourRange}>{h.range}</Text>
              </View>
              <View style={[styles.hourDot, { backgroundColor: lv.color }]} />
              <Text style={styles.hourNote}>{h.note}</Text>
              <View style={[styles.hourTag, { backgroundColor: lv.bg }]}>
                <Text style={[styles.hourTagText, { color: lv.color }]}>{lv.label}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>시즌 안내</Text>
        <View style={styles.seasonRow}>
          <FontAwesome name="calendar-o" size={18} color="#0F6E56" />
          <Text style={styles.seasonText}>{SEASON_INFO.estimate}</Text>
        </View>
        <Text style={styles.seasonNote}>{SEASON_INFO.note}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>우리 동네 출몰 강도</Text>
          <TouchableOpacity onPress={loadReports}>
            <FontAwesome name="refresh" size={14} color="#888780" />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardSub}>이웃 신고 기반 · 신고할수록 정확해져요</Text>

        {loadingAreas ? (
          <ActivityIndicator size="small" color="#888780" style={{ marginVertical: 40 }} />
        ) : areas.length === 0 ? (
          <View style={styles.empty}>
            <FontAwesome name="map-marker" size={24} color="#B4B2A9" />
            <Text style={styles.emptyText}>아직 신고가 없어요. 첫 번째로 신고해보세요!</Text>
          </View>
        ) : (
          <>
            <KakaoMap areas={areas} />
            {areas.map((a, i) => {
              const lv = LEVELS[a.level];
              return (
                <View key={i} style={styles.areaRow}>
                  <Text style={styles.areaRank}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.areaName}>{a.location}</Text>
                    <View style={styles.areaBarTrack}>
                      <View style={[styles.areaBarFill, {
                        width: `${Math.round((a.score / 3) * 100)}%`,
                        backgroundColor: lv.color,
                      }]} />
                    </View>
                  </View>
                  <View style={[styles.areaTag, { backgroundColor: lv.bg }]}>
                    <Text style={[styles.areaTagText, { color: lv.color }]}>{lv.label}</Text>
                  </View>
                  <Text style={styles.areaCount}>{a.total}건</Text>
                </View>
              );
            })}
          </>
        )}

        <TouchableOpacity style={styles.cafeBtn} onPress={() => Linking.openURL(NAVER_CAFE_URL)} activeOpacity={0.8}>
          <FontAwesome name="comments" size={14} color="#27500A" />
          <Text style={styles.cafeBtnText}>카페에서 더 많은 정보 보기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <FontAwesome name="info-circle" size={13} color="#888780" />
        <Text style={styles.disclaimerText}>
          활동 신호는 기상청 날씨 기반 추정치입니다. 동네 강도는 사용자 신고 기반이며 신고가 쌓일수록 정확해집니다.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4ee' },
  content: { padding: 16, paddingBottom: 32 },
  signalCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 12, padding: 20, marginBottom: 12 },
  signalSmall: { fontSize: 12, color: '#5f5e5a' },
  signalBig: { fontSize: 28, fontWeight: '600', marginVertical: 2 },
  signalBasis: { fontSize: 12, color: '#888780' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: '#1a1a18' },
  cardSub: { fontSize: 12, color: '#888780', marginTop: 2, marginBottom: 12 },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  hourTime: { width: 64 },
  hourLabel: { fontSize: 13, fontWeight: '500', color: '#1a1a18' },
  hourRange: { fontSize: 11, color: '#888780' },
  hourDot: { width: 8, height: 8, borderRadius: 4 },
  hourNote: { flex: 1, fontSize: 12, color: '#5f5e5a' },
  hourTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  hourTagText: { fontSize: 11, fontWeight: '500' },
  seasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  seasonText: { flex: 1, fontSize: 14, color: '#1a1a18', lineHeight: 20 },
  seasonNote: { fontSize: 12, color: '#888780', lineHeight: 18 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  areaRank: { fontSize: 12, color: '#B4B2A9', width: 16, textAlign: 'center' },
  areaName: { fontSize: 13, color: '#1a1a18', marginBottom: 4 },
  areaBarTrack: { height: 4, backgroundColor: '#f1f0ea', borderRadius: 2 },
  areaBarFill: { height: '100%', borderRadius: 2 },
  areaTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  areaTagText: { fontSize: 11, fontWeight: '500' },
  areaCount: { fontSize: 11, color: '#888780', minWidth: 24, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 12, color: '#888780', textAlign: 'center', lineHeight: 18 },
  cafeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EAF3DE', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, marginTop: 12 },
  cafeBtnText: { fontSize: 12, fontWeight: '500', color: '#27500A' },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, backgroundColor: '#f1f0ea', borderRadius: 8 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#888780', lineHeight: 18 },
});