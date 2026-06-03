import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const KAKAO_API_KEY = 'd1e3a2569528a532bcf668c2c33acfe6';

const LEVEL_INFO = {
  high: { color: '#E24B4A', label: '심함' },
  mid:  { color: '#EF9F27', label: '보통' },
  low:  { color: '#1D9E75', label: '낮음' },
};

export default function KakaoMap({ areas = [], onSelectArea }) {
  const webViewRef = useRef(null);

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
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    #error {
      position:fixed; top:0; left:0; right:0;
      background:#E24B4A; color:white;
      padding:12px; font-size:11px; line-height:1.5;
      z-index:9999; display:none; word-break:break-all;
    }
  </style>
</head>
<body>
  <div id="error"></div>
  <div id="map"></div>

  <script>
    window.onerror = function(msg, src, line) {
      var el = document.getElementById('error');
      el.style.display = 'block';
      el.innerText = 'JS Error: ' + msg + '\\n' + src + ':' + line;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ERROR:' + msg);
    };
  </script>

  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}"
    onerror="document.getElementById('error').style.display='block'; document.getElementById('error').innerText='SDK 로드 실패 — 도메인 인증 오류'; window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ERROR:SDK load failed');"
  ></script>

  <script>
    try {
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

        var el = document.createElement('div');
        el.innerHTML = shortName + ' ' + m.label +
          ' <span style="opacity:0.85;font-size:10px;">' + m.total + '건</span>';
        el.style.cssText = 'background:' + m.color +
          ';color:white;padding:5px 10px;border-radius:16px;font-size:12px;' +
          'font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.25);white-space:nowrap;cursor:pointer;';

        el.onclick = function() {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(m.location);
        };

        new kakao.maps.CustomOverlay({ map: map, position: pos, yAnchor: 1.8, content: el });
        bounds.extend(pos);
      });

      if (markers.length > 0) map.setBounds(bounds, 80);
    } catch(e) {
      document.getElementById('error').style.display = 'block';
      document.getElementById('error').innerText = 'Map init error: ' + e.message;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ERROR:' + e.message);
    }
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: 'http://localhost' }}
        style={styles.map}
        javaScriptEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        onMessage={(e) => {
          const data = e.nativeEvent.data;
          if (!data.startsWith('ERROR:') && onSelectArea) onSelectArea(data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});