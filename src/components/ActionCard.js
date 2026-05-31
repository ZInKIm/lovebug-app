import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function ActionCard({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setOpen(!open)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
          <FontAwesome name={item.icon} size={18} color={item.iconColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>{item.sub}</Text>
        </View>
        <FontAwesome
          name={open ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#888780"
          style={styles.chevron}
        />
      </View>

      {open && (
        <View style={styles.body}>
          {item.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: item.effectBg }]}>
              <Text style={[styles.tagText, { color: item.effectColor }]}>
                {item.effectLabel}
              </Text>
            </View>
            {item.badge && (
              <View style={[styles.tag, { backgroundColor: item.badgeBg }]}>
                <Text style={[styles.tagText, { color: item.badgeColor }]}>
                  {item.badge}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: '#1a1a18' },
  sub: { fontSize: 12, color: '#888780', marginTop: 1 },
  chevron: { marginLeft: 4 },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.07)',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f1f0ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumText: { fontSize: 10, fontWeight: '500', color: '#888780' },
  stepText: { fontSize: 13, color: '#5f5e5a', lineHeight: 19, flex: 1 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: '500' },
});
