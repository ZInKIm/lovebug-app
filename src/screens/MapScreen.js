import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, Image, FlatList,
  Pressable, TextInput, ScrollView
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from '../firebase';
import { addressToCoords } from '../utils/geocoding';
import LovebugMap from '../components/LovebugMap';
import { FontAwesome } from '@expo/vector-icons';

function filterByDate(reports, dateFilter) {
  if (dateFilter === 'all') return reports;
  const now = new Date();
  const cutoff = new Date();
  if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0);
  else if (dateFilter === '3days') cutoff.setDate(now.getDate() - 3);
  else if (dateFilter === 'week') cutoff.setDate(now.getDate() - 7);
  return reports.filter(r => {
    const date = r.createdAt?.toDate?.() || new Date(0);
    return date >= cutoff;
  });
}

function aggregateByLocation(reports) {
  const map = {};
  reports.forEach(r => {
    if (!r.location) return;
    if (!map[r.location]) map[r.location] = { location: r.location, high: 0, mid: 0, low: 0, total: 0, reports: [] };
    map[r.location][r.level] = (map[r.location][r.level] || 0) + 1;
    map[r.location].total++;
    map[r.location].reports.push(r);
  });
  return Object.values(map).map(m => {
    const score = (m.high * 3 + m.mid * 2 + m.low * 1) / m.total;
    const level = score >= 2.5 ? 'high' : score >= 1.5 ? 'mid' : 'low';
    return { location: m.location, level, total: m.total, score, reports: m.reports };
  }).sort((a, b) => b.score - a.score);
}

const LEVELS = {
  high: { label: '심함', color: '#E24B4A', bg: '#FCEBEB' },
  mid:  { label: '보통', color: '#EF9F27', bg: '#FAEEDA' },
  low:  { label: '낮음', color: '#1D9E75', bg: '#E1F5EE' },
};

const DATE_FILTERS = [
  { id: 'all',   label: '전체' },
  { id: 'today', label: '오늘' },
  { id: '3days', label: '3일간' },
  { id: 'week',  label: '이번주' },
];

const LEVEL_FILTERS = [
  { id: 'all',  label: '전체' },
  { id: 'high', label: '심함' },
  { id: 'mid',  label: '보통' },
  { id: 'low',  label: '낮음' },
];

export default function MapScreen() {
  const [allReports, setAllReports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [photoViewer, setPhotoViewer] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const reports = snap.docs.map(d => d.data());
      setAllReports(reports);
      const aggregated = aggregateByLocation(reports);
      const withCoords = await Promise.all(
        aggregated.map(async (a) => {
          const coords = await addressToCoords(a.location);
          return { ...a, ...coords };
        })
      );
      setAreas(withCoords);
    } catch (e) { console.log('Map error:', e.message); }
    setLoading(false);
  };

  const getMyLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (e) { console.log('Location error:', e.message); }
    setLocLoading(false);
  };

  const filteredAreas = useMemo(() => {
    const dateFiltered = filterByDate(allReports, dateFilter);
    const aggregated = aggregateByLocation(dateFiltered);
    return aggregated
      .filter(a => levelFilter === 'all' || a.level === levelFilter)
      .filter(a => a.location.includes(search));
  }, [allReports, dateFilter, levelFilter, search]);

  const mapAreas = useMemo(() => {
    return filteredAreas.map(a => {
      const found = areas.find(x => x.location === a.location);
      return found ? { ...a, latitude: found.latitude, longitude: found.longitude } : a;
    });
  }, [filteredAreas, areas]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0F6E56" />
          <Text style={styles.loadingText}>신고 데이터 불러오는 중...</Text>
        </View>
      ) : (
        <>
          <View style={styles.mapWrap}>
            <LovebugMap areas={mapAreas} userLocation={userLocation} onSelectArea={(loc) => {
              const area = filteredAreas.find(a => a.location === loc);
              if (area) setSelected(area);
            }} />
            {/* 현위치 버튼 */}
            <TouchableOpacity style={styles.myLocBtn} onPress={getMyLocation} activeOpacity={0.85}>
              {locLoading
                ? <ActivityIndicator size="small" color="#0F6E56" />
                : <FontAwesome name="location-arrow" size={18} color="#0F6E56" />
              }
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {/* 검색바 */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <FontAwesome name="search" size={13} color="#B4B2A9" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="동네 검색..."
                  placeholderTextColor="#B4B2A9"
                  value={search} onChangeText={setSearch}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <FontAwesome name="times-circle" size={14} color="#B4B2A9" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity onPress={loadReports} style={styles.refreshBtn}>
                <FontAwesome name="refresh" size={14} color="#888780" />
              </TouchableOpacity>
            </View>

            {/* 필터 칩들 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={styles.filterRow} contentContainerStyle={styles.filterContent}>
              {DATE_FILTERS.map(f => (
                <TouchableOpacity key={f.id}
                  style={[styles.filterChip, dateFilter === f.id && styles.filterChipDateActive]}
                  onPress={() => setDateFilter(f.id)} activeOpacity={0.7}>
                  <Text style={[styles.filterText, dateFilter === f.id && styles.filterTextDateActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.filterDivider} />
              {LEVEL_FILTERS.map(f => (
                <TouchableOpacity key={f.id}
                  style={[styles.filterChip, levelFilter === f.id && styles.filterChipActive]}
                  onPress={() => setLevelFilter(f.id)} activeOpacity={0.7}>
                  {f.id !== 'all' && <View style={[styles.filterDot, { backgroundColor: LEVELS[f.id]?.color }]} />}
                  <Text style={[styles.filterText, levelFilter === f.id && styles.filterTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{filteredAreas.length}개 지역</Text>
            </View>

            <ScrollView style={styles.list} nestedScrollEnabled>
              {filteredAreas.length === 0 ? (
                <Text style={styles.emptyText}>해당 기간에 신고가 없어요!</Text>
              ) : (
                filteredAreas.map((a, i) => {
                  const lv = LEVELS[a.level];
                  return (
                    <TouchableOpacity key={i} style={styles.item} onPress={() => setSelected(a)} activeOpacity={0.7}>
                      <Text style={styles.rank}>{i + 1}</Text>
                      <Text style={styles.location}>{a.location}</Text>
                      <View style={[styles.tag, { backgroundColor: lv.bg }]}>
                        <Text style={[styles.tagText, { color: lv.color }]}>{lv.label}</Text>
                      </View>
                      <Text style={styles.count}>{a.total}건</Text>
                      <FontAwesome name="chevron-right" size={10} color="#B4B2A9" />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* 신고 상세 모달 */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selected.location}</Text>
                <Text style={styles.modalSub}>신고 {selected.total}건</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <FontAwesome name="times" size={20} color="#888780" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={selected.reports}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const lv = LEVELS[item.level];
                return (
                  <View style={styles.reportCard}>
                    {item.photoURL && (
                      <TouchableOpacity onPress={() => setPhotoViewer(item.photoURL)} activeOpacity={0.9}>
                        <Image source={{ uri: item.photoURL }} style={styles.reportPhoto} resizeMode="cover" />
                        <View style={styles.photoHint}>
                          <FontAwesome name="expand" size={12} color="white" />
                          <Text style={styles.photoHintText}>탭하여 크게 보기</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    <View style={styles.reportBody}>
                      <View style={[styles.tag, { backgroundColor: lv.bg, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.tagText, { color: lv.color }]}>{lv.label}</Text>
                      </View>
                      {item.memo ? <Text style={styles.reportMemo}>{item.memo}</Text> : null}
                      <Text style={styles.reportTime}>
                        {item.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '날짜 없음'}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}
      </Modal>

      {/* 풀스크린 사진 뷰어 */}
      <Modal visible={!!photoViewer} transparent animationType="fade" onRequestClose={() => setPhotoViewer(null)}>
        <Pressable style={styles.photoViewerBg} onPress={() => setPhotoViewer(null)}>
          <Image source={{ uri: photoViewer }} style={styles.photoViewerImg} resizeMode="contain" />
          <TouchableOpacity style={styles.photoViewerClose} onPress={() => setPhotoViewer(null)}>
            <FontAwesome name="times" size={22} color="white" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4ee' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#888780' },
  mapWrap: { flex: 1, minHeight: 250, position: 'relative' },
  myLocBtn: {
    position: 'absolute', bottom: 16, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  listContainer: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.1)', maxHeight: 300 },
  searchRow: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 6 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f5f4ee', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1a1a18', padding: 0 },
  refreshBtn: { padding: 8, justifyContent: 'center' },
  filterRow: { paddingHorizontal: 12, paddingBottom: 8 },
  filterContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterDivider: { width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 2 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#E1F5EE', borderColor: '#0F6E56' },
  filterChipDateActive: { backgroundColor: '#E6F1FB', borderColor: '#0C447C' },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 12, color: '#888780' },
  filterTextActive: { color: '#0F6E56', fontWeight: '500' },
  filterTextDateActive: { color: '#0C447C', fontWeight: '500' },
  listHeader: { paddingHorizontal: 12, paddingBottom: 4 },
  listTitle: { fontSize: 12, color: '#888780' },
  list: { paddingHorizontal: 12 },
  emptyText: { fontSize: 13, color: '#888780', textAlign: 'center', paddingVertical: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  rank: { fontSize: 12, color: '#B4B2A9', width: 16 },
  location: { flex: 1, fontSize: 13, color: '#1a1a18' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '500' },
  count: { fontSize: 11, color: '#888780' },
  modal: { flex: 1, backgroundColor: '#f5f4ee' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 24, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a18' },
  modalSub: { fontSize: 13, color: '#888780', marginTop: 2 },
  reportCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', marginBottom: 10, overflow: 'hidden' },
  reportPhoto: { width: '100%', height: 180 },
  photoHint: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  photoHintText: { fontSize: 11, color: 'white' },
  reportBody: { padding: 12, gap: 6 },
  reportMemo: { fontSize: 13, color: '#5f5e5a', lineHeight: 18 },
  reportTime: { fontSize: 11, color: '#B4B2A9' },
  photoViewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  photoViewerImg: { width: '100%', height: '100%' },
  photoViewerClose: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
});