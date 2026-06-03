import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const KAKAO_API_KEY = 'd1e3a2569528a532bcf668c2c33acfe6';

const LEVEL_INFO = {
  high: { color: '#E24B4A', label: '심함' },
  mid:  { color: '#EF9F27', label: '보통' },
  low:  { color: '#1D9E75', label: '낮음' },
};

export default function KakaoMap({ areas = [] }) {
  const markers = areas
    .filter(a => a.latitude && a.longitude)
    .map(a => ({
      lat: a.latitude, lng: a.longitude,
      location: a.location, total: a.total,
      color: LEVEL_INFO[a.level]?.color || '#888780',
      label: LEVEL_INFO[a.level]?.label || '',
    }));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <style>* { margin:0; padding:0; } html,body,#map { width:100%; height:100%; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}"></script>
  <script>
    var map = new kakao.maps.Map(document.getElementById('map'), {
      center: new kakao.maps.LatLng(37.5665, 126.9780), level: 8
    });
    var bounds = new kakao.maps.LatLngBounds();
    var markers = ${JSON.stringify(markers)};

    markers.forEach(function(m) {
      var pos = new kakao.maps.LatLng(m.lat, m.lng);
      new kakao.maps.Circle({
        map: map, center: pos, radius: 600,
        strokeWeight: 2, strokeColor: m.color, strokeOpacity: 0.9,
        fillColor: m.color, fillOpacity: 0.2,
      });
      var shortName = m.location
        .replace('서울특별시 ','').replace('서울 ','')
        .replace('경기도 ','').replace('경기 ','');
      new kakao.maps.CustomOverlay({
        map: map, position: pos, yAnchor: 1.8,
        content: '<div style="background:' + m.color + ';color:white;padding:5px 10px;border-radius:16px;font-size:12px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.25);white-space:nowrap;">'
          + shortName + ' ' + m.label
          + ' <span style="opacity:0.85;font-size:10px;">' + m.total + '건</span></div>'
      });
      bounds.extend(pos);
    });
    if (markers.length > 0) map.setBounds(bounds, 80);
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <WebView source={{ html, baseUrl: 'http://localhost' }}
        style={styles.map} javaScriptEnabled originWhitelist={['*']} mixedContentMode="always" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});