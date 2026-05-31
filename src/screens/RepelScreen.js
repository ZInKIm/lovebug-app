import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';

const MODES = [
  { id: 'wave',     label: '날갯짓 교란', icon: 'soundcloud', freq: 200,  type: 'sine' },
  { id: 'predator', label: '천적 울음',   icon: 'twitter',    freq: 800,  type: 'triangle' },
  { id: 'ultra',    label: '초음파',      icon: 'wifi',       freq: 900,  type: 'sawtooth' },
  { id: 'low',      label: '저주파',      icon: 'signal',     freq: 60,   type: 'square' },
];

function generateSineWav(frequency, duration = 2, sampleRate = 44100) {
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    view.setInt16(44 + i * 2, sample * 32767 * 0.5, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

export default function RepelScreen() {
  const [mode, setMode] = useState(MODES[0]);
  const [freq, setFreq] = useState(200);
  const [vol, setVol] = useState(50);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    return () => { stopSound(); };
  }, []);

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {}
  };

  const startSound = async (frequency, volume) => {
    await stopSound();
    try {
      const uri = generateSineWav(frequency);
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { isLooping: true, volume: volume / 100 }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) { console.log('Audio error:', e); }
  };

  const togglePlay = async () => {
    if (playing) { await stopSound(); setPlaying(false); }
    else { await startSound(freq, vol); setPlaying(true); }
  };

  const handleModeSelect = async (m) => {
    setMode(m); setFreq(m.freq);
    if (playing) await startSound(m.freq, vol);
  };

  const handleFreqChange = async (v) => {
    setFreq(v);
    if (playing) await startSound(v, vol);
  };

  const handleVolChange = async (v) => {
    setVol(v);
    if (soundRef.current) {
      try { await soundRef.current.setVolumeAsync(v / 100); } catch (e) {}
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.freqBig}>{Math.round(freq)} Hz</Text>
        <Text style={styles.freqLabel}>{mode.label} 모드</Text>
        <View style={styles.modeGrid}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modeBtn, mode.id === m.id && styles.modeBtnActive]}
              onPress={() => handleModeSelect(m)}
              activeOpacity={0.8}
            >
              <FontAwesome name={m.icon} size={16} color={mode.id === m.id ? '#085041' : '#888780'} />
              <Text style={[styles.modeBtnText, mode.id === m.id && styles.modeBtnTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.ctrlRow}>
          <Text style={styles.ctrlLabel}>주파수</Text>
          <Slider
            style={styles.slider}
            minimumValue={20} maximumValue={1000} step={10} value={freq}
            onSlidingComplete={handleFreqChange}
            onValueChange={(v) => setFreq(v)}
            minimumTrackTintColor="#0F6E56" maximumTrackTintColor="#D3D1C7" thumbTintColor="#0F6E56"
          />
          <Text style={styles.ctrlVal}>{Math.round(freq)} Hz</Text>
        </View>
        <View style={styles.ctrlRow}>
          <Text style={styles.ctrlLabel}>강도</Text>
          <Slider
            style={styles.slider}
            minimumValue={0} maximumValue={100} step={1} value={vol}
            onSlidingComplete={handleVolChange}
            onValueChange={(v) => setVol(v)}
            minimumTrackTintColor="#0F6E56" maximumTrackTintColor="#D3D1C7" thumbTintColor="#0F6E56"
          />
          <Text style={styles.ctrlVal}>{Math.round(vol)}%</Text>
        </View>
        <TouchableOpacity
          style={[styles.playBtn, playing && styles.playBtnOn]}
          onPress={togglePlay} activeOpacity={0.85}
        >
          <FontAwesome name={playing ? 'pause' : 'play'} size={16} color={playing ? '#fff' : '#1a1a18'} />
          <Text style={[styles.playBtnText, playing && styles.playBtnTextOn]}>
            {playing ? '퇴치 중지' : '퇴치 시작'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          과학적 효과가 완전히 검증되지 않은 보조 도구입니다.{'\n'}
          가이드 탭의 물리적 대응법을 함께 사용하세요.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4ee' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', padding: 20,
  },
  freqBig: { fontSize: 36, fontWeight: '500', color: '#0F6E56', textAlign: 'center', marginBottom: 4 },
  freqLabel: { fontSize: 13, color: '#888780', textAlign: 'center', marginBottom: 20 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  modeBtn: {
    flex: 1, minWidth: '22%', paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff', alignItems: 'center', gap: 4,
  },
  modeBtnActive: { borderColor: '#0F6E56', backgroundColor: '#E1F5EE' },
  modeBtnText: { fontSize: 11, color: '#888780', textAlign: 'center' },
  modeBtnTextActive: { color: '#085041', fontWeight: '500' },
  ctrlRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  ctrlLabel: { fontSize: 12, color: '#888780', width: 32 },
  slider: { flex: 1 },
  ctrlVal: { fontSize: 12, fontWeight: '500', color: '#1a1a18', width: 50, textAlign: 'right' },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 10, backgroundColor: '#f1f0ea', marginTop: 8,
  },
  playBtnOn: { backgroundColor: '#0F6E56' },
  playBtnText: { fontSize: 15, fontWeight: '500', color: '#1a1a18' },
  playBtnTextOn: { color: '#fff' },
  disclaimer: { fontSize: 11, color: '#B4B2A9', textAlign: 'center', marginTop: 12, lineHeight: 16 },
});