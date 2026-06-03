import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, Image, ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { coordsToAddress } from '../utils/geocoding';

const LEVELS = [
  { id: 'low',  label: '낮음', sub: '1~5마리 · 생활 불편 없음',      color: '#1D9E75', bg: '#E1F5EE' },
  { id: 'mid',  label: '보통', sub: '수십 마리 · 옷이나 창문에 붙음', color: '#EF9F27', bg: '#FAEEDA' },
  { id: 'high', label: '심함', sub: '떼로 몰림 · 외출이 꺼려질 정도', color: '#E24B4A', bg: '#FCEBEB' },
];

async function uploadPhoto(uri) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `reports/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.log('Upload error:', e.message);
    return null;
  }
}

export default function ReportScreen() {
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [dong, setDong] = useState('');
  const [level, setLevel] = useState(null);
  const [memo, setMemo] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [done, setDone] = useState(false);

  const fullLocation = [sido, sigungu, dong].filter(Boolean).join(' ');

  const useMyLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 접근 권한이 필요합니다.');
        setLocLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const addr = await coordsToAddress(loc.coords.latitude, loc.coords.longitude);
      if (addr) {
        setSido(addr.sido || '');
        setSigungu(addr.sigungu || '');
        setDong(addr.dong || '');
      } else {
        Alert.alert('오류', '현재 위치를 주소로 변환하지 못했어요.');
      }
    } catch (e) {
      Alert.alert('오류', '위치를 가져오지 못했어요.');
    }
    setLocLoading(false);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const submit = async () => {
    if (!sido || !sigungu) {
      Alert.alert('위치 필요', '현위치 버튼을 눌러 위치를 먼저 가져와주세요.');
      return;
    }
    if (!level) { Alert.alert('출몰 강도를 선택해주세요'); return; }
    setLoading(true);
    try {
      let photoURL = null;
      if (photo) photoURL = await uploadPhoto(photo);
      await addDoc(collection(db, 'reports'), {
        location: fullLocation, level, memo: memo.trim(),
        photoURL, createdAt: serverTimestamp(),
      });
      setDone(true);
      setSido(''); setSigungu(''); setDong('');
      setLevel(null); setMemo(''); setPhoto(null);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      Alert.alert('오류', '신고 접수에 실패했어요.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {done && (
        <View style={styles.successBanner}>
          <FontAwesome name="check-circle" size={18} color="#27500A" />
          <Text style={styles.successText}>신고가 접수됐어요! 지도에 반영됩니다.</Text>
        </View>
      )}

      <View style={styles.card}>
        {/* 위치 — GPS 자동 */}
        <Text style={styles.fieldLabel}>위치</Text>

        <TouchableOpacity style={styles.locBtn} onPress={useMyLocation} disabled={locLoading} activeOpacity={0.8}>
          {locLoading
            ? <ActivityIndicator size="small" color="#0F6E56" />
            : <FontAwesome name="location-arrow" size={15} color="#0F6E56" />
          }
          <Text style={styles.locBtnText}>{locLoading ? '위치 가져오는 중...' : '현위치 가져오기'}</Text>
        </TouchableOpacity>

        {sido ? (
          <View style={styles.locResult}>
            {/* 시/도, 시/군/구 — 고정 표시 */}
            <View style={styles.locFixed}>
              <FontAwesome name="lock" size={11} color="#B4B2A9" />
              <Text style={styles.locFixedText}>{sido} {sigungu}</Text>
              <Text style={styles.locFixedHint}>GPS 인증됨</Text>
            </View>
            {/* 동 — 수정 가능 */}
            <TextInput
              style={styles.dongInput}
              placeholder="동/읍/면 (선택 수정 가능)"
              placeholderTextColor="#B4B2A9"
              value={dong}
              onChangeText={setDong}
            />
            <Text style={styles.locPreview}>📍 {fullLocation}</Text>
          </View>
        ) : (
          <Text style={styles.locHint}>신고 위치 확인을 위해 GPS가 필요해요</Text>
        )}

        {/* 출몰 강도 */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>출몰 강도</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((lv) => (
            <TouchableOpacity key={lv.id}
              style={[styles.levelBtn, level === lv.id && { backgroundColor: lv.bg, borderColor: lv.color }]}
              onPress={() => setLevel(lv.id)} activeOpacity={0.8}>
              <Text style={[styles.levelLabel, level === lv.id && { color: lv.color }]}>{lv.label}</Text>
              <Text style={[styles.levelSub, level === lv.id && { color: lv.color }]}>{lv.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 사진 */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>사진 첨부 (선택)</Text>
        {photo ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="contain" />
            <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
              <FontAwesome name="times-circle" size={22} color="#E24B4A" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.8}>
              <FontAwesome name="camera" size={18} color="#0F6E56" />
              <Text style={styles.photoBtnText}>촬영</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} activeOpacity={0.8}>
              <FontAwesome name="image" size={18} color="#0F6E56" />
              <Text style={styles.photoBtnText}>갤러리</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 메모 */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>메모 (선택)</Text>
        <TextInput style={[styles.input, styles.textarea]}
          placeholder="예: 한강 산책로 근처, 오전부터 많았음"
          placeholderTextColor="#B4B2A9"
          value={memo} onChangeText={setMemo}
          multiline numberOfLines={3} />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!sido || !sigungu || loading) && { opacity: 0.5 }]}
        onPress={submit} disabled={!sido || !sigungu || loading} activeOpacity={0.85}>
        <FontAwesome name="send" size={15} color="#fff" />
        <Text style={styles.submitText}>{loading ? '업로드 중...' : '신고 제출'}</Text>
      </TouchableOpacity>
      <Text style={styles.notice}>신고 내용은 출몰 지도 개선에만 활용됩니다.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4ee' },
  content: { padding: 16, paddingBottom: 32 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAF3DE', borderRadius: 10, padding: 14, marginBottom: 12 },
  successText: { fontSize: 13, color: '#27500A', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', padding: 16, marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: '#888780', fontWeight: '500', marginBottom: 8 },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#0F6E56', backgroundColor: '#E1F5EE' },
  locBtnText: { fontSize: 14, fontWeight: '500', color: '#0F6E56' },
  locHint: { fontSize: 12, color: '#B4B2A9', textAlign: 'center', marginTop: 8 },
  locResult: { marginTop: 10, gap: 8 },
  locFixed: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f4ee', borderRadius: 8, padding: 10 },
  locFixedText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1a1a18' },
  locFixedHint: { fontSize: 11, color: '#1D9E75', fontWeight: '500' },
  dongInput: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 8, padding: 12, fontSize: 14, color: '#1a1a18', backgroundColor: '#fafaf8' },
  locPreview: { fontSize: 12, color: '#0F6E56', fontWeight: '500' },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#fff', alignItems: 'center', gap: 3 },
  levelLabel: { fontSize: 14, fontWeight: '500', color: '#1a1a18' },
  levelSub: { fontSize: 10, color: '#888780', textAlign: 'center' },
  photoRow: { flexDirection: 'row', gap: 8 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 8, borderWidth: 0.5, borderColor: '#0F6E56', backgroundColor: '#E1F5EE' },
  photoBtnText: { fontSize: 14, fontWeight: '500', color: '#0F6E56' },
  photoWrap: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f0ea' },
  photoPreview: { width: '100%', height: 200 },
  photoRemove: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 12 },
  input: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 8, padding: 12, fontSize: 14, color: '#1a1a18', backgroundColor: '#fafaf8' },
  textarea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F6E56', borderRadius: 12, padding: 16, marginBottom: 12 },
  submitText: { fontSize: 15, fontWeight: '500', color: '#fff' },
  notice: { fontSize: 12, color: '#B4B2A9', textAlign: 'center', lineHeight: 18 },
});